package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.Attachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends MongoRepository<Attachment, String> {
    List<Attachment> findByUploadedByOrderByCreatedAtDesc(String uploadedBy);
    List<Attachment> findByContextAndContextId(String context, String contextId);
}
