package codelab.api.smart.sae.forum.repository;

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

@Repository
public interface ForumQuestionRepository extends JpaRepository<ForumQuestionEntity, Long> {

    @Query("""
        SELECT q FROM ForumQuestionEntity q
        WHERE (:disciplina IS NULL OR q.disciplina = :disciplina)
          AND (:questionType IS NULL OR q.questionType = :questionType)
          AND (:status IS NULL OR q.status = :status)
        ORDER BY q.createdAt DESC
    """)
    Page<ForumQuestionEntity> findWithFilters(
        @Param("disciplina") codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina,
        @Param("questionType") QuestionType questionType,
        @Param("status") QuestionStatus status,
        Pageable pageable
    );

    List<ForumQuestionEntity> findByDisciplina(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina);

    java.util.Optional<ForumQuestionEntity> findFirstByDisciplinaAndQuestionTypeOrderByCreatedAtAsc(
        codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina, QuestionType type);

    java.util.Optional<ForumQuestionEntity> findFirstByDisciplinaAndQuestionTypeAndCreatedByOrderByCreatedAtAsc(
        codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina, QuestionType type, String createdBy);
}
