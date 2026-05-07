package codelab.api.smart.sae.forum.repository;

import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpertAnswerRepository extends JpaRepository<ExpertAnswerEntity, Long> {

    List<ExpertAnswerEntity> findByQuestionIdOrderByCreatedAtAsc(Long questionId);

    Optional<ExpertAnswerEntity> findByQuestionIdAndAcceptedTrue(Long questionId);
}
