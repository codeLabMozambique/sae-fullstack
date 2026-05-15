package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.ClassLevelSubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassLevelSubjectRepository extends JpaRepository<ClassLevelSubjectEntity, Long> {

    // ── por escola + nível (fonte de verdade) ──────────────────────────────
    List<ClassLevelSubjectEntity> findBySchoolIdAndClassLevelIdAndAcademicGroupIsNull(Long schoolId, Long classLevelId);
    List<ClassLevelSubjectEntity> findBySchoolIdAndClassLevelIdAndAcademicGroupId(Long schoolId, Long classLevelId, Long academicGroupId);
    List<ClassLevelSubjectEntity> findBySchoolIdAndClassLevelId(Long schoolId, Long classLevelId);

    // verificação de duplicado
    boolean existsBySchoolIdAndClassLevelIdAndSubjectIdAndAcademicGroupIsNull(Long schoolId, Long classLevelId, Long subjectId);
    boolean existsBySchoolIdAndClassLevelIdAndSubjectIdAndAcademicGroupId(Long schoolId, Long classLevelId, Long subjectId, Long academicGroupId);

    // ── legados (sem escola) — mantidos durante migração ──────────────────
    List<ClassLevelSubjectEntity> findByClassLevelId(Long classLevelId);
    List<ClassLevelSubjectEntity> findByClassLevelIdAndAcademicGroupIsNull(Long classLevelId);
    List<ClassLevelSubjectEntity> findByClassLevelIdAndAcademicGroupId(Long classLevelId, Long academicGroupId);
    List<ClassLevelSubjectEntity> findByClassLevelIdAndTurmaGroupIsNull(Long classLevelId);
    List<ClassLevelSubjectEntity> findByClassLevelIdAndTurmaGroup(Long classLevelId, String turmaGroup);
    boolean existsByClassLevelIdAndSubjectIdAndAcademicGroupIsNull(Long classLevelId, Long subjectId);
    boolean existsByClassLevelIdAndSubjectIdAndAcademicGroupId(Long classLevelId, Long subjectId, Long academicGroupId);
}
