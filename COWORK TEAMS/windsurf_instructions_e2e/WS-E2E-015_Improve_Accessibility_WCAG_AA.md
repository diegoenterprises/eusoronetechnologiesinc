# WS-E2E-015: Improve Accessibility (WCAG AA)

**Priority:** P2  
**Estimated Hours:** 20  
**Status:** Not Started

## CONTEXT

Accessibility is limited with:
- Missing ARIA labels on buttons/inputs
- Inconsistent focus indicators
- Some colors with contrast below 4.5:1 ratio
- No skip-to-content link
- Missing alt text on images

This violates WCAG AA standards and excludes users with disabilities.

## REQUIREMENTS

1. Add ARIA labels to all buttons and inputs:
   ```typescript
   // Every button needs aria-label or aria-labelledby
   <button aria-label="Close modal">X</button>
   
   // Every input needs label or aria-label
   <input aria-label="Email address" type="email" />
   
   // Form groups need aria-labelledby
   <fieldset>
     <legend id="shippment-options">Shipment Options</legend>
     <input aria-labelledby="shippment-options" />
   </fieldset>
   ```

2. Add ARIA descriptions for form errors:
   ```typescript
   <input aria-describedby="email-error" />
   <span id="email-error" role="alert">Email is invalid</span>
   ```

3. Add visible focus rings:
   ```css
   /* global.css or tailwind config */
   :focus-visible {
     outline: 3px solid #1e40af; /* blue-800 */
     outline-offset: 2px;
   }
   
   /* Remove default outline in Tailwind */
   button {
     @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-800;
   }
   ```

4. Create skip-to-content link:
   ```typescript
   // In layout or root component
   <a 
     href="#main-content" 
     className="absolute top-0 left-0 -translate-y-full focus:translate-y-0 bg-blue-600 text-white px-4 py-2 z-50"
   >
     Skip to content
   </a>
   
   <main id="main-content" role="main">
     {/* content */}
   </main>
   ```

5. Audit color contrast (WCAG AA requires 4.5:1 for normal text):
   - Use tools: WebAIM Contrast Checker, axe DevTools
   - Test all text/background combinations
   - Update CSS for low-contrast combinations:
     ```css
     /* Example: Light gray text on white is too light */
     /* Old: color: #999 (contrast 4.2:1, FAILS) */
     /* New: color: #666 (contrast 5.3:1, PASSES) */
     ```

6. Add alt text to all images:
   ```typescript
   // Every img tag needs alt text
   <img src="/driver-dashboard.png" alt="Dashboard showing active loads and earnings" />
   
   // Decorative images use empty alt
   <img src="/divider.svg" alt="" />
   
   // Icons use title or aria-label
   <IconCheck aria-label="Confirmed" />
   ```

7. Add landmark roles:
   ```typescript
   <header role="banner">Header</header>
   <nav role="navigation">Navigation</nav>
   <main role="main">Main content</main>
   <aside role="complementary">Sidebar</aside>
   <footer role="contentinfo">Footer</footer>
   ```

8. Add heading hierarchy:
   - All pages start with H1 (only one per page)
   - Follow sequential order (no jumping H1 to H3)
   - Don't use headings for styling (use CSS)

9. Add ARIA live regions for dynamic content:
   ```typescript
   // For notifications/alerts
   <div aria-live="polite" aria-atomic="true" role="status">
     {statusMessage}
   </div>
   
   // For important announcements
   <div aria-live="assertive" role="alert">
     {criticalMessage}
   </div>
   ```

10. Ensure keyboard navigation:
    - All interactive elements reachable via Tab key
    - Tab order follows logical flow (add tabIndex if needed)
    - Modals trap focus (focus doesn't escape)
    - Buttons can be activated with Enter/Space

11. Add accessible form patterns:
    ```typescript
    // Use native HTML elements when possible
    <select> instead of custom dropdown
    <button> instead of <div onClick={}>
    <label htmlFor="id"> instead of <span>
    <input type="date"> for date pickers
    
    // Required fields marked clearly
    <input required aria-required="true" />
    ```

12. Add accessible tables:
    ```typescript
    <table>
      <thead>
        <tr>
          <th scope="col">Driver Name</th>
          <th scope="col">Distance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John Doe</td>
          <td>500 miles</td>
        </tr>
      </tbody>
    </table>
    ```

13. Create accessibility checklist in README:
    - [ ] All text meets 4.5:1 contrast ratio
    - [ ] All buttons have aria-labels
    - [ ] All inputs have associated labels
    - [ ] Page has H1 heading
    - [ ] Keyboard navigation works
    - [ ] Skip link present
    - [ ] Focus indicators visible
    - [ ] Form errors announced
    - [ ] All images have alt text
    - [ ] No color alone conveys information

## FILES TO MODIFY

- `pages/` directory (all pages)
- `components/` directory (all components)
- `global.css` or `tailwind.config.ts` (focus styles)
- `layout.tsx` or root component (skip link)
- `README.md` (accessibility guidelines)

## VERIFICATION

1. Run axe DevTools browser extension:
   ```
   - Install from Chrome Web Store: axe DevTools
   - Run scan on each page
   - Fix all violations and verify pass
   ```

2. Test color contrast:
   ```
   - Use WebAIM Contrast Checker
   - Test all text colors
   - Verify 4.5:1 minimum
   ```

3. Test keyboard navigation:
   - Disable mouse, navigate with Tab
   - All interactive elements reachable
   - Tab order logical
   - Focus visible at all times

4. Test with screen reader:
   ```
   - Windows: NVDA (free) or JAWS
   - Mac: VoiceOver (built-in)
   - Test page structure, buttons, forms
   ```

5. Verify skip link works:
   - Tab to first element
   - Should be "Skip to content" link
   - Pressing Enter jumps to main content

6. Check heading hierarchy:
   ```bash
   # Use Web Developer extension
   # View headings, verify H1 exists and follows order
   ```

7. Test with Lighthouse:
   ```bash
   npm run dev
   # Open Chrome DevTools > Lighthouse
   # Run Accessibility audit
   # Score should be 90+
   ```

## DO NOT

- Skip alt text on images (even if using background-image, still describe)
- Use color alone to convey information (pair with icons, text, patterns)
- Remove focus indicators (make them visible, don't hide with outline: none)
- Use generic labels like "Click here" (be specific)
- Forget about keyboard users (test without mouse)
- Create unlabeled form fields (every input needs label)
- Use more than one H1 per page
- Put interactive content in tables used for layout
- Forget to test with actual screen readers
- Leave low contrast combinations unfixed

