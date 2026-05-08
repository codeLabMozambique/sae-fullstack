package codelab.api.smart.sae.user.repository;

import codelab.api.smart.sae.user.model.StudentGradeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentGradeRepository extends JpaRepository<StudentGradeEntity, Long> {

    List<StudentGradeEntity> findByClassroomIdAndSubjectIdAndPeriod(
            Long classroomId, Long subjectId, String period);

    Optional<StudentGradeEntity> findByStudentIdAndClassroomIdAndSubjectIdAndPeriod(
            Long studentId, Long classroomId, Long subjectId, String period);
}
