package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.ClassroomDTO;
import codelab.api.smart.sae.academic.model.AcademicGroupEntity;
import codelab.api.smart.sae.academic.model.ClassLevelEntity;
import codelab.api.smart.sae.academic.model.ClassroomEntity;
import codelab.api.smart.sae.academic.model.SchoolEntity;
import codelab.api.smart.sae.academic.repository.AcademicGroupRepository;
import codelab.api.smart.sae.academic.repository.ClassLevelRepository;
import codelab.api.smart.sae.academic.repository.ClassroomRepository;
import codelab.api.smart.sae.academic.repository.SchoolRepository;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClassroomService {

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private ClassLevelRepository classLevelRepository;

    @Autowired
    private AcademicGroupRepository academicGroupRepository;

    public List<ClassroomDTO> findAllActive() {
        return classroomRepository.findByStatus(EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ClassroomDTO> findBySchool(Long schoolId) {
        return classroomRepository.findBySchoolIdAndStatus(schoolId, EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ClassroomDTO> findBySchoolAndClassLevel(Long schoolId, Long classLevelId) {
        return classroomRepository.findBySchoolIdAndClassLevelIdAndStatus(schoolId, classLevelId, EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ClassroomDTO> findByClassLevel(Long classLevelId) {
        return classroomRepository.findByClassLevelIdAndStatus(classLevelId, EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ClassroomDTO findById(Long id) {

        return classroomRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public ClassroomDTO save(ClassroomDTO dto) {
        ClassroomEntity entity = new ClassroomEntity();
        updateEntityFromDTO(entity, dto);
        validateCycleGroupConsistency(entity);
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(classroomRepository.save(entity));
    }

    @Transactional
    public ClassroomDTO update(ClassroomDTO dto) {
        return classroomRepository.findById(java.util.Objects.requireNonNull(dto.getId()))
                .map(entity -> {
                    updateEntityFromDTO(entity, dto);
                    validateCycleGroupConsistency(entity);
                    return convertToDTO(java.util.Objects.requireNonNull(classroomRepository.save(entity)));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(@org.springframework.lang.NonNull Long id) {
        classroomRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            classroomRepository.save(entity);
        });
    }

    @Transactional
    public ClassroomDTO setDirector(Long classroomId, Long directorId) {
        return classroomRepository.findById(java.util.Objects.requireNonNull(classroomId))
                .map(entity -> {
                    entity.setDirectorId(directorId);
                    return convertToDTO(java.util.Objects.requireNonNull(classroomRepository.save(entity)));
                }).orElse(null);
    }

    public ClassroomDTO findByDirectorId(Long professorId) {
        List<ClassroomEntity> found = classroomRepository.findByDirectorIdAndStatus(professorId, EntityState.ACTIVE);
        return found.isEmpty() ? null : convertToDTO(found.get(0));
    }

    private void validateCycleGroupConsistency(ClassroomEntity entity) {
        if (entity.getClassLevel() == null) return;
        String cycle = entity.getClassLevel().getCycle();
        if ("MEDIO".equals(cycle) && entity.getAcademicGroup() == null) {
            throw new RuntimeException("Turmas do ciclo médio (11ª/12ª) requerem um grupo académico");
        }
        if ("BASICO".equals(cycle)) {
            entity.setAcademicGroup(null);
        }
    }

    private ClassroomDTO convertToDTO(ClassroomEntity entity) {
        ClassroomDTO dto = new ClassroomDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setSchoolId(entity.getSchool().getId());
        dto.setClassLevelId(entity.getClassLevel().getId());
        dto.setShift(entity.getShift());
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setDirectorId(entity.getDirectorId());
        if (entity.getAcademicGroup() != null) {
            dto.setAcademicGroupId(entity.getAcademicGroup().getId());
            dto.setAcademicGroupName(entity.getAcademicGroup().getName());
        }
        return dto;
    }

    private void updateEntityFromDTO(ClassroomEntity entity, ClassroomDTO dto) {
        entity.setName(dto.getName());
        entity.setShift(dto.getShift());
        entity.setAcademicYear(dto.getAcademicYear());

        if (dto.getSchoolId() != null) {
            SchoolEntity school = schoolRepository.findById(java.util.Objects.requireNonNull(dto.getSchoolId()))
                    .orElseThrow(() -> new RuntimeException("School not found"));
            entity.setSchool(school);
        }

        if (dto.getClassLevelId() != null) {
            ClassLevelEntity classLevel = classLevelRepository.findById(java.util.Objects.requireNonNull(dto.getClassLevelId()))
                    .orElseThrow(() -> new RuntimeException("Class Level not found"));
            entity.setClassLevel(classLevel);
        }

        if (dto.getAcademicGroupId() != null) {
            AcademicGroupEntity group = academicGroupRepository.findById(dto.getAcademicGroupId())
                    .orElseThrow(() -> new RuntimeException("Academic Group not found"));
            entity.setAcademicGroup(group);
        } else {
            entity.setAcademicGroup(null);
        }
    }
}
