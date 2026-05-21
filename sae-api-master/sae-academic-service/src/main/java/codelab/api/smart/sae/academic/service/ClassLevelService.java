package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.catalog.ClassLevelDefinition;
import codelab.api.smart.sae.academic.dto.ClassLevelDTO;
import codelab.api.smart.sae.academic.exception.DuplicateEntityException;
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

    public ClassLevelDTO findById(@org.springframework.lang.NonNull Long id) {
        return classLevelRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public ClassLevelDTO save(ClassLevelDTO dto) {
        ClassLevelDefinition def = ClassLevelDefinition.findByNormalized(dto.getName());
        if (def == null) {
            throw new IllegalArgumentException(
                "Nível de classe não reconhecido: \"" + dto.getName() + "\". Use um dos níveis predefinidos do sistema.");
        }
        String normalized = def.getNormalizedName();
        if (classLevelRepository.existsByNormalizedName(normalized)) {
            throw new DuplicateEntityException("Nível de classe já existe: " + def.getDisplayName());
        }
        ClassLevelEntity entity = new ClassLevelEntity();
        entity.setName(def.getDisplayName());
        entity.setNormalizedName(normalized);
        entity.setCycle(def.getCycle());
        entity.setStatus(EntityState.ACTIVE);
        return convertToDTO(classLevelRepository.save(entity));
    }

    @Transactional
    public ClassLevelDTO update(ClassLevelDTO dto) {
        ClassLevelDefinition def = ClassLevelDefinition.findByNormalized(dto.getName());
        if (def == null) {
            throw new IllegalArgumentException(
                "Nível de classe não reconhecido: \"" + dto.getName() + "\". Use um dos níveis predefinidos do sistema.");
        }
        String normalized = def.getNormalizedName();
        return classLevelRepository.findById(java.util.Objects.requireNonNull(dto.getId()))
                .map(entity -> {
                    boolean nameChanged = !normalized.equals(entity.getNormalizedName());
                    if (nameChanged && classLevelRepository.existsByNormalizedName(normalized)) {
                        throw new DuplicateEntityException("Nível de classe já existe: " + def.getDisplayName());
                    }
                    entity.setName(def.getDisplayName());
                    entity.setNormalizedName(normalized);
                    entity.setCycle(def.getCycle());
                    return convertToDTO(classLevelRepository.save(entity));
                }).orElse(null);
    }

    @Transactional
    public void deactivate(@org.springframework.lang.NonNull Long id) {
        classLevelRepository.findById(id).ifPresent(entity -> {
            entity.setStatus(EntityState.INACTIVE);
            classLevelRepository.save(entity);
        });
    }

    private ClassLevelDTO convertToDTO(ClassLevelEntity entity) {
        ClassLevelDTO dto = new ClassLevelDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setCycle(entity.getCycle());
        return dto;
    }
}
