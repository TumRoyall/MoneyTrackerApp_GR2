package com.examples.moneytracker.category.seed;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

/**
 * Generates a deterministic UUID from (groupId, icon) using UUIDv5-style SHA-1
 * hashing. Must produce the SAME UUID as the client's
 * {@code deriveDefaultCategoryId} in app_moneytracker/src/core/db/migrations.ts
 * so that transaction.categoryId resolves on both sides.
 *
 * Algorithm:
 *   1. SHA-1(UTF-8(namespace + ':' + groupId + ':' + icon)) -> 40 hex chars
 *   2. Take first 32 hex chars (16 bytes)
 *   3. Set version=5 in byte 6 high nibble
 *   4. Set variant=10xx in byte 8 top 2 bits
 *   5. Format as standard UUID string
 */
public final class CategoryIdGenerator {

    private CategoryIdGenerator() {}

    public static UUID derive(String groupId, String icon) {
        String input = CategoryGroups.NAMESPACE + ":" + groupId + ":" + icon;
        byte[] hash = sha1(input);
        String hex = toHex(hash).substring(0, 32);

        byte[] bytes = new byte[16];
        for (int i = 0; i < 16; i++) {
            bytes[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        // version 5: high 4 bits of byte 6 = 0101
        bytes[6] = (byte) ((bytes[6] & 0x0f) | (5 << 4));
        // variant 10xx: top 2 bits of byte 8 = 10
        bytes[8] = (byte) ((bytes[8] & 0x3f) | (0x8 << 5));

        long msb = 0;
        long lsb = 0;
        for (int i = 0; i < 8; i++) msb = (msb << 8) | (bytes[i] & 0xff);
        for (int i = 8; i < 16; i++) lsb = (lsb << 8) | (bytes[i] & 0xff);
        return new UUID(msb, lsb);
    }

    private static byte[] sha1(String input) {
        try {
            return MessageDigest.getInstance("SHA-1").digest(input.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 not available", e);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }
}
