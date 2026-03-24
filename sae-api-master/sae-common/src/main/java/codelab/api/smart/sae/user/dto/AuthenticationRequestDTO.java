/**
 * 
 */
package codelab.api.smart.sae.user.dto;

import java.io.Serializable;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public class AuthenticationRequestDTO implements Serializable {
    private static final long serialVersionUID = -1250867815652061380L;

    private String nTelefone;
    private String password;
    
    public AuthenticationRequestDTO() {

    }

    public AuthenticationRequestDTO(String nTelefone, String password) {
        this.setNtelefone(password);
        this.setPassword(password);
    }

    /**
     * @return the email
     */
    public String getNtelefone() {
        return nTelefone;
    }

    /**
     * @param email the email to set
     */
    public void setNtelefone(String username) {
        this.nTelefone = username;
    }

    /**
     * @return the password
     */
    public String getPassword() {
        return password;
    }

    /**
     * @param password the password to set
     */
    public void setPassword(String password) {
        this.password = password;
    }
    
}
