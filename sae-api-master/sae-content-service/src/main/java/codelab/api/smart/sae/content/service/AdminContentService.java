package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.repository.ContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminContentService {

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public Content uploadContent(MultipartFile file, Content metadata, String adminUser) {
        String fileName = fileStorageService.saveFile(file);
        
        metadata.setFileUrl("/api/contents/" + fileName + "/file"); // URL ficticia para o Gateway
        metadata.setUploadedBy(adminUser);
        metadata.setUploadedByRole("ADMIN");
        metadata.setUploadedByName("admin");
        
        return contentRepository.save(metadata);
    }
}
