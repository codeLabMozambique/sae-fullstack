package codelab.api.smart.sae.quiz.dto;

import java.util.List;

public class QuizResultDTO {
    private Long attemptId;
    private Long quizId;
    private String quizTitulo;
    private int score;
    private int correctAnswers;
    private int totalQuestions;
    private long timeSpentSeconds;
    private List<QuestionResultDTO> questionResults;

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public String getQuizTitulo() { return quizTitulo; }
    public void setQuizTitulo(String quizTitulo) { this.quizTitulo = quizTitulo; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public long getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(long timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public List<QuestionResultDTO> getQuestionResults() { return questionResults; }
    public void setQuestionResults(List<QuestionResultDTO> questionResults) { this.questionResults = questionResults; }
}
