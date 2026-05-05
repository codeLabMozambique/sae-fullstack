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
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.framework.filter.JwtRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Autowired
	private JwtRequestFilter jwtRequestFilter;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http.cors(cors -> cors.disable()).csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.OPTIONS, "/**")).permitAll()
						.requestMatchers(
								AntPathRequestMatcher.antMatcher("/error"),
								AntPathRequestMatcher.antMatcher("/users/signup/**"),
								AntPathRequestMatcher.antMatcher("/users/signup"),
								AntPathRequestMatcher.antMatcher("/users/login"),
								AntPathRequestMatcher.antMatcher("/users/authenticate"),
								AntPathRequestMatcher.antMatcher("/users/otpGen/**"),
								AntPathRequestMatcher.antMatcher("/users/otpValidation/**")
							
							)
						.permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/**"))
						.hasAnyAuthority(UserRoles.ADMIN.name())
						.requestMatchers(AntPathRequestMatcher.antMatcher("/users/change-password"))
						.hasAnyAuthority(UserRoles.ADMIN.name())
						.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/driving-licenses/me"))
						.authenticated()
						.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/driving-licenses/me"))
						.authenticated()
						.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/driving-licenses/users/**"))
						.hasAuthority(UserRoles.ADMIN.name())
						.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/driving-licenses/users/**"))
						.hasAuthority(UserRoles.ADMIN.name())
						.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/driving-licenses"))
						.hasAuthority(UserRoles.ADMIN.name())
						.anyRequest().authenticated())
				.formLogin(form -> form.disable())
				.httpBasic(basic -> basic.disable());

		return http.build();
	}

}
