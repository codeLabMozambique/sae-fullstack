package codelab.api.smart.sae.quiz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CreateQuestionDTO {
    @NotBlank
    private String enunciado;

    @NotEmpty
    @Valid
    private List<CreateOptionDTO> options;

    public String getEnunciado() { return enunciado; }
    public void setEnunciado(String enunciado) { this.enunciado = enunciado; }
    public List<CreateOptionDTO> getOptions() { return options; }
    public void setOptions(List<CreateOptionDTO> options) { this.options = options; }
}
