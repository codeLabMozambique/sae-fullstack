package codelab.api.smart.sae.quiz.repository;

import codelab.api.smart.sae.quiz.enums.DisciplinaEnum;
import codelab.api.smart.sae.quiz.model.QuizEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizRepository extends JpaRepository<QuizEntity, Long> {
    List<QuizEntity> findByActiveTrue();
    List<QuizEntity> findByDisciplina(DisciplinaEnum disciplina);
    List<QuizEntity> findByDisciplinaAndActiveTrue(DisciplinaEnum disciplina);
    List<QuizEntity> findByCreatedBy(String createdBy);
    List<QuizEntity> findBySubjectId(Long subjectId);
    List<QuizEntity> findBySubjectIdAndActiveTrue(Long subjectId);
}
