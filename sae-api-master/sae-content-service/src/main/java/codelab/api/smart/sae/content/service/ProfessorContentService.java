package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.client.AuthServiceClient;
import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.repository.ContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfessorContentService {

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AuthServiceClient authServiceClient;

    public Content uploadContent(MultipartFile file, Content metadata, String professorUsername, String token) {
        String fileName = fileStorageService.saveFile(file);
        
        String fullName = authServiceClient.getUserFullName(professorUsername, token);
        
        metadata.setFileUrl("/api/contents/" + fileName + "/file");
        metadata.setUploadedBy(professorUsername);
        metadata.setUploadedByRole("PROFESSOR");
        metadata.setUploadedByName(fullName);
        
        return contentRepository.save(metadata);
    }
}
