package codelab.api.smart.sae.quiz.repository;

import codelab.api.smart.sae.quiz.model.QuizAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttemptEntity, Long> {
    List<QuizAttemptEntity> findByStudentUsernameAndCompleted(String studentUsername, boolean completed);
    List<QuizAttemptEntity> findByQuizIdAndStudentUsernameAndCompleted(Long quizId, String studentUsername, boolean completed);
    List<QuizAttemptEntity> findByQuizIdAndCompleted(Long quizId, boolean completed);
    int countByQuizIdAndCompleted(Long quizId, boolean completed);
}
