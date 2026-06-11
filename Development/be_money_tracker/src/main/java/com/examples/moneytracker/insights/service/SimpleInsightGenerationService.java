package com.examples.moneytracker.insights.service;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.insights.dto.InsightResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SimpleInsightGenerationService implements InsightGenerationService {

    @Override
    public List<InsightResponse> generate(List<BehaviorSignalDto> signals) {
        List<InsightResponse> insights = new ArrayList<>();
        for (BehaviorSignalDto signal : signals) {
            String message = formatInsight(signal);
            if (message != null) {
                insights.add(new InsightResponse(signal.getType(), signal.getSeverity(), message));
            }
        }
        return insights;
    }

    private String formatInsight(BehaviorSignalDto signal) {
        return switch (signal.getType()) {
            case "WEEKEND_SPIKE" ->
                    "Bạn có xu hướng chi tiêu cuối tuần cao hơn ngày thường. Hãy thử lên kế hoạch chi tiêu cuối tuần trước để kiểm soát tốt hơn.";
            case "HIGH_CATEGORY_CONCENTRATION" ->
                    "Chi tiêu của bạn đang tập trung nhiều vào một danh mục. Cân nhắc phân bổ lại để đa dạng hóa chi tiêu.";
            case "LARGE_TRANSACTION_ANOMALY" ->
                    "Phát hiện một giao dịch lớn bất thường. Hãy kiểm tra lại để đảm bảo không có sai sót.";
            case "NO_RECENT_INCOME" ->
                    "Bạn chưa ghi nhận khoản thu nhập nào gần đây. Hãy cập nhật thu nhập để có bức tranh tài chính chính xác.";
            case "FREQUENT_SPENDING" ->
                    "Bạn đang có quá nhiều giao dịch nhỏ. Thử gộp các khoản chi để dễ theo dõi hơn.";
            default -> null;
        };
    }
}
