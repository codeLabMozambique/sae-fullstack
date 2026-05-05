package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;

public class ProfessorAssignmentFullDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long professorId;
    private SubjectDTO subject;

    public ProfessorAssignmentFullDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProfessorId() { return professorId; }
    public void setProfessorId(Long professorId) { this.professorId = professorId; }

    public SubjectDTO getSubject() { return subject; }
    public void setSubject(SubjectDTO subject) { this.subject = subject; }
}
