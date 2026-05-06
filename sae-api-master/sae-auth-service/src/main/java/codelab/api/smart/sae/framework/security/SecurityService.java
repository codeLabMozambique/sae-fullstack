package codelab.api.smart.sae.framework.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import codelab.api.smart.sae.framework.util.JwtUtil;
import codelab.api.smart.sae.user.dto.AuthenticationRequestDTO;
import codelab.api.smart.sae.user.model.UserEntity;

@Service
public class SecurityService {

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtUtil jwtTokenUtil;

	public String authenticate(AuthenticationRequestDTO request) throws Exception {
		System.out.println("requisicao: " + request.getUsername());
		Authentication authenticate = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
		System.out.println("Authorities: " + authenticate.getAuthorities());

		SecurityContextHolder.getContext().setAuthentication(authenticate);

		return jwtTokenUtil.generateToken((UserDetails) authenticate.getPrincipal());
	}

	public UserEntity getPrincipal() {
		return (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
	}

}
