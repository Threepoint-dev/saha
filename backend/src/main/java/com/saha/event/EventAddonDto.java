package com.saha.event;

import com.saha.setup.Addon;

import java.math.BigDecimal;
import java.util.UUID;

public record EventAddonDto(
        UUID id,
        UUID eventSetupId,
        UUID addonId,
        Integer quantity,
        String addonName,
        BigDecimal unitPrice,
        Boolean isTaxable,
        BigDecimal lineTotal
) {
    public static EventAddonDto from(EventAddon ea, Addon addon) {
        int qty = ea.getQuantity() != null ? ea.getQuantity() : 0;
        BigDecimal price = addon != null && addon.getPrice() != null ? addon.getPrice() : BigDecimal.ZERO;
        return new EventAddonDto(
                ea.getId(),
                ea.getEventSetupId(),
                ea.getAddonId(),
                ea.getQuantity(),
                addon != null ? addon.getName() : null,
                addon != null ? addon.getPrice() : null,
                addon != null ? addon.getIsTaxable() : null,
                price.multiply(BigDecimal.valueOf(qty))
        );
    }
}
