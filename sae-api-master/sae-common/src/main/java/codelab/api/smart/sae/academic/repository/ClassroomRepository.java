package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.ClassroomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassroomRepository extends JpaRepository<ClassroomEntity, Long> {
}
