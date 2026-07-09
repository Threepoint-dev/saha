package com.saha.export;

import java.util.List;

/**
 * Data-quality snapshot for a tenant (EP-10). {@code score} is the percentage of
 * setup checks that passed; {@code issues} lists each failed check; {@code summary}
 * gives the raw counts the UI renders as cards.
 */
public record DataQualityReport(int score, List<Issue> issues, Summary summary) {

    public record Issue(String entity, String field, String issue, long count) {
    }

    public record Summary(
            boolean hotelsComplete,
            long hallsCount,
            long packagesCount,
            long addonsCount,
            long sourceChannelsCount,
            boolean quoteSettingsConfigured) {
    }
}
