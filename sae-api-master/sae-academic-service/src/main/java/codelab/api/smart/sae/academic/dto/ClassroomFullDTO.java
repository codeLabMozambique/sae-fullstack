package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;
import java.util.List;

public class ClassroomFullDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private ClassLevelDTO classLevel;
    private String shift;
    private String academicYear;
    private List<ProfessorAssignmentFullDTO> assignments;

    public ClassroomFullDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ClassLevelDTO getClassLevel() { return classLevel; }
    public void setClassLevel(ClassLevelDTO classLevel) { this.classLevel = classLevel; }

    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public List<ProfessorAssignmentFullDTO> getAssignments() { return assignments; }
    public void setAssignments(List<ProfessorAssignmentFullDTO> assignments) { this.assignments = assignments; }
}
