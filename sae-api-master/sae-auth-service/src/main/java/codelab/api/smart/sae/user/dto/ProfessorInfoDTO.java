package codelab.api.smart.sae.user.dto;

public class ProfessorInfoDTO {

    private String username;
    private String fullname;
    private boolean online;
    private String specialization;

    public ProfessorInfoDTO() {}

    public ProfessorInfoDTO(String username, String fullname, boolean online, String specialization) {
        this.username = username;
        this.fullname = fullname;
        this.online = online;
        this.specialization = specialization;
    }

    public String getUsername()        { return username; }
    public String getFullname()        { return fullname; }
    public boolean isOnline()          { return online; }
    public String getSpecialization()  { return specialization; }

    public void setUsername(String username)              { this.username = username; }
    public void setFullname(String fullname)              { this.fullname = fullname; }
    public void setOnline(boolean online)                 { this.online = online; }
    public void setSpecialization(String specialization)  { this.specialization = specialization; }
}
