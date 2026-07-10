package com.saha.quote;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tenants/{tenantId}/quotes/{quoteId}/line-items")
public class QuoteLineItemController {

    private final QuoteLineItemService service;

    public QuoteLineItemController(QuoteLineItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<QuoteLineItemDto> list(@PathVariable UUID tenantId, @PathVariable UUID quoteId) {
        return service.list(tenantId, quoteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuoteLineItemDto add(@PathVariable UUID tenantId, @PathVariable UUID quoteId,
                                @Valid @RequestBody LineItemRequest request) {
        return service.add(tenantId, quoteId, request);
    }

    @PutMapping("/{itemId}")
    public QuoteLineItemDto update(@PathVariable UUID tenantId, @PathVariable UUID quoteId,
                                   @PathVariable UUID itemId, @Valid @RequestBody LineItemRequest request) {
        return service.update(tenantId, quoteId, itemId, request);
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID tenantId, @PathVariable UUID quoteId, @PathVariable UUID itemId) {
        service.delete(tenantId, quoteId, itemId);
    }

    @PutMapping("/reorder")
    public List<QuoteLineItemDto> reorder(@PathVariable UUID tenantId, @PathVariable UUID quoteId,
                                          @RequestBody ReorderLineItemsRequest request) {
        return service.reorder(tenantId, quoteId, request);
    }
}
