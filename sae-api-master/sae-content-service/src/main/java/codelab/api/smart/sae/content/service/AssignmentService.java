package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.client.AuthServiceClient;
import codelab.api.smart.sae.content.dto.AssignmentDTO;
import codelab.api.smart.sae.content.dto.SubmissionDTO;
import codelab.api.smart.sae.content.model.jpa.Assignment;
import codelab.api.smart.sae.content.model.jpa.Submission;
import codelab.api.smart.sae.content.repository.jpa.AssignmentRepository;
import codelab.api.smart.sae.content.repository.jpa.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private AuthServiceClient authServiceClient;

    private static final long MAX_FILE_SIZE = 25L * 1024 * 1024; // 25 MB

    // ── Professor ──────────────────────────────────────────────

    public AssignmentDTO createAssignment(Map<String, Object> payload, String professorUsername, String token) {
        if (payload == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload em falta");

        Long classroomId = asLong(payload.get("classroomId"));
        String title = asString(payload.get("title"));
        String description = asString(payload.get("description"));
        String deadlineStr = asString(payload.get("deadline"));
        Double maxScore = asDouble(payload.get("maxScore"));

        if (classroomId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classroomId obrigatório");
        if (title == null || title.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Título obrigatório");
        if (deadlineStr == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data limite obrigatória");
        if (maxScore == null || maxScore <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pontuação máxima inválida");

        Assignment a = new Assignment();
        a.setClassroomId(classroomId);
        a.setTitle(title.trim());
        a.setDescription(description);
        a.setDeadline(parseDateTime(deadlineStr));
        a.setMaxScore(maxScore);
        a.setCreatedBy(professorUsername);
        a.setCreatedByName(authServiceClient.getUserFullName(professorUsername, token));

        return AssignmentDTO.from(assignmentRepository.save(a));
    }

    public List<AssignmentDTO> listForProfessor(String professorUsername, Long classroomIdFilter) {
        List<Assignment> list = assignmentRepository.findByCreatedBy(professorUsername, classroomIdFilter);
        return list.stream().map(a -> {
            AssignmentDTO d = AssignmentDTO.from(a);
            List<Submission> subs = submissionRepository.findByAssignmentIdOrderBySubmittedAtAsc(a.getId());
            d.submissionCount = subs.size();
            d.gradedCount = (int) subs.stream().filter(s -> Submission.STATE_GRADED.equals(s.getState())).count();
            return d;
        }).collect(Collectors.toList());
    }

    public AssignmentDTO getAssignmentForProfessor(Long id, String professorUsername) {
        Assignment a = requireOwned(id, professorUsername);
        AssignmentDTO d = AssignmentDTO.from(a);
        List<Submission> subs = submissionRepository.findByAssignmentIdOrderBySubmittedAtAsc(a.getId());
        d.submissionCount = subs.size();
        d.gradedCount = (int) subs.stream().filter(s -> Submission.STATE_GRADED.equals(s.getState())).count();
        return d;
    }

    public void deleteAssignment(Long id, String professorUsername) {
        Assignment a = requireOwned(id, professorUsername);
        // Limpa submissões e ficheiros
        List<Submission> subs = submissionRepository.findByAssignmentIdOrderBySubmittedAtAsc(a.getId());
        for (Submission s : subs) {
            if (s.getFileName() != null) {
                try { fileStorageService.deleteFile(s.getFileName()); } catch (Exception ignored) { /* noop */ }
            }
        }
        submissionRepository.deleteAll(subs);
        assignmentRepository.delete(a);
    }

    public List<SubmissionDTO> listSubmissionsForProfessor(Long assignmentId, String professorUsername) {
        requireOwned(assignmentId, professorUsername);
        return submissionRepository.findByAssignmentIdOrderBySubmittedAtAsc(assignmentId)
                .stream().map(SubmissionDTO::from).collect(Collectors.toList());
    }

    public SubmissionDTO gradeSubmission(Long submissionId, Double grade, String professorUsername) {
        if (grade == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nota obrigatória");
        Submission s = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submissão não encontrada"));
        Assignment a = requireOwned(s.getAssignmentId(), professorUsername);
        if (grade < 0 || grade > a.getMaxScore()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nota fora do intervalo [0, " + a.getMaxScore() + "]");
        }
        s.setGrade(grade);
        s.setGradedAt(LocalDateTime.now());
        s.setState(Submission.STATE_GRADED);
        return SubmissionDTO.from(submissionRepository.save(s));
    }

    // ── Estudante ──────────────────────────────────────────────

    public List<AssignmentDTO> listForStudent(Collection<Long> classroomIds, String studentUsername) {
        if (classroomIds == null || classroomIds.isEmpty()) return List.of();
        List<Assignment> list = assignmentRepository.findByClassroomIds(classroomIds);
        return list.stream().map(a -> {
            AssignmentDTO d = AssignmentDTO.from(a);
            submissionRepository.findByAssignmentIdAndStudentUsername(a.getId(), studentUsername)
                    .ifPresent(s -> d.mySubmission = SubmissionDTO.from(s));
            return d;
        }).collect(Collectors.toList());
    }

    public AssignmentDTO getForStudent(Long id, Collection<Long> classroomIds, String studentUsername) {
        Assignment a = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada"));
        if (classroomIds == null || !classroomIds.contains(a.getClassroomId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tarefa não pertence a uma das tuas turmas");
        }
        AssignmentDTO d = AssignmentDTO.from(a);
        submissionRepository.findByAssignmentIdAndStudentUsername(a.getId(), studentUsername)
                .ifPresent(s -> d.mySubmission = SubmissionDTO.from(s));
        return d;
    }

    public SubmissionDTO submit(Long assignmentId, String comment, MultipartFile file,
                                 Collection<Long> classroomIds, String studentUsername, String token) {
        Assignment a = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada"));
        if (classroomIds == null || !classroomIds.contains(a.getClassroomId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não estás inscrito na turma desta tarefa");
        }
        if (submissionRepository.existsByAssignmentIdAndStudentUsername(assignmentId, studentUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já submeteste esta tarefa");
        }

        Submission s = new Submission();
        s.setAssignmentId(assignmentId);
        s.setStudentUsername(studentUsername);
        s.setStudentName(authServiceClient.getUserFullName(studentUsername, token));
        s.setComment(comment);

        if (file != null && !file.isEmpty()) {
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                        "Ficheiro excede 25 MB");
            }
            try {
                String key = "submissions/" + UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
                fileStorageService.saveFileWithKey(file.getBytes(), key, file.getContentType());
                s.setFileName(key);
                s.setFileOriginalName(file.getOriginalFilename());
            } catch (java.io.IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao guardar ficheiro");
            }
        }

        return SubmissionDTO.from(submissionRepository.save(s));
    }

    public List<SubmissionDTO> listMySubmissions(String studentUsername) {
        return submissionRepository.findByStudentUsernameOrderBySubmittedAtDesc(studentUsername)
                .stream().map(SubmissionDTO::from).collect(Collectors.toList());
    }

    // ── Download de ficheiro de submissão ──────────────────────

    public Submission requireSubmissionForFileAccess(Long submissionId, String username, boolean isProfessor) {
        Submission s = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submissão não encontrada"));
        if (isProfessor) {
            // Tem de ser o professor que criou a tarefa
            Assignment a = assignmentRepository.findById(s.getAssignmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada"));
            if (!a.getCreatedBy().equals(username)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tens acesso a este ficheiro");
            }
        } else {
            // Tem de ser o dono da submissão
            if (!s.getStudentUsername().equals(username)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tens acesso a este ficheiro");
            }
        }
        if (s.getFileName() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Submissão sem ficheiro");
        }
        return s;
    }

    // ── Helpers ────────────────────────────────────────────────

    private Assignment requireOwned(Long id, String professorUsername) {
        Assignment a = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada"));
        if (!a.getCreatedBy().equals(professorUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tarefa não é tua");
        }
        return a;
    }

    private String sanitize(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(o.toString()); } catch (Exception e) { return null; }
    }
    private Double asDouble(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(o.toString()); } catch (Exception e) { return null; }
    }
    private String asString(Object o) { return o == null ? null : o.toString(); }

    private LocalDateTime parseDateTime(String s) {
        try {
            // Aceita formato ISO ("2026-05-20T18:00:00") ou data-only ("2026-05-20")
            if (s.length() == 10) return LocalDateTime.parse(s + "T23:59:59");
            return LocalDateTime.parse(s);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Formato de data inválido: " + s + " (esperado ISO 8601)");
        }
    }
}
