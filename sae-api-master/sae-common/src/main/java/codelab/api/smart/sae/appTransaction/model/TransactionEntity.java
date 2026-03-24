package codelab.api.smart.sae.appTransaction.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;

import codelab.api.smart.sae.framework.jpa.StatusEntity;
import codelab.api.smart.sae.user.enums.MenuType;

@Entity
@Table(name = "APP_TRANSACTION")
public class TransactionEntity extends StatusEntity {

    private static final long serialVersionUID = -7857502721034207140L;

    @Column(name = "CODE", unique = true)
    private String code;

    @Column(name = "TYPE")
    @Enumerated(EnumType.STRING)
    private MenuType type;

    @Column(name = "LABEL")
    private String label;

    @Column(name = "ROUTER_LINK")
    private String routerLink;

    @Column(name = "POSITION")
    private Long position;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARENT_ID")
    private TransactionEntity parent;

    @Column(name = "PARENT_ID", nullable = true, insertable = false, updatable = false)
    private Long parentId;

    public TransactionEntity() {
        super();
    }

    // Getters e Setters
    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getRouterLink() {
        return routerLink;
    }

    public void setRouterLink(String routerLink) {
        this.routerLink = routerLink;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public MenuType getType() {
        return type;
    }

    public void setType(MenuType type) {
        this.type = type;
    }

    public Long getPosition() {
        return position;
    }

    public void setPosition(Long position) {
        this.position = position;
    }

    public TransactionEntity getParent() {
        return parent;
    }

    public void setParent(TransactionEntity parent) {
        this.parent = parent;
        setParentId(parent != null ? parent.getId() : null);
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
}
