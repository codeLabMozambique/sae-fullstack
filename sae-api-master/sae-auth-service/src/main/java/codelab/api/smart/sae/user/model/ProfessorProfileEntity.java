package codelab.api.smart.sae.user.model;

import codelab.api.smart.sae.framework.jpa.UpdatableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "PROFESSOR_PROFILE")
public class ProfessorProfileEntity extends UpdatableEntity {

    private static final long serialVersionUID = 1L;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "DEPARTMENT")
    private String department;

    @Column(name = "SPECIALIZATION")
    private String specialization;

    @Column(name = "INSTITUTIONAL_CONTACT")
    private String institutionalContact;

    @Column(name = "IS_ONLINE")
    private boolean online;

    public ProfessorProfileEntity() {
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getInstitutionalContact() {
        return institutionalContact;
    }

    public void setInstitutionalContact(String institutionalContact) {
        this.institutionalContact = institutionalContact;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }
}
