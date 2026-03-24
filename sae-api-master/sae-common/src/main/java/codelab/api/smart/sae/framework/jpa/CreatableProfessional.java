package codelab.api.smart.sae.framework.jpa;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(value = { "createdDate", "createdBy" })
public class CreatableProfessional<U> extends StatusProfessional  {


        private static final long serialVersionUID = -4773982482933029175L;

        @CreatedBy
        @Column(name = "CREATED_BY", nullable = false, updatable = false)
        private U createdBy;

        @CreatedDate
        @Column(name = "CREATION_DATE", nullable = false, updatable = false)
        private LocalDateTime createdDate;

        public U getCreatedBy() {
            return createdBy;
        }

        public void setCreatedBy(U createdBy) {
            this.createdBy = createdBy;
        }

        public LocalDateTime getCreatedDate() {
            return createdDate;
        }

        public void setCreatedDate(LocalDateTime createdDate) {
            this.createdDate = createdDate;
        }
    
    }
    
