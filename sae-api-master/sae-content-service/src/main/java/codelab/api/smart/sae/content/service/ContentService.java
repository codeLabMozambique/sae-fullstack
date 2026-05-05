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

    @Autowired
    private FileStorageService fileStorageService;

    public Content getById(String id) {
        return contentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteúdo não encontrado"));
    }

    public Page<Content> list(String discipline, String level, Long classroomId, String uploadedBy, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 20 : Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return contentRepository.findWithFilters(discipline, level, classroomId, uploadedBy, pageable);
    }

    public void delete(String id) {
        Content content = getById(id);
        if (content.getFileUrl() != null && content.getFileUrl().contains("/")) {
            String fileName = content.getFileUrl().substring(content.getFileUrl().lastIndexOf("/") + 1);
            fileStorageService.deleteFile(fileName);
        }
        contentRepository.deleteById(id);
    }
}
