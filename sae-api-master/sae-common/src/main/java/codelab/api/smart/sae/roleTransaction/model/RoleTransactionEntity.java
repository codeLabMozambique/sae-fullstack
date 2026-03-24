package codelab.api.smart.sae.roleTransaction.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import codelab.api.smart.sae.appTransaction.model.TransactionEntity;
import codelab.api.smart.sae.framework.jpa.StatusEntity;
import codelab.api.smart.sae.user.enums.UserRoles;

@Entity
@Table(name = "ROLE_TRANSACTION")
public class RoleTransactionEntity extends StatusEntity {

    private static final long serialVersionUID = -7857502721034207140L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ROLE")
    @Enumerated(EnumType.STRING)
    private UserRoles role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "APP_TRANSACTION_ID")
    private TransactionEntity appTransaction;

    @Column(name = "APP_TRANSACTION_ID", nullable = true, insertable = false, updatable = false)
    private Long appTransactionId;

    // Getters e Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserRoles getRole() {
        return role;
    }

    public void setRole(UserRoles role) {
        this.role = role;
    }

    public TransactionEntity getAppTransaction() {
        return appTransaction;
    }

    public void setAppTransaction(TransactionEntity appTransaction) {
        this.appTransaction = appTransaction;
    }

    public Long getAppTransactionId() {
        return appTransactionId;
    }

    public void setAppTransactionId(Long appTransactionId) {
        this.appTransactionId = appTransactionId;
    }
}
