package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Attachment;
import codelab.api.smart.sae.content.repository.AttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Service
public class AttachmentService {

    private static final long MAX_SIZE = 25L * 1024 * 1024; // 25 MB
    private static final String PREFIX = "attachments/";

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public Attachment upload(MultipartFile file, String username, String context, String contextId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ficheiro vazio");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Ficheiro excede 25 MB");
        }

        try {
            byte[] bytes = file.getBytes();
            String safeName = sanitize(file.getOriginalFilename());
            String key = PREFIX + UUID.randomUUID() + "_" + safeName;
            String contentType = file.getContentType() != null
                    ? file.getContentType() : "application/octet-stream";

            fileStorageService.saveFileWithKey(bytes, key, contentType);

            Attachment a = new Attachment();
            a.setFileName(key);
            a.setOriginalName(safeName);
            a.setContentType(contentType);
            a.setSize(bytes.length);
            a.setUploadedBy(username);
            a.setContext(context);
            a.setContextId(contextId);
            return attachmentRepository.save(a);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Falha ao ler bytes do ficheiro", e);
        }
    }

    public Attachment getById(String id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Anexo não encontrado"));
    }

    public InputStream stream(Attachment attachment) {
        return fileStorageService.getFile(attachment.getFileName());
    }

    public List<Attachment> listByUser(String username) {
        return attachmentRepository.findByUploadedByOrderByCreatedAtDesc(username);
    }

    public List<Attachment> listByContext(String context, String contextId) {
        return attachmentRepository.findByContextAndContextId(context, contextId);
    }

    public void delete(String id, String username, boolean isAdmin) {
        Attachment a = getById(id);
        if (!isAdmin && !username.equals(a.getUploadedBy())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Não tem permissão para apagar este anexo");
        }
        fileStorageService.deleteFile(a.getFileName());
        attachmentRepository.deleteById(id);
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        // remove path separators e caracteres perigosos
        String cleaned = name.replaceAll("[\\\\/]+", "_")
                             .replaceAll("[^a-zA-Z0-9._-]", "_");
        return cleaned.length() > 100 ? cleaned.substring(0, 100) : cleaned;
    }
}
