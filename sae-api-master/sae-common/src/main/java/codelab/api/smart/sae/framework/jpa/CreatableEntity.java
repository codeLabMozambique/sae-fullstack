package codelab.api.smart.sae.framework.jpa;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Base class for all creatable entities
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(value = { "createdDate", "createdBy" })
public abstract class CreatableEntity<U> extends StatusEntity {

	private static final long serialVersionUID = -4773982482933029175L;

	@CreatedBy
	@Column(name = "CREATED_BY", nullable = true, updatable = false)
	private U createdBy;

	@CreatedDate
	@Column(name = "CREATED_DATE", nullable = true, updatable = false)
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
