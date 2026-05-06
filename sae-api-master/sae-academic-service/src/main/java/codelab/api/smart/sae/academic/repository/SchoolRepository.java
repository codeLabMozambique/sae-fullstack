package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.SchoolEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolRepository extends JpaRepository<SchoolEntity, Long> {
    List<SchoolEntity> findByStatus(EntityState status);
}
