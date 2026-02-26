# Makefile for ai-world project
# Usage: make [target]

.PHONY: all build run test watch clean fmt clippy serve-web help

# Default target
all: build

# Build the Rust library
build:
	cargo build --release

# Build the Rust library (debug)
build-dev:
	cargo build

# Run the colony demo
run: build
	cargo run --bin colony

# Run tests
test:
	cargo test

# Run tests with output
test-verbose:
	cargo test -- --nocapture

# Watch for changes and rebuild
watch:
	cargo watch -x build

# Watch for changes and run tests
watch-test:
	cargo watch -x test

# Format code
fmt:
	cargo fmt

# Check code formatting
fmt-check:
	cargo fmt -- --check

# Run linter
clippy:
	cargo clippy -- -D warnings

# Run linter with fixes
clippy-fix:
	cargo clippy --fix --allow-dirty -- -D warnings

# Clean build artifacts
clean:
	cargo clean
	rm -rf target/

# Serve web demo locally (requires Python)
serve-web:
	@echo "Serving web demo at http://localhost:8000"
	@echo "Press Ctrl+C to stop"
	cd web && python -m http.server 8000

# Open web demo in browser (macOS)
open-web:
	@echo "Opening web demo in browser..."
	open http://localhost:8000
	@$(MAKE) --no-print-directory serve-web

# Open web demo in browser (Linux with xdg-open)
open-web-linux:
	@echo "Opening web demo in browser..."
	xdg-open http://localhost:8000
	@$(MAKE) --no-print-directory serve-web

# Open web demo in browser (Windows)
open-web-windows:
	@echo "Opening web demo in browser..."
	start http://localhost:8000
	@$(MAKE) --no-print-directory serve-web

# Detect OS and open web demo
open-web: open-web-$(OS)

# Install development dependencies
install-deps:
	cargo install cargo-watch
	rustup component add clippy

# Show help
help:
	@echo "ai-world Makefile commands:"
	@echo ""
	@echo "Building:"
	@echo "  make build        - Build release version"
	@echo "  make build-dev    - Build debug version"
	@echo ""
	@echo "Running:"
	@echo "  make run           - Build and run colony demo"
	@echo ""
	@echo "Testing:"
	@echo "  make test          - Run tests"
	@echo "  make test-verbose  - Run tests with output"
	@echo ""
	@echo "Development:"
	@echo "  make watch         - Watch for changes and rebuild"
	@echo "  make watch-test    - Watch for changes and run tests"
	@echo "  make fmt           - Format code"
	@echo "  make fmt-check     - Check code formatting"
	@echo "  make clippy        - Run linter"
	@echo "  make clippy-fix    - Run linter with fixes"
	@echo ""
	@echo "Web Demo:"
	@echo "  make serve-web     - Serve web demo at localhost:8000"
	@echo "  make open-web      - Open web demo in browser and serve"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make install-deps   - Install development dependencies"
	@echo ""
	@echo "  make help          - Show this help message"
