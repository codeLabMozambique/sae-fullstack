package codelab.api.smart.sae.content.repository.jpa;

import codelab.api.smart.sae.content.model.jpa.Discipline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisciplineRepository extends JpaRepository<Discipline, Long> {
    java.util.Optional<Discipline> findByName(String name);
}
