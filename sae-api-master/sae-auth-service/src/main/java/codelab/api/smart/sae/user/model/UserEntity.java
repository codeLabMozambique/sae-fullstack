package codelab.api.smart.sae.user.model;

import java.util.Collection;
import java.util.Set;
import java.util.HashSet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import codelab.api.smart.sae.framework.jpa.UpdatableEntity;
import codelab.api.smart.sae.roleTransaction.model.RoleTransactionEntity;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
@Entity
@Table(name = "sae_USER", uniqueConstraints = { @UniqueConstraint(columnNames = "USERNAME") })
public class UserEntity extends UpdatableEntity implements UserDetails {

    private static final long serialVersionUID = -3509283733349027740L;

    // @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    // @Column(name = "ID")
    // private Long id;

    @NotNull
    @Column(name = "USERNAME", nullable = false, unique = true)
    private String username;

    @Column(name = "EMAIL", nullable = true, unique = true)
    private String email;

    @Column(name = "PASSWORD", nullable = false)
    private String password;

    @Column(name = "FULL_NAME")
    private String fullname;

    @Column(name = "ENABLED")
    private boolean enabled;

    @ManyToOne
    @JoinColumn(name = "roleT_id")
    private RoleTransactionEntity role;

    public UserEntity() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserEntity(String fullName, String username, String password) {
        super();
        this.fullname = fullName;
        this.username = username;
        this.password = password;
    }

    public RoleTransactionEntity getRole() {
        return role;
    }

    public void setRole(RoleTransactionEntity role) {
        this.role = role;
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

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();
        if (this.getRole() != null && this.getRole().getRole() != null) {
            String roleName = this.getRole().getRole().name();
            System.out.println("Role do usuário: " + roleName);
            authorities.add(new SimpleGrantedAuthority(roleName));
        } else {
            System.out.println("Role ou RoleName está nulo para o usuário: " + this.username);
        }
        return authorities;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = super.hashCode();
        result = prime * result + ((username == null) ? 0 : username.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (!super.equals(obj))
            return false;
        if (getClass() != obj.getClass())
            return false;
        UserEntity other = (UserEntity) obj;
        if (username == null) {
            if (other.username != null)
                return false;
        } else if (!username.equals(other.username))
            return false;
        return true;
    }

    @Override
    public String getUsername() {
        return this.username;
    }
}
