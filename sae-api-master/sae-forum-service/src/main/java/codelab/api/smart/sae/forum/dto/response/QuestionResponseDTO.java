package codelab.api.smart.sae.forum.dto.response;

import codelab.api.smart.sae.forum.enums.ForumScope;
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

    // ── Novo modelo ──────────────────────────────────────────────────────────
    private ForumScope forumScope;
    private Long subjectId;
    private Long classroomId;
    private Long schoolId;
    private String mentionedProfessorUsername;

    // ── Legado ───────────────────────────────────────────────────────────────
    private codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina;

    private QuestionType questionType;
    private QuestionStatus status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ExpertAnswerResponseDTO> expertAnswers;
    private List<CollaborativeAnswerResponseDTO> collaborativeAnswers;
    private Long responseTimeMinutes;

    public static QuestionResponseDTO from(ForumQuestionEntity e) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        dto.id          = e.getId();
        dto.titulo      = e.getTitulo();
        dto.descricao   = e.getDescricao();
        dto.tags        = e.getTags();
        dto.forumScope  = e.getForumScope();
        dto.subjectId   = e.getSubjectId();
        dto.classroomId = e.getClassroomId();
        dto.schoolId    = e.getSchoolId();
        dto.mentionedProfessorUsername = e.getMentionedProfessorUsername();
        dto.disciplina  = e.getDisciplina();
        dto.questionType = e.getQuestionType();
        dto.status      = e.getStatus();
        dto.createdBy   = e.getCreatedBy();
        dto.createdAt   = e.getCreatedAt();
        dto.updatedAt   = e.getUpdatedAt();
        return dto;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public String getTags() { return tags; }
    public ForumScope getForumScope() { return forumScope; }
    public Long getSubjectId() { return subjectId; }
    public Long getClassroomId() { return classroomId; }
    public Long getSchoolId() { return schoolId; }
    public String getMentionedProfessorUsername() { return mentionedProfessorUsername; }
    public codelab.api.smart.sae.forum.enums.DisciplinaEnum getDisciplina() { return disciplina; }
    public QuestionType getQuestionType() { return questionType; }
    public QuestionStatus getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<ExpertAnswerResponseDTO> getExpertAnswers() { return expertAnswers; }
    public void setExpertAnswers(List<ExpertAnswerResponseDTO> v) { this.expertAnswers = v; }

    public List<CollaborativeAnswerResponseDTO> getCollaborativeAnswers() { return collaborativeAnswers; }
    public void setCollaborativeAnswers(List<CollaborativeAnswerResponseDTO> v) { this.collaborativeAnswers = v; }

    public Long getResponseTimeMinutes() { return responseTimeMinutes; }
    public void setResponseTimeMinutes(Long v) { this.responseTimeMinutes = v; }
}
