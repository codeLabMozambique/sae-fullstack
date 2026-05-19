package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.dto.response.AttendanceReportDTO;
import codelab.api.smart.sae.forum.dto.response.ForumStatsDTO;
import codelab.api.smart.sae.forum.service.AttendanceReportService;
import codelab.api.smart.sae.forum.service.ForumQuestionService;
import codelab.api.smart.sae.forum.service.ReportExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/questions/reports")
@PreAuthorize("hasAnyAuthority('ADMIN', 'SCHOOL_ADMIN')")
public class ForumReportResource {

    @Autowired private AttendanceReportService reportService;
    @Autowired private ReportExportService exportService;
    @Autowired private ForumQuestionService questionService;

    // Estatísticas filtradas por escola
    @GetMapping("/stats")
    public ResponseEntity<ForumStatsDTO> getStats(
            @RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(questionService.getStatsOverview(schoolId));
    }

    // Relatório de atendimento (JSON)
    @GetMapping("/attendance")
    public ResponseEntity<AttendanceReportDTO> getAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String discipline) {
        return ResponseEntity.ok(reportService.generate(from, to, schoolId, discipline));
    }

    // Exportar relatório de atendimento
    @GetMapping("/attendance/export")
    public ResponseEntity<byte[]> exportAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String discipline,
            @RequestParam(defaultValue = "csv") String format) throws IOException {

        AttendanceReportDTO report = reportService.generate(from, to, schoolId, discipline);
        List<AttendanceReportDTO> rows = List.of(report);

        byte[] data;
        MediaType mediaType;
        String filename;

        switch (format.toLowerCase()) {
            case "excel":
            case "xlsx":
                data = exportService.toExcel(rows);
                mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                filename = "relatorio-atendimento.xlsx";
                break;
            case "pdf":
                data = exportService.toPDF(rows);
                mediaType = MediaType.TEXT_HTML;
                filename = "relatorio-atendimento.html";
                break;
            default:
                data = exportService.toCSV(rows);
                mediaType = MediaType.parseMediaType("text/csv;charset=UTF-8");
                filename = "relatorio-atendimento.csv";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(
            ContentDisposition.attachment().filename(filename).build());

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(mediaType)
                .body(data);
    }
}
