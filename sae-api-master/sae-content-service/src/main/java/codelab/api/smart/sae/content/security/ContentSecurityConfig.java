package codelab.api.smart.sae.content.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import codelab.api.smart.sae.framework.filter.JwtRequestFilter;

/**
 * Security rules for the content-service /api/** routes.
 *
 * Coexists with sae-common's SecurityConfig: this chain is ordered first
 * and only handles requests under /api/**. Non-/api requests fall through
 * to the common chain.
 *
 * Public:  /api/contents/**   (catalog browsing without registration — TdR requirement)
 * JWT:     /api/user/**       (per-user features: progress, history, goals, preferences, favorites)
 * Admin:   /api/admin/**      (role=ADMIN required)
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ContentSecurityConfig {

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public SecurityFilterChain contentApiFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher(AntPathRequestMatcher.antMatcher("/api/**"))
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.OPTIONS, "/api/**")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/contents")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/contents/**")).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/api/admin/**")).hasAuthority("ADMIN")
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/api/user/**")).authenticated()
                        .anyRequest().authenticated())
                .formLogin(f -> f.disable())
                .httpBasic(b -> b.disable());

        return http.build();
    }
}
