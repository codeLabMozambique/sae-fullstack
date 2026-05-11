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
                    AntPathRequestMatcher.antMatcher("/health"),
                    AntPathRequestMatcher.antMatcher("/users/signup/**"),
                    AntPathRequestMatcher.antMatcher("/users/signup"),
                    AntPathRequestMatcher.antMatcher("/users/login"),
                    AntPathRequestMatcher.antMatcher("/users/authenticate"),
                    AntPathRequestMatcher.antMatcher("/users/otpGen/**"),
                    AntPathRequestMatcher.antMatcher("/users/otpValidation/**"),
                    AntPathRequestMatcher.antMatcher("/users/professor/**/specializations"),
                    AntPathRequestMatcher.antMatcher("/users/professors/by-discipline"))
                .permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/my-student-profile"))
                .authenticated()
                // Allow professors, students and school admins to read user lists
                .requestMatchers(
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/all"),
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/professors"),
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/students"),
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/students-by-classroom"),
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/student-profile-by-username"),
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/by-username"))
                .hasAnyAuthority(UserRoles.ADMIN.name(), UserRoles.PROFESSOR.name(), UserRoles.STUDENT.name(), UserRoles.SCHOOL_ADMIN.name())
                // School admin endpoints
                .requestMatchers(
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/school-admin-profile"),
                    AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/my-school/members"))
                .hasAnyAuthority(UserRoles.ADMIN.name(), UserRoles.SCHOOL_ADMIN.name())
                // All other GET /users/** requires ADMIN
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/users/**"))
                .hasAnyAuthority(UserRoles.ADMIN.name())
                .requestMatchers(AntPathRequestMatcher.antMatcher("/users/change-password"))
                .hasAnyAuthority(UserRoles.ADMIN.name())
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/driving-licenses/me"))
                .authenticated()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/driving-licenses/me"))
                .authenticated()
                .requestMatchers(
                    AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/driving-licenses/users/**"))
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
