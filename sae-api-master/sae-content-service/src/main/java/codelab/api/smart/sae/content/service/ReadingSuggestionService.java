package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.client.AuthServiceClient;
import codelab.api.smart.sae.content.dto.ReadingSuggestionDTO;
import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.jpa.ReadingSuggestion;
import codelab.api.smart.sae.content.repository.jpa.ReadingSuggestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReadingSuggestionService {

    @Autowired private ReadingSuggestionRepository suggestionRepository;
    @Autowired private ContentService contentService;
    @Autowired private AuthServiceClient authServiceClient;

    /**
     * Cria 1 sugestão por turma (classroomIds pode ter vários).
     * Devolve a lista das sugestões criadas.
     */
    public List<ReadingSuggestionDTO> create(Map<String, Object> payload,
                                              String professorUsername, String token) {
        if (payload == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload em falta");
        String contentId = asString(payload.get("contentId"));
        if (contentId == null || contentId.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contentId obrigatório");

        // Confirma que o conteúdo existe
        Content content;
        try { content = contentService.getById(contentId); }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado");
        }

        List<Long> classroomIds = parseClassroomIds(payload.get("classroomIds"));
        if (classroomIds.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classroomIds obrigatório");

        String note = asString(payload.get("note"));
        Integer startPage = asInt(payload.get("startPage"));
        Integer endPage = asInt(payload.get("endPage"));
        String chapterRange = asString(payload.get("chapterRange"));

        if (startPage != null && startPage < 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startPage inválido");
        if (endPage != null && startPage != null && endPage < startPage)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endPage tem de ser >= startPage");
        if (content.getTotalPages() != null && startPage != null && startPage > content.getTotalPages())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "startPage > total páginas (" + content.getTotalPages() + ")");

        String professorName = authServiceClient.getUserFullName(professorUsername, token);

        List<ReadingSuggestion> created = new ArrayList<>();
        for (Long cid : classroomIds) {
            ReadingSuggestion s = new ReadingSuggestion();
            s.setContentId(contentId);
            s.setContentTitle(content.getTitle());
            s.setClassroomId(cid);
            s.setProfessorUsername(professorUsername);
            s.setProfessorName(professorName);
            s.setNote(note);
            s.setStartPage(startPage);
            s.setEndPage(endPage);
            s.setChapterRange(chapterRange);
            created.add(suggestionRepository.save(s));
        }

        return created.stream().map(ReadingSuggestionDTO::from).collect(Collectors.toList());
    }

    public List<ReadingSuggestionDTO> listMine(String professorUsername) {
        return suggestionRepository.findByProfessorUsernameOrderByCreatedAtDesc(professorUsername)
                .stream().map(ReadingSuggestionDTO::from).collect(Collectors.toList());
    }

    public List<ReadingSuggestionDTO> listForStudent(Collection<Long> classroomIds) {
        if (classroomIds == null || classroomIds.isEmpty()) return List.of();
        return suggestionRepository.findByClassroomIdInOrderByCreatedAtDesc(classroomIds)
                .stream().map(ReadingSuggestionDTO::from).collect(Collectors.toList());
    }

    public void delete(Long id, String professorUsername) {
        ReadingSuggestion s = suggestionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sugestão não encontrada"));
        if (!s.getProfessorUsername().equals(professorUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sugestão não é tua");
        }
        suggestionRepository.delete(s);
    }

    // ── helpers ────────────────────────────────────────────

    private List<Long> parseClassroomIds(Object o) {
        List<Long> out = new ArrayList<>();
        if (o == null) return out;
        if (o instanceof List<?> list) {
            for (Object v : list) {
                Long l = asLong(v);
                if (l != null) out.add(l);
            }
        } else if (o instanceof String s) {
            for (String p : s.split(",")) {
                Long l = asLong(p.trim());
                if (l != null) out.add(l);
            }
        } else if (o instanceof Number n) {
            out.add(n.longValue());
        }
        return out;
    }
    private String asString(Object o) { return o == null ? null : o.toString(); }
    private Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(o.toString()); } catch (Exception e) { return null; }
    }
    private Integer asInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(o.toString()); } catch (Exception e) { return null; }
    }
}
