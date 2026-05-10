package codelab.api.smart.sae.quiz.dto;

public class StartAttemptResponseDTO {
    private Long attemptId;
    private QuizDTO quiz;

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    public QuizDTO getQuiz() { return quiz; }
    public void setQuiz(QuizDTO quiz) { this.quiz = quiz; }
}
