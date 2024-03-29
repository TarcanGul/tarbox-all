package tarcan.projects.tarbox.utilities;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import io.github.resilience4j.ratelimiter.RequestNotPermitted;

@ControllerAdvice
public class ControllerExceptionHandler {
    @ExceptionHandler({RequestNotPermitted.class})
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public String rateLimit() {
        return "error/429";
    }
}
