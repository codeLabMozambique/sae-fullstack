package codelab.api.smart.sae.content.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class AuthServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceClient.class);

    @Value("${smartsae.auth-service.url:http://localhost:8081}")
    private String authServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Devolve o nome completo de um utilizador.
     *
     * Chama directamente o auth-service em http://localhost:8081/users/by-username?username=...
     * (sem prefixo /auth porque não passa pelo gateway).
     *
     * Em caso de falha (auth offline, JWT inválido, utilizador não encontrado, etc.)
     * devolve null para que o caller use fallback.
     */
    public String getUserFullName(String username, String token) {
        if (username == null || username.isBlank()) return null;
        try {
            HttpHeaders headers = new HttpHeaders();
            if (token != null && !token.isBlank()) {
                headers.setBearerAuth(token.replace("Bearer ", "").trim());
            }
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String url = authServiceUrl + "/users/by-username?username=" +
                    java.net.URLEncoder.encode(username, java.nio.charset.StandardCharsets.UTF_8);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object name = response.getBody().get("fullName");
                return name != null ? name.toString() : null;
            }
        } catch (Exception e) {
            log.warn("Falha ao resolver nome do utilizador '{}': {}", username, e.getMessage());
        }
        return null;
    }
}
