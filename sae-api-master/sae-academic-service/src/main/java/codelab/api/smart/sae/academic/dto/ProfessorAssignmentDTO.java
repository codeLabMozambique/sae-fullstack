package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;

public class ProfessorAssignmentDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long professorId;
    private Long classroomId;
    private Long subjectId;

    public ProfessorAssignmentDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProfessorId() { return professorId; }
    public void setProfessorId(Long professorId) { this.professorId = professorId; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
}
