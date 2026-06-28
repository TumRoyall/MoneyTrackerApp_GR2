package com.examples.moneytracker.event.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.event.dto.*;
import com.examples.moneytracker.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // ==================== EVENT CRUD ====================

    @PostMapping
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @RequestBody @Valid CreateEventRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventResponse response = eventService.createEvent(request, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> getUserEvents(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<EventResponse> events = eventService.getUserEvents(user.getId());
        return ResponseEntity.ok(ApiResponse.of(events));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<EventDetailResponse>> getEventDetail(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventDetailResponse response = eventService.getEventDetail(eventId, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable UUID eventId,
            @RequestBody @Valid UpdateEventRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventResponse response = eventService.updateEvent(eventId, request, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        eventService.deleteEvent(eventId, user.getId());
        return ResponseEntity.noContent().build();
    }

    // ==================== JOIN / LEAVE ====================

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<EventResponse>> joinEvent(
            @RequestBody @Valid JoinEventRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventResponse response = eventService.joinEvent(request, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping("/{eventId}/leave")
    public ResponseEntity<Void> leaveEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        eventService.leaveEvent(eventId, user.getId());
        return ResponseEntity.noContent().build();
    }

    // ==================== MEMBERS ====================

    @GetMapping("/{eventId}/members")
    public ResponseEntity<ApiResponse<List<EventMemberResponse>>> getEventMembers(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<EventMemberResponse> members = eventService.getEventMembers(eventId, user.getId());
        return ResponseEntity.ok(ApiResponse.of(members));
    }

    @PostMapping("/{eventId}/members")
    public ResponseEntity<ApiResponse<EventMemberResponse>> addMember(
            @PathVariable UUID eventId,
            @RequestBody @Valid AddMemberRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventMemberResponse response = eventService.addMember(eventId, request, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PutMapping("/{eventId}/members/{memberId}")
    public ResponseEntity<ApiResponse<EventMemberResponse>> updateMember(
            @PathVariable UUID eventId,
            @PathVariable UUID memberId,
            @RequestBody @Valid UpdateMemberRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventMemberResponse response = eventService.updateMember(eventId, memberId, request, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @DeleteMapping("/{eventId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID eventId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        eventService.removeMember(eventId, memberId, user.getId());
        return ResponseEntity.noContent().build();
    }

    // ==================== TRANSACTIONS ====================

    @GetMapping("/{eventId}/transactions")
    public ResponseEntity<ApiResponse<List<EventTransactionResponse>>> getEventTransactions(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<EventTransactionResponse> transactions = eventService.getEventTransactions(eventId, user.getId());
        return ResponseEntity.ok(ApiResponse.of(transactions));
    }

    @PostMapping("/{eventId}/transactions")
    public ResponseEntity<ApiResponse<List<EventTransactionResponse>>> addTransaction(
            @PathVariable UUID eventId,
            @RequestBody @Valid CreateEventTransactionRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        List<EventTransactionResponse> transactions = eventService.addTransaction(eventId, request, user.getId());
        return ResponseEntity.ok(ApiResponse.of(transactions));
    }

    @PutMapping("/{eventId}/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<EventTransactionResponse>> updateTransaction(
            @PathVariable UUID eventId,
            @PathVariable UUID transactionId,
            @RequestBody @Valid UpdateEventTransactionRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventTransactionResponse response = eventService.updateTransaction(eventId, transactionId, request, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @DeleteMapping("/{eventId}/transactions/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable UUID eventId,
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        eventService.deleteTransaction(eventId, transactionId, user.getId());
        return ResponseEntity.noContent().build();
    }

    // ==================== GUEST TRANSACTIONS ====================

    @GetMapping("/{eventId}/guest-info")
    public ResponseEntity<ApiResponse<GuestEventInfoResponse>> getGuestEventInfo(
            @PathVariable UUID eventId
    ) {
        GuestEventInfoResponse response = eventService.getGuestEventInfo(eventId);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping("/{eventId}/guest-transactions")
    public ResponseEntity<ApiResponse<Void>> addGuestTransaction(
            @PathVariable UUID eventId,
            @RequestBody @Valid CreateGuestTransactionRequest request
    ) {
        eventService.addGuestTransaction(eventId, request);
        return ResponseEntity.ok(ApiResponse.of(null));
    }

    // ==================== SETTLEMENT ====================

    @GetMapping("/{eventId}/settlement")
    public ResponseEntity<ApiResponse<EventService.SettlementResponse>> getSettlement(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventService.SettlementResponse response = eventService.getSettlement(eventId, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping("/{eventId}/settle")
    public ResponseEntity<ApiResponse<EventService.SettlementResponse>> settleEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        EventService.SettlementResponse response = eventService.settleEvent(eventId, user.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }
}