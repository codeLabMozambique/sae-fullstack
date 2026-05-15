package codelab.api.smart.sae.quiz.dto;

public class OralResponseDTO {
    private Long questionId;
    private String transcription;

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public String getTranscription() { return transcription; }
    public void setTranscription(String transcription) { this.transcription = transcription; }
}
