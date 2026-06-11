package com.examples.moneytracker.common.exception;

import com.examples.moneytracker.common.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // GỘP TẤT CẢ LỖI VÀO ĐÂY
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex, HttpServletRequest req) {

        // LOG FULL STACK TRACE
        log.error("ERROR tại {} {} : {}", req.getMethod(), req.getRequestURI(), ex.getMessage(), ex);

        // STATUS CODE: nếu là RuntimeException → 400, còn lại → 500
        int status = (ex instanceof RuntimeException)
                ? HttpStatus.BAD_REQUEST.value()
                : HttpStatus.INTERNAL_SERVER_ERROR.value();

        String code = (status == 400) ? "BAD_REQUEST" : "INTERNAL_ERROR";
        Map<String, Object> details = Map.of(
            "path", req.getRequestURI(),
            "method", req.getMethod()
        );

        ErrorResponse err = new ErrorResponse(
            new ErrorResponse.ErrorDetail(
                code,
                ex.getMessage(),
                details,
                Instant.now()
            )
        );

        return ResponseEntity.status(status).body(err);
    }
}
