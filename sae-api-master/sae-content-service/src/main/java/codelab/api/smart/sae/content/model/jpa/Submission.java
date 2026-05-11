package codelab.api.smart.sae.content.model.jpa;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Submissão de um estudante a uma tarefa.
 * Regra: 1 submissão por (assignment, student) — garantida via unique constraint.
 */
@Entity
@Table(
    name = "submissions",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"assignment_id", "student_username"},
        name = "uk_submission_assignment_student"
    )
)
public class Submission {

    public static final String STATE_PENDING = "pendente";
    public static final String STATE_GRADED  = "avaliado";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assignment_id", nullable = false)
    private Long assignmentId;

    /** username (telefone) do estudante. */
    @Column(name = "student_username", nullable = false, length = 64)
    private String studentUsername;

    @Column(name = "student_name", length = 200)
    private String studentName;

    @Column(columnDefinition = "TEXT")
    private String comment;

    /** Nome do ficheiro no MinIO (chave). NULL se não submeteu ficheiro. */
    @Column(name = "file_name", length = 500)
    private String fileName;

    /** Nome original do ficheiro (para mostrar ao utilizador). */
    @Column(name = "file_original_name", length = 500)
    private String fileOriginalName;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    /** Nota atribuída pelo professor. NULL quando ainda não avaliada. */
    @Column(name = "grade")
    private Double grade;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @Column(nullable = false, length = 20)
    private String state;

    public Submission() {
        this.submittedAt = LocalDateTime.now();
        this.state = STATE_PENDING;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }

    public String getStudentUsername() { return studentUsername; }
    public void setStudentUsername(String studentUsername) { this.studentUsername = studentUsername; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileOriginalName() { return fileOriginalName; }
    public void setFileOriginalName(String fileOriginalName) { this.fileOriginalName = fileOriginalName; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public Double getGrade() { return grade; }
    public void setGrade(Double grade) { this.grade = grade; }

    public LocalDateTime getGradedAt() { return gradedAt; }
    public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
