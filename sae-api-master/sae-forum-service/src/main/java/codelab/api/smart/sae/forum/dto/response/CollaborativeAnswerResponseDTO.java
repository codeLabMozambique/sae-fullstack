package codelab.api.smart.sae.forum.dto.response;

import codelab.api.smart.sae.forum.enums.ValidationStatus;
import codelab.api.smart.sae.forum.model.CollaborativeAnswerEntity;
import java.time.LocalDateTime;

public class CollaborativeAnswerResponseDTO {

    private Long id;
    private String conteudo;
    private Long questionId;
    private String answeredBy;
    private ValidationStatus validationStatus;
    private String validatedBy;
    private LocalDateTime validatedAt;
    private String rejectedBy;
    private LocalDateTime rejectedAt;
    private LocalDateTime createdAt;

    public static CollaborativeAnswerResponseDTO from(CollaborativeAnswerEntity e) {
        CollaborativeAnswerResponseDTO dto = new CollaborativeAnswerResponseDTO();
        dto.id = e.getId();
        dto.conteudo = e.getConteudo();
        dto.questionId = e.getQuestionId();
        dto.answeredBy = e.getAnsweredBy();
        dto.validationStatus = e.getValidationStatus();
        dto.validatedBy = e.getValidatedBy();
        dto.validatedAt = e.getValidatedAt();
        dto.rejectedBy = e.getRejectedBy();
        dto.rejectedAt = e.getRejectedAt();
        dto.createdAt = e.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getConteudo() { return conteudo; }
    public Long getQuestionId() { return questionId; }
    public String getAnsweredBy() { return answeredBy; }
    public ValidationStatus getValidationStatus() { return validationStatus; }
    public String getValidatedBy() { return validatedBy; }
    public LocalDateTime getValidatedAt() { return validatedAt; }
    public String getRejectedBy() { return rejectedBy; }
    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
