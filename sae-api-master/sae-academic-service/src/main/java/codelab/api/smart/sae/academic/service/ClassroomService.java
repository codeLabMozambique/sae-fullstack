package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.ClassroomDTO;
import codelab.api.smart.sae.academic.model.ClassLevelEntity;
import codelab.api.smart.sae.academic.model.ClassroomEntity;
import codelab.api.smart.sae.academic.model.SchoolEntity;
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

    public List<ClassroomDTO> findAllActive() {
        return classroomRepository.findByStatus(EntityState.ACTIVE).stream()
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
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(classroomRepository.save(entity));
    }

    @Transactional
    public ClassroomDTO update(ClassroomDTO dto) {
        return classroomRepository.findById(dto.getId())
                .map(entity -> {
                    updateEntityFromDTO(entity, dto);
                    return convertToDTO(classroomRepository.save(entity));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(Long id) {
        classroomRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            classroomRepository.save(entity);
        });
    }

    private ClassroomDTO convertToDTO(ClassroomEntity entity) {
        ClassroomDTO dto = new ClassroomDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setSchoolId(entity.getSchool().getId());
        dto.setClassLevelId(entity.getClassLevel().getId());
        dto.setShift(entity.getShift());
        dto.setAcademicYear(entity.getAcademicYear());
        return dto;
    }

    private void updateEntityFromDTO(ClassroomEntity entity, ClassroomDTO dto) {
        entity.setName(dto.getName());
        entity.setShift(dto.getShift());
        entity.setAcademicYear(dto.getAcademicYear());

        if (dto.getSchoolId() != null) {
            SchoolEntity school = schoolRepository.findById(dto.getSchoolId())
                    .orElseThrow(() -> new RuntimeException("School not found"));
            entity.setSchool(school);
        }

        if (dto.getClassLevelId() != null) {
            ClassLevelEntity classLevel = classLevelRepository.findById(dto.getClassLevelId())
                    .orElseThrow(() -> new RuntimeException("Class Level not found"));
            entity.setClassLevel(classLevel);
        }
    }
}
