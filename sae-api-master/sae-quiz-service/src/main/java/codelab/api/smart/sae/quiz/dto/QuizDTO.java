package codelab.api.smart.sae.quiz.dto;

import java.util.List;

public class QuizDTO {
    private Long id;
    private String titulo;
    private String descricao;
    private String disciplina;
    private String disciplinaLabel;
    private Integer tempoLimiteMinutos;
    private List<QuizQuestionDTO> questions;

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
    public Integer getTempoLimiteMinutos() { return tempoLimiteMinutos; }
    public void setTempoLimiteMinutos(Integer t) { this.tempoLimiteMinutos = t; }
    public List<QuizQuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestionDTO> questions) { this.questions = questions; }
}
