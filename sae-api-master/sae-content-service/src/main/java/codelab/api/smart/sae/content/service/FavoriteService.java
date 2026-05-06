package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.Favorite;
import codelab.api.smart.sae.content.repository.ContentRepository;
import codelab.api.smart.sae.content.repository.FavoriteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteService {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private ContentRepository contentRepository;

    public void addFavorite(String userId, String contentId) {
        if (!contentRepository.existsById(contentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteúdo não encontrado");
        }
        
        if (favoriteRepository.existsByUserIdAndContentId(userId, contentId)) {
            return; // Já é favorito
        }
        
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setContentId(contentId);
        favoriteRepository.save(favorite);
    }

    public void removeFavorite(String userId, String contentId) {
        favoriteRepository.deleteByUserIdAndContentId(userId, contentId);
    }

    public List<Content> listFavorites(String userId) {
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        List<String> contentIds = favorites.stream()
                .map(Favorite::getContentId)
                .collect(Collectors.toList());
        
        return contentRepository.findAllById(contentIds);
    }
}
