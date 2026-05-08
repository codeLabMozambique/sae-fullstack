package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;

public class ProfessorAssignmentDetailDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long professorId;
    private Long classroomId;
    private String classroomName;
    private String classroomShift;
    private String classroomAcademicYear;
    private String classLevelName;
    private Long subjectId;
    private String subjectName;

    public ProfessorAssignmentDetailDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProfessorId() { return professorId; }
    public void setProfessorId(Long professorId) { this.professorId = professorId; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public String getClassroomName() { return classroomName; }
    public void setClassroomName(String classroomName) { this.classroomName = classroomName; }

    public String getClassroomShift() { return classroomShift; }
    public void setClassroomShift(String classroomShift) { this.classroomShift = classroomShift; }

    public String getClassroomAcademicYear() { return classroomAcademicYear; }
    public void setClassroomAcademicYear(String classroomAcademicYear) { this.classroomAcademicYear = classroomAcademicYear; }

    public String getClassLevelName() { return classLevelName; }
    public void setClassLevelName(String classLevelName) { this.classLevelName = classLevelName; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
}
