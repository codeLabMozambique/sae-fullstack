package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.ProfessorAssignmentDTO;
import codelab.api.smart.sae.academic.model.ClassroomEntity;
import codelab.api.smart.sae.academic.model.ProfessorAssignmentEntity;
import codelab.api.smart.sae.academic.model.SubjectEntity;
import codelab.api.smart.sae.academic.repository.ClassroomRepository;
import codelab.api.smart.sae.academic.repository.ProfessorAssignmentRepository;
import codelab.api.smart.sae.academic.repository.SubjectRepository;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfessorAssignmentService {

    @Autowired
    private ProfessorAssignmentRepository professorAssignmentRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    public List<ProfessorAssignmentDTO> findAllActive() {
        return professorAssignmentRepository.findByStatus(EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProfessorAssignmentDTO findById(Long id) {
        return professorAssignmentRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public ProfessorAssignmentDTO save(ProfessorAssignmentDTO dto) {
        ProfessorAssignmentEntity entity = new ProfessorAssignmentEntity();
        updateEntityFromDTO(entity, dto);
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(professorAssignmentRepository.save(entity));
    }

    @Transactional
    public ProfessorAssignmentDTO update(ProfessorAssignmentDTO dto) {
        return professorAssignmentRepository.findById(dto.getId())
                .map(entity -> {
                    updateEntityFromDTO(entity, dto);
                    return convertToDTO(professorAssignmentRepository.save(entity));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(Long id) {
        professorAssignmentRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            professorAssignmentRepository.save(entity);
        });
    }

    private ProfessorAssignmentDTO convertToDTO(ProfessorAssignmentEntity entity) {
        ProfessorAssignmentDTO dto = new ProfessorAssignmentDTO();
        dto.setId(entity.getId());
        dto.setProfessorId(entity.getProfessorId());
        dto.setClassroomId(entity.getClassroom().getId());
        dto.setSubjectId(entity.getSubject().getId());
        return dto;
    }

    private void updateEntityFromDTO(ProfessorAssignmentEntity entity, ProfessorAssignmentDTO dto) {
        entity.setProfessorId(dto.getProfessorId());

        if (dto.getClassroomId() != null) {
            ClassroomEntity classroom = classroomRepository.findById(dto.getClassroomId())
                    .orElseThrow(() -> new RuntimeException("Classroom not found"));
            entity.setClassroom(classroom);
        }

        if (dto.getSubjectId() != null) {
            SubjectEntity subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Subject not found"));
            entity.setSubject(subject);
        }
    }
}
