package codelab.api.smart.sae.content.dto;

import java.time.LocalDateTime;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.ReadingProgress;

public class ReadingProgressView {

    private String id;
    private String userId;
    private String contentId;
    private String contentTitle;
    private String thumbnailUrl;
    private Integer currentPage;
    private Integer totalPages;
    private Double percentageComplete;
    private Long totalReadingTimeSeconds;
    private LocalDateTime lastReadAt;

    public ReadingProgressView() {}

    public static ReadingProgressView of(ReadingProgress p, Content c) {
        ReadingProgressView v = new ReadingProgressView();
        v.id = p.getId();
        v.userId = p.getUserId();
        v.contentId = p.getContentId();
        v.currentPage = p.getCurrentPage();
        v.totalPages = p.getTotalPages();
        v.percentageComplete = p.getPercentageComplete();
        v.totalReadingTimeSeconds = p.getTotalReadingTimeSeconds();
        v.lastReadAt = p.getLastReadAt();
        if (c != null) {
            v.contentTitle = c.getTitle();
            v.thumbnailUrl = c.getThumbnailUrl();
        }
        return v;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public String getContentTitle() { return contentTitle; }
    public void setContentTitle(String contentTitle) { this.contentTitle = contentTitle; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public Integer getCurrentPage() { return currentPage; }
    public void setCurrentPage(Integer currentPage) { this.currentPage = currentPage; }
    public Integer getTotalPages() { return totalPages; }
    public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    public Double getPercentageComplete() { return percentageComplete; }
    public void setPercentageComplete(Double percentageComplete) { this.percentageComplete = percentageComplete; }
    public Long getTotalReadingTimeSeconds() { return totalReadingTimeSeconds; }
    public void setTotalReadingTimeSeconds(Long totalReadingTimeSeconds) { this.totalReadingTimeSeconds = totalReadingTimeSeconds; }
    public LocalDateTime getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(LocalDateTime lastReadAt) { this.lastReadAt = lastReadAt; }
}
