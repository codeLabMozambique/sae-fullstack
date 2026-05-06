package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.jpa.Discipline;
import codelab.api.smart.sae.content.service.DisciplineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disciplines")
public class DisciplineResource {

    @Autowired
    private DisciplineService disciplineService;

    @GetMapping
    public ResponseEntity<List<Discipline>> list() {
        return ResponseEntity.ok(disciplineService.listAll());
    }

    @PostMapping("/admin")
    public ResponseEntity<Discipline> create(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        return ResponseEntity.status(HttpStatus.CREATED).body(disciplineService.create(name));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        disciplineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
