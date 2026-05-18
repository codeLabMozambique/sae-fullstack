package codelab.api.smart.sae.quiz.dto;

import java.time.LocalDateTime;

public class QuizSummaryDTO {
    private Long id;
    private String titulo;
    private String descricao;
    private String disciplina;
    private String disciplinaLabel;
    private Long subjectId;
    private String subjectName;
    private int questionCount;
    private Integer tempoLimiteMinutos;
    private boolean active;
    private String createdBy;
    private LocalDateTime createdAt;
    private int myAttempts;
    private Integer bestScore;
    private String contentId;
    private Integer startPage;
    private Integer endPage;
    private boolean aiGenerated;
    private String sectionId;
    private String quizType;
    private String thumbnailUrl;
    private String thumbnailType;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public String getDisciplinaLabel() { return disciplinaLabel; }
    public void setDisciplinaLabel(String disciplinaLabel) { this.disciplinaLabel = disciplinaLabel; }
    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
    public Integer getTempoLimiteMinutos() { return tempoLimiteMinutos; }
    public void setTempoLimiteMinutos(Integer t) { this.tempoLimiteMinutos = t; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public int getMyAttempts() { return myAttempts; }
    public void setMyAttempts(int myAttempts) { this.myAttempts = myAttempts; }
    public Integer getBestScore() { return bestScore; }
    public void setBestScore(Integer bestScore) { this.bestScore = bestScore; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public Integer getStartPage() { return startPage; }
    public void setStartPage(Integer startPage) { this.startPage = startPage; }
    public Integer getEndPage() { return endPage; }
    public void setEndPage(Integer endPage) { this.endPage = endPage; }
    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }
    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }
    public String getQuizType() { return quizType; }
    public void setQuizType(String quizType) { this.quizType = quizType; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getThumbnailType() { return thumbnailType; }
    public void setThumbnailType(String thumbnailType) { this.thumbnailType = thumbnailType; }
}
