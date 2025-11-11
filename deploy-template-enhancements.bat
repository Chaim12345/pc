@echo off
REM Template Enhancements Deployment Script (Windows)
REM This script applies all template enhancements and commits to git

setlocal enabledelayedexpansion

echo ==========================================
echo   Template Enhancements Deployment
echo ==========================================
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo Error: Not a git repository
    echo Please run this script from the project root
    pause
    exit /b 1
)

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: %CURRENT_BRANCH%
echo.

if not "%CURRENT_BRANCH%"=="feature/accessibility-user-workdoc-enhancements" (
    echo Warning: Not on expected feature branch
    echo Current: %CURRENT_BRANCH%
    echo Expected: feature/accessibility-user-workdoc-enhancements
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "!CONTINUE!"=="y" (
        echo Aborted.
        exit /b 1
    )
)

echo.
echo --- Step 1: Applying Enhanced Files ---
echo.

REM Backend: Apply enhanced templates data
if exist "backend\src\data\boardTemplates.ENHANCED.ts" (
    copy /Y "backend\src\data\boardTemplates.ENHANCED.ts" "backend\src\data\boardTemplates.ts" >nul
    echo [OK] Applied: Enhanced templates data (20 templates)
    del "backend\src\data\boardTemplates.ENHANCED.ts" >nul 2>&1
    echo [OK] Cleaned up: boardTemplates.ENHANCED.ts
) else (
    echo [WARN] Enhanced templates data not found
)

REM Frontend: Apply enhanced Templates page
if exist "frontend\src\pages\Templates.ENHANCED.tsx" (
    copy /Y "frontend\src\pages\Templates.ENHANCED.tsx" "frontend\src\pages\Templates.tsx" >nul
    echo [OK] Applied: Enhanced Templates UI (search, preview, etc.)
    del "frontend\src\pages\Templates.ENHANCED.tsx" >nul 2>&1
    echo [OK] Cleaned up: Templates.ENHANCED.tsx
) else (
    echo [WARN] Enhanced Templates UI not found
)

REM Frontend: Apply fixed WorkdocEditor
if exist "frontend\src\pages\WorkdocEditor.FIXED.tsx" (
    copy /Y "frontend\src\pages\WorkdocEditor.FIXED.tsx" "frontend\src\pages\WorkdocEditor.tsx" >nul
    echo [OK] Applied: Fixed WorkdocEditor (accessibility + bug fixes)
    del "frontend\src\pages\WorkdocEditor.FIXED.tsx" >nul 2>&1
    echo [OK] Cleaned up: WorkdocEditor.FIXED.tsx
) else (
    echo [WARN] Fixed WorkdocEditor not found
)

echo.
echo --- Step 2: Git Status ---
echo.

git status --short

echo.
echo --- Step 3: Stage Changes ---
echo.

REM Stage all modified files
git add backend/src/data/boardTemplates.ts
git add frontend/src/pages/Templates.tsx
git add frontend/src/pages/WorkdocEditor.tsx

REM Stage documentation files if they exist
if exist "CODE_REVIEW_REPORT.md" (
    git add CODE_REVIEW_REPORT.md
    echo [OK] Staged: CODE_REVIEW_REPORT.md
)

if exist "TEMPLATES_FEATURE_COMPLETE.md" (
    git add TEMPLATES_FEATURE_COMPLETE.md
    echo [OK] Staged: TEMPLATES_FEATURE_COMPLETE.md
)

echo [OK] Staged all changes

echo.
echo --- Step 4: Review Changes ---
echo.

echo Files to be committed:
git diff --cached --stat

echo.
set /p COMMIT_CONFIRM="Review the changes above. Commit? (Y/n): "
if /i "%COMMIT_CONFIRM%"=="n" (
    echo Aborted. Changes are staged but not committed.
    echo To unstage: git reset HEAD
    pause
    exit /b 0
)

echo.
echo --- Step 5: Commit Changes ---
echo.

REM Create commit message
git commit -F- << EOF
feat: enhance templates feature with 20+ templates and improved UX

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
EOF

echo [OK] Committed successfully!

echo.
echo --- Step 6: Summary ---
echo.

echo Changes committed:
git log -1 --stat

echo.
echo --- Next Steps ---
echo.
echo 1. Push changes: git push origin %CURRENT_BRANCH%
echo 2. Create pull request on GitHub/GitLab
echo 3. Test the application:
echo    - Terminal 1: cd backend ^&^& npm run dev
echo    - Terminal 2: cd frontend ^&^& npm run dev
echo    - Browser: http://localhost:5173/templates
echo.
echo Template enhancements deployed successfully!
echo.
pause
