package codelab.api.smart.sae.content.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Helper to extract the current user identifier from the SecurityContext.
 * The JwtRequestFilter (from sae-common) populates the context with a
 * UserDetails whose username is the JWT 'sub' claim — i.e. the user's
 * phone number / unique username.
 */
public final class JwtPrincipal {

    private JwtPrincipal() {}

    public static String currentUserIdOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("Não autenticado");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }
        return auth.getName();
    }
}
