/**
 *
 */
package codelab.api.smart.sae.user.resource;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import codelab.api.smart.sae.framework.security.SecurityService;
import codelab.api.smart.sae.otp.OTPManager;
import codelab.api.smart.sae.user.dto.AuthenticationRequestDTO;
import codelab.api.smart.sae.user.dto.AuthenticationResponseDTO;
import codelab.api.smart.sae.user.dto.ProfessorInfoDTO;
import codelab.api.smart.sae.user.dto.ProfessorProfileDTO;
import codelab.api.smart.sae.user.dto.ProfessorRegisterDTO;
import codelab.api.smart.sae.user.dto.UserListDTO;
import codelab.api.smart.sae.user.dto.UserUpdateDTO;
import codelab.api.smart.sae.user.dto.ProfessorProfileUpdateDTO;
import codelab.api.smart.sae.user.dto.StudentProfileDTO;
import codelab.api.smart.sae.user.dto.StudentProfileUpdateDTO;
import codelab.api.smart.sae.user.dto.RegisterRequestDTO;
import codelab.api.smart.sae.user.dto.StudentRegisterDTO;
import codelab.api.smart.sae.user.model.ProfessorProfileEntity;
import codelab.api.smart.sae.user.model.StudentProfileEntity;
import codelab.api.smart.sae.user.model.UserEntity;
import codelab.api.smart.sae.user.service.UserService;
import codelab.api.smart.sae.user.validators.UserRoleValidator;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
@RestController
@RequestMapping("/users")
public class UserResource {
    @Autowired
    private UserService userService;
    @Autowired
    private SecurityService securityService;

    @Autowired
    private OTPManager otpManager;

    @GetMapping("/otpValidation/{otp}")
    public ResponseEntity<?> validation(@PathVariable String otp) {
        System.out.println("OPT gerado 1: " + otp);

        Boolean otpValid = otpManager.validateOTP(otp);
        System.out.println("OPT gerado: " + otpValid);
        return new ResponseEntity<>(
                otpValid,
                HttpStatus.CREATED);

    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody RegisterRequestDTO registerRequest) throws Exception {
        UserEntity user = userService.createUser(registerRequest);
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/signup/professor")
    public ResponseEntity<?> signupProfessor(@RequestBody ProfessorRegisterDTO registerRequest) throws Exception {
        ProfessorProfileEntity profile = userService.createProfessor(registerRequest);
        return new ResponseEntity<>(profile, HttpStatus.CREATED);
    }

    @PostMapping("/signup/student")
    public ResponseEntity<?> signupStudent(@RequestBody StudentRegisterDTO registerRequest) throws Exception {
        StudentProfileEntity profile = userService.createStudent(registerRequest);
        return new ResponseEntity<>(profile, HttpStatus.CREATED);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserListDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    @GetMapping("/professors")
    public ResponseEntity<List<ProfessorProfileDTO>> getProfessors() {
        return ResponseEntity.ok(userService.findAllProfessors());
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateUser(@RequestBody UserUpdateDTO dto) {
        return ResponseEntity.ok(userService.updateUser(dto));
    }

    @GetMapping("/professor-profile")
    public ResponseEntity<ProfessorProfileDTO> getProfessorProfile(@RequestParam Long userId) {
        return ResponseEntity.ok(userService.getProfessorProfile(userId));
    }

    @PutMapping("/professor-profile")
    public ResponseEntity<ProfessorProfileDTO> updateProfessorProfile(@RequestBody ProfessorProfileUpdateDTO dto) {
        return ResponseEntity.ok(userService.updateProfessorProfile(dto));
    }

    @GetMapping("/student-profile")
    public ResponseEntity<StudentProfileDTO> getStudentProfile(@RequestParam Long userId) {
        return ResponseEntity.ok(userService.getStudentProfile(userId));
    }

    @GetMapping("/my-student-profile")
    public ResponseEntity<StudentProfileDTO> getMyStudentProfile(Authentication auth) {
        StudentProfileDTO dto = userService.getStudentProfileByUsername(auth.getName());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PutMapping("/student-profile")
    public ResponseEntity<StudentProfileDTO> updateStudentProfile(@RequestBody StudentProfileUpdateDTO dto) {
        return ResponseEntity.ok(userService.updateStudentProfile(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<?> signin(@RequestBody AuthenticationRequestDTO authenticationRequest) throws Exception {

        String jwt = this.securityService.authenticate(authenticationRequest);

        UserEntity principal = securityService.getPrincipal();

        // Null checks for role translation
        String roleName = "GUEST"; // Default role if none assigned
        if (principal.getRole() != null && principal.getRole().getRole() != null) {
            roleName = principal.getRole().getRole().name();
        }

        AuthenticationResponseDTO response = new AuthenticationResponseDTO(principal.getFullname(),
                principal.getUsername(),
                jwt, userService.findTransactionsByRole(principal),
                UserRoleValidator.validate(roleName));
        response.setUserId(principal.getId());
        if (roleName.contains("PROFESSOR"))
            userService.setProfessorOnline(principal.getUsername(), true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/professor/{username}/specializations")
    public ResponseEntity<String[]> getProfessorSpecializations(@PathVariable String username) {
        String[] specializations = userService.getProfessorSpecializations(username);
        return ResponseEntity.ok(specializations);
    }

    @GetMapping("/professors/by-discipline")
    public ResponseEntity<List<ProfessorInfoDTO>> getProfessorsByDiscipline(
            @RequestParam String disciplina) {
        return ResponseEntity.ok(userService.getProfessorsByDiscipline(disciplina));
    }

    @GetMapping("/students-by-classroom")
    public ResponseEntity<List<StudentProfileDTO>> getStudentsByClassroom(@RequestParam Long classroomId) {
        return ResponseEntity.ok(userService.findStudentsByClassroom(classroomId));
    }

    @GetMapping("/student-profile-by-username")
    public ResponseEntity<StudentProfileDTO> getStudentProfileByUsername(@RequestParam String username) {
        return ResponseEntity.ok(userService.findStudentProfileByUsername(username));
    }

    /**
     * Lookup leve de utilizador por username — usado por outros micro-serviços
     * (content-service, forum-service) para resolver o nome completo a partir
     * do telefone (subject do JWT) sem expor todo o perfil.
     *
     * Devolve { username, fullName, role } ou 404 se não existir.
     */
    @GetMapping("/by-username")
    public ResponseEntity<java.util.Map<String, Object>> getBasicUserByUsername(@RequestParam String username) {
        return userService.findBasicByUsername(username)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/professor/heartbeat")
    public ResponseEntity<Void> professorHeartbeat(Authentication auth) {
        if (auth == null || auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("PROFESSOR")))
            return ResponseEntity.status(403).build();
        userService.setProfessorOnline(auth.getName(), true);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/professor/go-offline")
    public ResponseEntity<Void> professorGoOffline(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        userService.setProfessorOnline(auth.getName(), false);
        return ResponseEntity.noContent().build();
    }

}
