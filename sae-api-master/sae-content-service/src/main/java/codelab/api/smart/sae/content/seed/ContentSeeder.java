package codelab.api.smart.sae.content.seed;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.repository.ContentRepository;

/**
 * Seeds a tiny demo set of contents on startup so reading-progress
 * endpoints have something to point at during local smoke tests.
 *
 * Idempotent: only seeds when the contents collection is empty.
 */
@Component
public class ContentSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ContentSeeder.class);

    private final ContentRepository contentRepository;

    public ContentSeeder(ContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }

    @Override
    public void run(String... args) {
        if (contentRepository.count() > 0) return;

        Content c1 = build("Matemática A — 12ª Classe", "Matemática", "secundario II", 240);
        Content c2 = build("Biologia — Módulo EAD", "Biologia", "EAD", 180);
        Content c3 = build("História de Moçambique — 11ª Classe", "História", "secundario II", 320);

        contentRepository.saveAll(List.of(c1, c2, c3));
        log.info("Seeded {} demo contents", 3);
    }

    private Content build(String title, String discipline, String level, int totalPages) {
        Content c = new Content();
        c.setTitle(title);
        c.setDescription(title + " — material demo seeded automaticamente.");
        c.setDiscipline(discipline);
        c.setLevel(level);
        c.setYear(2025);
        c.setTotalPages(totalPages);
        c.setTags(List.of(discipline.toLowerCase()));
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        return c;
    }
}
