package tarcan.projects.tarbox.components;

import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SecretCodeGenerator {

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int CODE_LENGTH = 12;

    @Autowired
    SecureRandom secureRandom;
    
    public String generateCode() {
        StringBuilder sb = new StringBuilder();

        for(int i=0; i < CODE_LENGTH; ++i) {
            sb.append(CHARS.charAt(secureRandom.nextInt(Integer.MAX_VALUE) % CHARS.length()));
        }

        return sb.toString();
    }
}
