package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.ClassLevelDTO;
import codelab.api.smart.sae.academic.model.ClassLevelEntity;
import codelab.api.smart.sae.academic.repository.ClassLevelRepository;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClassLevelService {

    @Autowired
    private ClassLevelRepository classLevelRepository;

    public List<ClassLevelDTO> findAllActive() {
        return classLevelRepository.findByStatus(EntityState.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ClassLevelDTO findById(Long id) {
        return classLevelRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public ClassLevelDTO save(ClassLevelDTO dto) {
        ClassLevelEntity entity = new ClassLevelEntity();
        entity.setName(dto.getName());
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(classLevelRepository.save(entity));
    }

    @Transactional
    public ClassLevelDTO update(ClassLevelDTO dto) {
        return classLevelRepository.findById(dto.getId())
                .map(entity -> {
                    entity.setName(dto.getName());
                    return convertToDTO(classLevelRepository.save(entity));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(Long id) {
        classLevelRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            classLevelRepository.save(entity);
        });
    }

    private ClassLevelDTO convertToDTO(ClassLevelEntity entity) {
        ClassLevelDTO dto = new ClassLevelDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        return dto;
    }
}
