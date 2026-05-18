package codelab.api.smart.sae.user.service;

import codelab.api.smart.sae.framework.exception.BusinessException;
import codelab.api.smart.sae.user.dto.BulkImportResultDTO;
import codelab.api.smart.sae.user.dto.ProfessorRegisterDTO;
import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.user.repository.SchoolAdminProfileRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

/**
 * Processa o import em massa de professores a partir de CSV ou Excel.
 * Delega a criação de cada professor ao UserService (transacção por linha).
 */
@Service
public class ProfessorImportService {

    @Autowired
    private UserService userService;

    @Autowired
    private SchoolAdminProfileRepository schoolAdminProfileRepository;

    // ── Colunas esperadas (0-based) ──────────────────────────────────────────
    // 0: nTelefone | 1: email | 2: nomeCompleto | 3: departamento
    // 4: especializacao | 5: contactoInstitucional | 6: idEscola (opcional)

    public BulkImportResultDTO importFromFile(MultipartFile file, Authentication auth) throws IOException {
        Long defaultSchoolId = resolveDefaultSchoolId(auth);
        List<String[]> rows = parseFile(file);

        BulkImportResultDTO result = new BulkImportResultDTO();
        result.setTotalRows(Math.max(0, rows.size() - 1));

        for (int i = 1; i < rows.size(); i++) {
            String[] cols = rows.get(i);

            // skip completely empty rows
            if (allBlank(cols)) continue;

            String phone           = col(cols, 0);
            String email           = col(cols, 1);
            String fullname        = col(cols, 2);
            String department      = col(cols, 3);
            String specialization  = col(cols, 4);
            String contact         = col(cols, 5);
            String schoolIdStr     = col(cols, 6);

            Long schoolId = defaultSchoolId;
            if (schoolIdStr != null && !schoolIdStr.isBlank()) {
                try { schoolId = Long.parseLong(schoolIdStr.trim()); }
                catch (NumberFormatException ignored) {}
            }

            if (blank(phone) || blank(email) || blank(fullname)) {
                fail(result, i + 1, phone, fullname, "Campos obrigatórios em falta: telefone, email ou nome");
                continue;
            }
            if (schoolId == null) {
                fail(result, i + 1, phone, fullname, "ID de escola não especificado na linha nem no perfil do admin");
                continue;
            }

            ProfessorRegisterDTO dto = new ProfessorRegisterDTO();
            dto.setNTelefone(phone.trim());
            dto.setEmail(email.trim());
            dto.setFullname(fullname.trim());
            dto.setPassword("SAE@" + Year.now().getValue());
            dto.setSchoolId(schoolId);
            dto.setDepartment(blank(department) ? null : department.trim());
            dto.setSpecialization(blank(specialization) ? null : specialization.trim());
            dto.setInstitutionalContact(blank(contact) ? null : contact.trim());

            try {
                userService.createProfessor(dto);
                result.getRows().add(new BulkImportResultDTO.RowResult(i + 1, phone, fullname, true, null));
                result.setImported(result.getImported() + 1);
            } catch (Exception e) {
                String msg = (e instanceof BusinessException) ? e.getMessage() : "Erro interno ao criar professor";
                fail(result, i + 1, phone, fullname, msg);
            }
        }

        return result;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private void fail(BulkImportResultDTO r, int rowNum, String phone, String name, String err) {
        r.getRows().add(new BulkImportResultDTO.RowResult(rowNum, phone, name, false, err));
        r.setFailed(r.getFailed() + 1);
    }

    private Long resolveDefaultSchoolId(Authentication auth) {
        if (auth == null) return null;
        boolean isSchoolAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(UserRoles.SCHOOL_ADMIN.name()));
        if (!isSchoolAdmin) return null;
        return schoolAdminProfileRepository.findByUserUsername(auth.getName())
                .map(p -> p.getSchoolId())
                .orElse(null);
    }

    private List<String[]> parseFile(MultipartFile file) throws IOException {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (name.endsWith(".csv")) {
            return parseCsv(file.getInputStream());
        }
        if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
            return parseExcel(file.getInputStream());
        }
        throw new BusinessException("Formato não suportado. Use .csv, .xlsx ou .xls");
    }

    private List<String[]> parseCsv(InputStream is) throws IOException {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String first = reader.readLine();
            if (first == null) return rows;
            char delim = first.contains(";") ? ';' : ',';
            rows.add(first.split(String.valueOf(delim), -1));
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) rows.add(line.split(String.valueOf(delim), -1));
            }
        }
        return rows;
    }

    private List<String[]> parseExcel(InputStream is) throws IOException {
        List<String[]> rows = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);
            for (Row row : sheet) {
                int last = row.getLastCellNum();
                if (last <= 0) continue;
                String[] cols = new String[last];
                for (int c = 0; c < last; c++) {
                    cols[c] = cellString(row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL));
                }
                rows.add(cols);
            }
        }
        return rows;
    }

    private String cellString(Cell cell) {
        if (cell == null) return "";
        CellType type = cell.getCellType() == CellType.FORMULA
                ? cell.getCachedFormulaResultType() : cell.getCellType();
        switch (type) {
            case STRING:  return cell.getStringCellValue().trim();
            case NUMERIC: {
                double v = cell.getNumericCellValue();
                return v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default:      return "";
        }
    }

    private String col(String[] cols, int idx) {
        return (idx < cols.length && cols[idx] != null) ? cols[idx].trim() : null;
    }

    private boolean blank(String s) { return s == null || s.isBlank(); }

    private boolean allBlank(String[] cols) {
        for (String c : cols) if (c != null && !c.isBlank()) return false;
        return true;
    }
}
