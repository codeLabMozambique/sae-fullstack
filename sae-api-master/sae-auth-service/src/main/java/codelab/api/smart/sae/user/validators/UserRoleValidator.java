/**
 * 
 */
package codelab.api.smart.sae.user.validators;

import java.util.HashMap;
import java.util.Map;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public class UserRoleValidator {
    private static final Map<String, String> roleTranslations = new HashMap<>();

    static {
        roleTranslations.put("PROFESSOR", "Professor");
        roleTranslations.put("GUEST", "Estudante Visitante");
        roleTranslations.put("ADMIN", "Administrador");
        roleTranslations.put("STUDENT", "Estudante");
        roleTranslations.put("ROOT", "Root");
    }

    public static String validate(String role) {
        String translatedRole = roleTranslations.get(role);
        if (translatedRole == null) {
            throw new IllegalArgumentException("Role não encontrada: " + role);
        }
        return translatedRole;
    }

}
