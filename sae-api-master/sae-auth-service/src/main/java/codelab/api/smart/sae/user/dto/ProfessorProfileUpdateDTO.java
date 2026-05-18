package codelab.api.smart.sae.user.dto;

public class ProfessorProfileUpdateDTO {

    private Long   userId;
    private Long   schoolId;
    private String department;
    private String specialization;
    private String institutionalContact;
    private String teachingCycle;

    public ProfessorProfileUpdateDTO() {}

    public Long   getUserId()               { return userId; }
    public Long   getSchoolId()             { return schoolId; }
    public String getDepartment()           { return department; }
    public String getSpecialization()       { return specialization; }
    public String getInstitutionalContact() { return institutionalContact; }

    public void setUserId(Long userId)                           { this.userId               = userId; }
    public void setSchoolId(Long schoolId)                       { this.schoolId             = schoolId; }
    public void setDepartment(String department)                 { this.department           = department; }
    public void setSpecialization(String specialization)         { this.specialization       = specialization; }
    public void setInstitutionalContact(String institutionalContact) { this.institutionalContact = institutionalContact; }

    public String getTeachingCycle() { return teachingCycle; }
    public void setTeachingCycle(String teachingCycle) { this.teachingCycle = teachingCycle; }
}
