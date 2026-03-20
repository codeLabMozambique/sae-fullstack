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
public class MenuDTO implements Serializable{
    
    private static final long serialVersionUID = -3311184302196510214L;
    
    private String code;
    private String label;
    private String routerLink;
    
    private List<MenuItemDTO> items = new ArrayList<MenuItemDTO>();
    
    public MenuDTO() {
        super();
    }
    
    public MenuDTO(String code, String label) {
        super();
        this.code = code;
        this.label = label;
    }
    
    public MenuDTO(String code, String label, String routerLink) {
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
     * @return the items
     */
    public List<MenuItemDTO> getItems() {
        return items;
    }

    /**
     * @param items the items to set
     */
    public void setItems(List<MenuItemDTO> items) {
        this.items = items;
    }
    public void addItem(MenuItemDTO item) {
        this.items.add(item);
    }

    /**
     * @return the serialversionuid
     */
    public static long getSerialversionuid() {
        return serialVersionUID;
    }
    
    
}
