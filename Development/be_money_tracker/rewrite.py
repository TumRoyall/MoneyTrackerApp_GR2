import re

file_path = "C:/Users/nguye/Documents/GitHub/MoneyTrackerApp_GR2/Development/be_money_tracker/src/main/java/com/examples/moneytracker/event/service/EventService.java"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace imports
content = content.replace("import com.examples.moneytracker.event.model.EventTransaction;", "import com.examples.moneytracker.transaction.model.Transaction;\nimport com.examples.moneytracker.transaction.model.TransactionType;")
content = content.replace("import com.examples.moneytracker.event.repository.EventTransactionRepository;", "import com.examples.moneytracker.transaction.repository.TransactionRepository;")

# 2. Dependency injection
content = content.replace("private final EventTransactionRepository eventTransactionRepository;", "private final TransactionRepository transactionRepository;")

# 3. Simple repository calls
content = content.replace("eventTransactionRepository.", "transactionRepository.")
content = content.replace("hasUserTransactionsInEvent", "existsByEventIdAndCreatedByAndDeletedAtIsNull")
content = content.replace("findByEventIdAndPayerIdAndDeletedAtIsNull", "findByEventIdAndCreatedByAndDeletedAtIsNull")

# 4. Method param replacements
content = content.replace("EventTransaction tx", "Transaction tx")

# 5. GetEventTransactions response mapping
content = content.replace("List<EventTransaction> transactions =", "List<Transaction> transactions =")

# 6. toEventTransactionResponse mapper
mapper_old = """    private EventTransactionResponse toEventTransactionResponse(EventTransaction tx) {
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
    }"""

mapper_new = """    private EventTransactionResponse toEventTransactionResponse(Transaction tx) {
        User creator = null;
        if (tx.getCreatedBy() != null) {
            creator = userRepository.findById(tx.getCreatedBy()).orElse(null);
        }
        
        String finalGuestName = tx.getGuestName();
        if (tx.getCreatedBy() == null && tx.getGuestName() == null) {
             finalGuestName = "Guest";
        }

        return new EventTransactionResponse(
            tx.getTransactionId(),
            tx.getEventId(),
            tx.getCreatedBy(),
            creator != null ? creator.getFullName() : "Unknown",
            null, // creator avatar
            finalGuestName,
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
    }"""
content = content.replace(mapper_old, mapper_new)

# 7. addGuestTransaction
guest_tx_old = """        EventTransaction tx = new EventTransaction();
        tx.setEventId(eventId);
        tx.setCreatorId(ownerId);
        tx.setPayerId(ownerId);
        tx.setAmount(request.getAmount());
        tx.setCategory(category);
        tx.setNote("[Khách: " + request.getCreatorName() + "] " + (request.getNote() != null ? request.getNote() : ""));
        tx.setDate(request.getDate() != null ? request.getDate().atZone(java.time.ZoneId.systemDefault()).toLocalDate() : LocalDate.now());
        tx.setIsTransferFromPersonal(false);

        eventTransactionRepository.save(tx);"""

guest_tx_new = """        Transaction tx = new Transaction();
        tx.setEventId(eventId);
        tx.setCreatedBy(null);
        tx.setWalletId(null);
        tx.setGuestName(request.getCreatorName());
        tx.setAmount(request.getAmount());
        tx.setCategory(category);
        tx.setCategoryId(category.getCategoryId());
        tx.setNote(request.getNote());
        tx.setType(TransactionType.EXPENSE);
        tx.setDate(request.getDate() != null ? request.getDate().atZone(java.time.ZoneId.systemDefault()).toLocalDate() : LocalDate.now());

        transactionRepository.save(tx);"""
content = content.replace(guest_tx_old, guest_tx_new)

# 8. addTransaction
add_tx_old = """        // 1. Create transfer transaction if requested
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

        tx = eventTransactionRepository.save(tx);"""

add_tx_new = """        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        Transaction tx = new Transaction();
        tx.setEventId(eventId);
        tx.setCreatedBy(userId);
        tx.setWalletId(request.getWalletId());
        tx.setAmount(request.getAmount());
        tx.setCategory(category);
        tx.setCategoryId(category.getCategoryId());
        tx.setNote(request.getNote());
        tx.setType(TransactionType.EXPENSE);
        tx.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());

        tx = transactionRepository.save(tx);"""
content = content.replace(add_tx_old, add_tx_new)

# 9. GetCreatorId -> getCreatedBy in delete/update
content = content.replace("tx.getCreatorId()", "tx.getCreatedBy()")

# 10. Settlement calculation fix
content = content.replace("transactionRepository.sumAmountByPayer(eventId)", "transactionRepository.sumAmountByPayer(eventId);\n            List<Object[]> guestPayerSums = transactionRepository.sumAmountByGuestPayer(eventId);")

# Write back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
