#!/bin/bash
# Test 01: UI Element Presence
# Verifies all expected UI elements are present and accessible

set -e

TEST_NAME="UI Element Presence"
GAME_URL="http://localhost:8000"
RESULT_FILE="tests/browser/results/test_01_results.txt"

echo "=== $TEST_NAME ===" > "$RESULT_FILE"
echo "Testing URL: $GAME_URL" >> "$RESULT_FILE"
echo "" >> "$RESULT_FILE"

PASS=0
FAIL=0

# Helper function to report test result
report_result() {
    local test_name="$1"
    local status="$2"
    local detail="$3"

    if [ "$status" = "PASS" ]; then
        echo "✓ PASS: $test_name" | tee -a "$RESULT_FILE"
        PASS=$((PASS + 1))
    else
        echo "✗ FAIL: $test_name - $detail" | tee -a "$RESULT_FILE"
        FAIL=$((FAIL + 1))
    fi
}

echo "Opening browser..."
agent-browser open "$GAME_URL" > /dev/null 2>&1
sleep 2

echo "Taking initial snapshot..."
SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# Test 1: Pause button exists
echo "" >> "$RESULT_FILE"
echo "--- Testing Control Buttons ---" >> "$RESULT_FILE"
if echo "$SNAPSHOT" | grep -q 'button "⏸️"'; then
    report_result "Pause button present" "PASS"
else
    report_result "Pause button present" "FAIL" "Button not found in snapshot"
fi

# Test 2: Speed button exists
if echo "$SNAPSHOT" | grep -q 'button "▶️ 1x"'; then
    report_result "Speed button present" "PASS"
else
    report_result "Speed button present" "FAIL" "Button not found in snapshot"
fi

# Test 3: Build buttons exist
echo "" >> "$RESULT_FILE"
echo "--- Testing Build Buttons ---" >> "$RESULT_FILE"
BUILD_BUTTONS=("墙壁" "门" "床铺" "储物箱" "工作台" "医务床")
for btn in "${BUILD_BUTTONS[@]}"; do
    if echo "$SNAPSHOT" | grep -q "button.*$btn"; then
        report_result "Build button '$btn' present" "PASS"
    else
        report_result "Build button '$btn' present" "FAIL" "Button not found"
    fi
done

# Test 4: Resource operation buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Resource Operation Buttons ---" >> "$RESULT_FILE"
RESOURCE_BUTTONS=("采矿" "收获" "种植")
for btn in "${RESOURCE_BUTTONS[@]}"; do
    if echo "$SNAPSHOT" | grep -q "button.*$btn"; then
        report_result "Resource button '$btn' present" "PASS"
    else
        report_result "Resource button '$btn' present" "FAIL" "Button not found"
    fi
done

# Test 5: Priority buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Priority Buttons ---" >> "$RESULT_FILE"
PRIORITY_BUTTONS=("低" "中" "高")
for btn in "${PRIORITY_BUTTONS[@]}"; do
    if echo "$SNAPSHOT" | grep -q "button \"$btn\""; then
        report_result "Priority button '$btn' present" "PASS"
    else
        report_result "Priority button '$btn' present" "FAIL" "Button not found"
    fi
done

# Test 6: Mode buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Mode Buttons ---" >> "$RESULT_FILE"
MODE_BUTTONS=("检视" "建造房屋" "种植浆果" "收获浆果" "开采矿石" "移动指令" "徒手攻击")
for btn in "${MODE_BUTTONS[@]}"; do
    if echo "$SNAPSHOT" | grep -q "button \"$btn\""; then
        report_result "Mode button '$btn' present" "PASS"
    else
        report_result "Mode button '$btn' present" "FAIL" "Button not found"
    fi
done

# Test 7: Get page title
echo "" >> "$RESULT_FILE"
echo "--- Testing Page Info ---" >> "$RESULT_FILE"
PAGE_TITLE=$(agent-browser get title 2>&1)
if echo "$PAGE_TITLE" | grep -q "Frontier Colony"; then
    report_result "Page title correct" "PASS"
else
    report_result "Page title correct" "FAIL" "Expected 'Frontier Colony', got '$PAGE_TITLE'"
fi

# Test 8: Get URL
CURRENT_URL=$(agent-browser get url 2>&1)
if [ "$CURRENT_URL" = "$GAME_URL/" ]; then
    report_result "URL correct" "PASS"
else
    report_result "URL correct" "FAIL" "Expected '$GAME_URL/', got '$CURRENT_URL'"
fi

# Summary
echo "" >> "$RESULT_FILE"
echo "=== Test Summary ===" >> "$RESULT_FILE"
echo "Passed: $PASS" >> "$RESULT_FILE"
echo "Failed: $FAIL" >> "$RESULT_FILE"
echo "Total: $((PASS + FAIL))" >> "$RESULT_FILE"
echo "" >> "$RESULT_FILE"

if [ $FAIL -eq 0 ]; then
    echo "✓ All tests passed!" | tee -a "$RESULT_FILE"
    EXIT_CODE=0
else
    echo "✗ $FAIL test(s) failed" | tee -a "$RESULT_FILE"
    EXIT_CODE=1
fi

agent-browser close > /dev/null 2>&1

exit $EXIT_CODE
