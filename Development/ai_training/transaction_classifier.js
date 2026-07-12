/**
 * Transaction Classification - Regex Version
 * ================================
 *
 * Pipeline: Regex Extract Amount → Context Patterns → Keyword Matching → Output
 *
 * Usage:
 *   import { parseTransaction } from './transaction_classifier';
 *   const result = parseTransaction("ăn phở 45k");
 *   // => { amount: 45000, type: "EXPENSE", category: "Thức ăn & Đồ uống", categoryId: "food", originalText: "ăn phở 45k" }
 */

// ============================================================
// CATEGORY CONFIG
// ============================================================

export const CATEGORY_ID_MAP = {
  "Chưa phân loại": "uncategorized",
  "Chưa được phân loại": "uncategorized_income",
  "Thức ăn & Đồ uống": "food",
  "Mua sắm": "shopping",
  "Du lịch": "travel",
  "Sức khỏe": "health",
  "Giải trí": "entertainment",
  "Thú cưng": "pet",
  "Thực phẩm": "grocery",
  "Điện tử": "electronics",
  "Làm đẹp": "beauty",
  "Thể thao": "sports",
  "Giáo dục": "education",
  "Giao thông": "transport",
  "Nhà": "home",
  "Nợ": "debt",
  "Tiết kiệm": "savings",
  "Lương": "salary",
  "Đầu tư": "investment",
  "Tiền thưởng": "bonus",
  "Kinh doanh": "business",
};

export const CATEGORY_TYPE = {
  "Chưa phân loại": "EXPENSE",
  "Thức ăn & Đồ uống": "EXPENSE",
  "Mua sắm": "EXPENSE",
  "Du lịch": "EXPENSE",
  "Sức khỏe": "EXPENSE",
  "Giải trí": "EXPENSE",
  "Thú cưng": "EXPENSE",
  "Thực phẩm": "EXPENSE",
  "Điện tử": "EXPENSE",
  "Làm đẹp": "EXPENSE",
  "Thể thao": "EXPENSE",
  "Giáo dục": "EXPENSE",
  "Giao thông": "EXPENSE",
  "Nhà": "EXPENSE",
  "Nợ": "EXPENSE",
  "Tiết kiệm": "EXPENSE",
  "Chưa được phân loại": "INCOME",
  "Lương": "INCOME",
  "Đầu tư": "INCOME",
  "Tiền thưởng": "INCOME",
  "Kinh doanh": "INCOME",
};

// ============================================================
// CONTEXT PATTERNS - Ưu tiên cao nhất
// ============================================================

export const CONTEXT_PATTERNS = [
  // INCOME patterns (ưu tiên cao vì dễ nhận biết)
  { pattern: /lương|thu lương|lĩnh lương/gi, category: "Lương" },
  { pattern: /thưởng tháng|thưởng quý|thưởng năm|thưởng tết|thưởng\b/gi, category: "Tiền thưởng" },
  { pattern: /lì xì|lixi|li xì|ang pow/gi, category: "Tiền thưởng" },
  { pattern: /cổ tức|lãi suất|lãi đầu tư|lãi tiết kiệm/gi, category: "Đầu tư" },
  { pattern: /bán hàng online|bán hàng|doanh thu kinh doanh/gi, category: "Kinh doanh" },

  // EXPENSE patterns cụ thể
  { pattern: /netflix|spotify|youtube premium|disney\+|prime video|apple tv|hbo|hbo max/gi, category: "Giải trí" },
  { pattern: /game\b|gaming|steam|epic games|playstation|xbox/gi, category: "Giải trí" },
  { pattern: /gym|tập gym|phòng gym|thẻ gym|vô gym|vào gym/gi, category: "Thể thao" },
  { pattern: /khám bệnh|bệnh viện|bác sĩ|bs\b|phòng khám/gi, category: "Sức khỏe" },
  { pattern: /grab\b|taxi\b|uber\b|be\b|gojek/gi, category: "Giao thông" },
  { pattern: /xăng|dầu xe|nhiên liệu/gi, category: "Giao thông" },
  { pattern: /xe máy|máy bay|vé máy bay/gi, category: "Giao thông" },
  { pattern: /siêu thị|chợ|tạp hóa|market\b|mart\b|sieu thi/gi, category: "Thực phẩm" },
  { pattern: /son môi|mỹ phẩm|làm tóc|cắt tóc|nhuộm tóc/gi, category: "Làm đẹp" },
  { pattern: /spa\b|massage\b|matxa\b/gi, category: "Làm đẹp" },
  { pattern: /sách giáo khoa|sách tham khảo|khóa học|học phí|trường\b|lớp\b|udemy|coursera/gi, category: "Giáo dục" },
  { pattern: /thuê nhà|tiền nhà|tiền thuê/gi, category: "Nhà" },
  { pattern: /tiền điện|tiền nước|tiền internet|wifi\b/gi, category: "Nhà" },
  { pattern: /trả nợ|ghi nợ|vay nợ|nợ\b/gi, category: "Nợ" },
  { pattern: /gửi tiết kiệm/gi, category: "Tiết kiệm" },
  { pattern: /điện thoại|smartphone|iphone|samsung|laptop/gi, category: "Điện tử" },
  { pattern: /áo|quần|váy|giày|dép|túi xách|balo/gi, category: "Mua sắm" },
  { pattern: /khách sạn|resort|du lịch|nghỉ mát|vacation|travel/gi, category: "Du lịch" },
  { pattern: /chó|mèo|cá|bird|pets?|thú cưng/gi, category: "Thú cưng" },
];

// ============================================================
// NEGATIVE KEYWORDS - Loại trừ category sai
// ============================================================

export const NEGATIVE_KEYWORDS = {
  "Thực phẩm": ["xe máy", "ô tô", "xăng", "sửa nhà", "laptop", "điện thoại", "áo", "quần"],
  "Giao thông": ["thịt", "cá", "rau", "siêu thị", "chợ", "son", "mỹ phẩm"],
  "Giải trí": ["thịt", "cá", "thuốc", "áo", "quần"],
  "Sức khỏe": ["xăng", "thịt", "laptop", "áo", "quần"],
  "Mua sắm": ["ăn", "uống", "thịt", "cá", "rau", "xăng", "khám"],
};

// ============================================================
// KEYWORDS - Thấp hơn Context Patterns
// ============================================================

export const CATEGORY_KEYWORDS = {
  "Chưa phân loại": ["khác", "linh tinh", "tổng", "chung", "misc", "chi phí", "chi tiêu"],
  "Chưa được phân loại": ["khác", "linh tinh", "tổng", "chung", "misc", "thu nhập"],

  "Thức ăn & Đồ uống": [
    "phở", "bún", "cơm", "bánh", "café", "cà phê", "trà sữa", "bánh mì", "pizza", "burger",
    "gà", "lẩu", "nướng", "ăn", "uống", "bia", "kem", "salad", "cháo", "xôi", "tra sua",
    "sinh tố", "cafe", "coffee", "bánh bao", "cơm rang", "táo", "hoa quả", "trái cây",
    "thịt bò", "thịt heo", "thịt gà", "cá", "tôm", "cua", "rau", "trứng", "sữa", "gạo",
    "bánh pizza", "gà rán", "cà rốt", "rau muống", "khoai", "đậu", "nấm", "chả", "nem",
    "bún bò", "bún rieu", "hủ tiếu", "cao lầu", "cơm tấm", "bánh xèo", "chè",
    "cappuccino", "latte", "mocha", "espresso", "american", "yaourt", "sữa chua",
  ],

  "Mua sắm": [
    "áo", "quần", "váy", "đầm", "áo sơ mi", "áo thun", "quần jeans", "giày", "dép",
    "túi xách", "balo", "nón", "mũ", "thắt lưng", "đồng hồ", "trang sức", "shopping",
    "shop", "fashion", "clothing", "shoes", "bag", "wallet", "belt", "hat",
    "shopee", "tiki", "lazada", "thời trang", "áo quần", "vòng", "nhẫn", "khuyên tai",
  ],

  "Du lịch": [
    "máy bay", "vé máy bay", "khách sạn", "resort", "homestay", "hotel", "tour",
    "du lịch", "nghỉ mát", "vacation", "travel", "flight", "airplane", "booking",
    "airbnb", "hostel", "visa", "passport", "vali", "beach", "bien", "núi", "cano",
    "tàu thuyền", "bãi biển", "đảo", "canyon", "thác", "công viên", "zoo", "sở thú",
    "bảo tàng", "đền", "chùa", "trekking", "camping", "leopard",
  ],

  "Sức khỏe": [
    "thuốc", "khám bệnh", "bệnh viện", "bác sĩ", "thuốc men", "xét nghiệm", "siêu âm",
    "phòng khám", "tiêm", "vaccine", "bảo hiểm y tế", "nha khoa", "răng", "nhổ răng",
    "mắt", "kính mắt", "tim mạch", "da liễu", "thuốc bổ", "vitamin",
    "hospital", "clinic", "doctor", "checkup", "pharmacy", "nhà thuốc", "drugstore",
    "medical", "health", "healthcare", "insurance", "bhyt", "cấp cứu",
  ],

  "Giải trí": [
    "phim", "cinema", "rạp phim", "game", "netflix", "spotify", "youtube", "tiktok",
    "karaoke", "hát", "nhạc", "âm nhạc", "console", "playstation", "xbox", "games",
    "netflix premium", "spotify premium", "disney+", "prime video", "apple tv", "hbo",
    "concert", "show", "sự kiện", "event", "ticket", "livestream", "podcast", "audiobook",
    "steam", "epic", "garena", "lol", "valorant", "genshin", "pubg", "free fire",
    "anime", "manga", "truyện", "novel", "webtoon", "DC", "Marvel", "series", "drama",
  ],

  "Thú cưng": [
    "chó", "mèo", "cá", "chim", "thú cưng", "pet", "thức ăn cho pet", "thuốc cho pet",
    "tiêm pet", "tắm pet", "thú y", "đồ chơi cho pet", "pet care", "dog", "cat",
    "fish", "bird", "hamsters", "rabbit", "veterinary", "pet shop", "pet store",
    "aquarium", "bể cá", "xương", "pate", "spa cho thú cưng", "grooming",
  ],

  "Thực phẩm": [
    "thịt", "thịt heo", "thịt bò", "thịt gà", "cá", "cá hồi", "tôm", "cua", "mực",
    "rau", "rau muống", "rau cải", "trái cây", "hoa quả", "táo", "cam", "trứng",
    "sữa", "bơ", "nấm", "đậu", "gạo", "supermarket", "siêu thị", "tạp hóa",
    "mini mart", "vinmart", "bigc", "aeon", "lotte", "food", "grocery", "market",
    "cà rốt", "bí đỏ", "bắp", "khoai", "khoai lang", "sả", "hành", "tỏi", "ớt",
    "gia vị", "muối", "đường", "nước mắm", "dầu ăn", "bột", "nước", "bánh tráng",
    "gỏi cuốn", "chả", "giò", "pho mai", "sữa chua", "yaourt", "cheese",
  ],

  "Điện tử": [
    "điện thoại", "smartphone", "iphone", "samsung", "laptop", "máy tính", "tablet",
    "ipad", "máy ảnh", "camera", "tai nghe", "airpods", "loa", "loa bluetooth",
    "smartwatch", "đồng hồ thông minh", "game console", "sạc", "cáp sạc", "ốp lưng",
    "usb", "ổ cứng", "electronic", "tech", "gadget", "computer", "pc", "mac",
    "dell", "hp", "lenovo", "asus", "acer", "headphone", "earphone", "monitor",
    "screen", "keyboard", "mouse", "cable", "adapter", "hub", "ssd", "hdd",
    "ram", "cpu", "gpu", "router", "wifi", "modem",
  ],

  "Làm đẹp": [
    "son", "kem", "spa", "massage", "tóc", "làm tóc", "nhuộm", "cắt tóc", "mỹ phẩm",
    "dưỡng", "nước hoa", "lipstick", "kem dưỡng", "skincare", "son môi", "uốn tóc",
    "gội đầu", "beauty", "cosmetic", "makeup", "hair", "nail", "manicure", "pedicure",
    "facial", "serum", "toner", "moisturizer", "sunscreen", "kem chống nắng",
    "perfume", "cologne", "parfum", "duong da", "cham soc da", "wax", "shaving",
  ],

  "Thể thao": [
    "gym", "tập gym", "thể thao", "chạy bộ", "bơi", "yoga", "tennis", "bóng đá",
    "fitness", "tap gym", "dumbbell", "tạ", "bơi lội", "pilates", "bóng rổ",
    "cầu lông", "bida", "leo núi", "hiking", "sport", "sports", "exercise",
    "workout", "training", "running", "jogging", "marathon", "cycling", "bike",
    "bicycle", "swimming", "football", "soccer", "basketball", "volleyball",
    "boxing", "mma", "kickboxing", "karate", "judo", "taekwondo", "muay thai",
    "crossfit", "hiit", "cardio", "protein", "whey", "mass", "creatine", "BCAA",
    "giay chạy bộ", "giay thể thao", "quan the thao", "ao the thao",
  ],

  "Giáo dục": [
    "học phí", "sách", "khóa học", "trường", "lớp", "sách giáo khoa", "sách tham khảo",
    "vở", "bút", "thước", "gia sư", "tiếng Anh", "toán", "guitar", "piano", "vẽ",
    "chứng chỉ", "học online", "elearning", "education", "school", "university",
    "college", "course", "book", "textbook", "notebook", "pen", "pencil", "eraser",
    "ruler", "bag", "school bag", "uniform", "học bổng", "scholarship",
    "english", "ielts", "toeic", "toefl", "sat", "gre", "gmat", "tiếng anh",
    "tiếng trung", "tiếng nhật", "tiếng hàn", "udemy", "coursera", "edx",
    "skillshare", "workshop", "seminar", "training", "conference",
  ],

  "Giao thông": [
    "xăng", "dầu", "xe máy", "grab", "taxi", "uber", "bus", "buýt", "tàu", "metro",
    "xe", "di xe", "đi xe", "oto", "ô tô", "xe đạp", "parking", "đỗ xe",
    "bảo dưỡng", "sửa xe", "vé xe", "vé bus", "nhiên liệu", "bảo hiểm xe",
    "transport", "gas", "petrol", "fuel", "oil", "gojek", "be", "vietjet",
    "vietnam airline", "vietravel", "train", "tau hoa", "bus station", "ben xe",
    "tram", "vé tháng", "parking fee", "phi do xe", "toll", "phi cầu đường",
    "expressway", "highway", "xe khách", "limousine", "grabfood", "now", "baemin",
    "ship", "giao hàng", "delivery",
  ],

  "Nhà": [
    "thuê nhà", "tiền thuê nhà", "điện", "nước", "internet", "wifi", "mạng", "data",
    "4g", "5g", "sim", "điện thoại", "cước", "gas", "ga", "bếp ga", "nhà", "trọ",
    "thuê", "tiền nhà", "tiền điện", "tiền nước", "tiền internet", "sửa chữa",
    "bảo trì", "home", "house", "apartment", "condo", "villa", "townhouse",
    "studio", "rent", "rental", "lease", "utilities", "electricity", "water",
    "gas", "heating", "cooling", "ac", "air conditioner", "internet bill",
    "phone bill", "cable", "tv", "maintenance", "repair", "renovation", "furniture",
    "noi that", "bed", "sofa", "table", "chair", "lamp",
  ],

  "Nợ": [
    "trả nợ", "ghi nợ", "vay nợ", "vay", "nợ", "đi vay", "cho vay", "mượn tiền",
    "trả tiền", "thanh toán", "debt", "borrow", "lend", "loan", "credit",
    "installment", "trả góp", "monthly payment", "interest", "lãi", "principal",
    "gốc", "balance", "số dư nợ", "outstanding", "overdue", "quá hạn", "default",
    "bankruptcy", "bảo lãnh", "guarantor", "cosigner", "giấy nợ", "IOU",
    "hợp đồng", "agreement", "vay mượn", "đòi nợ", "thu nợ", "trả tiền thay",
    "chuyển khoản", "payment",
  ],

  "Tiết kiệm": [
    "tiết kiệm", "gửi tiết kiệm", "vàng", "quỹ dự phòng", "quỹ khẩn cấp", "đầu tư",
    "chứng khoán", "cổ phiếu", "saving", "savings", "deposit", "fixed deposit",
    "term deposit", "interest", "gold", "silver", "precious metal", "investment",
    "stock", "shares", "bond", "mutual fund", "ETF", "REIT", "cryptocurrency",
    "bitcoin", "ethereum", "forex", "real estate", "bất động sản", "land",
    "property", "emergency fund", "retirement fund", "quỹ hưu trí", "insurance",
    "bao hiem", "life insurance", "health insurance", "endowment", "unit link",
    "pension", "social insurance", "bhxh", "compound interest", "lãi kép", "DCA",
  ],

  "Lương": [
    "lương", "thu nhập", "lĩnh lương", "nhận lương", "trả lương", "salary", "wage",
    "income", "pay", "paycheck", "payroll", "lương tháng", "lương tuần", "lương ngày",
    "payday", "lĩnh lương", "lương tháng 13", "tăng lương", "lương cứng", "lương NET",
    "lương gross", "lương cơ bản", "tiền công", "tiền lương", "thu nhập hàng tháng",
    "nhận lương", "được lương", "lãnh lương", "rút lương", "ứng lương",
    "lương thử việc", "lương chính thức", "lương part-time", "lương freelance",
  ],

  "Đầu tư": [
    "lãi", "cổ tức", "đầu tư", "chứng khoán", "bán cổ phiếu", "lãi đầu tư",
    "lãi tiết kiệm", "dividend", "interest", "profit", "stock", "share", "bond",
    "investment", "return", "capital gain", "lãi kép", "lãi suất", "lãi ngân hàng",
    "cổ phiếu", "chứng khoán", "VN-Index", "blue chip", "trade", "day trade",
    "quỹ mở", "mutual fund", "ETF", "bất động sản", "cho thuê", "rental income",
    "vàng", "gold", "crypto", "bitcoin", "ethereum", "forex", "ngoại hối",
    "lợi nhuận", "hoàn vốn", "ROI", "yield", "coupon", "trái phiếu",
  ],

  "Tiền thưởng": [
    "thưởng", "lì xì", "quà", "hoa hồng", "commission", "bonus", "gift", "reward",
    "prize", "award", "thưởng tháng", "thưởng quý", "thưởng năm", "thưởng Tết",
    "thưởng dịp lễ", "thưởng thành tích", "thưởng hiệu suất", "thưởng doanh thu",
    "year-end bonus", "performance bonus", "sales bonus", "hoa hồng", "brokerage",
    "referral bonus", "giới thiệu", "referral", "affiliate", "cashback", "hoàn tiền",
    "cash reward", "quà tặng", "gift voucher", "lì xì", "lixi", "red envelope",
    "ang pow", "mừng tuổi", "thưởng Tết", "lương tháng 13", "giải thưởng",
    "competition prize", "giải nhất", "giải nhì", "giải ba", "xổ số", "trúng thưởng",
    "jackpot", "lottery", "quay số", "may mắn", "trúng",
  ],

  "Kinh doanh": [
    "bán hàng", "kinh doanh", "doanh thu", "buôn bán", "business", "sale", "revenue",
    "profit", "shop", "cửa hàng", "store", "online shop", "shop online", "bán hàng online",
    "thương mại điện tử", "e-commerce", "tiki", "shopee", "lazada", "amazon", "ebay",
    "facebook shop", "instagram shop", "tiktok shop", "woocommerce", "shopify",
    "doanh thu kinh doanh", "khởi nghiệp", "startup", "entrepreneur", "chủ doanh nghiệp",
    "chủ shop", "dropship", "freelance", "freelancer", "gig economy", "side hustle",
    "kinh doanh nhỏ", "small business", "quán", "quán cafe", "quán ăn", "nhà hàng",
    "restaurant", "cafe", "coffee shop", "bars", "pub", "club", "karaoke", "salon",
    "spa", "beauty salon", "nail salon", "barbershop", "tiệm", "cửa hàng tiện lợi",
    "buôn bán", "trade", "wholesale", "bán sỉ", "bán lẻ", "retail", "nhập hàng",
    "xuất hàng", "sản xuất", "manufacturing", "dịch vụ", "service", "consulting",
    "tư vấn", "agency", "marketing agency", "quảng cáo", "advertising", "affiliate",
  ],
};

// ============================================================
// AMOUNT EXTRACTOR
// ============================================================

const AMOUNT_PATTERNS = [
  // Triệu: 2tr5, 2.5tr, 2tr, 30 triệu
  { regex: /(\d+)\s*tr(\d+)/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
  { regex: /(\d+)[.,](\d+)\s*tr/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
  { regex: /(\d+)\s*tr\b/i, convert: m => parseInt(m[1]) * 1000000 },
  { regex: /(\d+)[.,](\d+)\s*triệu/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
  { regex: /(\d+)\s*triệu/i, convert: m => parseInt(m[1]) * 1000000 },
  { regex: /(\d+)\s*(trieu|million)/i, convert: m => parseInt(m[1]) * 1000000 },

  // Nghìn: 35.5ka, 35ka, 35.5k, 35k, 100 nghìn, 50 ngàn
  { regex: /(\d+)[.,](\d+)\s*ka\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
  { regex: /(\d+)\s*ka\b/i, convert: m => parseInt(m[1]) * 1000 },
  { regex: /(\d+)[.,](\d+)\s*k\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
  { regex: /(\d+)\s*k\b/i, convert: m => parseInt(m[1]) * 1000 },
  { regex: /(\d+)[.,](\d+)\s*(ngan|nghin|nghìn|ngàn)/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
  { regex: /(\d+)\s*(ngan|nghin|nghìn|ngàn)/i, convert: m => parseInt(m[1]) * 1000 },
  { regex: /(ngan|nghin|nghìn|ngàn)\s*(đồng|dong|d)?\s*(\d+)/i, convert: m => parseInt(m[3]) * 1000 },
];

export function extractAmount(text) {
  const lower = text.toLowerCase().trim();

  for (const { regex, convert } of AMOUNT_PATTERNS) {
    const match = lower.match(regex);
    if (match) {
      const result = convert(match);
      if (result > 0) return result;
    }
  }

  // Fallback: số không có suffix
  const numMatch = lower.match(/\b(\d{3,7})\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num < 100) return num;
    if (num < 10000 && num % 1000 === 0) return num * 1000;
    if (num % 1000 === 0) return num;
    return num * 1000;
  }

  return 0;
}

// ============================================================
// CLASSIFIER
// ============================================================

export function classifyCategory(text) {
  const lower = text.toLowerCase().trim();

  // Bước 1: Check CONTEXT_PATTERNS trước (ưu tiên cao nhất)
  for (const { pattern, category } of CONTEXT_PATTERNS) {
    if (pattern.test(lower)) {
      return { categoryName: category, type: CATEGORY_TYPE[category] };
    }
  }

  // Bước 2: Keyword matching với scoring
  let bestMatch = { categoryName: "Chưa phân loại", type: "EXPENSE", score: 0 };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Check negative keywords
    const negativeKws = NEGATIVE_KEYWORDS[category] || [];
    let hasNegative = false;
    for (const negKw of negativeKws) {
      if (lower.includes(negKw)) {
        hasNegative = true;
        break;
      }
    }
    if (hasNegative) continue;

    // Calculate score
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length * keyword.length; // Quadratic weighting
      }
    }

    if (score > bestMatch.score) {
      bestMatch = { categoryName: category, type: CATEGORY_TYPE[category], score };
    }
  }

  return { categoryName: bestMatch.categoryName, type: bestMatch.type };
}

// ============================================================
// MAIN PARSER
// ============================================================

export function parseTransaction(text) {
  const amount = extractAmount(text);
  const { categoryName, type } = classifyCategory(text);

  return {
    amount,
    type,
    category: categoryName,
    categoryId: CATEGORY_ID_MAP[categoryName] || "uncategorized",
    originalText: text,
  };
}

// ============================================================
// DEMO / TEST
// ============================================================

export function demo() {
  const testCases = [
    // EXPENSE
    "ăn phở 45k",
    "mua áo 200k",
    "xăng xe 80k",
    "uống cafe 35k",
    "netflix tháng 70k",
    "gym tập 500k",
    "khám bệnh 200k",
    "siêu thị mua đồ 500k",
    "mua son 150k",
    "sách học 100k",
    "tiền nhà 5tr",
    // INCOME
    "lương tháng 15tr",
    "thưởng Tết 5tr",
    "lì xì 200k",
    "cổ tức 1tr",
    "bán hàng online 500k",
  ];

  console.log("=".repeat(60));
  console.log("Transaction Classification Demo");
  console.log("=".repeat(60));

  for (const text of testCases) {
    const result = parseTransaction(text);
    console.log(`\nInput: "${text}"`);
    console.log(`Output: amount=${result.amount.toLocaleString()} VND`);
    console.log(`        type=${result.type}`);
    console.log(`        category=${result.category}`);
    console.log(`        categoryId=${result.categoryId}`);
  }
}
