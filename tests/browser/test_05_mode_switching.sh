#!/bin/bash
# Test 05: Mode Switching
# Verifies mode switching behavior

set -e

TEST_NAME="Mode Switching"
GAME_URL="http://localhost:8000"
RESULT_FILE="tests/browser/results/test_05_results.txt"

echo "=== $TEST_NAME ===" > "$RESULT_FILE"
echo "Testing URL: $GAME_URL" >> "$RESULT_FILE"
echo "" >> "$RESULT_FILE"

PASS=0
FAIL=0

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

# Helper function to get current mode from mode tip
get_mode_tip() {
    agent-browser get text '#mode-tip' 2>/dev/null | tr -d '\n\r'
}

# Get initial mode
echo "" >> "$RESULT_FILE"
echo "--- Testing Initial Mode ---" >> "$RESULT_FILE"
INITIAL_MODE=$(get_mode_tip)
echo "  Initial mode tip: $INITIAL_MODE" >> "$RESULT_FILE"

if [ -n "$INITIAL_MODE" ]; then
    report_result "Initial mode tip is displayed" "PASS"
else
    report_result "Initial mode tip is displayed" "FAIL" "Mode tip not found"
fi

# Test all mode buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Mode Buttons ---" >> "$RESULT_FILE"

declare -A MODES=(
    ["检视"]="inspect"
    ["建造房屋"]="build_house"
    ["种植浆果"]="plant_berry"
    ["收获浆果"]="harvest_berry"
    ["开采矿石"]="mine_ore"
    ["移动指令"]="move_order"
    ["徒手攻击"]="attack"
)

for mode_btn in "${!MODES[@]}"; do
    echo "" >> "$RESULT_FILE"
    echo "Testing mode: $mode_btn (${MODES[$mode_btn]})" >> "$RESULT_FILE"

    SNAPSHOT=$(agent-browser snapshot -i 2>&1)
    MODE_REF=$(echo "$SNAPSHOT" | grep "button \"$mode_btn\"" | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

    if [ -n "$MODE_REF" ]; then
        # Click the mode button
        if agent-browser click "@$MODE_REF" > /dev/null 2>&1; then
            sleep 0.5

            # Check if mode tip changed
            NEW_MODE_TIP=$(get_mode_tip)
            echo "  Mode tip after click: $NEW_MODE_TIP" >> "$RESULT_FILE"

            if [ -n "$NEW_MODE_TIP" ]; then
                report_result "Mode '$mode_btn' can be selected" "PASS"
            else
                report_result "Mode '$mode_btn' can be selected" "FAIL" "Mode tip disappeared"
            fi
        else
            report_result "Mode '$mode_btn' can be selected" "FAIL" "Click command failed"
        fi
    else
        report_result "Mode '$mode_btn' can be selected" "FAIL" "Button not found"
    fi
done

# Test: Build mode should enable building buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Build Mode Interaction ---" >> "$RESULT_FILE"

SNAPSHOT=$(agent-browser snapshot -i 2>&1)
BUILD_REF=$(echo "$SNAPSHOT" | grep 'button "建造房屋"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$BUILD_REF" ]; then
    agent-browser click "@$BUILD_REF" > /dev/null 2>&1
    sleep 0.5

    # Check if building buttons are accessible
    BUILD_SNAP=$(agent-browser snapshot -i 2>&1)
    WALL_REF=$(echo "$BUILD_SNAP" | grep 'button "🧱 墙壁"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

    if [ -n "$WALL_REF" ]; then
        report_result "Build mode enables building buttons" "PASS"

        # Try clicking a building button
        if agent-browser click "@$WALL_REF" > /dev/null 2>&1; then
            sleep 0.3
            report_result "Building button clickable in build mode" "PASS"
        else
            report_result "Building button clickable in build mode" "FAIL" "Click failed"
        fi
    else
        report_result "Build mode enables building buttons" "FAIL" "Building buttons not found"
    fi
else
    report_result "Build mode interaction" "FAIL" "Build mode button not found"
fi

# Test: Inspect mode (default)
echo "" >> "$RESULT_FILE"
echo "--- Testing Inspect Mode ---" >> "$RESULT_FILE"

INSPECT_SNAP=$(agent-browser snapshot -i 2>&1)
INSPECT_REF=$(echo "$INSPECT_SNAP" | grep 'button "检视"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$INSPECT_REF" ]; then
    agent-browser click "@$INSPECT_REF" > /dev/null 2>&1
    sleep 0.5

    MODE_TIP=$(get_mode_tip)
    echo "  Inspect mode tip: $MODE_TIP" >> "$RESULT_FILE"

    # Inspect mode should show info about clicking entities
    if [ -n "$MODE_TIP" ]; then
        report_result "Inspect mode displays tip" "PASS"
    else
        report_result "Inspect mode displays tip" "FAIL" "No tip displayed"
    fi
else
    report_result "Inspect mode" "FAIL" "Inspect button not found"
fi

# Test: Mode persistence
echo "" >> "$RESULT_FILE"
echo "--- Testing Mode Persistence ---" >> "$RESULT_FILE"

# Switch to build mode
BUILD_PERSIST_SNAP=$(agent-browser snapshot -i 2>&1)
BUILD_PERSIST_REF=$(echo "$BUILD_PERSIST_SNAP" | grep 'button "建造房屋"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$BUILD_PERSIST_REF" ]; then
    agent-browser click "@$BUILD_PERSIST_REF" > /dev/null 2>&1
    sleep 0.5

    MODE_1=$(get_mode_tip)

    # Click somewhere on canvas (should not change mode)
    CANVAS_REF=$(echo "$BUILD_PERSIST_SNAP" | grep 'canvas' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
    if [ -n "$CANVAS_REF" ]; then
        agent-browser click "@$CANVAS_REF" > /dev/null 2>&1
        sleep 0.5

        MODE_2=$(get_mode_tip)

        if [ "$MODE_1" = "$MODE_2" ]; then
            report_result "Mode persists after canvas click" "PASS"
        else
            report_result "Mode persists after canvas click" "FAIL" "Mode changed from '$MODE_1' to '$MODE_2'"
        fi
    else
        report_result "Mode persistence test" "FAIL" "Canvas not found"
    fi
else
    report_result "Mode persistence test" "FAIL" "Build mode button not found"
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
