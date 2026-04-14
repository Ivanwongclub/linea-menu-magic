

## Plan: Dynamically Align Mega Menus to "SEGMENTS" Nav Link

### Problem
After centering the nav with `justify-center flex-1`, the hardcoded `pl-[200px]` no longer aligns with the "SEGMENTS" link position, which now varies based on screen width.

### Approach
Use a ref on the first nav link ("SEGMENTS") to measure its left offset, then apply that as `paddingLeft` on each mega menu's inner container dynamically. This ensures alignment regardless of screen size.

### Changes — `src/components/layout/Header.tsx`

1. **Add a ref** to the SEGMENTS nav button wrapper (`div` at line 207):
   ```tsx
   const segmentsRef = useRef<HTMLDivElement>(null);
   ```

2. **Compute left offset** with a state + resize listener:
   ```tsx
   const [navLeftOffset, setNavLeftOffset] = useState(200);
   useEffect(() => {
     const update = () => {
       if (segmentsRef.current) {
         setNavLeftOffset(segmentsRef.current.getBoundingClientRect().left);
       }
     };
     update();
     window.addEventListener('resize', update);
     return () => window.removeEventListener('resize', update);
   }, []);
   ```

3. **Apply ref** to the SEGMENTS button wrapper:
   ```tsx
   <div key={link.href} className="relative" ref={segmentsRef} ...>
   ```

4. **Replace hardcoded padding** on all 3 mega menu inner containers (lines 288, 402, 497):
   - Remove `pl-[200px] xl:pl-[240px]`
   - Add inline style: `style={{ paddingLeft: navLeftOffset }}`

### Files modified
- `src/components/layout/Header.tsx`

