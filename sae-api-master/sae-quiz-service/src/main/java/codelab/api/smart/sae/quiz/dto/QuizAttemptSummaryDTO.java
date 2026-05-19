package codelab.api.smart.sae.quiz.dto;

import java.time.LocalDateTime;

public class QuizAttemptSummaryDTO {

    private Long attemptId;
    private Long quizId;
    private String quizTitle;
    private String studentUsername;
    private LocalDateTime submittedAt;
    private Integer score;
    private Integer totalQuestions;

    public QuizAttemptSummaryDTO() {}

    public QuizAttemptSummaryDTO(Long attemptId, Long quizId, String quizTitle,
                                  String studentUsername, LocalDateTime submittedAt,
                                  Integer score, Integer totalQuestions) {
        this.attemptId = attemptId;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.studentUsername = studentUsername;
        this.submittedAt = submittedAt;
        this.score = score;
        this.totalQuestions = totalQuestions;
    }

    public Long getAttemptId()           { return attemptId; }
    public Long getQuizId()              { return quizId; }
    public String getQuizTitle()         { return quizTitle; }
    public String getStudentUsername()   { return studentUsername; }
    public LocalDateTime getSubmittedAt(){ return submittedAt; }
    public Integer getScore()            { return score; }
    public Integer getTotalQuestions()   { return totalQuestions; }

    public void setAttemptId(Long attemptId)               { this.attemptId = attemptId; }
    public void setQuizId(Long quizId)                     { this.quizId = quizId; }
    public void setQuizTitle(String quizTitle)             { this.quizTitle = quizTitle; }
    public void setStudentUsername(String studentUsername)  { this.studentUsername = studentUsername; }
    public void setSubmittedAt(LocalDateTime submittedAt)  { this.submittedAt = submittedAt; }
    public void setScore(Integer score)                    { this.score = score; }
    public void setTotalQuestions(Integer totalQuestions)  { this.totalQuestions = totalQuestions; }
}
