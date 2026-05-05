package codelab.api.smart.sae.forum.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AreaMatchingServiceTest {

    private AreaMatchingService service;

    @BeforeEach
    void setUp() {
        service = new AreaMatchingService();
        Map<String, String> mapping = Map.of(
            "Matematica", "matematica,algebra,calculo,geometria,estatistica",
            "Portugues",  "portugues,gramatica,literatura,redacao",
            "Ciencias",   "ciencias,biologia,fisica,quimica",
            "Historia",   "historia,geografia,sociedade"
        );
        ReflectionTestUtils.setField(service, "areaMapping", mapping);
    }

    @Test
    void exactTagMatch_returnsCorrectArea() {
        assertThat(service.determineArea("matematica,algebra")).isEqualTo("Matematica");
    }

    @Test
    void partialTagMatch_returnsCorrectArea() {
        assertThat(service.determineArea("calculo,numeros")).isEqualTo("Matematica");
    }

    @Test
    void multipleAreas_selectsHighestScore() {
        // 2 hits in Portugues, 1 in Historia
        assertThat(service.determineArea("portugues,literatura,sociedade")).isEqualTo("Portugues");
    }

    @Test
    void noMatch_returnsGeral() {
        assertThat(service.determineArea("xylophone,blockchain")).isEqualTo("Geral");
    }

    @Test
    void nullTags_returnsGeral() {
        assertThat(service.determineArea(null)).isEqualTo("Geral");
    }

    @Test
    void emptyTags_returnsGeral() {
        assertThat(service.determineArea("  ")).isEqualTo("Geral");
    }

    @Test
    void accentedTags_normalizedAndMatched() {
        // "matemática" → normalised to "matematica" → matches Matematica
        assertThat(service.determineArea("matemática")).isEqualTo("Matematica");
    }

    @Test
    void tie_selectsAlphabeticallyFirst() {
        // 1 hit in each area — picks alphabetically first
        String result = service.determineArea("matematica,portugues");
        assertThat(result).isIn("Matematica", "Portugues"); // both have 1 hit; alphabetical = Matematica
        assertThat(result).isEqualTo("Matematica");
    }
}
