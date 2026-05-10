package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.ContentSection;
import codelab.api.smart.sae.content.repository.ContentSectionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContentSectionService {

    private static final Logger log = LoggerFactory.getLogger(ContentSectionService.class);

    @Autowired private ContentSectionRepository sectionRepository;
    @Autowired private ContentService contentService;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private PdfProcessorService pdfProcessorService;

    public List<ContentSection> getSections(String contentId) {
        return sectionRepository.findByContentIdOrderByPositionAscStartPageAsc(contentId);
    }

    public ContentSection createSection(String contentId, ContentSection section) {
        contentService.getById(contentId);
        section.setId(null);
        section.setContentId(contentId);
        section.setCreatedAt(LocalDateTime.now());
        return sectionRepository.save(section);
    }

    public ContentSection updateSection(String contentId, String sectionId, ContentSection data) {
        ContentSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Secção não encontrada"));
        if (!contentId.equals(section.getContentId()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Secção não pertence a este conteúdo");
        section.setSectionName(data.getSectionName());
        section.setTrimester(data.getTrimester());
        section.setStartPage(data.getStartPage());
        section.setEndPage(data.getEndPage());
        section.setPosition(data.getPosition());
        return sectionRepository.save(section);
    }

    public void deleteSection(String contentId, String sectionId) {
        ContentSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Secção não encontrada"));
        if (!contentId.equals(section.getContentId()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Secção não pertence a este conteúdo");
        sectionRepository.delete(section);
    }

    public String extractTextFromContent(String contentId, int startPage, int endPage) {
        Content content = contentService.getById(contentId);
        String fileUrl = content.getFileUrl();
        if (fileUrl == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteúdo sem ficheiro PDF");

        String fileName = fileUrl
                .replace("/api/contents/", "")
                .replace("/read", "")
                .replace("/file", "")
                .replace("/files/", "");

        try {
            byte[] bytes = fileStorageService.getFileBytes(fileName);
            String text = pdfProcessorService.extractTextFromPages(bytes, startPage, endPage);
            return text != null ? text : "";
        } catch (Exception e) {
            log.error("Erro ao extrair texto do PDF {}: {}", contentId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao processar PDF");
        }
    }
}
