package codelab.api.smart.sae.quiz.dto;

import java.util.List;

public class QuizQuestionAdminDTO {
    private Long id;
    private String enunciado;
    private int ordemNumero;
    private List<QuizOptionAdminDTO> options;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEnunciado() { return enunciado; }
    public void setEnunciado(String enunciado) { this.enunciado = enunciado; }
    public int getOrdemNumero() { return ordemNumero; }
    public void setOrdemNumero(int ordemNumero) { this.ordemNumero = ordemNumero; }
    public List<QuizOptionAdminDTO> getOptions() { return options; }
    public void setOptions(List<QuizOptionAdminDTO> options) { this.options = options; }
}
