package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.SubjectEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<SubjectEntity, Long> {
    List<SubjectEntity> findByStatus(EntityState status);
}
