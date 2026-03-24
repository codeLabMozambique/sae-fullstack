/**
 * 
 */
package codelab.api.smart.sae.roleTransaction.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import codelab.api.smart.sae.appTransaction.model.TransactionEntity;
import codelab.api.smart.sae.roleTransaction.model.RoleTransactionEntity;
import codelab.api.smart.sae.user.enums.MenuType;
import codelab.api.smart.sae.user.enums.UserRoles;
 

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public interface RoleTransactionRepository extends JpaRepository<RoleTransactionEntity, Long> {

//  @Query("                                           "
//          + "select st from TransactionEntity st     "
//          + "where ut.role = :role  and ut.status = 'ACTIVE' "
//          + "order by ut.position")
    public RoleTransactionEntity findByRole(String role);
    public List<RoleTransactionEntity> findByRoleOrderByAppTransactionCode(UserRoles role);
    
    public List<RoleTransactionEntity> findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles role, MenuType type);
    
    public List<RoleTransactionEntity> findByRoleAndAppTransactionTypeAndAppTransactionParent(UserRoles role, MenuType type,TransactionEntity  parent);

}
