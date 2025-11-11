# Manual Testing Guide - Bug Fixes Verification

## Quick Start

### Step 1: Apply the Fixes

Open Command Prompt in the project root and run:

``````

### Step 2: Start the Application

Open TWO terminal windows:

**Terminal 1 - Backend:**
``````
Wait for: `Server running on http://localhost:5000`

**Terminal 2 - Frontend:**
``````
Wait for: `Local: http://localhost:5173/`

### Step 3: Open Browser

Navigate to: [**http://localhost:5173**](http://localhost:5173)

---

## Testing Checklist

### ✅ Critical Bug Fixes to Verify

#### Test 1: Skip Links (Accessibility)
**Bug Fixed:** Missing skip links integration

1. Open the app in browser
2. Press **Tab** key immediately
3. ✅ **EXPECT:** "Skip to main content" link should appear
4. Press **Enter** on the skip link
5. ✅ **EXPECT:** Focus jumps to main content area

**Status:** [ ] PASS [ ] FAIL

---

#### Test 2: Auto-Save (Memory Leak Fix)
**Bug Fixed:** Auto-save causing infinite re-renders

1. Navigate to **Workdocs**
2. Create or open a workdoc
3. Type some content
4. Wait 2 seconds without typing
5. ✅ **EXPECT:** Status changes from "Unsaved" → "Saving..." → "Saved"
6. Open DevTools Console (F12)
7. ✅ **EXPECT:** No infinite render warnings
8. Check React DevTools Profiler
9. ✅ **EXPECT:** No excessive re-renders

**Status:** [ ] PASS [ ] FAIL

---

#### Test 3: Title Auto-Resize
**Bug Fixed:** Title textarea not auto-resizing

1. In a workdoc, click on the title
2. Type a very long title (multiple lines worth of text)
3. ✅ **EXPECT:** Textarea grows automatically
4. ✅ **EXPECT:** No text overflow or scrollbars in title
5. Press Escape or click away
6. ✅ **EXPECT:** Title displays properly

**Status:** [ ] PASS [ ] FAIL

---

#### Test 4: ARIA Labels (Accessibility)
**Bug Fixed:** Missing ARIA labels on icon buttons

1. Open browser DevTools
2. Use **Inspect Element** on:
   - Back button (top-left)
   - Dark mode toggle
   - Share button
   - Emoji picker
   - More options menu
3. ✅ **EXPECT:** All buttons have `aria-label` attributes
4. Test with screen reader (NVDA/JAWS if available)
5. ✅ **EXPECT:** Buttons are announced properly

**Status:** [ ] PASS [ ] FAIL

---

#### Test 5: Socket Connection
**Bug Fixed:** Socket not checking if connected

1. Open workdoc in one browser tab
2. Open DevTools Console (F12)
3. Look for socket connection messages
4. ✅ **EXPECT:** No "socket.emit is not a function" errors
5. Open same workdoc in another tab
6. ✅ **EXPECT:** Collaborative presence shows multiple users
7. Type in one tab
8. ✅ **EXPECT:** Other tab updates (if collaborative editing works)

**Status:** [ ] PASS [ ] FAIL

---

### 🔍 Additional Tests

#### Test 6: Main Content Landmark
**Bug Fixed:** Missing main content ID

1. Open DevTools Elements tab
2. Search for `id="main-content"`
3. ✅ **EXPECT:** Found in WorkdocEditor page
4. ✅ **EXPECT:** Has `role="main"` attribute

**Status:** [ ] PASS [ ] FAIL

---

#### Test 7: ARIA Live Regions
**Bug Fixed:** Status updates not announced to screen readers

1. Open workdoc
2. Inspect the "Saved/Unsaved" status indicator
3. ✅ **EXPECT:** Has `role="status"` and `aria-live="polite"`
4. Type and wait for auto-save
5. ✅ **EXPECT:** Screen reader announces status changes

**Status:** [ ] PASS [ ] FAIL

---

### 🎨 Functional Tests

#### Test 8: Emoji Picker
1. Click emoji icon (📄)
2. ✅ **EXPECT:** Emoji picker opens
3. Click a different emoji
4. ✅ **EXPECT:** Icon changes immediately
5. ✅ **EXPECT:** Picker has `aria-label="Emoji picker"`

**Status:** [ ] PASS [ ] FAIL

---

#### Test 9: Dark Mode Toggle
1. Click sun/moon icon
2. ✅ **EXPECT:** Theme changes instantly
3. ✅ **EXPECT:** All colors update properly
4. ✅ **EXPECT:** Button has descriptive aria-label

**Status:** [ ] PASS [ ] FAIL

---

#### Test 10: More Options Menu
1. Click three-dot menu
2. ✅ **EXPECT:** Menu opens
3. ✅ **EXPECT:** Has `role="menu"` attribute
4. Try "Copy link"
5. ✅ **EXPECT:** Toast notification appears
6. Try "Export as Markdown"
7. ✅ **EXPECT:** File downloads
8. ✅ **EXPECT:** Menu items have `role="menuitem"`

**Status:** [ ] PASS [ ] FAIL

---

### ⌨️ Keyboard Navigation Tests

#### Test 11: Full Keyboard Navigation
1. Start at top of page
2. Press **Tab** repeatedly
3. ✅ **EXPECT:** Focus moves through all interactive elements
4. ✅ **EXPECT:** Visible focus indicators on all elements
5. ✅ **EXPECT:** No keyboard traps
6. Press **Shift+Tab** to go backwards
7. ✅ **EXPECT:** Focus moves in reverse order

**Status:** [ ] PASS [ ] FAIL

---

#### Test 12: Title Editing with Keyboard
1. Tab to title
2. Press **Enter** or **Space**
3. ✅ **EXPECT:** Title becomes editable
4. Type new title
5. Press **Escape**
6. ✅ **EXPECT:** Editing cancelled, original title restored
7. Edit again and press **Enter**
8. ✅ **EXPECT:** Editing saved

**Status:** [ ] PASS [ ] FAIL

---

### 🐛 Browser Console Checks

#### Test 13: No Console Errors
1. Open DevTools Console (F12)
2. Clear console
3. Navigate through app:
   - Login
   - Dashboard
   - Workdocs list
   - Open workdoc
   - Edit content
   - Auto-save
4. ✅ **EXPECT:** No red errors
5. ✅ **EXPECT:** No memory leak warnings
6. ✅ **EXPECT:** No "Maximum update depth" errors

**Acceptable Warnings:**
- Development mode warnings
- Missing translation keys (if any)

**NOT Acceptable:**
- React render errors
- Socket connection errors
- API errors (500, 404)
- "Can't perform state update on unmounted component"

**Status:** [ ] PASS [ ] FAIL

---

### 📊 Performance Tests

#### Test 14: React DevTools Profiler
1. Install React DevTools browser extension
2. Open Profiler tab
3. Start recording
4. Open a workdoc
5. Type content for 10 seconds
6. Stop recording
7. ✅ **EXPECT:** No components re-rendering excessively
8. ✅ **EXPECT:** WorkdocEditor renders ~every 2 seconds (auto-save)
9. ✅ **EXPECT:** No infinite render loops

**Status:** [ ] PASS [ ] FAIL

---

## 🔧 Troubleshooting

### If Backend Won't Start
``````

### If Frontend Won't Start
``````

### If Port is Already in Use
``````

### If Database Connection Fails
Check `backend/.env` file:
``````

---

## 📝 Accessibility Testing Tools

### Browser Extensions to Install:
1. **axe DevTools** - Automated accessibility testing
2. **WAVE** - Web accessibility evaluation
3. **React DevTools** - Component profiling
4. **Lighthouse** - Overall performance and accessibility audit

### Screen Readers (Optional but Recommended):
- **NVDA** (Windows) - Free and open source
- **JAWS** (Windows) - Industry standard
- **Narrator** (Windows) - Built-in

### Running Lighthouse Audit:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Click "Generate report"
5. ✅ **TARGET SCORE:** 90+ out of 100

---

## ✅ Final Checklist

Before marking the branch as ready:

- [ ] All 14 tests passed
- [ ] No console errors
- [ ] Lighthouse accessibility score 90+
- [ ] Tested with keyboard only (no mouse)
- [ ] Tested with screen reader (if available)
- [ ] Dark mode works correctly
- [ ] Auto-save works without issues
- [ ] No memory leaks detected
- [ ] All ARIA labels present
- [ ] Skip links functional

---

## 📊 Test Results Summary

**Date:** _____________
**Tester:** _____________
**Browser:** Chrome / Firefox / Edge / Safari
**Browser Version:** _____________

**Tests Passed:** _____ / 14
**Tests Failed:** _____ / 14

**Critical Issues Found:**
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

**Minor Issues Found:**
1. _____________________________________________
2. _____________________________________________

**Overall Status:** ✅ READY TO MERGE / ⚠️ NEEDS FIXES / ❌ MAJOR ISSUES

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
