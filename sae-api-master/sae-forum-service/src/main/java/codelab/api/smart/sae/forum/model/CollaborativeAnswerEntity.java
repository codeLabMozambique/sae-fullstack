package codelab.api.smart.sae.forum.model;

import codelab.api.smart.sae.forum.enums.ValidationStatus;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "COLLABORATIVE_ANSWER",
    indexes = {
        @Index(name = "idx_collab_answer_question", columnList = "question_id"),
        @Index(name = "idx_collab_answer_status",   columnList = "validation_status")
    }
)
public class CollaborativeAnswerEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CONTEUDO", nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "QUESTION_ID", nullable = false)
    private Long questionId;

    @Column(name = "ANSWERED_BY", nullable = false, length = 100)
    private String answeredBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "VALIDATION_STATUS", nullable = false)
    private ValidationStatus validationStatus = ValidationStatus.PENDENTE;

    @Column(name = "VALIDATED_BY", length = 100)
    private String validatedBy;

    @Column(name = "VALIDATED_AT")
    private LocalDateTime validatedAt;

    @Column(name = "REJECTED_BY", length = 100)
    private String rejectedBy;

    @Column(name = "REJECTED_AT")
    private LocalDateTime rejectedAt;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public String getAnsweredBy() { return answeredBy; }
    public void setAnsweredBy(String answeredBy) { this.answeredBy = answeredBy; }

    public ValidationStatus getValidationStatus() { return validationStatus; }
    public void setValidationStatus(ValidationStatus validationStatus) { this.validationStatus = validationStatus; }

    public String getValidatedBy() { return validatedBy; }
    public void setValidatedBy(String validatedBy) { this.validatedBy = validatedBy; }

    public LocalDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(LocalDateTime validatedAt) { this.validatedAt = validatedAt; }

    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }

    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
