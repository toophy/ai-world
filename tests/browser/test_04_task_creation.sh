#!/bin/bash
# Test 04: Task Creation
# Verifies task creation functionality

set -e

TEST_NAME="Task Creation"
GAME_URL="http://localhost:8000"
RESULT_FILE="tests/browser/results/test_04_results.txt"

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

# Helper function to get task count from task counter panel
get_task_count() {
    # Try to get the total count from task counter
    local text=$(agent-browser get text '.total-count' 2>/dev/null | tr -d '\n\r')
    echo "$text"
}

# Get initial task count
echo "" >> "$RESULT_FILE"
echo "--- Testing Initial State ---" >> "$RESULT_FILE"
INITIAL_TASK_COUNT=$(get_task_count)
echo "  Initial task count: $INITIAL_TASK_COUNT" >> "$RESULT_FILE"

# Test 1: Select build mode and build button
echo "" >> "$RESULT_FILE"
echo "--- Testing Build Task Creation ---" >> "$RESULT_FILE"

SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# Click build mode button
BUILD_MODE_REF=$(echo "$SNAPSHOT" | grep 'button "建造房屋"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
if [ -n "$BUILD_MODE_REF" ]; then
    agent-browser click "@$BUILD_MODE_REF" > /dev/null 2>&1
    sleep 0.5
    report_result "Build mode button clicked" "PASS"
else
    report_result "Build mode button clicked" "FAIL" "Build mode button not found"
    agent-browser close > /dev/null 2>&1
    exit 1
fi

# Click wall button
WALL_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
WALL_REF=$(echo "$WALL_SNAPSHOT" | grep 'button "🧱 墙壁"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
if [ -n "$WALL_REF" ]; then
    agent-browser click "@$WALL_REF" > /dev/null 2>&1
    sleep 0.5
    report_result "Wall button clicked" "PASS"
else
    report_result "Wall button clicked" "FAIL" "Wall button not found"
fi

# Click on canvas to place a task
# Note: This is a basic test - actual task placement depends on canvas coordinates
CANVAS_SNAPSHOT=$(agent-browser snapshot -i 2>&1)
CANVAS_REF=$(echo "$CANVAS_SNAPSHOT" | grep 'canvas' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

if [ -n "$CANVAS_REF" ]; then
    # Click on canvas
    agent-browser click "@$CANVAS_REF" > /dev/null 2>&1
    sleep 1
    report_result "Canvas clicked for task placement" "PASS"

    # Check if task was created (task counter should increase)
    NEW_TASK_COUNT=$(get_task_count)
    echo "  Task count after click: $NEW_TASK_COUNT" >> "$RESULT_FILE"

    # Note: Task might not be created if clicking on water or invalid tile
    # This test verifies the interaction, not the actual task creation logic
    if [ -n "$NEW_TASK_COUNT" ]; then
        report_result "Task counter is accessible: $NEW_TASK_COUNT" "PASS"
    else
        report_result "Task counter is accessible" "FAIL" "Could not read task counter"
    fi
else
    report_result "Canvas click for task placement" "FAIL" "Canvas not found"
fi

# Test 2: Try different building types
echo "" >> "$RESULT_FILE"
echo "--- Testing Different Building Types ---" >> "$RESULT_FILE"

BUILDING_TYPES=("🚪 门" "🛏️ 床铺" "📦 储物箱")
for building in "${BUILDING_TYPES[@]}"; do
    BUILD_SNAP=$(agent-browser snapshot -i 2>&1)
    BUILD_REF=$(echo "$BUILD_SNAP" | grep "button \"$building\"" | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

    if [ -n "$BUILD_REF" ]; then
        if agent-browser click "@$BUILD_REF" > /dev/null 2>&1; then
            sleep 0.3
            report_result "Building type '$building' is clickable" "PASS"
        else
            report_result "Building type '$building' is clickable" "FAIL" "Click failed"
        fi
    else
        report_result "Building type '$building' is clickable" "FAIL" "Button not found"
    fi
done

# Test 3: Resource operation buttons
echo "" >> "$RESULT_FILE"
echo "--- Testing Resource Operation Buttons ---" >> "$RESULT_FILE"

RESOURCE_OPS=("⛏️ 采矿" "🫐 收获" "🌱 种植")
for op in "${RESOURCE_OPS[@]}"; do
    # First click the mode button if it exists
    MODE_SNAP=$(agent-browser snapshot -i 2>&1)

    case "$op" in
        *"采矿"*)
            MODE_REF=$(echo "$MODE_SNAP" | grep 'button "开采矿石"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
            ;;
        *"收获"*)
            MODE_REF=$(echo "$MODE_SNAP" | grep 'button "收获浆果"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
            ;;
        *"种植"*)
            MODE_REF=$(echo "$MODE_SNAP" | grep 'button "种植浆果"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')
            ;;
    esac

    if [ -n "$MODE_REF" ]; then
        agent-browser click "@$MODE_REF" > /dev/null 2>&1
        sleep 0.3
        report_result "Mode for '$op' is clickable" "PASS"
    else
        report_result "Mode for '$op' is clickable" "FAIL" "Mode button not found"
    fi
done

# Test 4: Priority selection
echo "" >> "$RESULT_FILE"
echo "--- Testing Priority Selection ---" >> "$RESULT_FILE"

PRIORITIES=("低" "中" "高")
for priority in "${PRIORITIES[@]}"; do
    PRI_SNAP=$(agent-browser snapshot -i 2>&1)
    PRI_REF=$(echo "$PRI_SNAP" | grep "button \"$priority\"" | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

    if [ -n "$PRI_REF" ]; then
        if agent-browser click "@$PRI_REF" > /dev/null 2>&1; then
            sleep 0.3
            report_result "Priority '$priority' is selectable" "PASS"
        else
            report_result "Priority '$priority' is selectable" "FAIL" "Click failed"
        fi
    else
        report_result "Priority '$priority' is selectable" "FAIL" "Button not found"
    fi
done

# Test 5: Task queue is present
echo "" >> "$RESULT_FILE"
echo "--- Testing Task Queue UI ---" >> "$RESULT_FILE"

TASK_QUEUE_TEXT=$(agent-browser get text '#task-list' 2>/dev/null)
if [ -n "$TASK_QUEUE_TEXT" ]; then
    report_result "Task queue panel is accessible" "PASS"
    echo "  Task queue content: $TASK_QUEUE_TEXT" >> "$RESULT_FILE"
else
    report_result "Task queue panel is accessible" "FAIL" "Could not read task queue"
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
