package codelab.api.smart.sae.framework.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Application System Exception. The exception will be logged
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
public class SystemException extends AppException {

	Logger logger = LoggerFactory.getLogger(SystemException.class);

	private static final long serialVersionUID = 7458422488439244886L;

	public SystemException(String message) {
		super(message);
		if (logger.isDebugEnabled())
			logger.debug(message);
	}

	public SystemException(String pretty, String raw) {
		super(pretty, raw);
		if (logger.isDebugEnabled())
			logger.debug(String.format("PRETTY: (%s) - RAW: (%s)", pretty, raw));
	}

}
