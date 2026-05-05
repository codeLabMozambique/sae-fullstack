package codelab.api.smart.sae.academic.dto;

import java.io.Serializable;
import java.util.List;

public class SchoolFullDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private SchoolDTO school;
    private List<ClassLevelFullDTO> classLevels;
    private List<SubjectDTO> subjects;

    public SchoolFullDTO() {}

    public SchoolDTO getSchool() { return school; }
    public void setSchool(SchoolDTO school) { this.school = school; }

    public List<ClassLevelFullDTO> getClassLevels() { return classLevels; }
    public void setClassLevels(List<ClassLevelFullDTO> classLevels) { this.classLevels = classLevels; }

    public List<SubjectDTO> getSubjects() { return subjects; }
    public void setSubjects(List<SubjectDTO> subjects) { this.subjects = subjects; }
}
