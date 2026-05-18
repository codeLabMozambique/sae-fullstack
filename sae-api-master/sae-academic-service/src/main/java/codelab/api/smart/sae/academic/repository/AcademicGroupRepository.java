package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.AcademicGroupEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicGroupRepository extends JpaRepository<AcademicGroupEntity, Long> {
    List<AcademicGroupEntity> findBySchoolIdAndStatus(Long schoolId, EntityState status);
    List<AcademicGroupEntity> findByStatus(EntityState status);
}
