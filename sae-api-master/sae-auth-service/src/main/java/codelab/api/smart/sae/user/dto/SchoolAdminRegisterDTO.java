package codelab.api.smart.sae.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SchoolAdminRegisterDTO {

    @JsonProperty("nTelefone")
    @NotBlank(message = "Número de telefone é obrigatório")
    private String nTelefone;

    @NotBlank(message = "Email é obrigatório")
    private String email;

    @NotBlank(message = "Password é obrigatória")
    private String password;

    @NotBlank(message = "Nome completo é obrigatório")
    private String fullname;

    @NotNull(message = "Escola é obrigatória")
    private Long schoolId;

    public SchoolAdminRegisterDTO() {}

    public String getNTelefone() { return nTelefone; }
    public void setNTelefone(String nTelefone) { this.nTelefone = nTelefone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
}
