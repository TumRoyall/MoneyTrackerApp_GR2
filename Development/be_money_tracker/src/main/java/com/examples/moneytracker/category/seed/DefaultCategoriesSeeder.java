package com.examples.moneytracker.category.seed;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Seeds the 17 system root categories on first boot. Each Group in
 * {@link CategoryGroups} becomes a Category row with userId=NULL and
 * isDefault=true. Idempotent: if a categoryId already exists, the row is
 * skipped. Safe to run on every startup.
 *
 * The same set of categories is also seeded locally on the device via
 * app_moneytracker migration v5, and the deterministic UUIDs match because
 * both sides use the same (namespace, groupId, icon) tuple in
 * {@link CategoryIdGenerator}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DefaultCategoriesSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<CategoryGroups.Group> groups = CategoryGroups.all();
        int totalGroups = groups.size();
        int inserted = 0;
        int skipped = 0;

        for (CategoryGroups.Group group : groups) {
            UUID categoryId = CategoryIdGenerator.derive(group.id(), group.icon());
            if (categoryRepository.existsById(categoryId)) {
                skipped++;
                continue;
            }
            Category c = new Category();
            c.setCategoryId(categoryId);
            c.setUserId(null);
            c.setGroupId(group.id());
            c.setName(group.name());
            c.setType(group.type());
            c.setIcon(group.icon());
            c.setColor(group.color());
            c.setIsDefault(true);
            c.setIsHidden(false);
            // PrePersist sets createdAt/updatedAt to Instant.now() — fine
            // for a one-time seed at startup.
            categoryRepository.save(c);
            inserted++;
        }

        log.info("DefaultCategoriesSeeder: processed {} categories (inserted={}, skipped={})",
            totalGroups, inserted, skipped);
    }
}
