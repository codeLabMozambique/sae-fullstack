package codelab.api.smart.sae.forum.enums;

public enum ForumScope {
    /** Pergunta dirigida a uma turma específica (escola + turma + disciplina → professor atribuído) */
    TURMA,
    /** Pergunta broadcast a todos os professores que leccionam essa disciplina */
    DISCIPLINA
}
