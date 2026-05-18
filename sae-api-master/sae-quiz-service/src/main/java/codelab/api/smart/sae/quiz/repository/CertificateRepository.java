package codelab.api.smart.sae.quiz.repository;

import codelab.api.smart.sae.quiz.model.CertificateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<CertificateEntity, Long> {
    List<CertificateEntity> findByStudentUsernameOrderByIssuedAtDesc(String username);
    Optional<CertificateEntity> findByQuizIdAndStudentUsername(Long quizId, String username);
}
