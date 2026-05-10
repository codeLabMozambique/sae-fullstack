package codelab.api.smart.sae.quiz.enums;

public enum DisciplinaEnum {
    MATEMATICA("Matemática"),
    FISICA("Física"),
    QUIMICA("Química"),
    BIOLOGIA("Biologia"),
    PORTUGUES("Português"),
    HISTORIA("História"),
    GEOGRAFIA("Geografia"),
    INGLES("Inglês"),
    FILOSOFIA("Filosofia"),
    INFORMATICA("Informática"),
    PROGRAMACAO("Programação"),
    ECONOMIA("Economia"),
    GERAL("Geral");

    private final String displayName;

    DisciplinaEnum(String displayName) { this.displayName = displayName; }

    public String getDisplayName() { return displayName; }
}
