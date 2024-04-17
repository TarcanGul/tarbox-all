package tarcan.projects.tarbox.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;

@Configuration
@EnableWebSecurity
public class AuthorizationServerConfiguration {
    @Bean
    public OAuth2AuthorizationServerConfigurer oauth2AuthorizationServerConfigurer() {
        OAuth2AuthorizationServerConfigurer configurer = new OAuth2AuthorizationServerConfigurer();
        // Configure clients, tokens, etc. here
        return configurer;
    } 
}
