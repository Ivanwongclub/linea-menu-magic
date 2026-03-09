
## Plan: Update Logo Font to Poppins Bold

**Goal**: Replace the serif "Libre Caslon Text" font on the "WIN-CYC" logo text with Poppins Bold (font-weight: 700) for a more contemporary, playful aesthetic while maintaining clean design principles.

**Implementation Approach**:

1. **Update Header Logo** (`src/components/layout/Header.tsx`):
   - Change the "WIN-CYC" text styling from `font-semibold` with `'Libre Caslon Text'` serif to `font-bold` with `'Poppins'` sans-serif
   - Keep the white color and existing sizing (text-xs lg:text-sm)
   - Leave "Group Limited" subtext styling unchanged

2. **Update Footer Logo** (`src/components/layout/Footer.tsx`):
   - Apply identical font changes to the "WIN-CYC" text in the footer for consistency
   - Maintain all other styling properties

**Technical Details**:
- **Font Change**: Replace `style={{ fontFamily: "'Libre Caslon Text', serif" }}` with `style={{ fontFamily: "'Poppins', sans-serif" }}`
- **Weight Adjustment**: Change `font-semibold` (600) to `font-bold` (700) to match the bold weight recommendation
- **Poppins is already available** in the project (confirmed in package.json and loaded in index.html)

**Files to Modify**:
- `src/components/layout/Header.tsx` (lines 40-42)
- `src/components/layout/Footer.tsx` (lines 13-15)

**Expected Result**: The logo will now have a modern, geometric, playful appearance with Poppins Bold while maintaining its white color and compact sizing.
