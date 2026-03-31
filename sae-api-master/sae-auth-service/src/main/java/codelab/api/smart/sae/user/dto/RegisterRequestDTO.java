/**
 * 
 */
package codelab.api.smart.sae.user.dto;

import codelab.api.smart.sae.user.enums.UserRoles;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public class RegisterRequestDTO {

    private String username; // <-- novo (username)
    private String email;
    private String password; // <-- o user define
    private String fullname;
    private UserRoles role; // opcional (podes ignorar no backend)

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    public UserRoles getRole() {
        return role;
    }

    public void setRole(UserRoles role) {
        this.role = role;
    }
}
