package codelab.api.smart.sae.forum.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "PROFESSOR_CERTIFICATE",
    indexes = {
        @Index(name = "idx_prof_cert_username", columnList = "professor_username"),
        @Index(name = "idx_prof_cert_public",   columnList = "is_public")
    }
)
public class ProfessorCertificateEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "professor_username", nullable = false, length = 100)
    private String professorUsername;

    @Column(name = "discipline", length = 100)
    private String discipline;

    @Column(name = "assistance_percentage", nullable = false)
    private Double assistancePercentage;

    @Column(name = "total_answered", nullable = false)
    private Long totalAnswered;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProfessorUsername() { return professorUsername; }
    public void setProfessorUsername(String professorUsername) { this.professorUsername = professorUsername; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public Double getAssistancePercentage() { return assistancePercentage; }
    public void setAssistancePercentage(Double assistancePercentage) { this.assistancePercentage = assistancePercentage; }

    public Long getTotalAnswered() { return totalAnswered; }
    public void setTotalAnswered(Long totalAnswered) { this.totalAnswered = totalAnswered; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
}
