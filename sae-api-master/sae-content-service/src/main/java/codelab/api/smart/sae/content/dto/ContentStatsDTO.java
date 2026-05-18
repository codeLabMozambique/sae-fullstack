package codelab.api.smart.sae.content.dto;

public class ContentStatsDTO {

    private String contentId;
    private String contentTitle;
    private String discipline;
    private long accessCount;
    private int uniqueUsers;
    private long totalReadingTimeSeconds;

    public ContentStatsDTO() {}

    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }

    public String getContentTitle() { return contentTitle; }
    public void setContentTitle(String contentTitle) { this.contentTitle = contentTitle; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public long getAccessCount() { return accessCount; }
    public void setAccessCount(long accessCount) { this.accessCount = accessCount; }

    public int getUniqueUsers() { return uniqueUsers; }
    public void setUniqueUsers(int uniqueUsers) { this.uniqueUsers = uniqueUsers; }

    public long getTotalReadingTimeSeconds() { return totalReadingTimeSeconds; }
    public void setTotalReadingTimeSeconds(long totalReadingTimeSeconds) {
        this.totalReadingTimeSeconds = totalReadingTimeSeconds;
    }
}
