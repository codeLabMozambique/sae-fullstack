package codelab.api.smart.sae.content.dto;

import codelab.api.smart.sae.content.model.jpa.Submission;
import java.time.LocalDateTime;

/** DTO para listar/devolver Submission ao frontend. */
public class SubmissionDTO {
    public Long id;
    public Long assignmentId;
    public String studentUsername;
    public String studentName;
    public String comment;
    public String fileName;
    public String fileOriginalName;
    public String fileUrl;
    public LocalDateTime submittedAt;
    public Double grade;
    public LocalDateTime gradedAt;
    public String state;

    public static SubmissionDTO from(Submission s) {
        SubmissionDTO d = new SubmissionDTO();
        d.id = s.getId();
        d.assignmentId = s.getAssignmentId();
        d.studentUsername = s.getStudentUsername();
        d.studentName = s.getStudentName();
        d.comment = s.getComment();
        d.fileName = s.getFileName();
        d.fileOriginalName = s.getFileOriginalName();
        d.fileUrl = s.getFileName() != null
                ? "/api/assignments/submissions/" + s.getId() + "/file"
                : null;
        d.submittedAt = s.getSubmittedAt();
        d.grade = s.getGrade();
        d.gradedAt = s.getGradedAt();
        d.state = s.getState();
        return d;
    }
}
