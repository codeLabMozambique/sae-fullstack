package codelab.api.smart.sae.quiz.dto;

public class GenerateFromContentDTO {
    private String contentId;
    private String disciplina;
    private Integer startPage;
    private Integer endPage;
    private Integer numQuestions;
    private Integer tempoLimiteMinutos;
    private String sectionName;
    private String sectionId;

    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public Integer getStartPage() { return startPage; }
    public void setStartPage(Integer startPage) { this.startPage = startPage; }
    public Integer getEndPage() { return endPage; }
    public void setEndPage(Integer endPage) { this.endPage = endPage; }
    public Integer getNumQuestions() { return numQuestions; }
    public void setNumQuestions(Integer numQuestions) { this.numQuestions = numQuestions; }
    public Integer getTempoLimiteMinutos() { return tempoLimiteMinutos; }
    public void setTempoLimiteMinutos(Integer tempoLimiteMinutos) { this.tempoLimiteMinutos = tempoLimiteMinutos; }
    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }
    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }
}
