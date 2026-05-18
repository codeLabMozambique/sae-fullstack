package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;

public class CurriculumEntryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long schoolId;
    private String schoolName;
    private Long classLevelId;
    private String classLevelName;
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private Long academicGroupId;    // null = comum a todos
    private String academicGroupName;

    public CurriculumEntryDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public Long getClassLevelId() { return classLevelId; }
    public void setClassLevelId(Long classLevelId) { this.classLevelId = classLevelId; }

    public String getClassLevelName() { return classLevelName; }
    public void setClassLevelName(String classLevelName) { this.classLevelName = classLevelName; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public Long getAcademicGroupId() { return academicGroupId; }
    public void setAcademicGroupId(Long academicGroupId) { this.academicGroupId = academicGroupId; }

    public String getAcademicGroupName() { return academicGroupName; }
    public void setAcademicGroupName(String academicGroupName) { this.academicGroupName = academicGroupName; }
}
