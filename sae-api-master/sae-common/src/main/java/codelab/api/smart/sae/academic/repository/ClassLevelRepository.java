package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.ClassLevelEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassLevelRepository extends JpaRepository<ClassLevelEntity, Long> {
}
