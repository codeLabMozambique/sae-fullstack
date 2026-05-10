package codelab.api.smart.sae.quiz.repository;

import codelab.api.smart.sae.quiz.model.QuizOptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuizOptionRepository extends JpaRepository<QuizOptionEntity, Long> {
    List<QuizOptionEntity> findByQuestionId(Long questionId);
    Optional<QuizOptionEntity> findByQuestionIdAndCorretaTrue(Long questionId);
}
