#!/bin/bash
# Install Zymbol-Lang LSP Server
# This script builds and installs the zymbol-lsp binary

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Installing Zymbol-Lang LSP Server ==="

# Check if cargo is available
if ! command -v cargo &> /dev/null; then
    echo "Error: Rust/Cargo is not installed."
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

# Build the LSP server in release mode
echo "Building zymbol-lsp..."
cd "$PROJECT_ROOT"
cargo build --release -p zymbol-lsp

# Determine install location
if [ -n "$CARGO_HOME" ]; then
    INSTALL_DIR="$CARGO_HOME/bin"
elif [ -d "$HOME/.cargo/bin" ]; then
    INSTALL_DIR="$HOME/.cargo/bin"
else
    INSTALL_DIR="/usr/local/bin"
fi

# Copy the binary
echo "Installing to $INSTALL_DIR..."
if [ -w "$INSTALL_DIR" ]; then
    cp "$PROJECT_ROOT/target/release/zymbol-lsp" "$INSTALL_DIR/"
else
    echo "Need sudo to install to $INSTALL_DIR"
    sudo cp "$PROJECT_ROOT/target/release/zymbol-lsp" "$INSTALL_DIR/"
fi

# Verify installation
if command -v zymbol-lsp &> /dev/null; then
    echo ""
    echo "=== Installation Complete ==="
    echo "zymbol-lsp is now available at: $(which zymbol-lsp)"
    echo ""
    echo "To use with VSCode:"
    echo "1. Install the Zymbol-Lang extension"
    echo "2. The extension will automatically use the LSP server"
else
    echo ""
    echo "Warning: zymbol-lsp was installed but is not in PATH"
    echo "Binary location: $INSTALL_DIR/zymbol-lsp"
    echo ""
    echo "Add this to your shell profile:"
    echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
fi
