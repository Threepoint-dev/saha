package com.saha.quote;

import com.saha.tenant.HotelTenant;
import com.saha.tenant.HotelTenantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class QuoteShareService {

    private final QuoteRepository quoteRepository;
    private final QuoteLineItemRepository lineItemRepository;
    private final HotelTenantRepository tenantRepository;
    private final InquiryRepository inquiryRepository;

    public QuoteShareService(QuoteRepository quoteRepository,
                             QuoteLineItemRepository lineItemRepository,
                             HotelTenantRepository tenantRepository,
                             InquiryRepository inquiryRepository) {
        this.quoteRepository = quoteRepository;
        this.lineItemRepository = lineItemRepository;
        this.tenantRepository = tenantRepository;
        this.inquiryRepository = inquiryRepository;
    }

    @Transactional
    public ShareLinkResponse share(UUID tenantId, UUID quoteId) {
        Quote quote = quoteRepository.findByIdAndTenantId(quoteId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quote not found"));

        String token = quote.getShareLink();
        if (token == null || token.isBlank()) {
            token = UUID.randomUUID().toString().replace("-", "");
            quote.setShareLink(token);
            quote.setUpdatedAt(OffsetDateTime.now());
            quoteRepository.save(quote);
        }
        return new ShareLinkResponse(token, "/quotes/preview/" + token);
    }

    @Transactional(readOnly = true)
    public PublicQuoteDto getByShareToken(String shareToken) {
        Quote quote = quoteRepository.findByShareLink(shareToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quote not found"));

        List<QuoteLineItemDto> items = lineItemRepository.findAllByQuoteIdOrderBySortOrderAsc(quote.getId())
                .stream()
                .map(QuoteLineItemDto::from)
                .toList();

        HotelTenant tenant = tenantRepository.findById(quote.getTenantId()).orElse(null);
        PublicQuoteDto.Hotel hotel = tenant == null ? null : new PublicQuoteDto.Hotel(
                tenant.getName(),
                tenant.getLogoUrl(),
                tenant.getCity(),
                tenant.getDistrict(),
                tenant.getPhone(),
                tenant.getQuoteFooterText(),
                tenant.getTermsNotes()
        );

        Inquiry inquiry = inquiryRepository.findById(quote.getInquiryId()).orElse(null);
        PublicQuoteDto.Client client = inquiry == null ? null : new PublicQuoteDto.Client(
                inquiry.getClientName(),
                inquiry.getEventDate(),
                inquiry.getGuestCount()
        );

        return new PublicQuoteDto(
                quote.getQuoteNumber(),
                quote.getStatus(),
                quote.getSubtotal(),
                quote.getVatAmount(),
                quote.getVatRate(),
                quote.getTotal(),
                quote.getIssuedDate(),
                quote.getValidUntil(),
                quote.getNotes(),
                items,
                hotel,
                client
        );
    }
}
