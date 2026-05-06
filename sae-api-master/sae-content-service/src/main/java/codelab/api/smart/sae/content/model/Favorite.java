package codelab.api.smart.sae.content.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "favorites")
@CompoundIndexes({
    @CompoundIndex(name = "user_content_fav_uniq", def = "{'user_id': 1, 'content_id': 1}", unique = true)
})
public class Favorite {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    @Field("content_id")
    private String contentId;

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;

    public Favorite() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
