package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.catalog.CurriculumSubject;
import codelab.api.smart.sae.academic.dto.SubjectDTO;
import codelab.api.smart.sae.academic.exception.DuplicateEntityException;
import codelab.api.smart.sae.academic.model.ClassLevelSubjectEntity;
import codelab.api.smart.sae.academic.model.ClassroomEntity;
import codelab.api.smart.sae.academic.model.SubjectEntity;
import codelab.api.smart.sae.academic.repository.ClassLevelSubjectRepository;
import codelab.api.smart.sae.academic.repository.ClassroomRepository;
import codelab.api.smart.sae.academic.repository.SubjectRepository;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private ClassLevelSubjectRepository classLevelSubjectRepository;

    public List<SubjectDTO> findAllActive() {
        return subjectRepository.findByStatus(EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    public List<SubjectDTO> findBySchool(Long schoolId) {
        return subjectRepository.findByStatusAndSchoolId(EntityState.ACTIVE, schoolId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SubjectDTO> findByClassLevel(Long classLevelId) {
        return subjectRepository.findByStatusAndClassLevelId(EntityState.ACTIVE, classLevelId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<SubjectDTO> findBySchoolAndClassLevel(Long schoolId, Long classLevelId) {
        return subjectRepository.findByStatusAndSchoolIdAndClassLevelId(EntityState.ACTIVE, schoolId, classLevelId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SubjectDTO findById(Long id) {

        return subjectRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public SubjectDTO save(SubjectDTO dto) {
        CurriculumSubject cs = CurriculumSubject.findByNormalized(dto.getName());
        if (cs == null) {
            throw new IllegalArgumentException(
                "Disciplina \"" + dto.getName() + "\" não reconhecida no currículo MEC do ensino secundário.");
        }
        String normalized = cs.getNormalizedName();
        if (subjectRepository.existsByNormalizedName(normalized)) {
            throw new DuplicateEntityException("Disciplina já existe: " + cs.getDisplayName());
        }
        SubjectEntity entity = new SubjectEntity();
        entity.setName(cs.getDisplayName());
        entity.setNormalizedName(normalized);
        entity.setDescription(dto.getDescription());
        entity.setCode(dto.getCode());
        entity.setClassLevelId(dto.getClassLevelId());
        entity.setSchoolId(dto.getSchoolId());
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(subjectRepository.save(entity));
    }

    @Transactional
    public SubjectDTO update(SubjectDTO dto) {
        CurriculumSubject cs = CurriculumSubject.findByNormalized(dto.getName());
        if (cs == null) {
            throw new IllegalArgumentException(
                "Disciplina \"" + dto.getName() + "\" não reconhecida no currículo MEC do ensino secundário.");
        }
        String normalized = cs.getNormalizedName();
        return subjectRepository.findById(java.util.Objects.requireNonNull(dto.getId()))
                .map(entity -> {
                    boolean nameChanged = !normalized.equals(entity.getNormalizedName());
                    if (nameChanged && subjectRepository.existsByNormalizedName(normalized)) {
                        throw new DuplicateEntityException("Disciplina já existe: " + cs.getDisplayName());
                    }
                    entity.setName(cs.getDisplayName());
                    entity.setNormalizedName(normalized);
                    entity.setDescription(dto.getDescription());
                    entity.setCode(dto.getCode());
                    entity.setClassLevelId(dto.getClassLevelId());
                    entity.setSchoolId(dto.getSchoolId());
                    return convertToDTO(subjectRepository.save(entity));
                }).orElse(null);
    }

    public List<SubjectDTO> findByClassroomId(Long classroomId) {
        ClassroomEntity classroom = classroomRepository.findById(classroomId).orElse(null);
        if (classroom == null) return List.of();

        Long classLevelId = classroom.getClassLevel().getId();
        Long groupId = classroom.getAcademicGroup() != null ? classroom.getAcademicGroup().getId() : null;

        Map<Long, SubjectDTO> result = new LinkedHashMap<>();
        for (ClassLevelSubjectEntity cls : classLevelSubjectRepository.findByClassLevelIdAndAcademicGroupIsNull(classLevelId)) {
            SubjectEntity s = cls.getSubject();
            result.put(java.util.Objects.requireNonNull(s.getId()), convertToDTO(s));
        }

        // disciplinas específicas do grupo para ciclo médio (11ª/12ª)
        if (groupId != null) {
            for (ClassLevelSubjectEntity cls : classLevelSubjectRepository.findByClassLevelIdAndAcademicGroupId(classLevelId, groupId)) {
                SubjectEntity s = cls.getSubject();
                result.put(java.util.Objects.requireNonNull(s.getId()), convertToDTO(s));
            }
        }

        return new ArrayList<>(result.values());
    }

    public List<SubjectDTO> findByClassLevelAndGroup(Long classLevelId, Long groupId) {
        Map<Long, SubjectDTO> result = new LinkedHashMap<>();
        for (ClassLevelSubjectEntity cls : classLevelSubjectRepository.findByClassLevelIdAndAcademicGroupIsNull(classLevelId)) {
            SubjectEntity s = cls.getSubject();
            result.put(java.util.Objects.requireNonNull(s.getId()), convertToDTO(s));
        }
        if (groupId != null) {
            for (ClassLevelSubjectEntity cls : classLevelSubjectRepository.findByClassLevelIdAndAcademicGroupId(classLevelId, groupId)) {
                SubjectEntity s = cls.getSubject();
                result.put(java.util.Objects.requireNonNull(s.getId()), convertToDTO(s));
            }
        }
        return new ArrayList<>(result.values());
    }

    @Transactional
    public void deactivate(@org.springframework.lang.NonNull Long id) {
        subjectRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            subjectRepository.save(entity);
        });
    }

    private SubjectDTO convertToDTO(SubjectEntity entity) {
        SubjectDTO dto = new SubjectDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setCode(entity.getCode());
        dto.setClassLevelId(entity.getClassLevelId());
        dto.setSchoolId(entity.getSchoolId());
        return dto;
    }


}
