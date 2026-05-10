package codelab.api.smart.sae.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateQuizDTO {
    @NotBlank
    private String titulo;

    private String descricao;

    @NotBlank
    private String disciplina;

    private Integer tempoLimiteMinutos;

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public Integer getTempoLimiteMinutos() { return tempoLimiteMinutos; }
    public void setTempoLimiteMinutos(Integer t) { this.tempoLimiteMinutos = t; }
}
