package codelab.api.smart.sae.framework.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Base class for all creatable entities
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class StatusEntity extends BaseEntity {

	private static final long serialVersionUID = -4121072883903584338L;

	@Column (name = "STATUS")
	@Enumerated(EnumType.ORDINAL)
	private EntityState status = EntityState.ACTIVE;

	public EntityState getStatus() {
		return status;
	}

	public void setStatus(EntityState status) {
		this.status = status;
	}
}
