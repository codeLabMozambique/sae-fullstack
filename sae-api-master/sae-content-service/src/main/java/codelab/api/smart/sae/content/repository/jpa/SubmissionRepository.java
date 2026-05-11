package codelab.api.smart.sae.content.repository.jpa;

import codelab.api.smart.sae.content.model.jpa.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByAssignmentIdAndStudentUsername(Long assignmentId, String studentUsername);

    List<Submission> findByAssignmentIdOrderBySubmittedAtAsc(Long assignmentId);

    List<Submission> findByStudentUsernameOrderBySubmittedAtDesc(String studentUsername);

    boolean existsByAssignmentIdAndStudentUsername(Long assignmentId, String studentUsername);
}
