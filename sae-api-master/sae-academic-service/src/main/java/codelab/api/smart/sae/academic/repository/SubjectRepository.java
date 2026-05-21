package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.SubjectEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<SubjectEntity, Long> {
    List<SubjectEntity> findByStatus(EntityState status);
    List<SubjectEntity> findByStatusAndSchoolId(EntityState status, Long schoolId);
    List<SubjectEntity> findByStatusAndClassLevelId(EntityState status, Long classLevelId);
    List<SubjectEntity> findByStatusAndSchoolIdAndClassLevelId(EntityState status, Long schoolId, Long classLevelId);
    boolean existsByNormalizedName(String normalizedName);
    Optional<SubjectEntity> findByNormalizedName(String normalizedName);
}
