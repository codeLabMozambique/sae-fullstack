package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.GradeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<GradeEntity, Long> {

    List<GradeEntity> findByClassroomIdAndSubjectIdAndAcademicYear(
            Long classroomId, Long subjectId, String academicYear);

    List<GradeEntity> findByClassroomIdAndAcademicYear(Long classroomId, String academicYear);

    Optional<GradeEntity> findByStudentIdAndClassroomIdAndSubjectIdAndAcademicYear(
            Long studentId, Long classroomId, Long subjectId, String academicYear);
}
