package codelab.api.smart.sae.otp;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class OTPManager {
    private static final Map<String, Long> otpHashes = new ConcurrentHashMap<>();
    private static final long expirationTime = 120 * 1000L; // 60 segundos de vida do OTP
    private static final SecureRandom random = new SecureRandom();

    // Gera e armazena um OTP
    public String generateAndStoreOTP(int length) {
        String otp = generateOTP(length);
        System.out.println("Generated OTP: " + otp); // Depuração
        storeOTP(otp);
        return otp;
    }

    // Gera um OTP
    private String generateOTP(int length) {
        String baseCharacters = "0123456789";
        StringBuilder otp = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(baseCharacters.length());
            otp.append(baseCharacters.charAt(index));
        }
        return otp.toString();
    }

    // Armazena o OTP
    private void storeOTP(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(otp.getBytes());
            String hash = bytesToHex(hashBytes);

            long expirationTimeInMillis = System.currentTimeMillis() + expirationTime;
            otpHashes.put(hash, expirationTimeInMillis);
            System.out.println("Stored OTP hash: " + hash + " with expiration time: " + expirationTimeInMillis);  
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Valida o OTP
    public boolean validateOTP(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(otp.getBytes());
            String hash = bytesToHex(hashBytes);

            System.out.println("Validating OTP hash: " + hash);  
            Long expirationTime = otpHashes.get(hash);
            if (expirationTime == null || System.currentTimeMillis() > expirationTime) {
                System.out.println("OTP inválido ou expirado");
                return false; // OTP inválido ou expirado
            }
            otpHashes.remove(hash); // Remove o OTP após a validação
            System.out.println("OTP removido");
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // Converte bytes em uma string hexadecimal
    public static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (int i = 0; i < bytes.length; i++) {
            String hex = Integer.toHexString(0xff & bytes[i]);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
