package codelab.api.smart.sae.quiz.dto;

import java.util.List;

public class OralTestEvaluateDTO {
    private Long quizId;
    private List<OralResponseDTO> responses;

    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public List<OralResponseDTO> getResponses() { return responses; }
    public void setResponses(List<OralResponseDTO> responses) { this.responses = responses; }
}
