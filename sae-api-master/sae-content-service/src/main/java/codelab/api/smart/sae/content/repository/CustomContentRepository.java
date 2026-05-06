package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.Content;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomContentRepository {
    Page<Content> findWithFilters(String discipline, String level, Long classroomId, String uploadedBy, Pageable pageable);
}
