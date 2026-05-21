package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.ClassLevelEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassLevelRepository extends JpaRepository<ClassLevelEntity, Long> {
    List<ClassLevelEntity> findByStatus(EntityState status);
    boolean existsByNormalizedName(String normalizedName);
    Optional<ClassLevelEntity> findByNormalizedName(String normalizedName);
}
