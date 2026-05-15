package codelab.api.smart.sae.quiz.dto;

public class OralQuestionFeedbackDTO {
    private Long questionId;
    private String topic;
    private String transcription;
    private int score;
    private String feedback;
    private String improvedVersion;

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getTranscription() { return transcription; }
    public void setTranscription(String transcription) { this.transcription = transcription; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getImprovedVersion() { return improvedVersion; }
    public void setImprovedVersion(String improvedVersion) { this.improvedVersion = improvedVersion; }
}
