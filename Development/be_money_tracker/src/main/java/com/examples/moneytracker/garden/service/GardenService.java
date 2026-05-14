package com.examples.moneytracker.garden.service;

import com.examples.moneytracker.garden.dto.*;
import com.examples.moneytracker.garden.model.*;
import com.examples.moneytracker.garden.repository.*;
import com.examples.moneytracker.garden.service.score.ScoreResult;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GardenService {

    private final GardenFeatureGuard featureGuard;
    private final GardenScoreService scoreService;
    private final PlantSessionRepository plantSessionRepository;
    private final DailyFinancialTaskRepository taskRepository;
    private final GardenRewardRepository rewardRepository;
    private final UserGardenStreakRepository streakRepository;
    private final FlowerTypeRepository flowerTypeRepository;
    private final PlantStageSnapshotRepository snapshotRepository;

    // ==================== SEED CATALOG (static data matching FE seedCatalog) ====================

    private static final List<GardenSeedResponse> SEED_CATALOG = List.of(
        GardenSeedResponse.builder()
            .seedId("seed-sakura").name("Sakura Hiểu Thư").rarity("rare")
            .description("Mang lại cảm giác dịu dàng và dễ chịu trong những ngày ổn định.")
            .previewColors(new GardenSeedResponse.PreviewColors("#f2b7c2", "#f7e1a5", "#7ec9a4"))
            .build(),
        GardenSeedResponse.builder()
            .seedId("seed-moon").name("Dải Nguyệt").rarity("epic")
            .description("Vẻ đẹp tinh tế, phù hợp khi bạn đang giữ nhịp tiết kiệm đều đặn.")
            .previewColors(new GardenSeedResponse.PreviewColors("#cdbdf7", "#f3e7ff", "#86c9d8"))
            .build(),
        GardenSeedResponse.builder()
            .seedId("seed-sunrise").name("Bình Minh").rarity("common")
            .description("Nắng ấm, mềm mại và luôn động viên bạn bắt đầu ngày mới.")
            .previewColors(new GardenSeedResponse.PreviewColors("#f6c684", "#f7f0c5", "#7fd3a8"))
            .build(),
        GardenSeedResponse.builder()
            .seedId("seed-lotus").name("Sen Thắm").rarity("legendary")
            .description("Hoa sen quý, dành cho những tháng bạn giữ tính kỷ luật rất cao.")
            .previewColors(new GardenSeedResponse.PreviewColors("#f09aa9", "#f7dfe3", "#78c69b"))
            .build(),
        GardenSeedResponse.builder()
            .seedId("seed-aurora").name("Cúc Aurora").rarity("rare")
            .description("Rực rỡ và đầy hi vọng, tạo một khu vườn thật bình yên.")
            .previewColors(new GardenSeedResponse.PreviewColors("#90d6f7", "#f8f1b7", "#7bcfa0"))
            .build()
    );

    // Maps seedId → FlowerTypeCode for DB lookup
    private static final Map<String, FlowerTypeCode> SEED_TO_FLOWER = Map.of(
        "seed-sakura", FlowerTypeCode.SAKURA,
        "seed-moon", FlowerTypeCode.LILY,
        "seed-sunrise", FlowerTypeCode.SUNFLOWER,
        "seed-lotus", FlowerTypeCode.ROSE,
        "seed-aurora", FlowerTypeCode.TULIP
    );

    // ==================== PUBLIC API METHODS ====================

    /**
     * GET /api/garden/current — Main dashboard state.
     */
    public GardenCurrentResponse getCurrentGarden(UUID userId) {
        featureGuard.assertEnabled();

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = YearMonth.from(today).atEndOfMonth();

        // Find or create the active session for this month
        PlantSession session = plantSessionRepository
            .findByUserIdAndStatus(userId, PlantSessionStatus.ACTIVE)
            .orElse(null);

        // Score calculation
        ScoreResult scoreResult = scoreService.calculateMonthlyScore(userId, monthStart, monthEnd);

        // Tasks for today
        List<DailyFinancialTask> todayTasks = taskRepository.findByUserIdAndTaskDate(userId, today);
        int completedToday = (int) todayTasks.stream()
            .filter(t -> t.getStatus() == FinancialTaskStatus.COMPLETED).count();

        // Streak
        UserGardenStreak streak = streakRepository.findByUserId(userId).orElse(null);
        int dailyStreak = streak != null ? streak.getCurrentStreak() : 0;

        // Rewards for the current session
        List<GardenRewardResponse> rewards = List.of();
        if (session != null) {
            rewards = rewardRepository.findByPlantSessionPlantSessionId(session.getPlantSessionId())
                .stream()
                .map(this::mapReward)
                .toList();
        }

        // Weather (derived from score)
        String weather = resolveWeather(scoreResult.getScore());

        // Flower state
        GardenFlowerStateResponse flower = buildFlowerState(session, scoreResult.getScore(), today, monthStart);

        // Seed
        GardenSeedResponse seed = resolveSeed(session);

        // Encouragement
        String encouragement = generateEncouragement(scoreResult.getScore(), dailyStreak);

        return GardenCurrentResponse.builder()
            .month(formatMonth(today))
            .seed(seed)
            .score(GardenScoreResponse.builder()
                .value(scoreResult.getScore())
                .label("Chỉ số chăm sóc")
                .build())
            .weather(weather)
            .flower(flower)
            .dailyStreak(dailyStreak)
            .tasksCompletedToday(completedToday)
            .tasksTotalToday(todayTasks.size())
            .encouragement(encouragement)
            .rewards(rewards)
            .build();
    }

    /**
     * GET /api/garden/flower-state — Flower visual state only.
     */
    public GardenFlowerStateResponse getFlowerState(UUID userId) {
        featureGuard.assertEnabled();

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = YearMonth.from(today).atEndOfMonth();

        PlantSession session = plantSessionRepository
            .findByUserIdAndStatus(userId, PlantSessionStatus.ACTIVE)
            .orElse(null);

        ScoreResult scoreResult = scoreService.calculateMonthlyScore(userId, monthStart, monthEnd);
        return buildFlowerState(session, scoreResult.getScore(), today, monthStart);
    }

    /**
     * GET /api/garden/tasks/today — Daily tasks.
     */
    public List<GardenTaskResponse> getTodayTasks(UUID userId) {
        featureGuard.assertEnabled();

        LocalDate today = LocalDate.now();
        List<DailyFinancialTask> tasks = taskRepository.findByUserIdAndTaskDate(userId, today);

        // If no tasks generated yet for today, generate them
        if (tasks.isEmpty()) {
            tasks = generateDailyTasks(userId, today);
        }

        return tasks.stream().map(this::mapTask).toList();
    }

    /**
     * POST /api/garden/tasks/{taskId}/complete — Complete a task.
     */
    @Transactional
    public List<GardenTaskResponse> completeTask(UUID userId, UUID taskId) {
        featureGuard.assertEnabled();

        DailyFinancialTask task = taskRepository.findByTaskIdAndUserId(taskId, userId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        if (task.getStatus() == FinancialTaskStatus.COMPLETED) {
            throw new RuntimeException("Task already completed");
        }

        task.setStatus(FinancialTaskStatus.COMPLETED);
        task.setCompletedAt(Instant.now());
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);

        // Update streak
        updateStreak(userId);

        // Update plant session score
        PlantSession session = plantSessionRepository
            .findByUserIdAndStatus(userId, PlantSessionStatus.ACTIVE)
            .orElse(null);
        if (session != null) {
            session.setCurrentScore(session.getCurrentScore() + task.getScoreDelta());
            plantSessionRepository.save(session);
        }

        // Return updated task list
        LocalDate today = LocalDate.now();
        return taskRepository.findByUserIdAndTaskDate(userId, today)
            .stream().map(this::mapTask).toList();
    }

    /**
     * POST /api/garden/select-seed — Select a seed for the current month.
     */
    @Transactional
    public GardenCurrentResponse selectSeed(UUID userId, SelectSeedRequest request) {
        featureGuard.assertEnabled();

        String seedId = request.getSeedId();
        FlowerTypeCode code = SEED_TO_FLOWER.get(seedId);
        if (code == null) {
            throw new RuntimeException("Invalid seedId: " + seedId);
        }

        FlowerType flowerType = flowerTypeRepository.findByCode(code)
            .orElseThrow(() -> new RuntimeException("FlowerType not found for code: " + code));

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = YearMonth.from(today).atEndOfMonth();

        // Find or create session
        PlantSession session = plantSessionRepository
            .findByUserIdAndMonthStart(userId, monthStart)
            .orElseGet(() -> {
                PlantSession newSession = new PlantSession();
                newSession.setUserId(userId);
                newSession.setFlowerType(flowerType);
                newSession.setMonthStart(monthStart);
                newSession.setMonthEnd(monthEnd);
                newSession.setSeedSelectedDate(today);
                newSession.setStatus(PlantSessionStatus.ACTIVE);
                newSession.setCurrentStage(FlowerStage.SEED);
                newSession.setCurrentQuality(FlowerQuality.AVERAGE);
                newSession.setCurrentScore(0);
                return plantSessionRepository.save(newSession);
            });

        // If session already exists, update seed
        if (session.getSeedSelectedDate() != null && !session.getSeedSelectedDate().equals(today)) {
            session.setFlowerType(flowerType);
            session.setSeedSelectedDate(today);
            plantSessionRepository.save(session);
        }

        return getCurrentGarden(userId);
    }

    /**
     * GET /api/garden/history — Past months' garden history.
     */
    public List<GardenHistoryResponse> getGardenHistory(UUID userId) {
        featureGuard.assertEnabled();

        // Return finalized/archived sessions, sorted by month descending
        List<PlantSession> finalized = new ArrayList<>();
        finalized.addAll(
            plantSessionRepository.findByStatusAndMonthEnd(PlantSessionStatus.FINALIZED, LocalDate.now().minusDays(1))
        );

        // Also find archived sessions for this user via a custom approach
        // Use all non-ACTIVE sessions for this user
        plantSessionRepository.findAll().stream()
            .filter(s -> s.getUserId().equals(userId))
            .filter(s -> s.getStatus() != PlantSessionStatus.ACTIVE)
            .sorted(Comparator.comparing(PlantSession::getMonthStart).reversed())
            .forEach(s -> {
                if (finalized.stream().noneMatch(f -> f.getPlantSessionId().equals(s.getPlantSessionId()))) {
                    finalized.add(s);
                }
            });

        return finalized.stream()
            .filter(s -> s.getUserId().equals(userId))
            .sorted(Comparator.comparing(PlantSession::getMonthStart).reversed())
            .map(this::mapHistory)
            .toList();
    }

    /**
     * GET /api/garden/month-report — Monthly report with replay timeline.
     */
    public GardenMonthReportResponse getMonthReport(UUID userId) {
        featureGuard.assertEnabled();

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = YearMonth.from(today).atEndOfMonth();

        PlantSession session = plantSessionRepository
            .findByUserIdAndMonthStart(userId, monthStart)
            .orElse(null);

        ScoreResult scoreResult = scoreService.calculateMonthlyScore(userId, monthStart, monthEnd);

        // Replay from snapshots
        List<GardenMonthReportResponse.ReplayEntry> replay = new ArrayList<>();
        if (session != null) {
            List<PlantStageSnapshot> snapshots = snapshotRepository
                .findByPlantSessionPlantSessionIdOrderBySnapshotDate(session.getPlantSessionId());
            for (PlantStageSnapshot snap : snapshots) {
                replay.add(GardenMonthReportResponse.ReplayEntry.builder()
                    .stage(mapStage(snap.getStage()))
                    .quality(snap.getQuality().name().toLowerCase())
                    .day(snap.getDayOfMonth())
                    .build());
            }
        }

        // If no snapshots, build a minimal replay from the current state
        if (replay.isEmpty() && session != null) {
            replay.add(GardenMonthReportResponse.ReplayEntry.builder()
                .stage(mapStage(session.getCurrentStage()))
                .quality(session.getCurrentQuality().name().toLowerCase())
                .day(today.getDayOfMonth())
                .build());
        }

        // Achievements
        List<String> achievements = generateAchievements(scoreResult, session);

        // Spending change (placeholder — would require comparing with previous month)
        double spendingChange = 0.0;

        return GardenMonthReportResponse.builder()
            .month(formatMonth(today))
            .year(today.getYear())
            .seed(resolveSeed(session))
            .finalScore(GardenScoreResponse.builder()
                .value(scoreResult.getScore())
                .label("Điểm tổng kết")
                .build())
            .savingsRate(scoreResult.getSavingsRatio() != null
                ? scoreResult.getSavingsRatio().doubleValue() : 0.0)
            .spendingChange(spendingChange)
            .achievements(achievements)
            .replay(replay)
            .build();
    }

    // ==================== PRIVATE HELPERS ====================

    private GardenFlowerStateResponse buildFlowerState(PlantSession session, int score, LocalDate today, LocalDate monthStart) {
        if (session == null) {
            return GardenFlowerStateResponse.builder()
                .stage("Seed")
                .quality("average")
                .progress(0.0)
                .build();
        }

        // Calculate progress through the month (0.0–1.0)
        long totalDays = ChronoUnit.DAYS.between(monthStart, YearMonth.from(today).atEndOfMonth()) + 1;
        long elapsed = ChronoUnit.DAYS.between(monthStart, today) + 1;
        double progress = Math.min(1.0, (double) elapsed / totalDays);

        // Stage derived from progress + score
        FlowerStage stage = resolveStage(progress, score);
        FlowerQuality quality = resolveQuality(score);

        // Update session if changed
        if (session.getCurrentStage() != stage || session.getCurrentQuality() != quality) {
            session.setCurrentStage(stage);
            session.setCurrentQuality(quality);
            session.setCurrentScore(score);
            plantSessionRepository.save(session);

            // Save snapshot
            saveSnapshot(session, today, stage, quality, score);
        }

        return GardenFlowerStateResponse.builder()
            .stage(mapStage(stage))
            .quality(quality.name().toLowerCase())
            .progress(Math.round(progress * 100.0) / 100.0)
            .build();
    }

    private FlowerStage resolveStage(double progress, int score) {
        if (progress < 0.1) return FlowerStage.SEED;
        if (progress < 0.25) return FlowerStage.SPROUT;
        if (progress < 0.45) return FlowerStage.YOUNG_PLANT;
        if (progress < 0.65) return FlowerStage.GROWING_PLANT;
        if (progress < 0.85 || score < 50) return FlowerStage.BUDDING;
        return FlowerStage.BLOOMING_FLOWER;
    }

    private FlowerQuality resolveQuality(int score) {
        if (score >= 80) return FlowerQuality.EXCELLENT;
        if (score >= 60) return FlowerQuality.GOOD;
        if (score >= 40) return FlowerQuality.AVERAGE;
        if (score >= 20) return FlowerQuality.POOR;
        return FlowerQuality.TERRIBLE;
    }

    private String resolveWeather(int score) {
        if (score >= 80) return "glowy";
        if (score >= 60) return "sunny";
        if (score >= 40) return "cloudy";
        if (score >= 20) return "rainy";
        return "stormy";
    }

    private String mapStage(FlowerStage stage) {
        return switch (stage) {
            case SEED -> "Seed";
            case SPROUT -> "Sprout";
            case YOUNG_PLANT -> "YoungPlant";
            case GROWING_PLANT -> "GrowingPlant";
            case BUDDING -> "Budding";
            case BLOOMING_FLOWER -> "Blooming";
        };
    }

    private GardenSeedResponse resolveSeed(PlantSession session) {
        if (session == null || session.getFlowerType() == null) {
            return SEED_CATALOG.get(0); // default seed
        }
        FlowerTypeCode code = session.getFlowerType().getCode();
        return SEED_TO_FLOWER.entrySet().stream()
            .filter(e -> e.getValue() == code)
            .findFirst()
            .map(e -> SEED_CATALOG.stream()
                .filter(s -> s.getSeedId().equals(e.getKey()))
                .findFirst()
                .orElse(SEED_CATALOG.get(0)))
            .orElse(SEED_CATALOG.get(0));
    }

    private String generateEncouragement(int score, int streak) {
        if (score >= 80) return "Tuyệt vời! Vườn hoa của bạn đang rực rỡ 🌸";
        if (score >= 60) return "Bạn đang làm rất tốt, cứ tiếp tục nhé 💪";
        if (score >= 40) return "Mỗi ngày một chút, vườn hoa sẽ nở thôi 🌱";
        if (streak >= 3) return "Chuỗi " + streak + " ngày liên tục! Giữ vững nhé ✨";
        return "Hãy bắt đầu với một thói quen nhỏ hôm nay 🌿";
    }

    private List<String> generateAchievements(ScoreResult scoreResult, PlantSession session) {
        List<String> achievements = new ArrayList<>();
        if (scoreResult.getScore() >= 80) achievements.add("Điểm chăm sóc xuất sắc (≥80)");
        if (scoreResult.getCompletedTasks() == scoreResult.getTotalTasks() && scoreResult.getTotalTasks() > 0) {
            achievements.add("Hoàn thành 100% nhiệm vụ trong tháng");
        }
        if (scoreResult.getSavingsRatio() != null && scoreResult.getSavingsRatio().compareTo(new BigDecimal("0.20")) >= 0) {
            achievements.add("Tiết kiệm ≥20% thu nhập");
        }
        if (session != null && session.getCurrentStage() == FlowerStage.BLOOMING_FLOWER) {
            achievements.add("Hoa đã nở rộ 🌺");
        }
        if (achievements.isEmpty()) {
            achievements.add("Bạn đã kiên nhẫn chăm sóc vườn hoa suốt tháng này");
        }
        return achievements;
    }

    private GardenTaskResponse mapTask(DailyFinancialTask task) {
        return GardenTaskResponse.builder()
            .taskId(task.getTaskId().toString())
            .title(task.getTitle())
            .description(task.getDescription())
            .xp(task.getXpReward())
            .completed(task.getStatus() == FinancialTaskStatus.COMPLETED)
            .build();
    }

    private GardenRewardResponse mapReward(GardenReward reward) {
        String badgeColor = switch (reward.getRewardType()) {
            case XP -> "#5ABCB4";
            case COSMETIC -> "#F0A0B8";
            case SCORE_BOOST -> "#E8B44C";
            case STREAK_BONUS -> "#98C4A0";
            case MUTATION_UNLOCK -> "#CDB8F7";
        };
        return GardenRewardResponse.builder()
            .rewardId(reward.getRewardId().toString())
            .title(reward.getRewardType().name().replace("_", " "))
            .description(reward.getRewardPayload() != null ? reward.getRewardPayload() : "Phần thưởng từ vườn hoa")
            .earnedAt(reward.getCreatedAt().toString())
            .badgeColor(badgeColor)
            .build();
    }

    private GardenHistoryResponse mapHistory(PlantSession session) {
        return GardenHistoryResponse.builder()
            .month(formatMonth(session.getMonthStart()))
            .year(session.getMonthStart().getYear())
            .seed(resolveSeed(session))
            .score(GardenScoreResponse.builder()
                .value(session.getFinalScore() != null ? session.getFinalScore() : session.getCurrentScore())
                .label("Điểm tháng")
                .build())
            .flower(GardenFlowerStateResponse.builder()
                .stage(mapStage(session.getCurrentStage()))
                .quality(session.getCurrentQuality().name().toLowerCase())
                .progress(1.0)
                .build())
            .completedAt(session.getFinalizedAt() != null
                ? session.getFinalizedAt().toString()
                : session.getUpdatedAt().toString())
            .build();
    }

    private void saveSnapshot(PlantSession session, LocalDate date, FlowerStage stage, FlowerQuality quality, int score) {
        Optional<PlantStageSnapshot> existing = snapshotRepository
            .findByPlantSessionPlantSessionIdAndSnapshotDate(session.getPlantSessionId(), date);
        if (existing.isPresent()) {
            PlantStageSnapshot snap = existing.get();
            snap.setStage(stage);
            snap.setQuality(quality);
            snap.setScore(score);
            snapshotRepository.save(snap);
        } else {
            PlantStageSnapshot snap = new PlantStageSnapshot();
            snap.setPlantSession(session);
            snap.setSnapshotDate(date);
            snap.setDayOfMonth(date.getDayOfMonth());
            snap.setStage(stage);
            snap.setQuality(quality);
            snap.setScore(score);
            snapshotRepository.save(snap);
        }
    }

    private void updateStreak(UUID userId) {
        LocalDate today = LocalDate.now();
        UserGardenStreak streak = streakRepository.findByUserId(userId)
            .orElseGet(() -> {
                UserGardenStreak newStreak = new UserGardenStreak();
                newStreak.setUserId(userId);
                return newStreak;
            });

        if (streak.getLastCompletedDate() == null || streak.getLastCompletedDate().isBefore(today.minusDays(1))) {
            streak.setCurrentStreak(1);
        } else if (streak.getLastCompletedDate().isBefore(today)) {
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        }
        // Same day — no change to streak

        streak.setLastCompletedDate(today);
        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }
        streakRepository.save(streak);
    }

    private List<DailyFinancialTask> generateDailyTasks(UUID userId, LocalDate date) {
        PlantSession session = plantSessionRepository
            .findByUserIdAndStatus(userId, PlantSessionStatus.ACTIVE)
            .orElse(null);

        List<DailyFinancialTask> tasks = new ArrayList<>();

        // Core daily tasks
        tasks.add(createTask(userId, session, date, FinancialTaskType.LOG_ALL_TRANSACTIONS,
            "Ghi chép chi tiêu", "Ghi lại tất cả giao dịch trong ngày", 5, 10));
        tasks.add(createTask(userId, session, date, FinancialTaskType.NO_UNNECESSARY_SPENDING,
            "Tránh chi tiêu không cần thiết", "Không chi tiêu cho những thứ chưa cần", 5, 8));
        tasks.add(createTask(userId, session, date, FinancialTaskType.REVIEW_BUDGETS,
            "Xem lại ngân sách", "Kiểm tra xem ngân sách còn trong giới hạn không", 3, 6));

        // Random bonus task
        if (Math.random() < 0.4) {
            tasks.add(createTask(userId, session, date, FinancialTaskType.BONUS_RANDOM,
                "Bonus: Tiết kiệm thêm", "Thử tiết kiệm thêm một khoản nhỏ hôm nay", 8, 15));
        }

        return taskRepository.saveAll(tasks);
    }

    private DailyFinancialTask createTask(UUID userId, PlantSession session, LocalDate date,
                                           FinancialTaskType type, String title, String description,
                                           int scoreDelta, int xpReward) {
        DailyFinancialTask task = new DailyFinancialTask();
        task.setUserId(userId);
        task.setPlantSession(session);
        task.setTaskDate(date);
        task.setTaskType(type);
        task.setTitle(title);
        task.setDescription(description);
        task.setScoreDelta(scoreDelta);
        task.setXpReward(xpReward);
        task.setIsRandom(type == FinancialTaskType.BONUS_RANDOM);
        task.setUpdatedAt(Instant.now());
        return task;
    }

    private String formatMonth(LocalDate date) {
        return date.format(DateTimeFormatter.ofPattern("MMMM yyyy", new Locale("vi")));
    }
}
