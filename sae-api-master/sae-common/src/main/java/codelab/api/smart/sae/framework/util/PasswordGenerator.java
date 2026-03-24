package codelab.api.smart.sae.framework.util;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service
public class PasswordGenerator {
	private final static int length = 9;
	private final static String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
	private final static String CHAR_UPPER = CHAR_LOWER.toUpperCase();
	private final static String NUMBER = "0123456789";
	private final static String PASSWORD_ALLOW_BASE = CHAR_LOWER + CHAR_UPPER + NUMBER;
	private final static String PASSWORD_ALLOW_BASE_SHUFFLE = shuffleString(PASSWORD_ALLOW_BASE);
	private final static String PASSWORD_ALLOW = PASSWORD_ALLOW_BASE_SHUFFLE;
	
	public static String generate() {
		
		SecureRandom random = new SecureRandom();
		
        if (length < 1) throw new IllegalArgumentException();

        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {

            int rndCharAt = random.nextInt(PASSWORD_ALLOW.length());
            char rndChar = PASSWORD_ALLOW.charAt(rndCharAt);

            sb.append(rndChar);

        }

        return sb.toString();
	}
	
	private static String shuffleString(String string) {
        List<String> letters = Arrays.asList(string.split(""));
        Collections.shuffle(letters);
        return letters.stream().collect(Collectors.joining());
    }

	public static void main(String[] s) {
        System.out.println(generate());
    }
}
