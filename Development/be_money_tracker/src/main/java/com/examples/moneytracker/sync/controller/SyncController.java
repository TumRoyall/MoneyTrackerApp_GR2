package com.examples.moneytracker.sync.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.sync.dto.SyncPullResponse;
import com.examples.moneytracker.sync.dto.SyncPushRequest;
import com.examples.moneytracker.sync.dto.SyncPushResponse;
import com.examples.moneytracker.sync.service.SyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

	private final SyncService syncService;

	@GetMapping("/pull")
	public ResponseEntity<SyncPullResponse> pull(
			@RequestParam(name = "cursor", defaultValue = "0") Long cursor,
			@RequestParam(name = "limit", defaultValue = "500") Integer limit,
			@AuthenticationPrincipal CustomUserDetails user
	) {
		return ResponseEntity.ok(syncService.pull(user.getId(), cursor, limit));
	}

	@PostMapping("/push")
	public ResponseEntity<SyncPushResponse> push(
			@RequestBody @Valid SyncPushRequest request,
			@AuthenticationPrincipal CustomUserDetails user
	) {
		return ResponseEntity.ok(syncService.push(user.getId(), request));
	}
}
