package codelab.api.smart.sae.user.dto;

public class UserListDTO {

    private Long   id;
    private String username;
    private String fullName;
    private String email;
    private String nTelefone;
    private String role;
    private int    status;

    public UserListDTO(Long id, String username, String fullName,
                       String email, String nTelefone, String role, int status) {
        this.id        = id;
        this.username  = username;
        this.fullName  = fullName;
        this.email     = email;
        this.nTelefone = nTelefone;
        this.role      = role;
        this.status    = status;
    }

    public Long   getId()        { return id; }
    public String getUsername()  { return username; }
    public String getFullName()  { return fullName; }
    public String getEmail()     { return email; }
    public String getNTelefone() { return nTelefone; }
    public String getRole()      { return role; }
    public int    getStatus()    { return status; }
}
