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

    @NotNull(message = "Disciplina é obrigatória")
    private codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina;

    private QuestionType questionType;

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public codelab.api.smart.sae.forum.enums.DisciplinaEnum getDisciplina() { return disciplina; }
    public void setDisciplina(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina) { this.disciplina = disciplina; }

    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }
}
