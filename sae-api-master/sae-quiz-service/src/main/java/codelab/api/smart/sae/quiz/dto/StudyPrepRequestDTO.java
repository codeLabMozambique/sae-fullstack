package codelab.api.smart.sae.quiz.dto;

public class StudyPrepRequestDTO {
    /** GERAL, MATEMATICA, FISICA, etc. */
    private String disciplina;
    /** TEST = preparação para teste normal | EXAM = preparação para exame final */
    private String mode;
    /** ID do conteúdo (livro) principal da disciplina, opcional */
    private String contentId;
    /** Número de questões a gerar (padrão: 10) */
    private Integer numQuestions;
    /** Perguntas e respostas do fórum da disciplina para enriquecer as questões geradas */
    private String forumContext;

    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    public Integer getNumQuestions() { return numQuestions; }
    public void setNumQuestions(Integer numQuestions) { this.numQuestions = numQuestions; }
    public String getForumContext() { return forumContext; }
    public void setForumContext(String forumContext) { this.forumContext = forumContext; }
}
