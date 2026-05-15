package codelab.api.smart.sae.content.repository.jpa;

import codelab.api.smart.sae.content.model.jpa.ReadingSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ReadingSuggestionRepository extends JpaRepository<ReadingSuggestion, Long> {

    List<ReadingSuggestion> findByProfessorUsernameOrderByCreatedAtDesc(String professorUsername);

    List<ReadingSuggestion> findByClassroomIdInOrderByCreatedAtDesc(Collection<Long> classroomIds);
}
