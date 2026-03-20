/**
 * 
 */
package codelab.api.smart.sae.user.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
 

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public class AuthenticationResponseDTO implements Serializable {

    private static final long serialVersionUID = -1250867815652061380L;

    private String fullName;
    private String username;
    private String token;
    private String role;
    private List<MenuDTO> menus = new ArrayList<>(); 
    
    public AuthenticationResponseDTO() {

    }
    
    public AuthenticationResponseDTO (String fullName, String username, String token) {
        this.setUsername(username);
        this.setFullName(fullName);
        this.setToken(token);
        
        
    }
    public AuthenticationResponseDTO (String fullName, String username, String token, List<MenuDTO> menus, String role) {
        this.setUsername(username);
        this.setFullName(fullName);
        this.setToken(token);
        this.setMenus(menus);
        this.setRole(role);
        
        
    }




   




    /**
     * @return the role
     */
    public String getRole() {
        return role;
    }

    /**
     * @param role the role to set
     */
    public void setRole(String role) {
        this.role = role;
    }

    /**
     * @return the fullName
     */
    public String getFullName() {
        return fullName;
    }

    /**
     * @param fullName the fullName to set
     */
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    /**
     * @return the username
     */
    public String getUsername() {
        return username;
    }

    /**
     * @param username the username to set
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * @return the token
     */
    public String getToken() {
        return token;
    }

    /**
     * @param token the token to set
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * @return the menus
     */
    public List<MenuDTO> getMenus() {
        return menus;
    }

    /**
     * @param menus the menus to set
     */
    public void setMenus(List<MenuDTO> menus) {
        this.menus = menus;
    }
    
    
}
