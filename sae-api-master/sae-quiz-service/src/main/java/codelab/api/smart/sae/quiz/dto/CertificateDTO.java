package codelab.api.smart.sae.quiz.dto;

import java.time.LocalDateTime;

public class CertificateDTO {
    private Long id;
    private Long quizId;
    private String quizTitulo;
    private String disciplina;
    private String disciplinaLabel;
    private Integer score;
    private LocalDateTime issuedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public String getQuizTitulo() { return quizTitulo; }
    public void setQuizTitulo(String quizTitulo) { this.quizTitulo = quizTitulo; }
    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public String getDisciplinaLabel() { return disciplinaLabel; }
    public void setDisciplinaLabel(String disciplinaLabel) { this.disciplinaLabel = disciplinaLabel; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
}
