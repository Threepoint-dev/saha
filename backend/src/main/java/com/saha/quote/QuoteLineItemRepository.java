package com.saha.quote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuoteLineItemRepository extends JpaRepository<QuoteLineItem, UUID> {

    List<QuoteLineItem> findAllByQuoteIdOrderBySortOrderAsc(UUID quoteId);

    Optional<QuoteLineItem> findByIdAndQuoteId(UUID id, UUID quoteId);
}
