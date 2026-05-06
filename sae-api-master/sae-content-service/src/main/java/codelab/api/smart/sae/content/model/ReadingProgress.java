package codelab.api.smart.sae.content.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "reading_progress")
@CompoundIndexes({
    @CompoundIndex(name = "user_content_uniq", def = "{'user_id': 1, 'content_id': 1}", unique = true)
})
public class ReadingProgress {

    @Id
    private String id;

    @Indexed
    @Field("user_id")
    private String userId;

    @Field("content_id")
    private String contentId;

    @Field("current_page")
    private Integer currentPage;

    @Field("total_pages")
    private Integer totalPages;

    @Field("percentage_complete")
    private Double percentageComplete;

    @Field("total_reading_time_seconds")
    private Long totalReadingTimeSeconds;

    @Field("last_read_at")
    private LocalDateTime lastReadAt;

    @Field("created_at")
    private LocalDateTime createdAt;

    public ReadingProgress() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
