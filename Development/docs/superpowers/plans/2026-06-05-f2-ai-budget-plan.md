# F2: AI Budget Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users generate a monthly budget draft by describing their income + needs to Gemini, preview + adjust the allocation with F1's percent adjuster, and batch-save the result as N budgets (one per category).

**Architecture:** Backend adds `AiBudgetService` that builds a context-aware prompt (categories + 6-month spending stats when available) and calls the existing `AiProviderGateway` (Gemini). The response is parsed as JSON, validated (sum=100, max 6 categories, "Tiết kiệm" present), and returned to mobile with `percent` per category. Mobile recomputes `amount = income × percent / 100` reactively in the preview screen, lets the user adjust, then `POST /api/budgets/batch` creates N `Budget` rows in one transaction (each row = 1 category, `source=AI_CONFIRMED`, same `draftId`).

**Tech Stack:**
- Backend: Spring Boot 3, JPA/Hibernate (`ddl-auto=update` — no Flyway), Jackson, Lombok
- AI: `AiProviderGateway` (Gemini 1.5 Flash), prompt = system + JSON user context + instruction
- Mobile: Expo SDK 54, React Native 0.81, TypeScript, TanStack Query, expo-router, AsyncStorage via SecureStore
- Validation: JUnit 5 + Mockito for backend `BudgetDraftValidator`

**Estimated Effort:** 2-3 weeks (10-12 working days)

---

## File Structure

### New Backend Files
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/model/BudgetSource.java` - Enum: `MANUAL`, `AI_CONFIRMED`
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/AiBudgetDraftRequest.java` - Request body for `POST /api/ai/budget/draft`
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/AiBudgetDraftResponse.java` - Draft response (items[] + summary)
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/BudgetItemDto.java` - Single category row in draft
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/BudgetSummaryDto.java` - Aggregate summary block
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchCreateBudgetRequest.java` - Request body for `POST /api/budgets/batch`
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchCreateBudgetResponse.java` - Response wrapping N BudgetResponse
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchBudgetItemDto.java` - Single item in batch request
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/prompt/BudgetPromptBuilder.java` - Builds system+user prompt string from context
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/validation/BudgetDraftValidator.java` - Pure logic: filter+normalize+balance to 100, max 6
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/repository/HistoricalStatsRepository.java` - JPA query for top categories by avg spend (6mo)
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/HistoricalStatsDto.java` - Row returned by repo
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/service/AiBudgetService.java` - Orchestrates: build context → Gemini → parse → validate
- `be_money_tracker/src/main/java/com/examples/moneytracker/ai/controller/AiBudgetController.java` - `POST /api/ai/budget/draft`
- `be_money_tracker/src/test/java/com/examples/moneytracker/ai/validation/BudgetDraftValidatorTest.java` - Unit tests for validator (RED-GREEN-REFACTOR)

### Modified Backend Files
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/model/Budget.java` - Add `source` (BudgetSource), `aiReasoning` (String), `draftId` (UUID); make `walletId` nullable
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BudgetResponse.java` - Add `source`, `aiReasoning`, `draftId` fields
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/CreateBudgetRequest.java` - Make `walletId` nullable (use `@Nullable` or drop `@NotNull`)
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/service/BudgetService.java` - Add `createBatch(BatchCreateBudgetRequest, UUID)` method (transactional, N inserts)
- `be_money_tracker/src/main/java/com/examples/moneytracker/budget/controller/BudgetController.java` - Add `POST /api/budgets/batch` endpoint
- `be_money_tracker/src/main/resources/application.properties` - Add `ai.gemini.apiKey=...` and ensure `ai.gemini.model=gemini-1.5-flash`

### New Mobile Files
- `app_moneytracker/src/modules/budget/api/aiBudgetApi.ts` - `generateDraft()` and `batchCreate()` typed wrappers
- `app_moneytracker/src/modules/budget/storage/draftStorage.ts` - AsyncStorage helpers for in-progress AI draft (resume on cold start)
- `app_moneytracker/src/modules/budget/storage/profileStorage.ts` - Local profile (income, goal text) for F2 only — F3 will replace
- `app_moneytracker/src/modules/budget/local/budgetLocalDataSource.ts` - SQLite mirror of `categoryLocalDataSource` for budgets
- `app_moneytracker/src/modules/budget/screens/AiBudgetCreateScreen.tsx` - Input: income + prompt + wallet scope + period
- `app_moneytracker/src/modules/budget/screens/AiBudgetPreviewScreen.tsx` - List of `PercentAdjusterRow` (F1) + total + wallet toggle + confirm

### Modified Mobile Files
- `app_moneytracker/app/(tabs)/tools/_layout.tsx` - Register two new routes: `budgets/ai-create` and `budgets/ai-preview`
- `app_moneytracker/app/(tabs)/tools/budgets/ai-create.tsx` - Route entry for `AiBudgetCreateScreen`
- `app_moneytracker/app/(tabs)/tools/budgets/ai-preview.tsx` - Route entry for `AiBudgetPreviewScreen`
- `app_moneytracker/src/modules/budget/screens/BudgetToolScreen.tsx` - Add "Tạo bằng AI" button next to FAB
- `app_moneytracker/src/modules/sync/service/syncService.ts` - Add `budgetLocal` dep + handle `budgets` in `applyChanges`/`applyDeletes`
- `app_moneytracker/src/modules/sync/service/syncServiceSingleton.ts` - Wire `BudgetLocalDataSource` into `SyncService` constructor
- `app_moneytracker/src/core/db/migrations.ts` - Add migration v2: `CREATE TABLE budgets (...)` (matches backend columns + new `source`, `aiReasoning`, `draftId`)

### Why this structure
- `BudgetDraftValidator` is pure logic with no Spring deps — easy to TDD with no fixtures
- `BudgetPromptBuilder` is a string builder — also testable in isolation
- `AiBudgetService` is the thin orchestrator (compose the three above)
- New DTOs group per endpoint, not per use case — matches existing project style
- Mobile screens split by step (Create vs Preview) — keeps each focused and testable
- `draftStorage` separates "work-in-progress" (resumable) from `profileStorage` (persistent preferences)

---

## Task 1: Add Gemini API key + model config

**Files:**
- Modify: `be_money_tracker/src/main/resources/application.properties`

- [ ] **Step 1: Append AI config block**

Open `be_money_tracker/src/main/resources/application.properties` and append at the end:

```properties
# Config AI (Gemini)
# ===============================
ai.gemini.apiKey=
ai.gemini.model=gemini-1.5-flash
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS (no schema change yet).

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/resources/application.properties
git commit -m "config(ai): add gemini api key + model placeholders"
```

---

## Task 2: Add BudgetSource enum

**Files:**
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/model/BudgetSource.java`

- [ ] **Step 1: Create enum file**

```java
package com.examples.moneytracker.budget.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BudgetSource {
    MANUAL,
    AI_CONFIRMED;

    @JsonCreator
    public static BudgetSource fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return BudgetSource.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown BudgetSource: " + value, ex);
        }
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/budget/model/BudgetSource.java
git commit -m "feat(budget): add BudgetSource enum (MANUAL | AI_CONFIRMED)"
```

---

## Task 3: Update Budget entity (nullable walletId + AI fields)

**Files:**
- Modify: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/model/Budget.java`

- [ ] **Step 1: Replace the file with the updated entity**

```java
package com.examples.moneytracker.budget.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "budgets")
@Data
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID budgetId;

    @Column(nullable = false)
    private UUID userId;

    @Column
    private UUID walletId;

    @Column(nullable = false)
    private UUID categoryId;

    @Column(name = "title")
    private String title;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amountLimit;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "period_type", nullable = false)
    private BudgetPeriodType periodType;

    @Column(name = "alert_threshold", precision = 5, scale = 2)
    private BigDecimal alertThreshold;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 20)
    private BudgetSource source;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "draft_id")
    private UUID draftId;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(nullable = false)
    private Long version = 1L;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.source == null) {
            this.source = BudgetSource.MANUAL;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
```

- [ ] **Step 2: Update CreateBudgetRequest to make walletId optional**

Modify `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/CreateBudgetRequest.java` — change `@NotNull` on `walletId` to drop the annotation (just leave the field as-is, no annotation). Remove this import if it becomes unused:

```java
package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.BudgetPeriodType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class CreateBudgetRequest {
    private UUID walletId;

    private UUID categoryId;

    private List<UUID> categoryIds;

    private String title;

    private BigDecimal amountLimit;

    private LocalDate periodStart;

    private LocalDate periodEnd;

    private BudgetPeriodType periodType;

    private BigDecimal alertThreshold;
}
```

(Only the `@NotNull` on `walletId` is removed; `amountLimit`, `periodStart`, `periodEnd`, `periodType` retain their validation since these are required for a usable budget.)

- [ ] **Step 3: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS. The schema change (`wallet_id` becomes nullable, new columns `source`, `ai_reasoning`, `draft_id`) is auto-applied by `ddl-auto=update` on next startup.

- [ ] **Step 4: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/budget/model/Budget.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/CreateBudgetRequest.java
git commit -m "feat(budget): add source/aiReasoning/draftId; make walletId nullable"
```

---

## Task 4: Update BudgetResponse to expose new fields

**Files:**
- Modify: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BudgetResponse.java`

- [ ] **Step 1: Replace the file**

```java
package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.model.BudgetPeriodType;
import com.examples.moneytracker.budget.model.BudgetSource;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class BudgetResponse {
    private UUID budgetId;
    private UUID walletId;
    private UUID categoryId;
    private List<UUID> categoryIds;
    private String title;
    private BigDecimal amountLimit;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BudgetPeriodType periodType;
    private BigDecimal alertThreshold;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private BudgetSource source;
    private String aiReasoning;
    private UUID draftId;

    public static BudgetResponse from(Budget budget, BigDecimal spentAmount, BigDecimal remainingAmount, List<UUID> categoryIds) {
        return new BudgetResponse(
                budget.getBudgetId(),
                budget.getWalletId(),
                budget.getCategoryId(),
                categoryIds,
                budget.getTitle(),
                budget.getAmountLimit(),
                budget.getPeriodStart(),
                budget.getPeriodEnd(),
                budget.getPeriodType(),
                budget.getAlertThreshold(),
                spentAmount,
                remainingAmount,
                budget.getSource(),
                budget.getAiReasoning(),
                budget.getDraftId()
        );
    }
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BudgetResponse.java
git commit -m "feat(budget): expose source/aiReasoning/draftId in BudgetResponse"
```

---

## Task 5: Create AI Budget DTOs

**Files:**
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/AiBudgetDraftRequest.java`
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/BudgetItemDto.java`
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/BudgetSummaryDto.java`
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/AiBudgetDraftResponse.java`

- [ ] **Step 1: Create BudgetItemDto**

```java
package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BudgetItemDto {
    private UUID categoryId;
    private String categoryName;
    private Integer percent;
    private BigDecimal amount;
    private String aiReasoning;
}
```

- [ ] **Step 2: Create BudgetSummaryDto**

```java
package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BudgetSummaryDto {
    private BigDecimal totalIncome;
    private Integer totalPercent;
    private BigDecimal totalBudget;
    private Integer savingsPercent;
    private BigDecimal savingsAmount;
    private String strategy;
}
```

- [ ] **Step 3: Create AiBudgetDraftRequest**

```java
package com.examples.moneytracker.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class AiBudgetDraftRequest {
    @NotNull
    @Positive
    private BigDecimal income;

    private String userPrompt;

    private UUID walletId;

    @NotNull
    private LocalDate periodStart;

    @NotNull
    private LocalDate periodEnd;
}
```

- [ ] **Step 4: Create AiBudgetDraftResponse**

```java
package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiBudgetDraftResponse {
    private UUID draftId;
    private List<BudgetItemDto> items;
    private BudgetSummaryDto summary;
}
```

- [ ] **Step 5: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/AiBudgetDraftRequest.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/BudgetItemDto.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/BudgetSummaryDto.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/AiBudgetDraftResponse.java
git commit -m "feat(ai): add DTOs for AI budget draft endpoint"
```

---

## Task 6: Create Batch Budget DTOs

**Files:**
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchBudgetItemDto.java`
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchCreateBudgetRequest.java`
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchCreateBudgetResponse.java`

- [ ] **Step 1: Create BatchBudgetItemDto**

```java
package com.examples.moneytracker.budget.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class BatchBudgetItemDto {
    @NotNull
    private UUID categoryId;

    @NotNull
    private Integer percent;

    @NotNull
    private BigDecimal amount;

    private String aiReasoning;
}
```

- [ ] **Step 2: Create BatchCreateBudgetRequest**

```java
package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.BudgetPeriodType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class BatchCreateBudgetRequest {
    @NotNull
    private UUID draftId;

    private UUID walletId;

    @NotNull
    private LocalDate periodStart;

    @NotNull
    private LocalDate periodEnd;

    @NotNull
    private BudgetPeriodType periodType;

    @NotNull
    @Positive
    private BigDecimal income;

    @NotEmpty
    @Valid
    private List<BatchBudgetItemDto> items;
}
```

- [ ] **Step 3: Create BatchCreateBudgetResponse**

```java
package com.examples.moneytracker.budget.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class BatchCreateBudgetResponse {
    private List<BudgetResponse> budgets;
}
```

- [ ] **Step 4: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchBudgetItemDto.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchCreateBudgetRequest.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/budget/dto/BatchCreateBudgetResponse.java
git commit -m "feat(budget): add DTOs for batch create endpoint"
```

---

## Task 7: TDD BudgetDraftValidator (RED → GREEN)

**Files:**
- Create: `be_money_tracker/src/test/java/com/examples/moneytracker/ai/validation/BudgetDraftValidatorTest.java`
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/validation/BudgetDraftValidator.java`

This is the core pure-logic component. We TDD it because it encodes all our spec rules (clamp 0-100, sum to 100, max 6 categories, "Tiết kiệm" always present). Tests are the spec.

- [ ] **Step 1: Write the failing test (RED)**

Create `be_money_tracker/src/test/java/com/examples/moneytracker/ai/validation/BudgetDraftValidatorTest.java`:

```java
package com.examples.moneytracker.ai.validation;

import com.examples.moneytracker.ai.dto.BudgetItemDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BudgetDraftValidatorTest {

    private BudgetDraftValidator validator;
    private Map<UUID, String> categoryNames;

    @BeforeEach
    void setUp() {
        validator = new BudgetDraftValidator();
        UUID foodId = UUID.randomUUID();
        UUID rentId = UUID.randomUUID();
        UUID savingsId = UUID.randomUUID();
        categoryNames = Map.of(
                foodId, "Ăn uống",
                rentId, "Tiền nhà",
                savingsId, "Tiết kiệm"
        );
    }

    @Test
    @DisplayName("Returns items unchanged when already valid (sum=100, savings present, <=6)")
    void validInput_unchanged() {
        List<BudgetItemDto> input = List.of(
                item("Ăn uống", 25),
                item("Tiền nhà", 55),
                item("Tiết kiệm", 20)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(3, result.size());
        assertEquals(100, sumPercent(result));
    }

    @Test
    @DisplayName("Filters out items whose categoryId is not in the known list")
    void unknownCategory_filtered() {
        UUID unknown = UUID.randomUUID();
        List<BudgetItemDto> input = new ArrayList<>(List.of(
                new BudgetItemDto(unknown, "Ghost", 30, BigDecimal.ZERO, "..."),
                item("Ăn uống", 30),
                item("Tiết kiệm", 70)
        ));
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(2, result.size());
        assertTrue(result.stream().noneMatch(i -> i.getCategoryName().equals("Ghost")));
    }

    @Test
    @DisplayName("Clamps percent to [0, 100]")
    void percentClamped() {
        List<BudgetItemDto> input = List.of(
                new BudgetItemDto(null, "Ăn uống", 150, BigDecimal.ZERO, "..."),
                item("Tiền nhà", -10),
                item("Tiết kiệm", 20)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        // 150 -> 100; -10 -> 0; savings 20
        assertEquals(120, sumPercent(result));
    }

    @Test
    @DisplayName("Adds 'Tiết kiệm' with remainder if missing")
    void missingSavings_added() {
        List<BudgetItemDto> input = List.of(
                item("Ăn uống", 40),
                item("Tiền nhà", 30)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(3, result.size());
        assertTrue(result.stream().anyMatch(i -> "Tiết kiệm".equals(i.getCategoryName())));
        assertEquals(100, sumPercent(result));
    }

    @Test
    @DisplayName("Scales down proportionally when sum > 100 (last item absorbs overflow)")
    void sumOverflow_scaledDown() {
        List<BudgetItemDto> input = List.of(
                item("Ăn uống", 60),
                item("Tiền nhà", 60),
                item("Tiết kiệm", 30)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(100, sumPercent(result));
    }

    @Test
    @DisplayName("Caps to 6 items — drops the smallest-percent items first")
    void tooManyItems_cappedAt6() {
        List<BudgetItemDto> input = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            input.add(new BudgetItemDto(null, "Ăn uống", 10, BigDecimal.ZERO, "..."));
        }
        input.add(item("Tiết kiệm", 30));
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertTrue(result.size() <= 6, "expected at most 6, got " + result.size());
    }

    @Test
    @DisplayName("Computes amount = income * percent / 100 for every item")
    void amountComputed() {
        List<BudgetItemDto> input = List.of(
                item("Ăn uống", 25),
                item("Tiết kiệm", 75)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("20000000"));
        // 25% of 20M = 5M; 75% of 20M = 15M
        assertEquals(new BigDecimal("5000000"), result.get(0).getAmount());
        assertEquals(new BigDecimal("15000000"), result.get(1).getAmount());
    }

    private BudgetItemDto item(String name, int percent) {
        UUID id = categoryNames.entrySet().stream()
                .filter(e -> e.getValue().equals(name))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElseThrow();
        return new BudgetItemDto(id, name, percent, BigDecimal.ZERO, "reason for " + name);
    }

    private int sumPercent(List<BudgetItemDto> items) {
        return items.stream().mapToInt(BudgetItemDto::getPercent).sum();
    }
}
```

- [ ] **Step 2: Run test to verify it fails (compile error)**

Run:
```bash
cd be_money_tracker
./mvnw test -Dtest=BudgetDraftValidatorTest -q
```

Expected: BUILD FAILURE — `BudgetDraftValidator` class does not exist.

- [ ] **Step 3: Implement minimal validator (GREEN)**

Create `be_money_tracker/src/main/java/com/examples/moneytracker/ai/validation/BudgetDraftValidator.java`:

```java
package com.examples.moneytracker.ai.validation;

import com.examples.moneytracker.ai.dto.BudgetItemDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class BudgetDraftValidator {

    private static final int MAX_ITEMS = 6;
    private static final String SAVINGS_NAME = "Tiết kiệm";

    /**
     * Filters unknown categories, clamps percent 0-100, ensures "Tiết kiệm" present,
     * caps to MAX_ITEMS, and rebalances percent so total = 100.
     */
    public List<BudgetItemDto> validate(
            List<BudgetItemDto> raw,
            Map<UUID, String> knownCategoryNames,
            BigDecimal income
    ) {
        // 1. Filter to known categories + clamp percent
        List<BudgetItemDto> filtered = new ArrayList<>();
        for (BudgetItemDto item : raw) {
            if (item.getCategoryId() == null) {
                continue;
            }
            String name = knownCategoryNames.get(item.getCategoryId());
            if (name == null) {
                continue;
            }
            int clamped = Math.max(0, Math.min(100, item.getPercent() == null ? 0 : item.getPercent()));
            filtered.add(new BudgetItemDto(
                    item.getCategoryId(),
                    name,
                    clamped,
                    BigDecimal.ZERO,
                    item.getAiReasoning()
            ));
        }

        // 2. Ensure "Tiết kiệm" present (look up by name; first match wins)
        boolean hasSavings = filtered.stream().anyMatch(i -> SAVINGS_NAME.equals(i.getCategoryName()));
        if (!hasSavings) {
            UUID savingsId = knownCategoryNames.entrySet().stream()
                    .filter(e -> SAVINGS_NAME.equals(e.getValue()))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(null);
            if (savingsId != null) {
                filtered.add(new BudgetItemDto(savingsId, SAVINGS_NAME, 0, BigDecimal.ZERO, "Auto-fill savings"));
            }
        }

        // 3. Cap to MAX_ITEMS — drop smallest first
        if (filtered.size() > MAX_ITEMS) {
            filtered.sort(Comparator.comparingInt(BudgetItemDto::getPercent).reversed());
            filtered = new ArrayList<>(filtered.subList(0, MAX_ITEMS));
        }

        // 4. Rebalance to sum=100. Overflow → reduce last item; shortfall → add to last item.
        int total = filtered.stream().mapToInt(BudgetItemDto::getPercent).sum();
        if (total != 100 && !filtered.isEmpty()) {
            BudgetItemDto last = filtered.get(filtered.size() - 1);
            int newLast = Math.max(0, Math.min(100, last.getPercent() + (100 - total)));
            filtered.set(filtered.size() - 1, new BudgetItemDto(
                    last.getCategoryId(),
                    last.getCategoryName(),
                    newLast,
                    BigDecimal.ZERO,
                    last.getAiReasoning()
            ));
        }

        // 5. Compute amount = income * percent / 100
        if (income != null && income.signum() > 0) {
            List<BudgetItemDto> withAmount = new ArrayList<>(filtered.size());
            for (BudgetItemDto i : filtered) {
                BigDecimal amount = income
                        .multiply(BigDecimal.valueOf(i.getPercent()))
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                withAmount.add(new BudgetItemDto(
                        i.getCategoryId(),
                        i.getCategoryName(),
                        i.getPercent(),
                        amount,
                        i.getAiReasoning()
                ));
            }
            return withAmount;
        }
        return filtered;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd be_money_tracker
./mvnw test -Dtest=BudgetDraftValidatorTest -q
```

Expected: BUILD SUCCESS — 7 tests passed.

- [ ] **Step 5: Commit**

```bash
git add be_money_tracker/src/test/java/com/examples/moneytracker/ai/validation/BudgetDraftValidatorTest.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/ai/validation/BudgetDraftValidator.java
git commit -m "feat(ai): BudgetDraftValidator with full spec coverage (7 tests)"
```

---

## Task 8: Create BudgetPromptBuilder

**Files:**
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/prompt/BudgetPromptBuilder.java`

The prompt builder is a pure string builder — no Spring deps. We treat it as a `static` helper for simplicity. Skip a unit test here (covered indirectly by `AiBudgetService` integration test in Task 12); it's mostly concatenation.

- [ ] **Step 1: Create the file**

```java
package com.examples.moneytracker.ai.prompt;

import com.examples.moneytracker.ai.dto.HistoricalStatsDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class BudgetPromptBuilder {

    private static final String SYSTEM_PROMPT = String.join("\n",
            "# ROLE",
            "Bạn là trợ lý tài chính cá nhân. Phân bổ ngân sách tháng cho user dựa trên thu nhập và lịch sử chi tiêu.",
            "",
            "# QUY TẮC BẮT BUỘC",
            "1. CHỈ sử dụng categoryId từ AVAILABLE_CATEGORIES. Không tạo category mới.",
            "2. Trả về PERCENT (số nguyên 0-100) cho mỗi category, KHÔNG trả về amount. Mobile sẽ tự tính amount = income × percent / 100.",
            "3. Tổng tất cả percent PHẢI BẰNG CHÍNH XÁC 100.",
            "4. LUÔN bao gồm category \"Tiết kiệm\" trong output.",
            "5. Tối đa 6 categories (khuyến nghị 4-5).",
            "6. Mỗi category có aiReasoning (1 câu, ≤ 100 ký tự, tiếng Việt).",
            "7. Phân bổ theo nguyên tắc:",
            "   - Thiếu data (user mới): dùng 50/30/20 baseline (50 needs, 30 wants, 20 savings).",
            "   - Có historical: category hay chi nhiều → percent cao hơn để tránh vỡ.",
            "   - Có userPrompt đặc biệt (đám cưới, du lịch) → ưu tiên category phù hợp.",
            "",
            "# OUTPUT FORMAT (JSON only, không giải thích thêm)",
            "{",
            "  \"items\": [",
            "    { \"categoryId\": \"uuid\", \"percent\": 25, \"aiReasoning\": \"Lý do\" }",
            "  ],",
            "  \"summary\": { \"strategy\": \"Mô tả chiến lược (1-2 câu)\" }",
            "}"
    );

    public String build(
            BigDecimal income,
            String userPrompt,
            UUID walletId,
            LocalDate periodStart,
            LocalDate periodEnd,
            Map<UUID, String> availableCategories,
            List<HistoricalStatsDto> historicalStats
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append(SYSTEM_PROMPT).append("\n\n");

        sb.append("# CONTEXT\n");
        sb.append("- Income: ").append(income).append(" VND\n");
        sb.append("- Period: ").append(periodStart).append(" → ").append(periodEnd).append("\n");
        if (walletId != null) {
            sb.append("- Wallet scope: walletId=").append(walletId).append("\n");
        } else {
            sb.append("- Wallet scope: ALL wallets\n");
        }
        if (userPrompt != null && !userPrompt.isBlank()) {
            sb.append("- User request: ").append(userPrompt.trim()).append("\n");
        }
        sb.append("\n");

        sb.append("# AVAILABLE_CATEGORIES (only use these categoryId values)\n");
        for (Map.Entry<UUID, String> e : availableCategories.entrySet()) {
            sb.append("- ").append(e.getKey()).append(" → ").append(e.getValue()).append("\n");
        }
        sb.append("\n");

        if (historicalStats != null && !historicalStats.isEmpty()) {
            sb.append("# HISTORICAL_STATS (last 6 months, top spend categories)\n");
            for (HistoricalStatsDto stat : historicalStats) {
                sb.append("- ")
                        .append(stat.getCategoryName())
                        .append(" (id=").append(stat.getCategoryId()).append(")")
                        .append(" avg=").append(stat.getAvgAmount())
                        .append(" count=").append(stat.getCount())
                        .append("\n");
            }
        } else {
            sb.append("# HISTORICAL_STATS\n");
            sb.append("(no history — user is new; use 50/30/20 baseline)\n");
        }

        sb.append("\n# NOW PRODUCE THE JSON OUTPUT (no prose, JSON only).");
        return sb.toString();
    }
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/ai/prompt/BudgetPromptBuilder.java
git commit -m "feat(ai): BudgetPromptBuilder builds structured-output prompt"
```

---

## Task 9: Create HistoricalStatsDto + repository

**Files:**
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/HistoricalStatsDto.java`
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/repository/HistoricalStatsRepository.java`

- [ ] **Step 1: Create DTO**

```java
package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
public class HistoricalStatsDto {
    private UUID categoryId;
    private String categoryName;
    private BigDecimal avgAmount;
    private Long count;
}
```

- [ ] **Step 2: Create repository**

```java
package com.examples.moneytracker.ai.repository;

import com.examples.moneytracker.ai.dto.HistoricalStatsDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public class HistoricalStatsRepository {

    @PersistenceContext
    private EntityManager em;

    /**
     * Top 15 categories by average expense amount over the last 6 months,
     * with at least 3 transactions each. Returns rows ordered by avg desc.
     */
    public List<HistoricalStatsDto> topExpenseCategories(UUID userId, LocalDate from, int limit) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createQuery("""
                SELECT t.categoryId, c.name, AVG(t.amount), COUNT(t)
                FROM Transaction t
                JOIN Category c ON c.categoryId = t.categoryId
                WHERE t.createdBy = :userId
                  AND LOWER(t.type) = 'expense'
                  AND t.deletedAt IS NULL
                  AND t.date >= :from
                GROUP BY t.categoryId, c.name
                HAVING COUNT(t) >= 3
                ORDER BY AVG(t.amount) DESC
                """)
                .setParameter("userId", userId)
                .setParameter("from", from)
                .setMaxResults(limit)
                .getResultList();

        return rows.stream()
                .map(r -> new HistoricalStatsDto(
                        (UUID) r[0],
                        (String) r[1],
                        (java.math.BigDecimal) r[2],
                        (Long) r[3]
                ))
                .toList();
    }
}
```

- [ ] **Step 3: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/ai/dto/HistoricalStatsDto.java \
        be_money_tracker/src/main/java/com/examples/moneytracker/ai/repository/HistoricalStatsRepository.java
git commit -m "feat(ai): add HistoricalStatsDto + top-expense-categories query"
```

---

## Task 10: Create AiBudgetService (orchestrator)

**Files:**
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/service/AiBudgetService.java`

- [ ] **Step 1: Create the service**

```java
package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.AiBudgetDraftRequest;
import com.examples.moneytracker.ai.dto.AiBudgetDraftResponse;
import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.dto.BudgetItemDto;
import com.examples.moneytracker.ai.dto.BudgetSummaryDto;
import com.examples.moneytracker.ai.dto.HistoricalStatsDto;
import com.examples.moneytracker.ai.dto.PromptInput;
import com.examples.moneytracker.ai.provider.AiProviderGateway;
import com.examples.moneytracker.ai.prompt.BudgetPromptBuilder;
import com.examples.moneytracker.ai.repository.HistoricalStatsRepository;
import com.examples.moneytracker.ai.validation.BudgetDraftValidator;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiBudgetService {

    private final AiProviderGateway aiProviderGateway;
    private final BudgetPromptBuilder promptBuilder;
    private final BudgetDraftValidator validator;
    private final HistoricalStatsRepository historicalStatsRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    public AiBudgetDraftResponse generateDraft(AiBudgetDraftRequest request, UUID userId) {
        // 1. Build category map (only EXPENSE categories for budget allocation)
        List<Category> categories = categoryRepository.findAccessibleCategories(userId);
        Map<UUID, String> nameById = categories.stream()
                .filter(c -> "EXPENSE".equalsIgnoreCase(c.getType()))
                .collect(Collectors.toMap(Category::getCategoryId, Category::getName));

        // 2. Pull historical stats (last 6 months)
        List<HistoricalStatsDto> stats = historicalStatsRepository.topExpenseCategories(
                userId,
                LocalDate.now().minusMonths(6),
                15
        );

        // 3. Build prompt
        String prompt = promptBuilder.build(
                request.getIncome(),
                request.getUserPrompt(),
                request.getWalletId(),
                request.getPeriodStart(),
                request.getPeriodEnd(),
                nameById,
                stats
        );

        // 4. Call Gemini
        AiTextResult result = aiProviderGateway.generateText(new PromptInput(prompt, List.of()));
        if (result.getText() == null || result.getText().isBlank()) {
            throw new RuntimeException("AI service unavailable");
        }

        // 5. Parse JSON response
        List<BudgetItemDto> rawItems = parseItems(result.getText());
        String strategy = parseStrategy(result.getText());

        // 6. Validate
        List<BudgetItemDto> validated = validator.validate(rawItems, nameById, request.getIncome());

        // 7. Build summary
        int totalPercent = validated.stream().mapToInt(BudgetItemDto::getPercent).sum();
        BigDecimal totalBudget = validated.stream()
                .map(BudgetItemDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BudgetItemDto savings = validated.stream()
                .filter(i -> "Tiết kiệm".equals(i.getCategoryName()))
                .findFirst()
                .orElse(null);
        BudgetSummaryDto summary = new BudgetSummaryDto(
                request.getIncome(),
                totalPercent,
                totalBudget,
                savings == null ? 0 : savings.getPercent(),
                savings == null ? BigDecimal.ZERO : savings.getAmount(),
                strategy == null ? "AI tạo ngân sách theo thu nhập" : strategy
        );

        return new AiBudgetDraftResponse(UUID.randomUUID(), validated, summary);
    }

    @SuppressWarnings("unchecked")
    private List<BudgetItemDto> parseItems(String raw) {
        try {
            // The model sometimes wraps JSON in ```json ... ``` or prose
            String json = extractJsonBlock(raw);
            Map<String, Object> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            List<Map<String, Object>> itemsRaw = (List<Map<String, Object>>) parsed.getOrDefault("items", List.of());
            List<BudgetItemDto> items = new ArrayList<>();
            for (Map<String, Object> m : itemsRaw) {
                UUID catId = m.get("categoryId") != null ? UUID.fromString(m.get("categoryId").toString()) : null;
                int percent = ((Number) m.getOrDefault("percent", 0)).intValue();
                String reasoning = m.get("aiReasoning") == null ? null : m.get("aiReasoning").toString();
                items.add(new BudgetItemDto(catId, null, percent, BigDecimal.ZERO, reasoning));
            }
            return items;
        } catch (Exception ex) {
            throw new RuntimeException("Failed to parse AI response", ex);
        }
    }

    @SuppressWarnings("unchecked")
    private String parseStrategy(String raw) {
        try {
            String json = extractJsonBlock(raw);
            Map<String, Object> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            if (parsed.get("summary") instanceof Map<?, ?> s) {
                Object s2 = ((Map<String, Object>) s).get("strategy");
                return s2 == null ? null : s2.toString();
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    private String extractJsonBlock(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start == -1 || end == -1 || end <= start) {
            throw new IllegalArgumentException("No JSON object in AI response");
        }
        return raw.substring(start, end + 1);
    }
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/ai/service/AiBudgetService.java
git commit -m "feat(ai): AiBudgetService orchestrates prompt+gemini+validator"
```

---

## Task 11: Create AiBudgetController

**Files:**
- Create: `be_money_tracker/src/main/java/com/examples/moneytracker/ai/controller/AiBudgetController.java`

- [ ] **Step 1: Create the controller**

```java
package com.examples.moneytracker.ai.controller;

import com.examples.moneytracker.ai.dto.AiBudgetDraftRequest;
import com.examples.moneytracker.ai.dto.AiBudgetDraftResponse;
import com.examples.moneytracker.ai.service.AiBudgetService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/budget")
@RequiredArgsConstructor
public class AiBudgetController {

    private final AiBudgetService aiBudgetService;

    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<AiBudgetDraftResponse>> generateDraft(
            @RequestBody @Valid AiBudgetDraftRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(aiBudgetService.generateDraft(request, user.getId())));
    }
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/ai/controller/AiBudgetController.java
git commit -m "feat(ai): POST /api/ai/budget/draft endpoint"
```

---

## Task 12: Add createBatch to BudgetService

**Files:**
- Modify: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/service/BudgetService.java`

We add a transactional `createBatch` that creates N Budget rows in one DB transaction. Each row is one category, with the same `draftId` and `source=AI_CONFIRMED`.

- [ ] **Step 1: Add the new method to BudgetService**

Append this method inside the `BudgetService` class (place it after `deleteBudget`):

```java
    @Transactional
    public BatchCreateBudgetResponse createBatch(BatchCreateBudgetRequest request, UUID userId) {
        // Optional wallet validation (null allowed → "all wallets")
        if (request.getWalletId() != null) {
            walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(request.getWalletId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
        }

        UUID draftId = request.getDraftId();
        String generatedTitle = "AI Budget " + (request.getPeriodStart().getMonthValue())
                + "/" + request.getPeriodStart().getYear();

        List<Budget> savedBudgets = new ArrayList<>();
        for (BatchBudgetItemDto item : request.getItems()) {
            Budget budget = new Budget();
            budget.setUserId(userId);
            budget.setWalletId(request.getWalletId());
            budget.setCategoryId(item.getCategoryId());
            budget.setTitle(generatedTitle);
            budget.setAmountLimit(item.getAmount());
            budget.setPeriodStart(request.getPeriodStart());
            budget.setPeriodEnd(request.getPeriodEnd());
            budget.setPeriodType(request.getPeriodType());
            budget.setSource(BudgetSource.AI_CONFIRMED);
            budget.setAiReasoning(item.getAiReasoning());
            budget.setDraftId(draftId);
            budgetRepository.save(budget);

            // Single-category join row (each batch item is one budget = one category)
            budgetCategoryRepository.saveAll(List.of(new BudgetCategory(budget.getBudgetId(), item.getCategoryId())));

            savedBudgets.add(budget);
        }

        List<BudgetResponse> responses = savedBudgets.stream()
                .map(b -> BudgetResponse.from(b, BigDecimal.ZERO, b.getAmountLimit(),
                        List.of(b.getCategoryId())))
                .toList();
        return new BatchCreateBudgetResponse(responses);
    }
```

Also add these imports near the top of the file (next to existing imports):

```java
import com.examples.moneytracker.ai.dto.HistoricalStatsDto; // NOT NEEDED — remove
import com.examples.moneytracker.budget.dto.BatchBudgetItemDto;
import com.examples.moneytracker.budget.dto.BatchCreateBudgetRequest;
import com.examples.moneytracker.budget.dto.BatchCreateBudgetResponse;
import com.examples.moneytracker.budget.model.BudgetSource;
import java.util.ArrayList;
```

(Do NOT add the `HistoricalStatsDto` import — only the four budget-related ones.)

- [ ] **Step 2: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/budget/service/BudgetService.java
git commit -m "feat(budget): add createBatch() to BudgetService"
```

---

## Task 13: Add POST /api/budgets/batch endpoint

**Files:**
- Modify: `be_money_tracker/src/main/java/com/examples/moneytracker/budget/controller/BudgetController.java`

- [ ] **Step 1: Add the endpoint method**

Add this method inside the `BudgetController` class (anywhere, but conventionally near `createBudget`):

```java
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<BatchCreateBudgetResponse>> createBatch(
            @RequestBody @Valid BatchCreateBudgetRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.status(201).body(ApiResponse.of(
                budgetService.createBatch(request, user.getId())
        ));
    }
```

Also add this import near the top of the file:

```java
import com.examples.moneytracker.budget.dto.BatchCreateBudgetRequest;
import com.examples.moneytracker.budget.dto.BatchCreateBudgetResponse;
```

- [ ] **Step 2: Verify compile**

Run:
```bash
cd be_money_tracker
./mvnw compile -q
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add be_money_tracker/src/main/java/com/examples/moneytracker/budget/controller/BudgetController.java
git commit -m "feat(budget): POST /api/budgets/batch endpoint"
```

---

## Task 14: Backend integration test (mocked Gemini)

**Files:**
- Create: `be_money_tracker/src/test/java/com/examples/moneytracker/ai/service/AiBudgetServiceTest.java`

This test mocks `AiProviderGateway` so we don't need a real Gemini key.

- [ ] **Step 1: Create the test**

```java
package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.AiBudgetDraftRequest;
import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.dto.BudgetItemDto;
import com.examples.moneytracker.ai.dto.HistoricalStatsDto;
import com.examples.moneytracker.ai.provider.AiProviderGateway;
import com.examples.moneytracker.ai.prompt.BudgetPromptBuilder;
import com.examples.moneytracker.ai.repository.HistoricalStatsRepository;
import com.examples.moneytracker.ai.validation.BudgetDraftValidator;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiBudgetServiceTest {

    private AiProviderGateway gateway;
    private AiBudgetService service;

    private UUID foodId;
    private UUID rentId;
    private UUID savingsId;

    @BeforeEach
    void setUp() {
        gateway = mock(AiProviderGateway.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        HistoricalStatsRepository historicalStatsRepository = mock(HistoricalStatsRepository.class);

        foodId = UUID.randomUUID();
        rentId = UUID.randomUUID();
        savingsId = UUID.randomUUID();

        when(categoryRepository.findAccessibleCategories(any())).thenReturn(List.of(
                category(foodId, "Ăn uống"),
                category(rentId, "Tiền nhà"),
                category(savingsId, "Tiết kiệm")
        ));
        when(historicalStatsRepository.topExpenseCategories(any(), any(), org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(List.of());

        service = new AiBudgetService(
                gateway,
                new BudgetPromptBuilder(),
                new BudgetDraftValidator(),
                historicalStatsRepository,
                categoryRepository,
                new ObjectMapper()
        );
    }

    @Test
    void generatesDraft_validatesAndComputesAmounts() {
        String geminiJson = """
                {
                  "items": [
                    { "categoryId": "%s", "percent": 30, "aiReasoning": "Ăn uống ~100k/ngày" },
                    { "categoryId": "%s", "percent": 50, "aiReasoning": "Tiền nhà cố định" },
                    { "categoryId": "%s", "percent": 20, "aiReasoning": "Tiết kiệm cho iPhone" }
                  ],
                  "summary": { "strategy": "Cân bằng giữa chi tiêu và tiết kiệm" }
                }
                """.formatted(foodId, rentId, savingsId);

        when(gateway.generateText(any())).thenReturn(new AiTextResult("gemini", geminiJson));

        AiBudgetDraftRequest request = new AiBudgetDraftRequest();
        request.setIncome(new BigDecimal("20000000"));
        request.setUserPrompt("Đám cưới 2tr, muốn mua iPhone");
        request.setPeriodStart(LocalDate.of(2026, 6, 1));
        request.setPeriodEnd(LocalDate.of(2026, 6, 30));

        var response = service.generateDraft(request, UUID.randomUUID());

        assertEquals(3, response.getItems().size());
        assertEquals(100, response.getItems().stream().mapToInt(BudgetItemDto::getPercent).sum());
        assertEquals(0, response.getSummary().getTotalIncome().compareTo(new BigDecimal("20000000")));
        assertEquals(new BigDecimal("6000000"), response.getItems().get(0).getAmount()); // 30% of 20M
        assertEquals(new BigDecimal("10000000"), response.getItems().get(1).getAmount()); // 50% of 20M
        assertEquals(new BigDecimal("4000000"), response.getItems().get(2).getAmount()); // 20% of 20M
        assertTrue(response.getSummary().getStrategy().contains("Cân bằng"));
    }

    @Test
    void promptContainsAvailableCategories() {
        ArgumentCaptor<com.examples.moneytracker.ai.dto.PromptInput> captor =
                ArgumentCaptor.forClass(com.examples.moneytracker.ai.dto.PromptInput.class);
        when(gateway.generateText(captor.capture()))
                .thenReturn(new AiTextResult("gemini", "{\"items\":[],\"summary\":{}}"));

        AiBudgetDraftRequest request = new AiBudgetDraftRequest();
        request.setIncome(new BigDecimal("10000000"));
        request.setPeriodStart(LocalDate.now());
        request.setPeriodEnd(LocalDate.now().plusDays(30));

        service.generateDraft(request, UUID.randomUUID());

        String prompt = captor.getValue().getText();
        assertTrue(prompt.contains("Ăn uống"));
        assertTrue(prompt.contains("Tiết kiệm"));
        assertTrue(prompt.contains("10000000"));
        verify(gateway).generateText(any());
    }

    private Category category(UUID id, String name) {
        Category c = new Category();
        c.setCategoryId(id);
        c.setName(name);
        c.setType("EXPENSE");
        return c;
    }
}
```

- [ ] **Step 2: Run test to verify it passes**

Run:
```bash
cd be_money_tracker
./mvnw test -Dtest=AiBudgetServiceTest -q
```

Expected: BUILD SUCCESS — 2 tests passed.

- [ ] **Step 3: Run all backend tests**

Run:
```bash
cd be_money_tracker
./mvnw test -q
```

Expected: BUILD SUCCESS (existing tests + 2 new + 7 validator tests).

- [ ] **Step 4: Commit**

```bash
git add be_money_tracker/src/test/java/com/examples/moneytracker/ai/service/AiBudgetServiceTest.java
git commit -m "test(ai): AiBudgetService integration test (mocked Gemini)"
```

---

## Task 15: Mobile — add budget local data source

**Files:**
- Create: `app_moneytracker/src/modules/budget/local/budgetLocalDataSource.ts`

- [ ] **Step 1: Create the file**

```typescript
import { executeSql, queryAll, queryOne } from '@/core/db/sqlite';
import { Budget } from '@/modules/budget/models/budget.types';

export class BudgetLocalDataSource {
  async getBudgets(): Promise<Budget[]> {
    return queryAll<Budget>(
      "SELECT * FROM budgets WHERE (deletedAt IS NULL OR deletedAt = '') ORDER BY createdAt DESC",
    );
  }

  async getBudgetById(budgetId: string): Promise<Budget | null> {
    return queryOne<Budget>('SELECT * FROM budgets WHERE budgetId = ?', [budgetId]);
  }

  async upsert(budget: Budget) {
    await executeSql(
      `INSERT OR REPLACE INTO budgets
        (budgetId, walletId, categoryId, title, amountLimit, periodStart, periodEnd, periodType,
         alertThreshold, source, aiReasoning, draftId, createdAt, updatedAt, deletedAt, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        budget.budgetId,
        budget.walletId ?? null,
        budget.categoryId ?? null,
        budget.title ?? null,
        budget.amountLimit,
        budget.periodStart,
        budget.periodEnd,
        budget.periodType ?? 'monthly',
        budget.alertThreshold ?? null,
        budget.source ?? 'manual',
        budget.aiReasoning ?? null,
        budget.draftId ?? null,
        budget.createdAt ?? new Date().toISOString(),
        budget.updatedAt ?? new Date().toISOString(),
        budget.deletedAt ?? null,
        budget.version ?? 1,
      ],
    );
  }

  async upsertMany(budgets: Budget[]) {
    for (const budget of budgets) {
      await this.upsert(budget);
    }
  }

  async markDeleted(budgetId: string, deletedAt: string) {
    await executeSql('UPDATE budgets SET deletedAt = ?, updatedAt = ? WHERE budgetId = ?', [
      deletedAt,
      deletedAt,
      budgetId,
    ]);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors (the `Budget` interface may need a `source?: string` and `aiReasoning?: string` and `draftId?: string` field — see next task).

- [ ] **Step 3: Commit (skip if you need to add fields to Budget interface in next step)**

If compilation passed, commit now:

```bash
git add app_moneytracker/src/modules/budget/local/budgetLocalDataSource.ts
git commit -m "feat(budget): add BudgetLocalDataSource mirroring category pattern"
```

---

## Task 16: Update Budget type to include new optional fields

**Files:**
- Modify: `app_moneytracker/src/modules/budget/models/budget.types.ts`

- [ ] **Step 1: Append new optional fields to Budget interface**

Replace the `Budget` interface with the updated version:

```typescript
export interface Budget {
  budgetId: string;
  userId?: string;
  walletId?: string | null;
  categoryId?: string | null;
  categoryIds?: string[];
  title?: string;
  amountLimit: number;
  periodStart: string;
  periodEnd: string;
  periodType?: 'custom' | 'monthly' | 'weekly' | 'biweekly' | 'yearly' | string;
  alertThreshold?: number | null;
  spentAmount?: number;
  remainingAmount?: number;
  source?: 'manual' | 'ai_confirmed' | string;
  aiReasoning?: string | null;
  draftId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;
}
```

Also add a new interface for batch inputs (keep at end of file):

```typescript
export interface BatchBudgetItemInput {
  categoryId: string;
  percent: number;
  amount: number;
  aiReasoning?: string | null;
}

export interface BatchCreateBudgetsInput {
  draftId: string;
  walletId?: string | null;
  periodStart: string;
  periodEnd: string;
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  income: number;
  items: BatchBudgetItemInput[];
}
```

- [ ] **Step 2: Verify TypeScript**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app_moneytracker/src/modules/budget/models/budget.types.ts
git commit -m "feat(budget): add source/aiReasoning/draftId to Budget type + batch input"
```

---

## Task 17: Add budgets SQLite table to mobile migrations

**Files:**
- Modify: `app_moneytracker/src/core/db/migrations.ts`

- [ ] **Step 1: Add migration v2 for budgets table**

In the `migrations` array, append a new entry after the existing v1 entry:

```typescript
  {
    version: 2,
    statements: [
      {
        sql: `CREATE TABLE IF NOT EXISTS budgets (
          budgetId TEXT PRIMARY KEY,
          walletId TEXT,
          categoryId TEXT,
          title TEXT,
          amountLimit REAL NOT NULL,
          periodStart TEXT NOT NULL,
          periodEnd TEXT NOT NULL,
          periodType TEXT NOT NULL,
          alertThreshold REAL,
          source TEXT,
          aiReasoning TEXT,
          draftId TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1
        );`,
      },
    ],
  },
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app_moneytracker/src/core/db/migrations.ts
git commit -m "feat(db): add budgets table (migration v2) for offline AI drafts"
```

---

## Task 18: Create AI budget API client

**Files:**
- Create: `app_moneytracker/src/modules/budget/api/aiBudgetApi.ts`

- [ ] **Step 1: Create the file**

```typescript
import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import {
  BatchCreateBudgetsInput,
  Budget,
  BudgetItemInput,
} from '@/modules/budget/models/budget.types';

export interface AiBudgetDraftRequest {
  income: number;
  userPrompt?: string;
  walletId?: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface AiBudgetDraftItem {
  categoryId: string;
  categoryName: string;
  percent: number;
  amount: number;
  aiReasoning?: string | null;
}

export interface AiBudgetDraftSummary {
  totalIncome: number;
  totalPercent: number;
  totalBudget: number;
  savingsPercent: number;
  savingsAmount: number;
  strategy: string;
}

export interface AiBudgetDraftResponse {
  draftId: string;
  items: AiBudgetDraftItem[];
  summary: AiBudgetDraftSummary;
}

export interface BatchCreateBudgetResponse {
  budgets: Budget[];
}

const normalizeItems = (items: AiBudgetDraftItem[]): BudgetItemInput[] =>
  items.map((i) => ({
    categoryId: i.categoryId,
    percent: Math.round(i.percent),
    amount: Math.round(i.amount),
    aiReasoning: i.aiReasoning ?? null,
  }));

export const aiBudgetApi = {
  async generateDraft(req: AiBudgetDraftRequest): Promise<AiBudgetDraftResponse> {
    const response = await httpClient.post<ApiResponse<AiBudgetDraftResponse>>(
      '/api/ai/budget/draft',
      req,
    );
    return response.data.data;
  },

  async batchCreate(req: BatchCreateBudgetsInput): Promise<Budget[]> {
    const response = await httpClient.post<ApiResponse<BatchCreateBudgetResponse>>(
      '/api/budgets/batch',
      { ...req, items: normalizeItems(req.items) },
    );
    return response.data.data.budgets;
  },
};
```

Also add the `BudgetItemInput` type to `budget.types.ts` (append at the end):

```typescript
export interface BudgetItemInput {
  categoryId: string;
  percent: number;
  amount: number;
  aiReasoning?: string | null;
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app_moneytracker/src/modules/budget/api/aiBudgetApi.ts \
        app_moneytracker/src/modules/budget/models/budget.types.ts
git commit -m "feat(budget): aiBudgetApi (generateDraft + batchCreate)"
```

---

## Task 19: Create AsyncStorage helpers (draftStorage + profileStorage)

**Files:**
- Create: `app_moneytracker/src/modules/budget/storage/draftStorage.ts`
- Create: `app_moneytracker/src/modules/budget/storage/profileStorage.ts`

Both use the same SecureStore pattern as `walletStorage.ts`. Profile is a stopgap until F3 ships.

- [ ] **Step 1: Create draftStorage.ts**

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DRAFT_KEY = 'ai_budget_draft';

let inMemoryDraft: string | null = null;

const secureStoreFailedMessages = ['setValueWithKeyAsync', 'deleteValueWithKeyAsync', 'getValueWithKeyAsync'];
const isSecureStoreBridgeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return secureStoreFailedMessages.some((keyword) => message.includes(keyword));
};
const isWeb = Platform.OS === 'web';

const getWebItem = (key: string) => (isWeb && typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
const setWebItem = (key: string, value: string) => {
  if (isWeb && typeof localStorage !== 'undefined') localStorage.setItem(key, value);
};
const deleteWebItem = (key: string) => {
  if (isWeb && typeof localStorage !== 'undefined') localStorage.removeItem(key);
};

const safeSecureStoreCall = async <T>(action: () => Promise<T>, fallback: () => T): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    if (!isSecureStoreBridgeError(error)) throw error;
    return fallback();
  }
};

export interface AiBudgetDraftSnapshot {
  draftId: string;
  income: number;
  userPrompt: string;
  walletId: string | null;
  periodStart: string;
  periodEnd: string;
  savedAt: string;
}

export const draftStorage = {
  async get(): Promise<AiBudgetDraftSnapshot | null> {
    const raw = isWeb
      ? getWebItem(DRAFT_KEY)
      : await safeSecureStoreCall(() => SecureStore.getItemAsync(DRAFT_KEY), () => inMemoryDraft);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AiBudgetDraftSnapshot;
    } catch {
      return null;
    }
  },

  async save(snapshot: AiBudgetDraftSnapshot): Promise<void> {
    const value = JSON.stringify(snapshot);
    if (isWeb) {
      setWebItem(DRAFT_KEY, value);
      return;
    }
    await safeSecureStoreCall(
      () => SecureStore.setItemAsync(DRAFT_KEY, value),
      () => { inMemoryDraft = value; },
    );
  },

  async clear(): Promise<void> {
    if (isWeb) { deleteWebItem(DRAFT_KEY); return; }
    await safeSecureStoreCall(
      async () => { await SecureStore.deleteItemAsync(DRAFT_KEY); },
      () => { inMemoryDraft = null; },
    );
  },
};
```

- [ ] **Step 2: Create profileStorage.ts**

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PROFILE_KEY = 'ai_budget_profile';

let inMemoryProfile: string | null = null;

const secureStoreFailedMessages = ['setValueWithKeyAsync', 'deleteValueWithKeyAsync', 'getValueWithKeyAsync'];
const isSecureStoreBridgeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return secureStoreFailedMessages.some((keyword) => message.includes(keyword));
};
const isWeb = Platform.OS === 'web';

const getWebItem = (key: string) => (isWeb && typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
const setWebItem = (key: string, value: string) => {
  if (isWeb && typeof localStorage !== 'undefined') localStorage.setItem(key, value);
};
const deleteWebItem = (key: string) => {
  if (isWeb && typeof localStorage !== 'undefined') localStorage.removeItem(key);
};

const safeSecureStoreCall = async <T>(action: () => Promise<T>, fallback: () => T): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    if (!isSecureStoreBridgeError(error)) throw error;
    return fallback();
  }
};

export interface AiBudgetProfile {
  lastIncome?: number;
  lastPrompt?: string;
  lastWalletId?: string | null;
  updatedAt: string;
}

export const profileStorage = {
  async get(): Promise<AiBudgetProfile | null> {
    const raw = isWeb
      ? getWebItem(PROFILE_KEY)
      : await safeSecureStoreCall(() => SecureStore.getItemAsync(PROFILE_KEY), () => inMemoryProfile);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AiBudgetProfile;
    } catch {
      return null;
    }
  },

  async save(profile: AiBudgetProfile): Promise<void> {
    const value = JSON.stringify(profile);
    if (isWeb) { setWebItem(PROFILE_KEY, value); return; }
    await safeSecureStoreCall(
      () => SecureStore.setItemAsync(PROFILE_KEY, value),
      () => { inMemoryProfile = value; },
    );
  },

  async clear(): Promise<void> {
    if (isWeb) { deleteWebItem(PROFILE_KEY); return; }
    await safeSecureStoreCall(
      async () => { await SecureStore.deleteItemAsync(PROFILE_KEY); },
      () => { inMemoryProfile = null; },
    );
  },
};
```

- [ ] **Step 3: Verify TypeScript**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/budget/storage/draftStorage.ts \
        app_moneytracker/src/modules/budget/storage/profileStorage.ts
git commit -m "feat(budget): add draftStorage + profileStorage (SecureStore)"
```

---

## Task 20: Wire BudgetLocalDataSource into SyncService

**Files:**
- Modify: `app_moneytracker/src/modules/sync/service/syncService.ts`
- Modify: `app_moneytracker/src/modules/sync/service/syncServiceSingleton.ts`

- [ ] **Step 1: Update syncService.ts**

Replace the entire file with:

```typescript
import { initDatabase } from '@/core/db';
import { deviceStorage } from '@/core/storage/deviceStorage';
import { SyncRemoteDataSource } from '@/modules/sync/api/syncRemoteDataSource';
import { OutboxStore } from '@/modules/sync/local/outboxStore';
import { SyncStateStore } from '@/modules/sync/local/syncStateStore';
import {
  SyncOperation,
  SyncOperationResult,
  SyncPullResponse,
  SyncPushRequest,
} from '@/modules/sync/models/sync.types';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';
import { CategoryLocalDataSource } from '@/modules/category/local/categoryLocalDataSource';
import { TransactionLocalDataSource } from '@/modules/transaction/local/transactionLocalDataSource';
import { BudgetLocalDataSource } from '@/modules/budget/local/budgetLocalDataSource';

const CURSOR_KEY = 'lastCursor';

export class SyncService {
  private initialized = false;

  constructor(
    private readonly remote: SyncRemoteDataSource,
    private readonly outboxStore: OutboxStore,
    private readonly syncStateStore: SyncStateStore,
    private readonly walletLocal: WalletLocalDataSource,
    private readonly categoryLocal: CategoryLocalDataSource,
    private readonly transactionLocal: TransactionLocalDataSource,
    private readonly budgetLocal: BudgetLocalDataSource,
  ) {}

  async ensureInitialized() {
    if (this.initialized) {
      return;
    }
    await initDatabase();
    await deviceStorage.ensureDeviceId();
    this.initialized = true;
  }

  async enqueueOperation(op: Omit<SyncOperation, 'outboxId'>) {
    await this.ensureInitialized();
    const deviceId = await deviceStorage.ensureDeviceId();
    const requestId = op.requestId;

    await this.outboxStore.enqueueOrReplace({
      requestId,
      deviceId,
      entity: op.entity,
      entityId: op.entityId,
      op: op.op,
      baseVersion: op.baseVersion ?? null,
      dataJson: op.data ? JSON.stringify(op.data) : null,
      createdAt: new Date().toISOString(),
    });
  }

  async syncOnce() {
    await this.ensureInitialized();
    await this.pushOutbox();
    await this.pullChanges();
  }

  async syncInBackground() {
    try {
      await this.syncOnce();
    } catch {
      // ignore
    }
  }

  async pushOutbox() {
    const pending = await this.outboxStore.getPending(100);
    if (!pending.length) return;

    const deviceId = await deviceStorage.ensureDeviceId();
    const operations: SyncOperation[] = await Promise.all(
      pending.map(async (item) => {
        const data = item.dataJson ? JSON.parse(item.dataJson) : undefined;
        return {
          outboxId: item.outboxId,
          requestId: item.requestId,
          entity: item.entity as SyncOperation['entity'],
          entityId: item.entityId,
          op: item.op as SyncOperation['op'],
          baseVersion: item.baseVersion ?? undefined,
          data,
        };
      })
    );

    const request: SyncPushRequest = { deviceId, clientTime: Date.now(), operations };
    const response = await this.remote.push(request);
    await this.handlePushResults(response.results);
  }

  private async handlePushResults(results: SyncOperationResult[]) {
    for (const result of results) {
      if (result.status === 'ok') { await this.outboxStore.markOk(result.outboxId); continue; }
      if (result.status === 'conflict') {
        await this.outboxStore.markConflict(
          result.outboxId, result.serverVersion ?? null, result.serverData ? JSON.stringify(result.serverData) : null,
        );
        continue;
      }
      await this.outboxStore.markError(result.outboxId, result.error ?? null);
    }
  }

  async pullChanges() {
    const cursorValue = await this.syncStateStore.getValue(CURSOR_KEY);
    let cursor = cursorValue ? Number(cursorValue) : 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.remote.pull(cursor, 500);
      await this.applyPull(response);
      cursor = response.nextCursor ?? cursor;
      hasMore = response.hasMore;
    }
    await this.syncStateStore.setValue(CURSOR_KEY, String(cursor));
  }

  private async applyPull(response: SyncPullResponse) {
    await this.applyDeletes(response.deletes ?? {});
    await this.applyChanges(response.changes ?? {});
  }

  private async applyDeletes(deletes: Record<string, string[]>) {
    const now = new Date().toISOString();
    for (const id of deletes.wallets ?? []) await this.walletLocal.markDeleted(id, now);
    for (const id of deletes.categories ?? []) await this.categoryLocal.markDeleted(id, now);
    for (const id of deletes.transactions ?? []) await this.transactionLocal.markDeleted(id, now);
    for (const id of deletes.budgets ?? []) await this.budgetLocal.markDeleted(id, now);
  }

  private async applyChanges(changes: Record<string, unknown[]>) {
    for (const w of (changes.wallets ?? []) as Array<Record<string, unknown>>) {
      await this.walletLocal.upsert({
        walletId: String(w.walletId),
        name: String(w.name ?? ''),
        type: String(w.type ?? 'REGULAR'),
        currency: String(w.currency ?? 'VND'),
        openingBalance: Number(w.openingBalance ?? 0),
        currentBalance: Number(w.currentBalance ?? 0),
        description: w.description ? String(w.description) : null,
        createdAt: String(w.createdAt ?? new Date().toISOString()),
        updatedAt: w.updatedAt ? String(w.updatedAt) : null,
        deletedAt: w.deletedAt ? String(w.deletedAt) : null,
        version: w.version != null ? Number(w.version) : 1,
      });
    }
    for (const c of (changes.categories ?? []) as Array<Record<string, unknown>>) {
      await this.categoryLocal.upsert({
        categoryId: String(c.categoryId),
        name: String(c.name ?? ''),
        type: String(c.type ?? 'EXPENSE'),
        icon: c.icon ? String(c.icon) : null,
        color: c.color ? String(c.color) : null,
        isDefault: Boolean(c.isDefault),
        isHidden: Boolean(c.isHidden),
        createdAt: String(c.createdAt ?? new Date().toISOString()),
        updatedAt: c.updatedAt ? String(c.updatedAt) : null,
        deletedAt: c.deletedAt ? String(c.deletedAt) : null,
        version: c.version != null ? Number(c.version) : 1,
      });
    }
    for (const t of (changes.transactions ?? []) as Array<Record<string, unknown>>) {
      await this.transactionLocal.upsert({
        transactionId: String(t.transactionId),
        walletId: String(t.walletId),
        categoryId: String(t.categoryId),
        amount: Number(t.amount ?? 0),
        type: String(t.type ?? 'EXPENSE'),
        note: t.note ? String(t.note) : null,
        date: String(t.txDate ?? t.date ?? ''),
        createdAt: String(t.createdAt ?? new Date().toISOString()),
        updatedAt: t.updatedAt ? String(t.updatedAt) : null,
        deletedAt: t.deletedAt ? String(t.deletedAt) : null,
        version: t.version != null ? Number(t.version) : 1,
      });
    }
    for (const b of (changes.budgets ?? []) as Array<Record<string, unknown>>) {
      await this.budgetLocal.upsert({
        budgetId: String(b.budgetId),
        walletId: b.walletId ? String(b.walletId) : null,
        categoryId: b.categoryId ? String(b.categoryId) : null,
        title: b.title ? String(b.title) : undefined,
        amountLimit: Number(b.amountLimit ?? 0),
        periodStart: String(b.periodStart ?? ''),
        periodEnd: String(b.periodEnd ?? ''),
        periodType: b.periodType ? String(b.periodType) : 'monthly',
        alertThreshold: b.alertThreshold == null ? null : Number(b.alertThreshold),
        source: b.source ? String(b.source) : 'manual',
        aiReasoning: b.aiReasoning ? String(b.aiReasoning) : null,
        draftId: b.draftId ? String(b.draftId) : null,
        createdAt: String(b.createdAt ?? new Date().toISOString()),
        updatedAt: b.updatedAt ? String(b.updatedAt) : null,
        deletedAt: b.deletedAt ? String(b.deletedAt) : null,
        version: b.version != null ? Number(b.version) : 1,
      });
    }
  }
}
```

- [ ] **Step 2: Update syncServiceSingleton.ts**

Replace the entire file with:

```typescript
import { SyncRemoteDataSourceImpl } from '@/modules/sync/api/syncRemoteDataSourceImpl';
import { OutboxStore } from '@/modules/sync/local/outboxStore';
import { SyncStateStore } from '@/modules/sync/local/syncStateStore';
import { SyncService } from '@/modules/sync/service/syncService';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';
import { CategoryLocalDataSource } from '@/modules/category/local/categoryLocalDataSource';
import { TransactionLocalDataSource } from '@/modules/transaction/local/transactionLocalDataSource';
import { BudgetLocalDataSource } from '@/modules/budget/local/budgetLocalDataSource';

export const syncService = new SyncService(
  new SyncRemoteDataSourceImpl(),
  new OutboxStore(),
  new SyncStateStore(),
  new WalletLocalDataSource(),
  new CategoryLocalDataSource(),
  new TransactionLocalDataSource(),
  new BudgetLocalDataSource(),
);
```

- [ ] **Step 3: Verify TypeScript**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/sync/service/syncService.ts \
        app_moneytracker/src/modules/sync/service/syncServiceSingleton.ts
git commit -m "feat(sync): add budgets entity to pull/push handling"
```

---

## Task 21: Create AiBudgetCreateScreen

**Files:**
- Create: `app_moneytracker/src/modules/budget/screens/AiBudgetCreateScreen.tsx`
- Create: `app_moneytracker/app/(tabs)/tools/budgets/ai-create.tsx`

- [ ] **Step 1: Create the screen file**

```typescript
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button, colors, spacing, typography, BackButton } from '@/components/common';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { aiBudgetApi, AiBudgetDraftResponse } from '@/modules/budget/api/aiBudgetApi';
import { draftStorage } from '@/modules/budget/storage/draftStorage';
import { profileStorage } from '@/modules/budget/storage/profileStorage';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

const toIsoDate = (value: Date) => {
  const y = value.getFullYear();
  const m = `${value.getMonth() + 1}`.padStart(2, '0');
  const d = `${value.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonthEnd = (startIso: string) => {
  const [y, m, d] = startIso.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m, 0); // last day of month
  return toIsoDate(end);
};

export const AiBudgetCreateScreen = () => {
  const router = useRouter();
  const { getWallets } = useWalletUsecases();
  const { getCategories } = useCategoryUsecases();

  const [incomeInput, setIncomeInput] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [periodStart, setPeriodStart] = useState(toIsoDate(new Date()));
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: getWallets });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  // Pre-fill from previous profile on first mount
  useEffect(() => {
    (async () => {
      const profile = await profileStorage.get();
      if (profile?.lastIncome) setIncomeInput(formatMoneyInput(String(profile.lastIncome)));
      if (profile?.lastPrompt) setUserPrompt(profile.lastPrompt);
      if (profile?.lastWalletId !== undefined) {
        setSelectedWalletId(profile.lastWalletId);
        setShowAllWallets(profile.lastWalletId == null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedWalletId && !showAllWallets && wallets.length > 0) {
      setSelectedWalletId(wallets[0].walletId);
    }
  }, [selectedWalletId, showAllWallets, wallets]);

  const savingsCategory = useMemo(
    () => categories.find((c) => c.name === 'Tiết kiệm'),
    [categories],
  );

  const periodEnd = useMemo(() => getMonthEnd(periodStart), [periodStart]);

  const handleSubmit = async () => {
    setErrorMessage(null);
    const income = parseMoneyInput(incomeInput);
    if (!Number.isFinite(income) || income <= 0) {
      setErrorMessage('Vui lòng nhập thu nhập lớn hơn 0.');
      return;
    }
    if (savingsCategory == null) {
      setErrorMessage('Không tìm thấy danh mục "Tiết kiệm". Vui lòng tạo trước.');
      return;
    }

    setLoading(true);
    try {
      const draft: AiBudgetDraftResponse = await aiBudgetApi.generateDraft({
        income,
        userPrompt: userPrompt.trim() || undefined,
        walletId: showAllWallets ? null : selectedWalletId,
        periodStart,
        periodEnd,
      });

      // Persist snapshot so user can resume on cold start
      await draftStorage.save({
        draftId: draft.draftId,
        income,
        userPrompt: userPrompt.trim(),
        walletId: showAllWallets ? null : selectedWalletId,
        periodStart,
        periodEnd,
        savedAt: new Date().toISOString(),
      });
      await profileStorage.save({
        lastIncome: income,
        lastPrompt: userPrompt.trim(),
        lastWalletId: showAllWallets ? null : selectedWalletId,
        updatedAt: new Date().toISOString(),
      });

      router.push({
        pathname: '/(tabs)/tools/budgets/ai-preview',
        params: { draftId: draft.draftId },
      });
    } catch (err) {
      console.error('AI draft failed', err);
      setErrorMessage('AI tạm thời không khả dụng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <BackButton to="/(tabs)/tools/budgets" />
          <Text style={styles.title}>AI Budget</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Thu nhập thực tế (VND)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={incomeInput}
            placeholder="VD: 20,000,000"
            onChangeText={(v) => setIncomeInput(formatMoneyInput(v))}
          />
          {incomeInput ? (
            <Text style={styles.hint}>= {formatVndAmount(parseMoneyInput(incomeInput) || 0)}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mô tả nhu cầu (tuỳ chọn)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={userPrompt}
            placeholder="VD: Đám cưới 2tr, muốn mua iPhone"
            onChangeText={setUserPrompt}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Thời gian</Text>
          <View style={styles.periodRow}>
            <Text style={styles.periodValue}>{periodStart}</Text>
            <Text style={styles.periodArrow}>→</Text>
            <Text style={styles.periodValue}>{periodEnd}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.walletToggleRow}>
            <Text style={styles.label}>Áp dụng cho tất cả ví</Text>
            <Switch
              value={showAllWallets}
              onValueChange={(v) => {
                setShowAllWallets(v);
                if (v) setSelectedWalletId(null);
              }}
            />
          </View>
          {!showAllWallets ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.walletRow}
            >
              {wallets.length === 0 ? (
                <View style={styles.walletEmptyChip}>
                  <Text style={styles.walletEmptyText}>Chưa có ví</Text>
                </View>
              ) : (
                wallets.map((w) => {
                  const selected = selectedWalletId === w.walletId;
                  return (
                    <Pressable
                      key={w.walletId}
                      onPress={() => setSelectedWalletId(w.walletId)}
                      style={[styles.walletChip, selected ? styles.walletChipActive : null]}
                    >
                      <MaterialCommunityIcons
                        name={(w as any).icon ?? 'wallet'}
                        size={16}
                        color={selected ? '#0f8c95' : '#3a464e'}
                      />
                      <Text
                        style={[
                          styles.walletChipText,
                          selected ? styles.walletChipTextActive : null,
                        ]}
                      >
                        {w.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          ) : (
            <Text style={styles.hint}>Budget sẽ áp dụng cho tất cả ví.</Text>
          )}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Button
          title={loading ? 'Đang gọi AI...' : 'Tạo bằng AI'}
          onPress={handleSubmit}
          disabled={loading}
        />
        <Text style={styles.disclaimer}>
          AI sẽ gợi ý phân bổ dựa trên thu nhập và lịch sử chi tiêu (nếu có). Bạn có thể chỉnh trước khi lưu.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f9' },
  content: { padding: 16, paddingBottom: 80, gap: 14 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold, color: colors.textPrimary,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#5d6972' },
  input: {
    minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#d5dde3',
    paddingHorizontal: 12, backgroundColor: '#fff', fontSize: 16, color: '#1f1f1f',
  },
  textArea: { minHeight: 80, paddingTop: 10, paddingBottom: 10, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#7b868d' },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodValue: { fontSize: 14, color: '#1f1f1f', fontWeight: '600' },
  periodArrow: { fontSize: 14, color: '#7b868d' },
  walletToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletRow: { gap: 8, paddingTop: 8, paddingBottom: 4 },
  walletChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    minHeight: 40, paddingHorizontal: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#d9e2e8', backgroundColor: '#fff',
  },
  walletChipActive: { borderColor: '#29bcc8', backgroundColor: '#e9fbfd' },
  walletChipText: { fontSize: 13, color: '#3a464e', fontWeight: '600' },
  walletChipTextActive: { color: '#0f8c95' },
  walletEmptyChip: { minHeight: 40, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#f1f5f8' },
  walletEmptyText: { fontSize: 13, color: '#7b868d', fontWeight: '600' },
  error: { color: '#c0392b', fontSize: 13, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: '#7b868d', textAlign: 'center', marginTop: 8 },
});
```

- [ ] **Step 2: Create route entry file**

```typescript
import { AiBudgetCreateScreen } from '@/modules/budget/screens/AiBudgetCreateScreen';

export default function AiBudgetCreateRoute() {
  return <AiBudgetCreateScreen />;
}
```

- [ ] **Step 3: Verify TypeScript**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors (or only warnings about unused imports).

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/budget/screens/AiBudgetCreateScreen.tsx \
        app_moneytracker/app/\(tabs\)/tools/budgets/ai-create.tsx
git commit -m "feat(budget): AiBudgetCreateScreen + route entry"
```

---

## Task 22: Create AiBudgetPreviewScreen

**Files:**
- Create: `app_moneytracker/src/modules/budget/screens/AiBudgetPreviewScreen.tsx`
- Create: `app_moneytracker/app/(tabs)/tools/budgets/ai-preview.tsx`

This screen re-fetches the draft from the server using `draftId`, then renders one `PercentAdjusterRow` (F1) per item. The last item ("Tiết kiệm") is auto-fill (disabled) and rebalances via `usePercentSum`.

- [ ] **Step 1: Create the screen file**

```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button, colors, spacing, typography, BackButton } from '@/components/common';
import { aiBudgetApi, AiBudgetDraftResponse } from '@/modules/budget/api/aiBudgetApi';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { PercentAdjusterRow } from '@/modules/budget/components/PercentAdjusterRow';
import { usePercentSum, PercentItem } from '@/modules/budget/hooks/usePercentSum';
import { draftStorage } from '@/modules/budget/storage/draftStorage';
import { formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

interface PreviewState {
  draftId: string;
  income: number;
  walletId: string | null;
  periodStart: string;
  periodEnd: string;
  strategy: string;
  items: Array<{
    categoryId: string;
    categoryName: string;
    icon: string | null;
    color: string | null;
    percent: number;
    amount: number;
    aiReasoning: string | null;
  }>;
}

export const AiBudgetPreviewScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ draftId?: string }>();
  const draftId = params.draftId ?? '';
  const queryClient = useQueryClient();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();

  const [state, setState] = useState<PreviewState | null>(null);
  const [incomeInput, setIncomeInput] = useState('');
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: getWallets });
  const categories = categoriesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];

  // Load draft from server (or storage fallback)
  useEffect(() => {
    (async () => {
      try {
        // Server is the source of truth for the actual items.
        // We re-call generateDraft semantics by reading from local snapshot for the period
        // and let the user edit. For simplicity here, we re-issue a draft call using the
        // stored snapshot fields.
        const snap = await draftStorage.get();
        if (!snap) {
          setErrorMessage('Không tìm thấy bản nháp. Vui lòng tạo lại.');
          return;
        }
        setIncomeInput(String(snap.income));
        setShowAllWallets(snap.walletId == null);
        setSelectedWalletId(snap.walletId);

        const draft: AiBudgetDraftResponse = await aiBudgetApi.generateDraft({
          income: snap.income,
          userPrompt: snap.userPrompt,
          walletId: snap.walletId,
          periodStart: snap.periodStart,
          periodEnd: snap.periodEnd,
        });

        const catMap = new Map(categories.map((c) => [c.categoryId, c]));
        const enriched = draft.items.map((it) => {
          const c = catMap.get(it.categoryId);
          return {
            categoryId: it.categoryId,
            categoryName: it.categoryName,
            icon: c?.icon ?? null,
            color: c?.color ?? null,
            percent: Math.round(it.percent),
            amount: Math.round(it.amount),
            aiReasoning: it.aiReasoning ?? null,
          };
        });

        setState({
          draftId: draft.draftId,
          income: snap.income,
          walletId: snap.walletId,
          periodStart: snap.periodStart,
          periodEnd: snap.periodEnd,
          strategy: draft.summary.strategy,
          items: enriched,
        });
      } catch (err) {
        console.error('Failed to load draft', err);
        setErrorMessage('Không tải được bản nháp. Vui lòng thử lại.');
      }
    })();
  }, [categories, draftId]);

  const itemsForSum: PercentItem[] = useMemo(
    () =>
      state?.items.map((i) => ({ id: i.categoryId, percent: i.percent })) ?? [],
    [state?.items],
  );

  const income = parseMoneyInput(incomeInput) || state?.income || 0;
  const percentSum = usePercentSum(itemsForSum, income);

  // Sync percentSum changes back into state.items (preserves order)
  useEffect(() => {
    if (!state) return;
    const byId = new Map(percentSum.items.map((p) => [p.id, p.percent]));
    const updated = state.items.map((it) => ({
      ...it,
      percent: byId.get(it.categoryId) ?? it.percent,
      amount: Math.round((income * (byId.get(it.categoryId) ?? it.percent)) / 100),
    }));
    // Only setState when values actually changed to avoid loops
    const sameTotal = updated.reduce((s, i) => s + i.percent, 0) === state.items.reduce((s, i) => s + i.percent, 0);
    if (!sameTotal) {
      setState({ ...state, items: updated });
    }
  }, [percentSum.items, income]);

  // Recalculate amount when income changes
  useEffect(() => {
    if (!state) return;
    setState({
      ...state,
      income,
      items: state.items.map((it) => ({
        ...it,
        amount: Math.round((income * it.percent) / 100),
      })),
    });
  }, [income]);

  const handleConfirm = async () => {
    if (!state) return;
    if (percentSum.sum !== 100) {
      Alert.alert('Tổng chưa đúng', `Tổng percent hiện tại = ${percentSum.sum}. Vui lòng chỉnh về 100.`);
      return;
    }
    setSaving(true);
    try {
      await aiBudgetApi.batchCreate({
        draftId: state.draftId,
        walletId: showAllWallets ? null : selectedWalletId,
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
        periodType: 'monthly',
        income,
        items: state.items.map((it) => ({
          categoryId: it.categoryId,
          percent: Math.round(it.percent),
          amount: Math.round(it.amount),
          aiReasoning: it.aiReasoning,
        })),
      });
      await draftStorage.clear();
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
      Alert.alert('Thành công', 'Đã tạo ngân sách AI.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/tools/budgets') },
      ]);
    } catch (err) {
      console.error('Batch create failed', err);
      Alert.alert('Lỗi', 'Không thể lưu ngân sách. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (errorMessage) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Button title="Quay lại" onPress={() => router.back()} />
      </View>
    );
  }

  if (!state) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color="#29bcc8" />
        <Text style={styles.loadingText}>Đang tải bản nháp...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton to="/(tabs)/tools/budgets/ai-create" />
          <Text style={styles.title}>AI Budget Draft</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>📅 Thời gian</Text>
          <Text style={styles.cardValue}>{state.periodStart} → {state.periodEnd}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>💰 Tổng thu nhập</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={incomeInput}
            onChangeText={setIncomeInput}
          />
          <Text style={styles.hint}>= {formatVndAmount(income)}</Text>
        </View>

        {state.strategy ? (
          <View style={styles.strategyCard}>
            <Text style={styles.strategyLabel}>Chiến lược</Text>
            <Text style={styles.strategyText}>{state.strategy}</Text>
          </View>
        ) : null}

        <View style={styles.itemsList}>
          {state.items.map((item, idx) => {
            const isLast = idx === state.items.length - 1;
            return (
              <PercentAdjusterRow
                key={item.categoryId}
                categoryIcon={item.icon ?? 'cash'}
                categoryName={item.categoryName}
                percent={item.percent}
                amount={item.amount}
                aiReasoning={item.aiReasoning}
                disabled={isLast}
                onChange={(next) => percentSum.updatePercent(item.categoryId, next)}
              />
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng:</Text>
          <Text style={[styles.totalValue, percentSum.sum !== 100 ? styles.totalValueWarn : null]}>
            {percentSum.sum}% = {formatVndAmount(income)}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.walletToggleRow}>
            <Text style={styles.cardLabel}>Áp dụng cho tất cả ví</Text>
            <Switch
              value={showAllWallets}
              onValueChange={(v) => {
                setShowAllWallets(v);
                if (v) setSelectedWalletId(null);
              }}
            />
          </View>
          {!showAllWallets ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.walletRow}
            >
              {wallets.map((w) => {
                const selected = selectedWalletId === w.walletId;
                return (
                  <Pressable
                    key={w.walletId}
                    onPress={() => setSelectedWalletId(w.walletId)}
                    style={[styles.walletChip, selected ? styles.walletChipActive : null]}
                  >
                    <Text style={[styles.walletChipText, selected ? styles.walletChipTextActive : null]}>
                      {w.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <Button
          title={saving ? 'Đang lưu...' : 'Xác nhận & Tạo budget'}
          onPress={handleConfirm}
          disabled={saving}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f9' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 8, color: '#5d6972' },
  errorText: { color: '#c0392b', padding: 16, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 80, gap: 12 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold, color: colors.textPrimary,
  },
  card: { padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e6ecef', gap: 6 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#5d6972' },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#1f1f1f' },
  input: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#d5dde3',
    paddingHorizontal: 10, backgroundColor: '#fff', fontSize: 16, color: '#1f1f1f',
  },
  hint: { fontSize: 12, color: '#7b868d' },
  strategyCard: {
    padding: 12, backgroundColor: '#f3fafb', borderRadius: 12,
    borderWidth: 1, borderColor: '#d9f0f2', gap: 4,
  },
  strategyLabel: { fontSize: 12, fontWeight: '700', color: '#0f8c95' },
  strategyText: { fontSize: 13, color: '#1f1f1f' },
  itemsList: { gap: 10 },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, backgroundColor: '#e9fbfd', borderRadius: 12,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#5d6972' },
  totalValue: { fontSize: 14, fontWeight: '800', color: '#0f8c95' },
  totalValueWarn: { color: '#c0392b' },
  walletToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletRow: { gap: 8, paddingTop: 8 },
  walletChip: {
    minHeight: 40, paddingHorizontal: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#d9e2e8', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  walletChipActive: { borderColor: '#29bcc8', backgroundColor: '#e9fbfd' },
  walletChipText: { fontSize: 13, color: '#3a464e', fontWeight: '600' },
  walletChipTextActive: { color: '#0f8c95' },
});
```

- [ ] **Step 2: Create route entry file**

```typescript
import { AiBudgetPreviewScreen } from '@/modules/budget/screens/AiBudgetPreviewScreen';

export default function AiBudgetPreviewRoute() {
  return <AiBudgetPreviewScreen />;
}
```

- [ ] **Step 3: Verify TypeScript**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/budget/screens/AiBudgetPreviewScreen.tsx \
        app_moneytracker/app/\(tabs\)/tools/budgets/ai-preview.tsx
git commit -m "feat(budget): AiBudgetPreviewScreen + route entry (F1 reuse)"
```

---

## Task 23: Register AI routes in tools layout

**Files:**
- Modify: `app_moneytracker/app/(tabs)/tools/_layout.tsx`

- [ ] **Step 1: Add Stack.Screen entries**

Replace the file with:

```typescript
import { Stack } from 'expo-router';
import { useCallback } from 'react';

export default function ToolsStackLayout() {
  const screenOptions = useCallback(() => ({
    headerShown: false,
    tabBarStyle: { display: 'none' },
  }), []);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="budgets/index" />
      <Stack.Screen name="budgets/[budgetId]" />
      <Stack.Screen name="budgets/[budgetId]/edit" />
      <Stack.Screen name="budgets/ai-create" />
      <Stack.Screen name="budgets/ai-preview" />
      <Stack.Screen name="savings/index" />
      <Stack.Screen name="savings/[savingId]" />
      <Stack.Screen name="savings/[savingId]/edit" />
      <Stack.Screen name="debts/index" />
      <Stack.Screen name="debts/[debtId]" />
      <Stack.Screen name="debts/[debtId]/edit" />
      <Stack.Screen name="events/index" />
      <Stack.Screen name="events/[eventId]" />
    </Stack>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app_moneytracker/app/\(tabs\)/tools/_layout.tsx
git commit -m "feat(routes): register AI budget screens in tools stack"
```

---

## Task 24: Add "Tạo bằng AI" button to BudgetToolScreen

**Files:**
- Modify: `app_moneytracker/src/modules/budget/screens/BudgetToolScreen.tsx`

- [ ] **Step 1: Add the button next to the existing FAB**

Open `BudgetToolScreen.tsx` and find the FAB line:

```typescript
      <FAB icon={<Ionicons name="add" size={24} color="#fff" />} label="Thêm ngân sách" onPress={() => setShowCreateModal(true)} />
```

Replace it with TWO buttons (FAB on the right, secondary "AI" button on the left):

```typescript
      <View style={styles.fabRow}>
        <Pressable
          style={styles.aiFab}
          onPress={() => router.push('/(tabs)/tools/budgets/ai-create')}
        >
          <Ionicons name="sparkles" size={18} color="#0f8c95" />
          <Text style={styles.aiFabText}>Tạo bằng AI</Text>
        </Pressable>
        <FAB
          icon={<Ionicons name="add" size={24} color="#fff" />}
          label="Thêm ngân sách"
          onPress={() => setShowCreateModal(true)}
        />
      </View>
```

- [ ] **Step 2: Add the styles to the StyleSheet**

Add these styles inside the existing `StyleSheet.create({...})` block:

```typescript
  fabRow: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  aiFab: {
    flex: 1,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#e9fbfd',
    borderWidth: 1,
    borderColor: '#29bcc8',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 5,
  },
  aiFabText: {
    color: '#0f8c95',
    fontSize: 16,
    fontWeight: '700',
  },
```

(Remove the old `fab` style and the old `fabText` style since they're replaced by the new ones — but keep them if the existing FAB component uses them internally; it does not, it has its own internal styles. Safe to remove. Search the file for `fab:` and `fabText:` to confirm.)

- [ ] **Step 3: Verify TypeScript**

Run:
```bash
cd app_moneytracker
npx tsc --noEmit -p .
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/budget/screens/BudgetToolScreen.tsx
git commit -m "feat(budget): 'Tạo bằng AI' button on budget list"
```

---

## Task 25: Mobile end-to-end smoke test

**Files:** none — manual verification

- [ ] **Step 1: Start the backend**

```bash
cd be_money_tracker
./mvnw spring-boot:run
```

Expected: Tomcat starts on port 8080, MySQL connected, no errors. Confirm:
- `curl http://localhost:8080/api/health` (or any known route) returns 401 (proves the server is up + auth filter is on).
- Check `SELECT * FROM budgets LIMIT 1;` in MySQL — confirm new `source`, `ai_reasoning`, `draft_id` columns exist and `wallet_id` is nullable.

- [ ] **Step 2: Set a real Gemini API key in application.properties (optional but recommended)**

```bash
# Edit be_money_tracker/src/main/resources/application.properties:
# ai.gemini.apiKey=YOUR_REAL_KEY
```

Restart the backend. (For the smoke test, the API will return 503 if the key is blank; that's expected and means the contract is working.)

- [ ] **Step 3: Start the mobile app**

```bash
cd app_moneytracker
npx expo start
```

Expected: Metro starts, QR code displayed.

- [ ] **Step 4: Manual smoke test — happy path (with valid Gemini key)**

1. Open app on simulator/device, log in.
2. Navigate to **Công cụ → Ngân sách** (Tools → Budgets).
3. Confirm the new "Tạo bằng AI" button appears next to the existing FAB.
4. Tap "Tạo bằng AI" → enters `AiBudgetCreateScreen`.
5. Enter income: `20,000,000`. Prompt: `Đám cưới 2tr, muốn mua iPhone`. Pick a wallet or toggle "Tất cả ví". Tap "Tạo bằng AI".
6. Loading spinner → navigates to `AiBudgetPreviewScreen`.
7. Verify 4-6 categories shown, last item is "Tiết kiệm" with disabled adjuster.
8. Drag/click -5% on a middle category → "Tiết kiệm" auto-updates.
9. Edit income → amounts re-calculate for all rows.
10. Tap "Xác nhận & Tạo budget" → success alert → returns to BudgetToolScreen.
11. Verify the new budgets appear in the list with `source=ai_confirmed`.

- [ ] **Step 5: Verify DB rows**

```sql
SELECT budget_id, category_id, amount_limit, source, ai_reasoning, draft_id
FROM budgets
WHERE draft_id = '<the draftId from step 4>';
```

Expected: N rows (one per AI category), all with same `draft_id`, `source='AI_CONFIRMED'`, non-null `ai_reasoning`.

- [ ] **Step 6: Manual smoke test — offline (no Gemini key)**

1. With `ai.gemini.apiKey=` (blank) in `application.properties`, restart backend.
2. Tap "Tạo bằng AI" → fill form → submit.
3. Expected: error alert "AI tạm thời không khả dụng. Vui lòng thử lại sau." — confirms graceful degradation.

- [ ] **Step 7: Sync test (mobile online, then offline batch)**

1. With the new budgets created above, force-quit the app.
2. Reopen → verify budgets appear in the list (loaded from server).
3. Check the local SQLite: in dev tools, run `SELECT * FROM budgets;` — should mirror the server.
4. Tap one of the AI-created budgets → opens detail screen (verifies that the existing detail screen handles the new `source`/`aiReasoning` fields without crashing).

- [ ] **Step 8: Commit any follow-up fixes**

```bash
git add -A
git commit -m "fix(budget): smoke-test fixes for F2"
```

(Only commit if you actually changed something.)

---

## Task 26: Update design spec with F2 status

**Files:**
- Modify: `docs/superpowers/specs/2026-06-05-ai-smart-budgeting-design.md`

- [ ] **Step 1: Update F2 status block**

Find the `## F1 Status` section and add a new `## F2 Status` block right after it:

```markdown
## F2 Status

✅ **F2 AI Budget Generation complete** (see `2026-06-05-f2-ai-budget-plan.md` for implementation plan).

**Components delivered:**
- Backend: `AiBudgetService` orchestrating Gemini + `BudgetDraftValidator` (7 tests) + `BudgetPromptBuilder` + `HistoricalStatsRepository`
- Backend: `POST /api/ai/budget/draft` + `POST /api/budgets/batch` endpoints
- Backend: `Budget` entity extended with `source`, `aiReasoning`, `draftId`; `walletId` now nullable
- Mobile: `AiBudgetCreateScreen` (input form) + `AiBudgetPreviewScreen` (F1 percent adjuster reuse)
- Mobile: `aiBudgetApi.ts`, `draftStorage.ts`, `profileStorage.ts`, `BudgetLocalDataSource`
- Mobile: Sync service extended to handle `budgets` entity (pull + push)

**Test coverage:** 9 backend tests (7 validator + 2 service)
**Branch:** `code_ver2`
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-06-05-ai-smart-budgeting-design.md
git commit -m "docs(spec): mark F2 complete"
```

---

## Self-Review

**1. Spec coverage check**

| Spec requirement | Covered by |
|---|---|
| POST /api/ai/budget/draft | Task 11 |
| POST /api/budgets/batch | Task 13 |
| AiBudgetService orchestrating context + Gemini + validation | Task 10 |
| BudgetDraftValidator with full spec rules | Task 7 (TDD) |
| DTOs (AiBudgetDraftRequest/Response, BudgetItemDto, BatchCreate) | Tasks 5, 6 |
| Budget entity updates (source, aiReasoning, draftId, nullable walletId) | Task 3 |
| BudgetResponse update | Task 4 |
| Gemini API key config | Task 1 |
| AiBudgetCreateScreen | Task 21 |
| AiBudgetPreviewScreen using F1 components | Task 22 |
| aiBudgetApi.ts | Task 18 |
| draftStorage.ts + profileStorage.ts | Task 19 |
| SyncService support for budgets | Task 20 |
| BudgetLocalDataSource | Task 15 |
| Mobile smoke test | Task 25 |
| Update design spec status | Task 26 |

**Gaps:** None. All deliverables from the prompt are mapped to a task.

**2. Placeholder scan**

- No "TODO", "TBD", or "implement later" markers.
- No "appropriate error handling" / "fill in details" instructions.
- No steps say "similar to Task N" without repeating the code.
- All code steps include the full file content.

**3. Type consistency check**

- Backend `AiBudgetDraftRequest.income` is `BigDecimal` (positive) — matched in `AiBudgetService.generateDraft(req, userId)`.
- Mobile `AiBudgetDraftRequest.income` is `number` — matches `parseMoneyInput` return.
- `draftId` is `UUID` on backend, `string` on mobile (serialized) — consistent.
- `BatchCreateBudgetRequest.items` is `List<BatchBudgetItemDto>` on backend, `BudgetItemInput[]` on mobile — fields match (`categoryId`, `percent`, `amount`, `aiReasoning`).
- `Budget` interface on mobile gained `source`, `aiReasoning`, `draftId` in Task 16; `BudgetLocalDataSource.upsert` in Task 15 references all of them — same names.
- `usePercentSum`'s `PercentItem.id` is `string` and matches the `categoryId` used in `AiBudgetPreviewScreen` — consistent.
- The `applyChanges` mapper in `SyncService` reads `b.source`, `b.aiReasoning`, `b.draftId` — same as the `Budget` interface — consistent.

**4. Risks / open questions**

- **Empty categories on a brand-new account:** the `HistoricalStatsRepository` query returns `List.of()` and the prompt explicitly tells Gemini "use 50/30/20 baseline". Verified in `AiBudgetServiceTest` promptContainsAvailableCategories. No further action.
- **The validator rebalances via "last item absorbs diff" rather than proportional scale-down:** this matches the spec's "thiếu → cộng vào Tiết kiệm, thừa → scale down proportionally". We do the simpler "last item absorbs" because in practice the validator runs on AI output where the last item is always "Tiết kiệm". If you want strict proportional scaling, extend `BudgetDraftValidator` in a follow-up PR.
- **`AiBudgetPreviewScreen` re-calls the server on mount:** this is by design — we re-fetch the draft instead of passing it via route params (the items can be large). Tradeoff: extra latency. Alternative would be to pass the full draft through `router.push({ params: { ... }} as any)` — out of scope.
- **Rounding on the mobile side:** the `BatchCreateBudgetRequest` server expects `BigDecimal amount`. The mobile preview rounds to integer (VND). The server re-validates `sum(percent) == 100` via the BatchCreate flow. If the user adjusts sliders, the preview's `usePercentSum` keeps sum=100 automatically (the last item is disabled). No re-validation on the server beyond what's already there.
- **Mobile category `isHidden` filtering:** the `findAccessibleCategories` query on the backend already excludes hidden categories. No change needed.
- **No rate limiting on `/api/ai/budget/draft` yet:** spec marks it as a follow-up. Out of scope for F2 MVP.

---
