package com.saha.quote;

import com.saha.setup.QuoteSettings;
import com.saha.setup.QuoteSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class QuoteService {

    static final String STATUS_DRAFT = "draft";
    static final String STATUS_CANCELLED = "cancelled";

    private static final BigDecimal DEFAULT_VAT_RATE = new BigDecimal("15");
    private static final int DEFAULT_VALIDITY_DAYS = 7;
    private static final String DEFAULT_PREFIX = "QT";

    private final QuoteRepository quoteRepository;
    private final QuoteLineItemRepository lineItemRepository;
    private final QuoteSettingsRepository settingsRepository;

    public QuoteService(QuoteRepository quoteRepository,
                        QuoteLineItemRepository lineItemRepository,
                        QuoteSettingsRepository settingsRepository) {
        this.quoteRepository = quoteRepository;
        this.lineItemRepository = lineItemRepository;
        this.settingsRepository = settingsRepository;
    }

    @Transactional(readOnly = true)
    public List<QuoteDto> list(UUID tenantId, UUID inquiryId) {
        return quoteRepository.findAllByTenantIdAndInquiryIdOrderByCreatedAtDesc(tenantId, inquiryId)
                .stream()
                .map(QuoteDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuoteDto get(UUID tenantId, UUID quoteId) {
        Quote quote = requireOwned(tenantId, quoteId);
        return QuoteDto.from(quote, loadItems(quote.getId()));
    }

    @Transactional
    public QuoteDto create(UUID tenantId, UUID inquiryId, CreateQuoteRequest request) {
        QuoteSettings settings = settingsRepository.findByTenantId(tenantId).orElse(null);
        BigDecimal vatRate = settings != null && settings.getVatRate() != null
                ? settings.getVatRate() : DEFAULT_VAT_RATE;
        int validityDays = settings != null && settings.getValidityDays() != null
                ? settings.getValidityDays() : DEFAULT_VALIDITY_DAYS;
        String prefix = settings != null && settings.getQuotePrefix() != null && !settings.getQuotePrefix().isBlank()
                ? settings.getQuotePrefix() : DEFAULT_PREFIX;

        // Any previous quotes for this inquiry are no longer the current version.
        clearCurrentFlag(tenantId, inquiryId);

        LocalDate today = LocalDate.now();
        OffsetDateTime now = OffsetDateTime.now();

        Quote quote = new Quote();
        quote.setId(UUID.randomUUID());
        quote.setTenantId(tenantId);
        quote.setInquiryId(inquiryId);
        quote.setQuoteNumber(nextQuoteNumber(tenantId, prefix));
        quote.setStatus(STATUS_DRAFT);
        quote.setSubtotal(BigDecimal.ZERO);
        quote.setVatAmount(BigDecimal.ZERO);
        quote.setVatRate(vatRate);
        quote.setTotal(BigDecimal.ZERO);
        quote.setIssuedDate(today);
        quote.setValidUntil(today.plusDays(validityDays));
        quote.setNotes(request != null ? request.notes() : null);
        quote.setIsCurrent(Boolean.TRUE);
        quote.setCreatedAt(now);
        quote.setUpdatedAt(now);
        quoteRepository.save(quote);
        return QuoteDto.from(quote, List.of());
    }

    @Transactional
    public QuoteDto update(UUID tenantId, UUID quoteId, UpdateQuoteRequest request) {
        Quote quote = requireOwned(tenantId, quoteId);
        if (request.notes() != null) {
            quote.setNotes(request.notes());
        }
        if (request.status() != null && !request.status().isBlank()) {
            quote.setStatus(request.status());
        }
        quote.setUpdatedAt(OffsetDateTime.now());
        quoteRepository.save(quote);
        return QuoteDto.from(quote, loadItems(quote.getId()));
    }

    @Transactional
    public void cancel(UUID tenantId, UUID quoteId) {
        Quote quote = requireOwned(tenantId, quoteId);
        quote.setStatus(STATUS_CANCELLED);
        quote.setIsCurrent(Boolean.FALSE);
        quote.setUpdatedAt(OffsetDateTime.now());
        quoteRepository.save(quote);
    }

    @Transactional
    public QuoteDto duplicate(UUID tenantId, UUID quoteId) {
        Quote source = requireOwned(tenantId, quoteId);
        QuoteSettings settings = settingsRepository.findByTenantId(tenantId).orElse(null);
        String prefix = settings != null && settings.getQuotePrefix() != null && !settings.getQuotePrefix().isBlank()
                ? settings.getQuotePrefix() : DEFAULT_PREFIX;
        int validityDays = settings != null && settings.getValidityDays() != null
                ? settings.getValidityDays() : DEFAULT_VALIDITY_DAYS;

        clearCurrentFlag(tenantId, source.getInquiryId());

        LocalDate today = LocalDate.now();
        OffsetDateTime now = OffsetDateTime.now();

        Quote copy = new Quote();
        copy.setId(UUID.randomUUID());
        copy.setTenantId(tenantId);
        copy.setInquiryId(source.getInquiryId());
        copy.setQuoteNumber(nextQuoteNumber(tenantId, prefix));
        copy.setStatus(STATUS_DRAFT);
        copy.setSubtotal(source.getSubtotal());
        copy.setVatAmount(source.getVatAmount());
        copy.setVatRate(source.getVatRate());
        copy.setTotal(source.getTotal());
        copy.setIssuedDate(today);
        copy.setValidUntil(today.plusDays(validityDays));
        copy.setNotes(source.getNotes());
        copy.setIsCurrent(Boolean.TRUE);
        copy.setCreatedAt(now);
        copy.setUpdatedAt(now);
        quoteRepository.save(copy);

        for (QuoteLineItem item : lineItemRepository.findAllByQuoteIdOrderBySortOrderAsc(source.getId())) {
            QuoteLineItem clone = new QuoteLineItem();
            clone.setId(UUID.randomUUID());
            clone.setQuoteId(copy.getId());
            clone.setItemName(item.getItemName());
            clone.setItemType(item.getItemType());
            clone.setDescription(item.getDescription());
            clone.setQuantity(item.getQuantity());
            clone.setUnitPrice(item.getUnitPrice());
            clone.setIsTaxable(item.getIsTaxable());
            clone.setTotal(item.getTotal());
            clone.setSortOrder(item.getSortOrder());
            lineItemRepository.save(clone);
        }

        recalculateTotals(copy);
        return QuoteDto.from(copy, loadItems(copy.getId()));
    }

    /**
     * Recomputes subtotal, VAT and total from the current line items and the
     * quote's VAT rate, persisting the quote. Callable from the line item service.
     */
    @Transactional
    public void recalculateTotals(Quote quote) {
        List<QuoteLineItem> items = lineItemRepository.findAllByQuoteIdOrderBySortOrderAsc(quote.getId());
        BigDecimal rate = quote.getVatRate() != null ? quote.getVatRate() : DEFAULT_VAT_RATE;

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal vatAmount = BigDecimal.ZERO;
        for (QuoteLineItem item : items) {
            BigDecimal lineTotal = lineTotal(item);
            subtotal = subtotal.add(lineTotal);
            if (Boolean.TRUE.equals(item.getIsTaxable())) {
                vatAmount = vatAmount.add(lineTotal.multiply(rate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP));
            }
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        vatAmount = vatAmount.setScale(2, RoundingMode.HALF_UP);

        quote.setSubtotal(subtotal);
        quote.setVatAmount(vatAmount);
        quote.setTotal(subtotal.add(vatAmount));
        quote.setUpdatedAt(OffsetDateTime.now());
        quoteRepository.save(quote);
    }

    Quote requireOwned(UUID tenantId, UUID quoteId) {
        return quoteRepository.findByIdAndTenantId(quoteId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quote not found"));
    }

    private List<QuoteLineItemDto> loadItems(UUID quoteId) {
        return lineItemRepository.findAllByQuoteIdOrderBySortOrderAsc(quoteId)
                .stream()
                .map(QuoteLineItemDto::from)
                .toList();
    }

    private void clearCurrentFlag(UUID tenantId, UUID inquiryId) {
        List<Quote> existing = quoteRepository.findAllByTenantIdAndInquiryId(tenantId, inquiryId);
        for (Quote q : existing) {
            if (Boolean.TRUE.equals(q.getIsCurrent())) {
                q.setIsCurrent(Boolean.FALSE);
                q.setUpdatedAt(OffsetDateTime.now());
                quoteRepository.save(q);
            }
        }
    }

    private String nextQuoteNumber(UUID tenantId, String prefix) {
        long sequence = quoteRepository.countByTenantId(tenantId) + 1;
        return String.format("%s-%04d", prefix, sequence);
    }

    static BigDecimal lineTotal(QuoteLineItem item) {
        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
        BigDecimal unit = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
        return unit.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
    }
}
