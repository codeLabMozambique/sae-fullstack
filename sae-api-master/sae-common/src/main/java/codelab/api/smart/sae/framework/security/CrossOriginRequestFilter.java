package codelab.api.smart.sae.framework.security;

import java.io.IOException;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import codelab.api.smart.sae.framework.config.SmartSAEConfig;

/**
 * CORS Filter for every request
 * 
 * @author Nelson Magalhaes (nelsonmagas@gmail.com)
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CrossOriginRequestFilter implements Filter {

	private static final String PREFLIGHT_REQUEST_METHOD = "OPTIONS";
	
	private Logger log=LoggerFactory.getLogger(CrossOriginRequestFilter.class);

	@Autowired
	private SmartSAEConfig configuration;

	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		// nothing to do.
	}

	@Override
	public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
			throws IOException, ServletException {

		HttpServletRequest request = (HttpServletRequest) req;
		HttpServletResponse response = (HttpServletResponse) resp;

		response.setHeader("Access-Control-Allow-Origin", configuration.getSecurity().getAllowedOrigin());
		response.setHeader("Access-Control-Allow-Credentials", "true");

		if (isPreFlightRequestFromAllowedOrigin(request)) {
			// Consider HTTP Status 200 OK for all pre flight requests
			response.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, PUT, PATCH, OPTIONS");
			response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
			response.setHeader("Access-Control-Allow-Max-Age", "3600");
			response.setStatus(HttpServletResponse.SC_OK);
		} else {
			// Now let spring security take care of the request
			chain.doFilter(request, response);
		}

	}

	@Override
	public void destroy() {
		// nothing to do.
	}

	private boolean isPreFlightRequestFromAllowedOrigin(HttpServletRequest request) {

		boolean trustedOrigin = configuration.getSecurity().getAllowedOrigin().equals(request.getHeader("Origin"));
		boolean preflightRequest = PREFLIGHT_REQUEST_METHOD.equals(request.getMethod());
		
		log.info("INICIADA A LOGARIZACAO DOS HEADERS / TRUSTED ORIGIN {} ",trustedOrigin);
		
		log.info("INICIADA A LOGARIZACAO DOS HEADERS / PREFLIHT REQUEST {} ",preflightRequest);
		
		log.info("INICIADA A LOGARIZACAO DOS HEADERS / RESULT {} ",trustedOrigin && preflightRequest);

		return trustedOrigin && preflightRequest;
	}

}
