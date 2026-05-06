package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.client.AuthServiceClient;
import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.jpa.ContentLog;
import codelab.api.smart.sae.content.repository.ContentRepository;
import codelab.api.smart.sae.content.repository.jpa.ContentLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfessorContentService {

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private ContentLogRepository contentLogRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AuthServiceClient authServiceClient;

    @Autowired
    private PdfProcessorService pdfProcessorService;

    @Autowired
    private EventPublisherService eventPublisherService;

    public Content uploadContent(MultipartFile file, Content metadata, String professorUsername, String token) {
        try {
            byte[] fileBytes = file.getBytes();
            String fileName = fileStorageService.saveFile(fileBytes, file.getOriginalFilename(), file.getContentType());
            
            // Processamento Automático do PDF
            int pages = pdfProcessorService.getPageCount(fileBytes);
            byte[] thumbBytes = pdfProcessorService.generateThumbnail(fileBytes);
            
            String thumbName = null;
            if (thumbBytes != null) {
                thumbName = fileStorageService.saveFile(thumbBytes, "thumb_" + file.getOriginalFilename() + ".jpg", "image/jpeg");
            }
            
            String fullName = authServiceClient.getUserFullName(professorUsername, token);
            
            metadata.setFileUrl("/api/contents/" + fileName + "/read");
            if (thumbName != null) {
                metadata.setThumbnailUrl("/api/contents/" + thumbName + "/read");
            }
            metadata.setTotalPages(pages);
            metadata.setUploadedBy(professorUsername);
            metadata.setUploadedByRole("PROFESSOR");
            metadata.setUploadedByName(fullName);
            
            Content saved = contentRepository.save(metadata);
            
            // Log de Auditoria
            ContentLog log = new ContentLog();
            log.setContentId(saved.getId());
            log.setAction("UPLOAD");
            log.setUserUsername(professorUsername);
            log.setUserRole("PROFESSOR");
            contentLogRepository.save(log);

            // Publicar Evento
            eventPublisherService.publishContentCreated(saved.getId(), saved.getTitle(), saved.getUploadedByName());
            
            return saved;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Erro ao processar ficheiro", e);
        }
    }
}
