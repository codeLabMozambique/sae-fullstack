package codelab.api.smart.sae.forum.dto.response;

import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;

import java.time.LocalDateTime;
import java.util.List;

public class QuestionResponseDTO {

    private Long id;
    private String titulo;
    private String descricao;
    private String tags;
    private String area;
    private QuestionType questionType;
    private QuestionStatus status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ExpertAnswerResponseDTO> expertAnswers;
    private List<CollaborativeAnswerResponseDTO> collaborativeAnswers;

    public static QuestionResponseDTO from(ForumQuestionEntity e) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        dto.id = e.getId();
        dto.titulo = e.getTitulo();
        dto.descricao = e.getDescricao();
        dto.tags = e.getTags();
        dto.area = e.getArea();
        dto.questionType = e.getQuestionType();
        dto.status = e.getStatus();
        dto.createdBy = e.getCreatedBy();
        dto.createdAt = e.getCreatedAt();
        dto.updatedAt = e.getUpdatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public String getTags() { return tags; }
    public String getArea() { return area; }
    public QuestionType getQuestionType() { return questionType; }
    public QuestionStatus getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<ExpertAnswerResponseDTO> getExpertAnswers() { return expertAnswers; }
    public void setExpertAnswers(List<ExpertAnswerResponseDTO> expertAnswers) { this.expertAnswers = expertAnswers; }

    public List<CollaborativeAnswerResponseDTO> getCollaborativeAnswers() { return collaborativeAnswers; }
    public void setCollaborativeAnswers(List<CollaborativeAnswerResponseDTO> collaborativeAnswers) { this.collaborativeAnswers = collaborativeAnswers; }
}
