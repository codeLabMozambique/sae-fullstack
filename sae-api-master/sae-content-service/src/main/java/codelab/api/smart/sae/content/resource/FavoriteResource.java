package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/user/favorites")
public class FavoriteResource {

    @Autowired
    private FavoriteService favoriteService;

    @PostMapping("/{contentId}")
    public ResponseEntity<Void> add(@PathVariable String contentId, Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        favoriteService.addFavorite(principal.getName(), contentId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{contentId}")
    public ResponseEntity<Void> remove(@PathVariable String contentId, Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        favoriteService.removeFavorite(principal.getName(), contentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Content>> list(Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(favoriteService.listFavorites(principal.getName()));
    }
}
