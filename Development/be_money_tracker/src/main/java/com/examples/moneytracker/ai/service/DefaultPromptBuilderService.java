package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.PromptInput;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DefaultPromptBuilderService implements PromptBuilderService {

    @Override
    public PromptInput buildPrompt(String intent, Map<String, Object> structuredResult, String userMessage, List<Map<String, Object>> history) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là trợ lý tài chính thân thiện, nói tiếng Việt.\n");
        sb.append("Trả lời ngắn gọn, ấm áp, tối đa 2-3 câu.\n\n");

        if (history != null && !history.isEmpty()) {
            sb.append("Lịch sử trò chuyện gần đây:\n");
            int start = Math.max(0, history.size() - 6);
            for (int i = start; i < history.size(); i++) {
                Map<String, Object> msg = history.get(i);
                sb.append(msg.getOrDefault("role", "?")).append(": ").append(msg.getOrDefault("message", "")).append("\n");
            }
            sb.append("\n");
        }

        sb.append("Dữ liệu tài chính của người dùng:\n");
        sb.append(structuredResult).append("\n\n");

        sb.append("Tin nhắn người dùng: ").append(userMessage).append("\n\n");

        if ("LOG_TRANSACTION".equals(intent)) {
            sb.append("Người dùng muốn ghi giao dịch. Xác nhận thông tin và hỏi họ có muốn lưu không.\n");
        } else {
            sb.append("Dựa trên dữ liệu trên và tin nhắn, hãy trả lời một cách tự nhiên. ");
            sb.append("Bạn có thể: trả lời câu hỏi chi tiêu, tư vấn tài chính, giải thích số liệu, hoặc đề xuất hành động. ");
            sb.append("Nếu người dùng hỏi về công cụ, tính năng nào đó, hãy giới thiệu ngắn gọn và hỏi họ có muốn dùng thử không. ");
            sb.append("Luôn kết thúc bằng một câu hỏi gợi ý để tiếp tục cuộc trò chuyện.\n");
        }

        return new PromptInput(sb.toString(), history != null ? history.stream().map(m -> (String) m.getOrDefault("message", "")).toList() : List.of());
    }
}