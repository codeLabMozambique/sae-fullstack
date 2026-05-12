package codelab.api.smart.sae.forum.dto.request;

import codelab.api.smart.sae.forum.enums.ForumScope;
import codelab.api.smart.sae.forum.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateQuestionRequestDTO {

    @NotBlank(message = "Título é obrigatório")
    @Size(max = 200, message = "Título não pode exceder 200 caracteres")
    private String titulo;

    @NotBlank(message = "Descrição é obrigatória")
    private String descricao;

    // ── Âmbito: TURMA ou DISCIPLINA ───────────────────────────────────────────
    private ForumScope forumScope = ForumScope.DISCIPLINA;

    // ── Disciplina via ac_subject (novo) ─────────────────────────────────────
    private Long subjectId;

    // ── Turma e escola (apenas para TURMA) ───────────────────────────────────
    private Long classroomId;
    private Long schoolId;

    // ── @Mention (opcional) ──────────────────────────────────────────────────
    private String mentionedProfessorUsername;

    // ── Legado: DisciplinaEnum (compatibilidade com clientes antigos) ─────────
    private codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina;

    private QuestionType questionType;

    // Getters / Setters
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public ForumScope getForumScope() { return forumScope != null ? forumScope : ForumScope.DISCIPLINA; }
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
}
