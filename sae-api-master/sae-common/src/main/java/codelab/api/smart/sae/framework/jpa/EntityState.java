package codelab.api.smart.sae.framework.jpa;

import codelab.api.smart.sae.framework.exception.ValidationException;

/**
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
public enum EntityState {

	INACTIVE, // 0

	ACTIVE; // 1

	public EntityState invert(EntityState status) {
		// verify current is equal to status
		if (!status.equals(this))
			throw new ValidationException("Estado nao compativel para inversao");

		if (INACTIVE.name().equals(name()))
			return ACTIVE;
		else
			return INACTIVE;
	}

	
}
