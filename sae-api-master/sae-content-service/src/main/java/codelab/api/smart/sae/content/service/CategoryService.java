package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Category;
import codelab.api.smart.sae.content.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    public void delete(String id) {
        categoryRepository.deleteById(id);
    }

    public List<Category> listAllAsTree() {
        List<Category> roots = categoryRepository.findByParentIdIsNull();
        for (Category root : roots) {
            fillChildren(root);
        }
        return roots;
    }

    private void fillChildren(Category parent) {
        List<Category> children = categoryRepository.findByParentId(parent.getId());
        parent.setChildren(children);
        for (Category child : children) {
            fillChildren(child);
        }
    }

    public List<Category> listRoots() {
        return categoryRepository.findByParentIdIsNull();
    }
}
