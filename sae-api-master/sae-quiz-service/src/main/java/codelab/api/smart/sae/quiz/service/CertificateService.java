package codelab.api.smart.sae.quiz.service;

import codelab.api.smart.sae.quiz.dto.CertificateDTO;
import codelab.api.smart.sae.quiz.model.CertificateEntity;
import codelab.api.smart.sae.quiz.model.QuizAttemptEntity;
import codelab.api.smart.sae.quiz.model.QuizEntity;
import codelab.api.smart.sae.quiz.repository.CertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CertificateService {

    @Autowired
    private CertificateRepository certificateRepository;

    public Optional<Long> issue(QuizAttemptEntity attempt, QuizEntity quiz) {
        // One certificate per student per quiz — return existing if already awarded
        Optional<CertificateEntity> existing = certificateRepository
                .findByQuizIdAndStudentUsername(quiz.getId(), attempt.getStudentUsername());
        if (existing.isPresent()) return Optional.of(existing.get().getId());

        CertificateEntity cert = new CertificateEntity();
        cert.setStudentUsername(attempt.getStudentUsername());
        cert.setQuizId(quiz.getId());
        cert.setQuizTitulo(quiz.getTitulo());
        String disc = quiz.getDisciplina() != null ? quiz.getDisciplina().name() : "GERAL";
        String label = quiz.getDisciplina() != null ? quiz.getDisciplina().getDisplayName() : "Geral";
        cert.setDisciplina(disc);
        cert.setDisciplinaLabel(label);
        cert.setScore(attempt.getScore());
        return Optional.of(certificateRepository.save(cert).getId());
    }

    @Transactional(readOnly = true)
    public List<CertificateDTO> findByStudent(String username) {
        return certificateRepository.findByStudentUsernameOrderByIssuedAtDesc(username)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<CertificateDTO> findById(Long id, String username) {
        return certificateRepository.findById(id)
                .filter(c -> c.getStudentUsername().equals(username))
                .map(this::toDTO);
    }

    private CertificateDTO toDTO(CertificateEntity c) {
        CertificateDTO dto = new CertificateDTO();
        dto.setId(c.getId());
        dto.setQuizId(c.getQuizId());
        dto.setQuizTitulo(c.getQuizTitulo());
        dto.setDisciplina(c.getDisciplina());
        dto.setDisciplinaLabel(c.getDisciplinaLabel());
        dto.setScore(c.getScore());
        dto.setIssuedAt(c.getIssuedAt());
        return dto;
    }
}
