"""
Test Suite for Transaction Classifier
==================================
Comprehensive testing across all categories.

Run with:
    python -m pytest test_suite.py -v
    python test_suite.py  # Direct run
"""

import sys
import json
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from transaction_classifier import TransactionClassifier, parse_transaction


@dataclass
class TxTestCase:
    """A test case for transaction classification."""
    text: str
    expected_category: str
    expected_type: str  # "EXPENSE" or "INCOME"
    notes: str = ""


@dataclass
class CategoryTestSuite:
    """Test suite for a category."""
    category: str
    test_cases: List[TxTestCase]
    expected_type: str


# ============================================================
# TEST DATA
# ============================================================

# Food & Beverage tests
FOOD_TESTS = [
    # Basic food
    TxTestCase("ăn phở 45k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("uống cafe 35k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("ăn trưa 50k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("mua bánh mì 15k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("uống trà sữa 40k", "Thức ăn & Đồ uống", "EXPENSE"),

    # Restaurant
    TxTestCase("ăn ở nhà hàng 200k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("đi ăn buffet 500k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("lẩu 300k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("nướng 250k", "Thức ăn & Đồ uống", "EXPENSE"),

    # Coffee shops
    TxTestCase("cafe highlands 60k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("starbucks 80k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("phúc long 45k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("the coffee house 50k", "Thức ăn & Đồ uống", "EXPENSE"),

    # Fast food
    TxTestCase("kfc 120k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("mcdonald 100k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("lotteria 90k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("pizza hut 200k", "Thức ăn & Đồ uống", "EXPENSE"),

    # Mall context - FOOD
    TxTestCase("ăn ở royal city 200k", "Thức ăn & Đồ uống", "EXPENSE", "FOOD + MALL = Food"),
    TxTestCase("uống cafe vincom 60k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("ăn ở lotte 150k", "Thức ăn & Đồ uống", "EXPENSE"),
    TxTestCase("ăn ở aeon 180k", "Thức ăn & Đồ uống", "EXPENSE"),
]

# Shopping tests
SHOPPING_TESTS = [
    # Basic shopping
    TxTestCase("mua áo 200k", "Mua sắm", "EXPENSE"),
    TxTestCase("mua quần 300k", "Mua sắm", "EXPENSE"),
    TxTestCase("mua giày 500k", "Mua sắm", "EXPENSE"),
    TxTestCase("mua túi xách 800k", "Mua sắm", "EXPENSE"),
    TxTestCase("shopping 1tr", "Mua sắm", "EXPENSE"),

    # Fashion
    TxTestCase("mua đầm 600k", "Mua sắm", "EXPENSE"),
    TxTestCase("mua váy 350k", "Mua sắm", "EXPENSE"),
    TxTestCase("mua áo thun 150k", "Mua sắm", "EXPENSE"),
    TxTestCase("mua quần jeans 400k", "Mua sắm", "EXPENSE"),

    # Online shopping
    TxTestCase("mua trên shopee 300k", "Mua sắm", "EXPENSE"),
    TxTestCase("shopee 200k", "Mua sắm", "EXPENSE"),
    TxTestCase("lazada 150k", "Mua sắm", "EXPENSE"),
    TxTestCase("tiki 250k", "Mua sắm", "EXPENSE"),

    # Mall context - SHOPPING
    TxTestCase("mua đồ ở royal city 500k", "Mua sắm", "EXPENSE", "BUY + MALL = Shopping"),
    TxTestCase("đi vincom mua đồ 300k", "Mua sắm", "EXPENSE"),
    TxTestCase("shopping vincom 1tr", "Mua sắm", "EXPENSE"),
    TxTestCase("mua quần áo aeon 400k", "Mua sắm", "EXPENSE"),
]

# Transport tests
TRANSPORT_TESTS = [
    # Basic transport
    TxTestCase("grab 50k", "Giao thông", "EXPENSE"),
    TxTestCase("taxi 80k", "Giao thông", "EXPENSE"),
    TxTestCase("uber 60k", "Giao thông", "EXPENSE"),
    TxTestCase("be 45k", "Giao thông", "EXPENSE"),

    # Fuel
    TxTestCase("xăng 100k", "Giao thông", "EXPENSE"),
    TxTestCase("đổ xăng 200k", "Giao thông", "EXPENSE"),
    TxTestCase("đổ dầu 150k", "Giao thông", "EXPENSE"),
    TxTestCase("nạp xăng 80k", "Giao thông", "EXPENSE"),

    # Parking
    TxTestCase("gửi xe 20k", "Giao thông", "EXPENSE"),
    TxTestCase("parking 30k", "Giao thông", "EXPENSE"),
    TxTestCase("gửi xe máy 15k", "Giao thông", "EXPENSE"),
    TxTestCase("đỗ xe 25k", "Giao thông", "EXPENSE"),

    # Mall context - TRANSPORT
    TxTestCase("gửi xe royal city 30k", "Giao thông", "EXPENSE", "PARK + MALL = Transport"),
    TxTestCase("parking vincom 40k", "Giao thông", "EXPENSE"),
    TxTestCase("đỗ xe lotte 25k", "Giao thông", "EXPENSE"),
]

# Entertainment tests
ENTERTAINMENT_TESTS = [
    # Streaming
    TxTestCase("netflix 70k", "Giải trí", "EXPENSE"),
    TxTestCase("spotify 45k", "Giải trí", "EXPENSE"),
    TxTestCase("youtube premium 80k", "Giải trí", "EXPENSE"),
    TxTestCase("disney+ 90k", "Giải trí", "EXPENSE"),

    # Cinema
    TxTestCase("xem phim 100k", "Giải trí", "EXPENSE"),
    TxTestCase("vé phim cgv 120k", "Giải trí", "EXPENSE"),
    TxTestCase("mua vé xem phim 150k", "Giải trí", "EXPENSE"),
    TxTestCase("rap chieu 100k", "Giải trí", "EXPENSE"),

    # Gaming
    TxTestCase("mua game 200k", "Giải trí", "EXPENSE"),
    TxTestCase("steam 300k", "Giải trí", "EXPENSE"),
    TxTestCase("garena 100k", "Giải trí", "EXPENSE"),

    # Mall context - ENTERTAINMENT
    TxTestCase("xem phim royal city 150k", "Giải trí", "EXPENSE", "ENTERTAINMENT + MALL = Entertainment"),
    TxTestCase("xem phim vincom 120k", "Giải trí", "EXPENSE"),
    TxTestCase("cgv royal city 130k", "Giải trí", "EXPENSE"),
]

# Health tests
HEALTH_TESTS = [
    TxTestCase("khám bệnh 200k", "Sức khỏe", "EXPENSE"),
    TxTestCase("bệnh viện 500k", "Sức khỏe", "EXPENSE"),
    TxTestCase("bác sĩ 150k", "Sức khỏe", "EXPENSE"),
    TxTestCase("thuốc 100k", "Sức khỏe", "EXPENSE"),
    TxTestCase("nhà thuốc 50k", "Sức khỏe", "EXPENSE"),
    TxTestCase("phòng khám 200k", "Sức khỏe", "EXPENSE"),
    TxTestCase("vitamin 150k", "Sức khỏe", "EXPENSE"),
    TxTestCase("khám răng 500k", "Sức khỏe", "EXPENSE"),
]

# Grocery tests
GROCERY_TESTS = [
    TxTestCase("siêu thị 200k", "Thực phẩm", "EXPENSE"),
    TxTestCase("winmart 300k", "Thực phẩm", "EXPENSE"),
    TxTestCase("coopmart 250k", "Thực phẩm", "EXPENSE"),
    TxTestCase("bigc 400k", "Thực phẩm", "EXPENSE"),
    TxTestCase("mua thịt 150k", "Thực phẩm", "EXPENSE"),
    TxTestCase("mua rau 50k", "Thực phẩm", "EXPENSE"),
    TxTestCase("mua cá 100k", "Thực phẩm", "EXPENSE"),
    TxTestCase("mua sữa 80k", "Thực phẩm", "EXPENSE"),
    TxTestCase("circle k 50k", "Thực phẩm", "EXPENSE"),
    TxTestCase("familymart 60k", "Thực phẩm", "EXPENSE"),
]

# Electronics tests
ELECTRONICS_TESTS = [
    TxTestCase("mua điện thoại 10tr", "Điện tử", "EXPENSE"),
    TxTestCase("mua iphone 20tr", "Điện tử", "EXPENSE"),
    TxTestCase("mua laptop 15tr", "Điện tử", "EXPENSE"),
    TxTestCase("mua sạc 100k", "Điện tử", "EXPENSE"),
    TxTestCase("mua tai nghe 500k", "Điện tử", "EXPENSE"),
    TxTestCase("sửa điện thoại 200k", "Điện tử", "EXPENSE"),
    TxTestCase("mua airpods 5tr", "Điện tử", "EXPENSE"),
    TxTestCase("mua camera 8tr", "Điện tử", "EXPENSE"),
]

# Beauty tests
BEAUTY_TESTS = [
    TxTestCase("spa 300k", "Làm đẹp", "EXPENSE"),
    TxTestCase("massage 200k", "Làm đẹp", "EXPENSE"),
    TxTestCase("làm tóc 150k", "Làm đẹp", "EXPENSE"),
    TxTestCase("cắt tóc 80k", "Làm đẹp", "EXPENSE"),
    TxTestCase("nhuộm tóc 200k", "Làm đẹp", "EXPENSE"),
    TxTestCase("mua son 120k", "Làm đẹp", "EXPENSE"),
    TxTestCase("mua kem dưỡng 200k", "Làm đẹp", "EXPENSE"),
    TxTestCase("nail 100k", "Làm đẹp", "EXPENSE"),
    TxTestCase("làm móng 150k", "Làm đẹp", "EXPENSE"),
]

# Sports tests
SPORTS_TESTS = [
    TxTestCase("gym 500k", "Thể thao", "EXPENSE"),
    TxTestCase("phòng gym 400k", "Thể thao", "EXPENSE"),
    TxTestCase("tập gym 300k", "Thể thao", "EXPENSE"),
    TxTestCase("thẻ gym 1tr", "Thể thao", "EXPENSE"),
    TxTestCase("vô gym 50k", "Thể thao", "EXPENSE"),
    TxTestCase("mua giày chạy bộ 500k", "Thể thao", "EXPENSE"),
    TxTestCase("yoga 300k", "Thể thao", "EXPENSE"),
]

# Education tests
EDUCATION_TESTS = [
    TxTestCase("học phí 5tr", "Giáo dục", "EXPENSE"),
    TxTestCase("sách 200k", "Giáo dục", "EXPENSE"),
    TxTestCase("khóa học 1tr", "Giáo dục", "EXPENSE"),
    TxTestCase("ielts 5tr", "Giáo dục", "EXPENSE"),
    TxTestCase("udemy 300k", "Giáo dục", "EXPENSE"),
    TxTestCase("mua sách giáo khoa 150k", "Giáo dục", "EXPENSE"),
]

# Home tests
HOME_TESTS = [
    TxTestCase("tiền nhà 5tr", "Nhà", "EXPENSE"),
    TxTestCase("thuê nhà 8tr", "Nhà", "EXPENSE"),
    TxTestCase("tiền điện 500k", "Nhà", "EXPENSE"),
    TxTestCase("tiền nước 100k", "Nhà", "EXPENSE"),
    TxTestCase("tiền internet 200k", "Nhà", "EXPENSE"),
    TxTestCase("wifi 150k", "Nhà", "EXPENSE"),
    TxTestCase("sửa nhà 2tr", "Nhà", "EXPENSE"),
]

# Travel tests
TRAVEL_TESTS = [
    TxTestCase("vé máy bay 2tr", "Du lịch", "EXPENSE"),
    TxTestCase("khách sạn 1tr", "Du lịch", "EXPENSE"),
    TxTestCase("du lịch 10tr", "Du lịch", "EXPENSE"),
    TxTestCase("booking hotel 500k", "Du lịch", "EXPENSE"),
    TxTestCase("homestay 300k", "Du lịch", "EXPENSE"),
    TxTestCase("resort 2tr", "Du lịch", "EXPENSE"),
]

# Pet tests
PET_TESTS = [
    TxTestCase("thức ăn cho chó 200k", "Thú cưng", "EXPENSE"),
    TxTestCase("thuốc cho mèo 100k", "Thú cưng", "EXPENSE"),
    TxTestCase("pet shop 150k", "Thú cưng", "EXPENSE"),
    TxTestCase("tắm cho chó 100k", "Thú cưng", "EXPENSE"),
    TxTestCase("tiêm pet 200k", "Thú cưng", "EXPENSE"),
]

# Income tests
SALARY_TESTS = [
    TxTestCase("lương 15tr", "Lương", "INCOME"),
    TxTestCase("nhận lương 20tr", "Lương", "INCOME"),
    TxTestCase("lĩnh lương 10tr", "Lương", "INCOME"),
]

INVESTMENT_INCOME_TESTS = [
    TxTestCase("cổ tức 2tr", "Đầu tư", "INCOME"),
    TxTestCase("lãi đầu tư 5tr", "Đầu tư", "INCOME"),
    TxTestCase("lãi tiết kiệm 1tr", "Đầu tư", "INCOME"),
]

BONUS_TESTS = [
    TxTestCase("thưởng 5tr", "Tiền thưởng", "INCOME"),
    TxTestCase("thưởng Tết 10tr", "Tiền thưởng", "INCOME"),
    TxTestCase("thưởng tháng 3tr", "Tiền thưởng", "INCOME"),
    TxTestCase("lì xì 200k", "Tiền thưởng", "INCOME"),
]

BUSINESS_TESTS = [
    TxTestCase("bán hàng 500k", "Kinh doanh", "INCOME"),
    TxTestCase("doanh thu 2tr", "Kinh doanh", "INCOME"),
    TxTestCase("buôn bán 1tr", "Kinh doanh", "INCOME"),
]


# ============================================================
# TEST RUNNER
# ============================================================

class TransactionClassifierTests:
    """Test cases for transaction classifier."""

    def run_category_tests(self, tests: List[TestCase], category: str):
        """Run tests for a category."""
        classifier = TransactionClassifier()

        passed = 0
        failed = 0
        results = []

        for test in tests:
            result = classifier.classify(test.text)
            expected_cat = test.expected_category
            expected_type = test.expected_type

            # Check both category and type
            category_match = result.category == expected_cat
            type_match = result.transaction_type.value == expected_type
            success = category_match and type_match

            if success:
                passed += 1
            else:
                failed += 1

            results.append({
                "text": test.text,
                "expected": expected_cat,
                "actual": result.category,
                "expected_type": expected_type,
                "actual_type": result.transaction_type.value,
                "success": success,
                "confidence": result.confidence,
                "notes": test.notes,
            })

        accuracy = (passed / (passed + failed) * 100) if (passed + failed) > 0 else 0

        return {
            "category": category,
            "total": passed + failed,
            "passed": passed,
            "failed": failed,
            "accuracy": accuracy,
            "results": results,
        }

    def test_food(self):
        """Test food category."""
        result = self.run_category_tests(FOOD_TESTS, "Thức ăn & Đồ uống")
        print(f"\n🍔 Food: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_shopping(self):
        """Test shopping category."""
        result = self.run_category_tests(SHOPPING_TESTS, "Mua sắm")
        print(f"\n🛍️ Shopping: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_transport(self):
        """Test transport category."""
        result = self.run_category_tests(TRANSPORT_TESTS, "Giao thông")
        print(f"\n🚗 Transport: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_entertainment(self):
        """Test entertainment category."""
        result = self.run_category_tests(ENTERTAINMENT_TESTS, "Giải trí")
        print(f"\n🎬 Entertainment: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_health(self):
        """Test health category."""
        result = self.run_category_tests(HEALTH_TESTS, "Sức khỏe")
        print(f"\n🏥 Health: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_grocery(self):
        """Test grocery category."""
        result = self.run_category_tests(GROCERY_TESTS, "Thực phẩm")
        print(f"\n🛒 Grocery: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_electronics(self):
        """Test electronics category."""
        result = self.run_category_tests(ELECTRONICS_TESTS, "Điện tử")
        print(f"\n📱 Electronics: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_beauty(self):
        """Test beauty category."""
        result = self.run_category_tests(BEAUTY_TESTS, "Làm đẹp")
        print(f"\n💄 Beauty: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_sports(self):
        """Test sports category."""
        result = self.run_category_tests(SPORTS_TESTS, "Thể thao")
        print(f"\n🏋️ Sports: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_education(self):
        """Test education category."""
        result = self.run_category_tests(EDUCATION_TESTS, "Giáo dục")
        print(f"\n📚 Education: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_home(self):
        """Test home category."""
        result = self.run_category_tests(HOME_TESTS, "Nhà")
        print(f"\n🏠 Home: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_travel(self):
        """Test travel category."""
        result = self.run_category_tests(TRAVEL_TESTS, "Du lịch")
        print(f"\n✈️ Travel: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_pet(self):
        """Test pet category."""
        result = self.run_category_tests(PET_TESTS, "Thú cưng")
        print(f"\n🐕 Pet: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_salary(self):
        """Test salary category."""
        result = self.run_category_tests(SALARY_TESTS, "Lương")
        print(f"\n💰 Salary: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_investment_income(self):
        """Test investment income category."""
        result = self.run_category_tests(INVESTMENT_INCOME_TESTS, "Đầu tư")
        print(f"\n📈 Investment Income: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_bonus(self):
        """Test bonus category."""
        result = self.run_category_tests(BONUS_TESTS, "Tiền thưởng")
        print(f"\n🎁 Bonus: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_business(self):
        """Test business category."""
        result = self.run_category_tests(BUSINESS_TESTS, "Kinh doanh")
        print(f"\n🏪 Business: {result['accuracy']:.1f}% ({result['passed']}/{result['total']})")

        for r in result['results']:
            if not r['success']:
                print(f"  ❌ '{r['text']}' -> Expected: {r['expected']}, Got: {r['actual']}")

    def test_merchant_context(self):
        """Test merchant context handling."""
        print("\n" + "="*60)
        print("🏢 MERCHANT CONTEXT TESTS")
        print("="*60)

        classifier = TransactionClassifier()
        test_cases = [
            ("đi vincom", "Mua sắm", "EXPENSE"),  # Ambiguous - defaults to shopping
            ("ăn vincom", "Thức ăn & Đồ uống", "EXPENSE"),
            ("xem phim vincom", "Giải trí", "EXPENSE"),
            ("gửi xe vincom", "Giao thông", "EXPENSE"),
            ("mua đồ ở royal city", "Mua sắm", "EXPENSE"),
            ("ăn ở royal city", "Thức ăn & Đồ uống", "EXPENSE"),
            ("xem phim royal city", "Giải trí", "EXPENSE"),
            ("gửi xe royal city", "Giao thông", "EXPENSE"),
            ("parking royal city", "Giao thông", "EXPENSE"),
        ]

        passed = 0
        total = len(test_cases)

        for text, expected, expected_type in test_cases:
            result = classifier.classify(text)
            success = result.category == expected and result.transaction_type.value == expected_type
            status = "✅" if success else "❌"

            print(f"  {status} '{text}' -> {result.category} (expected: {expected})")
            if not success:
                print(f"      Type: {result.transaction_type.value} (expected: {expected_type})")

            if success:
                passed += 1

        accuracy = (passed / total * 100) if total > 0 else 0
        print(f"\n  Merchant Context Accuracy: {accuracy:.1f}% ({passed}/{total})")

    def test_negative_rules(self):
        """Test negative rules prevent misclassification."""
        print("\n" + "="*60)
        print("🚫 NEGATIVE RULES TESTS")
        print("="*60)

        classifier = TransactionClassifier()
        test_cases = [
            # Should NOT trigger HOME due to "điện"
            ("mua điện thoại 5tr", "Điện tử", "Should NOT be Nhà"),
            ("sửa điện thoại 200k", "Điện tử", "Should NOT be Nhà"),
            # Should NOT trigger TRANSPORT due to GrabFood
            ("grabfood 50k", "Thức ăn & Đồ uống", "Should NOT be Giao thông"),
            ("shopee food 40k", "Thức ăn & Đồ uống", "Should NOT be Giao thông"),
        ]

        passed = 0
        total = len(test_cases)

        for text, expected, note in test_cases:
            result = classifier.classify(text)
            success = result.category == expected
            status = "✅" if success else "❌"

            print(f"  {status} '{text}' -> {result.category} (expected: {expected}) [{note}]")

            if success:
                passed += 1

        accuracy = (passed / total * 100) if total > 0 else 0
        print(f"\n  Negative Rules Accuracy: {accuracy:.1f}% ({passed}/{total})")


def run_all_tests():
    """Run all tests and generate report."""
    print("\n" + "="*60)
    print("TRANSACTION CLASSIFIER TEST SUITE")
    print("="*60)

    tests = TransactionClassifierTests()

    # Run all category tests
    tests.test_food()
    tests.test_shopping()
    tests.test_transport()
    tests.test_entertainment()
    tests.test_health()
    tests.test_grocery()
    tests.test_electronics()
    tests.test_beauty()
    tests.test_sports()
    tests.test_education()
    tests.test_home()
    tests.test_travel()
    tests.test_pet()
    tests.test_salary()
    tests.test_investment_income()
    tests.test_bonus()
    tests.test_business()

    # Run special tests
    tests.test_merchant_context()
    tests.test_negative_rules()

    print("\n" + "="*60)
    print("TEST SUITE COMPLETE")
    print("="*60)


def demo():
    """Run demo with sample transactions."""
    print("\n" + "="*60)
    print("DEMO: Sample Transaction Classification")
    print("="*60)

    classifier = TransactionClassifier()

    samples = [
        "ăn phở 45k",
        "mua áo 200k",
        "xăng xe 80k",
        "netflix 70k",
        "gym tháng 500k",
        "đi vincom mua đồ 300k",
        "ăn ở royal city 200k",
        "xem phim vincom 120k",
        "gửi xe royal city 30k",
        "grab 50k",
        "lương tháng 15tr",
        "thưởng Tết 5tr",
    ]

    print()
    for sample in samples:
        result = classifier.classify(sample)
        print(f"📝 '{sample}'")
        print(f"   → {result.category} ({result.transaction_type.value})")
        print(f"   Confidence: {result.confidence:.0%}")
        if result.merchant:
            print(f"   Merchant: {result.merchant}")
        if result.primary_intent:
            print(f"   Intent: {result.primary_intent}")
        print()


if __name__ == "__main__":
    # Configure output encoding
    sys.stdout.reconfigure(encoding='utf-8')

    # Run demo first
    demo()

    # Run all tests
    print("\n")
    run_all_tests()
