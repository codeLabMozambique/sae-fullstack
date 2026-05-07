package codelab.api.smart.sae.user.repository;

import codelab.api.smart.sae.user.model.ProfessorProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfessorProfileRepository extends JpaRepository<ProfessorProfileEntity, Long> {

    Optional<ProfessorProfileEntity> findByUser_Id(Long userId);
}
