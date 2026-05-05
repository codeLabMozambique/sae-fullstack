package codelab.api.smart.sae.forum.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;

@Service
public class AreaMatchingService {

    private static final Logger log = LoggerFactory.getLogger(AreaMatchingService.class);

    @Autowired
    @Qualifier("forumAreaMapping")
    private Map<String, String> areaMapping;

    public String determineArea(String tags) {
        if (tags == null || tags.isBlank()) return "Geral";

        List<String> normalizedTags = Arrays.stream(tags.split(","))
            .map(this::normalize)
            .filter(t -> !t.isBlank())
            .toList();

        if (normalizedTags.isEmpty()) return "Geral";

        String bestArea = null;
        int bestCount = 0;

        // Sort areas alphabetically for deterministic tie-breaking
        List<String> sortedAreas = new ArrayList<>(areaMapping.keySet());
        Collections.sort(sortedAreas);

        for (String area : sortedAreas) {
            List<String> keywords = Arrays.stream(areaMapping.get(area).split(","))
                .map(this::normalize)
                .toList();

            int matches = (int) normalizedTags.stream()
                .filter(tag -> keywords.stream().anyMatch(kw -> kw.contains(tag) || tag.contains(kw)))
                .count();

            if (matches > bestCount) {
                bestCount = matches;
                bestArea = area;
            }
        }

        String result = bestArea != null ? bestArea : "Geral";
        log.debug("Tags '{}' matched area '{}' with {} hits", tags, result, bestCount);
        return result;
    }

    private String normalize(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input.trim().toLowerCase(), Normalizer.Form.NFD);
        return normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
    }
}
