package codelab.api.smart.sae.quiz.model;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_attempt_answer")
public class QuizAttemptAnswerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttemptEntity attempt;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "selected_option_id")
    private Long selectedOptionId;

    private boolean correct = false;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QuizAttemptEntity getAttempt() { return attempt; }
    public void setAttempt(QuizAttemptEntity attempt) { this.attempt = attempt; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Long getSelectedOptionId() { return selectedOptionId; }
    public void setSelectedOptionId(Long selectedOptionId) { this.selectedOptionId = selectedOptionId; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
}
