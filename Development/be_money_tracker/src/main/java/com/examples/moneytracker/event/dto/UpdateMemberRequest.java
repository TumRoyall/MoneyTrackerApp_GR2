package com.examples.moneytracker.event.dto;

import com.examples.moneytracker.event.model.EventMemberRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request to update an existing event member (OWNER only).
 * Tất cả field optional — chỉ update field nào được gửi.
 *
 * Quy tắc liên quan đến guest:
 *   - Nếu update guestEmail và member là guest → guestName tự động = guestEmail mới
 *     (trừ khi admin đã override tên qua displayName trong cùng request).
 *   - Nếu update displayName → đổi guestName cho guest; bị bỏ qua cho user thật
 *     (vì user thật lấy tên từ User entity).
 */
@Data
public class UpdateMemberRequest {

    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    private String displayName;

    private EventMemberRole role;

    /**
     * Chỉ áp dụng cho guest member. Khi update:
     *   - guestEmail mới sẽ làm guestName tự động cập nhật (nếu không có displayName override).
     *   - Validate không trùng email khác trong cùng event.
     */
    @Email(message = "Email không hợp lệ")
    @Size(max = 255)
    private String guestEmail;
}