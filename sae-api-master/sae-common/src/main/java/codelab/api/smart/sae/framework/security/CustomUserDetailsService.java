package codelab.api.smart.sae.framework.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import codelab.api.smart.sae.user.model.UserEntity;
import codelab.api.smart.sae.user.repository.UserRepository;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;

@Service
@ConditionalOnBean(UserRepository.class)
public class CustomUserDetailsService implements UserDetailsService {

	@Autowired
	private UserRepository userRepository;

	@Override
	public UserEntity loadUserByUsername(String username) throws UsernameNotFoundException {
		return this.userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException(username));
	}
}
