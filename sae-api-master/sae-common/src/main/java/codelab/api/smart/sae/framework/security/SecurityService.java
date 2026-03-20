package codelab.api.smart.sae.framework.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import codelab.api.smart.sae.framework.exception.BusinessException;
import codelab.api.smart.sae.framework.util.JwtUtil;
import codelab.api.smart.sae.user.dto.AuthenticationRequestDTO;
import codelab.api.smart.sae.user.model.UserEntity;
import codelab.api.smart.sae.user.repository.UserRepository;

@Service
public class SecurityService implements UserDetailsService {

//	@Autowired
//	private UserService userService;
	
	@Autowired
	private UserRepository userRepository;

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtUtil jwtTokenUtil;

	

	@Override
	public UserEntity loadUserByUsername(String username) throws UsernameNotFoundException {
//	    System.out.println("username: "+username);
		return this.userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
	}

	public String authenticate(AuthenticationRequestDTO request) throws Exception {

		try {
		    System.out.println("requisicao: "+request.getNtelefone());
			Authentication authenticate = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.getNtelefone(), request.getPassword()));
			System.out.println("Authorities: " + authenticate.getAuthorities());
			
			SecurityContextHolder.getContext().setAuthentication(authenticate);

			return jwtTokenUtil.generateToken((UserDetails) authenticate.getPrincipal());

		} catch (BadCredentialsException e) {
			throw new BusinessException("Username ou senha invalidos");
		}
	}
	
	public UserEntity getPrincipal() {
		return (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
	}

}
