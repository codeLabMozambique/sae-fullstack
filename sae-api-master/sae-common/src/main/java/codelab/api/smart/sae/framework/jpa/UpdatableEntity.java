package codelab.api.smart.sae.framework.jpa;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Base class for all updatable entities
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
@MappedSuperclass
//@EntityListeners(AuditingEntityListener.class)
//@JsonIgnoreProperties(value = { "lastModifiedBy", "lastModifiedDate" })
public abstract class UpdatableEntity extends CreatableEntity<Long> {

	private static final long serialVersionUID = 869537210288928366L;
	
	@JsonIgnore
	//@LastModifiedBy
	@Column(name = "LAST_MODIFIED_BY")
	private Long lastModifiedBy;

	@JsonIgnore
	//@LastModifiedDate
	@Column(name = "LAST_MODIFIED_DATE")
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
