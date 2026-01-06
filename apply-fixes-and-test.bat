@echo off
echo ========================================
echo   Applying Bug Fixes and Testing
echo ========================================
echo.

echo [1/6] Backing up original files...
copy /Y "frontend\src\pages\WorkdocEditor.tsx" "frontend\src\pages\WorkdocEditor.BACKUP.tsx"
echo ✓ Backup created
echo.

echo [2/6] Applying fixes to WorkdocEditor...
copy /Y "frontend\src\pages\WorkdocEditor.FIXED.tsx" "frontend\src\pages\WorkdocEditor.tsx"
echo ✓ Fixes applied to WorkdocEditor.tsx
echo.

echo [3/6] Running linter...
npm run lint:frontend
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Linting found issues, but continuing...
) else (
    echo ✓ Linting passed
)
echo.

echo [4/6] Running TypeScript compilation check...
cd frontend
npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo ✗ TypeScript compilation failed!
    echo Please fix the errors above before continuing.
    cd ..
    pause
    exit /b 1
)
echo ✓ TypeScript compilation successful
cd ..
echo.

echo [5/6] Starting development servers...
echo.
echo Opening two terminals:
echo   - Terminal 1: Backend (http://localhost:5000)
echo   - Terminal 2: Frontend (http://localhost:5173)
echo.
echo Press Ctrl+C in each terminal to stop the servers
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 5 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [6/6] Opening browser for testing...
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo.

echo ========================================
echo   TESTING CHECKLIST
echo ========================================
echo.
echo Please test the following:
echo.
echo □ 1. Login to the application
echo □ 2. Navigate to Workdocs
echo □ 3. Create or open a workdoc
echo □ 4. Press Tab key - verify Skip Link appears
echo □ 5. Test auto-save (type and wait 2 seconds)
echo □ 6. Test title editing and auto-resize
echo □ 7. Test emoji picker
echo □ 8. Test collaborative features (if possible)
echo □ 9. Test dark mode toggle
echo □ 10. Test export and share features
echo □ 11. Open DevTools Console - check for errors
echo □ 12. Test keyboard navigation (Tab through all elements)
echo.
echo ========================================
echo   Servers are running!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Close the server terminal windows when done testing.
echo.
pause
