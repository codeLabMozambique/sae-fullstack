package codelab.api.smart.sae.framework.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.framework.filter.JwtRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Autowired
	private JwtRequestFilter jwtRequestFilter;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers("/users/signup/**", "/users/login", "/users/authenticate",
						"/users/otpGen/**", "/users/otpValidation/**", "/error")
				.permitAll()
				.requestMatchers(HttpMethod.GET, "/users/**").hasAnyAuthority(UserRoles.ADMIN.name())
				.requestMatchers("/users/change-password").hasAnyAuthority(UserRoles.ADMIN.name())
				.requestMatchers(HttpMethod.POST, "/driving-licenses/me").authenticated()
				.requestMatchers(HttpMethod.GET, "/driving-licenses/me").authenticated()
				.requestMatchers(HttpMethod.POST, "/driving-licenses/users/**").hasAuthority(UserRoles.ADMIN.name())
				.requestMatchers(HttpMethod.GET, "/driving-licenses/users/**").hasAuthority(UserRoles.ADMIN.name())
				.requestMatchers(HttpMethod.GET, "/driving-licenses").hasAuthority(UserRoles.ADMIN.name())
				.anyRequest().authenticated())
			.formLogin(form -> form.disable())
			.httpBasic(basic -> basic.disable());

		return http.build();
	}

}
