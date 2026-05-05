package codelab.api.smart.sae.forum.dto.request;

import codelab.api.smart.sae.forum.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateQuestionRequestDTO {

    @NotBlank(message = "Título é obrigatório")
    @Size(max = 200, message = "Título não pode exceder 200 caracteres")
    private String titulo;

    @NotBlank(message = "Descrição é obrigatória")
    private String descricao;

    @Size(max = 500, message = "Tags não podem exceder 500 caracteres")
    private String tags;

    private QuestionType questionType;

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }
}
