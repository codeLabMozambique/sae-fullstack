package codelab.api.smart.sae.academic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "ac_GRADES", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "classroom_id", "subject_id", "academic_year"})
})
public class GradeEntity {

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

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    @Column(name = "nota1")
    private Double nota1;

    @Column(name = "nota2")
    private Double nota2;

    @Column(name = "nota3")
    private Double nota3;

    @Column(name = "acp1")
    private Double acp1;

    @Column(name = "acp2")
    private Double acp2;

    @Column(name = "miniteste1")
    private Double miniteste1;

    @Column(name = "miniteste2")
    private Double miniteste2;

    @Column(name = "exame_final")
    private Double exameFinal;

    @Column(name = "media")
    private Double media;

    public GradeEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Double getNota1() { return nota1; }
    public void setNota1(Double nota1) { this.nota1 = nota1; }

    public Double getNota2() { return nota2; }
    public void setNota2(Double nota2) { this.nota2 = nota2; }

    public Double getNota3() { return nota3; }
    public void setNota3(Double nota3) { this.nota3 = nota3; }

    public Double getAcp1() { return acp1; }
    public void setAcp1(Double acp1) { this.acp1 = acp1; }

    public Double getAcp2() { return acp2; }
    public void setAcp2(Double acp2) { this.acp2 = acp2; }

    public Double getMiniteste1() { return miniteste1; }
    public void setMiniteste1(Double miniteste1) { this.miniteste1 = miniteste1; }

    public Double getMiniteste2() { return miniteste2; }
    public void setMiniteste2(Double miniteste2) { this.miniteste2 = miniteste2; }

    public Double getExameFinal() { return exameFinal; }
    public void setExameFinal(Double exameFinal) { this.exameFinal = exameFinal; }

    public Double getMedia() { return media; }
    public void setMedia(Double media) { this.media = media; }
}
