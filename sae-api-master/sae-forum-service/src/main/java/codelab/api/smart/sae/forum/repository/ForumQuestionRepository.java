package codelab.api.smart.sae.forum.repository;

import codelab.api.smart.sae.forum.enums.DisciplinaEnum;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForumQuestionRepository extends JpaRepository<ForumQuestionEntity, Long> {

    // ── Filtro dinâmico com native query ────────────────────────────────────
    @Query(
        value = "SELECT * FROM forum_question " +
                "WHERE (:disciplinaName IS NULL OR area = :disciplinaName) " +
                "AND (:questionTypeName IS NULL OR question_type = :questionTypeName) " +
                "AND (:statusName IS NULL OR status = :statusName) " +
                "ORDER BY created_at DESC",
        countQuery = "SELECT count(*) FROM forum_question " +
                     "WHERE (:disciplinaName IS NULL OR area = :disciplinaName) " +
                     "AND (:questionTypeName IS NULL OR question_type = :questionTypeName) " +
                     "AND (:statusName IS NULL OR status = :statusName)",
        nativeQuery = true
    )
    Page<ForumQuestionEntity> findWithFilters(
        @Param("disciplinaName")    String disciplinaName,
        @Param("questionTypeName")  String questionTypeName,
        @Param("statusName")        String statusName,
        Pageable pageable
    );

    // ── Legado: por DisciplinaEnum ───────────────────────────────────────────
    List<ForumQuestionEntity> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    List<ForumQuestionEntity> findByDisciplina(DisciplinaEnum disciplina);

    Optional<ForumQuestionEntity> findFirstByDisciplinaAndQuestionTypeOrderByCreatedAtAsc(
        DisciplinaEnum disciplina, QuestionType type);

    Optional<ForumQuestionEntity> findFirstByDisciplinaAndQuestionTypeAndCreatedByOrderByCreatedAtAsc(
        DisciplinaEnum disciplina, QuestionType type, String createdBy);

    List<ForumQuestionEntity> findByQuestionTypeAndDisciplinaInAndStatus(
        QuestionType questionType, List<DisciplinaEnum> disciplinas, QuestionStatus status);

    List<ForumQuestionEntity> findByQuestionTypeAndDisciplinaIn(
        QuestionType questionType, List<DisciplinaEnum> disciplinas);

    // ── Por subjectId (novo modelo) ──────────────────────────────────────────

    /** Sala colaborativa de uma turma específica (subjectId + classroomId) */
    Optional<ForumQuestionEntity> findFirstBySubjectIdAndClassroomIdAndQuestionTypeOrderByCreatedAtAsc(
        Long subjectId, Long classroomId, QuestionType type);

    /** Sala colaborativa por disciplina (broadcast — sem turma específica) */
    Optional<ForumQuestionEntity> findFirstBySubjectIdAndQuestionTypeAndClassroomIdIsNullOrderByCreatedAtAsc(
        Long subjectId, QuestionType type);

    /** Sala expert (1-on-1 aluno+professor) por subjectId + classroomId */
    Optional<ForumQuestionEntity> findFirstBySubjectIdAndClassroomIdAndQuestionTypeAndCreatedByOrderByCreatedAtAsc(
        Long subjectId, Long classroomId, QuestionType type, String createdBy);

    /** Sala expert por disciplina (sem turma) */
    Optional<ForumQuestionEntity> findFirstBySubjectIdAndQuestionTypeAndCreatedByAndClassroomIdIsNullOrderByCreatedAtAsc(
        Long subjectId, QuestionType type, String createdBy);

    /** Perguntas pendentes ESPECIALIZADO para um conjunto de subjectIds */
    List<ForumQuestionEntity> findByQuestionTypeAndSubjectIdInAndStatus(
        QuestionType questionType, List<Long> subjectIds, QuestionStatus status);

    /** Perguntas COLABORATIVO para um conjunto de subjectIds */
    List<ForumQuestionEntity> findByQuestionTypeAndSubjectIdIn(
        QuestionType questionType, List<Long> subjectIds);

    /** Perguntas COLABORATIVO de uma turma específica */
    List<ForumQuestionEntity> findByQuestionTypeAndClassroomIdAndSubjectId(
        QuestionType questionType, Long classroomId, Long subjectId);

    /** Perguntas de uma turma (para filtro no inbox do professor) */
    List<ForumQuestionEntity> findByQuestionTypeAndSubjectIdInAndClassroomIdAndStatus(
        QuestionType questionType, List<Long> subjectIds, Long classroomId, QuestionStatus status);

    /** Perguntas de uma escola específica */
    List<ForumQuestionEntity> findBySchoolId(Long schoolId);

    /** Salas expert directamente endereçadas a um professor (via mentionedProfessorUsername) */
    List<ForumQuestionEntity> findByMentionedProfessorUsernameAndQuestionTypeAndStatus(
        String mentionedProfessorUsername, QuestionType questionType, QuestionStatus status);

    /** Perguntas num intervalo de datas */
    @Query(value = "SELECT * FROM forum_question WHERE created_at >= :from AND created_at <= :to " +
                   "AND (:schoolId IS NULL OR school_id = :schoolId) " +
                   "AND (:disciplina IS NULL OR area = :disciplina) " +
                   "ORDER BY created_at DESC", nativeQuery = true)
    List<ForumQuestionEntity> findByDateRangeAndFilters(
        @Param("from")      java.time.LocalDateTime from,
        @Param("to")        java.time.LocalDateTime to,
        @Param("schoolId")  Long schoolId,
        @Param("disciplina") String disciplina
    );
}
