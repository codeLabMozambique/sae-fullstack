package codelab.api.smart.sae.framework.jpa;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

import com.fasterxml.jackson.annotation.JsonIgnore;

@MappedSuperclass
//@EntityListeners(AuditingEntityListener.class)
//@JsonIgnoreProperties(value = { "lastModifiedBy", "lastModifiedDate" })
public abstract class UpdateTableProfessional extends CreatableProfessional<Long>{
private static final long serialVersionUID = 869537210288928366L;
    
    @JsonIgnore
    //@LastModifiedBy
    @Column(name = "UPDATED_BY")
    private Long lastModifiedBy;

    @JsonIgnore
    //@LastModifiedDate
    @Column(name = "UPDATE_DATE")
    private LocalDateTime lastModifiedDate;

    public Long getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(Long lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public LocalDateTime getLastModifiedDate() {
        return lastModifiedDate;
    }

    public void setLastModifiedDate(LocalDateTime lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }
}
