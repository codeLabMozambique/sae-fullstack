/**
 *
 */
package codelab.api.smart.sae.user.resource;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import codelab.api.smart.sae.framework.security.SecurityService;
import codelab.api.smart.sae.otp.OTPManager;
import codelab.api.smart.sae.user.dto.AuthenticationRequestDTO;
import codelab.api.smart.sae.user.dto.AuthenticationResponseDTO;
import codelab.api.smart.sae.user.dto.ProfessorInfoDTO;
import codelab.api.smart.sae.user.dto.ProfessorProfileDTO;
import codelab.api.smart.sae.user.dto.ProfessorRegisterDTO;
import codelab.api.smart.sae.user.dto.SchoolAdminRegisterDTO;
import codelab.api.smart.sae.user.dto.UserListDTO;
import codelab.api.smart.sae.user.dto.UserUpdateDTO;
import codelab.api.smart.sae.user.dto.ProfessorProfileUpdateDTO;
import codelab.api.smart.sae.user.dto.StudentProfileDTO;
import codelab.api.smart.sae.user.dto.StudentProfileUpdateDTO;
import codelab.api.smart.sae.user.dto.RegisterRequestDTO;
import codelab.api.smart.sae.user.dto.StudentRegisterDTO;
import codelab.api.smart.sae.user.model.ProfessorProfileEntity;
import codelab.api.smart.sae.user.model.SchoolAdminProfileEntity;
import codelab.api.smart.sae.user.model.StudentProfileEntity;
import codelab.api.smart.sae.user.model.UserEntity;
import codelab.api.smart.sae.user.dto.BulkImportResultDTO;
import codelab.api.smart.sae.user.service.ProfessorImportService;
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
    private ProfessorImportService professorImportService;

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
        return new ResponseEntity<>(java.util.Map.of(
                "id",       user.getId() != null ? user.getId() : 0,
                "username", user.getUsername(),
                "fullname", user.getFullname() != null ? user.getFullname() : "",
                "email",    user.getEmail() != null ? user.getEmail() : ""
        ), HttpStatus.CREATED);
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

    @PostMapping("/signup/school-admin")
    public ResponseEntity<?> signupSchoolAdmin(@RequestBody SchoolAdminRegisterDTO registerRequest) throws Exception {
        SchoolAdminProfileEntity profile = userService.createSchoolAdmin(registerRequest);
        return new ResponseEntity<>(profile, HttpStatus.CREATED);
    }

    @GetMapping("/school-admin-profile")
    public ResponseEntity<?> getSchoolAdminProfile(Authentication auth) {
        return ResponseEntity.ok(userService.getSchoolAdminProfile(auth.getName()));
    }

    @GetMapping("/my-school/members")
    public ResponseEntity<List<UserListDTO>> getMySchoolMembers(Authentication auth) {
        return ResponseEntity.ok(userService.getUsersBySchool(auth.getName()));
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserListDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    @GetMapping("/professors")
    public ResponseEntity<List<ProfessorProfileDTO>> getProfessors(Authentication auth) {
        return ResponseEntity.ok(userService.findProfessors(auth));
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentProfileDTO>> getStudents(Authentication auth) {
        return ResponseEntity.ok(userService.findStudents(auth));
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
        response.setMustChangePassword(principal.isMustChangePassword());
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

    @GetMapping("/students-by-school")
    public ResponseEntity<List<StudentProfileDTO>> getStudentsBySchool(@RequestParam Long schoolId) {
        return ResponseEntity.ok(userService.findStudentsBySchool(schoolId));
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

    // ════════════════════════════════════════════════════════════
    // PERFIL PRÓPRIO — qualquer utilizador autenticado
    // ════════════════════════════════════════════════════════════

    /** Devolve os dados do utilizador autenticado (username, fullName, email, role). */
    @GetMapping("/me")
    public ResponseEntity<java.util.Map<String, Object>> getMyProfile(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return userService.findBasicByUsername(auth.getName())
                .map(m -> {
                    // Acrescentar email
                    userService.findEmailByUsername(auth.getName()).ifPresent(e -> m.put("email", e));
                    return ResponseEntity.ok(m);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Actualiza nome e email do próprio utilizador autenticado. */
    @PutMapping("/me")
    public ResponseEntity<java.util.Map<String, Object>> updateMyProfile(
            @RequestBody java.util.Map<String, String> payload,
            Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        userService.updateMyProfile(auth.getName(),
                payload.get("fullName"), payload.get("email"));
        return userService.findBasicByUsername(auth.getName())
                .map(m -> {
                    userService.findEmailByUsername(auth.getName()).ifPresent(e -> m.put("email", e));
                    return ResponseEntity.ok(m);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Muda a password do próprio utilizador (precisa de password actual). */
    @PutMapping("/me/password")
    public ResponseEntity<java.util.Map<String, String>> changeMyPassword(
            @RequestBody java.util.Map<String, String> payload,
            Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        userService.changeMyPassword(auth.getName(),
                payload.get("currentPassword"), payload.get("newPassword"));
        return ResponseEntity.ok(java.util.Map.of("message", "Password actualizada"));
    }

    /** Devolve { userId } dado um username — usado por micro-serviços internos */
    @GetMapping("/user-id-by-username")
    public ResponseEntity<java.util.Map<String, Object>> getUserIdByUsername(@RequestParam String username) {
        return userService.findUserIdByUsername(username)
                .map(id -> ResponseEntity.ok(java.util.Map.<String, Object>of("userId", id)))
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

    // ════════════════════════════════════════════════════════════
    // APROVAÇÃO DE PROFESSORES
    // ════════════════════════════════════════════════════════════

    @GetMapping("/professors/pending")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    public ResponseEntity<java.util.List<ProfessorProfileDTO>> getPendingProfessors(Authentication auth) {
        return ResponseEntity.ok(userService.findPendingProfessors(auth));
    }

    @PutMapping("/professors/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    public ResponseEntity<ProfessorProfileDTO> approveProfessor(@PathVariable Long id) {
        return ResponseEntity.ok(userService.approveProfessor(id));
    }

    @PutMapping("/professors/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    public ResponseEntity<ProfessorProfileDTO> rejectProfessor(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(userService.rejectProfessor(id, reason));
    }

    // ════════════════════════════════════════════════════════════
    // IMPORT EM MASSA DE PROFESSORES
    // ════════════════════════════════════════════════════════════

    @PostMapping(value = "/professors/bulk-import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    public ResponseEntity<BulkImportResultDTO> bulkImportProfessors(
            @RequestPart("file") MultipartFile file,
            Authentication auth) throws java.io.IOException {
        BulkImportResultDTO result = professorImportService.importFromFile(file, auth);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/professors/import-template")
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        String csv = "nTelefone;email;nomeCompleto;departamento;especializacao;contactoInstitucional;nomeEscola\n"
                   + "841234567;professor@escola.mz;Ana Silva;Matemática;Cálculo Diferencial;;Escola Secundária de Nampula\n"
                   + "851234567;pedro@escola.mz;Pedro Matos;Ciências;Biologia;;Escola Secundária de Nampula\n";
        byte[] bytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "modelo_professores.csv");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    // ════════════════════════════════════════════════════════════
    // LGPD — DADOS PESSOAIS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/me/export")
    public ResponseEntity<java.util.Map<String, Object>> exportMyData(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.exportMyData(auth.getName()));
    }

    @DeleteMapping("/me/anonymize")
    public ResponseEntity<java.util.Map<String, String>> anonymizeMyAccount(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        userService.anonymizeAccount(auth.getName());
        return ResponseEntity.ok(java.util.Map.of("message", "Conta anonimizada com sucesso"));
    }

}
