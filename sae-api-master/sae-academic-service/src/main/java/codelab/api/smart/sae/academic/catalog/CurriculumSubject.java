package codelab.api.smart.sae.academic.catalog;

import codelab.api.smart.sae.academic.util.NameNormalizer;

/**
 * Currículo oficial do ensino secundário moçambicano (1º e 2º ciclo).
 * Fonte: Plano Curricular do Ensino Secundário Geral (MINED/MINEDH).
 */
public enum CurriculumSubject {

    // Tronco comum (1º e 2º ciclo)
    PORTUGUES("Português"),
    INGLES("Inglês"),
    FRANCES("Francês"),
    MATEMATICA("Matemática"),
    FISICA("Física"),
    QUIMICA("Química"),
    BIOLOGIA("Biologia"),
    HISTORIA("História"),
    GEOGRAFIA("Geografia"),
    EDUCACAO_FISICA("Educação Física"),

    // 1º ciclo (8ª–10ª classe)
    EDUCACAO_VISUAL("Educação Visual"),
    EDUCACAO_MORAL_CIVICA("Educação Moral e Cívica"),
    INTRODUCAO_TIC("Introdução às Tecnologias de Informação e Comunicação"),
    EMPREENDORISMO("Empreendorismo"),

    // 2º ciclo – Grupo A (Letras)
    FILOSOFIA("Filosofia"),
    SOCIOLOGIA("Sociologia"),
    PSICOLOGIA("Psicologia"),
    INTRODUCAO_ECONOMIA("Introdução à Economia e Contabilidade"),

    // 2º ciclo – Grupo C (Técnico)
    DESENHO_GEOMETRIA_DESCRITIVA("Desenho e Geometria Descritiva");

    private final String displayName;

    CurriculumSubject(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() { return displayName; }
    public String getNormalizedName() { return NameNormalizer.normalize(displayName); }

    public static CurriculumSubject findByNormalized(String input) {
        String norm = NameNormalizer.normalize(input);
        if (norm == null) return null;
        for (CurriculumSubject s : values()) {
            if (s.getNormalizedName().equals(norm)) return s;
        }
        return null;
    }
}
