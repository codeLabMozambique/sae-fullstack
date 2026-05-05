package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.*;
import codelab.api.smart.sae.academic.model.*;
import codelab.api.smart.sae.academic.repository.*;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SchoolService {

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private ClassLevelRepository classLevelRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ProfessorAssignmentRepository professorAssignmentRepository;

    public List<SchoolDTO> findAllActive() {
        return schoolRepository.findByStatus(EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SchoolDTO findById(Long id) {
        return schoolRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    public SchoolFullDTO findFullById(Long id) {
        SchoolDTO school = findById(id);
        if (school == null) return null;

        SchoolFullDTO fullDTO = new SchoolFullDTO();
        fullDTO.setSchool(school);

        // 1. Get all active Class Levels
        List<ClassLevelEntity> classLevelEntities = classLevelRepository.findByStatus(EntityState.ACTIVE);

        // 2. Get School classrooms and their assignments
        List<ClassroomEntity> classroomEntities = classroomRepository.findBySchoolIdAndStatus(id, EntityState.ACTIVE);
        
        List<ProfessorAssignmentEntity> allAssignments = List.of();
        if (!classroomEntities.isEmpty()) {
            List<Long> classroomIds = classroomEntities.stream().map(ClassroomEntity::getId).collect(Collectors.toList());
            allAssignments = professorAssignmentRepository.findByClassroomIdInAndStatus(classroomIds, EntityState.ACTIVE);
        }

        final List<ProfessorAssignmentEntity> finalAssignments = allAssignments;

        // 3. Map Classrooms into their respective Class Levels
        List<ClassLevelFullDTO> classLevels = classLevelEntities.stream()
                .map(level -> {
                    ClassLevelFullDTO levelDTO = convertToClassLevelFullDTO(level);
                    
                    // Filter classrooms for THIS level
                    List<ClassroomFullDTO> classrooms = classroomEntities.stream()
                            .filter(c -> c.getClassLevel().getId().equals(level.getId()))
                            .map(c -> {
                                ClassroomFullDTO cDto = convertToClassroomFullDTO(c);
                                // Filter assignments for THIS classroom
                                List<ProfessorAssignmentFullDTO> assignments = finalAssignments.stream()
                                        .filter(a -> a.getClassroom().getId().equals(c.getId()))
                                        .map(this::convertToProfessorAssignmentFullDTO)
                                        .collect(Collectors.toList());
                                cDto.setAssignments(assignments);
                                return cDto;
                            })
                            .collect(Collectors.toList());
                    
                    levelDTO.setClassrooms(classrooms);
                    return levelDTO;
                })
                .filter(level -> !level.getClassrooms().isEmpty()) // Only show levels that have classrooms in this school
                .collect(Collectors.toList());

        fullDTO.setClassLevels(classLevels);

        // 4. Global Subject Catalog (Optional)
        fullDTO.setSubjects(subjectRepository.findByStatus(EntityState.ACTIVE).stream()
                .map(this::convertToSubjectDTO)
                .collect(Collectors.toList()));

        return fullDTO;
    }

    @Transactional
    public SchoolDTO save(SchoolDTO dto) {
        SchoolEntity entity = new SchoolEntity();
        updateEntityFromDTO(entity, dto);
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(schoolRepository.save(entity));
    }

    @Transactional
    public SchoolDTO update(SchoolDTO dto) {
        return schoolRepository.findById(dto.getId())
                .map(entity -> {
                    updateEntityFromDTO(entity, dto);
                    return convertToDTO(schoolRepository.save(entity));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(Long id) {
        schoolRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            schoolRepository.save(entity);
        });
    }

    private SchoolDTO convertToDTO(SchoolEntity entity) {
        SchoolDTO dto = new SchoolDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setAddress(entity.getAddress());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setCity(entity.getCity());
        return dto;
    }

    private void updateEntityFromDTO(SchoolEntity entity, SchoolDTO dto) {
        entity.setName(dto.getName());
        entity.setAddress(dto.getAddress());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        entity.setCity(dto.getCity());
    }

    private ClassroomDTO convertToClassroomDTO(ClassroomEntity entity) {
        ClassroomDTO dto = new ClassroomDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setSchoolId(entity.getSchool().getId());
        dto.setClassLevelId(entity.getClassLevel().getId());
        dto.setShift(entity.getShift());
        dto.setAcademicYear(entity.getAcademicYear());
        return dto;
    }

    private ClassroomFullDTO convertToClassroomFullDTO(ClassroomEntity entity) {
        ClassroomFullDTO dto = new ClassroomFullDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setClassLevel(convertToClassLevelDTO(entity.getClassLevel()));
        dto.setShift(entity.getShift());
        dto.setAcademicYear(entity.getAcademicYear());
        return dto;
    }

    private ClassLevelDTO convertToClassLevelDTO(ClassLevelEntity entity) {
        ClassLevelDTO dto = new ClassLevelDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        return dto;
    }

    private ClassLevelFullDTO convertToClassLevelFullDTO(ClassLevelEntity entity) {
        ClassLevelFullDTO dto = new ClassLevelFullDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        return dto;
    }

    private SubjectDTO convertToSubjectDTO(SubjectEntity entity) {
        SubjectDTO dto = new SubjectDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setCode(entity.getCode());
        return dto;
    }

    private ProfessorAssignmentDTO convertToProfessorAssignmentDTO(ProfessorAssignmentEntity entity) {
        ProfessorAssignmentDTO dto = new ProfessorAssignmentDTO();
        dto.setId(entity.getId());
        dto.setProfessorId(entity.getProfessorId());
        dto.setClassroomId(entity.getClassroom().getId());
        dto.setSubjectId(entity.getSubject().getId());
        return dto;
    }

    private ProfessorAssignmentFullDTO convertToProfessorAssignmentFullDTO(ProfessorAssignmentEntity entity) {
        ProfessorAssignmentFullDTO dto = new ProfessorAssignmentFullDTO();
        dto.setId(entity.getId());
        dto.setProfessorId(entity.getProfessorId());
        dto.setSubject(convertToSubjectDTO(entity.getSubject()));
        return dto;
    }
}
