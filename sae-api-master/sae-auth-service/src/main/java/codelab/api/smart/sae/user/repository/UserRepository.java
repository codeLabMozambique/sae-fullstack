/**
 * 
 */
package codelab.api.smart.sae.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import codelab.api.smart.sae.user.model.UserEntity;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByPasswordResetToken(String token);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

}
