/**
 * 
 */
package codelab.api.smart.sae.appTransaction.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import codelab.api.smart.sae.appTransaction.model.TransactionEntity;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {

}
