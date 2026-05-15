package codelab.api.smart.sae.quiz.dto;

public class OralTestRequestDTO {
    private String disciplina;
    private Integer numQuestions;
    private String contentId;
    private String level;

    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public Integer getNumQuestions() { return numQuestions; }
    public void setNumQuestions(Integer numQuestions) { this.numQuestions = numQuestions; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
}
