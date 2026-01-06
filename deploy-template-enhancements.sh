#!/bin/bash
# Template Enhancements Deployment Script
# This script applies all template enhancements and commits to git

set -e  # Exit on error

echo "=========================================="
echo "  Template Enhancements Deployment"
echo "=========================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    echo "Please run this script from the project root"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "feature/accessibility-user-workdoc-enhancements" ]; then
    echo "⚠️  Warning: Not on feature branch"
    echo "Current: $CURRENT_BRANCH"
    echo "Expected: feature/accessibility-user-workdoc-enhancements"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo ""
echo "--- Step 1: Applying Enhanced Files ---"
echo ""

# Backend: Apply enhanced templates data
if [ -f "backend/src/data/boardTemplates.ENHANCED.ts" ]; then
    cp backend/src/data/boardTemplates.ENHANCED.ts backend/src/data/boardTemplates.ts
    echo "✅ Applied: Enhanced templates data (20 templates)"
    rm backend/src/data/boardTemplates.ENHANCED.ts
    echo "🗑️  Cleaned up: boardTemplates.ENHANCED.ts"
else
    echo "⚠️  Warning: Enhanced templates data not found"
fi

# Frontend: Apply enhanced Templates page
if [ -f "frontend/src/pages/Templates.ENHANCED.tsx" ]; then
    cp frontend/src/pages/Templates.ENHANCED.tsx frontend/src/pages/Templates.tsx
    echo "✅ Applied: Enhanced Templates UI (search, preview, etc.)"
    rm frontend/src/pages/Templates.ENHANCED.tsx
    echo "🗑️  Cleaned up: Templates.ENHANCED.tsx"
else
    echo "⚠️  Warning: Enhanced Templates UI not found"
fi

# Frontend: Apply fixed WorkdocEditor (accessibility fixes)
if [ -f "frontend/src/pages/WorkdocEditor.FIXED.tsx" ]; then
    cp frontend/src/pages/WorkdocEditor.FIXED.tsx frontend/src/pages/WorkdocEditor.tsx
    echo "✅ Applied: Fixed WorkdocEditor (accessibility + bug fixes)"
    rm frontend/src/pages/WorkdocEditor.FIXED.tsx
    echo "🗑️  Cleaned up: WorkdocEditor.FIXED.tsx"
else
    echo "⚠️  Warning: Fixed WorkdocEditor not found"
fi

echo ""
echo "--- Step 2: Git Status ---"
echo ""

git status --short

echo ""
echo "--- Step 3: Stage Changes ---"
echo ""

# Stage all modified files
git add backend/src/data/boardTemplates.ts
git add frontend/src/pages/Templates.tsx
git add frontend/src/pages/WorkdocEditor.tsx

# Stage documentation files if they exist
if [ -f "CODE_REVIEW_REPORT.md" ]; then
    git add CODE_REVIEW_REPORT.md
    echo "✅ Staged: CODE_REVIEW_REPORT.md"
fi

if [ -f "TEMPLATES_FEATURE_COMPLETE.md" ]; then
    git add TEMPLATES_FEATURE_COMPLETE.md
    echo "✅ Staged: TEMPLATES_FEATURE_COMPLETE.md"
fi

echo "✅ Staged all changes"

echo ""
echo "--- Step 4: Review Changes ---"
echo ""

echo "Files to be committed:"
git diff --cached --stat

echo ""
read -p "Review the changes above. Commit? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Aborted. Changes are staged but not committed."
    echo "To unstage: git reset HEAD"
    exit 0
fi

echo ""
echo "--- Step 5: Commit Changes ---"
echo ""

# Create comprehensive commit message
COMMIT_MSG="feat: enhance templates feature with 20+ templates and improved UX

## Templates Enhancement
- Added 12 new professional templates (20 total)
- Added 3 new categories: HR, Design, Personal
- Implemented template search functionality
- Added preview modal with template structure
- Enhanced UI with template stats and counts
- Better visual design with hover effects

## Bug Fixes & Accessibility
- Fixed auto-save memory leak in WorkdocEditor
- Fixed socket connection check
- Added skip links for accessibility
- Implemented title textarea auto-resize
- Added comprehensive ARIA labels
- Fixed editor content sync issues

## Categories (9 total)
- Development (3 templates)
- Product (2 templates)
- Marketing (3 templates)
- Sales (2 templates)
- Project Management (3 templates)
- Operations (2 templates)
- HR (2 templates)
- Design (1 template)
- Personal (2 templates)

## Technical Details
- Enhanced boardTemplates.ts with comprehensive template data
- Improved Templates.tsx with search, preview, and better UX
- Fixed WorkdocEditor.tsx accessibility and performance issues
- Added comprehensive documentation

Closes #[issue-number]"

git commit -m "$COMMIT_MSG"

echo "✅ Committed successfully!"

echo ""
echo "--- Step 6: Summary ---"
echo ""

echo "📊 Changes committed:"
git log -1 --stat

echo ""
echo "--- Next Steps ---"
echo ""
echo "1. Push changes: git push origin $CURRENT_BRANCH"
echo "2. Create pull request on GitHub/GitLab"
echo "3. Test the application:"
echo "   - Terminal 1: cd backend && npm run dev"
echo "   - Terminal 2: cd frontend && npm run dev"
echo "   - Browser: http://localhost:5173/templates"
echo ""
echo "🎉 Template enhancements deployed successfully!"
