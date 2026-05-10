package codelab.api.smart.sae.quiz.dto;

import java.util.List;

public class SubmitAttemptDTO {
    private List<AttemptAnswerDTO> answers;

    public List<AttemptAnswerDTO> getAnswers() { return answers; }
    public void setAnswers(List<AttemptAnswerDTO> answers) { this.answers = answers; }
}
