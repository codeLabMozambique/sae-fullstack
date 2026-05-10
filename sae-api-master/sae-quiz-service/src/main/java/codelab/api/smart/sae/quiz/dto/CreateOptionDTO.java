package codelab.api.smart.sae.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateOptionDTO {
    @NotBlank
    private String texto;

    @NotBlank
    @Pattern(regexp = "[A-D]")
    private String letra;

    private boolean correta;

    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }
    public boolean isCorreta() { return correta; }
    public void setCorreta(boolean correta) { this.correta = correta; }
}
