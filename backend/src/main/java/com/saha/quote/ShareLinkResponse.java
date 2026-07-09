package com.saha.quote;

public record ShareLinkResponse(
        String shareToken,
        String shareUrl
) {
}
