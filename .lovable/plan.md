

## Transparent nav on home top, solid elsewhere

Restore the scroll/route-aware header background while keeping nav text/icons always black (per recent rule).

### Behavior

- **Home (`/`) at top (not scrolled):** header background fully transparent, no border, no shadow.
- **Home scrolled past threshold:** header gets solid white background + bottom border (current "scrolled" style).
- **All other routes:** always solid white background + border, regardless of scroll.
- **Text/icons:** stay `text-foreground` (black) in all states — unchanged from last edit.

### Implementation

`src/components/layout/Header.tsx`:
- Already tracks `scrolled` and `pathname`. Add `const isHome = pathname === "/"`.
- Compute `const isTransparent = isHome && !scrolled && !mobileMenuOpen && !productsMenuOpen && !aboutMenuOpen` (mega menus force solid so dropdown panel reads correctly).
- Header root className: `isTransparent ? "bg-transparent border-transparent" : "bg-background border-b border-border"`.
- Leave `linkClass` / `iconClass` as-is (always black).

### Out of scope

- Nav text color (stays black).
- Mobile menu portal, mega menu contents, logo, layout, animations.
- Other pages' headers.

### Files

- `src/components/layout/Header.tsx` — ~5 lines changed in the header root className + one derived boolean.

