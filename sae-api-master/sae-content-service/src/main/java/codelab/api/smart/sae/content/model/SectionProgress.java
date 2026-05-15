package codelab.api.smart.sae.content.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "section_progress")
@CompoundIndex(name = "user_section_idx", def = "{'userId': 1, 'sectionId': 1}", unique = true)
public class SectionProgress {

    @Id
    private String id;

    private String userId;
    private String sectionId;
    private String contentId;

    /** 0–100 */
    private int score = 0;
    private int totalQuestions = 0;
    private int correctAnswers = 0;
    private boolean completed = false;

    /** ID da tentativa de quiz correspondente no quiz-service */
    private Long quizAttemptId;

    private LocalDateTime completedAt;
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Long getQuizAttemptId() { return quizAttemptId; }
    public void setQuizAttemptId(Long quizAttemptId) { this.quizAttemptId = quizAttemptId; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
