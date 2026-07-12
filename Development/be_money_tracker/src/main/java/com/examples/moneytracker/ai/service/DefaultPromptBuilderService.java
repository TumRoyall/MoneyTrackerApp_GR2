package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.PromptInput;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DefaultPromptBuilderService implements PromptBuilderService {

    // 16 EXPENSE categories + 5 INCOME categories matching app categories
    private static final String EXPENSE_CATEGORIES = """
        1. "Chưa phân loại" - Không xác định được
        2. "Thức ăn & Đồ uống" - Ăn uống: cơm, phở, cafe, trà sữa, bún, bánh, kem
        3. "Mua sắm" - Quần áo, giày dép, túi xách, trang sức, mỹ phẩm
        4. "Du lịch" - Vé máy bay, khách sạn, tour du lịch, nghỉ mát
        5. "Sức khỏe" - Thuốc, khám bệnh, viện phí, bảo hiểm
        6. "Giải trí" - Phim, game, karaoke, nhạc, concert, streaming
        7. "Thú cưng" - Thức ăn cho mèo/chó, thuốc thú y
        8. "Thực phẩm" - Rau củ, thịt, cá, gạo, sữa, nước
        9. "Điện tử" - Điện thoại, laptop, tai nghe, loa, sạc
        10. "Làm đẹp" - Son, kem, trang điểm, làm tóc, spa
        11. "Thể thao" - Gym, bơi lội, chạy bộ, sân bóng
        12. "Giáo dục" - Sách, khóa học, học phí, chứng chỉ
        13. "Giao thông" - Xăng, taxi, grab, bus, tàu lửa, bảo dưỡng
        14. "Nhà" - Tiền thuê nhà, điện, nước, gas, internet
        15. "Nợ" - Trả nợ, ghi nợ ai đó
        16. "Tiết kiệm" - Gửi tiết kiệm, đầu tư tích lũy
        """;

    private static final String INCOME_CATEGORIES = """
        1. "Chưa được phân loại" - Không xác định được
        2. "Lương" - Lương tháng, lương tuần, thu nhập công việc
        3. "Đầu tư" - Lãi đầu tư, cổ tức, lãi tiết kiệm
        4. "Tiền thưởng" - Thưởng tháng, thưởng Tết, quà tặng, lì xì
        5. "Kinh doanh" - Tiền bán hàng online, doanh thu kinh doanh nhỏ
        """;

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

        // Thêm danh mục để AI phân loại chính xác
        sb.append("Danh mục CHI TIÊU (EXPENSE) - 16 loại:\n");
        sb.append(EXPENSE_CATEGORIES).append("\n");

        sb.append("Danh mục THU NHẬP (INCOME) - 5 loại:\n");
        sb.append(INCOME_CATEGORIES).append("\n");

        sb.append("Tin nhắn người dùng: ").append(userMessage).append("\n\n");

        if ("LOG_TRANSACTION".equals(intent)) {
            sb.append("Người dùng muốn ghi giao dịch. Xác nhận thông tin (số tiền, danh mục) và hỏi họ có muốn lưu không.\n");
            sb.append("Lưu ý: Chỉ dùng danh mục từ danh sách trên.\n");
        } else {
            sb.append("Dựa trên dữ liệu trên và tin nhắn, hãy trả lời một cách tự nhiên. ");
            sb.append("Bạn có thể: trả lời câu hỏi chi tiêu, tư vấn tài chính, giải thích số liệu, hoặc đề xuất hành động. ");
            sb.append("Nếu người dùng hỏi về công cụ, tính năng nào đó, hãy giới thiệu ngắn gọn và hỏi họ có muốn dùng thử không. ");
            sb.append("Luôn kết thúc bằng một câu hỏi gợi ý để tiếp tục cuộc trò chuyện.\n");
        }

        return new PromptInput(sb.toString(), history != null ? history.stream().map(m -> (String) m.getOrDefault("message", "")).toList() : List.of());
    }
}