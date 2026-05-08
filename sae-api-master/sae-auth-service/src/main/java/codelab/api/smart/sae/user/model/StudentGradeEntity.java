package codelab.api.smart.sae.user.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "STUDENT_GRADE",
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "classroom_id", "subject_id", "period"}))
public class StudentGradeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "subject_id", nullable = false)
    private Long subjectId;

    @Column(name = "period", nullable = false, length = 10)
    private String period;

    @Column(name = "score")
    private Float score;

    @Column(name = "graded_by")
    private Long gradedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public Float getScore() { return score; }
    public void setScore(Float score) { this.score = score; }

    public Long getGradedBy() { return gradedBy; }
    public void setGradedBy(Long gradedBy) { this.gradedBy = gradedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
