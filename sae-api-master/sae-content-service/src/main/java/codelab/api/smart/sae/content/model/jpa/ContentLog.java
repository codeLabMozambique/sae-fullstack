package codelab.api.smart.sae.content.model.jpa;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "content_logs")
public class ContentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false)
    private String contentId; // ID do MongoDB

    @Column(name = "action", nullable = false)
    private String action; // UPLOAD, DELETE, UPDATE

    @Column(name = "user_username", nullable = false)
    private String userUsername;

    @Column(name = "user_role")
    private String userRole;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    public ContentLog() {
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getUserUsername() { return userUsername; }
    public void setUserUsername(String userUsername) { this.userUsername = userUsername; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
