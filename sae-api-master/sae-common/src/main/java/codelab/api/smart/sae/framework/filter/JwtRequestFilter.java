package codelab.api.smart.sae.framework.filter;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import codelab.api.smart.sae.framework.util.JwtUtil;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

	@Autowired
	private JwtUtil jwtUtil;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {

		final String authorizationHeader = request.getHeader(JwtUtil.JWT_HEADER);

		String username = null;
		String jwt = null;

		if (authorizationHeader != null && authorizationHeader.startsWith(JwtUtil.JWT_PREFIX)) {
			jwt = authorizationHeader.substring(7);
			try {
				username = jwtUtil.extractUsername(jwt);
			} catch (io.jsonwebtoken.ExpiredJwtException e) {
				logger.warn("JWT Token has expired");
			} catch (Exception e) {
				logger.warn("Unable to extract JWT Token");
			}
		}
		
		if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

			List<String> rolesList = jwtUtil.extractClaim(jwt, claims -> claims.get("roles", List.class));
			List<SimpleGrantedAuthority> authorities = rolesList != null ? 
					rolesList.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList()) : 
					Collections.emptyList();
			
			UserDetails userDetails = new User(username, "", authorities);

			if (jwtUtil.validateToken(jwt, userDetails)) {

				UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
						userDetails, null, userDetails.getAuthorities());
				usernamePasswordAuthenticationToken
						.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
			}
		}
		chain.doFilter(request, response);
	}

}
