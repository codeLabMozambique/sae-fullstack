package codelab.api.smart.sae.content.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.repository.ContentRepository;

@Service
public class ContentService {

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private codelab.api.smart.sae.content.repository.jpa.ContentLogRepository contentLogRepository;

    @Cacheable(value = "contents", key = "#id")
    public Content getById(String id) {
        return contentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteúdo não encontrado"));
    }

    public Page<Content> list(String discipline, String level, Long classroomId, String uploadedBy, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 20 : Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return contentRepository.findWithFilters(discipline, level, classroomId, uploadedBy, pageable);
    }

    public Page<Content> search(String query, Pageable pageable) {
        org.springframework.data.mongodb.core.query.TextCriteria criteria = org.springframework.data.mongodb.core.query.TextCriteria
                .forDefaultLanguage()
                .matchingAny(query.split(" "));
        return contentRepository.findBy(criteria, pageable);
    }

    @CacheEvict(value = "contents", key = "#id")
    public void delete(String id, String username) {
        Content content = getById(id);
        if (content.getFileUrl() != null && content.getFileUrl().contains("/")) {
            String url = content.getFileUrl();
            String fileName = url.replace("/api/contents/", "").replace("/read", "").replace("/file", "");
            fileStorageService.deleteFile(fileName);
        }
        contentRepository.deleteById(id);

        // Log de Auditoria
        codelab.api.smart.sae.content.model.jpa.ContentLog log = new codelab.api.smart.sae.content.model.jpa.ContentLog();
        log.setContentId(id);
        log.setAction("DELETE");
        log.setUserUsername(username);
        contentLogRepository.save(log);
    }
}
