# Production Optimization Plan

## Goal
Remove route-transition and scroll jank on mobile while keeping the visual design intact and reducing unnecessary rendering overhead across the app.

## Root cause analysis
1. The app initializes LocomotiveScroll globally in App.jsx for every mount, which adds another scroll system on top of the browser and can interfere with normal scroll behavior.
2. The background layer renders animated fixed elements (falling leaves + large tree images) on every route and keeps them animating continuously, which is expensive on mobile.
3. Repeated Framer Motion animations on fixed overlays, bottom nav, and decorative elements create extra compositor work and can cause visible jitter during navigation and scrolling.
4. The app was using a broad set of expensive transform and blur effects without any reduced-motion or mobile guardrails.

## Implementation steps
1. Create a stable app shell with only necessary global providers and remove the redundant global scroll library.
2. Optimize background rendering by reducing animation complexity on mobile and respecting reduced-motion preferences.
3. Replace the most expensive animated leaf background with a lighter CSS-driven effect or mobile-safe fallback.
4. Simplify the mobile bottom navigation animation to reduce repaint cost during page changes.
5. Add global performance guardrails in CSS for smoother scrolling and lower paint cost.
6. Validate the production build and ensure no build regressions.

## Expected outcome
- Mobile navigation should feel smooth without route-to-route jitter.
- Background images and decorative motion should remain visually rich without causing scroll lag.
- The production bundle should remain stable and performant under normal browser behavior.
