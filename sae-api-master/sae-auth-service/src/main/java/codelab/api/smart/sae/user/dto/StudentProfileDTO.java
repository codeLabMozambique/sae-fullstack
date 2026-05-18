package codelab.api.smart.sae.user.dto;

public class StudentProfileDTO {

    private Long    userId;
    private String  fullName;
    private String  username;
    private String  email;
    private Long    schoolId;
    private Long    classroomId;
    private String  grade;
    private Integer age;
    private String  enrollmentCode;

    public StudentProfileDTO() {}

    public StudentProfileDTO(Long userId, String fullName, String username, String email,
                             Long schoolId, Long classroomId, String grade, Integer age) {
        this.userId      = userId;
        this.fullName    = fullName;
        this.username    = username;
        this.email       = email;
        this.schoolId    = schoolId;
        this.classroomId = classroomId;
        this.grade       = grade;
        this.age         = age;
    }

    public Long    getUserId()     { return userId; }
    public String  getFullName()   { return fullName; }
    public String  getUsername()   { return username; }
    public String  getEmail()      { return email; }
    public Long    getSchoolId()   { return schoolId; }
    public Long    getClassroomId(){ return classroomId; }
    public String  getGrade()      { return grade; }
    public Integer getAge()        { return age; }
    public String  getEnrollmentCode() { return enrollmentCode; }

    public void setUserId(Long userId)          { this.userId      = userId; }
    public void setFullName(String fullName)    { this.fullName    = fullName; }
    public void setUsername(String username)    { this.username    = username; }
    public void setEmail(String email)          { this.email       = email; }
    public void setSchoolId(Long schoolId)      { this.schoolId    = schoolId; }
    public void setClassroomId(Long classroomId){ this.classroomId = classroomId; }
    public void setGrade(String grade)          { this.grade       = grade; }
    public void setAge(Integer age)             { this.age         = age; }
    public void setEnrollmentCode(String enrollmentCode) { this.enrollmentCode = enrollmentCode; }
}
