package codelab.api.smart.sae.user.repository;

import codelab.api.smart.sae.framework.jpa.EntityState;
import codelab.api.smart.sae.user.model.StudentEnrollmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollmentEntity, Long> {
    Optional<StudentEnrollmentEntity> findTopByStudentIdAndYearAndStatus(Long studentId, Integer year, EntityState status);
}
