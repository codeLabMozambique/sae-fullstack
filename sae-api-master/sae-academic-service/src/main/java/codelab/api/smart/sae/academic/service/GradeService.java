package codelab.api.smart.sae.academic.service;

import codelab.api.smart.sae.academic.dto.GradeDTO;
import codelab.api.smart.sae.academic.model.GradeEntity;
import codelab.api.smart.sae.academic.repository.GradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GradeService {

    @Autowired
    private GradeRepository gradeRepository;

    public List<GradeDTO> findByClassroomAndSubject(Long classroomId, Long subjectId, String academicYear) {
        return gradeRepository.findByClassroomIdAndSubjectIdAndAcademicYear(classroomId, subjectId, academicYear)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<GradeDTO> findByClassroom(Long classroomId, String academicYear) {
        return gradeRepository.findByClassroomIdAndAcademicYear(classroomId, academicYear)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public GradeDTO save(GradeDTO dto) {
        GradeEntity entity = gradeRepository
                .findByStudentIdAndClassroomIdAndSubjectIdAndAcademicYear(
                        dto.getStudentId(), dto.getClassroomId(), dto.getSubjectId(), dto.getAcademicYear())
                .orElse(new GradeEntity());

        entity.setStudentId(dto.getStudentId());
        entity.setClassroomId(dto.getClassroomId());
        entity.setSubjectId(dto.getSubjectId());
        entity.setAcademicYear(dto.getAcademicYear());
        entity.setNota1(dto.getNota1());
        entity.setNota2(dto.getNota2());
        entity.setNota3(dto.getNota3());
        entity.setAcp1(dto.getAcp1());
        entity.setAcp2(dto.getAcp2());
        entity.setMiniteste1(dto.getMiniteste1());
        entity.setMiniteste2(dto.getMiniteste2());
        entity.setExameFinal(dto.getExameFinal());
        entity.setMedia(computeMedia(entity));

        return toDTO(gradeRepository.save(entity));
    }

    private double computeMedia(GradeEntity e) {
        double notasPeriodicas = avg3(e.getNota1(), e.getNota2(), e.getNota3());
        double acp = avg2(e.getAcp1(), e.getAcp2());
        double minitestes = avg2(e.getMiniteste1(), e.getMiniteste2());
        double exame = e.getExameFinal() != null ? e.getExameFinal() : 0.0;
        return round1(notasPeriodicas * 0.4 + acp * 0.2 + minitestes * 0.1 + exame * 0.3);
    }

    private double avg3(Double a, Double b, Double c) {
        int count = 0; double sum = 0;
        if (a != null) { sum += a; count++; }
        if (b != null) { sum += b; count++; }
        if (c != null) { sum += c; count++; }
        return count == 0 ? 0.0 : sum / count;
    }

    private double avg2(Double a, Double b) {
        int count = 0; double sum = 0;
        if (a != null) { sum += a; count++; }
        if (b != null) { sum += b; count++; }
        return count == 0 ? 0.0 : sum / count;
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    private GradeDTO toDTO(GradeEntity e) {
        GradeDTO dto = new GradeDTO();
        dto.setId(e.getId());
        dto.setStudentId(e.getStudentId());
        dto.setClassroomId(e.getClassroomId());
        dto.setSubjectId(e.getSubjectId());
        dto.setAcademicYear(e.getAcademicYear());
        dto.setNota1(e.getNota1());
        dto.setNota2(e.getNota2());
        dto.setNota3(e.getNota3());
        dto.setAcp1(e.getAcp1());
        dto.setAcp2(e.getAcp2());
        dto.setMiniteste1(e.getMiniteste1());
        dto.setMiniteste2(e.getMiniteste2());
        dto.setExameFinal(e.getExameFinal());
        dto.setMedia(e.getMedia());
        return dto;
    }
}
