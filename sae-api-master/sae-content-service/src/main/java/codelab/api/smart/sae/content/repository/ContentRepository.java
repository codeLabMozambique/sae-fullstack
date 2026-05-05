package codelab.api.smart.sae.content.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import codelab.api.smart.sae.content.model.Content;

@Repository
public interface ContentRepository extends MongoRepository<Content, String> {

    Page<Content> findByDiscipline(String discipline, Pageable pageable);

    Page<Content> findByLevel(String level, Pageable pageable);

    Page<Content> findByDisciplineAndLevel(String discipline, String level, Pageable pageable);
}
