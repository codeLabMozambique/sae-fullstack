package codelab.api.smart.sae.content.dto;

import codelab.api.smart.sae.content.model.jpa.Assignment;
import java.time.LocalDateTime;

/** DTO para listar/devolver Assignment ao frontend. */
public class AssignmentDTO {
    public Long id;
    public Long classroomId;
    public String title;
    public String description;
    public LocalDateTime deadline;
    public Double maxScore;
    public String createdBy;
    public String createdByName;
    public LocalDateTime createdAt;

    /** Quando o pedido é feito pelo estudante, vem populada com a sua submissão (se existir). */
    public SubmissionDTO mySubmission;

    /** Para o professor: nº de submissões já recebidas. */
    public Integer submissionCount;
    public Integer gradedCount;

    public static AssignmentDTO from(Assignment a) {
        AssignmentDTO d = new AssignmentDTO();
        d.id = a.getId();
        d.classroomId = a.getClassroomId();
        d.title = a.getTitle();
        d.description = a.getDescription();
        d.deadline = a.getDeadline();
        d.maxScore = a.getMaxScore();
        d.createdBy = a.getCreatedBy();
        d.createdByName = a.getCreatedByName();
        d.createdAt = a.getCreatedAt();
        return d;
    }
}
