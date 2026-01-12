package com.examples.moneytracker.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // GỘP TẤT CẢ LỖI VÀO ĐÂY
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAllExceptions(Exception ex, HttpServletRequest req) {

        // LOG FULL STACK TRACE
        log.error("ERROR tại {} {} : {}", req.getMethod(), req.getRequestURI(), ex.getMessage(), ex);

        // STATUS CODE: nếu là RuntimeException → 400, còn lại → 500
        int status = (ex instanceof RuntimeException)
                ? HttpStatus.BAD_REQUEST.value()
                : HttpStatus.INTERNAL_SERVER_ERROR.value();

        ApiError err = new ApiError(
                Instant.now(),
                status,
                (status == 400 ? "Bad Request" : "Internal Error"),
                ex.getMessage(),
                req.getRequestURI()
        );

        return ResponseEntity.status(status).body(err);
    }
}
