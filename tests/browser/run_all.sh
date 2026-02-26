#!/bin/bash
# Frontier Colony - Browser Test Suite Runner
# Runs all agent-browser tests and generates summary report

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
SUMMARY_FILE="$RESULTS_DIR/summary.txt"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Frontier Colony Test Suite${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""
echo "Results directory: $RESULTS_DIR"
echo ""

# Clear previous summary
> "$SUMMARY_FILE"
echo "=== Frontier Colony - Test Suite Summary ===" >> "$SUMMARY_FILE"
echo "Run date: $(date)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Track overall statistics
TOTAL_TESTS=0
TOTAL_PASS=0
TOTAL_FAIL=0
FAILED_TESTS=()

# Array of test scripts
TEST_SCRIPTS=(
    "test_01_ui_elements.sh:UI Element Presence"
    "test_02_button_interactions.sh:Button Interactions"
    "test_03_game_state.sh:Game State (Pause/Speed)"
    "test_04_task_creation.sh:Task Creation"
    "test_05_mode_switching.sh:Mode Switching"
    "test_10_regression.sh:Regression Tests"
)

# Run each test script
for test_entry in "${TEST_SCRIPTS[@]}"; do
    IFS=':' read -r script_name test_name <<< "$test_entry"
    script_path="$SCRIPT_DIR/$script_name"

    echo -e "\n${BLUE}Running: $test_name${NC}"
    echo "Script: $script_name"
    echo "----------------------------------------"

    # Make script executable
    chmod +x "$script_path"

    # Run test and capture exit code
    if bash "$script_path"; then
        echo -e "${GREEN}✓ $test_name PASSED${NC}"
        echo "✓ $test_name: PASSED" >> "$SUMMARY_FILE"
    else
        EXIT_CODE=$?
        echo -e "${RED}✗ $test_name FAILED (exit code: $EXIT_CODE)${NC}"
        echo "✗ $test_name: FAILED (exit code: $EXIT_CODE)" >> "$SUMMARY_FILE"
        FAILED_TESTS+=("$test_name")
    fi

    # Parse results from individual test file
    RESULT_FILE="$RESULTS_DIR/$(basename "$script_name" .sh)_results.txt"

    if [ -f "$RESULT_FILE" ]; then
        # Extract pass/fail counts (case insensitive for "Passed"/"passed")
        PASS_COUNT=$(grep -i "^Passed:" "$RESULT_FILE" | tail -1 | awk '{print $2}')
        FAIL_COUNT=$(grep -i "^Failed:" "$RESULT_FILE" | tail -1 | awk '{print $2}')

        TOTAL_PASS=$((TOTAL_PASS + ${PASS_COUNT:-0}))
        TOTAL_FAIL=$((TOTAL_FAIL + ${FAIL_COUNT:-0}))
        TOTAL_TESTS=$((TOTAL_TESTS + ${PASS_COUNT:-0} + ${FAIL_COUNT:-0}))
    fi
done

# Generate summary
echo "" >> "$SUMMARY_FILE"
echo "==================================" >> "$SUMMARY_FILE"
echo "OVERALL SUMMARY" >> "$SUMMARY_FILE"
echo "==================================" >> "$SUMMARY_FILE"
echo "Total tests run: $TOTAL_TESTS" >> "$SUMMARY_FILE"
echo "Total passed: $TOTAL_PASS" >> "$SUMMARY_FILE"
echo "Total failed: $TOTAL_FAIL" >> "$SUMMARY_FILE"

if [ $TOTAL_FAIL -eq 0 ]; then
    echo "" >> "$SUMMARY_FILE"
    echo "✓ ALL TESTS PASSED!" >> "$SUMMARY_FILE"
    PASS_RATE="100%"
else
    PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($TOTAL_PASS / $TOTAL_TESTS) * 100}")
    echo "" >> "$SUMMARY_FILE"
    echo "✗ Some tests failed" >> "$SUMMARY_FILE"
    echo "" >> "$SUMMARY_FILE"
    echo "Failed test suites:" >> "$SUMMARY_FILE"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test" >> "$SUMMARY_FILE"
    done
fi

echo "" >> "$SUMMARY_FILE"
echo "Pass rate: $PASS_RATE" >> "$SUMMARY_FILE"

# Print summary to console
echo ""
echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}TEST SUITE SUMMARY${NC}"
echo -e "${BLUE}==================================${NC}"
echo "Total tests run: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TOTAL_PASS${NC}"
echo -e "Failed: ${RED}$TOTAL_FAIL${NC}"
echo "Pass rate: $PASS_RATE"

if [ $TOTAL_FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    EXIT_CODE=0
else
    echo ""
    echo -e "${RED}✗ Some tests failed:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}- $test${NC}"
    done
    echo ""
    echo "Check individual result files in: $RESULTS_DIR"
    EXIT_CODE=1
fi

echo ""
echo "Summary report saved to: $SUMMARY_FILE"
echo "Individual results in: $RESULTS_DIR"

exit $EXIT_CODE
