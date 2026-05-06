package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByParentId(String parentId);
    List<Category> findByParentIdIsNull();
}
