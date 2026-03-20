package codelab.api.smart.sae.framework.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Base class for all simple entities containing a code and name
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class CodeNamedEntity extends UpdatableEntity {

	private static final long serialVersionUID = -843998638258495229L;

	@Column(name = "CODE", unique = true)
	private String code;

	@Column(name = "NAME")
	private String name;

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + ((code == null) ? 0 : code.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!super.equals(obj))
			return false;
		if (getClass() != obj.getClass())
			return false;
		CodeNamedEntity other = (CodeNamedEntity) obj;
		if (code == null) {
			if (other.code != null)
				return false;
		} else if (!code.equals(other.code))
			return false;
		return true;
	}

}
