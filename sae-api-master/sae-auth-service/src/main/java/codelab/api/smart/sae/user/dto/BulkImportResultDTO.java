package codelab.api.smart.sae.user.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkImportResultDTO {

    private int totalRows;
    private int imported;
    private int failed;
    private List<RowResult> rows = new ArrayList<>();

    public static class RowResult {
        private int row;
        private String nTelefone;
        private String fullname;
        private boolean success;
        private String error;

        public RowResult() {}

        public RowResult(int row, String nTelefone, String fullname, boolean success, String error) {
            this.row = row;
            this.nTelefone = nTelefone;
            this.fullname = fullname;
            this.success = success;
            this.error = error;
        }

        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
        public String getNTelefone() { return nTelefone; }
        public void setNTelefone(String nTelefone) { this.nTelefone = nTelefone; }
        public String getFullname() { return fullname; }
        public void setFullname(String fullname) { this.fullname = fullname; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }

    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }
    public int getImported() { return imported; }
    public void setImported(int imported) { this.imported = imported; }
    public int getFailed() { return failed; }
    public void setFailed(int failed) { this.failed = failed; }
    public List<RowResult> getRows() { return rows; }
    public void setRows(List<RowResult> rows) { this.rows = rows; }
}
