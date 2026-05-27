package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.IntentResult;
import com.examples.moneytracker.ai.enums.IntentType;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Pattern;

@Service
public class RuleBasedIntentDetectionService implements IntentDetectionService {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(?i)(\\d+[.,]?\\d*)\\s*(k|ngan|nghin|tr|trieu|m|million)?");

    @Override
    public IntentResult detectIntent(String text) {
        String raw = text == null ? "" : text.toLowerCase().trim();
        String lower = normalize(raw);

        if (lower.contains("budget") || lower.contains("ngan sach") || lower.contains("han muc")
                || lower.contains("con bao nhieu") || lower.contains("con lai")) {
            return new IntentResult(IntentType.BUDGET_QUERY, 0.9, Map.of());
        }

        if (lower.contains("nhieu nhat") || lower.contains("tieu nhieu") || lower.contains("chi nhieu")
                || lower.contains("chi tieu") || lower.contains("tieu bao nhieu")
                || lower.contains("tong chi") || lower.contains("thu nhap") || lower.contains("thu vao")
                || lower.contains("bao nhieu") && lower.contains("chi")
                || lower.contains("thang nay") || lower.contains("tuan nay")
                || lower.contains("so voi") && lower.contains("thang")
                || lower.contains("nhieu nhat") || lower.contains("top")) {
            return new IntentResult(IntentType.SPENDING_QUERY, 0.85, Map.of());
        }

        if (lower.contains("insight") || lower.contains("goi y tai chinh") || lower.contains("goi y")
                || lower.contains("phat hien") || lower.contains("bat thuong") || lower.contains("hanh vi")
                || lower.contains("sigmal") || lower.contains("anomally")) {
            return new IntentResult(IntentType.INSIGHT_REQUEST, 0.8, Map.of());
        }

        if (lower.contains("tu van") || lower.contains("loi khuyen") || lower.contains("khuyen")
                || lower.contains("nen lam") || lower.contains("nen") && lower.contains("chi tieu")
                || lower.contains("cach") || lower.contains("lam sao") || lower.contains("chi tieu tot")
                || lower.contains("advice") || lower.contains("coaching") || lower.contains("recommend")
                || lower.contains("meo") || lower.contains("bi quyet")
                || lower.contains("dau tu") || lower.contains("tiet kiem") || lower.contains("de xuat")
                || lower.contains("cong cu") || lower.contains("giam chi tieu")) {
            return new IntentResult(IntentType.COACHING, 0.85, Map.of());
        }

        if (AMOUNT_PATTERN.matcher(raw).find()) {
            return new IntentResult(IntentType.LOG_TRANSACTION, 0.7, Map.of());
        }

        return new IntentResult(IntentType.UNKNOWN, 0.3, Map.of());
    }

    private static String normalize(String s) {
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            sb.append(normalizeChar(s.charAt(i)));
        }
        return sb.toString();
    }

    private static char normalizeChar(char c) {
        return switch (c) {
            case 'á', 'à', 'ả', 'ã', 'ạ', 'ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ', 'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ' -> 'a';
            case 'é', 'è', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ' -> 'e';
            case 'í', 'ì', 'ỉ', 'ĩ', 'ị' -> 'i';
            case 'ó', 'ò', 'ỏ', 'õ', 'ọ', 'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ', 'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ' -> 'o';
            case 'ú', 'ù', 'ủ', 'ũ', 'ụ', 'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự' -> 'u';
            case 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ' -> 'y';
            case 'đ' -> 'd';
            default -> c;
        };
    }
}