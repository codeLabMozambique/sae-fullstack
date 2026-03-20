package codelab.api.smart.sae.framework.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.framework.filter.JwtRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Autowired
	private SecurityService securityService;

	@Autowired
	private JwtRequestFilter jwtRequestFilter;
	
	@Value("${ecarta.security.allowed-origin:*}")
	private String allowedOrigin;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	    http.cors(Customizer.withDefaults()).csrf(csrf -> csrf.disable())
	        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
	        .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
	        .authorizeHttpRequests(auth -> auth
	            .requestMatchers("/users/signup", "/users/login", "/users/authenticate", "/users/otpGen", "/users/otpValidation").permitAll()
	            .requestMatchers(HttpMethod.GET, "/users/**").hasAnyAuthority(UserRoles.ADMIN.name())
	            .requestMatchers("/users/change-password").hasAnyAuthority(UserRoles.ADMIN.name(), UserRoles.GESTOR_ECARTA.name(), UserRoles.FUNCIONARIO_INATRO.name())
	            .requestMatchers(HttpMethod.POST, "/driving-licenses/me").authenticated()
	            .requestMatchers(HttpMethod.GET,  "/driving-licenses/me").authenticated()
	            .requestMatchers(HttpMethod.POST, "/driving-licenses/users/**").hasAuthority(UserRoles.ADMIN.name())
	            .requestMatchers(HttpMethod.GET, "/driving-licenses/users/**").hasAuthority(UserRoles.ADMIN.name())
	            .requestMatchers(HttpMethod.GET, "/driving-licenses").hasAuthority(UserRoles.ADMIN.name())
	            .anyRequest().authenticated()
	        )
	        .formLogin(form -> form.disable())
	        .httpBasic(basic -> basic.disable());
        
        return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
		return authConfig.getAuthenticationManager();
	}

}
