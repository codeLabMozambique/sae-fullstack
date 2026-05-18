package codelab.api.smart.sae.quiz.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_certificate",
       uniqueConstraints = @UniqueConstraint(columnNames = {"quiz_id", "student_username"}))
public class CertificateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String studentUsername;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(nullable = false)
    private String quizTitulo;

    @Column(length = 30)
    private String disciplina;

    @Column(length = 100)
    private String disciplinaLabel;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStudentUsername() { return studentUsername; }
    public void setStudentUsername(String studentUsername) { this.studentUsername = studentUsername; }
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public String getQuizTitulo() { return quizTitulo; }
    public void setQuizTitulo(String quizTitulo) { this.quizTitulo = quizTitulo; }
    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }
    public String getDisciplinaLabel() { return disciplinaLabel; }
    public void setDisciplinaLabel(String disciplinaLabel) { this.disciplinaLabel = disciplinaLabel; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
}
