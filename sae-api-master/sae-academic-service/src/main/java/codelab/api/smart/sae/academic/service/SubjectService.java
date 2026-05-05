package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.SubjectDTO;
import codelab.api.smart.sae.academic.model.SubjectEntity;
import codelab.api.smart.sae.academic.repository.SubjectRepository;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    public List<SubjectDTO> findAllActive() {
        return subjectRepository.findByStatus(EntityState.ACTIVE).stream()
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
        SubjectEntity entity = new SubjectEntity();
        updateEntityFromDTO(entity, dto);
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(subjectRepository.save(entity));
    }

    @Transactional
    public SubjectDTO update(SubjectDTO dto) {
        return subjectRepository.findById(dto.getId())
                .map(entity -> {
                    updateEntityFromDTO(entity, dto);
                    return convertToDTO(subjectRepository.save(entity));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(Long id) {
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
        return dto;
    }

    private void updateEntityFromDTO(SubjectEntity entity, SubjectDTO dto) {
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setCode(dto.getCode());
    }
}
