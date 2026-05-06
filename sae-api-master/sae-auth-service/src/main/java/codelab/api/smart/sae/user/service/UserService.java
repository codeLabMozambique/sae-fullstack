/**
 * 
 */
package codelab.api.smart.sae.user.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.RandomStringUtils;
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
import codelab.api.smart.sae.user.dto.ProfessorRegisterDTO;
import codelab.api.smart.sae.user.dto.RegisterRequestDTO;
import codelab.api.smart.sae.user.dto.StudentRegisterDTO;
import codelab.api.smart.sae.user.enums.MenuType;
import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.user.model.ProfessorProfileEntity;
import codelab.api.smart.sae.user.model.StudentProfileEntity;
import codelab.api.smart.sae.user.model.UserEntity;
// import codelab.api.smart.sae.user.model.UserEntity;
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

    // @Autowired
    // private EmailService emailService;

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

        return userRepository.save(tmp_user);
    }

    @Transactional
    public ProfessorProfileEntity createProfessor(ProfessorRegisterDTO request) {
        if (userRepository.existsByUsername(request.getNTelefone())) {
            throw new BusinessException("Já existe uma conta com este número de telefone");
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
                        p.isOnline()))
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
