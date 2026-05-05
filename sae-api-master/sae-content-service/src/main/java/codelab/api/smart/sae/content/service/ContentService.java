package codelab.api.smart.sae.content.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.repository.ContentRepository;

@Service
public class ContentService {

    @Autowired
    private ContentRepository contentRepository;

    public Content getById(String id) {
        return contentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteúdo não encontrado"));
    }

    public Page<Content> list(String discipline, String level, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 20 : Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "created_at"));
        boolean hasDiscipline = discipline != null && !discipline.isBlank();
        boolean hasLevel = level != null && !level.isBlank();
        if (hasDiscipline && hasLevel) {
            return contentRepository.findByDisciplineAndLevel(discipline, level, pageable);
        }
        if (hasDiscipline) return contentRepository.findByDiscipline(discipline, pageable);
        if (hasLevel) return contentRepository.findByLevel(level, pageable);
        return contentRepository.findAll(pageable);
    }
}
