package codelab.api.smart.sae.forum.repository;

import codelab.api.smart.sae.forum.enums.ValidationStatus;
import codelab.api.smart.sae.forum.model.CollaborativeAnswerEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CollaborativeAnswerRepository extends JpaRepository<CollaborativeAnswerEntity, Long> {

    List<CollaborativeAnswerEntity> findByQuestionIdOrderByCreatedAtAsc(Long questionId);

    Page<CollaborativeAnswerEntity> findByValidationStatusAndRejectedByIsNull(
        ValidationStatus validationStatus, Pageable pageable
    );

    List<CollaborativeAnswerEntity> findByValidationStatusAndCreatedAtAfter(
        ValidationStatus validationStatus, LocalDateTime after
    );
}
