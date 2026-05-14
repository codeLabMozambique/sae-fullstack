package codelab.api.smart.sae.content.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "content_sections")
public class ContentSection {

    @Id
    private String id;

    @Indexed
    private String contentId;

    private String sectionName;

    /** 1, 2 ou 3 (null se não for divisão trimestral) */
    private Integer trimester;

    private Integer startPage;
    private Integer endPage;
    private Integer position;

    /** ID do quiz gerado por IA para esta secção (null se ainda não gerado) */
    private Long quizId;

    private LocalDateTime createdAt = LocalDateTime.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }
    public Integer getTrimester() { return trimester; }
    public void setTrimester(Integer trimester) { this.trimester = trimester; }
    public Integer getStartPage() { return startPage; }
    public void setStartPage(Integer startPage) { this.startPage = startPage; }
    public Integer getEndPage() { return endPage; }
    public void setEndPage(Integer endPage) { this.endPage = endPage; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
