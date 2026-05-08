package codelab.api.smart.sae.forum.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateCollaborativeAnswerRequestDTO {

    @NotBlank(message = "Conteúdo da resposta é obrigatório")
    private String conteudo;

    private String attachmentId;

    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }

    public String getAttachmentId() { return attachmentId; }
    public void setAttachmentId(String attachmentId) { this.attachmentId = attachmentId; }
}
