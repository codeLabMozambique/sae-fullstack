package codelab.api.smart.sae.quiz.repository;

import codelab.api.smart.sae.quiz.model.QuizAttemptAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswerEntity, Long> {
    List<QuizAttemptAnswerEntity> findByAttemptId(Long attemptId);
}
