package com.saha.event;

import java.math.BigDecimal;
import java.util.List;

/** Events Director Dashboard (EP-08) — hall load, revenue value, and event request trends. */
public record EventsDirectorDashboardDto(
        int total,
        int confirmedCount,
        BigDecimal confirmedValueSar,
        int tentativeCount,
        int preparedCount,
        int upcomingCount,
        List<HallRevenue> revenueByHall,
        List<SetupTypeCount> requestsBySetupType,
        List<MonthCount> monthlyTrend
) {
    public record HallRevenue(String hallName, BigDecimal valueSar) {}

    public record SetupTypeCount(String setupType, int count) {}

    public record MonthCount(String month, int count) {}
}