package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;

public class GradeDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long studentId;
    private String studentName;
    private String studentUsername;
    private Long classroomId;
    private Long subjectId;
    private String academicYear;
    private Double nota1;
    private Double nota2;
    private Double nota3;
    private Double acp1;
    private Double acp2;
    private Double miniteste1;
    private Double miniteste2;
    private Double exameFinal;
    private Double media;

    public GradeDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStudentUsername() { return studentUsername; }
    public void setStudentUsername(String studentUsername) { this.studentUsername = studentUsername; }

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
