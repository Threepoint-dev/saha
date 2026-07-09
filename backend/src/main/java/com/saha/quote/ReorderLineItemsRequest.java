package com.saha.quote;

import java.util.List;
import java.util.UUID;

public record ReorderLineItemsRequest(
        List<UUID> orderedIds
) {
}
