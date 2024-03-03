package tarcan.projects.tarbox;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties
@ConfigurationProperties
public class TarboxConfiguration {
    public static final int NUMBER_OF_JOINING_PLAYERS = 3;
    public static final String ILLEGAL_CHARS_FOR_USERNAME = "[^A-Za-z0-9]";

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
