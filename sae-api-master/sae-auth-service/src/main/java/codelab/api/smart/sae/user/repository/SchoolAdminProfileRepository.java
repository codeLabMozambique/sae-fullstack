package codelab.api.smart.sae.user.repository;

import codelab.api.smart.sae.user.model.SchoolAdminProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolAdminProfileRepository extends JpaRepository<SchoolAdminProfileEntity, Long> {
    Optional<SchoolAdminProfileEntity> findByUser_Id(Long userId);
    Optional<SchoolAdminProfileEntity> findByUserUsername(String username);
    List<SchoolAdminProfileEntity> findBySchoolId(Long schoolId);
}
