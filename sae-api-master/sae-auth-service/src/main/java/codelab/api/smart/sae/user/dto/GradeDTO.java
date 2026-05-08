package codelab.api.smart.sae.user.dto;

import java.time.LocalDateTime;

public class GradeDTO {
    private Long id;
    private Long studentId;
    private Long classroomId;
    private Long subjectId;
    private String period;
    private Float score;
    private Long gradedBy;
    private LocalDateTime updatedAt;

    public GradeDTO() {}

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
