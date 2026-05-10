package codelab.api.smart.sae.quiz.model;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_option")
public class QuizOptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestionEntity question;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String texto;

    @Column(length = 1, nullable = false)
    private String letra;

    private boolean correta = false;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QuizQuestionEntity getQuestion() { return question; }
    public void setQuestion(QuizQuestionEntity question) { this.question = question; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }
    public boolean isCorreta() { return correta; }
    public void setCorreta(boolean correta) { this.correta = correta; }
}
