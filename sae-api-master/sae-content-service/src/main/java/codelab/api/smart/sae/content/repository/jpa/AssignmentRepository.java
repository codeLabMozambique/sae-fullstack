package codelab.api.smart.sae.content.repository.jpa;

import codelab.api.smart.sae.content.model.jpa.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    /** Tarefas criadas por um professor — opcionalmente filtrado por turma. */
    @Query("SELECT a FROM Assignment a WHERE a.createdBy = :createdBy " +
           "AND (:classroomId IS NULL OR a.classroomId = :classroomId) " +
           "ORDER BY a.createdAt DESC")
    List<Assignment> findByCreatedBy(@Param("createdBy") String createdBy,
                                     @Param("classroomId") Long classroomId);

    /** Tarefas de uma ou várias turmas (para o aluno). */
    @Query("SELECT a FROM Assignment a WHERE a.classroomId IN :classroomIds " +
           "ORDER BY a.deadline ASC")
    List<Assignment> findByClassroomIds(@Param("classroomIds") Collection<Long> classroomIds);
}
