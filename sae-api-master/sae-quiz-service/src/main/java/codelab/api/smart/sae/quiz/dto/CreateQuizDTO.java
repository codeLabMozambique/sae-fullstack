package codelab.api.smart.sae.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateQuizDTO {
    @NotBlank
    private String titulo;

    private String descricao;

    private String disciplina;

    private Long subjectId;
    private String subjectName;

    private Integer tempoLimiteMinutos;
    private String thumbnailUrl;
    private String thumbnailType;

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public Integer getTempoLimiteMinutos() { return tempoLimiteMinutos; }
    public void setTempoLimiteMinutos(Integer t) { this.tempoLimiteMinutos = t; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getThumbnailType() { return thumbnailType; }
    public void setThumbnailType(String thumbnailType) { this.thumbnailType = thumbnailType; }
}
