package com.examples.moneytracker.event.service;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.event.dto.*;
import com.examples.moneytracker.event.model.Event;
import com.examples.moneytracker.event.model.EventMember;
import com.examples.moneytracker.event.model.EventMemberRole;
import com.examples.moneytracker.event.model.EventStatus;
import com.examples.moneytracker.event.repository.EventMemberRepository;
import com.examples.moneytracker.event.repository.EventRepository;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.service.TransactionService;
import com.examples.moneytracker.user.model.User;
import com.examples.moneytracker.user.repository.UserRepository;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import com.examples.moneytracker.wallet.service.WalletBalanceService;
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
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;
    private final WalletRepository walletRepository;
    private final WalletBalanceService walletBalanceService;

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
        BigDecimal totalSpent = transactionRepository.sumAmountByEventId(eventId);
        long txCount = transactionRepository.countByEventIdAndDeletedAtIsNull(eventId);

        return EventDetailResponse.from(event, memberCount, totalSpent, (int) txCount);
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
        if (transactionRepository.existsByEventIdAndCreatedByAndDeletedAtIsNull(eventId, userId)) {
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
        BigDecimal totalSpent = transactionRepository.sumAmountByEventId(eventId);
        int memberCount = members.size();
        BigDecimal perPersonShare = memberCount > 0
            ? totalSpent.divide(BigDecimal.valueOf(memberCount), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        for (EventMember member : members) {
            User user = userRepository.findById(member.getUserId()).orElse(null);

            // Calculate contribution
            BigDecimal contribution = BigDecimal.ZERO;
            long txCount = 0;

            BigDecimal sum = transactionRepository.sumAmountByEventIdAndCreatedBy(eventId, member.getUserId());
            if (sum != null) contribution = sum;
            txCount = transactionRepository.countByEventIdAndCreatedByAndDeletedAtIsNull(eventId, member.getUserId());

            BigDecimal balance = contribution.subtract(perPersonShare);

            responses.add(EventMemberResponse.from(
                member,
                user,
                contribution,
                (int) txCount,
                balance
            ));
        }

        return responses;
    }

    // ==================== MEMBER CRUD (OWNER only) ====================

    @Transactional
    public EventMemberResponse addMember(UUID eventId, AddMemberRequest request, UUID actorUserId) {
        Event event = findEventById(eventId);

        if (!isUserOwnerOfEvent(actorUserId, eventId)) {
            throw new IllegalArgumentException("Chỉ OWNER mới có quyền thêm thành viên");
        }

        if (!event.isActive()) {
            throw new IllegalArgumentException("Event đã kết toán hoặc archive, không thể thêm thành viên");
        }

        String email = request.getGuestEmail().trim().toLowerCase();

        // Check if user exists
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Create shadow user
            user = new User();
            user.setEmail(email);
            user.setFullName(request.getGuestName().trim());
            user.setPasswordHash("shadow"); // dummy password
            user.setProvider("local");
            user.setIsGuest(true);
            user.setIsVerified(false);
            user = userRepository.save(user);
        }

        // Check if already in event
        if (eventMemberRepository.existsByEventIdAndUserIdAndDeletedAtIsNull(eventId, user.getUserId())) {
            throw new IllegalArgumentException("Người này đã là thành viên trong event");
        }

        EventMember member = new EventMember();
        member.setEventId(eventId);
        member.setUserId(user.getUserId());
        member.setRole(EventMemberRole.MEMBER);
        member.setJoinedAt(Instant.now());
        member.setInvitedBy(actorUserId);

        member = eventMemberRepository.save(member);

        // Build response với contribution/balance = 0 (mới tạo, chưa có transaction)
        return EventMemberResponse.from(member, user, BigDecimal.ZERO, 0, BigDecimal.ZERO);
    }

    @Transactional
    public EventMemberResponse updateMember(UUID eventId, UUID memberId, UpdateMemberRequest request, UUID actorUserId) {
        Event event = findEventById(eventId);

        if (!isUserOwnerOfEvent(actorUserId, eventId)) {
            throw new IllegalArgumentException("Chỉ OWNER mới có quyền sửa thành viên");
        }

        EventMember member = eventMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên"));

        if (!member.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Thành viên không thuộc event này");
        }

        // OWNER không thể tự hạ role của mình
        if (request.getRole() != null
            && member.getUserId().equals(actorUserId)
            && request.getRole() != EventMemberRole.OWNER) {
            throw new IllegalArgumentException("OWNER không thể tự hạ role của mình");
        }

        User user = userRepository.findById(member.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));

        // Only allow updating email/name if they are a shadow guest user
        if (Boolean.TRUE.equals(user.getIsGuest())) {
            if (request.getGuestEmail() != null && !request.getGuestEmail().isBlank()) {
                String newEmail = request.getGuestEmail().trim().toLowerCase();
                if (!newEmail.equals(user.getEmail())) {
                    if (userRepository.existsByEmail(newEmail)) {
                        throw new IllegalArgumentException("Email này đã có người sử dụng");
                    }
                    user.setEmail(newEmail);
                    if (request.getDisplayName() == null || request.getDisplayName().isBlank()) {
                        user.setFullName(newEmail);
                    }
                }
            }
            if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
                user.setFullName(request.getDisplayName().trim());
            }
            userRepository.save(user);
        } else {
            if (request.getGuestEmail() != null && !request.getGuestEmail().isBlank()) {
                throw new IllegalArgumentException("Không thể đổi email cho user thật");
            }
        }

        if (request.getRole() != null) {
            member.setRole(request.getRole());
        }

        member = eventMemberRepository.save(member);

        BigDecimal contribution = BigDecimal.ZERO;
        long txCount = 0;
        BigDecimal sum = transactionRepository.sumAmountByEventIdAndCreatedBy(eventId, member.getUserId());
        if (sum != null) contribution = sum;
        txCount = transactionRepository.countByEventIdAndCreatedByAndDeletedAtIsNull(eventId, member.getUserId());

        BigDecimal totalSpent = transactionRepository.sumAmountByEventId(eventId);
        int memberCount = (int) eventMemberRepository.countByEventIdAndDeletedAtIsNull(eventId);
        BigDecimal perPersonShare = memberCount > 0
            ? totalSpent.divide(BigDecimal.valueOf(memberCount), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal balance = contribution.subtract(perPersonShare);

        return EventMemberResponse.from(member, user, contribution, (int) txCount, balance);
    }

    @Transactional
    public void removeMember(UUID eventId, UUID memberId, UUID actorUserId) {
        Event event = findEventById(eventId);

        if (!isUserOwnerOfEvent(actorUserId, eventId)) {
            throw new IllegalArgumentException("Chỉ OWNER mới có quyền xoá thành viên");
        }

        EventMember member = eventMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên"));

        if (!member.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Thành viên không thuộc event này");
        }

        if (member.getUserId() != null && member.getUserId().equals(actorUserId)) {
            throw new IllegalArgumentException("OWNER không thể tự xoá. Hãy chuyển quyền trước");
        }

        // Soft-delete — transactions cũ vẫn giữ nguyên
        member.setDeletedAt(Instant.now());
        eventMemberRepository.save(member);
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
    public EventTransactionResponse addGuestTransaction(UUID eventId, CreateGuestTransactionRequest request) {
        Event event = findEventById(eventId);

        if (!event.isActive()) {
            throw new IllegalArgumentException("Event is not active");
        }

        UUID ownerId = event.getCreatedBy();

        String email = request.getCreatorEmail() != null
            ? request.getCreatorEmail().trim().toLowerCase()
            : "guest_" + UUID.randomUUID().toString() + "@moneytracker.local";

        String guestName = request.getCreatorName().trim();

        // Check if user exists
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Create shadow user
            user = new User();
            user.setEmail(email);
            user.setFullName(guestName);
            user.setPasswordHash("shadow"); // dummy password
            user.setProvider("local");
            user.setIsGuest(true);
            user.setIsVerified(false);
            user = userRepository.save(user);
        } else if (Boolean.TRUE.equals(user.getIsGuest())) {
            // Update guest name if changed
            if (!guestName.equals(user.getFullName())) {
                user.setFullName(guestName);
                user = userRepository.save(user);
            }
        }

        // Check if member exists, else create
        if (!eventMemberRepository.existsByEventIdAndUserIdAndDeletedAtIsNull(eventId, user.getUserId())) {
            EventMember m = new EventMember();
            m.setEventId(eventId);
            m.setUserId(user.getUserId());
            m.setRole(EventMemberRole.MEMBER);
            m.setJoinedAt(Instant.now());
            eventMemberRepository.save(m);
        }

        List<Category> ownerCategories = categoryRepository.findAccessibleCategories(ownerId).stream()
                .filter(c -> "EXPENSE".equals(c.getType()))
                .toList();
        Category category = null;

        if (request.getCategoryIcon() != null && !ownerCategories.isEmpty()) {
            category = ownerCategories.stream()
                .filter(c -> request.getCategoryIcon().equals(c.getIcon()))
                .findFirst()
                .orElse(ownerCategories.get(0));
        } else if (!ownerCategories.isEmpty()) {
            category = ownerCategories.get(0);
        } else {
            category = new Category();
            category.setUserId(ownerId);
            category.setName(request.getCategoryName() != null ? request.getCategoryName() : "Khác");
            category.setType("EXPENSE");
            category.setIcon(request.getCategoryIcon() != null ? request.getCategoryIcon() : "help");
            category.setColor("#29bcc8");
            category.setIsDefault(true);
            category = categoryRepository.save(category);
        }

        Transaction tx = new Transaction();
        tx.setEventId(eventId);
        tx.setCreatedBy(user.getUserId());
        tx.setWalletId(null);
        tx.setAmount(request.getAmount());
        tx.setCategory(category);
        tx.setCategoryId(category.getCategoryId());
        tx.setNote("[Khách: " + guestName + "] " + (request.getNote() != null ? request.getNote() : ""));
        tx.setType(com.examples.moneytracker.transaction.model.TransactionType.EXPENSE);
        tx.setDate(request.getDate() != null ? request.getDate().atZone(java.time.ZoneId.systemDefault()).toLocalDate() : LocalDate.now());

        transactionRepository.save(tx);

        return toEventTransactionResponse(tx);
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

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        Transaction tx = new Transaction();
        tx.setEventId(eventId);
        tx.setCreatedBy(userId);
        tx.setWalletId(request.getWalletId());
        tx.setAmount(request.getAmount());
        tx.setCategory(category);
        tx.setCategoryId(category.getCategoryId());
        tx.setNote(request.getNote());
        tx.setType(com.examples.moneytracker.transaction.model.TransactionType.EXPENSE);
        tx.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());

        tx = transactionRepository.save(tx);

        // Cập nhật wallet balance (fix bug: trước đây không gọi → ví không đổi khi tạo transaction event)
        if (tx.getWalletId() != null) {
            Wallet wallet = walletRepository.findById(tx.getWalletId()).orElse(null);
            if (wallet != null && wallet.getUserId().equals(userId)) {
                walletBalanceService.applyTransactionCreate(wallet, tx);
            }
        }

        results.add(toEventTransactionResponse(tx));

        return results;
    }

    public List<EventTransactionResponse> getEventTransactions(UUID eventId, UUID userId) {
        Event event = findEventById(eventId);

        // Check access
        if (!isUserMemberOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You are not a member of this event");
        }

        List<Transaction> transactions = transactionRepository.findByEventIdAndDeletedAtIsNullOrderByDateDescCreatedAtDesc(eventId);
        return transactions.stream()
                .map(this::toEventTransactionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EventTransactionResponse updateTransaction(UUID eventId, UUID transactionId, UpdateEventTransactionRequest request, UUID userId) {
        Transaction tx = transactionRepository.findByTransactionIdAndEventIdAndDeletedAtIsNull(transactionId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        // Only creator can update
        if (!userId.equals(tx.getCreatedBy())) {
            throw new IllegalArgumentException("You can only edit your own transactions");
        }

        Event event = findEventById(eventId);
        if (!event.isModifiable()) {
            throw new IllegalArgumentException("Event is not modifiable");
        }

        // Snapshot giá trị CŨ trước khi mutate để tính delta wallet balance
        java.math.BigDecimal oldAmount = tx.getAmount();
        var oldType = tx.getType();

        if (request.getAmount() != null) {
            tx.setAmount(request.getAmount());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            tx.setCategory(category);
            tx.setCategoryId(category.getCategoryId());
        }
        if (request.getNote() != null) {
            tx.setNote(request.getNote());
        }

        tx = transactionRepository.save(tx);

        // Update wallet balance — chỉ khi walletId != null và là owner của ví
        if (tx.getWalletId() != null) {
            Wallet wallet = walletRepository.findById(tx.getWalletId()).orElse(null);
            if (wallet != null && wallet.getUserId().equals(userId)) {
                walletBalanceService.applyTransactionUpdate(wallet, oldAmount, oldType, tx.getAmount(), tx.getType());
            }
        }

        return toEventTransactionResponse(tx);
    }

    @Transactional
    public void deleteTransaction(UUID eventId, UUID transactionId, UUID userId) {
        Transaction tx = transactionRepository.findByTransactionIdAndEventIdAndDeletedAtIsNull(transactionId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        Event event = findEventById(eventId);

        // Creator or owner can delete
        if (!userId.equals(tx.getCreatedBy()) && !isUserOwnerOfEvent(userId, eventId)) {
            throw new IllegalArgumentException("You don't have permission to delete this transaction");
        }

        if (!event.isModifiable()) {
            throw new IllegalArgumentException("Event is not modifiable");
        }

        // Hoàn lại wallet balance TRƯỚC khi soft-delete (tránh trường hợp rollback)
        if (tx.getWalletId() != null) {
            Wallet wallet = walletRepository.findById(tx.getWalletId()).orElse(null);
            if (wallet != null && wallet.getUserId().equals(userId)) {
                walletBalanceService.applyTransactionDelete(wallet, tx);
            }
        }

        tx.setDeletedAt(Instant.now());
        transactionRepository.save(tx);
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
        BigDecimal totalSpent = transactionRepository.sumAmountByEventId(event.getEventId());
        int txCount = (int) transactionRepository.countByEventIdAndDeletedAtIsNull(event.getEventId());

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

    private EventTransactionResponse toEventTransactionResponse(Transaction tx) {
        User creator = null;
        if (tx.getCreatedBy() != null) {
            creator = userRepository.findById(tx.getCreatedBy()).orElse(null);
        }

        return new EventTransactionResponse(
            tx.getTransactionId(),
            tx.getEventId(),
            tx.getCreatedBy(),
            creator != null ? creator.getFullName() : "Unknown",
            null, // creator avatar
            tx.getWalletId(),
            tx.getAmount(),
            tx.getCategory().getCategoryId(),
            tx.getCategory().getName(),
            tx.getCategory().getIcon(),
            tx.getNote(),
            tx.getDate(),
            tx.getCreatedAt(),
            tx.getVersion()
        );
    }

    private SettlementResponse calculateSettlement(UUID eventId) {
        BigDecimal totalSpent = transactionRepository.sumAmountByEventId(eventId);
        List<EventMember> members = eventMemberRepository.findByEventIdAndDeletedAtIsNullOrderByJoinedAtAsc(eventId);
        int memberCount = members.size();

        BigDecimal perPersonShare = memberCount > 0
            ? totalSpent.divide(BigDecimal.valueOf(memberCount), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // Calculate balances
        List<MemberBalance> memberBalances = new ArrayList<>();
        List<Object[]> payerSums = transactionRepository.sumAmountByPayer(eventId);

        for (EventMember member : members) {
            String userName;
            BigDecimal contribution = BigDecimal.ZERO;

            User user = userRepository.findById(member.getUserId()).orElse(null);
            userName = user != null ? user.getFullName() : "Unknown";

            for (Object[] row : payerSums) {
                if (row[0] != null && row[0].equals(member.getUserId())) {
                    contribution = (BigDecimal) row[1];
                    break;
                }
            }

            BigDecimal balance = contribution.subtract(perPersonShare);

            memberBalances.add(new MemberBalance(
                member.getUserId(),
                userName,
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
