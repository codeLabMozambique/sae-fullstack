package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.Category;
import codelab.api.smart.sae.content.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryResource {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> listTree() {
        return ResponseEntity.ok(categoryService.listAllAsTree());
    }

    // Endpoints de Administração (Normalmente estariam num AdminCategoryResource, mas vou simplificar aqui)
    @PostMapping("/admin")
    public ResponseEntity<Category> create(@RequestBody Category category) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.save(category));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
