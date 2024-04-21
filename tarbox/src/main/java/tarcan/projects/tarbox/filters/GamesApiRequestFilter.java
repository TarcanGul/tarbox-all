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

    private static final String USER_AGENT = "User-Agent";

    public GamesApiRequestFilter() {
        super();
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        logger.debug("GamesApiRequestFilter is triggered for request " + request.getMethod() + " " + request.getRequestURI());

        if(!request.getMethod().equals("POST")) {
            filterChain.doFilter(request, response);
            return;
        }

        String userAgent = request.getHeader(USER_AGENT);

        if(userAgent == null) {
            response.sendError(400, "User agent is required.");
            return;
        }

        String[] userAgentSplit = userAgent.split(" ");
        String productString = userAgentSplit[0];
        String[] productStringSplit = productString.split("/");

        String product = productStringSplit[0];

        if(!product.equalsIgnoreCase("Tarbox")) {
            response.sendError(403, "Only Tarbox desktop clients can create a game.");
            return;
        }

        filterChain.doFilter(request, response);
    }
    
}
