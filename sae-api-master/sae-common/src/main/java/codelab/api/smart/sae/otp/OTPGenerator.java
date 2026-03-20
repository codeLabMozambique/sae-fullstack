/**
 * 
 */
package codelab.api.smart.sae.otp;

import java.security.SecureRandom;

import org.springframework.stereotype.Service;

/**
 * @author Shifu-Taishi Grand Master
 * @email shifu-taishi@grand.master.com
 */
@Service
public class OTPGenerator {
    private static final String BASE_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final SecureRandom security_random = new SecureRandom();
    
    
    public static String generateOTP(int length) {
        
        //vamos arranjar um cumprimento fixo para o tamanho do nosso optgen
        StringBuilder otp = new StringBuilder(length);
        for (int i = 0; i< length; i++) {
            int _index = security_random.nextInt(BASE_CHARACTERS.length());
            otp.append(BASE_CHARACTERS.charAt(_index));
        }
        return otp.toString();
        
    }

}
