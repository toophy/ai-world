#!/bin/bash
# Test 03: Game State (Pause/Speed)
# Verifies game state management

set -e

TEST_NAME="Game State (Pause/Speed)"
GAME_URL="http://localhost:8000"
RESULT_FILE="tests/browser/results/test_03_results.txt"

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

# Helper function to extract clock time from page
get_clock_time() {
    # Use JavaScript to get the clock element content
    agent-browser get text '#game-clock' 2>/dev/null | tr -d '\n\r' || echo ""
}

# Helper function to extract day number
get_day_number() {
    agent-browser get text '#day-number' 2>/dev/null | tr -d '\n\r' || echo ""
}

# Test 1: Initial clock is readable
echo "" >> "$RESULT_FILE"
echo "--- Testing Initial Clock State ---" >> "$RESULT_FILE"
INITIAL_TIME=$(get_clock_time)
if [ -n "$INITIAL_TIME" ]; then
    report_result "Initial clock time is readable: $INITIAL_TIME" "PASS"
else
    report_result "Initial clock time is readable" "FAIL" "Clock element not found or empty"
fi

INITIAL_DAY=$(get_day_number)
if [ -n "$INITIAL_DAY" ]; then
    report_result "Initial day number is readable: $INITIAL_DAY" "PASS"
else
    report_result "Initial day number is readable" "FAIL" "Day element not found or empty"
fi

# Test 2: Pause stops the clock
echo "" >> "$RESULT_FILE"
echo "--- Testing Pause Functionality ---" >> "$RESULT_FILE"
SNAPSHOT=$(agent-browser snapshot -i 2>&1)
PAUSE_REF=$(echo "$SNAPSHOT" | grep 'button "⏸️"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$PAUSE_REF" ]; then
    # Get time before pause
    TIME_BEFORE_PAUSE=$(get_clock_time)

    # Click pause
    agent-browser click "@$PAUSE_REF" > /dev/null 2>&1
    sleep 2

    # Get time after pause (should be same or very close)
    TIME_DURING_PAUSE=$(get_clock_time)

    if [ "$TIME_BEFORE_PAUSE" = "$TIME_DURING_PAUSE" ]; then
        report_result "Pause stops clock (time unchanged: $TIME_BEFORE_PAUSE)" "PASS"
    else
        report_result "Pause stops clock" "FAIL" "Time changed from $TIME_BEFORE_PAUSE to $TIME_DURING_PAUSE"
    fi

    # Resume
    RESUME_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
    PLAY_REF=$(echo "$RESUME_SNAPSHOT" | grep 'button "▶️"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

    if [ -n "$PLAY_REF" ]; then
        agent-browser click "@$PLAY_REF" > /dev/null 2>&1
        sleep 2

        # After resume, clock should advance
        TIME_AFTER_RESUME=$(get_clock_time)

        if [ "$TIME_AFTER_RESUME" != "$TIME_DURING_PAUSE" ]; then
            report_result "Resume advances clock (from $TIME_DURING_PAUSE to $TIME_AFTER_RESUME)" "PASS"
        else
            report_result "Resume advances clock" "FAIL" "Clock didn't advance after resume"
        fi
    fi
else
    report_result "Pause functionality" "FAIL" "Could not find pause button"
fi

# Test 3: Speed button cycles through speeds
echo "" >> "$RESULT_FILE"
echo "--- Testing Speed Cycling ---" >> "$RESULT_FILE"
SPEED_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
SPEED_REF=$(echo "$SPEED_SNAPSHOT" | grep 'button "▶️' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$SPEED_REF" ]; then
    # Get initial speed
    SPEED_1=$(agent-browser get text "@$SPEED_REF" 2>/dev/null | tr -d '\n\r')
    echo "  Initial speed: $SPEED_1" >> "$RESULT_FILE"

    # Click to change speed
    agent-browser click "@$SPEED_REF" > /dev/null 2>&1
    sleep 0.5

    SPEED_2_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
    SPEED_2_REF=$(echo "$SPEED_2_SNAPSHOT" | grep 'button "▶️' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
    SPEED_2=$(agent-browser get text "@$SPEED_2_REF" 2>/dev/null | tr -d '\n\r')
    echo "  After click 1: $SPEED_2" >> "$RESULT_FILE"

    if [ "$SPEED_1" != "$SPEED_2" ]; then
        report_result "Speed button changes speed" "PASS"
    else
        report_result "Speed button changes speed" "FAIL" "Speed didn't change"
    fi

    # Click again
    agent-browser click "@$SPEED_2_REF" > /dev/null 2>&1
    sleep 0.5

    SPEED_3_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
    SPEED_3_REF=$(echo "$SPEED_3_SNAPSHOT" | grep 'button "▶️' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
    SPEED_3=$(agent-browser get text "@$SPEED_3_REF" 2>/dev/null | tr -d '\n\r')
    echo "  After click 2: $SPEED_3" >> "$RESULT_FILE"

    if [ "$SPEED_2" != "$SPEED_3" ]; then
        report_result "Speed button cycles to third value" "PASS"
    else
        report_result "Speed button cycles to third value" "FAIL" "Speed didn't change again"
    fi
else
    report_result "Speed cycling" "FAIL" "Could not find speed button"
fi

# Test 4: Resource display is present
echo "" >> "$RESULT_FILE"
echo "--- Testing Resource Display ---" >> "$RESULT_FILE"
RESOURCE_TEXT=$(agent-browser get text '#resources' 2>/dev/null)

if echo "$RESOURCE_TEXT" | grep -q "木材\|木"; then
    report_result "Wood resource displayed" "PASS"
else
    report_result "Wood resource displayed" "FAIL" "Wood not found in resources panel"
fi

if echo "$RESOURCE_TEXT" | grep -q "矿石\|矿"; then
    report_result "Ore resource displayed" "PASS"
else
    report_result "Ore resource displayed" "FAIL" "Ore not found in resources panel"
fi

if echo "$RESOURCE_TEXT" | grep -q "浆果\|浆"; then
    report_result "Berry resource displayed" "PASS"
else
    report_result "Berry resource displayed" "FAIL" "Berry not found in resources panel"
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
