package codelab.api.smart.sae.academic.catalog;

import codelab.api.smart.sae.academic.util.NameNormalizer;

public enum ClassLevelDefinition {

    CLASSE_8("8ª Classe", "BASICO"),
    CLASSE_9("9ª Classe", "BASICO"),
    CLASSE_10("10ª Classe", "BASICO"),
    CLASSE_11("11ª Classe", "MEDIO"),
    CLASSE_12("12ª Classe", "MEDIO");

    private final String displayName;
    private final String cycle;

    ClassLevelDefinition(String displayName, String cycle) {
        this.displayName = displayName;
        this.cycle = cycle;
    }

    public String getDisplayName() { return displayName; }
    public String getCycle() { return cycle; }
    public String getNormalizedName() { return NameNormalizer.normalize(displayName); }

    public static ClassLevelDefinition findByNormalized(String input) {
        String norm = NameNormalizer.normalize(input);
        if (norm == null) return null;
        for (ClassLevelDefinition def : values()) {
            if (def.getNormalizedName().equals(norm)) return def;
        }
        return null;
    }
}
