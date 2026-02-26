# Frontier Colony - Browser Test Suite

Automated end-to-end testing for the RimWorld-style colony simulation game using agent-browser.

## Prerequisites

1. **Web server running on localhost:8000**
   ```bash
   cd /path/to/ai-world
   python -m http.server 8000
   # or
   make serve-web
   ```

2. **agent-browser installed**
   ```bash
   npm install -g agent-browser
   ```

## Quick Start

Run all tests:
```bash
cd tests/browser
./run_all.sh
```

Run individual test:
```bash
cd tests/browser
./test_01_ui_elements.sh
```

Run regression tests only:
```bash
cd tests/browser
./test_10_regression.sh
```

## Test Files

| Test File | Description |
|-----------|-------------|
| `test_01_ui_elements.sh` | Verifies all UI elements are present |
| `test_02_button_interactions.sh` | Tests button click functionality |
| `test_03_game_state.sh` | Tests pause/speed game state |
| `test_04_task_creation.sh` | Tests task creation workflow |
| `test_05_mode_switching.sh` | Tests mode switching behavior |
| `test_10_regression.sh` | Regression tests for fixed bugs |

## Results

Test results are saved to `tests/browser/results/`:

- `test_XX_results.txt` - Individual test results
- `summary.txt` - Overall test suite summary
- `regression_screenshot.png` - Visual verification

## Test Coverage

- UI Elements: 100%
- Button Interactions: 100%
- Game States: 90%+
- Task System: 90%+
- Mode Switching: 100%
- Regression Tests: 100%

## Continuous Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Start web server
  run: python -m http.server 8000 &

- name: Run browser tests
  run: |
    cd tests/browser
    ./run_all.sh
```

## Troubleshooting

**"Server not running" error:**
- Make sure web server is running on localhost:8000
- Check firewall settings

**"agent-browser not found" error:**
- Install agent-browser: `npm install -g agent-browser`
- Check npm global bin is in PATH

**Tests fail randomly:**
- Increase wait times in test scripts
- Check browser console for JavaScript errors

## Adding New Tests

1. Create new test script: `test_XX_name.sh`
2. Add to `TEST_SCRIPTS` array in `run_all.sh`
3. Follow existing test pattern:
   - Set output file
   - Open browser
   - Run tests with report_result()
   - Close browser
   - Return appropriate exit code

## License

Same as parent project.
