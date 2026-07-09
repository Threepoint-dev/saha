package com.saha.quote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "quote_line_item")
public class QuoteLineItem {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "quote_id", nullable = false)
    private UUID quoteId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "item_type")
    private String itemType;

    @Column(name = "description")
    private String description;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "is_taxable")
    private Boolean isTaxable;

    @Column(name = "total")
    private BigDecimal total;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
