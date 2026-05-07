package codelab.api.smart.sae.user.dto;

public class UserUpdateDTO {

    private Long   userId;
    private String fullname;
    private String email;

    public UserUpdateDTO() {}

    public Long   getUserId()  { return userId; }
    public String getFullname() { return fullname; }
    public String getEmail()    { return email; }

    public void setUserId(Long userId)     { this.userId   = userId; }
    public void setFullname(String fullname) { this.fullname = fullname; }
    public void setEmail(String email)     { this.email    = email; }
}
