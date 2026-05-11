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
import codelab.api.smart.sae.user.dto.ProfessorRegisterDTO;
import codelab.api.smart.sae.user.dto.RegisterRequestDTO;
import codelab.api.smart.sae.user.dto.StudentRegisterDTO;
import codelab.api.smart.sae.user.enums.MenuType;
import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.user.model.ProfessorProfileEntity;
import codelab.api.smart.sae.user.model.StudentProfileEntity;
import codelab.api.smart.sae.user.model.UserEntity;
import codelab.api.smart.sae.user.repository.ProfessorProfileRepository;
import codelab.api.smart.sae.user.repository.StudentProfileRepository;
import codelab.api.smart.sae.user.repository.UserRepository;

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
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Já existe uma conta com este número de telefone");
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()
                && userRepository.existsByEmail(request.getEmail())) {
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
        if (userRepository.existsByUsername(request.getNTelefone())) {
            throw new BusinessException("Já existe uma conta com este número de telefone");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Já existe uma conta com este email");
        }

        UserEntity user = new UserEntity();
        user.setFullname(request.getFullname());
        user.setUsername(request.getNTelefone());
        user.setEmail(request.getEmail());
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

        return professorProfileRepository.save(profile);
    }

    @Transactional
    public StudentProfileEntity createStudent(StudentRegisterDTO request) {
        if (userRepository.existsByUsername(request.getNTelefone())) {
            throw new BusinessException("Já existe uma conta com este número de telefone");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Já existe uma conta com este email");
        }

        UserEntity user = new UserEntity();
        user.setFullname(request.getFullname());
        user.setUsername(request.getNTelefone());
        user.setEmail(request.getEmail());
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
        if (dto.getSchoolId() != null)             p.setSchoolId(dto.getSchoolId());
        if (dto.getDepartment() != null)           p.setDepartment(dto.getDepartment());
        if (dto.getSpecialization() != null)       p.setSpecialization(dto.getSpecialization());
        if (dto.getInstitutionalContact() != null) p.setInstitutionalContact(dto.getInstitutionalContact());
        professorProfileRepository.save(java.util.Objects.requireNonNull(p));
        return new ProfessorProfileDTO(
                p.getUser().getId(), p.getUser().getFullname(), p.getUser().getUsername(),
                p.getUser().getEmail(), p.getSchoolId(), p.getDepartment(),
                p.getSpecialization(), p.getInstitutionalContact(), p.isOnline(), p.getLastSeen());
    }

    public StudentProfileDTO getStudentProfile(Long userId) {
        StudentProfileEntity s = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Perfil de estudante não encontrado"));
        return new StudentProfileDTO(
                s.getUser().getId(), s.getUser().getFullname(), s.getUser().getUsername(),
                s.getUser().getEmail(), s.getSchoolId(), s.getClassroomId(),
                s.getGrade(), s.getAge());
    }

    public StudentProfileDTO getStudentProfileByUsername(String username) {
        return studentProfileRepository.findByUsername(username)
                .map(s -> new StudentProfileDTO(
                        s.getUser().getId(), s.getUser().getFullname(), s.getUser().getUsername(),
                        s.getUser().getEmail(), s.getSchoolId(), s.getClassroomId(),
                        s.getGrade(), s.getAge()))
                .orElse(null);
    }

    @Transactional
    public StudentProfileDTO updateStudentProfile(StudentProfileUpdateDTO dto) {
        StudentProfileEntity s = studentProfileRepository.findByUser_Id(dto.getUserId())
                .orElseThrow(() -> new BusinessException("Perfil de estudante não encontrado"));
        if (dto.getSchoolId() != null)    s.setSchoolId(dto.getSchoolId());
        if (dto.getClassroomId() != null) s.setClassroomId(dto.getClassroomId());
        if (dto.getGrade() != null)       s.setGrade(dto.getGrade());
        if (dto.getAge() != null)         s.setAge(dto.getAge());
        studentProfileRepository.save(java.util.Objects.requireNonNull(s));
        return new StudentProfileDTO(
                s.getUser().getId(), s.getUser().getFullname(), s.getUser().getUsername(),
                s.getUser().getEmail(), s.getSchoolId(), s.getClassroomId(),
                s.getGrade(), s.getAge());
    }

    public List<ProfessorProfileDTO> findAllProfessors() {
        return professorProfileRepository.findAll().stream()
                .map(p -> new ProfessorProfileDTO(
                        p.getUser().getId(),
                        p.getUser().getFullname(),
                        p.getUser().getUsername(),
                        p.getUser().getEmail(),
                        p.getSchoolId(),
                        p.getDepartment(),
                        p.getSpecialization(),
                        p.getInstitutionalContact(),
                        p.isOnline(),
                        p.getLastSeen()))
                .collect(Collectors.toList());
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
                .map(s -> new StudentProfileDTO(
                        s.getUser().getId(), s.getUser().getFullname(), s.getUser().getUsername(),
                        s.getUser().getEmail(), s.getSchoolId(), s.getClassroomId(),
                        s.getGrade(), s.getAge()))
                .collect(Collectors.toList());
    }

    public StudentProfileDTO findStudentProfileByUsername(String username) {
        StudentProfileEntity s = studentProfileRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Perfil de estudante não encontrado para: " + username));
        return new StudentProfileDTO(
                s.getUser().getId(), s.getUser().getFullname(), s.getUser().getUsername(),
                s.getUser().getEmail(), s.getSchoolId(), s.getClassroomId(),
                s.getGrade(), s.getAge());
    }

    public java.util.Optional<java.util.Map<String, Object>> findBasicByUsername(String username) {
        return userRepository.findByUsername(username).map(u -> {
            java.util.Map<String, Object> out = new java.util.HashMap<>();
            out.put("username", u.getUsername());
            out.put("fullName", u.getFullname());
            out.put("role", u.getRole() != null && u.getRole().getRole() != null
                    ? u.getRole().getRole().name() : null);
            return out;
        });
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
