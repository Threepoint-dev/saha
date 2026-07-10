package com.saha.export;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Minimal RFC-4180 CSV writer used by the export endpoints (EP-10). Reads-only:
 * it never touches the database, it only serialises rows the service has already
 * fetched.
 *
 * <p>The output is prefixed with a UTF-8 byte-order mark so Microsoft Excel opens
 * the file with the correct encoding (Arabic client names, SAR figures, etc.).
 */
public final class CsvSupport {

    /** UTF-8 BOM — makes Excel detect the encoding instead of falling back to a code page. */
    private static final String BOM = "﻿";

    private CsvSupport() {
    }

    public static byte[] toCsv(List<String> headers, List<List<Object>> rows) {
        StringBuilder sb = new StringBuilder(BOM);
        writeRow(sb, headers.stream().map(h -> (Object) h).toList());
        for (List<Object> row : rows) {
            writeRow(sb, row);
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static void writeRow(StringBuilder sb, List<Object> cells) {
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(escape(format(cells.get(i))));
        }
        sb.append("\r\n");
    }

    /** Renders a raw JDBC value into a stable, spreadsheet-friendly string. */
    private static String format(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof BigDecimal bd) {
            return bd.toPlainString();
        }
        if (value instanceof LocalDate d) {
            return d.toString();
        }
        if (value instanceof OffsetDateTime dt) {
            return dt.toString();
        }
        return value.toString();
    }

    /** Quotes a field when it contains a comma, quote, or line break; doubles inner quotes. */
    private static String escape(String field) {
        boolean mustQuote = field.contains(",") || field.contains("\"")
                || field.contains("\n") || field.contains("\r");
        if (!mustQuote) {
            return field;
        }
        return "\"" + field.replace("\"", "\"\"") + "\"";
    }
}
