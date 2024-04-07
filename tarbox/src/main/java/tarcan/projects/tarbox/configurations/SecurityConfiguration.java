package tarcan.projects.tarbox.configurations;

import java.net.Inet4Address;
import java.net.UnknownHostException;
import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.annotation.PostConstruct;
import tarcan.projects.tarbox.filters.EventRequestFilter;

@Configuration
public class SecurityConfiguration {

    Logger logger = LoggerFactory.getLogger(SecurityConfiguration.class);

    @Value("${tarbox.events.allowedorigins}")
    private String[] eventAllowedOrigins;

    private OncePerRequestFilter eventRequestFilter;

    @PostConstruct
    public void initialize() throws UnknownHostException {
        eventRequestFilter = new EventRequestFilter(Arrays.asList(eventAllowedOrigins));
    }

    @Bean
    public SecurityFilterChain eventFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .securityMatcher("/api/app/event/**")
            .addFilterBefore(eventRequestFilter,UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
