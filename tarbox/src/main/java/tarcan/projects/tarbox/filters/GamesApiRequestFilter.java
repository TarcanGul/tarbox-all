package tarcan.projects.tarbox.filters;

import java.io.IOException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class GamesApiRequestFilter extends OncePerRequestFilter {

    Logger logger = LoggerFactory.getLogger(GamesApiRequestFilter.class);

    private List<String> allowedOrigins;

    private static String ORIGIN_HEADER = "Origin";

    public GamesApiRequestFilter(List<String> allowedOrigins) {
        super();
        this.allowedOrigins = allowedOrigins;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        logger.debug("GamesApiRequestFilter is triggered for request " + request.getMethod() + " " + request.getRequestURI());

        filterChain.doFilter(request, response);
    }
    
}
