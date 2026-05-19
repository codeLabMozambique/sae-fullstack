package codelab.api.smart.sae.forum.dto.response;

import codelab.api.smart.sae.forum.model.ProfessorCertificateEntity;

import java.time.LocalDateTime;

public class ProfessorCertificateDTO {

    private Long id;
    private String professorUsername;
    private String discipline;
    private Double assistancePercentage;
    private Long totalAnswered;
    private Boolean isPublic;
    private LocalDateTime issuedAt;
    private LocalDateTime publishedAt;

    public static ProfessorCertificateDTO from(ProfessorCertificateEntity e) {
        ProfessorCertificateDTO dto = new ProfessorCertificateDTO();
        dto.id = e.getId();
        dto.professorUsername = e.getProfessorUsername();
        dto.discipline = e.getDiscipline();
        dto.assistancePercentage = e.getAssistancePercentage();
        dto.totalAnswered = e.getTotalAnswered();
        dto.isPublic = e.getIsPublic();
        dto.issuedAt = e.getIssuedAt();
        dto.publishedAt = e.getPublishedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getProfessorUsername() { return professorUsername; }
    public String getDiscipline() { return discipline; }
    public Double getAssistancePercentage() { return assistancePercentage; }
    public Long getTotalAnswered() { return totalAnswered; }
    public Boolean getIsPublic() { return isPublic; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
}
