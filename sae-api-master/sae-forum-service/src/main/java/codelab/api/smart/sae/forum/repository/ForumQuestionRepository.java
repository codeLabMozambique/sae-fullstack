package codelab.api.smart.sae.forum.repository;

import codelab.api.smart.sae.forum.enums.DisciplinaEnum;
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

    /**
     * Filtro dinâmico com native query para evitar problema do Hibernate 6
     * com parâmetros enum nulos em JPQL (BindException / type mismatch).
     * Os enums são passados como String (.name()) pelo serviço.
     */
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

    List<ForumQuestionEntity> findByDisciplina(DisciplinaEnum disciplina);

    Optional<ForumQuestionEntity> findFirstByDisciplinaAndQuestionTypeOrderByCreatedAtAsc(
        DisciplinaEnum disciplina, QuestionType type);

    Optional<ForumQuestionEntity> findFirstByDisciplinaAndQuestionTypeAndCreatedByOrderByCreatedAtAsc(
        DisciplinaEnum disciplina, QuestionType type, String createdBy);
}
