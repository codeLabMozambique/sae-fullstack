/**
 * 
 */
package codelab.api.smart.sae.user.resource;

 import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import codelab.api.smart.sae.framework.security.SecurityService;
import codelab.api.smart.sae.otp.OTPManager;
import codelab.api.smart.sae.user.dto.AuthenticationRequestDTO;
import codelab.api.smart.sae.user.dto.AuthenticationResponseDTO;
import codelab.api.smart.sae.user.dto.ProfessorRegisterDTO;
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
public class UserResouce {
    @Autowired
    private UserService userService;
    @Autowired
    private SecurityService securityService;
 
    @Autowired
    private OTPManager otpManager;
 
    
    // @Autowired
    // private EmailService emailService;
 
 
    // @GetMapping("/otpGen")
    // public ResponseEntity<?> createOTP(
    //         @RequestParam String fullname, 
    //         @RequestParam String email){
    //     String responseMessage = userService.genOTP(fullname, email);
        
    //     // Check if the response message indicates that the email already exists.
    //     if (responseMessage.startsWith("Já existe um usuário")) {
    //         return new ResponseEntity<>(Map.of("error", responseMessage), HttpStatus.BAD_REQUEST);
    //     }
        
    //     // Return the response with the OTP message.
    //     return new ResponseEntity<>(Map.of("message", responseMessage), HttpStatus.ACCEPTED);
        
    // }
    
    @GetMapping("/otpValidation/{otp}")
    public ResponseEntity<?> validation(@PathVariable String otp){
        System.out.println("OPT gerado 1: "+ otp);
        
         Boolean otpValid = otpManager.validateOTP(otp);
        System.out.println("OPT gerado: "+ otpValid);
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
    @PostMapping("/login")
    public ResponseEntity<?> signin(@RequestBody AuthenticationRequestDTO authenticationRequest) throws Exception {
        
        System.out.println("aaa");

        String jwt = this.securityService.authenticate(authenticationRequest);
        
        
        
        UserEntity principal = securityService.getPrincipal();


         
        
        AuthenticationResponseDTO response = new AuthenticationResponseDTO(principal.getFullname(), principal.getUsername(),
                jwt,  userService.findTransactionsByRole(principal), UserRoleValidator.validate( principal.getRole().getRole().name())); 
        return ResponseEntity.ok(response);
    }
    
}
