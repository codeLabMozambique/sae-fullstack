package codelab.api.smart.sae.user.dto;

public class SaveGradeDTO {
    private Long studentId;
    private Long classroomId;
    private Long subjectId;
    private String period;
    private Float score;

    public SaveGradeDTO() {}

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public Float getScore() { return score; }
    public void setScore(Float score) { this.score = score; }
}
