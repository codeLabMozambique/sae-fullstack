package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.CurriculumEntryDTO;
import codelab.api.smart.sae.academic.model.AcademicGroupEntity;
import codelab.api.smart.sae.academic.model.ClassLevelEntity;
import codelab.api.smart.sae.academic.model.ClassLevelSubjectEntity;
import codelab.api.smart.sae.academic.model.SchoolEntity;
import codelab.api.smart.sae.academic.model.SubjectEntity;
import codelab.api.smart.sae.academic.repository.AcademicGroupRepository;
import codelab.api.smart.sae.academic.repository.ClassLevelRepository;
import codelab.api.smart.sae.academic.repository.ClassLevelSubjectRepository;
import codelab.api.smart.sae.academic.repository.SchoolRepository;
import codelab.api.smart.sae.academic.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class CurriculumService {

    @Autowired private ClassLevelSubjectRepository curriculumRepo;
    @Autowired private ClassLevelRepository        classLevelRepo;
    @Autowired private SubjectRepository           subjectRepo;
    @Autowired private AcademicGroupRepository     groupRepo;
    @Autowired private SchoolRepository            schoolRepo;

    public List<CurriculumEntryDTO> findBySchoolAndLevelAndGroup(Long schoolId, Long classLevelId, Long groupId) {
        List<ClassLevelSubjectEntity> entries = (groupId == null)
                ? curriculumRepo.findBySchoolIdAndClassLevelIdAndAcademicGroupIsNull(schoolId, classLevelId)
                : curriculumRepo.findBySchoolIdAndClassLevelIdAndAcademicGroupId(schoolId, classLevelId, groupId);
        return entries.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<CurriculumEntryDTO> findBySchoolAndLevel(Long schoolId, Long classLevelId) {
        return curriculumRepo.findBySchoolIdAndClassLevelId(schoolId, classLevelId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public CurriculumEntryDTO addEntry(Long schoolId, Long classLevelId, Long subjectId, Long groupId) {
        boolean exists = (groupId == null)
                ? curriculumRepo.existsBySchoolIdAndClassLevelIdAndSubjectIdAndAcademicGroupIsNull(schoolId, classLevelId, subjectId)
                : curriculumRepo.existsBySchoolIdAndClassLevelIdAndSubjectIdAndAcademicGroupId(schoolId, classLevelId, subjectId, groupId);
        if (exists) throw new IllegalStateException("Disciplina já existe no currículo deste nível/grupo.");

        SchoolEntity school = schoolRepo.findById(Objects.requireNonNull(schoolId))
                .orElseThrow(() -> new IllegalArgumentException("Escola não encontrada: " + schoolId));
        ClassLevelEntity level = classLevelRepo.findById(Objects.requireNonNull(classLevelId))
                .orElseThrow(() -> new IllegalArgumentException("Nível não encontrado: " + classLevelId));
        SubjectEntity subject = subjectRepo.findById(Objects.requireNonNull(subjectId))
                .orElseThrow(() -> new IllegalArgumentException("Disciplina não encontrada: " + subjectId));

        ClassLevelSubjectEntity entry = new ClassLevelSubjectEntity();
        entry.setSchool(school);
        entry.setClassLevel(level);
        entry.setSubject(subject);

        if (groupId != null) {
            AcademicGroupEntity group = groupRepo.findById(groupId)
                    .orElseThrow(() -> new IllegalArgumentException("Grupo não encontrado: " + groupId));
            entry.setAcademicGroup(group);
        }

        return toDTO(curriculumRepo.save(entry));
    }

    @Transactional
    public void removeEntry(Long entryId) {
        Long id = Objects.requireNonNull(entryId);
        if (!curriculumRepo.existsById(id))
            throw new IllegalArgumentException("Entrada de currículo não encontrada: " + id);
        curriculumRepo.deleteById(id);
    }

    private CurriculumEntryDTO toDTO(ClassLevelSubjectEntity e) {
        CurriculumEntryDTO dto = new CurriculumEntryDTO();
        dto.setId(e.getId());
        if (e.getSchool() != null) {
            dto.setSchoolId(e.getSchool().getId());
            dto.setSchoolName(e.getSchool().getName());
        }
        dto.setClassLevelId(e.getClassLevel().getId());
        dto.setClassLevelName(e.getClassLevel().getName());
        dto.setSubjectId(e.getSubject().getId());
        dto.setSubjectName(e.getSubject().getName());
        dto.setSubjectCode(e.getSubject().getCode());
        if (e.getAcademicGroup() != null) {
            dto.setAcademicGroupId(e.getAcademicGroup().getId());
            dto.setAcademicGroupName(e.getAcademicGroup().getName());
        }
        return dto;
    }
}
