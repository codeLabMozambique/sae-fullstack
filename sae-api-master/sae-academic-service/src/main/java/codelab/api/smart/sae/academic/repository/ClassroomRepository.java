package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.ClassroomEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassroomRepository extends JpaRepository<ClassroomEntity, Long> {
    List<ClassroomEntity> findByStatus(EntityState status);
    List<ClassroomEntity> findBySchoolIdAndStatus(Long schoolId, EntityState status);
    List<ClassroomEntity> findByDirectorIdAndStatus(Long directorId, EntityState status);
    List<ClassroomEntity> findBySchoolIdAndClassLevelIdAndStatus(Long schoolId, Long classLevelId, EntityState status);
    List<ClassroomEntity> findByClassLevelIdAndStatus(Long classLevelId, EntityState status);
}
