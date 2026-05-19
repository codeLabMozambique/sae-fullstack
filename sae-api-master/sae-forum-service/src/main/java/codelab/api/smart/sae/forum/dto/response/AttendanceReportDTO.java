package codelab.api.smart.sae.forum.dto.response;

import java.time.LocalDate;

public class AttendanceReportDTO {

    private LocalDate from;
    private LocalDate to;
    private Long schoolId;
    private String schoolName;
    private String discipline;
    private long totalQuestions;
    private long answeredByProfessor;
    private long answeredByAI;
    private long answeredByStudent;
    private long unanswered;
    private Double avgResponseTimeMinutes;

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public long getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(long totalQuestions) { this.totalQuestions = totalQuestions; }

    public long getAnsweredByProfessor() { return answeredByProfessor; }
    public void setAnsweredByProfessor(long answeredByProfessor) { this.answeredByProfessor = answeredByProfessor; }

    public long getAnsweredByAI() { return answeredByAI; }
    public void setAnsweredByAI(long answeredByAI) { this.answeredByAI = answeredByAI; }

    public long getAnsweredByStudent() { return answeredByStudent; }
    public void setAnsweredByStudent(long answeredByStudent) { this.answeredByStudent = answeredByStudent; }

    public long getUnanswered() { return unanswered; }
    public void setUnanswered(long unanswered) { this.unanswered = unanswered; }

    public Double getAvgResponseTimeMinutes() { return avgResponseTimeMinutes; }
    public void setAvgResponseTimeMinutes(Double avgResponseTimeMinutes) { this.avgResponseTimeMinutes = avgResponseTimeMinutes; }
}
