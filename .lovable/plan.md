

## Plan: Reverse Nav Menu Text Colors

Swap the normal and hover colors for the desktop nav links when scrolled (non-transparent state). Currently: normal is muted (`text-foreground/60`), hover is full (`text-foreground`). Reverse so normal is dark and hover is lighter.

### Change

In `src/components/layout/Header.tsx` line 157, change the non-transparent inactive state from:
```
text-foreground/60 hover:text-foreground
```
to:
```
text-foreground hover:text-foreground/50
```

This makes menu text dark by default and lighter on hover — a reversed effect.

### Files modified
- `src/components/layout/Header.tsx` — one line change in `linkClass` function (line 157)

