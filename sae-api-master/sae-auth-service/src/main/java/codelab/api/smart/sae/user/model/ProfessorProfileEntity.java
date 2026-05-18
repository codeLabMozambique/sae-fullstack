package codelab.api.smart.sae.user.model;

import codelab.api.smart.sae.framework.jpa.UpdatableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
    @Column(name = "uuid")
    private String uuid;

    @Column(name = "SPECIALIZATION")
    private String specialization;

    @Column(name = "INSTITUTIONAL_CONTACT")
    private String institutionalContact;

    @Column(name = "PROFESSOR_CODE", unique = true, length = 30)
    private String professorCode;

    // "BASICO", "MEDIO" ou "AMBOS"
    @Column(name = "TEACHING_CYCLE", length = 10)
    private String teachingCycle;

    // "PENDING", "APPROVED", "REJECTED"
    @Column(name = "APPROVAL_STATUS", length = 20)
    private String approvalStatus = "PENDING";

    @Column(name = "REJECTION_REASON", length = 500)
    private String rejectionReason;

    @Column(name = "ID_DOCUMENT_NUMBER", length = 50)
    private String idDocumentNumber;

    @Column(name = "IS_ONLINE")
    private boolean online;

    @Column(name = "LAST_SEEN")
    private java.time.LocalDateTime lastSeen;

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

    public String getProfessorCode() {
        return professorCode;
    }

    public void setProfessorCode(String professorCode) {
        this.professorCode = professorCode;
    }

    public String getTeachingCycle() { return teachingCycle; }
    public void setTeachingCycle(String teachingCycle) { this.teachingCycle = teachingCycle; }

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getIdDocumentNumber() { return idDocumentNumber; }
    public void setIdDocumentNumber(String idDocumentNumber) { this.idDocumentNumber = idDocumentNumber; }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public java.time.LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(java.time.LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }
}
