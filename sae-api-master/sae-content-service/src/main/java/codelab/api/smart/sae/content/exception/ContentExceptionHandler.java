package codelab.api.smart.sae.content.exception;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Higher-priority advice in the content-service. Handles
 * ResponseStatusException so 404/400/etc. thrown from services are not
 * swallowed by the generic Exception.class handler in sae-common's
 * GlobalExceptionHandler (which would otherwise produce 500).
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ContentExceptionHandler {

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().format(TS));
        body.put("status", status.value());
        body.put("error", ex.getReason() == null ? "Error" : ex.getReason());
        body.put("message", ex.getReason() == null ? ex.getMessage() : ex.getReason());
        return ResponseEntity.status(status).body(body);
    }
}
