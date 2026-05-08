package codelab.api.smart.sae.user.service;

import codelab.api.smart.sae.user.dto.GradeDTO;
import codelab.api.smart.sae.user.dto.SaveGradeDTO;
import codelab.api.smart.sae.user.model.StudentGradeEntity;
import codelab.api.smart.sae.user.repository.StudentGradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GradeService {

    @Autowired
    private StudentGradeRepository gradeRepository;

    public List<GradeDTO> getGrades(Long classroomId, Long subjectId, String period) {
        return gradeRepository.findByClassroomIdAndSubjectIdAndPeriod(classroomId, subjectId, period)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public GradeDTO saveGrade(SaveGradeDTO dto, Long professorId) {
        StudentGradeEntity entity = gradeRepository
                .findByStudentIdAndClassroomIdAndSubjectIdAndPeriod(
                        dto.getStudentId(), dto.getClassroomId(), dto.getSubjectId(), dto.getPeriod())
                .orElseGet(StudentGradeEntity::new);

        entity.setStudentId(dto.getStudentId());
        entity.setClassroomId(dto.getClassroomId());
        entity.setSubjectId(dto.getSubjectId());
        entity.setPeriod(dto.getPeriod());
        entity.setScore(dto.getScore());
        entity.setGradedBy(professorId);

        return toDTO(gradeRepository.save(entity));
    }

    private GradeDTO toDTO(StudentGradeEntity e) {
        GradeDTO dto = new GradeDTO();
        dto.setId(e.getId());
        dto.setStudentId(e.getStudentId());
        dto.setClassroomId(e.getClassroomId());
        dto.setSubjectId(e.getSubjectId());
        dto.setPeriod(e.getPeriod());
        dto.setScore(e.getScore());
        dto.setGradedBy(e.getGradedBy());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
