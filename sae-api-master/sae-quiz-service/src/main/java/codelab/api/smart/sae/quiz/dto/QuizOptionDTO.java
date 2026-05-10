package codelab.api.smart.sae.quiz.dto;

public class QuizOptionDTO {
    private Long id;
    private String texto;
    private String letra;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }
}
