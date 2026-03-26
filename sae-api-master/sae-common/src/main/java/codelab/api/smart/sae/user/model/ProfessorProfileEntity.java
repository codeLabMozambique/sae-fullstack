package codelab.api.smart.sae.user.model;

import codelab.api.smart.sae.academic.model.SchoolEntity;
import codelab.api.smart.sae.framework.jpa.UpdatableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "PROFESSOR_PROFILE")
public class ProfessorProfileEntity extends UpdatableEntity {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = false)
    private SchoolEntity school;

    @Column(name = "INSTITUTIONAL_CONTACT")
    private String institutionalContact;

    @Column(name = "IS_ONLINE")
    private boolean online;

    public ProfessorProfileEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }

    public SchoolEntity getSchool() { return school; }
    public void setSchool(SchoolEntity school) { this.school = school; }

    public String getInstitutionalContact() { return institutionalContact; }
    public void setInstitutionalContact(String institutionalContact) { this.institutionalContact = institutionalContact; }

    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }
}
