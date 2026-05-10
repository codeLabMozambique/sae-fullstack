package codelab.api.smart.sae.quiz.dto;

public class QuestionResultDTO {
    private Long questionId;
    private String enunciado;
    private Long selectedOptionId;
    private String selectedOptionLetra;
    private String selectedOptionTexto;
    private Long correctOptionId;
    private String correctOptionLetra;
    private String correctOptionTexto;
    private boolean correct;

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public String getEnunciado() { return enunciado; }
    public void setEnunciado(String enunciado) { this.enunciado = enunciado; }
    public Long getSelectedOptionId() { return selectedOptionId; }
    public void setSelectedOptionId(Long selectedOptionId) { this.selectedOptionId = selectedOptionId; }
    public String getSelectedOptionLetra() { return selectedOptionLetra; }
    public void setSelectedOptionLetra(String selectedOptionLetra) { this.selectedOptionLetra = selectedOptionLetra; }
    public String getSelectedOptionTexto() { return selectedOptionTexto; }
    public void setSelectedOptionTexto(String selectedOptionTexto) { this.selectedOptionTexto = selectedOptionTexto; }
    public Long getCorrectOptionId() { return correctOptionId; }
    public void setCorrectOptionId(Long correctOptionId) { this.correctOptionId = correctOptionId; }
    public String getCorrectOptionLetra() { return correctOptionLetra; }
    public void setCorrectOptionLetra(String correctOptionLetra) { this.correctOptionLetra = correctOptionLetra; }
    public String getCorrectOptionTexto() { return correctOptionTexto; }
    public void setCorrectOptionTexto(String correctOptionTexto) { this.correctOptionTexto = correctOptionTexto; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
}
