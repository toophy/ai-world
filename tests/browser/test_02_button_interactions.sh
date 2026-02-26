#!/bin/bash
# Test 02: Button Interactions
# Verifies buttons are clickable and responsive

set -e

TEST_NAME="Button Interactions"
GAME_URL="http://localhost:8000"
RESULT_FILE="tests/browser/results/test_02_results.txt"

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

# Get initial snapshot
echo "" >> "$RESULT_FILE"
echo "--- Testing Pause Button Toggle ---" >> "$RESULT_FILE"
INITIAL_SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# Test 1: Pause button is initially pause icon
if echo "$INITIAL_SNAPSHOT" | grep -q 'button "⏸️"'; then
    report_result "Initial state: Pause button shows pause icon" "PASS"
else
    report_result "Initial state: Pause button shows pause icon" "FAIL" "Expected pause icon"
fi

# Get initial button ref
PAUSE_REF=$(echo "$INITIAL_SNAPSHOT" | grep 'button "⏸️"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$PAUSE_REF" ]; then
    # Test 2: Click pause button
    agent-browser click "@$PAUSE_REF" > /dev/null 2>&1
    sleep 0.5

    # Check if button changed to play icon
    AFTER_PAUSE_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
    if echo "$AFTER_PAUSE_SNAPSHOT" | grep -q 'button "▶️"'; then
        report_result "Clicking pause changes to play icon" "PASS"
    else
        report_result "Clicking pause changes to play icon" "FAIL" "Button didn't change"
    fi

    # Test 3: Click again to resume
    PLAY_REF=$(echo "$AFTER_PAUSE_SNAPSHOT" | grep 'button "▶️"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
    if [ -n "$PLAY_REF" ]; then
        agent-browser click "@$PLAY_REF" > /dev/null 2>&1
        sleep 0.5

        RESUME_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
        if echo "$RESUME_SNAPSHOT" | grep -q 'button "⏸️"'; then
            report_result "Clicking play resumes (shows pause icon)" "PASS"
        else
            report_result "Clicking play resumes (shows pause icon)" "FAIL" "Button didn't change back"
        fi
    fi
else
    report_result "Click pause button" "FAIL" "Could not find pause button reference"
fi

# Test 4: Speed button
echo "" >> "$RESULT_FILE"
echo "--- Testing Speed Button ---" >> "$RESULT_FILE"
SPEED_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
SPEED_REF=$(echo "$SPEED_SNAPSHOT" | grep 'button "▶️' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$SPEED_REF" ]; then
    # Get initial speed
    INITIAL_SPEED=$(echo "$SPEED_SNAPSHOT" | grep 'button "▶️' | sed 's/.*"▶️ \([^"]*\)".*/\1/')

    # Click speed button
    agent-browser click "@$SPEED_REF" > /dev/null 2>&1
    sleep 0.5

    # Check if speed changed
    AFTER_SPEED_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
    NEW_SPEED=$(echo "$AFTER_SPEED_SNAPSHOT" | grep 'button "▶️' | sed 's/.*"▶️ \([^"]*\)".*/\1/')

    if [ "$INITIAL_SPEED" != "$NEW_SPEED" ]; then
        report_result "Speed button changes speed (from $INITIAL_SPEED to $NEW_SPEED)" "PASS"
    else
        report_result "Speed button changes speed" "FAIL" "Speed didn't change"
    fi
else
    report_result "Speed button interaction" "FAIL" "Could not find speed button reference"
fi

# Test 5: Build buttons are clickable
echo "" >> "$RESULT_FILE"
echo "--- Testing Build Button Selection ---" >> "$RESULT_FILE"
BUILD_SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# Try clicking wall button
WALL_REF=$(echo "$BUILD_SNAPSHOT" | grep 'button "🧱 墙壁"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
if [ -n "$WALL_REF" ]; then
    if agent-browser click "@$WALL_REF" > /dev/null 2>&1; then
        report_result "Wall button is clickable" "PASS"
    else
        report_result "Wall button is clickable" "FAIL" "Click command failed"
    fi
else
    report_result "Wall button is clickable" "FAIL" "Could not find wall button reference"
fi

# Test 6: Priority buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Priority Button Selection ---" >> "$RESULT_FILE"
PRIORITY_SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# Try clicking low priority
LOW_REF=$(echo "$PRIORITY_SNAPSHOT" | grep 'button "低"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
if [ -n "$LOW_REF" ]; then
    if agent-browser click "@$LOW_REF" > /dev/null 2>&1; then
        report_result "Low priority button is clickable" "PASS"
    else
        report_result "Low priority button is clickable" "FAIL" "Click command failed"
    fi
else
    report_result "Low priority button is clickable" "FAIL" "Could not find low priority button reference"
fi

# Test 7: Mode buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Mode Button Selection ---" >> "$RESULT_FILE"
MODE_SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# Try clicking build mode
BUILD_MODE_REF=$(echo "$MODE_SNAPSHOT" | grep 'button "建造房屋"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
if [ -n "$BUILD_MODE_REF" ]; then
    if agent-browser click "@$BUILD_MODE_REF" > /dev/null 2>&1; then
        report_result "Build mode button is clickable" "PASS"
    else
        report_result "Build mode button is clickable" "FAIL" "Click command failed"
    fi
else
    report_result "Build mode button is clickable" "FAIL" "Could not find build mode button reference"
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
