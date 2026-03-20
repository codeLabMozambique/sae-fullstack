package codelab.api.smart.sae.framework.exception;

/**
 * Generic Validation Exception
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
public class ValidationException extends AppException {

	private static final long serialVersionUID = 7458422488439244886L;

	public ValidationException(String message) {
		super(message);
	}

	public ValidationException(String pretty, String raw) {
		super(pretty, raw);
	}

}
