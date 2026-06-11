package com.examples.moneytracker.event.service;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.event.dto.*;
import com.examples.moneytracker.event.model.Event;
import com.examples.moneytracker.event.model.EventMember;
import com.examples.moneytracker.event.model.EventMemberRole;
import com.examples.moneytracker.event.model.EventStatus;
import com.examples.moneytracker.event.model.EventTransaction;
import com.examples.moneytracker.event.repository.EventMemberRepository;
import com.examples.moneytracker.event.repository.EventRepository;
import com.examples.moneytracker.event.repository.EventTransactionRepository;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.service.TransactionService;
import com.examples.moneytracker.user.model.User;
import com.examples.moneytracker.user.repository.UserRepository;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventMemberRepository eventMemberRepository;
    private final EventTransactionRepository eventTransactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final WalletRepository walletRepository;
    private final TransactionService transactionService;

    private static final String SHARE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int SHARE_CODE_LENGTH = 6;

    // ==================== EVENT CRUD ====================

    @Transactional
    public EventResponse createEvent(CreateEventRequest request, UUID userId) {
        // Generate unique share code
        String shareCode = generateUniqueShareCode();
        String shareLink = "https://moneytracker.app/e/" + shareCode;

        // Create event
        Event event = new Event();
        event.setName(request.getName());
        event.setIcon(request.getIcon() != null ? request.getIcon() : "🎉");
        event.setDescription(request.getDescription());
        event.setStatus(EventStatus.ACTIVE);
        event.setShareCode(shareCode);
        event.setShareLink(shareLink);
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setCreatedBy(userId);

        event = eventRepository.save(event);

        // Add creator as owner
        EventMember owner = new EventMember();
        owner.setEventId(event.getEventId());
        owner.setUserId(userId);
        owner.setRole(EventMemberRole.OWNER);
        owner.setJoinedAt(Instant.now());
        eventMemberRepository.save(owner);

        return toEventResponse(event);
    }

    public List<EventResponse> getUserEvents(UUID userId) {
        List<Event> events = eventRepository.findAllByUser(userId);
        return events.stream()
                .map(this::toEventResponse)
                .collect(Collectors.toList());
    }

    public EventDetailResponse getEventDetail(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        // Check access
        if (!isUserMemberOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You are not a member of this event");
        }

        int memberCount = (int) eventMemberRepository.countByEventIdAndDeletedAtIsNull(eventId);
        BigDecimal totalSpent = eventTransactionRepository.sumAmountByEventId(eventId);
        int txCount = (int) eventTransactionRepository.countByEventIdAndDeletedAtIsNull(eventId);

        return EventDetailResponse.from(event, memberCount, totalSpent, txCount);
    }

    @Transactional
    public EventResponse updateEvent(UUID eventId, UpdateEventRequest request, UUID userId) {
        Event event = findEventById(eventId);

        // Check owner
        if (!isUserOwnerOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("Only owner can update event");
        }

        if (!event.isModifiable()) {
            throw new IllegalArgumentException("Event is not modifiable (settled or archived)");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            event.setName(request.getName());
        }
        if (request.getIcon() != null) {
            event.setIcon(request.getIcon());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getStartDate() != null) {
            event.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            event.setEndDate(request.getEndDate());
        }

        event = eventRepository.save(event);
        return toEventResponse(event);
    }

    @Transactional
    public void deleteEvent(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        if (!isUserOwnerOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("Only owner can delete event");
        }

        event.setDeletedAt(Instant.now());
        eventRepository.save(event);
    }

    // ==================== JOIN / LEAVE ====================

    @Transactional
    public EventResponse joinEvent(JoinEventRequest request, UUID userId) {
        Event event = eventRepository.findByShareCodeAndDeletedAtIsNull(request.getShareCode().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (event.getStatus() != EventStatus.ACTIVE) {
            throw new IllegalArgumentException("Event is not active");
        }

        // Check if already member
        if (isUserMemberOfEvent(userId, event.getEventId())) {
            throw new IllegalArgumentException("Already a member of this event");
        }

        // Add as member
        EventMember member = new EventMember();
        member.setEventId(event.getEventId());
        member.setUserId(userId);
        member.setRole(EventMemberRole.MEMBER);
        member.setJoinedAt(Instant.now());
        eventMemberRepository.save(member);

        return toEventResponse(event);
    }

    @Transactional
    public void leaveEvent(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        // Cannot leave if owner
        if (isUserOwnerOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("Owner cannot leave. Transfer ownership or delete event.");
        }

        EventMember member = eventMemberRepository.findByEventIdAndUserIdAndDeletedAtIsNull(eventId, userId)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this event"));

        // Check if user has transactions
        if (eventTransactionRepository.hasUserTransactionsInEvent(eventId, userId)) {
            throw new IllegalArgumentException("Cannot leave event with existing transactions");
        }

        member.setDeletedAt(Instant.now());
        eventMemberRepository.save(member);
    }

    // ==================== MEMBERS ====================

    public List<EventMemberResponse> getEventMembers(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        // Check access
        if (!isUserMemberOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You are not a member of this event");
        }

        List<EventMember> members = eventMemberRepository.findByEventIdAndDeletedAtIsNullOrderByJoinedAtAsc(eventId);
        List<EventMemberResponse> responses = new ArrayList<>();

        // Calculate per person share
        BigDecimal totalSpent = eventTransactionRepository.sumAmountByEventId(eventId);
        int memberCount = members.size();
        BigDecimal perPersonShare = memberCount > 0
            ? totalSpent.divide(BigDecimal.valueOf(memberCount), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        for (EventMember member : members) {
            User user = userRepository.findById(member.getUserId()).orElse(null);

            // Calculate contribution (sum by payer)
            BigDecimal contribution = BigDecimal.ZERO;
            List<Object[]> payerSums = eventTransactionRepository.sumAmountByPayer(eventId);
            for (Object[] row : payerSums) {
                if (row[0].equals(member.getUserId())) {
                    contribution = (BigDecimal) row[1];
                    break;
                }
            }

            int txCount = eventTransactionRepository.findByEventIdAndPayerIdAndDeletedAtIsNull(eventId, member.getUserId()).size();
            BigDecimal balance = contribution.subtract(perPersonShare);

            responses.add(new EventMemberResponse(
                member.getId(),
                member.getEventId(),
                member.getUserId(),
                user != null ? user.getFullName() : "Unknown",
                null, // avatar
                member.getRole().name(),
                member.getJoinedAt(),
                contribution,
                txCount,
                balance
            ));
        }

        return responses;
    }

    // ==================== GUEST TRANSACTIONS ====================

    public GuestEventInfoResponse getGuestEventInfo(UUID eventId) {
        Event event = findEventById(eventId);
        return new GuestEventInfoResponse(
            event.getEventId(),
            event.getName(),
            event.getIcon(),
            event.getStatus().name()
        );
    }

    @Transactional
    public void addGuestTransaction(UUID eventId, CreateGuestTransactionRequest request) {
        Event event = findEventById(eventId);

        if (!event.isActive()) {
            throw new IllegalArgumentException("Event is not active");
        }

        UUID ownerId = event.getCreatedBy();

        // Guest doesn't have real category ID from DB.
        // We will try to find an existing expense category of the owner, or create one.
        // For simplicity, find the first expense category of the owner.
        List<Category> ownerCategories = categoryRepository.findAccessibleCategories(ownerId).stream()
                .filter(c -> "EXPENSE".equals(c.getType()))
                .toList();
        Category category = null;
        
        // Try to find matching icon
        if (request.getCategoryIcon() != null && !ownerCategories.isEmpty()) {
            category = ownerCategories.stream()
                .filter(c -> request.getCategoryIcon().equals(c.getIcon()))
                .findFirst()
                .orElse(ownerCategories.get(0));
        } else if (!ownerCategories.isEmpty()) {
            category = ownerCategories.get(0);
        } else {
            // Create a default category if owner has none (unlikely but safe)
            category = new Category();
            category.setUserId(ownerId);
            category.setName(request.getCategoryName() != null ? request.getCategoryName() : "Khác");
            category.setType("EXPENSE");
            category.setIcon(request.getCategoryIcon() != null ? request.getCategoryIcon() : "help");
            category.setColor("#29bcc8");
            category.setIsDefault(true);
            category = categoryRepository.save(category);
        }

        EventTransaction tx = new EventTransaction();
        tx.setEventId(eventId);
        tx.setCreatorId(ownerId);
        tx.setPayerId(ownerId);
        tx.setAmount(request.getAmount());
        tx.setCategory(category);
        tx.setNote("[Khách: " + request.getCreatorName() + "] " + (request.getNote() != null ? request.getNote() : ""));
        tx.setDate(request.getDate() != null ? request.getDate().atZone(java.time.ZoneId.systemDefault()).toLocalDate() : LocalDate.now());
        tx.setIsTransferFromPersonal(false);

        eventTransactionRepository.save(tx);
    }

    // ==================== TRANSACTIONS ====================

    @Transactional
    public List<EventTransactionResponse> addTransaction(UUID eventId, CreateEventTransactionRequest request, UUID userId) {
        Event event = findEventById(eventId);

        // Check access
        if (!isUserMemberOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You are not a member of this event");
        }

        if (!event.isActive()) {
            throw new IllegalArgumentException("Event is not active");
        }

        List<EventTransactionResponse> results = new ArrayList<>();

        // 1. Create transfer transaction if requested
        if (Boolean.TRUE.equals(request.getIsTransferFromPersonal()) && request.getPersonalWalletId() != null) {
            CreateTransactionRequest transferRequest = new CreateTransactionRequest();
            transferRequest.setWalletId(request.getPersonalWalletId());
            transferRequest.setAmount(request.getAmount());
            transferRequest.setCategoryId(request.getCategoryId());
            transferRequest.setNote(request.getNote() + " → " + event.getName());
            transferRequest.setDate(request.getDate());
            transferRequest.setType("TRANSFER");

            transactionService.create(transferRequest, userId);
        }

        // 2. Create event transaction
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        EventTransaction tx = new EventTransaction();
        tx.setEventId(eventId);
        tx.setCreatorId(userId);
        tx.setPayerId(request.getPayerId() != null ? request.getPayerId() : userId);
        tx.setAmount(request.getAmount());
        tx.setCategory(category);
        tx.setNote(request.getNote());
        tx.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());
        tx.setIsTransferFromPersonal(request.getIsTransferFromPersonal());
        tx.setPersonalWalletId(request.getPersonalWalletId());

        tx = eventTransactionRepository.save(tx);

        results.add(toEventTransactionResponse(tx));

        return results;
    }

    public List<EventTransactionResponse> getEventTransactions(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        // Check access
        if (!isUserMemberOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You are not a member of this event");
        }

        List<EventTransaction> transactions = eventTransactionRepository.findByEventIdAndDeletedAtIsNullOrderByDateDescCreatedAtDesc(eventId);
        return transactions.stream()
                .map(this::toEventTransactionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EventTransactionResponse updateTransaction(UUID eventId, UUID transactionId, UpdateEventTransactionRequest request, UUID userId) {
        EventTransaction tx = eventTransactionRepository.findByIdAndEventIdAndDeletedAtIsNull(transactionId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        // Only creator can update
        if (!tx.getCreatorId().equals(userId)) {
            throw new IllegalArgumentException("Only the creator can update this transaction");
        }

        Event event = findEventById(eventId);
        if (!event.isModifiable()) {
            throw new IllegalArgumentException("Event is not modifiable");
        }

        if (request.getAmount() != null) {
            tx.setAmount(request.getAmount());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            tx.setCategory(category);
        }
        if (request.getNote() != null) {
            tx.setNote(request.getNote());
        }

        tx = eventTransactionRepository.save(tx);
        return toEventTransactionResponse(tx);
    }

    @Transactional
    public void deleteTransaction(UUID eventId, UUID transactionId, UUID userId) {
        EventTransaction tx = eventTransactionRepository.findByIdAndEventIdAndDeletedAtIsNull(transactionId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        Event event = findEventById(eventId);

        // Creator can delete, or owner can delete anyone's
        if (!tx.getCreatorId().equals(userId) && !isUserOwnerOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You don't have permission to delete this transaction");
        }

        if (!event.isModifiable()) {
            throw new IllegalArgumentException("Event is not modifiable");
        }

        tx.setDeletedAt(Instant.now());
        eventTransactionRepository.save(tx);
    }

    // ==================== SETTLEMENT ====================

    public SettlementResponse getSettlement(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        // Check access
        if (!isUserMemberOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You are not a member of this event");
        }

        return calculateSettlement(eventId);
    }

    @Transactional
    public SettlementResponse settleEvent(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        // Only owner can settle
        if (!isUserOwnerOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("Only owner can settle event");
        }

        if (event.getStatus() != EventStatus.ACTIVE) {
            throw new IllegalArgumentException("Event is already settled or archived");
        }

        event.setStatus(EventStatus.SETTLED);
        eventRepository.save(event);

        return calculateSettlement(eventId);
    }

    // ==================== PRIVATE HELPERS ====================

    private Event findEventById(UUID eventId) {
        return eventRepository.findByEventIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    }

    private boolean isUserMemberOfEvent(UUID userId, UUID eventId) {
        return eventMemberRepository.existsByEventIdAndUserIdAndDeletedAtIsNull(eventId, userId);
    }

    private boolean isUserOwnerOfEvent(UUID userId, UUID eventId) {
        return eventMemberRepository.isUserRoleInEvent(eventId, userId, EventMemberRole.OWNER);
    }

    private String generateUniqueShareCode() {
        SecureRandom random = new SecureRandom();
        String code;
        do {
            StringBuilder sb = new StringBuilder(SHARE_CODE_LENGTH);
            for (int i = 0; i < SHARE_CODE_LENGTH; i++) {
                sb.append(SHARE_CODE_CHARS.charAt(random.nextInt(SHARE_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (eventRepository.existsByShareCode(code));
        return code;
    }

    private EventResponse toEventResponse(Event event) {
        int memberCount = (int) eventMemberRepository.countByEventIdAndDeletedAtIsNull(event.getEventId());
        BigDecimal totalSpent = eventTransactionRepository.sumAmountByEventId(event.getEventId());
        int txCount = (int) eventTransactionRepository.countByEventIdAndDeletedAtIsNull(event.getEventId());

        return new EventResponse(
            event.getEventId(),
            event.getName(),
            event.getIcon(),
            event.getDescription(),
            event.getShareCode(),
            event.getShareLink(),
            event.getStatus().name(),
            event.getStartDate(),
            event.getEndDate(),
            event.getCreatedBy(),
            event.getCreatedAt(),
            memberCount,
            totalSpent,
            txCount
        );
    }

    private EventTransactionResponse toEventTransactionResponse(EventTransaction tx) {
        User creator = userRepository.findById(tx.getCreatorId()).orElse(null);
        User payer = userRepository.findById(tx.getPayerId()).orElse(null);

        return new EventTransactionResponse(
            tx.getId(),
            tx.getEventId(),
            tx.getCreatorId(),
            creator != null ? creator.getFullName() : "Unknown",
            null, // creator avatar
            tx.getPayerId(),
            payer != null ? payer.getFullName() : "Unknown",
            tx.getAmount(),
            tx.getCategory().getCategoryId(),
            tx.getCategory().getName(),
            tx.getCategory().getIcon(),
            tx.getNote(),
            tx.getDate(),
            tx.getIsTransferFromPersonal(),
            tx.getPersonalWalletId(),
            tx.getCreatedAt(),
            tx.getVersion()
        );
    }

    private SettlementResponse calculateSettlement(UUID eventId) {
        BigDecimal totalSpent = eventTransactionRepository.sumAmountByEventId(eventId);
        List<EventMember> members = eventMemberRepository.findByEventIdAndDeletedAtIsNullOrderByJoinedAtAsc(eventId);
        int memberCount = members.size();

        BigDecimal perPersonShare = memberCount > 0
            ? totalSpent.divide(BigDecimal.valueOf(memberCount), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // Calculate balances
        List<MemberBalance> memberBalances = new ArrayList<>();
        for (EventMember member : members) {
            User user = userRepository.findById(member.getUserId()).orElse(null);

            BigDecimal contribution = BigDecimal.ZERO;
            List<Object[]> payerSums = eventTransactionRepository.sumAmountByPayer(eventId);
            for (Object[] row : payerSums) {
                if (row[0].equals(member.getUserId())) {
                    contribution = (BigDecimal) row[1];
                    break;
                }
            }

            BigDecimal balance = contribution.subtract(perPersonShare);

            memberBalances.add(new MemberBalance(
                member.getUserId(),
                user != null ? user.getFullName() : "Unknown",
                contribution,
                balance
            ));
        }

        // Optimize settlements
        List<SettlementItem> settlements = optimizeSettlements(memberBalances);

        return new SettlementResponse(
            eventId,
            totalSpent,
            memberCount,
            perPersonShare,
            memberBalances,
            settlements
        );
    }

    /**
     * Greedy algorithm to minimize number of settlement transactions
     */
    private List<SettlementItem> optimizeSettlements(List<MemberBalance> memberBalances) {
        List<SettlementItem> settlements = new ArrayList<>();

        // Separate creditors and debtors
        List<MemberBalance> creditors = memberBalances.stream()
            .filter(m -> m.getBalance().compareTo(BigDecimal.ZERO) > 0)
            .sorted((a, b) -> b.getBalance().compareTo(a.getBalance()))
            .collect(Collectors.toList());

        List<MemberBalance> debtors = memberBalances.stream()
            .filter(m -> m.getBalance().compareTo(BigDecimal.ZERO) < 0)
            .sorted(Comparator.comparing(MemberBalance::getBalance))
            .collect(Collectors.toList());

        // Match creditors with debtors
        int i = 0, j = 0;
        while (i < creditors.size() && j < debtors.size()) {
            MemberBalance creditor = creditors.get(i);
            MemberBalance debtor = debtors.get(j);

            BigDecimal creditAmount = creditor.getBalance();
            BigDecimal debtAmount = debtor.getBalance().abs();

            BigDecimal settleAmount = creditAmount.min(debtAmount);

            settlements.add(new SettlementItem(
                debtor.getUserId(),
                debtor.getUserName(),
                creditor.getUserId(),
                creditor.getUserName(),
                settleAmount
            ));

            // Update remaining balances
            creditor.setBalance(creditAmount.subtract(settleAmount));
            debtor.setBalance(debtAmount.subtract(settleAmount).negate());

            if (creditor.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
                i++;
            }
            if (debtor.getBalance().compareTo(BigDecimal.ZERO) >= 0) {
                j++;
            }
        }

        return settlements;
    }

    // Inner classes for settlement
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class MemberBalance {
        private UUID userId;
        private String userName;
        private BigDecimal contribution;
        private BigDecimal balance;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SettlementItem {
        private UUID fromUserId;
        private String fromUserName;
        private UUID toUserId;
        private String toUserName;
        private BigDecimal amount;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SettlementResponse {
        private UUID eventId;
        private BigDecimal totalSpent;
        private int memberCount;
        private BigDecimal perPersonShare;
        private List<MemberBalance> memberBalances;
        private List<SettlementItem> settlements;
    }
}