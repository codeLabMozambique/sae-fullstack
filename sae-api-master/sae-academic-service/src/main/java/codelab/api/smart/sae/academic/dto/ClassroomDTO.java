package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;

public class ClassroomDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private Long schoolId;
    private Long classLevelId;
    private String shift;
    private String academicYear;
    private Long directorId;

    public ClassroomDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public Long getClassLevelId() { return classLevelId; }
    public void setClassLevelId(Long classLevelId) { this.classLevelId = classLevelId; }

    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Long getDirectorId() { return directorId; }
    public void setDirectorId(Long directorId) { this.directorId = directorId; }
}
