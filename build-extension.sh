#!/bin/bash
# Build script for Zymbol-Lang VSCode Extension
# Creates a .vsix package ready for installation

set -e

echo "========================================="
echo "Zymbol-Lang VSCode Extension Builder"
echo "========================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install Node.js and npm first"
    exit 1
fi

# Check if vsce is available (globally or via npx)
if ! command -v vsce &> /dev/null && ! npx @vscode/vsce --version &> /dev/null; then
    echo "⚠️  vsce is not available. Installing locally..."
    npm install --save-dev @vscode/vsce
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type-check TypeScript (no output, catches errors early)
echo "🔍 Type-checking TypeScript..."
npm run compile

# Bundle extension (replaces node_modules at runtime with a single file)
echo "📦 Bundling extension..."
npm run bundle

# Package extension
echo "📦 Packaging extension..."
VERSION=$(node -pe "require('./package.json').version")
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
OUTPUT_FILE="zymbol-lang-${VERSION}-${TIMESTAMP}.vsix"

# Use vsce if available globally, otherwise use npx
if command -v vsce &> /dev/null; then
    vsce package -o "$OUTPUT_FILE"
else
    npx @vscode/vsce package -o "$OUTPUT_FILE"
fi

echo ""
echo "========================================="
echo "✅ Build successful!"
echo "========================================="
echo "Package: $OUTPUT_FILE"
echo ""
echo "To install:"
echo "  code --install-extension $OUTPUT_FILE"
echo ""
echo "Or in VSCode:"
echo "  Extensions view → ... → Install from VSIX"
echo "========================================="
