/**
 * 
 */
package codelab.api.smart.sae.user.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import codelab.api.smart.sae.framework.exception.BusinessException;
import codelab.api.smart.sae.roleTransaction.model.RoleTransactionEntity;
import codelab.api.smart.sae.roleTransaction.repository.RoleTransactionRepository;
import codelab.api.smart.sae.user.dto.MenuDTO;
import codelab.api.smart.sae.user.dto.MenuItemDTO;
import codelab.api.smart.sae.user.dto.ProfessorProfileDTO;
import codelab.api.smart.sae.user.dto.UserListDTO;
import codelab.api.smart.sae.user.dto.UserUpdateDTO;
import codelab.api.smart.sae.user.dto.ProfessorProfileUpdateDTO;
import codelab.api.smart.sae.user.dto.StudentProfileDTO;
import codelab.api.smart.sae.user.dto.StudentProfileUpdateDTO;
import codelab.api.smart.sae.user.dto.BulkImportResultDTO;
import codelab.api.smart.sae.user.dto.ProfessorRegisterDTO;
import codelab.api.smart.sae.user.dto.RegisterRequestDTO;
import codelab.api.smart.sae.user.dto.StudentRegisterDTO;
import codelab.api.smart.sae.user.enums.MenuType;
import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.user.model.ProfessorProfileEntity;
import codelab.api.smart.sae.user.model.StudentProfileEntity;
import codelab.api.smart.sae.user.model.UserEntity;
import codelab.api.smart.sae.user.dto.SchoolAdminRegisterDTO;
import codelab.api.smart.sae.user.model.SchoolAdminProfileEntity;
import codelab.api.smart.sae.framework.jpa.EntityState;
import codelab.api.smart.sae.user.model.StudentEnrollmentEntity;
import codelab.api.smart.sae.user.repository.ProfessorProfileRepository;
import codelab.api.smart.sae.user.repository.SchoolAdminProfileRepository;
import codelab.api.smart.sae.user.repository.StudentEnrollmentRepository;
import codelab.api.smart.sae.user.repository.StudentProfileRepository;
import codelab.api.smart.sae.user.repository.UserRepository;
import codelab.api.smart.sae.user.validators.ContactValidator;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleTransactionRepository roleTransactionRepository;

    @Autowired
    private ProfessorProfileRepository professorProfileRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SchoolAdminProfileRepository schoolAdminProfileRepository;

    @Autowired
    private StudentEnrollmentRepository studentEnrollmentRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // @Autowired
    // private OTPManager otpManager;

    // @Transactional
    // public UserEntity createUser(RegisterRequestDTO request) {

    // if (userRepository.existsByUsername(request.getUsername()) )
    // throw new BusinessException("Já existe uma conta com o email fornecido");

    // UserEntity tmp_user = new UserEntity();

    // List<RoleTransactionEntity> roleT =
    // roleTransactionRepository.findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.ADMIN,
    // MenuType.HEADER);

    // RoleTransactionEntity tmp_roleT = roleT.get(0);
    // System.out.println("role: "+ tmp_roleT.getRole()+ "status: "+
    // tmp_roleT.getId() );

    // String generatedPass = this.generateCommonLangPassword();
    // System.out.println(generatedPass);

    // tmp_user.setFullname(request.getFullname());
    // tmp_user.setUsername(request.getUsername());
    // tmp_user.setPassword(passwordEncoder.encode(generatedPass));
    // tmp_user.setRole(tmp_roleT);
    // tmp_user.setEnabled(true);

    // LocalDateTime creationDate = LocalDateTime.now();
    // tmp_user.setCreatedDate(creationDate);
    // System.out.println("username: "+tmp_user.getUsername()+" fullname:
    // "+tmp_user.getFullname());

    // userRepository.save(tmp_user);
    // // String message = "<p>Prezado(a) <strong>" + tmp_user.getFullname() +
    // "</strong>,</p>" +
    // // "<p>Esperamos que este e-mail o(a) encontre bem.</p>" +
    // // "<p>Estamos entrando em contato para fornecer suas credenciais de acesso
    // ao sistema smartsae. Por favor, encontre abaixo suas informações de
    // login:</p>" +
    // // "<p><strong>Endereço de e-mail:</strong> " + tmp_user.getEmail() + "</p>"
    // +
    // // "<p><strong>Senha de acesso:</strong> " + generatedPass + "</p>" +
    // // "<p> Acesse a partir do link: http://172.31.4.99:4200 </p>"+
    // // "<p>Atenciosamente,<br>" +
    // // "<strong> Equipe smartsae </strong></p>";

    // // String subject = "Credenciais de Acesso ao Sistema smartsae";
    // // this.emailService.send(tmp_user.getEmail(), subject, message);
    // // System.out.println(message);
    // return tmp_user;
    // }

    @Transactional
    public UserEntity createUser(RegisterRequestDTO request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new BusinessException("Número de telefone é obrigatório");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new BusinessException("Password é obrigatória");
        }
        if (request.getPassword().length() < 6) {
            throw new BusinessException("Password deve ter no mínimo 6 caracteres");
        }
        String normPhone = ContactValidator.requireValidPhone(request.getUsername());
        request.setUsername(normPhone);
        String normEmail = ContactValidator.requireValidEmail(request.getEmail(), false);
        if (normEmail != null) request.setEmail(normEmail);

        if (userRepository.existsByUsername(normPhone)) {
            throw new BusinessException("Já existe uma conta com este número de telefone");
        }
        if (normEmail != null && userRepository.existsByEmail(normEmail)) {
            throw new BusinessException("Já existe uma conta com este email");
        }

        UserEntity tmp_user = new UserEntity();
        List<RoleTransactionEntity> roleT = roleTransactionRepository
                .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.ADMIN, MenuType.HEADER);

        if (roleT.isEmpty()) {
            throw new BusinessException("Erro de configuração do sistema: Role ADMIN não encontrada.");
        }
        RoleTransactionEntity tmp_roleT = roleT.get(0);
        System.out.println(tmp_roleT);
        System.out.println("am here on creation" + tmp_roleT.getRole().name());
        tmp_user.setFullname(request.getFullname());
        tmp_user.setUsername(request.getUsername());
        tmp_user.setEmail(request.getEmail());
        tmp_user.setPassword(passwordEncoder.encode(request.getPassword()));
        tmp_user.setRole(tmp_roleT);
        tmp_user.setEnabled(true);

        LocalDateTime creationDate = LocalDateTime.now();
        tmp_user.setCreatedDate(creationDate);

        UserEntity saved = userRepository.save(tmp_user);
        if (request.getEmail() != null && !request.getEmail().isBlank())
            emailService.sendCredentials(request.getEmail(), request.getFullname(), request.getUsername(), request.getPassword(), "Administrador");
        return saved;
    }

    @Transactional
    public ProfessorProfileEntity createProfessor(ProfessorRegisterDTO request) {
        String pPhone = ContactValidator.requireValidPhone(request.getNTelefone());
        request.setNTelefone(pPhone);
        String pEmail = ContactValidator.requireValidEmail(request.getEmail(), false);
        request.setEmail(pEmail);

        if (userRepository.existsByUsername(pPhone)) {
            throw new BusinessException("Já existe uma conta com este número de telefone");
        }
        if (userRepository.existsByEmail(pEmail)) {
            throw new BusinessException("Já existe uma conta com este email");
        }

        UserEntity user = new UserEntity();
        user.setFullname(request.getFullname());
        user.setUsername(pPhone);
        user.setEmail(pEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);
        user.setCreatedDate(LocalDateTime.now());

        List<RoleTransactionEntity> roles = roleTransactionRepository
                .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.PROFESSOR, MenuType.HEADER);

        if (roles.isEmpty()) {
            throw new BusinessException("Erro de configuração do sistema: Role PROFESSOR não encontrada.");
        }
        user.setRole(roles.get(0));

        userRepository.save(user);
        if (request.getEmail() != null && !request.getEmail().isBlank())
            emailService.sendCredentials(request.getEmail(), request.getFullname(), request.getNTelefone(), request.getPassword(), "Professor");

        ProfessorProfileEntity profile = new ProfessorProfileEntity();
        profile.setUser(user);
        profile.setSchoolId(request.getSchoolId());
        profile.setDepartment(request.getDepartment());
        profile.setSpecialization(request.getSpecialization());
        profile.setInstitutionalContact(request.getInstitutionalContact());
        profile.setOnline(false);
        System.out.println(profile.getUser());

        profile = professorProfileRepository.save(profile);
        profile.setProfessorCode(String.format("COD-%s-PROF-%05d",
                getSchoolInitials(request.getSchoolId()), profile.getId()));
        return professorProfileRepository.save(profile);
    }

    /**
     * Import em massa: cria o professor se não existir, actualiza o perfil se já existir.
     * Garante que não falha para utilizadores já registados como PROFESSOR.
     */
    @Transactional
    public BulkImportResultDTO.RowResult upsertProfessor(ProfessorRegisterDTO request, int rowNum) {
        String pPhone = ContactValidator.requireValidPhone(request.getNTelefone());
        request.setNTelefone(pPhone);
        String pEmail = ContactValidator.requireValidEmail(request.getEmail(), true);
        request.setEmail(pEmail);

        java.util.Optional<UserEntity> existing = userRepository.findByUsername(pPhone);
        if (existing.isPresent()) {
            UserEntity user = existing.get();
            String roleName = (user.getRole() != null && user.getRole().getRole() != null)
                    ? user.getRole().getRole().name() : "";
            if (!roleName.contains("PROFESSOR")) {
                throw new BusinessException("Utilizador já existe com outro perfil (não é professor)");
            }
            ProfessorProfileEntity profile = professorProfileRepository.findByUser_Id(user.getId())
                    .orElseThrow(() -> new BusinessException("Perfil de professor não encontrado"));
            if (request.getSchoolId() != null)
                profile.setSchoolId(request.getSchoolId());
            if (request.getDepartment() != null && !request.getDepartment().isBlank())
                profile.setDepartment(request.getDepartment());
            if (request.getSpecialization() != null && !request.getSpecialization().isBlank())
                profile.setSpecialization(request.getSpecialization());
            if (request.getInstitutionalContact() != null && !request.getInstitutionalContact().isBlank())
                profile.setInstitutionalContact(request.getInstitutionalContact());
            professorProfileRepository.save(profile);
            return new codelab.api.smart.sae.user.dto.BulkImportResultDTO.RowResult(
                    rowNum, pPhone, request.getFullname(), true, "Perfil actualizado (já existia)");
        }

        if (userRepository.existsByEmail(pEmail)) {
            throw new BusinessException("Já existe uma conta com este email");
        }

        UserEntity user = new UserEntity();
        user.setFullname(request.getFullname());
        user.setUsername(pPhone);
        user.setEmail(pEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);
        user.setMustChangePassword(true);
        user.setCreatedDate(LocalDateTime.now());

        List<RoleTransactionEntity> roles = roleTransactionRepository
                .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.PROFESSOR, MenuType.HEADER);
        if (roles.isEmpty())
            throw new BusinessException("Erro de configuração do sistema: Role PROFESSOR não encontrada.");
        user.setRole(roles.get(0));
        userRepository.save(user);

        if (request.getEmail() != null && !request.getEmail().isBlank())
            emailService.sendCredentials(request.getEmail(), request.getFullname(),
                    request.getNTelefone(), request.getPassword(), "Professor");

        ProfessorProfileEntity profile = new ProfessorProfileEntity();
        profile.setUser(user);
        profile.setSchoolId(request.getSchoolId());
        profile.setDepartment(request.getDepartment());
        profile.setSpecialization(request.getSpecialization());
        profile.setInstitutionalContact(request.getInstitutionalContact());
        profile.setOnline(false);
        profile = professorProfileRepository.save(profile);
        profile.setProfessorCode(String.format("COD-%s-PROF-%05d",
                getSchoolInitials(request.getSchoolId()), profile.getId()));
        professorProfileRepository.save(profile);
        return new codelab.api.smart.sae.user.dto.BulkImportResultDTO.RowResult(
                rowNum, pPhone, request.getFullname(), true, null);
    }

    @Transactional
    public StudentProfileEntity createStudent(StudentRegisterDTO request) {
        String sPhone = ContactValidator.requireValidPhone(request.getNTelefone());
        request.setNTelefone(sPhone);
        String sEmail = ContactValidator.requireValidEmail(request.getEmail(), false);
        request.setEmail(sEmail);

        if (userRepository.existsByUsername(sPhone)) {
            throw new BusinessException("Já existe uma conta com este número de telefone");
        }
        if (userRepository.existsByEmail(sEmail)) {
            throw new BusinessException("Já existe uma conta com este email");
        }

        UserEntity user = new UserEntity();
        user.setFullname(request.getFullname());
        user.setUsername(sPhone);
        user.setEmail(sEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);
        user.setCreatedDate(LocalDateTime.now());

        List<RoleTransactionEntity> roles = roleTransactionRepository
                .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.STUDENT, MenuType.HEADER);

        if (roles.isEmpty()) {
            throw new BusinessException("Erro de configuração do sistema: Role STUDENT não encontrada.");
        }
        user.setRole(roles.get(0));

        userRepository.save(user);
        if (request.getEmail() != null && !request.getEmail().isBlank())
            emailService.sendCredentials(request.getEmail(), request.getFullname(), request.getNTelefone(), request.getPassword(), "Estudante");

        StudentProfileEntity profile = new StudentProfileEntity();
        profile.setUser(user);
        profile.setSchoolId(request.getSchoolId());
        profile.setClassroomId(request.getClassroomId());
        profile.setGrade(request.getGrade());
        profile.setEnrollmentDate(java.time.LocalDate.now());
        profile.setAge(request.getAge());

        return studentProfileRepository.save(profile);
    }

    public List<MenuDTO> findTransactionsByRole(UserEntity user) {

        List<MenuDTO> menus = new ArrayList<MenuDTO>();

        if (user.getRole() == null || user.getRole().getRole() == null) {
            return menus;
        }

        List<RoleTransactionEntity> headers = roleTransactionRepository
                .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(user.getRole().getRole(), MenuType.HEADER);

        for (RoleTransactionEntity header : headers) {
            MenuDTO menu = new MenuDTO(header.getAppTransaction().getCode(), header.getAppTransaction().getLabel(),
                    header.getAppTransaction().getRouterLink());

            List<RoleTransactionEntity> items = roleTransactionRepository
                    .findByRoleAndAppTransactionTypeAndAppTransactionParent(user.getRole().getRole(),
                            MenuType.MENU_ITEM,
                            header.getAppTransaction());

            for (RoleTransactionEntity item : items) {
                MenuItemDTO menuItem = new MenuItemDTO(item.getAppTransaction().getCode(),
                        item.getAppTransaction().getLabel(), item.getAppTransaction().getRouterLink());
                menu.addItem(menuItem);
            }
            menus.add(menu);
        }

        return menus;
    }

    public List<UserListDTO> findAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserListDTO(
                        u.getId(),
                        u.getUsername(),
                        u.getFullname(),
                        u.getEmail(),
                        u.getUsername(),
                        (u.getRole() != null && u.getRole().getRole() != null)
                                ? u.getRole().getRole().name() : "GUEST",
                        u.isEnabled() ? 1 : 0))
                .collect(Collectors.toList());
    }

    @Transactional
    public UserListDTO updateUser(UserUpdateDTO dto) {
        UserEntity user = userRepository.findById(java.util.Objects.requireNonNull(dto.getUserId()))
                .orElseThrow(() -> new BusinessException("Utilizador não encontrado"));
        if (dto.getFullname() != null && !dto.getFullname().trim().isEmpty())
            user.setFullname(dto.getFullname());
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty())
            user.setEmail(dto.getEmail());
        userRepository.save(java.util.Objects.requireNonNull(user));
        return new UserListDTO(
                user.getId(), user.getUsername(), user.getFullname(), user.getEmail(),
                user.getUsername(),
                (user.getRole() != null && user.getRole().getRole() != null)
                        ? user.getRole().getRole().name() : "GUEST",
                user.isEnabled() ? 1 : 0);
    }

    public ProfessorProfileDTO getProfessorProfile(Long userId) {
        ProfessorProfileEntity p = professorProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Perfil de professor não encontrado"));
        return new ProfessorProfileDTO(
                p.getUser().getId(), p.getUser().getFullname(), p.getUser().getUsername(),
                p.getUser().getEmail(), p.getSchoolId(), p.getDepartment(),
                p.getSpecialization(), p.getInstitutionalContact(), p.isOnline(), p.getLastSeen());
    }

    @Transactional
    public ProfessorProfileDTO updateProfessorProfile(ProfessorProfileUpdateDTO dto) {
        ProfessorProfileEntity p = professorProfileRepository.findByUser_Id(dto.getUserId())
                .orElseThrow(() -> new BusinessException("Perfil de professor não encontrado"));
        boolean schoolChanged = dto.getSchoolId() != null && !dto.getSchoolId().equals(p.getSchoolId());
        if (dto.getSchoolId() != null)             p.setSchoolId(dto.getSchoolId());
        if (dto.getDepartment() != null)           p.setDepartment(dto.getDepartment());
        if (dto.getSpecialization() != null)       p.setSpecialization(dto.getSpecialization());
        if (dto.getInstitutionalContact() != null) p.setInstitutionalContact(dto.getInstitutionalContact());
        if (dto.getTeachingCycle() != null)        p.setTeachingCycle(dto.getTeachingCycle());
        if (schoolChanged || p.getProfessorCode() == null) {
            p.setProfessorCode(String.format("COD-%s-PROF-%05d",
                    getSchoolInitials(p.getSchoolId()), p.getId()));
        }
        professorProfileRepository.save(java.util.Objects.requireNonNull(p));
        return toProfessorDTO(p);
    }

    public StudentProfileDTO getStudentProfile(Long userId) {
        StudentProfileEntity s = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Perfil de estudante não encontrado"));
        return toStudentDTO(s);
    }

    public StudentProfileDTO getStudentProfileByUsername(String username) {
        return studentProfileRepository.findByUsername(username)
                .map(this::toStudentDTO)
                .orElse(null);
    }

    @Transactional
    public StudentProfileDTO updateStudentProfile(StudentProfileUpdateDTO dto) {
        StudentProfileEntity s = studentProfileRepository.findByUser_Id(dto.getUserId())
                .orElseThrow(() -> new BusinessException("Perfil de estudante não encontrado"));

        Long prevClassroomId = s.getClassroomId();
        boolean enrolling = dto.getClassroomId() != null && !dto.getClassroomId().equals(prevClassroomId);
        boolean removing  = dto.getClassroomId() == null && prevClassroomId != null;

        if (dto.getSchoolId() != null) s.setSchoolId(dto.getSchoolId());
        s.setClassroomId(dto.getClassroomId());
        if (dto.getGrade() != null) s.setGrade(dto.getGrade());
        if (dto.getAge()   != null) s.setAge(dto.getAge());
        studentProfileRepository.save(java.util.Objects.requireNonNull(s));

        int year = LocalDateTime.now().getYear();

        if (enrolling) {
            // cancel any existing active enrollment for this year
            studentEnrollmentRepository
                .findTopByStudentIdAndYearAndStatus(dto.getUserId(), year, EntityState.ACTIVE)
                .ifPresent(e -> { e.setStatus(EntityState.INACTIVE); studentEnrollmentRepository.save(e); });

            // create new enrollment record
            StudentEnrollmentEntity enrollment = new StudentEnrollmentEntity();
            enrollment.setStudentId(dto.getUserId());
            enrollment.setSchoolId(s.getSchoolId());
            enrollment.setClassroomId(dto.getClassroomId());
            enrollment.setYear(year);
            enrollment.setEnrolledAt(LocalDateTime.now());
            enrollment = studentEnrollmentRepository.save(enrollment);
            enrollment.setEnrollmentCode(String.format("MAT-%d-%05d", year, enrollment.getId()));
            studentEnrollmentRepository.save(enrollment);
        } else if (removing) {
            studentEnrollmentRepository
                .findTopByStudentIdAndYearAndStatus(dto.getUserId(), year, EntityState.ACTIVE)
                .ifPresent(e -> { e.setStatus(EntityState.INACTIVE); studentEnrollmentRepository.save(e); });
        }

        return toStudentDTO(s);
    }

    public List<ProfessorProfileDTO> findAllProfessors() {
        return professorProfileRepository.findAll().stream()
                .map(this::toProfessorDTO)
                .collect(Collectors.toList());
    }

    public List<ProfessorProfileDTO> findProfessors(org.springframework.security.core.Authentication auth) {
        boolean isSchoolAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(UserRoles.SCHOOL_ADMIN.name()));
        if (isSchoolAdmin) {
            SchoolAdminProfileEntity admin = schoolAdminProfileRepository.findByUserUsername(auth.getName())
                    .orElseThrow(() -> new BusinessException("Perfil de administrador de escola não encontrado"));
            return professorProfileRepository.findBySchoolId(admin.getSchoolId()).stream()
                    .map(this::toProfessorDTO)
                    .collect(Collectors.toList());
        }
        return findAllProfessors();
    }

    public List<ProfessorProfileDTO> findPendingProfessors(org.springframework.security.core.Authentication auth) {
        boolean isSchoolAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(UserRoles.SCHOOL_ADMIN.name()));
        if (isSchoolAdmin) {
            SchoolAdminProfileEntity admin = schoolAdminProfileRepository.findByUserUsername(auth.getName())
                    .orElseThrow(() -> new BusinessException("Perfil de administrador de escola não encontrado"));
            return professorProfileRepository.findBySchoolIdAndApprovalStatus(admin.getSchoolId(), "PENDING").stream()
                    .map(this::toProfessorDTO).collect(Collectors.toList());
        }
        return professorProfileRepository.findByApprovalStatus("PENDING").stream()
                .map(this::toProfessorDTO).collect(Collectors.toList());
    }

    @Transactional
    public ProfessorProfileDTO approveProfessor(Long userId) {
        ProfessorProfileEntity p = professorProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Perfil de professor não encontrado"));
        p.setApprovalStatus("APPROVED");
        p.setRejectionReason(null);
        return toProfessorDTO(professorProfileRepository.save(p));
    }

    @Transactional
    public ProfessorProfileDTO rejectProfessor(Long userId, String reason) {
        ProfessorProfileEntity p = professorProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Perfil de professor não encontrado"));
        p.setApprovalStatus("REJECTED");
        p.setRejectionReason(reason);
        return toProfessorDTO(professorProfileRepository.save(p));
    }

    private ProfessorProfileDTO toProfessorDTO(ProfessorProfileEntity p) {
        ProfessorProfileDTO dto = new ProfessorProfileDTO(
                p.getUser().getId(),
                p.getUser().getFullname(),
                p.getUser().getUsername(),
                p.getUser().getEmail(),
                p.getSchoolId(),
                p.getDepartment(),
                p.getSpecialization(),
                p.getInstitutionalContact(),
                p.isOnline(),
                p.getLastSeen());
        dto.setProfessorCode(p.getProfessorCode());
        dto.setTeachingCycle(p.getTeachingCycle());
        dto.setApprovalStatus(p.getApprovalStatus());
        dto.setRejectionReason(p.getRejectionReason());
        dto.setIdDocumentNumber(p.getIdDocumentNumber());
        return dto;
    }

    public List<StudentProfileDTO> findStudents(org.springframework.security.core.Authentication auth) {
        boolean isSchoolAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(UserRoles.SCHOOL_ADMIN.name()));
        if (isSchoolAdmin) {
            SchoolAdminProfileEntity admin = schoolAdminProfileRepository.findByUserUsername(auth.getName())
                    .orElseThrow(() -> new BusinessException("Perfil de administrador de escola não encontrado"));
            return studentProfileRepository.findBySchoolId(admin.getSchoolId()).stream()
                    .map(this::toStudentDTO).collect(Collectors.toList());
        }
        return studentProfileRepository.findAll().stream()
                .map(this::toStudentDTO).collect(Collectors.toList());
    }

    private StudentProfileDTO toStudentDTO(StudentProfileEntity s) {
        int year = LocalDateTime.now().getYear();
        String code = studentEnrollmentRepository
            .findTopByStudentIdAndYearAndStatus(s.getUser().getId(), year, EntityState.ACTIVE)
            .map(StudentEnrollmentEntity::getEnrollmentCode)
            .orElse(null);
        StudentProfileDTO dto = new StudentProfileDTO(
                s.getUser().getId(), s.getUser().getFullname(), s.getUser().getUsername(),
                s.getUser().getEmail(), s.getSchoolId(), s.getClassroomId(),
                s.getGrade(), s.getAge());
        dto.setEnrollmentCode(code);
        return dto;
    }

    public UserEntity getLoggedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        if (authentication.getPrincipal() instanceof UserDetails) {
            return ((UserEntity) authentication.getPrincipal());
        } else {
            return (UserEntity) authentication.getPrincipal();
        }
    }

    public List<StudentProfileDTO> findStudentsByClassroom(Long classroomId) {
        return studentProfileRepository.findByClassroomId(classroomId).stream()
                .map(this::toStudentDTO)
                .collect(Collectors.toList());
    }

    public List<StudentProfileDTO> findStudentsBySchool(Long schoolId) {
        return studentProfileRepository.findBySchoolId(schoolId).stream()
                .map(this::toStudentDTO)
                .collect(Collectors.toList());
    }

    public StudentProfileDTO findStudentProfileByUsername(String username) {
        StudentProfileEntity s = studentProfileRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Perfil de estudante não encontrado para: " + username));
        return toStudentDTO(s);
    }

    public java.util.Optional<java.util.Map<String, Object>> findBasicByUsername(String username) {
        return userRepository.findByUsername(username).map(u -> {
            java.util.Map<String, Object> out = new java.util.HashMap<>();
            out.put("id", u.getId());
            out.put("username", u.getUsername());
            out.put("fullName", u.getFullname());
            out.put("role", u.getRole() != null && u.getRole().getRole() != null
                    ? u.getRole().getRole().name() : null);
            return out;
        });
    }

    /** Devolve o email do utilizador, se existir. */
    public java.util.Optional<String> findEmailByUsername(String username) {
        return userRepository.findByUsername(username).map(UserEntity::getEmail);
    }

    /** Actualiza nome e/ou email do utilizador autenticado. */
    @Transactional
    public void updateMyProfile(String username, String fullName, String email) {
        UserEntity u = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilizador não encontrado"));
        if (fullName != null && !fullName.isBlank()) {
            u.setFullname(fullName.trim());
        }
        if (email != null) {
            String newEmail = email.trim();
            if (newEmail.isEmpty()) {
                u.setEmail(null);
            } else {
                String normalized = ContactValidator.requireValidEmail(newEmail, false);
                if (normalized != null && !normalized.equalsIgnoreCase(u.getEmail())) {
                    if (userRepository.existsByEmail(normalized)) {
                        throw new BusinessException("Já existe uma conta com este email");
                    }
                    u.setEmail(normalized);
                }
            }
        }
        userRepository.save(u);
    }

    /** Muda a password do próprio utilizador (verifica a actual). */
    @Transactional
    public void changeMyPassword(String username, String currentPassword, String newPassword) {
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BusinessException("Password actual obrigatória");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new BusinessException("Nova password deve ter no mínimo 6 caracteres");
        }
        UserEntity u = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilizador não encontrado"));
        if (!passwordEncoder.matches(currentPassword, u.getPassword())) {
            throw new BusinessException("Password actual incorrecta");
        }
        u.setPassword(passwordEncoder.encode(newPassword));
        u.setMustChangePassword(false);
        userRepository.save(u);
    }

    public java.util.Optional<Long> findUserIdByUsername(String username) {
        return userRepository.findByUsername(username).map(u -> u.getId());
    }

    public String[] getProfessorSpecializations(String username) {
        return professorProfileRepository.findByUserUsername(username)
            .map(profile -> {
                String spec = profile.getSpecialization();
                if (spec == null || spec.isBlank()) return new String[]{};
                return java.util.Arrays.stream(spec.split("[,;/\\n]"))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .toArray(String[]::new);
            })
            .orElse(new String[]{});
    }

    public java.util.List<codelab.api.smart.sae.user.dto.ProfessorInfoDTO> getProfessorsByDiscipline(String disciplinaName) {
        String normalizedDisc = normalize(disciplinaName);
        return professorProfileRepository.findAll().stream()
            .filter(p -> p.getSpecialization() != null
                && !normalize(p.getSpecialization()).isEmpty()
                && (normalize(p.getSpecialization()).contains(normalizedDisc)
                    || normalizedDisc.contains(normalize(p.getSpecialization()))))
            .map(p -> new codelab.api.smart.sae.user.dto.ProfessorInfoDTO(
                p.getUser().getUsername(),
                p.getUser().getFullname(),
                p.isOnline(),
                p.getSpecialization(),
                p.getLastSeen()
            ))
            .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void setProfessorOnline(String username, boolean online) {
        professorProfileRepository.findByUserUsername(username).ifPresent(p -> {
            p.setOnline(online);
            p.setLastSeen(LocalDateTime.now());
            professorProfileRepository.save(p);
        });
    }

    @Transactional
    public SchoolAdminProfileEntity createSchoolAdmin(SchoolAdminRegisterDTO request) {
        String saPhone = ContactValidator.requireValidPhone(request.getNTelefone());
        request.setNTelefone(saPhone);
        String saEmail = ContactValidator.requireValidEmail(request.getEmail(), true);
        request.setEmail(saEmail);

        if (userRepository.existsByUsername(saPhone))
            throw new BusinessException("Já existe uma conta com este número de telefone");
        if (userRepository.existsByEmail(saEmail))
            throw new BusinessException("Já existe uma conta com este email");

        UserEntity user = new UserEntity();
        user.setFullname(request.getFullname());
        user.setUsername(saPhone);
        user.setEmail(saEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);
        user.setCreatedDate(LocalDateTime.now());

        List<RoleTransactionEntity> roles = roleTransactionRepository
                .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.SCHOOL_ADMIN, MenuType.HEADER);
        if (roles.isEmpty())
            throw new BusinessException("Erro de configuração do sistema: Role SCHOOL_ADMIN não encontrada.");
        user.setRole(roles.get(0));

        userRepository.save(user);
        if (request.getEmail() != null && !request.getEmail().isBlank())
            emailService.sendCredentials(request.getEmail(), request.getFullname(),
                    request.getNTelefone(), request.getPassword(), "Administrador de Escola");

        SchoolAdminProfileEntity profile = new SchoolAdminProfileEntity();
        profile.setUser(user);
        profile.setSchoolId(request.getSchoolId());
        return schoolAdminProfileRepository.save(profile);
    }

    public java.util.Map<String, Object> getSchoolAdminProfile(String username) {
        SchoolAdminProfileEntity p = schoolAdminProfileRepository.findByUserUsername(username)
                .orElseThrow(() -> new BusinessException("Perfil de administrador de escola não encontrado"));
        java.util.Map<String, Object> out = new java.util.HashMap<>();
        out.put("userId", p.getUser().getId());
        out.put("schoolId", p.getSchoolId());
        out.put("fullName", p.getUser().getFullname());
        out.put("username", p.getUser().getUsername());
        return out;
    }

    public List<UserListDTO> getUsersBySchool(String username) {
        SchoolAdminProfileEntity admin = schoolAdminProfileRepository.findByUserUsername(username)
                .orElseThrow(() -> new BusinessException("Perfil de administrador de escola não encontrado"));
        Long schoolId = admin.getSchoolId();

        List<UserListDTO> result = new ArrayList<>();

        professorProfileRepository.findBySchoolId(schoolId).forEach(p ->
            result.add(new UserListDTO(
                p.getUser().getId(), p.getUser().getUsername(), p.getUser().getFullname(),
                p.getUser().getEmail(), p.getUser().getUsername(),
                UserRoles.PROFESSOR.name(), p.getUser().isEnabled() ? 1 : 0)));

        studentProfileRepository.findBySchoolId(schoolId).forEach(s ->
            result.add(new UserListDTO(
                s.getUser().getId(), s.getUser().getUsername(), s.getUser().getFullname(),
                s.getUser().getEmail(), s.getUser().getUsername(),
                UserRoles.STUDENT.name(), s.getUser().isEnabled() ? 1 : 0)));

        return result;
    }

    private String getSchoolInitials(Long schoolId) {
        if (schoolId == null) return "GEN";
        try {
            Object name = entityManager
                    .createNativeQuery("SELECT name FROM ac_SCHOOL WHERE id = :id")
                    .setParameter("id", schoolId)
                    .getSingleResult();
            return extractInitials(String.valueOf(name));
        } catch (Exception e) {
            return "GEN";
        }
    }

    private String extractInitials(String schoolName) {
        if (schoolName == null || schoolName.isBlank()) return "GEN";
        StringBuilder sb = new StringBuilder();
        for (String word : schoolName.trim().split("\\s+")) {
            if (!word.isBlank() && Character.isLetter(word.charAt(0)))
                sb.append(Character.toUpperCase(word.charAt(0)));
        }
        return sb.length() > 0 ? sb.toString() : "GEN";
    }

    // ── LGPD: exportação de dados pessoais ──────────────────────────────────

    public java.util.Map<String, Object> exportMyData(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilizador não encontrado"));

        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("username", user.getUsername());
        data.put("fullName", user.getFullname());
        data.put("email", user.getEmail());
        data.put("createdDate", user.getCreatedDate());
        data.put("enabled", user.isEnabled());
        data.put("role", user.getRole() != null ? user.getRole().getRole() : null);

        professorProfileRepository.findByUserUsername(username).ifPresent(p -> {
            java.util.Map<String, Object> prof = new java.util.LinkedHashMap<>();
            prof.put("department", p.getDepartment());
            prof.put("specialization", p.getSpecialization());
            prof.put("schoolId", p.getSchoolId());
            prof.put("approvalStatus", p.getApprovalStatus());
            prof.put("teachingCycle", p.getTeachingCycle());
            data.put("professorProfile", prof);
        });

        studentProfileRepository.findByUsername(username).ifPresent(s -> {
            java.util.Map<String, Object> std = new java.util.LinkedHashMap<>();
            std.put("schoolId", s.getSchoolId());
            std.put("classroomId", s.getClassroomId());
            std.put("grade", s.getGrade());
            data.put("studentProfile", std);
        });

        return data;
    }

    // ── LGPD: anonimização de conta ─────────────────────────────────────────

    @Transactional
    public void anonymizeAccount(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilizador não encontrado"));

        String anon = "[ANONIMIZADO-" + user.getId() + "]";
        user.setFullname(anon);
        user.setEmail(null);
        user.setEnabled(false);
        userRepository.save(user);

        professorProfileRepository.findByUserUsername(username).ifPresent(p -> {
            p.setDepartment(null);
            p.setSpecialization(null);
            p.setInstitutionalContact(null);
            p.setIdDocumentNumber(null);
            professorProfileRepository.save(p);
        });
    }

    private String normalize(String input) {
        if (input == null) return "";
        String str = input.trim().toLowerCase();
        str = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        str = str.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return str.replaceAll("[^a-z0-9]", "");
    }

    /**
     * 
     */
    // public String genOTP(String fullName, String email) {

    // Boolean existingUser = this.userRepository.existsByEmail(email);
    // if(existingUser)
    // return ("Já existe um usuário com este email: " + email + ", tente com um
    // email diferente!");

    // else {
    // String otp = otpManager.generateAndStoreOTP(6);
    // String subject = "Código de Verificação da Conta";
    // // String emailBody = "<p>Prezado(a) <strong>" + fullName + "</strong>,</p>"
    // +
    // // "<p>Copie e volte ao sistema para inserir no campo <strong>CÓDIGO
    // OTP</strong>: <strong>" + otp + "</strong></p>" +
    // // "<p>O código é válido por 2 minutos.</p>" +
    // // "<p> Acesse a partir do link: http://172.31.4.99/criar-conta </p>"+
    // // "<p>Atenciosamente,<br>" +
    // // "<strong> Equipe smartsae </strong></p>";
    // // String response = this.emailService.send(email, subject, emailBody);
    // // System.out.println("resposta: "+ response);

    // return response;
    // }

    // // TODO Auto-generated method stub

    // }
}
