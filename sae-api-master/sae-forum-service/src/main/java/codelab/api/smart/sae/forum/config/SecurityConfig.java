package codelab.api.smart.sae.forum.config;

import codelab.api.smart.sae.framework.filter.JwtRequestFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration("forumSecurityConfig")
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean("forumFilterChain")
    @org.springframework.core.annotation.Order(1)
    public SecurityFilterChain forumFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/ws/**", "/ws").permitAll()
                // Endpoints que requerem autenticação — devem vir ANTES dos permitAll mais genéricos
                .requestMatchers(HttpMethod.GET,  "/questions/rooms/expert/**").authenticated()
                .requestMatchers(HttpMethod.GET,  "/questions/professors/**").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/questions/*/message").authenticated()
                // Leitura pública de perguntas e respostas colaborativas
                .requestMatchers(HttpMethod.GET, "/questions/**", "/collaborative/questions/**").permitAll()
                // Qualquer outro endpoint requer autenticação
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write(
                        "{\"error\":\"Sessão expirada. Por favor, faça login novamente.\",\"code\":401}"
                    );
                })
                .accessDeniedHandler((req, res, accEx) -> {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write(
                        "{\"error\":\"Você não tem permissão para acessar este recurso.\",\"code\":403}"
                    );
                })
            )
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
