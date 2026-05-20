package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.response.ProfessorAssistanceStatsDTO;
import codelab.api.smart.sae.forum.dto.response.ProfessorCertificateDTO;
import codelab.api.smart.sae.forum.model.ProfessorCertificateEntity;
import codelab.api.smart.sae.forum.repository.ProfessorCertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfessorCertificateService {

    private static final double ASSISTANCE_THRESHOLD = 70.0;

    @Autowired private ProfessorCertificateRepository repository;
    @Autowired private ForumQuestionService questionService;
    @Autowired private AuthServiceClient authServiceClient;
    @Autowired private AcademicServiceClient academicServiceClient;

    /**
     * Verifica se o professor atingiu o limiar de assistência e emite
     * certificado automaticamente. Chamado após cada resposta de especialista.
     */
    @Transactional
    public void checkAndIssue(String professorUsername) {
        ProfessorAssistanceStatsDTO stats = questionService.getProfessorAssistanceStats(professorUsername);

        if (stats.getAssistancePercentage() < ASSISTANCE_THRESHOLD) return;
        if (stats.getTotalAnswered() < 5) return; // mínimo de 5 respostas

        String discipline = stats.getDisciplinas().isEmpty() ? "GERAL" : stats.getDisciplinas().get(0);

        if (repository.existsByProfessorUsernameAndDiscipline(professorUsername, discipline)) return;

        ProfessorCertificateEntity cert = new ProfessorCertificateEntity();
        cert.setProfessorUsername(professorUsername);
        cert.setDiscipline(discipline);
        cert.setAssistancePercentage(stats.getAssistancePercentage());
        cert.setTotalAnswered(stats.getTotalAnswered());
        cert.setIsPublic(false);
        repository.save(cert);
    }

    public List<ProfessorCertificateDTO> getMyCertificates(String professorUsername) {
        return repository.findByProfessorUsernameOrderByIssuedAtDesc(professorUsername)
                .stream().map(ProfessorCertificateDTO::from).collect(Collectors.toList());
    }

    public List<ProfessorCertificateDTO> getCertificatesByProfessor(String professorUsername) {
        return repository.findByProfessorUsernameOrderByIssuedAtDesc(professorUsername)
                .stream().map(ProfessorCertificateDTO::from).collect(Collectors.toList());
    }

    public List<ProfessorCertificateDTO> getAllCertificates() {
        return repository.findAll().stream()
                .sorted(java.util.Comparator.comparing(
                    c -> c.getIssuedAt() != null ? c.getIssuedAt() : java.time.LocalDateTime.MIN,
                    java.util.Comparator.reverseOrder()))
                .map(ProfessorCertificateDTO::from).collect(Collectors.toList());
    }

    public List<ProfessorCertificateDTO> getPublicCertificates() {
        return repository.findByIsPublicTrueOrderByIssuedAtDesc()
                .stream().map(ProfessorCertificateDTO::from).collect(Collectors.toList());
    }

    @Transactional
    public ProfessorCertificateDTO publish(Long id, String professorUsername) {
        ProfessorCertificateEntity cert = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificado não encontrado"));
        if (!cert.getProfessorUsername().equals(professorUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        }
        boolean nowPublic = !Boolean.TRUE.equals(cert.getIsPublic());
        cert.setIsPublic(nowPublic);
        cert.setPublishedAt(nowPublic ? LocalDateTime.now() : null);
        return ProfessorCertificateDTO.from(repository.save(cert));
    }

    @Transactional
    public ProfessorCertificateDTO adminPublish(Long id, boolean makePublic) {
        ProfessorCertificateEntity cert = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificado não encontrado"));
        cert.setIsPublic(makePublic);
        cert.setPublishedAt(makePublic ? LocalDateTime.now() : null);
        return ProfessorCertificateDTO.from(repository.save(cert));
    }
}
