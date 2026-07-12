# Kaggle AI Training Pipeline v2 - Transaction Classification

## Tổng quan Pipeline

```
Input Text → [Step 1: Regex Extract Amount] → [Step 2: LLM Classify Category] → Output JSON
```

## Step 1: Regex Extract Amount

```python
import re

AMOUNT_PATTERN = re.compile(r'(?i)(\d+[.,]?\d*)\s*(k|ngan|nghin|tr|trieu|m|million)?')

def extract_amount(text: str) -> int:
    """Convert amount string to VND integer"""
    matcher = AMOUNT_PATTERN.search(text)
    if not matcher:
        return 0
    
    value = float(matcher.group(1).replace(',', '.'))
    suffix = matcher.group(2)
    
    if suffix:
        s = suffix.lower()
        if s in ['k', 'ngan', 'nghin']:
            value *= 1000
        elif s in ['tr', 'trieu', 'm', 'million']:
            value *= 1_000_000
    
    return int(value)

# Examples:
# "cafe 35k" → 35000
# "mua áo 200k" → 200000
# "ăn phở 45k" → 45000
# "mua iphone 30tr" → 30000000
# "đi du lịch 2tr5" → 2500000
```

## Step 2: LLM Category Classification

### System Prompt cho Kaggle Fine-tuning

```
Bạn là chuyên gia bóc tách dữ liệu giao dịch tài chính cá nhân.
Nhiệm vụ: Phân loại giao dịch từ câu nói của người dùng.

## CÁCH LÀM VIỆC
1. Đọc câu nói người dùng
2. Xác định loại giao dịch (INCOME/EXPENSE)
3. Chọn đúng 1 danh mục từ danh sách cho phép

## QUY TẮC PHÂN LOẠI

### type: "EXPENSE" (chi tiêu) nếu:
- Mua sắm, tiêu tiền, trả tiền
- Các từ: mua, ăn, uống, trả, thuê, xăng, vé, vé máy bay, đi chơi, giải trí, khám, mua thuốc...

### type: "INCOME" (thu nhập) nếu:
- Nhận tiền, được tiền, lương, thưởng, lãi, đầu tư lãi
- Các từ: nhận, được, lương, thưởng, lãi, cổ tức, chia lãi, bán được

## DANH MỤC CHO PHÉP (BẮT BUỘC)

### EXPENSE (Chỉ chọn 1):
1. "Chưa phân loại" - Không xác định được
2. "Thức ăn & Đồ uống" - Ăn uống: cơm, phở, cafe, trà sữa, bún, bánh, kem, ăn trưa, ăn sáng
3. "Mua sắm" - Quần áo, giày dép, túi xách, trang sức, mỹ phẩm, đồ gia dụng
4. "Du lịch" - Vé máy bay, khách sạn, tour du lịch, nghỉ mát
5. "Sức khỏe" - Thuốc, khám bệnh, viện phí, bảo hiểm y tế, vitamin
6. "Giải trí" - Phim, game, karaoke, nhạc, concert, YouTube premium, Netflix
7. "Thú cưng" - Thức ăn cho mèo/chó, thuốc thú y, spa thú cưng
8. "Thực phẩm" - Rau củ, thịt, cá, gạo, sữa, nước uống về nấu ăn
9. "Điện tử" - Điện thoại, laptop, tai nghe, loa, sạc dự phòng
10. "Làm đẹp" - Son, kem, trang điểm, làm tóc, spa, massage, skincare
11. "Thể thao" - Gym, bơi lội, chạy bộ, sân bóng, giày thể thao
12. "Giáo dục" - Sách, khóa học, học phí, chứng chỉ, dụng cụ học tập
13. "Giao thông" - Xăng, taxi, grab, bus, tàu lửa, bảo dưỡng xe, vé cầu đường
14. "Nhà" - Tiền thuê nhà, điện, nước, gas, internet, sửa chữa nhà
15. "Nợ" - Trả nợ, ghi nợ ai đó
16. "Tiết kiệm" - Gửi tiết kiệm, đầu tư tích lũy

### INCOME (Chỉ chọn 1):
1. "Chưa được phân loại" - Không xác định được
2. "Lương" - Lương tháng, lương tuần, thu nhập công việc
3. "Đầu tư" - Lãi đầu tư, cổ tức, lãi tiết kiệm, bán cổ phiếu lãi
4. "Tiền thưởng" - Thưởng tháng, thưởng Tết, quà tặng, lì xì, hoa hồng
5. "Kinh doanh" - Tiền bán hàng online, doanh thu kinh doanh nhỏ

## VÍ DỤ INPUT/OUTPUT

Input: "đi ăn phở 45k"
Output: {"amount": 45000, "type": "EXPENSE", "category": "Thức ăn & Đồ uống", "note": "đi ăn phở"}

Input: "lĩnh lương tháng 15tr"
Output: {"amount": 15000000, "type": "INCOME", "category": "Lương", "note": "lĩnh lương tháng"}

Input: "mua áo 200k"
Output: {"amount": 200000, "type": "EXPENSE", "category": "Mua sắm", "note": "mua áo"}

Input: "xăng xe 80k"
Output: {"amount": 80000, "type": "EXPENSE", "category": "Giao thông", "note": "xăng xe"}

Input: "thưởng tết được 5tr"
Output: {"amount": 5000000, "type": "INCOME", "category": "Tiền thưởng", "note": "thưởng tết"}

Input: "uống cafe 35k"
Output: {"amount": 35000, "type": "EXPENSE", "category": "Thức ăn & Đồ uống", "note": "uống cafe"}

Input: "trả tiền thuê nhà 5tr"
Output: {"amount": 5000000, "type": "EXPENSE", "category": "Nhà", "note": "trả tiền thuê nhà"}

Input: "mua thịt nấu cơm 150k"
Output: {"amount": 150000, "type": "EXPENSE", "category": "Thực phẩm", "note": "mua thịt nấu cơm"}

## LƯU Ý QUAN TRỌNG
- Chỉ trả về JSON, không thêm text giải thích
- amount luôn là số nguyên (VND)
- category phải khớp CHÍNH XÁC với tên trong danh sách
- Nếu không chắc chắn, dùng "Chưa phân loại" hoặc "Chưa được phân loại"
```

## Dataset Format cho Kaggle

```csv
text,amount,type,category,note
"ăn phở 45k",45000,"EXPENSE","Thức ăn & Đồ uống","ăn phở"
"lĩnh lương tháng 15tr",15000000,"INCOME","Lương","lĩnh lương tháng"
"mua áo 200k",200000,"EXPENSE","Mua sắm","mua áo"
...
```

## Training Command mẫu

```python
# Sử dụng Hugging Face transformers để fine-tune
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, Trainer, TrainingArguments
from datasets import Dataset

# Load model
model_name = "google/flan-t5-small"  # Hoặc model nhỏ hơn cho fast training
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Prepare dataset
def preprocess_function(examples):
    inputs = [f"Phân loại giao dịch: {text}" for text in examples["text"]]
    targets = [f'{{"amount":{a},"type":"{t}","category":"{c}","note":"{n}"}}' 
               for a, t, c, n in zip(examples["amount"], examples["type"], examples["category"], examples["note"])]
    
    model_inputs = tokenizer(inputs, max_length=128, truncation=True, padding="max_length")
    labels = tokenizer(targets, max_length=128, truncation=True, padding="max_length")
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

# Train
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    learning_rate=3e-4,
    fp16=True,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"],
)

trainer.train()
```

## Inference Pipeline

```python
import re

AMOUNT_PATTERN = re.compile(r'(?i)(\d+[.,]?\d*)\s*(k|ngan|nghin|tr|trieu|m|million)?')

def extract_amount(text: str) -> int:
    matcher = AMOUNT_PATTERN.search(text)
    if not matcher:
        return 0
    value = float(matcher.group(1).replace(',', '.'))
    suffix = matcher.group(2)
    if suffix:
        s = suffix.lower()
        if s in ['k', 'ngan', 'nghin']:
            value *= 1000
        elif s in ['tr', 'trieu', 'm', 'million']:
            value *= 1_000_000
    return int(value)

def predict_transaction(text: str, model, tokenizer) -> dict:
    amount = extract_amount(text)
    
    # Prompt cho model
    prompt = f"Phân loại giao dịch: {text}"
    
    # Generate response
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs, max_length=128)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Parse JSON response
    import json
    result = json.loads(response)
    result["amount"] = amount  # Override với regex để đảm bảo chính xác
    
    return result

# Ví dụ:
# text = "ăn phở 45k"
# amount = extract_amount(text)  # 45000
# result = predict_transaction(text, model, tokenizer)
# Output: {"amount": 45000, "type": "EXPENSE", "category": "Thức ăn & Đồ uống", "note": "ăn phở"}
```

## Các Keywords cho từng Category

### EXPENSE Keywords
| Category | Keywords |
|----------|----------|
| Thức ăn & Đồ uống | ăn, uống, cafe, cà phê, trà, sữa, phở, bún, cơm, bánh, kem, bữa, nấu ăn |
| Mua sắm | mua, áo quần, giày, túi, trang sức, shop, mall, tiki, shopee |
| Du lịch | đi chơi, du lịch, vé máy bay, khách sạn, resort, nghỉ mát, tour |
| Sức khỏe | thuốc, khám, bệnh viện, viện, bảo hiểm, vitamin, thuốc bổ |
| Giải trí | phim, game, netflix, youtube, karaoke, nhạc, concert |
| Thú cưng | mèo, chó, pet, thức ăn cho mèo/chó, spa thú cưng |
| Thực phẩm | rau, thịt, cá, gạo, sữa, nước, tạp hóa, siêu thị |
| Điện tử | điện thoại, laptop, tai nghe, sạc, loa, camera, máy tính |
| Làm đẹp | son, kem, trang điểm, tóc, spa, massage, skincare, nail |
| Thể thao | gym, bơi, chạy, bóng đá, sân, tập gym, fitness, yoga |
| Giáo dục | sách, học, khóa học, coursera, udemy, học phí |
| Giao thông | xăng, taxi, grab, bus, tàu, bảo dưỡng xe, vé, sửa xe |
| Nhà | thuê nhà, điện, nước, gas, internet, wifi, sửa nhà |
| Nợ | trả nợ, ghi nợ, vay nợ |
| Tiết kiệm | gửi tiết kiệm, tích lũy |

### INCOME Keywords
| Category | Keywords |
|----------|----------|
| Lương | lương, thu nhập, lĩnh lương, nhận lương, trả lương |
| Đầu tư | lãi, cổ tức, đầu tư, chứng khoán, bán cổ phiếu |
| Tiền thưởng | thưởng, lì xì, quà, hoa hồng, commission |
| Kinh doanh | bán hàng, kinh doanh, doanh thu, buôn bán |
