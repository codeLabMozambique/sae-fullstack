package codelab.api.smart.sae.user.validators;

import codelab.api.smart.sae.framework.exception.BusinessException;

import java.util.regex.Pattern;

/**
 * Validação central de contactos (telefone moçambicano e email).
 *
 * Usado em todos os fluxos que aceitam input do utilizador — registo, criação
 * por administrador, edição de perfil — para garantir que o frontend não
 * pode ser contornado.
 *
 * Operadoras móveis e prefixos aceites:
 *   • Vodacom:  84, 85
 *   • Tmcel:    82, 83
 *   • Movitel:  86, 87
 *
 * Aceita o prefixo internacional opcional "+258" ou "00258".
 */
public final class ContactValidator {

    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^(?:\\+?258|00258)?(8[2-7])\\d{7}$");

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    private ContactValidator() { }

    /** Verifica se o telefone é um número moçambicano móvel válido. */
    public static boolean isValidPhone(String raw) {
        if (raw == null) return false;
        String cleaned = raw.replaceAll("[\\s\\-()]+", "");
        return PHONE_PATTERN.matcher(cleaned).matches();
    }

    /**
     * Normaliza o telefone para o formato canónico local (9 dígitos, sem prefixo).
     * Lança BusinessException se inválido.
     */
    public static String requireValidPhone(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new BusinessException("Telefone obrigatório");
        }
        String cleaned = raw.replaceAll("[\\s\\-()]+", "");
        if (!PHONE_PATTERN.matcher(cleaned).matches()) {
            throw new BusinessException(
                "Número de telefone inválido. Usa um móvel moçambicano " +
                "(ex. 841234567)."
            );
        }
        // Remove prefixo internacional se presente — armazena apenas os 9 dígitos locais
        String tail = cleaned;
        if (cleaned.startsWith("+258")) tail = cleaned.substring(4);
        else if (cleaned.startsWith("00258")) tail = cleaned.substring(5);
        else if (cleaned.startsWith("258")) tail = cleaned.substring(3);
        return tail;
    }

    /** Devolve true se o email tem estrutura sintacticamente válida. */
    public static boolean isValidEmail(String raw) {
        if (raw == null) return false;
        String v = raw.trim();
        if (v.isEmpty() || v.length() > 254) return false;
        return EMAIL_PATTERN.matcher(v).matches();
    }

    /**
     * Valida email; lança BusinessException se inválido.
     * Devolve email normalizado em lowercase.
     */
    public static String requireValidEmail(String raw, boolean required) {
        if (raw == null || raw.trim().isEmpty()) {
            if (required) throw new BusinessException("Email obrigatório");
            return null;
        }
        String v = raw.trim();
        if (v.length() > 254) {
            throw new BusinessException("Email demasiado longo (máx. 254 caracteres)");
        }
        if (v.contains(" ")) {
            throw new BusinessException("Email não pode conter espaços");
        }
        if (!EMAIL_PATTERN.matcher(v).matches()) {
            throw new BusinessException("Formato de email inválido. Exemplo: nome@dominio.com");
        }
        return v.toLowerCase();
    }
}
