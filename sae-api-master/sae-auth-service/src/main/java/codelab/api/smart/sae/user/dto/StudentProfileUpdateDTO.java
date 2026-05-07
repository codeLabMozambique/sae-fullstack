package codelab.api.smart.sae.user.dto;

public class StudentProfileUpdateDTO {

    private Long    userId;
    private Long    schoolId;
    private Long    classroomId;
    private String  grade;
    private Integer age;

    public StudentProfileUpdateDTO() {}

    public Long    getUserId()     { return userId; }
    public Long    getSchoolId()   { return schoolId; }
    public Long    getClassroomId(){ return classroomId; }
    public String  getGrade()      { return grade; }
    public Integer getAge()        { return age; }

    public void setUserId(Long userId)          { this.userId      = userId; }
    public void setSchoolId(Long schoolId)      { this.schoolId    = schoolId; }
    public void setClassroomId(Long classroomId){ this.classroomId = classroomId; }
    public void setGrade(String grade)          { this.grade       = grade; }
    public void setAge(Integer age)             { this.age         = age; }
}
