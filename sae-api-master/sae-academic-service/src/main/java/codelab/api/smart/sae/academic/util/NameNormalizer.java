package codelab.api.smart.sae.academic.util;

import java.text.Normalizer;

public final class NameNormalizer {

    private NameNormalizer() {}

    /**
     * Produces a canonical key for deduplication:
     * trim → lowercase → NFD decompose → strip combining diacritics →
     * remove ordinal indicators (ª º) → normalize dashes → collapse whitespace.
     *
     * Examples:
     *   "Matemática"  → "matematica"
     *   "8ª Classe"   → "8 classe"
     *   "11ª Classe – Grupo A (Letras)" → "11 classe - grupo a (letras)"
     */
    public static String normalize(String input) {
        if (input == null) return null;
        String s = input.trim().toLowerCase();
        s = Normalizer.normalize(s, Normalizer.Form.NFD);
        s = s.replaceAll("\\p{InCombiningDiacriticalMarks}", "");
        s = s.replaceAll("[ªº°]", "");
        s = s.replaceAll("[–—]", "-");
        s = s.replaceAll("\\s+", " ").trim();
        return s;
    }
}
