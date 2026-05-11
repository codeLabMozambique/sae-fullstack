package codelab.api.smart.sae.user.model;

import codelab.api.smart.sae.framework.jpa.UpdatableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "school_admin_profile")
public class SchoolAdminProfileEntity extends UpdatableEntity {

    private static final long serialVersionUID = 1L;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    public SchoolAdminProfileEntity() {}

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
}
