package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.jpa.ContentLog;
import codelab.api.smart.sae.content.repository.ContentRepository;
import codelab.api.smart.sae.content.repository.jpa.ContentLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
public class AdminContentService {

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private ContentLogRepository contentLogRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PdfProcessorService pdfProcessorService;

    @Autowired
    private EventPublisherService eventPublisherService;

    public Content uploadContent(MultipartFile file, Content metadata, String adminUser) {
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
            
            metadata.setFileUrl("/api/contents/" + fileName + "/read");
            if (thumbName != null) {
                metadata.setThumbnailUrl("/api/contents/" + thumbName + "/read");
            }
            metadata.setTotalPages(pages);
            metadata.setUploadedBy(adminUser);
            metadata.setUploadedByRole("ADMIN");
            metadata.setUploadedByName("admin");
            
            Content saved = contentRepository.save(metadata);
            
            // Log de Auditoria
            ContentLog log = new ContentLog();
            log.setContentId(saved.getId());
            log.setAction("UPLOAD");
            log.setUserUsername(adminUser);
            log.setUserRole("ADMIN");
            contentLogRepository.save(log);

            eventPublisherService.publishContentCreated(saved.getId(), saved.getTitle(), "admin");
            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar upload: " + e.getMessage(), e);
        }
    }

    public List<Content> batchUpload(List<MultipartFile> files, String adminUser) {
        List<Content> uploadedContents = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            Content metadata = new Content();
            metadata.setTitle(file.getOriginalFilename());
            metadata.setDescription("Upload automático via batch");
            uploadedContents.add(uploadContent(file, metadata, adminUser));
        }
        return uploadedContents;
    }
}
