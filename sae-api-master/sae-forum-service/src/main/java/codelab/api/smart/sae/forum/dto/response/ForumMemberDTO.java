package codelab.api.smart.sae.forum.dto.response;

public class ForumMemberDTO {
    private String username;
    private String fullname;
    private String role; // "PROFESSOR" | "STUDENT"
    private boolean online;

    public ForumMemberDTO() {}

    public ForumMemberDTO(String username, String fullname, String role, boolean online) {
        this.username = username;
        this.fullname = fullname;
        this.role     = role;
        this.online   = online;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }
}
