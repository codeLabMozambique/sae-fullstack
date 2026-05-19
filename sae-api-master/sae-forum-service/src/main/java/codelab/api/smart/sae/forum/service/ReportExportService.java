package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.response.AttendanceReportDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ReportExportService {

    // ── CSV ─────────────────────────────────────────────────────────────────

    public byte[] toCSV(List<AttendanceReportDTO> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("De;Ate;Escola_ID;Disciplina;Total;Prof;IA;Estudante;Sem_Resposta;Tempo_Medio_Min\n");
        for (AttendanceReportDTO r : rows) {
            sb.append(safe(r.getFrom())).append(';')
              .append(safe(r.getTo())).append(';')
              .append(safe(r.getSchoolId())).append(';')
              .append(safe(r.getDiscipline())).append(';')
              .append(r.getTotalQuestions()).append(';')
              .append(r.getAnsweredByProfessor()).append(';')
              .append(r.getAnsweredByAI()).append(';')
              .append(r.getAnsweredByStudent()).append(';')
              .append(r.getUnanswered()).append(';')
              .append(r.getAvgResponseTimeMinutes() != null ? String.format("%.1f", r.getAvgResponseTimeMinutes()) : "")
              .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ── Excel ────────────────────────────────────────────────────────────────

    public byte[] toExcel(List<AttendanceReportDTO> rows) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Relatório de Atendimento");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"De", "Até", "Escola ID", "Disciplina", "Total Perguntas",
                "Por Professor", "Por IA", "Por Estudante", "Sem Resposta", "Tempo Médio (min)"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowNum = 1;
            for (AttendanceReportDTO r : rows) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(safe(r.getFrom()));
                row.createCell(1).setCellValue(safe(r.getTo()));
                row.createCell(2).setCellValue(r.getSchoolId() != null ? r.getSchoolId() : 0);
                row.createCell(3).setCellValue(safe(r.getDiscipline()));
                row.createCell(4).setCellValue(r.getTotalQuestions());
                row.createCell(5).setCellValue(r.getAnsweredByProfessor());
                row.createCell(6).setCellValue(r.getAnsweredByAI());
                row.createCell(7).setCellValue(r.getAnsweredByStudent());
                row.createCell(8).setCellValue(r.getUnanswered());
                row.createCell(9).setCellValue(
                    r.getAvgResponseTimeMinutes() != null ? r.getAvgResponseTimeMinutes() : 0);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ── PDF (HTML imprimível) ────────────────────────────────────────────────

    public byte[] toPDF(List<AttendanceReportDTO> rows) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body{font-family:Arial,sans-serif;font-size:12px;margin:20px}")
            .append("h1{color:#1D4ED8;font-size:18px}")
            .append("table{width:100%;border-collapse:collapse;margin-top:16px}")
            .append("th{background:#1D4ED8;color:#fff;padding:8px 6px;text-align:left;font-size:11px}")
            .append("td{padding:6px;border-bottom:1px solid #E5E7EB;font-size:11px}")
            .append("tr:nth-child(even)td{background:#F9FAFB}")
            .append("</style></head><body>")
            .append("<h1>Relatório de Atendimento — SAE</h1>")
            .append("<table><thead><tr>")
            .append("<th>De</th><th>Até</th><th>Escola</th><th>Disciplina</th>")
            .append("<th>Total</th><th>Professor</th><th>IA</th><th>Estudante</th>")
            .append("<th>Sem Resp.</th><th>Tempo Médio</th>")
            .append("</tr></thead><tbody>");

        for (AttendanceReportDTO r : rows) {
            html.append("<tr>")
                .append("<td>").append(safe(r.getFrom())).append("</td>")
                .append("<td>").append(safe(r.getTo())).append("</td>")
                .append("<td>").append(safe(r.getSchoolId())).append("</td>")
                .append("<td>").append(safe(r.getDiscipline())).append("</td>")
                .append("<td>").append(r.getTotalQuestions()).append("</td>")
                .append("<td>").append(r.getAnsweredByProfessor()).append("</td>")
                .append("<td>").append(r.getAnsweredByAI()).append("</td>")
                .append("<td>").append(r.getAnsweredByStudent()).append("</td>")
                .append("<td>").append(r.getUnanswered()).append("</td>")
                .append("<td>").append(r.getAvgResponseTimeMinutes() != null
                    ? String.format("%.1f min", r.getAvgResponseTimeMinutes()) : "—").append("</td>")
                .append("</tr>");
        }
        html.append("</tbody></table></body></html>");
        return html.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String safe(Object o) {
        return o != null ? o.toString() : "";
    }
}
