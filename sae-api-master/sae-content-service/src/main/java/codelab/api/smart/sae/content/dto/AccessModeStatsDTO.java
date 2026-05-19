package codelab.api.smart.sae.content.dto;

public class AccessModeStatsDTO {
    private long onlineCount;
    private long offlineCount;
    private long totalCount;
    private double offlinePercentage;

    public long getOnlineCount() { return onlineCount; }
    public void setOnlineCount(long onlineCount) { this.onlineCount = onlineCount; }

    public long getOfflineCount() { return offlineCount; }
    public void setOfflineCount(long offlineCount) { this.offlineCount = offlineCount; }

    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }

    public double getOfflinePercentage() { return offlinePercentage; }
    public void setOfflinePercentage(double offlinePercentage) { this.offlinePercentage = offlinePercentage; }
}
