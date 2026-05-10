package codelab.api.smart.sae.quiz.repository;

import codelab.api.smart.sae.quiz.model.QuizQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestionEntity, Long> {
    List<QuizQuestionEntity> findByQuizIdOrderByOrdemNumeroAsc(Long quizId);
    int countByQuizId(Long quizId);
}
