package codelab.api.smart.sae.content.model.jpa;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Sugestão de leitura: o professor escolhe um livro da biblioteca e
 * sugere a uma turma a leitura de um intervalo de páginas (ou capítulos),
 * acompanhado de uma nota explicativa.
 *
 * Quando o aluno abre a sugestão, o leitor PDF abre exactamente em `startPage`.
 */
@Entity
@Table(name = "reading_suggestions", indexes = {
    @Index(name = "idx_rs_classroom", columnList = "classroom_id"),
    @Index(name = "idx_rs_professor", columnList = "professor_username"),
})
public class ReadingSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID do Content (Mongo) da biblioteca. */
    @Column(name = "content_id", nullable = false, length = 64)
    private String contentId;

    /** Para múltiplas turmas, cria-se uma sugestão por turma (mais simples e indexável). */
    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "professor_username", nullable = false, length = 64)
    private String professorUsername;

    @Column(name = "professor_name", length = 200)
    private String professorName;

    /** Título do livro no momento da sugestão (snapshot, evita JOIN). */
    @Column(name = "content_title", length = 300)
    private String contentTitle;

    /** Nota do professor a justificar / contextualizar a leitura. */
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "start_page")
    private Integer startPage;

    @Column(name = "end_page")
    private Integer endPage;

    /** Texto livre alternativo: "Capítulo 3", "Cap. 5-7", "Anexo A". */
    @Column(name = "chapter_range", length = 200)
    private String chapterRange;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ReadingSuggestion() { this.createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }
    public String getProfessorUsername() { return professorUsername; }
    public void setProfessorUsername(String professorUsername) { this.professorUsername = professorUsername; }
    public String getProfessorName() { return professorName; }
    public void setProfessorName(String professorName) { this.professorName = professorName; }
    public String getContentTitle() { return contentTitle; }
    public void setContentTitle(String contentTitle) { this.contentTitle = contentTitle; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Integer getStartPage() { return startPage; }
    public void setStartPage(Integer startPage) { this.startPage = startPage; }
    public Integer getEndPage() { return endPage; }
    public void setEndPage(Integer endPage) { this.endPage = endPage; }
    public String getChapterRange() { return chapterRange; }
    public void setChapterRange(String chapterRange) { this.chapterRange = chapterRange; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
