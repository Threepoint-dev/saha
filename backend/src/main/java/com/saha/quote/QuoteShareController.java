package com.saha.quote;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class QuoteShareController {

    private final QuoteShareService service;

    public QuoteShareController(QuoteShareService service) {
        this.service = service;
    }

    @PostMapping("/api/tenants/{tenantId}/quotes/{quoteId}/share")
    public ShareLinkResponse share(@PathVariable UUID tenantId, @PathVariable UUID quoteId) {
        return service.share(tenantId, quoteId);
    }

    @GetMapping("/api/public/quotes/{shareToken}")
    public PublicQuoteDto preview(@PathVariable String shareToken) {
        return service.getByShareToken(shareToken);
    }
}
