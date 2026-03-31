package codelab.api.smart.sae.framework.jpa;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Optional;

@Configuration
public class JpaAuditingConfig {

    public static class SAEAuditorAware implements AuditorAware<Long> {
        @Override
        @NonNull
        public Optional<Long> getCurrentAuditor() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
                return Optional.empty();
            }

            // Assumindo que o principal é um UserEntity que estende UpdatableEntity e o ID é Long
            // Em microserviços, o principal pode ser apenas o username ou o ID extraído do JWT
            // Para simplificar agora, retornamos o ID fixo ou extraído se disponível
            return Optional.of(1L); // TODO: Extrair ID real do JWT/Principal
        }
    }
}
