package codelab.api.smart.sae.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StudentRegisterDTO {

    @NotBlank(message = "Número de telefone é obrigatório")
    private String nTelefone;

    @NotBlank(message = "Password é obrigatória")
    private String password;

    @NotBlank(message = "Nome completo é obrigatório")
    private String fullname;

    @NotNull(message = "Turma é obrigatória")
    private Long classroomId;

    private Integer age;

    public StudentRegisterDTO() {}

    public String getNTelefone() { return nTelefone; }
    public void setNTelefone(String nTelefone) { this.nTelefone = nTelefone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
