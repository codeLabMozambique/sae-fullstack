package codelab.api.smart.sae.academic.seeder;

import codelab.api.smart.sae.academic.catalog.ClassLevelDefinition;
import codelab.api.smart.sae.academic.catalog.CurriculumSubject;
import codelab.api.smart.sae.academic.model.ClassLevelEntity;
import codelab.api.smart.sae.academic.model.SubjectEntity;
import codelab.api.smart.sae.academic.repository.ClassLevelRepository;
import codelab.api.smart.sae.academic.repository.SubjectRepository;
import codelab.api.smart.sae.framework.jpa.EntityState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(10)
public class AcademicDataSeeder implements CommandLineRunner {

    @Autowired private ClassLevelRepository classLevelRepository;
    @Autowired private SubjectRepository subjectRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedClassLevels();
        seedSubjects();
    }

    private void seedClassLevels() {
        for (ClassLevelDefinition def : ClassLevelDefinition.values()) {
            if (!classLevelRepository.existsByNormalizedName(def.getNormalizedName())) {
                ClassLevelEntity entity = new ClassLevelEntity();
                entity.setName(def.getDisplayName());
                entity.setNormalizedName(def.getNormalizedName());
                entity.setCycle(def.getCycle());
                entity.setStatus(EntityState.ACTIVE);
                classLevelRepository.save(entity);
            }
        }
        // Preenche normalizedName em registos legados que ainda não o têm
        // Salta se o valor já está usado por outro registo (evita violação de UNIQUE)
        classLevelRepository.findAll().stream()
                .filter(e -> e.getNormalizedName() == null)
                .forEach(e -> {
                    String norm = codelab.api.smart.sae.academic.util.NameNormalizer.normalize(e.getName());
                    if (!classLevelRepository.existsByNormalizedName(norm)) {
                        e.setNormalizedName(norm);
                        classLevelRepository.save(e);
                    }
                });
    }

    private void seedSubjects() {
        for (CurriculumSubject cs : CurriculumSubject.values()) {
            if (!subjectRepository.existsByNormalizedName(cs.getNormalizedName())) {
                SubjectEntity entity = new SubjectEntity();
                entity.setName(cs.getDisplayName());
                entity.setNormalizedName(cs.getNormalizedName());
                entity.setStatus(EntityState.ACTIVE);
                subjectRepository.save(entity);
            }
        }
        // Preenche normalizedName em registos legados que ainda não o têm
        // Salta se o valor já está usado por outro registo (evita violação de UNIQUE)
        subjectRepository.findAll().stream()
                .filter(e -> e.getNormalizedName() == null)
                .forEach(e -> {
                    String norm = codelab.api.smart.sae.academic.util.NameNormalizer.normalize(e.getName());
                    if (!subjectRepository.existsByNormalizedName(norm)) {
                        e.setNormalizedName(norm);
                        subjectRepository.save(e);
                    }
                });
    }
}
