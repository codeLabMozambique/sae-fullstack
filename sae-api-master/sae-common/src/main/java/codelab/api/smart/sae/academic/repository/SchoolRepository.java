package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.SchoolEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchoolRepository extends JpaRepository<SchoolEntity, Long> {
}
