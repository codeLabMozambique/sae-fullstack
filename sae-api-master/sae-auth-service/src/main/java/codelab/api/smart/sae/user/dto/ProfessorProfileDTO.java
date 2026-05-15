package codelab.api.smart.sae.user.dto;

public class ProfessorProfileDTO {

    private Long id;
    private String fullName;
    private String username;
    private String email;
    private Long schoolId;
    private String department;
    private String specialization;
    private String institutionalContact;
    private boolean online;
    private java.time.LocalDateTime lastSeen;
    private String professorCode;
    private String teachingCycle;

    public ProfessorProfileDTO() {}

    public ProfessorProfileDTO(Long id, String fullName, String username, String email,
                               Long schoolId, String department, String specialization,
                               String institutionalContact, boolean online,
                               java.time.LocalDateTime lastSeen) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.schoolId = schoolId;
        this.department = department;
        this.specialization = specialization;
        this.institutionalContact = institutionalContact;
        this.online = online;
        this.lastSeen = lastSeen;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getInstitutionalContact() { return institutionalContact; }
    public void setInstitutionalContact(String institutionalContact) { this.institutionalContact = institutionalContact; }

    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }

    public java.time.LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(java.time.LocalDateTime lastSeen) { this.lastSeen = lastSeen; }

    public String getProfessorCode() { return professorCode; }
    public void setProfessorCode(String professorCode) { this.professorCode = professorCode; }

    public String getTeachingCycle() { return teachingCycle; }
    public void setTeachingCycle(String teachingCycle) { this.teachingCycle = teachingCycle; }
}
