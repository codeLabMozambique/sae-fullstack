package codelab.api.smart.sae.quiz.model;

import codelab.api.smart.sae.quiz.enums.DisciplinaEnum;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz")
public class QuizEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisciplinaEnum disciplina;

    private Integer tempoLimiteMinutos;

    @Column(nullable = false)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean active = false;

    /** MongoDB ObjectId do conteúdo da biblioteca (null em quizzes manuais) */
    @Column
    private String contentId;

    @Column
    private Integer startPage;

    @Column
    private Integer endPage;

    @Column
    private boolean aiGenerated = false;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordemNumero ASC")
    private List<QuizQuestionEntity> questions = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public DisciplinaEnum getDisciplina() { return disciplina; }
    public void setDisciplina(DisciplinaEnum disciplina) { this.disciplina = disciplina; }
    public Integer getTempoLimiteMinutos() { return tempoLimiteMinutos; }
    public void setTempoLimiteMinutos(Integer t) { this.tempoLimiteMinutos = t; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<QuizQuestionEntity> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestionEntity> questions) { this.questions = questions; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public Integer getStartPage() { return startPage; }
    public void setStartPage(Integer startPage) { this.startPage = startPage; }
    public Integer getEndPage() { return endPage; }
    public void setEndPage(Integer endPage) { this.endPage = endPage; }
    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }
}
