package codelab.api.smart.sae.user.model;

import java.time.LocalDateTime;

import codelab.api.smart.sae.framework.jpa.UpdatableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ST_ENROLLMENT")
public class StudentEnrollmentEntity extends UpdatableEntity {

    private static final long serialVersionUID = 1L;

    @Column(name = "STUDENT_ID", nullable = false)
    private Long studentId;

    @Column(name = "SCHOOL_ID")
    private Long schoolId;

    @Column(name = "CLASSROOM_ID")
    private Long classroomId;

    @Column(name = "YEAR", nullable = false)
    private Integer year;

    @Column(name = "ENROLLMENT_CODE", unique = true, length = 20)
    private String enrollmentCode;

    @Column(name = "ENROLLED_AT")
    private LocalDateTime enrolledAt;

    public StudentEnrollmentEntity() {}

    public Long getStudentId()           { return studentId; }
    public void setStudentId(Long v)     { this.studentId = v; }

    public Long getSchoolId()            { return schoolId; }
    public void setSchoolId(Long v)      { this.schoolId = v; }

    public Long getClassroomId()         { return classroomId; }
    public void setClassroomId(Long v)   { this.classroomId = v; }

    public Integer getYear()             { return year; }
    public void setYear(Integer v)       { this.year = v; }

    public String getEnrollmentCode()    { return enrollmentCode; }
    public void setEnrollmentCode(String v) { this.enrollmentCode = v; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime v) { this.enrolledAt = v; }
}
