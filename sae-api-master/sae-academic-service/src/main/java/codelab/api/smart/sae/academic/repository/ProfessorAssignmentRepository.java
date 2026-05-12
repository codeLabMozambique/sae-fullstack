package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.ProfessorAssignmentEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfessorAssignmentRepository extends JpaRepository<ProfessorAssignmentEntity, Long> {
    List<ProfessorAssignmentEntity> findByStatus(EntityState status);
    List<ProfessorAssignmentEntity> findByClassroomIdInAndStatus(List<Long> classroomIds, EntityState status);
    List<ProfessorAssignmentEntity> findByProfessorIdAndStatus(Long professorId, EntityState status);
    List<ProfessorAssignmentEntity> findByClassroom_IdAndStatus(Long classroomId, EntityState status);
    List<ProfessorAssignmentEntity> findByClassroom_IdAndSubject_IdAndStatus(Long classroomId, Long subjectId, EntityState status);
    List<ProfessorAssignmentEntity> findBySubject_IdAndStatus(Long subjectId, EntityState status);
}
