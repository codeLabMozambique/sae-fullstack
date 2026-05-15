package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.AcademicGroupDTO;
import codelab.api.smart.sae.academic.model.AcademicGroupEntity;
import codelab.api.smart.sae.academic.repository.AcademicGroupRepository;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AcademicGroupService {

    @Autowired
    private AcademicGroupRepository academicGroupRepository;

    public List<AcademicGroupDTO> findBySchool(Long schoolId) {
        return academicGroupRepository.findBySchoolIdAndStatus(schoolId, EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AcademicGroupDTO> findAllActive() {
        return academicGroupRepository.findByStatus(EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AcademicGroupDTO findById(Long id) {
        return academicGroupRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public AcademicGroupDTO save(AcademicGroupDTO dto) {
        AcademicGroupEntity entity = new AcademicGroupEntity();
        updateEntityFromDTO(entity, dto);
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(academicGroupRepository.save(entity));
    }

    @Transactional
    public AcademicGroupDTO update(AcademicGroupDTO dto) {
        return academicGroupRepository.findById(java.util.Objects.requireNonNull(dto.getId()))
                .map(entity -> {
                    updateEntityFromDTO(entity, dto);
                    return convertToDTO(academicGroupRepository.save(entity));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(@org.springframework.lang.NonNull Long id) {
        academicGroupRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            academicGroupRepository.save(entity);
        });
    }

    public AcademicGroupDTO convertToDTO(AcademicGroupEntity entity) {
        AcademicGroupDTO dto = new AcademicGroupDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setCode(entity.getCode());
        dto.setDescription(entity.getDescription());
        dto.setSchoolId(entity.getSchoolId());
        return dto;
    }

    private void updateEntityFromDTO(AcademicGroupEntity entity, AcademicGroupDTO dto) {
        entity.setName(dto.getName());
        entity.setCode(dto.getCode());
        entity.setDescription(dto.getDescription());
        entity.setSchoolId(dto.getSchoolId());
    }
}
