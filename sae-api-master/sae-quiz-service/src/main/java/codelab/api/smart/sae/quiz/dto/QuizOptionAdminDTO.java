package codelab.api.smart.sae.quiz.dto;

public class QuizOptionAdminDTO {
    private Long id;
    private String texto;
    private String letra;
    private boolean correta;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }
    public boolean isCorreta() { return correta; }
    public void setCorreta(boolean correta) { this.correta = correta; }
}
