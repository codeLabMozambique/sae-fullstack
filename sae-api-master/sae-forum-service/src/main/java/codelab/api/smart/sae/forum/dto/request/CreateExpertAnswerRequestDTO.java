package codelab.api.smart.sae.forum.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateExpertAnswerRequestDTO {

    @NotBlank(message = "Conteúdo da resposta é obrigatório")
    private String conteudo;

    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }
}
