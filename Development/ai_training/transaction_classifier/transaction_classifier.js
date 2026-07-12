
// Transaction Classifier - Multi-Layer Rule-Based System
// =======================================================
// Generated from Python implementation
// DO NOT EDIT MANUALLY - regenerate with exporter.py

// ============================================================
// CONFIGURATION
// ============================================================

export const CATEGORY_ID_MAP = {
    "Chưa phân loại": "uncategorized",
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
    "Chưa được phân loại": "uncategorized_income",
    "Lương": "salary",
    "Đầu tư": "investment",
    "Tiền thưởng": "bonus",
    "Kinh doanh": "business"
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
    "Kinh doanh": "INCOME"
};

export const TransactionType = {
    EXPENSE: "EXPENSE",
    INCOME: "INCOME"
};

// ============================================================
// TEXT NORMALIZATION
// ============================================================

const ABBREVIATIONS = {
    "cf": "ca phe",
    "caphe": "cafe",
    "càfe": "cafe",
    "cà phê": "ca phe",
    "café": "cafe",
    "grabfood": "grab food",
    "grab bike": "grabbike",
    "grabbike": "grab bike",
    "grabtaxi": "grab taxi",
    "grabcar": "grab car",
    "royalcity": "royal city",
    "royal city": "royal city",
    "vincom": "vincom",
    "aeonmall": "aeon mall",
    "aeon mall": "aeon mall",
    "lottemart": "lotte mart",
    "lotte mart": "lotte mart",
    "vinmart": "vinmart",
    "winmart": "winmart",
    "trasua": "tra sua",
    "trà sữa": "tra sua",
    "tra sua": "tra sua",
    "tra chanh": "tra chanh",
    "tra dao": "tra dao",
    "ca phe": "ca phe",
    "xe may": "xe may",
    "xe máy": "xe may",
    "xehoi": "xe hoi",
    "xe hơi": "xe hoi",
    "oto": "oto",
    "ô tô": "oto",
    "vs": "voi",
    "dc": "duoc",
    "ko": "khong",
    "k": "nghin",
    "kh": "khach hang",
    "bt": "binh thuong",
    "mn": "moi nguoi",
    "qt": "qua tang",
    "q": "quá",
    "z": "vậy",
    "f": "phí",
    "dp": "điện thoại",
    "tr": "trieu",
    "trieu": "trieu",
    "nghin": "nghin",
    "ngàn": "nghin",
    "nv": "nhan vien",
    "tv": "thanh vien",
    "ms": "mã số",
    "tn": "tong nabv"
};

function normalizeText(text) {
    if (!text) return "";

    // Lowercase
    let result = text.toLowerCase();

    // Expand abbreviations
    const sortedAbbrevs = Object.keys(ABBREVIATIONS).sort((a, b) => b.length - a.length);
    for (const abbrev of sortedAbbrevs) {
        const pattern = new RegExp('\\b' + escapeRegex(abbrev) + '\\b', 'gi');
        result = result.replace(pattern, ABBREVIATIONS[abbrev]);
    }

    // Normalize whitespace
    result = result.replace(/\s+/g, ' ').trim();

    return result;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// MERCHANT DATABASE
// ============================================================

const MERCHANTS = [
    {
        "name": "Royal City",
        "aliases": [
            "royal city",
            "royal city hn",
            "rc",
            "royal city hà nội"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thức ăn & Đồ uống",
            "Giải trí",
            "Giao thông"
        ]
    },
    {
        "name": "Vincom",
        "aliases": [
            "vincom",
            "vincom center",
            "vincom mega mall",
            "vincom điện máy"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thức ăn & Đồ uống",
            "Giải trí",
            "Giao thông"
        ]
    },
    {
        "name": "AEON Mall",
        "aliases": [
            "aeon",
            "aeon mall",
            "aeonmall",
            "aeon mall hà nội",
            "aeon bình tân"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Giải trí"
        ]
    },
    {
        "name": "Lotte Mall",
        "aliases": [
            "lotte",
            "lotte mall",
            "lotte center",
            "lotte mart",
            "lotte supermarket"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Giải trí"
        ]
    },
    {
        "name": "Aeon Citimart",
        "aliases": [
            "aeon citimart",
            "citimart",
            "citi mart",
            "aeon e commerce"
        ],
        "locationType": "supermarket",
        "possibleCategories": [
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Mua sắm"
        ]
    },
    {
        "name": "Grandview",
        "aliases": [
            "grandview",
            "grand view",
            "tầm view",
            "tam view"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thức ăn & Đồ uống",
            "Giải trí"
        ]
    },
    {
        "name": "Time City",
        "aliases": [
            "time city",
            "times city",
            "timecity",
            "timescity"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thức ăn & Đồ uống",
            "Giải trí"
        ]
    },
    {
        "name": "The Manor",
        "aliases": [
            "the manor",
            "manor",
            "the manor oai pking"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Mipec",
        "aliases": [
            "mipec",
            "mipec tower",
            "mipec city"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Keangnam",
        "aliases": [
            "keangnam",
            "keangnam landmark",
            "landmark 72"
        ],
        "locationType": "mall",
        "possibleCategories": [
            "Mua sắm",
            "Thức ăn & Đồ uống",
            "Giải trí"
        ]
    },
    {
        "name": "CGV",
        "aliases": [
            "cgv",
            "cgv cinema",
            "cgv cinemas",
            "cgv cinemas viet nam"
        ],
        "locationType": "cinema",
        "possibleCategories": [
            "Giải trí"
        ]
    },
    {
        "name": "BHD Star",
        "aliases": [
            "bhd",
            "bhd star",
            "bhd cinema",
            "bhd cinemas"
        ],
        "locationType": "cinema",
        "possibleCategories": [
            "Giải trí"
        ]
    },
    {
        "name": "Galaxy Cinema",
        "aliases": [
            "galaxy",
            "galaxy cinema",
            "galaxy cinemas",
            "galaxy nguyễn trãi"
        ],
        "locationType": "cinema",
        "possibleCategories": [
            "Giải trí"
        ]
    },
    {
        "name": "Lotte Cinema",
        "aliases": [
            "lotte cinema",
            "lotte cinestar",
            "cinestar"
        ],
        "locationType": "cinema",
        "possibleCategories": [
            "Giải trí"
        ]
    },
    {
        "name": "CineStar",
        "aliases": [
            "cinestar",
            "cine star",
            "cinestar"
        ],
        "locationType": "cinema",
        "possibleCategories": [
            "Giải trí"
        ]
    },
    {
        "name": "Mega GS",
        "aliases": [
            "mega gs",
            "mega",
            "megags",
            "mega gs cinema"
        ],
        "locationType": "cinema",
        "possibleCategories": [
            "Giải trí"
        ]
    },
    {
        "name": "Highlands Coffee",
        "aliases": [
            "highlands",
            "highlands coffee",
            "highland",
            "highland coffee"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Starbucks",
        "aliases": [
            "starbucks",
            "starbucks vietnam",
            "starbucks vn"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Phúc Long",
        "aliases": [
            "phuc long",
            "phúc long",
            "phuc long coffee",
            "phuc long tea"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "The Coffee House",
        "aliases": [
            "the coffee house",
            "coffee house",
            "thecoffeehouse",
            "tch"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Trung Nguyên",
        "aliases": [
            "trung nguyen",
            "trung nguyên",
            "trung nguyen legend",
            "tn"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Passio",
        "aliases": [
            "passio",
            "passio coffee",
            "passion coffee"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Gong Cha",
        "aliases": [
            "gong cha",
            "gông cha",
            "gongcha",
            "gong cha tea"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Koi Thé",
        "aliases": [
            "koi",
            "koi the",
            "koi thé",
            "koi cafe"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Bobapop",
        "aliases": [
            "bobapop",
            "boba pop",
            "bobapop tea",
            "bobapop奶茶"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "KFC",
        "aliases": [
            "kfc",
            "kfc vietnam",
            "kfc vn"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Lotteria",
        "aliases": [
            "lotteria",
            "lotte ria",
            "lotteria vietnam"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "McDonald's",
        "aliases": [
            "mcdonald",
            "mcdonald's",
            "mcdonald",
            "mc donald",
            "mcd"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Pizza Hut",
        "aliases": [
            "pizza hut",
            "pizzahut",
            "pizza"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Domino's Pizza",
        "aliases": [
            "domino",
            "domino pizza",
            "dominos"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Jollibee",
        "aliases": [
            "jollibee",
            "jollibee vietnam",
            "jollibee vn"
        ],
        "locationType": "restaurant",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Quán ăn",
        "aliases": [
            "quán ăn",
            "quán ăn",
            "quan an",
            "quán",
            "cơm",
            "bún",
            "phở"
        ],
        "locationType": "street",
        "possibleCategories": [
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "WinMart",
        "aliases": [
            "winmart",
            "win mart",
            "winmart+",
            "win mart+",
            "walmart"
        ],
        "locationType": "supermarket",
        "possibleCategories": [
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Mua sắm"
        ]
    },
    {
        "name": "Co.opMart",
        "aliases": [
            "coopmart",
            "co.opmart",
            "co.op mart",
            "coop mart"
        ],
        "locationType": "supermarket",
        "possibleCategories": [
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Mua sắm"
        ]
    },
    {
        "name": "BigC",
        "aliases": [
            "bigc",
            "big c",
            "big c vietnam",
            "go!"
        ],
        "locationType": "supermarket",
        "possibleCategories": [
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Mua sắm"
        ]
    },
    {
        "name": "Aeon",
        "aliases": [
            "aeon",
            "aeon supermarket",
            "aeon mart",
            "aeon citimart"
        ],
        "locationType": "supermarket",
        "possibleCategories": [
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Mua sắm"
        ]
    },
    {
        "name": "Lotte Mart",
        "aliases": [
            "lotte mart",
            "lotte mart",
            "lotte supermarket"
        ],
        "locationType": "supermarket",
        "possibleCategories": [
            "Thực phẩm",
            "Thức ăn & Đồ uống",
            "Mua sắm"
        ]
    },
    {
        "name": "Circle K",
        "aliases": [
            "circle k",
            "circlek",
            "circle k vietnam",
            "circle k vn"
        ],
        "locationType": "convenience",
        "possibleCategories": [
            "Thức ăn & Đồ uống",
            "Thực phẩm"
        ]
    },
    {
        "name": "GS25",
        "aliases": [
            "gs25",
            "gs 25",
            "gs25 vietnam",
            "gs mart"
        ],
        "locationType": "convenience",
        "possibleCategories": [
            "Thức ăn & Đồ uống",
            "Thực phẩm"
        ]
    },
    {
        "name": "FamilyMart",
        "aliases": [
            "familymart",
            "family mart",
            "family mart vietnam",
            "fm"
        ],
        "locationType": "convenience",
        "possibleCategories": [
            "Thức ăn & Đồ uống",
            "Thực phẩm"
        ]
    },
    {
        "name": "Shop 89",
        "aliases": [
            "shop 89",
            "shop89",
            "cửa hàng 89",
            "cuahang 89"
        ],
        "locationType": "convenience",
        "possibleCategories": [
            "Thức ăn & Đồ uống",
            "Thực phẩm"
        ]
    },
    {
        "name": "Petrolimex",
        "aliases": [
            "petrolimex",
            "petrol",
            "petrolimex điện máy"
        ],
        "locationType": "gas_station",
        "possibleCategories": [
            "Giao thông"
        ]
    },
    {
        "name": "Shell",
        "aliases": [
            "shell",
            "shell vietnam",
            "shell station"
        ],
        "locationType": "gas_station",
        "possibleCategories": [
            "Giao thông"
        ]
    },
    {
        "name": "PVOil",
        "aliases": [
            "pv oil",
            "pvoil",
            "pvoil điện máy"
        ],
        "locationType": "gas_station",
        "possibleCategories": [
            "Giao thông"
        ]
    },
    {
        "name": "Caltex",
        "aliases": [
            "caltex",
            "caltex vietnam",
            "caltex station"
        ],
        "locationType": "gas_station",
        "possibleCategories": [
            "Giao thông"
        ]
    },
    {
        "name": "Shopee",
        "aliases": [
            "shopee",
            "shopeefood",
            "shopee food",
            "shopee mart"
        ],
        "locationType": "street",
        "possibleCategories": [
            "Mua sắm",
            "Thực phẩm",
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Lazada",
        "aliases": [
            "lazada",
            "lazada vn",
            "lazada vietnam"
        ],
        "locationType": "street",
        "possibleCategories": [
            "Mua sắm"
        ]
    },
    {
        "name": "Tiki",
        "aliases": [
            "tiki",
            "tiki vn",
            "tiki vietnam"
        ],
        "locationType": "street",
        "possibleCategories": [
            "Mua sắm"
        ]
    },
    {
        "name": "Grab",
        "aliases": [
            "grab",
            "grabcar",
            "grab bike",
            "grab xe may",
            "grabtaxi"
        ],
        "locationType": "street",
        "possibleCategories": [
            "Giao thông",
            "Thức ăn & Đồ uống"
        ]
    },
    {
        "name": "Be",
        "aliases": [
            "be",
            "be app",
            "be vietnam",
            "be xe"
        ],
        "locationType": "street",
        "possibleCategories": [
            "Giao thông"
        ]
    },
    {
        "name": "Gojek",
        "aliases": [
            "gojek",
            "gojek vietnam",
            "go ride",
            "go car"
        ],
        "locationType": "street",
        "possibleCategories": [
            "Giao thông"
        ]
    }
];

function detectMerchant(text) {
    const lower = text.toLowerCase();

    for (const merchant of MERCHANTS) {
        for (const alias of merchant.aliases) {
            if (lower.includes(alias)) {
                return merchant;
            }
        }
    }
    return null;
}

// ============================================================
// INTENT DETECTION
// ============================================================

const INTENTS = {
    "buy": [
        "mua",
        "mua sam",
        "mua sắm",
        "đi mua",
        "ra mua",
        "order",
        "đặt hàng",
        "đặt",
        "ship",
        "ship hàng",
        "sắm",
        "tậu",
        "rước",
        "mua về",
        "mua vào",
        "trả tiền",
        "thanh toán",
        "chi",
        "chi tiêu",
        "tiêu",
        "tiêu xài",
        "shopping",
        "shop",
        "shop online",
        "mua online",
        "đặt mua",
        "order",
        "buy",
        "purchase",
        "shop",
        "shopping",
        "order",
        "checkout",
        "pay for"
    ],
    "food": [
        "ăn",
        "uống",
        "đi ăn",
        "đi uống",
        "ra ăn",
        "ra uống",
        "vô ăn",
        "vô uống",
        "nhậu",
        "nhậu nhẹt",
        "nhậu bia",
        "làm cơm",
        "nấu cơm",
        "nấu ăn",
        "cafe",
        "cà phê",
        "coffee",
        "uống cafe",
        "ăn sáng",
        "ăn trưa",
        "ăn tối",
        "buffet",
        "ăn buffet",
        "lẩu",
        "nướng",
        "hàn huyên",
        "họp mặt",
        "đi ăn",
        "ra quán",
        "vô quán",
        "ở quán",
        "ngồi ăn",
        "gọi món",
        "eat",
        "drink",
        "dinner",
        "lunch",
        "breakfast",
        "brunch",
        "snack",
        "have lunch",
        "have dinner",
        "have breakfast",
        "meal",
        "ordering"
    ],
    "transport": [
        "đi",
        "đi xe",
        "di xe",
        "đi taxi",
        "đi grab",
        "đi uber",
        "đi be",
        "xe máy",
        "xe may",
        "ô tô",
        "oto",
        "ô tô",
        "chạy",
        "chạy xe",
        "lái xe",
        "lai xe",
        "bắt xe",
        "bắt taxi",
        "gọi xe",
        "đặt xe",
        "đổ xăng",
        "đổ dầu",
        "nạp xăng",
        "nạp nhiên liệu",
        "bơm xăng",
        "sửa xe",
        "thay nhớt",
        "thay dầu",
        "bảo dưỡng xe",
        "bảo trì xe",
        "bảo hiểm xe",
        "đăng kiểm",
        "ra biển",
        "làm biển",
        "mua xe",
        "drive",
        "driving",
        "taxi",
        "uber",
        "grab",
        "ride",
        "car",
        "bike",
        "fuel",
        "gas",
        "petrol",
        "fill up",
        "refuel",
        "maintenance"
    ],
    "park": [
        "gửi xe",
        "gui xe",
        "đỗ xe",
        "do xe",
        "parking",
        "trông xe",
        "giữ xe",
        "để xe",
        "ra xe",
        "vô xe",
        "lấy xe",
        "gửi xe máy",
        "gửi ô tô",
        "phí gửi xe",
        "phí đỗ xe",
        "vé gửi xe",
        "vé đỗ xe",
        "parking fee",
        "park",
        "parking",
        "valet",
        "parking lot",
        "car park"
    ],
    "pay": [
        "trả",
        "tra",
        "thanh toán",
        "thanh toán",
        "đóng",
        "dong",
        "đóng tiền",
        "trả tiền",
        "tra tien",
        "nạp",
        "nap",
        "nạp tiền",
        "trả tiền",
        "trả hóa đơn",
        "trả bill",
        "trả bill",
        "pay bill",
        "billing",
        "trả phí",
        "trả phí dịch vụ",
        "trả cước",
        "cước điện thoại",
        "trả tiền điện",
        "trả tiền nước",
        "trả tiền internet",
        "trả wifi",
        "trả tiền nhà",
        "trả tiền thuê",
        "trả tiền thuê nhà",
        "pay",
        "payment",
        "pay bill",
        "pay fee",
        "pay charge",
        "pay subscription",
        "pay rent",
        "pay electricity",
        "pay water",
        "pay internet",
        "pay online"
    ],
    "transfer": [
        "chuyển khoản",
        "chuyen khoan",
        "chuyển tiền",
        "chuyen tien",
        "gửi tiền",
        "gui tien",
        "gửi",
        "gui",
        "rút tiền",
        "rut tien",
        "rút",
        "nạp tiền",
        "nap tien",
        "nạp bank",
        "nạp ví",
        "rút tiền ATM",
        "chuyển tiền cho",
        "gửi tiền cho",
        "transfer",
        "ví điện tử",
        "banking",
        "internet banking",
        "mobile banking",
        "app banking",
        "transfer",
        "send money",
        "receive money",
        "wire",
        "remit",
        "deposit"
    ],
    "income": [
        "nhận",
        "nhan",
        "được",
        "duoc",
        "thu",
        "thu nhập",
        "kiếm được",
        "được lương",
        "được tiền",
        "được thưởng",
        "được trả",
        "được chi",
        "lĩnh lương",
        "lĩnh",
        "nhận lương",
        "lĩnh lương",
        "rút lương",
        "thu tiền",
        "thu",
        "thuê",
        "cho thuê",
        "bán được",
        "lời",
        "lãi",
        "lai",
        "cổ tức",
        "co tuc",
        "hoàn tiền",
        "hoan tien",
        "receive",
        "get",
        "earn",
        "income",
        "salary",
        "wage",
        "bonus",
        "profit",
        "gain",
        "return",
        "dividend",
        "refund",
        "cashback"
    ],
    "subscription": [
        "thuê bao",
        "thue bao",
        "đăng ký",
        "dang ky",
        "subscribe",
        "subscription",
        "thuê bao tháng",
        "thanh toán tháng",
        "hàng tháng",
        "hang thang",
        "gia hạn",
        "gia han",
        "renew",
        "gia hạn thuê bao",
        "trả tháng",
        "trả năm",
        "yearly",
        "monthly",
        "annual",
        "subscription fee",
        "subscribe",
        "subscription",
        "membership",
        "premium",
        "monthly fee",
        "annual fee",
        "yearly fee",
        "recurring",
        "auto-renew",
        "renewal"
    ],
    "health": [
        "khám",
        "kham",
        "bệnh",
        "benh",
        "bệnh viện",
        "benh vien",
        "bv",
        "phòng khám",
        "phong kham",
        "bác sĩ",
        "bs",
        "bs.",
        "y sĩ",
        "thuốc",
        "thuoc",
        "dược",
        "duoc",
        "nhà thuốc",
        "nha thuoc",
        "khám bệnh",
        "xét nghiệm",
        "xet nghiem",
        "siêu âm",
        "sieu am",
        "chụp X-quang",
        "chup X-quang",
        "MRI",
        "CT scan",
        "mổ",
        "mo",
        "phẫu thuật",
        "phau thuat",
        "tiêm",
        "tiem",
        "tiêm phòng",
        "vaccine",
        "vacxin",
        "bảo hiểm y tế",
        "bhyt",
        "bảo hiểm",
        "nha khoa",
        "nhổ răng",
        "nhổ",
        "răng",
        "rang",
        "niềng răng",
        "kính mắt",
        "kinh mat",
        "mắt",
        "mat",
        "bệnh viện mắt",
        "hospital",
        "clinic",
        "doctor",
        "medical",
        "medicine",
        "pharmacy",
        "health",
        "healthcare",
        "checkup",
        "examination",
        "treatment",
        "surgery",
        "dental",
        "dentist",
        "eye",
        "optical",
        "glasses"
    ],
    "entertainment": [
        "xem",
        "xem phim",
        "xem phim",
        "chiếu phim",
        "chieu phim",
        "đi xem phim",
        "hát",
        "hat",
        "ca hát",
        "ca hat",
        "karaoke",
        "sing",
        "sing along",
        "chơi",
        "choi",
        "chơi game",
        "choi game",
        "gaming",
        "game",
        "nghe nhạc",
        "nghe nhac",
        "nhạc",
        "nhac",
        "concert",
        "show",
        "sự kiện",
        "su kien",
        "event",
        "livestream",
        "live",
        "netflix",
        "spotify",
        "youtube",
        "zalo",
        "facebook",
        "tiktok",
        "mua vé",
        "mua ve",
        "vé",
        "ve",
        " vé xem",
        "đặt vé",
        "watch",
        "movie",
        "cinema",
        "film",
        "concert",
        "show",
        "event",
        "game",
        "gaming",
        "play",
        "music",
        "concert",
        "ticket",
        "netflix",
        "spotify",
        "youtube",
        "streaming",
        "live"
    ],
    "home": [
        "thuê nhà",
        "thue nha",
        "tiền nhà",
        "tiền thuê",
        "nhà",
        "nha",
        "điện",
        "dien",
        "nước",
        "nuoc",
        "internet",
        "wifi",
        "mạng",
        "mang",
        "gas",
        "ga",
        "bếp ga",
        "bep ga",
        "cước",
        "cuoc",
        "cước điện thoại",
        "sửa nhà",
        "sua nha",
        "sửa chữa",
        "sua chua",
        "bảo trì",
        "bao tri",
        "trang trí",
        "trang tri",
        "nội thất",
        "noi that",
        "furniture",
        "tiền điện",
        "tiền nước",
        "tiền internet",
        "tiền wifi",
        "phí quản lý",
        "phí dịch vụ",
        "phí bảo vệ",
        "phí giữ xe",
        "đặt cọc",
        "đat coc",
        "cọc",
        "coc",
        "rent",
        "electricity",
        "water",
        "internet",
        "wifi",
        "gas",
        "utility",
        "home",
        "house",
        "apartment",
        "maintenance",
        "repair",
        "renovation",
        "furniture",
        "decoration",
        "utility bill",
        "household"
    ],
    "travel": [
        "du lịch",
        "du lich",
        "travel",
        "vacation",
        "nghỉ mát",
        "nghi mat",
        "tour",
        "đi tour",
        "khách sạn",
        "khach san",
        "hotel",
        "resort",
        "homestay",
        "hostel",
        "airbnb",
        "máy bay",
        "may bay",
        "vé máy bay",
        "tàu",
        "tau",
        "xe khách",
        "xe khoach",
        "cruise",
        "biển",
        "bien",
        "đảo",
        "dao",
        "núi",
        "nui",
        "cắm trại",
        "cam tria",
        "camping",
        "trekking",
        "leo núi",
        "leo nui",
        "bãi biển",
        "beach",
        "đặt phòng",
        "dat phong",
        "booking",
        "check-in",
        "check-out",
        "travel",
        "trip",
        "vacation",
        "holiday",
        "tour",
        "hotel",
        "flight",
        "airplane",
        "train",
        "bus",
        "cruise",
        "beach",
        "mountain",
        "camping",
        "trekking",
        "hiking",
        "booking",
        "reservation",
        "accommodation"
    ],
    "education": [
        "học",
        "hoc",
        "học phí",
        "hoc phi",
        "học tiền",
        "trường",
        "truong",
        "lớp",
        "lop",
        "khóa học",
        "khoa hoc",
        "course",
        "sách",
        "sach",
        "vở",
        "vo",
        "bút",
        "but",
        "dụng cụ học tập",
        "dung cu hoc tap",
        "gia sư",
        "gia su",
        "gia sư",
        "học thêm",
        "hoc them",
        "học kèm",
        "tiếng anh",
        "tieng anh",
        "toeic",
        "ielts",
        "sat",
        "gre",
        "gmat",
        "đại học",
        "dai hoc",
        "đh",
        "dh",
        "cao đẳng",
        "cao dang",
        "thạc sĩ",
        "thac si",
        "tiến sĩ",
        "tien si",
        "bằng",
        "bang",
        "school",
        "university",
        "college",
        "course",
        "education",
        "learning",
        "study",
        "tuition",
        "fee",
        "book",
        "textbook",
        "stationery",
        "tutoring",
        "training",
        "seminar",
        "workshop",
        "certification"
    ],
    "invest": [
        "đầu tư",
        "dau tu",
        "đầu tư",
        "invest",
        "chứng khoán",
        "chung khoan",
        "cổ phiếu",
        "co phieu",
        "trái phiếu",
        "trai phieu",
        "quỹ",
        "quy",
        "vàng",
        "vang",
        "gold",
        "crypto",
        "bitcoin",
        "ethereum",
        "forex",
        "bất động sản",
        "bat dong san",
        "nhà đất",
        "nha dat",
        "đất",
        "gửi tiết kiệm",
        "gui tiet kiem",
        "tiết kiệm",
        "tiet kiem",
        "tiền gửi",
        "tien gui",
        "kỳ hạn",
        "ky han",
        "lãi suất",
        "lai suat",
        "lãi",
        "lai",
        "cổ tức",
        "co tuc",
        "dividend",
        "profit",
        "invest",
        "investment",
        "stock",
        "share",
        "bond",
        "fund",
        "gold",
        "crypto",
        "bitcoin",
        "ethereum",
        "real estate",
        "property",
        "savings",
        "deposit",
        "interest",
        "dividend",
        "profit",
        "return"
    ],
    "pet": [
        "thú cưng",
        "thu cung",
        "pet",
        "cho",
        "meo",
        "cá",
        "ca",
        "chim",
        "pet shop",
        "thức ăn cho pet",
        "thuoc cho pet",
        "thuốc cho pet",
        "tiêm pet",
        "tắm pet",
        "thú y",
        "thu y",
        "veterinary",
        "clinic thú y",
        "đồ chơi cho pet",
        "pet care",
        "pet food",
        "pet toy",
        "pet supply",
        "pet",
        "dog",
        "cat",
        "fish",
        "bird",
        "pet shop",
        "veterinary",
        "pet food",
        "pet care",
        "pet toy",
        "pet supplies",
        "grooming"
    ],
    "beauty": [
        "làm đẹp",
        "lam dep",
        "lam dep",
        "spa",
        "massage",
        "mát xa",
        "mat xa",
        "làm tóc",
        "lam toc",
        "cắt tóc",
        "cat toc",
        "nhuộm tóc",
        "nhuom toc",
        "uốn tóc",
        "uon toc",
        "gội đầu",
        "goi dau",
        "makeup",
        "trang điểm",
        "son",
        "kem",
        "mỹ phẩm",
        "my pham",
        "dưỡng da",
        "duong da",
        "skincare",
        "làm móng",
        "lam mong",
        "nail",
        "làm mặt",
        "lam mat",
        "facial",
        "wax",
        "cạo râu",
        "cao râu",
        "tẩy lông",
        "tay long",
        "beauty",
        "spa",
        "massage",
        "hair",
        "haircut",
        "hair salon",
        "makeup",
        "cosmetics",
        "skincare",
        "nail",
        "facial",
        "grooming"
    ],
    "sports": [
        "gym",
        "fitness",
        "tập gym",
        "tap gym",
        "phòng gym",
        "phong gym",
        "vô gym",
        "vo gym",
        "thể dục",
        "the duc",
        "thể hình",
        "the hinh",
        "workout",
        "exercise",
        "chạy",
        "chay",
        "bơi",
        "boi",
        "bơi lội",
        "yoga",
        "pilates",
        " aerobic",
        "fitness center",
        "gym center",
        "cầu lông",
        "cau long",
        "bóng đá",
        "bong da",
        "bóng rổ",
        "bong ro",
        "tennis",
        "bida",
        "leo núi",
        "hiking",
        "marathon",
        "chạy bộ",
        "đạp xe",
        "dap xe",
        "cycling",
        "xe đạp",
        "xe dap",
        "bike",
        "mua giày",
        "mua giay",
        "giày thể thao",
        "giay the thao",
        "gym",
        "fitness",
        "workout",
        "exercise",
        "sports",
        "running",
        "swimming",
        "yoga",
        "pilates",
        "cycling",
        "hiking",
        "marathon",
        "football",
        "soccer",
        "basketball",
        "tennis",
        "badminton"
    ],
    "service": [
        "sửa",
        "sua",
        "sửa chữa",
        "sua chua",
        "bảo trì",
        "bao tri",
        "bảo dưỡng",
        "bao duong",
        "sửa điện thoại",
        "sửa laptop",
        "sửa máy tính",
        "fix",
        "repair",
        "maintenance",
        "cleaning",
        "dọn dẹp",
        "don dep",
        "giặt",
        "giat",
        "giặt là",
        "rửa xe",
        "rua xe",
        "wash",
        "cắt tóc",
        "cat toc",
        "grooming",
        "nail",
        "làm móng",
        "photography",
        "chụp ảnh",
        "chup anh",
        "service",
        "repair",
        "fix",
        "maintenance",
        "fixing",
        "fixer",
        "cleaning",
        "laundry",
        "wash",
        "grooming",
        "photography"
    ]
};

function detectIntent(text) {
    const lower = text.toLowerCase();
    let bestIntent = null;
    let bestScore = 0;
    let matchedKeywords = [];

    for (const [intentName, keywords] of Object.entries(INTENTS)) {
        let score = 0;
        let matches = [];

        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) {
                matches.push(kw);
                score += kw.length;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestIntent = intentName;
            matchedKeywords = matches;
        }
    }

    return {
        intent: bestIntent,
        confidence: bestScore > 0 ? Math.min(bestScore / 50, 1) : 0,
        keywords: matchedKeywords
    };
}

// ============================================================
// CONTEXT RULES
// ============================================================

const CONTEXT_RULES = [
    {
        "intent": null,
        "locationType": null,
        "keywords": [
            "grabfood",
            "grab food",
            "now",
            "baemin",
            "shopeefood",
            "shopee food",
            "food delivery",
            "giao đồ ăn"
        ],
        "category": "Thức ăn & Đồ uống",
        "priority": 4,
        "score": 60.0,
        "transactionType": "EXPENSE",
        "description": "Food delivery - overrides transport"
    },
    {
        "intent": null,
        "locationType": "mall",
        "keywords": [
            "royal city",
            "vincom",
            "aeon",
            "lotte",
            "lotte mart",
            "aeon mall",
            "grandview",
            "time city",
            "mipec",
            "keangnam"
        ],
        "category": "Mua sắm",
        "priority": 3,
        "score": 40.0,
        "transactionType": "EXPENSE",
        "description": "Going to mall defaults to shopping"
    },
    {
        "intent": "food",
        "locationType": "mall",
        "keywords": [
            "ăn",
            "uống",
            "quán",
            "nhà hàng",
            "food",
            "restaurant"
        ],
        "category": "Thức ăn & Đồ uống",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Eating at mall"
    },
    {
        "intent": "food",
        "locationType": "restaurant",
        "keywords": [
            "cafe",
            "cà phê",
            "coffee",
            "trà",
            "tea",
            "nước",
            "đồ uống"
        ],
        "category": "Thức ăn & Đồ uống",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Drinks at cafe/restaurant"
    },
    {
        "intent": "food",
        "locationType": "cinema",
        "keywords": [
            "bắp",
            "nước",
            "popcorn",
            "coca",
            "pepsi",
            "đồ uống",
            "thức ăn"
        ],
        "category": "Thức ăn & Đồ uống",
        "priority": 3,
        "score": 40.0,
        "transactionType": "EXPENSE",
        "description": "Food at cinema"
    },
    {
        "intent": "buy",
        "locationType": "mall",
        "keywords": [
            "mua",
            "đồ",
            "shopping",
            "shop",
            "áo",
            "quần",
            "giày",
            "túi"
        ],
        "category": "Mua sắm",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Shopping at mall"
    },
    {
        "intent": "buy",
        "locationType": null,
        "keywords": [
            "shopee",
            "lazada",
            "tiki",
            "amazon",
            "mua online",
            "shopping online"
        ],
        "category": "Mua sắm",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Online shopping"
    },
    {
        "intent": "buy",
        "locationType": null,
        "keywords": [
            "áo",
            "quần",
            "váy",
            "đầm",
            "giày",
            "túi",
            "balo",
            "nón",
            "thời trang"
        ],
        "category": "Mua sắm",
        "priority": 3,
        "score": 45.0,
        "transactionType": "EXPENSE",
        "description": "Clothing shopping"
    },
    {
        "intent": "entertainment",
        "locationType": "cinema",
        "keywords": [
            "xem phim",
            "vé",
            "movie",
            "phim",
            "cinema",
            "rạp"
        ],
        "category": "Giải trí",
        "priority": 3,
        "score": 55.0,
        "transactionType": "EXPENSE",
        "description": "Watching movie at cinema"
    },
    {
        "intent": "entertainment",
        "locationType": "mall",
        "keywords": [
            "xem phim",
            "rạp",
            "game",
            "trò chơi",
            "bowling",
            "bi-a"
        ],
        "category": "Giải trí",
        "priority": 3,
        "score": 45.0,
        "transactionType": "EXPENSE",
        "description": "Entertainment at mall"
    },
    {
        "intent": "entertainment",
        "locationType": null,
        "keywords": [
            "netflix",
            "spotify",
            "youtube premium",
            "disney",
            "hbo"
        ],
        "category": "Giải trí",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Streaming subscriptions"
    },
    {
        "intent": "entertainment",
        "locationType": null,
        "keywords": [
            "karaoke",
            "hát",
            "ca hat",
            "sing",
            "phòng hát"
        ],
        "category": "Giải trí",
        "priority": 3,
        "score": 45.0,
        "transactionType": "EXPENSE",
        "description": "Karaoke"
    },
    {
        "intent": "park",
        "locationType": "mall",
        "keywords": [
            "gửi xe",
            "đỗ xe",
            "parking",
            "xe máy",
            "ô tô",
            "car"
        ],
        "category": "Giao thông",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Parking at mall"
    },
    {
        "intent": "transport",
        "locationType": null,
        "keywords": [
            "grab",
            "taxi",
            "uber",
            "be",
            "gojek",
            "mai linh"
        ],
        "category": "Giao thông",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Ride-hailing"
    },
    {
        "intent": "transport",
        "locationType": "gas_station",
        "keywords": [
            "xăng",
            "dầu",
            "fuel",
            "petrol",
            "gas"
        ],
        "category": "Giao thông",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Gas/fuel"
    },
    {
        "intent": "health",
        "locationType": null,
        "keywords": [
            "bệnh viện",
            "bv",
            "phòng khám",
            "khám bệnh",
            "bác sĩ"
        ],
        "category": "Sức khỏe",
        "priority": 3,
        "score": 55.0,
        "transactionType": "EXPENSE",
        "description": "Hospital/medical"
    },
    {
        "intent": "health",
        "locationType": null,
        "keywords": [
            "thuốc",
            "dược",
            "nhà thuốc",
            "pharmacy",
            "vitamin"
        ],
        "category": "Sức khỏe",
        "priority": 2,
        "score": 40.0,
        "transactionType": "EXPENSE",
        "description": "Pharmacy/medicine"
    },
    {
        "intent": "beauty",
        "locationType": null,
        "keywords": [
            "spa",
            "massage",
            "mát xa",
            "làm tóc",
            "cắt tóc",
            "nhuộm",
            "nail",
            "làm móng"
        ],
        "category": "Làm đẹp",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Beauty services"
    },
    {
        "intent": "sports",
        "locationType": null,
        "keywords": [
            "gym",
            "fitness",
            "tập gym",
            "vô gym",
            "phòng gym",
            "workout"
        ],
        "category": "Thể thao",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Gym/fitness"
    },
    {
        "intent": "buy",
        "locationType": "supermarket",
        "keywords": [
            "thịt",
            "cá",
            "rau",
            "trái cây",
            "sữa",
            "trứng",
            "grocery",
            "food"
        ],
        "category": "Thực phẩm",
        "priority": 2,
        "score": 40.0,
        "transactionType": "EXPENSE",
        "description": "Grocery shopping"
    },
    {
        "intent": "buy",
        "locationType": "convenience",
        "keywords": [
            "thịt",
            "cá",
            "rau",
            "trái cây",
            "sữa",
            "snack",
            "đồ uống"
        ],
        "category": "Thực phẩm",
        "priority": 2,
        "score": 35.0,
        "transactionType": "EXPENSE",
        "description": "Convenience store"
    },
    {
        "intent": "buy",
        "locationType": null,
        "keywords": [
            "siêu thị",
            "supermarket",
            "mart",
            "chợ",
            "market"
        ],
        "category": "Thực phẩm",
        "priority": 2,
        "score": 35.0,
        "transactionType": "EXPENSE",
        "description": "Supermarket"
    },
    {
        "intent": "pay",
        "locationType": null,
        "keywords": [
            "tiền nhà",
            "thuê nhà",
            "rent",
            "nhà trọ",
            "phòng trọ"
        ],
        "category": "Nhà",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Rent"
    },
    {
        "intent": "pay",
        "locationType": null,
        "keywords": [
            "tiền điện",
            "tiền nước",
            "tiền internet",
            "wifi",
            "gas",
            "cước"
        ],
        "category": "Nhà",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Utilities"
    },
    {
        "intent": "travel",
        "locationType": null,
        "keywords": [
            "máy bay",
            "vé máy bay",
            "flight",
            "airplane",
            "hàng không"
        ],
        "category": "Du lịch",
        "priority": 3,
        "score": 55.0,
        "transactionType": "EXPENSE",
        "description": "Flight"
    },
    {
        "intent": "travel",
        "locationType": null,
        "keywords": [
            "khách sạn",
            "hotel",
            "resort",
            "homestay",
            "airbnb",
            "booking"
        ],
        "category": "Du lịch",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Accommodation"
    },
    {
        "intent": "education",
        "locationType": null,
        "keywords": [
            "học phí",
            "trường",
            "khóa học",
            "course",
            "sách",
            "book"
        ],
        "category": "Giáo dục",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Education"
    },
    {
        "intent": "pet",
        "locationType": null,
        "keywords": [
            "thú cưng",
            "pet",
            "chó",
            "mèo",
            "thức ăn cho pet",
            "thuốc cho pet"
        ],
        "category": "Thú cưng",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Pet care"
    },
    {
        "intent": "invest",
        "locationType": null,
        "keywords": [
            "gửi tiết kiệm",
            "tiết kiệm",
            "savings",
            "deposit"
        ],
        "category": "Tiết kiệm",
        "priority": 3,
        "score": 50.0,
        "transactionType": "EXPENSE",
        "description": "Savings"
    },
    {
        "intent": "invest",
        "locationType": null,
        "keywords": [
            "đầu tư",
            "chứng khoán",
            "cổ phiếu",
            "vàng",
            "crypto",
            "bất động sản"
        ],
        "category": "Tiết kiệm",
        "priority": 2,
        "score": 40.0,
        "transactionType": "EXPENSE",
        "description": "Investment"
    },
    {
        "intent": "food",
        "locationType": null,
        "keywords": [
            "ăn",
            "uống",
            "cơm",
            "phở",
            "bún",
            "mì",
            "hủ tiếu",
            "bánh",
            "cafe"
        ],
        "category": "Thức ăn & Đồ uống",
        "priority": 1,
        "score": 30.0,
        "transactionType": "EXPENSE",
        "description": "Generic food"
    },
    {
        "intent": "transport",
        "locationType": null,
        "keywords": [
            "xăng",
            "dầu",
            "xe máy",
            "ô tô",
            "sửa xe",
            "bảo dưỡng"
        ],
        "category": "Giao thông",
        "priority": 1,
        "score": 30.0,
        "transactionType": "EXPENSE",
        "description": "Generic transport"
    },
    {
        "intent": "income",
        "locationType": null,
        "keywords": [
            "lương",
            "lĩnh lương",
            "salary",
            "wage",
            "thu nhập"
        ],
        "category": "Lương",
        "priority": 4,
        "score": 60.0,
        "transactionType": "INCOME",
        "description": "Salary"
    },
    {
        "intent": "income",
        "locationType": null,
        "keywords": [
            "thưởng",
            "bonus",
            "thưởng tháng",
            "thưởng quý",
            "thưởng năm"
        ],
        "category": "Tiền thưởng",
        "priority": 4,
        "score": 60.0,
        "transactionType": "INCOME",
        "description": "Bonus"
    },
    {
        "intent": "income",
        "locationType": null,
        "keywords": [
            "cổ tức",
            "lãi",
            "dividend",
            "interest",
            "profit",
            "lợi nhuận"
        ],
        "category": "Đầu tư",
        "priority": 3,
        "score": 50.0,
        "transactionType": "INCOME",
        "description": "Investment returns"
    },
    {
        "intent": "income",
        "locationType": null,
        "keywords": [
            "bán hàng",
            "doanh thu",
            "kinh doanh",
            "buôn bán",
            "business"
        ],
        "category": "Kinh doanh",
        "priority": 3,
        "score": 50.0,
        "transactionType": "INCOME",
        "description": "Business income"
    }
];

function evaluateContextRules(text, intent, locationType) {
    const lower = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const rule of CONTEXT_RULES) {
        let score = 0;
        let matches = true;

        // Check intent
        if (rule.intent && rule.intent !== intent) {
            matches = false;
        } else if (rule.intent === intent) {
            score += 30;
        }

        // Check location
        if (rule.locationType && rule.locationType !== locationType) {
            matches = false;
        } else if (rule.locationType === locationType) {
            score += 25;
        }

        // Check keywords
        let keywordMatches = 0;
        for (const kw of rule.keywords) {
            if (lower.includes(kw.toLowerCase())) {
                keywordMatches++;
                score += 10 * (kw.length / 5);
            }
        }

        if (matches && (rule.keywords.length === 0 || keywordMatches > 0)) {
            score += rule.score + rule.priority * 5;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = rule;
            }
        }
    }

    return { rule: bestMatch, score: bestScore };
}

// ============================================================
// KEYWORD MATCHING
// ============================================================

const KEYWORD_RULES = {
    "Thức ăn & Đồ uống": {
        "keywords": [
            "phở",
            "bún",
            "cơm",
            "bánh",
            "café",
            "cà phê",
            "trà sữa",
            "bánh mì",
            "hủ tiếu",
            "mì",
            "pizza",
            "burger",
            "gà",
            "lẩu",
            "nướng",
            "ăn",
            "uống",
            "bia",
            "kem",
            "salad",
            "cháo",
            "xôi",
            "trà",
            "sinh tố",
            "cafe",
            "coffee",
            "tra sua",
            "bánh bao",
            "bánh cuốn",
            "cơm rang",
            "nước mía",
            "táo",
            "cam",
            "hoa quả",
            "thịt",
            "cá",
            "tôm",
            "rau",
            "trứng",
            "sữa",
            "gạo",
            "siêu thị",
            "tạp hóa",
            "sieu thi",
            "bánh",
            "kẹo",
            "nước ngọt",
            "rượu",
            "hamburger",
            "pizza",
            "gà rán",
            "gà nướng",
            "thịt bò",
            "thịt heo",
            "thịt gà",
            "cappuccino",
            "latte",
            "mocha",
            "espresso",
            "americano",
            "tra dao",
            "tra chanh",
            "tra oliu",
            "ca phe sua",
            "ca phe den",
            "yaourt",
            "sữa chua",
            "nước ép",
            "smoothie"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Mua sắm": {
        "keywords": [
            "áo",
            "quần",
            "váy",
            "đầm",
            "áo sơ mi",
            "áo thun",
            "quần jeans",
            "giày",
            "dép",
            "túi xách",
            "balo",
            "nón",
            "mũ",
            "thắt lưng",
            "đồng hồ",
            "trang sức",
            "shopping",
            "shop",
            "fashion",
            "clothing",
            "shoes",
            "bag",
            "wallet",
            "belt",
            "hat",
            "thời trang",
            "quần áo",
            "áo quần",
            "vòng",
            "dây chuyền",
            "bông",
            "nhẫn",
            "khuyên tai",
            "lắc tay",
            "lắc chân",
            "áo khoác",
            "áo len",
            "áo phông",
            "váy liền",
            "váy xòe",
            "váy ôm",
            "đầm casual",
            "đầm dự tiệc"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Giao thông": {
        "keywords": [
            "xăng",
            "dầu",
            "xe máy",
            "grab",
            "taxi",
            "uber",
            "bus",
            "buýt",
            "tàu",
            "metro",
            "xe",
            "di xe",
            "đi xe",
            "oto",
            "ô tô",
            "xe đạp",
            "parking",
            "đỗ xe",
            "bảo dưỡng",
            "sửa xe",
            "vé xe",
            "vé bus",
            "nhiên liệu",
            "bảo hiểm xe",
            "transport",
            "gas",
            "petrol",
            "fuel",
            "oil",
            "gojek",
            "be",
            "vietjet",
            "vietnam airline",
            "vietravel",
            "train",
            "tau hoa",
            "tram",
            "vé tháng",
            "phi cầu đường",
            "expressway",
            "xe khách",
            "limousine",
            "giao hàng",
            "ship",
            "vận chuyển",
            "delivery",
            "courier",
            "grabfood",
            "baemin"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Giải trí": {
        "keywords": [
            "phim",
            "cinema",
            "rạp phim",
            "game",
            "netflix",
            "spotify",
            "youtube",
            "zalo",
            "facebook",
            "tiktok",
            "karaoke",
            "hát",
            "nhạc",
            "âm nhạc",
            "console",
            "playstation",
            "xbox",
            "games",
            "chơi game",
            "youtube premium",
            "netflix premium",
            "spotify premium",
            "disney",
            "disney+",
            "prime video",
            "apple tv",
            "hbo",
            "concert",
            "show",
            "sự kiện",
            "event",
            "ticket",
            "livestream",
            "podcast",
            "audiobook",
            "ebook",
            "kindle",
            "steam",
            "epic games",
            "garena",
            "riot",
            "lol",
            "valorant",
            "genshin",
            "pubg",
            "free fire",
            "manga",
            "anime",
            "truyện",
            "series",
            "drama",
            "VIP",
            "premium",
            "thuê bao",
            "subscription"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Sức khỏe": {
        "keywords": [
            "thuốc",
            "khám bệnh",
            "bệnh viện",
            "bác sĩ",
            "thuốc men",
            "khám",
            "xét nghiệm",
            "siêu âm",
            "phòng khám",
            "tiêm",
            "vaccine",
            "bảo hiểm y tế",
            "nha khoa",
            "răng",
            "nhổ răng",
            "mắt",
            "kính mắt",
            "tim mạch",
            "da liễu",
            "thuốc bổ",
            "vitamin",
            "thực phẩm chức năng",
            "medicine",
            "drug",
            "pill",
            "tablet",
            "hospital",
            "clinic",
            "doctor",
            "checkup",
            "test",
            "pharmacy",
            "nhà thuốc",
            "drugstore",
            "prescription",
            "medical",
            "health",
            "healthcare",
            "insurance",
            "bhyt",
            "bảo hiểm",
            "tai nạn",
            "cấp cứu",
            "phẫu thuật",
            "mổ",
            "xạ trị",
            "hóa trị",
            "vật lý trị liệu",
            "physiotherapy",
            "massage y tế",
            "yoga trị liệu",
            "dinh dưỡng",
            "chế độ ăn",
            "giảm cân",
            "tăng cân",
            "protein",
            "whey protein"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Thực phẩm": {
        "keywords": [
            "thịt",
            "thịt heo",
            "thịt bò",
            "thịt gà",
            "cá",
            "cá hồi",
            "tôm",
            "cua",
            "rau",
            "rau muống",
            "rau cải",
            "trái cây",
            "hoa quả",
            "táo",
            "cam",
            "trứng",
            "sữa",
            "bơ",
            "nấm",
            "đậu",
            "gạo",
            "supermarket",
            "siêu thị",
            "tạp hóa",
            "sieu thi",
            "circle k",
            "gs25",
            "familymart",
            "vinmart",
            "co.opmart",
            "bigc",
            "aeon",
            "lotte mart",
            "food",
            "grocery",
            "market",
            "cà rốt",
            "bí đỏ",
            "bắp",
            "ngô",
            "khoai",
            "khoai lang",
            "khoai tay",
            "sả",
            "hành",
            "tỏi",
            "ớt",
            "gia vị",
            "muối",
            "đường",
            "nước mắm",
            "dầu ăn",
            "bột",
            "bánh tráng",
            "gỏi cuốn",
            "nem",
            "chả",
            "giò",
            "pho mai",
            "sữa chua",
            "yaourt",
            "cheese",
            "đậu phộng",
            "nước",
            "nước lọc",
            "nước giặt"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Điện tử": {
        "keywords": [
            "điện thoại",
            "smartphone",
            "iphone",
            "samsung",
            "laptop",
            "máy tính",
            "tablet",
            "ipad",
            "máy ảnh",
            "camera",
            "tai nghe",
            "airpods",
            "loa",
            "loa bluetooth",
            "smartwatch",
            "đồng hồ thông minh",
            "game console",
            "playstation",
            "xbox",
            "sạc",
            "cáp sạc",
            "ốp lưng",
            "usb",
            "ổ cứng",
            "electronic",
            "electronics",
            "tech",
            "gadget",
            "computer",
            "pc",
            "mac",
            "imac",
            "macbook",
            "surface",
            "dell",
            "hp",
            "lenovo",
            "asus",
            "acer",
            "headphone",
            "earphone",
            "earbuds",
            "speaker",
            "soundbar",
            "webcam",
            "monitor",
            "screen",
            "keyboard",
            "mouse",
            "cable",
            "adapter",
            "hub",
            "ssd",
            "hdd",
            "ram",
            "cpu",
            "gpu",
            "printer",
            "scanner",
            "router",
            "wifi",
            "modem",
            "sửa điện thoại",
            "sửa laptop",
            "sửa máy"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Làm đẹp": {
        "keywords": [
            "son",
            "kem",
            "spa",
            "massage",
            "tóc",
            "làm tóc",
            "nhuộm",
            "cắt tóc",
            "mỹ phẩm",
            "dưỡng",
            "nước hoa",
            "lipstick",
            "kem dưỡng",
            "skincare",
            "son môi",
            "nhuộm tóc",
            "uốn tóc",
            "gội đầu",
            "beauty",
            "cosmetic",
            "makeup",
            "hair",
            "nail",
            "manicure",
            "pedicure",
            "facial",
            "skin care",
            "serum",
            "toner",
            "moisturizer",
            "sunscreen",
            "kem chống nắng",
            "perfume",
            "cologne",
            "parfum",
            "duong da",
            "cham soc da",
            "wax",
            "shaving",
            "cạo râu",
            "tẩy lông",
            "nặn mụn",
            "đắp mặt nạ",
            "mask",
            "essence",
            "ampoule",
            "kem mắt",
            "kem chống nhăn",
            "kem trị mụn",
            "scrub"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Thể thao": {
        "keywords": [
            "gym",
            "tập gym",
            "thể thao",
            "chạy bộ",
            "bơi",
            "yoga",
            "tennis",
            "bóng đá",
            "fitness",
            "tap gym",
            "dumbbell",
            "tạ",
            "bơi lội",
            "chạy",
            "pilates",
            "bóng rổ",
            "cầu lông",
            "bida",
            "leo núi",
            "hiking",
            "thẻ gym",
            "vô gym",
            "sport",
            "sports",
            "exercise",
            "workout",
            "training",
            "running",
            "jogging",
            "marathon",
            "cycling",
            "bike",
            "bicycle",
            "swimming",
            "football",
            "soccer",
            "basketball",
            "volleyball",
            "boxing",
            "mma",
            "kickboxing",
            "karate",
            "judo",
            "taekwondo",
            "muay thai",
            "crossfit",
            "hiit",
            "cardio",
            "giày chạy bộ",
            "giày thể thao",
            "thẻ gym",
            "vé gym",
            "phòng gym",
            "phòng tập",
            "huấn luyện viên",
            "PT"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Giáo dục": {
        "keywords": [
            "học phí",
            "sách",
            "khóa học",
            "trường",
            "lớp",
            "sách giáo khoa",
            "sách tham khảo",
            "vở",
            "bút",
            "thước",
            "gia sư",
            "tiếng Anh",
            "toán",
            "guitar",
            "piano",
            "vẽ",
            "chứng chỉ",
            "học online",
            "elearning",
            "education",
            "school",
            "university",
            "college",
            "course",
            "book",
            "textbook",
            "notebook",
            "pen",
            "pencil",
            "eraser",
            "ruler",
            "bag",
            "school bag",
            "uniform",
            "hoc phi",
            "hoc bong",
            "scholarship",
            "fee",
            "tuition",
            "tiếng anh",
            "tiếng trung",
            "tiếng nhật",
            "tiếng hàn",
            "udemy",
            "coursera",
            "edx",
            "skillshare",
            "workshop",
            "seminar",
            "training",
            "bằng",
            "thạc sĩ",
            "tiến sĩ",
            "đại học",
            "cao đẳng",
            "trung cấp"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Nhà": {
        "keywords": [
            "thuê nhà",
            "tiền thuê nhà",
            "điện",
            "nước",
            "internet",
            "wifi",
            "mạng",
            "data",
            "4g",
            "5g",
            "sim",
            "cước",
            "gas",
            "ga",
            "bếp ga",
            "nhà",
            "trọ",
            "thuê",
            "tiền nhà",
            "tiền điện",
            "tiền nước",
            "tiền internet",
            "sửa chữa",
            "bảo trì",
            "home",
            "house",
            "apartment",
            "condo",
            "penthouse",
            "villa",
            "townhouse",
            "studio",
            "rent",
            "rental",
            "lease",
            "utilities",
            "electricity",
            "water",
            "gas",
            "heating",
            "cooling",
            "ac",
            "air conditioner",
            "internet bill",
            "phone bill",
            "cable",
            "tv",
            "maintenance",
            "repair",
            "renovation",
            "furniture",
            "noi that",
            "bed",
            "sofa",
            "table",
            "chair",
            "lamp",
            "hoa don",
            "bill",
            "phí quản lý",
            "phí giữ xe",
            "phí bảo vệ",
            "phí dịch vụ",
            "đặt cọc"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Du lịch": {
        "keywords": [
            "máy bay",
            "vé máy bay",
            "khách sạn",
            "resort",
            "homestay",
            "hotel",
            "tour",
            "du lịch",
            "nghỉ mát",
            "vacation",
            "travel",
            "flight",
            "airplane",
            "plane",
            "booking",
            "airbnb",
            "hostel",
            "motel",
            "visa",
            "passport",
            "hộ chiếu",
            "vali",
            "beach",
            "bien",
            "núi",
            "cano",
            "tàu thuyền",
            "bãi biển",
            "đảo",
            "canyon",
            "thác",
            "công viên",
            "zoo",
            "sở thú",
            "bảo tàng",
            "đền",
            "chùa",
            "nhà thờ",
            "checkin",
            "checkout",
            "phòng",
            "giường",
            "suite",
            "deluxe",
            "vé",
            "ticket",
            "pass",
            "hành lý",
            "suitcase",
            "backpack",
            "ba lô",
            "trekking",
            "camping",
            "lều",
            "dịch vụ",
            "taxi",
            "xe buýt",
            "bus",
            "tàu",
            "metro"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Thú cưng": {
        "keywords": [
            "chó",
            "mèo",
            "cá",
            "chim",
            "thú cưng",
            "pet",
            "thức ăn cho pet",
            "thuốc cho pet",
            "tiêm pet",
            "tắm pet",
            "thú y",
            "đồ chơi cho pet",
            "pet care",
            "dog",
            "cat",
            "fish",
            "bird",
            "hamsters",
            "rabbit",
            "veterinary",
            "clinic thu y",
            "pet shop",
            "cua hang thu cung",
            "pet store",
            "aquarium",
            "ho ca",
            "bể cá",
            "xương",
            "pate",
            "sữa cho chó",
            "sữa cho mèo",
            "thuốc chống ve",
            "thuốc xổ giun",
            "xịt trùng",
            "spa cho thú cưng",
            "grooming",
            "cat tower",
            "nhà cho chó",
            "chuồng",
            "lồng",
            "vòng cổ",
            "dây dắt",
            "bàng",
            "ral",
            "rọ mõm",
            "giường thú cưng"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Nợ": {
        "keywords": [
            "trả nợ",
            "ghi nợ",
            "vay nợ",
            "vay",
            "nợ",
            "đi vay",
            "cho vay",
            "mượn tiền",
            "thanh toán",
            "debt",
            "borrow",
            "lend",
            "loan",
            "credit",
            "installment",
            "trả góp",
            "monthly payment",
            "interest",
            "lãi",
            "principal",
            "gốc",
            "balance",
            "số dư nợ",
            "outstanding",
            "overdue",
            "quá hạn",
            "default",
            "bankruptcy",
            "bảo lãnh",
            "guarantor",
            "cosigner",
            "giấy nợ",
            "IOU",
            "hợp đồng",
            "agreement",
            "vay mượn",
            "đòi nợ",
            "thu nợ",
            "trả tiền thay",
            "chuyển khoản",
            "payment"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Tiết kiệm": {
        "keywords": [
            "tiết kiệm",
            "gửi tiết kiệm",
            "vàng",
            "quỹ dự phòng",
            "quỹ khẩn cấp",
            "saving",
            "savings",
            "deposit",
            "fixed deposit",
            "term deposit",
            "interest",
            "gold",
            "silver",
            "precious metal",
            "emergency fund",
            "retirement fund",
            "quỹ hưu trí",
            "insurance",
            "bao hiem",
            "life insurance",
            "health insurance",
            "endowment",
            "unit link",
            "pension",
            "social insurance",
            "bhxh",
            "compound interest",
            "lãi kép",
            "DCA",
            "mở sổ",
            "tích lũy",
            "dự phòng"
        ],
        "weight": 25.0,
        "priority": 2,
        "transactionType": "EXPENSE"
    },
    "Lương": {
        "keywords": [
            "lương",
            "thu nhập",
            "lĩnh lương",
            "nhận lương",
            "trả lương",
            "salary",
            "wage",
            "pay",
            "paycheck",
            "payroll",
            "lương tháng",
            "lương tuần",
            "lương ngày",
            "payday",
            "lương tháng 13",
            "tăng lương",
            "lương cứng",
            "lương NET",
            "lương gross",
            "lương cơ bản",
            "tiền công",
            "tiền lương",
            "lãnh lương",
            "rút lương",
            "ứng lương",
            "lương thử việc",
            "lương chính thức"
        ],
        "weight": 30.0,
        "priority": 3,
        "transactionType": "INCOME"
    },
    "Đầu tư": {
        "keywords": [
            "lãi",
            "cổ tức",
            "đầu tư",
            "chứng khoán",
            "bán cổ phiếu",
            "lãi đầu tư",
            "lãi tiết kiệm",
            "dividend",
            "interest",
            "profit",
            "stock",
            "share",
            "bond",
            "investment",
            "return",
            "capital gain",
            "lãi kép",
            "lãi suất",
            "lãi ngân hàng",
            "cổ phiếu",
            "chứng khoán",
            "VN-Index",
            "blue chip",
            "trade",
            "day trade",
            "quỹ mở",
            "mutual fund",
            "ETF",
            "bất động sản",
            "cho thuê",
            "vàng",
            "gold",
            "crypto",
            "bitcoin",
            "ethereum",
            "forex",
            "lợi nhuận",
            "hoàn vốn",
            "ROI",
            "yield",
            "coupon",
            "trái phiếu"
        ],
        "weight": 30.0,
        "priority": 3,
        "transactionType": "INCOME"
    },
    "Tiền thưởng": {
        "keywords": [
            "thưởng",
            "lì xì",
            "quà",
            "hoa hồng",
            "commission",
            "bonus",
            "gift",
            "reward",
            "prize",
            "award",
            "thưởng tháng",
            "thưởng quý",
            "thưởng năm",
            "thưởng Tết",
            "thưởng dịp lễ",
            "thưởng thành tích",
            "thưởng hiệu suất",
            "thưởng doanh thu",
            "year-end bonus",
            "performance bonus",
            "sales bonus",
            "hoa hồng",
            "brokerage",
            "referral bonus",
            "giới thiệu",
            "referral",
            "affiliate",
            "cashback",
            "hoàn tiền",
            "cash reward",
            "quà tặng",
            "gift voucher",
            "giải thưởng",
            "prize",
            "competition prize",
            "giải nhất",
            "giải nhì",
            "giải ba",
            "xổ số",
            "trúng thưởng"
        ],
        "weight": 30.0,
        "priority": 3,
        "transactionType": "INCOME"
    },
    "Kinh doanh": {
        "keywords": [
            "bán hàng",
            "kinh doanh",
            "doanh thu",
            "buôn bán",
            "business",
            "sale",
            "revenue",
            "profit",
            "shop",
            "cửa hàng",
            "store",
            "online shop",
            "shop online",
            "thương mại điện tử",
            "e-commerce",
            "tiki",
            "shopee",
            "lazada",
            "amazon",
            "facebook shop",
            "instagram shop",
            "tiktok shop",
            "woocommerce",
            "shopify",
            "doanh thu kinh doanh",
            "khởi nghiệp",
            "startup",
            "entrepreneur",
            "chủ doanh nghiệp",
            "chủ shop",
            "dropship",
            "freelance",
            "freelancer",
            "side hustle",
            "kinh doanh nhỏ",
            "small business",
            "quán",
            "quán cafe",
            "quán ăn",
            "nhà hàng",
            "buôn bán",
            "trade",
            "wholesale",
            "bán sỉ",
            "bán lẻ",
            "retail",
            "nhập hàng",
            "sản xuất",
            "manufacturing",
            "dịch vụ",
            "service",
            "consulting",
            "tư vấn",
            "agency",
            "marketing agency",
            "quảng cáo",
            "advertising"
        ],
        "weight": 30.0,
        "priority": 3,
        "transactionType": "INCOME"
    },
    "Chưa phân loại": {
        "keywords": [
            "khác",
            "linh tinh",
            "tổng",
            "chung",
            "misc",
            "gì",
            "chi phí",
            "thu nhập",
            "không rõ"
        ],
        "weight": 5.0,
        "priority": 1,
        "transactionType": "EXPENSE"
    }
};

function matchKeywords(text) {
    const lower = text.toLowerCase();
    const scores = {};

    for (const [category, rule] of Object.entries(KEYWORD_RULES)) {
        let matchedKeywords = [];
        let score = 0;

        for (const kw of rule.keywords) {
            if (lower.includes(kw.toLowerCase())) {
                matchedKeywords.push(kw);
                score += rule.weight * (kw.length / 5);
            }
        }

        if (matchedKeywords.length > 0) {
            // Position bonus
            for (const kw of matchedKeywords) {
                const pos = lower.indexOf(kw.toLowerCase());
                if (pos === 0) score += 5;
                else if (pos < 15) score += 3;
            }

            scores[category] = { score, keywords: matchedKeywords };
        }
    }

    return scores;
}

// ============================================================
// NEGATIVE RULES
// ============================================================

const NEGATIVE_RULES = [
    {
        "keywords": [
            "điện thoại",
            "smartphone",
            "iphone",
            "samsung",
            "điện thoại di động"
        ],
        "excludedCategories": [
            "Nhà"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Phone-related should not trigger HOME"
    },
    {
        "keywords": [
            "điện tử",
            "đồ điện",
            "thiết bị điện",
            "máy điện"
        ],
        "excludedCategories": [
            "Nhà"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Electronics should not trigger HOME"
    },
    {
        "keywords": [
            "grabfood",
            "grab food",
            "now",
            "baemin",
            "shopeefood",
            "shopee food"
        ],
        "excludedCategories": [
            "Giao thông"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Food delivery should not trigger TRANSPORT"
    },
    {
        "keywords": [
            "bắt đầu",
            "bắt đầu làm",
            "bắt tay",
            "bắt cá"
        ],
        "excludedCategories": [
            "Giao thông"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Non-transport usage of 'bắt'"
    },
    {
        "keywords": [
            "gửi xe",
            "gửi đồ",
            "gửi mail",
            "gửi tin nhắn",
            "gửi message"
        ],
        "excludedCategories": [
            "Tiết kiệm"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Non-savings usage of 'gửi'"
    },
    {
        "keywords": [
            "đầu tư",
            "đầu tư chứng khoán",
            "đầu tư bất động sản",
            "đầu tư vàng"
        ],
        "excludedCategories": [
            "Đầu tư"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Investment expense should not trigger investment income"
    },
    {
        "keywords": [
            "học",
            "học phí",
            "trường học",
            "học online",
            "khóa học"
        ],
        "excludedCategories": [
            "Giải trí"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Education should not trigger entertainment"
    },
    {
        "keywords": [
            "bệnh viện",
            "thuốc",
            "khám bệnh",
            "bác sĩ",
            "phòng khám"
        ],
        "excludedCategories": [
            "Thể thao"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Medical/health should not trigger sports"
    },
    {
        "keywords": [
            "mua điện thoại",
            "mua laptop",
            "mua máy tính",
            "mua tablet"
        ],
        "excludedCategories": [
            "Thực phẩm"
        ],
        "ruleType": "soft_penalty",
        "penalty": 50.0,
        "description": "Electronics purchase should not trigger grocery"
    },
    {
        "keywords": [
            "mua son",
            "mua kem",
            "mua mỹ phẩm",
            "mua nước hoa"
        ],
        "excludedCategories": [
            "Thực phẩm"
        ],
        "ruleType": "soft_penalty",
        "penalty": 50.0,
        "description": "Beauty purchase should not trigger grocery"
    },
    {
        "keywords": [
            "mua thịt",
            "mua cá",
            "mua rau",
            "mua trái cây"
        ],
        "excludedCategories": [
            "Mua sắm"
        ],
        "ruleType": "soft_penalty",
        "penalty": 30.0,
        "description": "Grocery items should not trigger general shopping"
    },
    {
        "keywords": [
            "ăn phở",
            "ăn bún",
            "ăn cơm",
            "ăn bánh",
            "ăn pizza"
        ],
        "excludedCategories": [
            "Mua sắm",
            "Du lịch"
        ],
        "ruleType": "soft_penalty",
        "penalty": 40.0,
        "description": "Food should not trigger shopping or travel"
    },
    {
        "keywords": [
            "mua điện thoại",
            "mua smartphone",
            "mua iphone",
            "mua samsung"
        ],
        "excludedCategories": [
            "Nhà",
            "Thực phẩm"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Phone purchase is electronics"
    },
    {
        "keywords": [
            "mua laptop",
            "mua máy tính",
            "mua macbook",
            "mua imac"
        ],
        "excludedCategories": [
            "Nhà",
            "Thực phẩm"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Computer purchase is electronics"
    },
    {
        "keywords": [
            "mua thuốc",
            "mua thuốc men",
            "mua vitamin",
            "mua thực phẩm chức năng"
        ],
        "excludedCategories": [
            "Thực phẩm"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Medicine purchase is health"
    },
    {
        "keywords": [
            "thuê xe máy",
            "thuê xe",
            "thuê ô tô",
            "thuê xe đạp"
        ],
        "excludedCategories": [
            "Nhà"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Vehicle rental is transport"
    },
    {
        "keywords": [
            "sửa xe",
            "sửa xe máy",
            "sửa ô tô",
            "thay nhớt",
            "thay dầu"
        ],
        "excludedCategories": [
            "Nhà"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Vehicle repair is transport"
    },
    {
        "keywords": [
            "đổ xăng",
            "đổ dầu",
            "nạp xăng",
            "bơm xăng"
        ],
        "excludedCategories": [
            "Nhà"
        ],
        "ruleType": "hard_exclude",
        "penalty": 100.0,
        "description": "Fuel is transport"
    }
];

function applyNegativeRules(text, categories) {
    const lower = text.toLowerCase();
    const filtered = [...categories];
    const penalties = {};

    for (const rule of NEGATIVE_RULES) {
        const matches = rule.keywords.some(kw => lower.includes(kw.toLowerCase()));

        if (matches) {
            for (const cat of rule.excludedCategories) {
                const idx = filtered.indexOf(cat);
                if (idx !== -1 && rule.ruleType === 'hard_exclude') {
                    filtered.splice(idx, 1);
                } else if (rule.ruleType === 'soft_penalty') {
                    penalties[cat] = (penalties[cat] || 0) + rule.penalty;
                }
            }
        }
    }

    return { categories: filtered, penalties };
}

// ============================================================
// AMOUNT EXTRACTION
// ============================================================

const AMOUNT_PATTERNS = [
    // 2tr5 format
    { regex: /(\d+)\s*tr\s*(\d+)/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    // 2.5tr format
    { regex: /(\d+)[.,](\d+)\s*tr\b/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    // 2tr format
    { regex: /(\d+)\s*tr\b/i, convert: m => parseInt(m[1]) * 1000000 },
    // 2 triệu format
    { regex: /(\d+)[.,](\d+)\s*(?:triệu|trieu|million)/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    { regex: /(\d+)\s*(?:triệu|trieu|million)\b/i, convert: m => parseInt(m[1]) * 1000000 },
    // 35ka format
    { regex: /(\d+)[.,](\d+)\s*ka\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\d+)\s*ka\b/i, convert: m => parseInt(m[1]) * 1000 },
    // 35k format
    { regex: /(\d+)[.,](\d+)\s*k\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\d+)\s*k\b/i, convert: m => parseInt(m[1]) * 1000 },
    // 35 nghìn format
    { regex: /(\d+)[.,](\d+)\s*(?:nghìn|nghin|ngàn|ngan)\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\d+)\s*(?:nghìn|nghin|ngàn|ngan)\b/i, convert: m => parseInt(m[1]) * 1000 },
];

function extractAmount(text) {
    const lower = text.toLowerCase().trim();

    for (const pattern of AMOUNT_PATTERNS) {
        const match = lower.match(pattern.regex);
        if (match) {
            try {
                const result = pattern.convert(match);
                if (result > 0) return result;
            } catch (e) {
                continue;
            }
        }
    }

    // Fallback: plain number (4-7 digits)
    const numMatch = lower.match(/\b(\d{4,7})\b/);
    if (numMatch && parseInt(numMatch[1]) >= 1000) {
        return parseInt(numMatch[1]);
    }

    return 0;
}

// ============================================================
// MAIN CLASSIFIER
// ============================================================

function classifyTransaction(text) {
    if (!text || !text.trim()) {
        return {
            category: "Chưa phân loại",
            categoryId: "uncategorized",
            type: "EXPENSE",
            confidence: 0,
            amount: 0,
            originalText: text || "",
        };
    }

    const originalText = text.trim();

    // Layer 1: Normalization
    const normalized = normalizeText(originalText);

    // Layer 2: Merchant Detection
    const merchant = detectMerchant(normalized);
    const locationType = merchant ? merchant.locationType : null;

    // Layer 3: Intent Detection
    const intentInfo = detectIntent(normalized);
    const primaryIntent = intentInfo.intent;

    // Layer 4: Context Rules
    const contextResult = evaluateContextRules(normalized, primaryIntent, locationType);
    const contextScore = contextResult.score;
    const contextCategory = contextResult.rule ? contextResult.rule.category : null;

    // Layer 5: Keyword Matching
    const keywordScores = matchKeywords(normalized);

    // Layer 6: Negative Rules
    const allCategories = new Set();
    if (contextCategory) allCategories.add(contextCategory);
    for (const cat of Object.keys(keywordScores)) allCategories.add(cat);

    const { categories: filteredCategories, penalties } = applyNegativeRules(
        normalized,
        Array.from(allCategories)
    );

    // Determine transaction type from intent
    let transactionType = "EXPENSE";
    const incomeIntents = ["income", "salary", "investment", "bonus", "business"];
    if (primaryIntent && incomeIntents.includes(primaryIntent)) {
        transactionType = "INCOME";
    }

    // Calculate final scores
    let bestCategory = contextCategory || "Chưa phân loại";
    let bestScore = contextScore;

    // Check keyword scores
    for (const [category, { score, keywords }] of Object.entries(keywordScores)) {
        const penalty = penalties[category] || 0;
        const adjustedScore = score - penalty;

        if (adjustedScore > bestScore && filteredCategories.includes(category)) {
            bestScore = adjustedScore;
            bestCategory = category;
        }
    }

    // Fallback to uncategorized if no match
    if (!filteredCategories.includes(bestCategory)) {
        bestCategory = "Chưa phân loại";
    }

    // Get category ID
    const categoryId = CATEGORY_ID_MAP[bestCategory] || "uncategorized";

    // Calculate confidence
    const confidence = Math.min(bestScore / 100, 1);

    // Extract amount
    const amount = extractAmount(originalText);

    return {
        category: bestCategory,
        categoryId: categoryId,
        type: transactionType,
        confidence: Math.round(confidence * 100) / 100,
        amount: amount,
        originalText: originalText,
        merchant: merchant ? merchant.name : null,
        primaryIntent: primaryIntent,
        layersUsed: ["normalization", "merchant_detection", "intent_detection", "context_rules", "keyword_matching", "negative_rules"],
    };
}

// Named export for default
export default classifyTransaction;

// Also export individual functions for advanced usage
export {
    normalizeText,
    detectMerchant,
    detectIntent,
    evaluateContextRules,
    matchKeywords,
    applyNegativeRules,
    extractAmount,
    CATEGORY_ID_MAP,
    CATEGORY_TYPE,
    TransactionType,
};
