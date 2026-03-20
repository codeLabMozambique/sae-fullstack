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
import codelab.api.smart.sae.user.dto.RegisterRequestDTO;
import codelab.api.smart.sae.user.enums.MenuType;
import codelab.api.smart.sae.user.enums.UserRoles;
import codelab.api.smart.sae.user.model.UserEntity;
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


 
    
    // @Autowired
    // private EmailService emailService;
    
    // @Autowired
    // private OTPManager otpManager;
    
    // @Transactional
    // public UserEntity createUser(RegisterRequestDTO request) {
        
    //     if (userRepository.existsByUsername(request.getUsername()) )
    //         throw new BusinessException("Já existe uma conta com o email fornecido");
        
    //     UserEntity tmp_user = new UserEntity();
 
    //     List<RoleTransactionEntity> roleT = roleTransactionRepository.findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.ADMIN, MenuType.HEADER); 
        
    //     RoleTransactionEntity tmp_roleT = roleT.get(0);
    //     System.out.println("role: "+ tmp_roleT.getRole()+ "status: "+ tmp_roleT.getId() );
        
    //     String generatedPass = this.generateCommonLangPassword();
    //     System.out.println(generatedPass);
        
    //     tmp_user.setFullname(request.getFullname());
    //     tmp_user.setUsername(request.getUsername());
    //     tmp_user.setPassword(passwordEncoder.encode(generatedPass)); 
    //     tmp_user.setRole(tmp_roleT); 
    //     tmp_user.setEnabled(true); 
        
    //     LocalDateTime creationDate = LocalDateTime.now();
    //     tmp_user.setCreatedDate(creationDate);
    //     System.out.println("username: "+tmp_user.getUsername()+" fullname: "+tmp_user.getFullname());
        
    //     userRepository.save(tmp_user); 
    //     // String message = "<p>Prezado(a) <strong>" + tmp_user.getFullname() + "</strong>,</p>" +
    //     //         "<p>Esperamos que este e-mail o(a) encontre bem.</p>" +
    //     //         "<p>Estamos entrando em contato para fornecer suas credenciais de acesso ao sistema smartSAE. Por favor, encontre abaixo suas informações de login:</p>" +
    //     //         "<p><strong>Endereço de e-mail:</strong> " + tmp_user.getEmail() + "</p>" +
    //     //         "<p><strong>Senha de acesso:</strong> " + generatedPass + "</p>" +
    //     //         "<p> Acesse a partir do link: http://172.31.4.99:4200 </p>"+
    //     //         "<p>Atenciosamente,<br>" +
    //     //         "<strong> Equipe smartSAE </strong></p>";
 

    //     // String subject = "Credenciais de Acesso ao Sistema smartSAE";
    //     // this.emailService.send(tmp_user.getEmail(), subject, message);
    //     // System.out.println(message);
    //     return tmp_user;
    // }
    

    @Transactional
public UserEntity createUser(RegisterRequestDTO request) {

    	 if (request.getNtelefone() == null || request.getNtelefone().trim().isEmpty()) {
    	        throw new BusinessException("Número de telefone é obrigatório");
    	    }

    	    if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
    	        throw new BusinessException("Password é obrigatória");
    	    }

    	    if (request.getPassword().length() < 6) {
    	        throw new BusinessException("Password deve ter no mínimo 6 caracteres");
    	    }

    	    // username = nCarta
    	    if (userRepository.existsByUsername(request.getNtelefone())) {
    	        throw new BusinessException("Já existe uma conta com este número de telefone");
    	    }

    UserEntity tmp_user = new UserEntity();

    // 🔹 Buscar o Role default (ADMIN)
    List<RoleTransactionEntity> roleT = roleTransactionRepository
            .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(UserRoles.CONSULTA, MenuType.HEADER);

    RoleTransactionEntity tmp_roleT = roleT.get(0);

     

    // 🔹 Gerar password random
    String generatedPass = this.generateCommonLangPassword();
    System.out.println( generatedPass);
    

    tmp_user.setFullname(request.getFullname());
    tmp_user.setUsername(request.getNtelefone());
    tmp_user.setPassword(passwordEncoder.encode(request.getPassword()));
    tmp_user.setRole(tmp_roleT);
    tmp_user.setEnabled(true); 

    LocalDateTime creationDate = LocalDateTime.now();
    tmp_user.setCreatedDate(creationDate);

    userRepository.save(tmp_user);

    // Se quiser enviar o email com credenciais, pode reativar aqui

    return tmp_user;
}
     
    private String generateCommonLangPassword() {
        String upperCaseLetters = RandomStringUtils.random(2, 65, 90, true, true);
        String lowerCaseLetters = RandomStringUtils.random(2, 97, 122, true, true);
        String numbers = RandomStringUtils.randomNumeric(2);
        String specialChar = RandomStringUtils.random(2, 33, 47, false, false);
        String totalChars = RandomStringUtils.randomAlphanumeric(2);
        String combinedChars = upperCaseLetters.concat(lowerCaseLetters).concat(numbers).concat(specialChar)
                .concat(totalChars);
        List<Character> pwdChars = combinedChars.chars().mapToObj(c -> (char) c).collect(Collectors.toList());
        Collections.shuffle(pwdChars);
        String password = pwdChars.stream().collect(StringBuilder::new, StringBuilder::append, StringBuilder::append)
                .toString();
        return password;
    }
    
    public List<MenuDTO> findTransactionsByRole(UserEntity user) {
        
              List<MenuDTO> menus = new ArrayList<MenuDTO>();
        
              List<RoleTransactionEntity> headers = roleTransactionRepository
                      .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(user.getRole().getRole(), MenuType.HEADER);
        
              for (RoleTransactionEntity header : headers) {
                  MenuDTO menu = new MenuDTO(header.getAppTransaction().getCode(), header.getAppTransaction().getLabel(),
                          header.getAppTransaction().getRouterLink());
        
                  List<RoleTransactionEntity> items = roleTransactionRepository
                          .findByRoleAndAppTransactionTypeAndAppTransactionParent(user.getRole().getRole(), MenuType.MENU_ITEM,
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

    public UserEntity getLoggedUser() {
        Authentication  authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication ==null || ! authentication.isAuthenticated()) {
            return null;
        }
        if (authentication.getPrincipal() instanceof UserDetails) {
            return ((UserEntity) authentication.getPrincipal());
        }else {
            return(UserEntity) authentication.getPrincipal();
        }
    }


    /**
     * 
     */
    // public String  genOTP(String fullName, String email) {
        
    //     Boolean existingUser = this.userRepository.existsByEmail(email);
    //      if(existingUser)
    //         return ("Já existe um usuário com este email: " + email + ", tente com um email diferente!");
      
    //      else {
    //     String otp = otpManager.generateAndStoreOTP(6);
    //     String subject = "Código de Verificação da Conta";
    //     // String emailBody = "<p>Prezado(a) <strong>" + fullName + "</strong>,</p>" +
    //     //         "<p>Copie e volte ao sistema para inserir no campo <strong>CÓDIGO OTP</strong>: <strong>" + otp + "</strong></p>" +
    //     //         "<p>O código é válido por 2 minutos.</p>" +
    //     //         "<p> Acesse a partir do link: http://172.31.4.99/criar-conta </p>"+
    //     //         "<p>Atenciosamente,<br>" +
    //     //         "<strong> Equipe smartSAE </strong></p>";
    //     // String response = this.emailService.send(email, subject, emailBody);
    //     // System.out.println("resposta: "+ response);
        
    //     return  response;
    //      }
        
        
    //     // TODO Auto-generated method stub
        
    // }
}
