#!/bin/bash

# Test script for Obsidian PW Plugin
# This script provides convenient ways to run tests

echo "🧪 Obsidian PW Test Suite"
echo "========================="

case "$1" in
  "watch")
    echo "📊 Running tests in watch mode..."
    npm run test:watch
    ;;
  "coverage")
    echo "📊 Running tests with coverage..."
    npm run test:coverage
    ;;
  "line")
    echo "🔍 Running LineOperations tests..."
    npx jest tests/domain/LineOperations.test.ts
    ;;
  "file")
    echo "📄 Running FileTodoParser tests..."
    npx jest tests/domain/FileTodoParser.test.ts
    ;;
  "domain")
    echo "🏗️ Running all domain tests..."
    npx jest tests/domain/
    ;;
  "help"|"-h"|"--help")
    echo "Usage: ./test.sh [command]"
    echo ""
    echo "Commands:"
    echo "  watch     - Run tests in watch mode"
    echo "  coverage  - Run tests with coverage report"
    echo "  line      - Run LineOperations tests only"
    echo "  file      - Run FileTodoParser tests only"
    echo "  domain    - Run all domain tests"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./test.sh               # Run all tests"
    echo "  ./test.sh watch         # Watch for changes"
    echo "  ./test.sh coverage      # Generate coverage report"
    ;;
  *)
    echo "🚀 Running all tests..."
    npm test
    ;;
esac
