package tarcan.projects.tarbox.configurations;

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
import tarcan.projects.tarbox.filters.GamesApiRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    Logger logger = LoggerFactory.getLogger(SecurityConfiguration.class);

    @Value("${tarbox.events.allowedorigins}")
    private String[] eventAllowedOrigins;

    private OncePerRequestFilter eventRequestFilter;
    private OncePerRequestFilter gameRequestFilter;

    
    @PostConstruct
    public void initialize() throws UnknownHostException {
        eventRequestFilter = new EventRequestFilter(Arrays.asList(eventAllowedOrigins));
        gameRequestFilter  = new GamesApiRequestFilter();
    }

    @Bean
    public SecurityFilterChain eventFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .securityMatcher("/api/app/event/**")
            .addFilterBefore(eventRequestFilter,UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public SecurityFilterChain gamesFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .securityMatcher("/api/games/**")
            .addFilterBefore(gameRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
