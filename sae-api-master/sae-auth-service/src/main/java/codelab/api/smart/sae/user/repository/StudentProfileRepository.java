package codelab.api.smart.sae.user.repository;

import codelab.api.smart.sae.user.model.StudentProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfileEntity, Long> {

    Optional<StudentProfileEntity> findByUser_Id(Long userId);
}
