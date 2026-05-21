package codelab.api.smart.sae.academic.catalog;

import codelab.api.smart.sae.academic.util.NameNormalizer;

/**
 * Escolas secundárias públicas da Província de Nampula.
 * Inclui cidade de Nampula e distritos da província.
 */
public enum NampulaSchool {

    // --- Cidade de Nampula ---
    ESN("Escola Secundária de Nampula"),
    NAPIPINE("Escola Secundária de Napipine"),
    MUHALA("Escola Secundária de Muhala"),
    ANCHILO("Escola Secundária de Anchilo"),
    MUATALA("Escola Secundária de Muatala"),
    JOSINA_MACHEL("Escola Secundária Josina Machel"),
    NATIKIRI("Escola Secundária de Natikiri"),
    CARIDADE("Escola Secundária da Caridade"),
    ESTN("Escola Secundária Técnica de Nampula"),
    IEN("Instituto de Educação de Nampula"),
    MARRERE("Escola Secundária de Marrere"),
    MUTAUANHA("Escola Secundária de Mutauanha"),

    // --- Nacala ---
    NACALA_PORTO("Escola Secundária de Nacala-Porto"),
    NACALA_VELHA("Escola Secundária de Nacala-a-Velha"),

    // --- Monapo ---
    MONAPO("Escola Secundária de Monapo"),

    // --- Angoche ---
    ANGOCHE("Escola Secundária de Angoche"),

    // --- Ilha de Moçambique ---
    ILHA_MOCAMBIQUE("Escola Secundária da Ilha de Moçambique"),

    // --- Ribáuè ---
    RIBAUE("Escola Secundária de Ribáuè"),

    // --- Outros distritos ---
    MECONTA("Escola Secundária de Meconta"),
    MURRUPULA("Escola Secundária de Murrupula"),
    MALEMA("Escola Secundária de Malema"),
    ERATI("Escola Secundária de Eráti"),
    MEMBA("Escola Secundária de Memba"),
    MOGINCUAL("Escola Secundária de Mogincual"),
    MOMA("Escola Secundária de Moma"),
    MOSSURIL("Escola Secundária de Mossuril"),
    MUECATE("Escola Secundária de Muecate"),
    LALAUA("Escola Secundária de Lalaua"),
    MECUBURI("Escola Secundária de Mecubúri"),
    NACAROA("Escola Secundária de Nacarôa"),
    LARDE("Escola Secundária de Larde");

    private final String displayName;

    NampulaSchool(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() { return displayName; }
    public String getNormalizedName() { return NameNormalizer.normalize(displayName); }

    public static NampulaSchool findByNormalized(String input) {
        String norm = NameNormalizer.normalize(input);
        if (norm == null) return null;
        for (NampulaSchool s : values()) {
            if (s.getNormalizedName().equals(norm)) return s;
        }
        return null;
    }
}
