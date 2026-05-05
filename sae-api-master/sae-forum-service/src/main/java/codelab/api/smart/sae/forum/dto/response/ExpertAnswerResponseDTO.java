package codelab.api.smart.sae.forum.dto.response;

import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import java.time.LocalDateTime;

public class ExpertAnswerResponseDTO {

    private Long id;
    private String conteudo;
    private Long questionId;
    private String answeredBy;
    private Boolean accepted;
    private LocalDateTime createdAt;

    public static ExpertAnswerResponseDTO from(ExpertAnswerEntity e) {
        ExpertAnswerResponseDTO dto = new ExpertAnswerResponseDTO();
        dto.id = e.getId();
        dto.conteudo = e.getConteudo();
        dto.questionId = e.getQuestionId();
        dto.answeredBy = e.getAnsweredBy();
        dto.accepted = e.getAccepted();
        dto.createdAt = e.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getConteudo() { return conteudo; }
    public Long getQuestionId() { return questionId; }
    public String getAnsweredBy() { return answeredBy; }
    public Boolean getAccepted() { return accepted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
