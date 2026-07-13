package com.saha.quote;

import com.saha.model.Quote;
import com.saha.model.QuoteLineItem;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class QuoteLineItemService {

    private final QuoteLineItemRepository repository;
    private final QuoteService quoteService;

    public QuoteLineItemService(QuoteLineItemRepository repository, QuoteService quoteService) {
        this.repository = repository;
        this.quoteService = quoteService;
    }

    @Transactional(readOnly = true)
    public List<QuoteLineItemDto> list(UUID tenantId, UUID quoteId) {
        quoteService.requireOwned(tenantId, quoteId);
        return repository.findAllByQuoteIdOrderBySortOrderAsc(quoteId)
                .stream()
                .map(QuoteLineItemDto::from)
                .toList();
    }

    @Transactional
    public QuoteLineItemDto add(UUID tenantId, UUID quoteId, LineItemRequest request) {
        Quote quote = quoteService.requireOwned(tenantId, quoteId);

        QuoteLineItem item = new QuoteLineItem();
        item.setId(UUID.randomUUID());
        item.setQuoteId(quoteId);
        applyRequest(item, request);
        if (item.getSortOrder() == null) {
            item.setSortOrder(nextSortOrder(quoteId));
        }
        item.setTotal(QuoteService.lineTotal(item));
        repository.save(item);

        quoteService.recalculateTotals(quote);
        return QuoteLineItemDto.from(item);
    }

    @Transactional
    public QuoteLineItemDto update(UUID tenantId, UUID quoteId, UUID itemId, LineItemRequest request) {
        Quote quote = quoteService.requireOwned(tenantId, quoteId);
        QuoteLineItem item = requireOwned(quoteId, itemId);
        applyRequest(item, request);
        item.setTotal(QuoteService.lineTotal(item));
        repository.save(item);

        quoteService.recalculateTotals(quote);
        return QuoteLineItemDto.from(item);
    }

    @Transactional
    public void delete(UUID tenantId, UUID quoteId, UUID itemId) {
        Quote quote = quoteService.requireOwned(tenantId, quoteId);
        QuoteLineItem item = requireOwned(quoteId, itemId);
        repository.delete(item);
        quoteService.recalculateTotals(quote);
    }

    @Transactional
    public List<QuoteLineItemDto> reorder(UUID tenantId, UUID quoteId, ReorderLineItemsRequest request) {
        quoteService.requireOwned(tenantId, quoteId);
        if (request != null && request.orderedIds() != null) {
            int order = 0;
            for (UUID id : request.orderedIds()) {
                QuoteLineItem item = repository.findByIdAndQuoteId(id, quoteId).orElse(null);
                if (item != null) {
                    item.setSortOrder(order++);
                    repository.save(item);
                }
            }
        }
        return repository.findAllByQuoteIdOrderBySortOrderAsc(quoteId)
                .stream()
                .map(QuoteLineItemDto::from)
                .toList();
    }

    private QuoteLineItem requireOwned(UUID quoteId, UUID itemId) {
        return repository.findByIdAndQuoteId(itemId, quoteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Line item not found"));
    }

    private void applyRequest(QuoteLineItem item, LineItemRequest request) {
        item.setItemName(request.itemName());
        item.setItemType(request.itemType() != null ? request.itemType() : "custom");
        item.setDescription(request.description());
        item.setQuantity(request.quantity() != null ? request.quantity() : 1);
        item.setUnitPrice(request.unitPrice() != null ? request.unitPrice() : BigDecimal.ZERO);
        item.setIsTaxable(request.isTaxable() != null ? request.isTaxable() : Boolean.TRUE);
        if (request.sortOrder() != null) {
            item.setSortOrder(request.sortOrder());
        }
    }

    private int nextSortOrder(UUID quoteId) {
        return repository.findAllByQuoteIdOrderBySortOrderAsc(quoteId).stream()
                .map(QuoteLineItem::getSortOrder)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .map(max -> max + 1)
                .orElse(0);
    }
}
