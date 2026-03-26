package codelab.api.smart.sae.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProfessorRegisterDTO {

    @NotBlank(message = "Número de telefone é obrigatório")
    private String nTelefone;

    @NotBlank(message = "Password é obrigatória")
    private String password;

    @NotBlank(message = "Nome completo é obrigatório")
    private String fullname;

    @NotNull(message = "Escola é obrigatória")
    private Long schoolId;

    private String institutionalContact;

    public ProfessorRegisterDTO() {}

    public String getNTelefone() { return nTelefone; }
    public void setNTelefone(String nTelefone) { this.nTelefone = nTelefone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getInstitutionalContact() { return institutionalContact; }
    public void setInstitutionalContact(String institutionalContact) { this.institutionalContact = institutionalContact; }
}
