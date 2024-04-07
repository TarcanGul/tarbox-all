package tarcan.projects.tarbox.filters;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.resilience4j.core.lang.NonNull;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class EventRequestFilter extends OncePerRequestFilter {

    Logger logger = LoggerFactory.getLogger(this.getClass());

    private static final String SECRET_KEY = "something";

    private List<String> allowedOrigins;

    private static String ORIGIN_HEADER = "Origin";
    private static String AUTH_HEADER = "Authorization";

    public EventRequestFilter(List<String> allowedOrigins) {
        super();
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response, 
        @NonNull FilterChain filterChain
        ) throws ServletException, IOException {

        logger.debug("EventRequestFilter is triggered for request " + request.getMethod() + " " + request.getRequestURI());

        String requestOrigin = request.getHeader(ORIGIN_HEADER);

        if(requestOrigin == null) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            return;
        }

        if(!allowedOrigins.contains(requestOrigin)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            return;
        }

        filterChain.doFilter(request, response);
    }
}
