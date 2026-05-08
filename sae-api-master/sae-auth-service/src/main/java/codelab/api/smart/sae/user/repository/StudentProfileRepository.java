package codelab.api.smart.sae.user.repository;

import codelab.api.smart.sae.user.model.StudentProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfileEntity, Long> {

    Optional<StudentProfileEntity> findByUser_Id(Long userId);

    @Query("SELECT s FROM StudentProfileEntity s WHERE s.user.username = :username")
    Optional<StudentProfileEntity> findByUsername(@Param("username") String username);

    List<StudentProfileEntity> findByClassroomId(Long classroomId);
}
