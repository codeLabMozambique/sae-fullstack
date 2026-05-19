package codelab.api.smart.sae.forum.repository;

import codelab.api.smart.sae.forum.model.ProfessorCertificateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfessorCertificateRepository extends JpaRepository<ProfessorCertificateEntity, Long> {

    List<ProfessorCertificateEntity> findByProfessorUsernameOrderByIssuedAtDesc(String professorUsername);

    List<ProfessorCertificateEntity> findByIsPublicTrueOrderByIssuedAtDesc();

    Optional<ProfessorCertificateEntity> findByProfessorUsernameAndDiscipline(String professorUsername, String discipline);

    boolean existsByProfessorUsernameAndDiscipline(String professorUsername, String discipline);
}
