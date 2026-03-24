/**
 * 
 */
package codelab.api.smart.sae.user.dto;

import java.io.Serializable;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public class MenuItemDTO implements Serializable {
    
    private static final long serialVersionUID =  -5211470167847604347L;
    
    private String code;
    private String label;
    private String routerLink;
    
    public MenuItemDTO() {
        super();
    }
    
    public MenuItemDTO(String code, String label, String routerLink) {
        super();
        this.code = code;
        this.label = label;
        this.routerLink = routerLink;
    }

    /**
     * @return the code
     */
    public String getCode() {
        return code;
    }

    /**
     * @param code the code to set
     */
    public void setCode(String code) {
        this.code = code;
    }

    /**
     * @return the label
     */
    public String getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     */
    public void setLabel(String label) {
        this.label = label;
    }

    /**
     * @return the routerLink
     */
    public String getRouterLink() {
        return routerLink;
    }

    /**
     * @param routerLink the routerLink to set
     */
    public void setRouterLink(String routerLink) {
        this.routerLink = routerLink;
    }

    /**
     * @return the serialversionuid
     */
    public static long getSerialversionuid() {
        return serialVersionUID;
    }
    
    
}
