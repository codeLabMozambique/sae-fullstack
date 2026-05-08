package codelab.api.smart.sae.content.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "attachments")
public class Attachment {

    @Id
    private String id;

    @Field("file_name")
    private String fileName;

    @Field("original_name")
    private String originalName;

    @Field("content_type")
    private String contentType;

    @Field("size")
    private long size;

    @Indexed
    @Field("uploaded_by")
    private String uploadedBy;

    @Indexed
    @Field("context")
    private String context;

    @Field("context_id")
    private String contextId;

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;

    public Attachment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }

    public String getContextId() { return contextId; }
    public void setContextId(String contextId) { this.contextId = contextId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
