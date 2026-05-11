package codelab.api.smart.sae.academic.repository;

import codelab.api.smart.sae.academic.model.ClassLevelSubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassLevelSubjectRepository extends JpaRepository<ClassLevelSubjectEntity, Long> {

    List<ClassLevelSubjectEntity> findByClassLevelIdAndTurmaGroupIsNull(Long classLevelId);

    List<ClassLevelSubjectEntity> findByClassLevelIdAndTurmaGroup(Long classLevelId, String turmaGroup);
}
