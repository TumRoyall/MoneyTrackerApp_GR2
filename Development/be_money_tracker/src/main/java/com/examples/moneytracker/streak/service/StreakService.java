package com.examples.moneytracker.streak.service;

import com.examples.moneytracker.streak.dto.AchievementResponse;
import com.examples.moneytracker.streak.dto.RecordActivityResponse;
import com.examples.moneytracker.streak.dto.StreakResponse;
import com.examples.moneytracker.streak.model.AchievementType;
import com.examples.moneytracker.streak.model.UserAchievement;
import com.examples.moneytracker.streak.model.UserStreak;
import com.examples.moneytracker.streak.repository.UserAchievementRepository;
import com.examples.moneytracker.streak.repository.UserStreakRepository;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final UserStreakRepository streakRepo;
    private final UserAchievementRepository achievementRepo;
    private final TransactionRepository transactionRepo;

    @Transactional
    public StreakResponse getStreak(UUID userId) {
        UserStreak streak = streakRepo.findById(userId).orElseGet(() -> {
            UserStreak newStreak = new UserStreak();
            newStreak.setUserId(userId);
            return streakRepo.save(newStreak);
        });

        // Check if streak is broken
        LocalDate today = LocalDate.now();
        if (streak.getLastActiveDate() != null && streak.getLastActiveDate().isBefore(today.minusDays(1))) {
            streak.setCurrentStreak(0);
            streak = streakRepo.save(streak);
        }

        // Calculate remaining hours until reset
        long remainingHours = 0;
        if (streak.getLastActiveDate() != null) {
            int currentHour = LocalDateTime.now().getHour();
            if (streak.getLastActiveDate().equals(today)) {
                remainingHours = 24 + (24 - currentHour);
            } else if (streak.getLastActiveDate().equals(today.minusDays(1))) {
                remainingHours = 24 - currentHour;
            }
        }

        // Get active dates for current month
        LocalDate startOfMonth = YearMonth.now().atDay(1);
        LocalDate endOfMonth = YearMonth.now().atEndOfMonth();
        List<LocalDate> activeDates = transactionRepo.findDistinctDatesByUserIdAndDateBetween(userId, startOfMonth, endOfMonth);

        // Map achievements
        List<AchievementResponse> achievements = achievementRepo.findByUserIdOrderByAchievedAtDesc(userId)
                .stream().map(this::mapAchievement).collect(Collectors.toList());

        return new StreakResponse(
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getLastActiveDate(),
                streak.getStreakStartDate(),
                (int) remainingHours,
                streak.getTotalActiveDays(),
                activeDates,
                achievements
        );
    }

    @Transactional
    public RecordActivityResponse recordActivity(UUID userId) {
        UserStreak streak = streakRepo.findById(userId).orElseGet(() -> {
            UserStreak newStreak = new UserStreak();
            newStreak.setUserId(userId);
            return newStreak;
        });

        LocalDate today = LocalDate.now();
        boolean isNewDay = false;

        if (streak.getLastActiveDate() == null || streak.getLastActiveDate().isBefore(today)) {
            isNewDay = true;
            streak.setTotalActiveDays(streak.getTotalActiveDays() + 1);

            if (streak.getLastActiveDate() == null || streak.getLastActiveDate().isBefore(today.minusDays(1))) {
                // Streak broken, start new
                streak.setCurrentStreak(1);
                streak.setStreakStartDate(today);
            } else {
                // Streak maintained
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
            }

            streak.setLastActiveDate(today);
            if (streak.getCurrentStreak() > streak.getLongestStreak()) {
                streak.setLongestStreak(streak.getCurrentStreak());
            }

            streakRepo.save(streak);
        }

        List<AchievementResponse> newAchievements = new ArrayList<>();
        if (isNewDay) {
            newAchievements = checkAndGrantAchievements(userId, streak);
        }

        return new RecordActivityResponse(
                true,
                streak.getCurrentStreak(),
                isNewDay,
                newAchievements
        );
    }

    private List<AchievementResponse> checkAndGrantAchievements(UUID userId, UserStreak streak) {
        List<UserAchievement> granted = new ArrayList<>();

        // LONGEST_STREAK levels: 2, 7, 15, 30
        int current = streak.getCurrentStreak();
        int[] milestones = {2, 7, 15, 30, 60, 100};
        for (int m : milestones) {
            if (current >= m && !achievementRepo.existsByUserIdAndTypeAndLevel(userId, AchievementType.LONGEST_STREAK, m)) {
                granted.add(grantAchievement(userId, AchievementType.LONGEST_STREAK, m, "Chuỗi " + m + " ngày"));
            }
        }

        // PERFECT_WEEK
        if (current >= 7 && !achievementRepo.existsByUserIdAndTypeAndLevel(userId, AchievementType.PERFECT_WEEK, 1)) {
            granted.add(grantAchievement(userId, AchievementType.PERFECT_WEEK, 1, "Tuần hoàn hảo"));
        }

        // PERFECT_MONTH
        if (current >= 30 && !achievementRepo.existsByUserIdAndTypeAndLevel(userId, AchievementType.PERFECT_MONTH, 1)) {
            granted.add(grantAchievement(userId, AchievementType.PERFECT_MONTH, 1, "Tháng hoàn hảo"));
        }

        return granted.stream().map(this::mapAchievement).collect(Collectors.toList());
    }

    private UserAchievement grantAchievement(UUID userId, AchievementType type, int level, String context) {
        UserAchievement a = new UserAchievement();
        a.setUserId(userId);
        a.setType(type);
        a.setLevel(level);
        a.setContextJson(context);
        return achievementRepo.save(a);
    }

    private AchievementResponse mapAchievement(UserAchievement a) {
        return new AchievementResponse(
                a.getAchievementId(),
                a.getType(),
                a.getLevel(),
                a.getAchievedAt(),
                getAchievementTitle(a.getType()),
                a.getContextJson(),
                getAchievementIcon(a.getType())
        );
    }

    private String getAchievementTitle(AchievementType type) {
        return switch (type) {
            case LONGEST_STREAK -> "Chuỗi Dài Nhất";
            case PERFECT_WEEK -> "Tuần Hoàn Hảo";
            case PERFECT_MONTH -> "Tháng Hoàn Hảo";
            case BUDGET_GUARDIAN -> "Bảo Vệ Ngân Sách";
            case TREASURE_KEEPER -> "Giữ Kho Báu";
            case DEBT_CRUSHER -> "Nghiền Nát Nợ";
        };
    }

    private String getAchievementIcon(AchievementType type) {
        return switch (type) {
            case LONGEST_STREAK -> "🏅";
            case PERFECT_WEEK -> "📅";
            case PERFECT_MONTH -> "🗓️";
            case BUDGET_GUARDIAN -> "🛡️";
            case TREASURE_KEEPER -> "💰";
            case DEBT_CRUSHER -> "💥";
        };
    }
}
