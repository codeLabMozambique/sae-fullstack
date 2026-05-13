package codelab.api.smart.sae.forum.model;

import codelab.api.smart.sae.forum.enums.DisciplinaEnumConverter;
import codelab.api.smart.sae.forum.enums.ForumScope;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "FORUM_QUESTION",
    indexes = {
        @Index(name = "idx_question_area",       columnList = "AREA"),
        @Index(name = "idx_question_status",     columnList = "status"),
        @Index(name = "idx_question_type",       columnList = "questionType"),
        @Index(name = "idx_question_subject",    columnList = "subject_id"),
        @Index(name = "idx_question_classroom",  columnList = "classroom_id")
    }
)
public class ForumQuestionEntity implements Serializable {

    private static final long serialVersionUID = 2L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TITULO", nullable = false, length = 200)
    private String titulo;

    @Column(name = "DESCRICAO", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "TAGS", length = 500)
    private String tags;

    // ── Âmbito do fórum (novo) ───────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "FORUM_SCOPE", length = 20)
    private ForumScope forumScope = ForumScope.DISCIPLINA;

    // ── Disciplina via ac_subject (novo — substitui DisciplinaEnum) ──────────
    @Column(name = "SUBJECT_ID")
    private Long subjectId;

    // ── Turma e escola (populados apenas quando forumScope = TURMA) ──────────
    @Column(name = "CLASSROOM_ID")
    private Long classroomId;

    @Column(name = "SCHOOL_ID")
    private Long schoolId;

    // ── @Mention: professor mencionado no fórum da turma ────────────────────
    @Column(name = "MENTIONED_PROFESSOR_USERNAME", length = 100)
    private String mentionedProfessorUsername;

    // ── Campo legado (mantido para compatibilidade com dados existentes) ──────
    @Convert(converter = DisciplinaEnumConverter.class)
    @Column(name = "AREA", length = 100)
    private codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina;

    @Enumerated(EnumType.STRING)
    @Column(name = "QUESTION_TYPE", nullable = false)
    private QuestionType questionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private QuestionStatus status = QuestionStatus.ABERTA;

    @Column(name = "CREATED_BY", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public ForumScope getForumScope() { return forumScope; }
    public void setForumScope(ForumScope forumScope) { this.forumScope = forumScope; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getMentionedProfessorUsername() { return mentionedProfessorUsername; }
    public void setMentionedProfessorUsername(String mentionedProfessorUsername) { this.mentionedProfessorUsername = mentionedProfessorUsername; }

    public codelab.api.smart.sae.forum.enums.DisciplinaEnum getDisciplina() { return disciplina; }
    public void setDisciplina(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina) { this.disciplina = disciplina; }

    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }

    public QuestionStatus getStatus() { return status; }
    public void setStatus(QuestionStatus status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
