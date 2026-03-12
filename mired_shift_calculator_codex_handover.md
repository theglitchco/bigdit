# Mired Shift Calculator — Codex Agent Handover

## 1) Project summary
Build a **mobile-first, minimal web app** for calculating **mired shift equivalence** between lighting and camera white balance settings.

The first release is a **single-purpose tool**, but the architecture should make it easy to expand into a broader suite of film/colour/DIT utilities later, and make future packaging as a mobile app straightforward.

Primary goal: a tool that is **fast, elegant, trustworthy, and frictionless on set**.

---

## 2) Core user problem
Users need to preserve the **same colour relationship / mismatch** between a light source and the camera white balance when moving into a new shooting setup.

### Typical scenario A
- Previous setup light: **4300K**
- Previous camera WB: **5600K**
- New camera WB: **3200K**
- Question: **What should the new light CCT be to preserve the same offset/look?**

### Typical scenario B
- Previous setup light: **4300K**
- Previous camera WB: **5600K**
- New ambient/daylight: **6600K**
- Question: **What should the camera WB be to preserve the same offset/look?**

This is not just a generic Kelvin converter. The app must think in terms of **mired relationships**.

---

## 3) Mathematical model
Use **mireds**, not direct Kelvin deltas.

### Formula
- `mired = 1,000,000 / Kelvin`
- `mired_shift = mired(light) - mired(cameraWB)`

To preserve the same visual relationship:

- `new_mired(light) = mired_shift + mired(new_cameraWB)`
- `new_mired(cameraWB) = mired(new_light) - mired_shift`

Then convert back:

- `Kelvin = 1,000,000 / mired`

### Important principle
Do **not** preserve simple Kelvin difference.
Preserve **mired offset**.

### Example A
Original:
- Light = 4300K → 232.56 mired
- Camera = 5600K → 178.57 mired
- Shift = 53.99 mired

New camera = 3200K → 312.50 mired

Required light:
- New light mired = 312.50 + 53.99 = 366.49
- New light Kelvin ≈ **2729K**

### Example B
Original shift = 53.99 mired
New light = 6600K → 151.52 mired

Required camera WB:
- New camera mired = 151.52 - 53.99 = 97.53
- New camera WB ≈ **10253K**

### Edge handling
If a calculation produces impossible or impractical values:
- warn the user clearly
- still show the mathematical result if valid numerically
- optionally mark results outside a practical lighting range (for example under ~1800K or over ~20000K) as **impractical for many fixtures/cameras**

---

## 4) Product requirements

### Must-have v1
1. **Two primary modes**:
   - **Solve for Light**
   - **Solve for Camera WB**
2. Inputs for:
   - original light Kelvin
   - original camera WB Kelvin
   - new target counterpart Kelvin
3. Output:
   - resulting Kelvin
   - original mired shift
   - optional compact calculation breakdown
4. Mobile-friendly responsive UI
5. Real-time calculation as values change
6. Input validation and graceful error states
7. Copy/share-friendly result display

### Nice-to-have v1.1+
1. **Swap / invert mode** buttons
2. Preset chips: `2800`, `3200`, `4300`, `5600`, `6000`, `6500`
3. Optional rounding mode:
   - exact
   - rounded to nearest 50K
   - rounded to nearest 100K
4. “On-set explanation” drawer with concise formula breakdown
5. Save last values locally
6. Dark mode support

### Future expansion hooks
The architecture should make it easy to add:
- false colour / exposure helper tools
- ND / stop calculators
- frame-rate / shutter calculators
- colour temperature comparison tools
- gel approximation helpers
- LUT / colour pipeline utilities

---

## 5) Recommended framework and stack

## Recommendation
Use **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui**.

### Why this is the best choice
- excellent for a **small polished web tool**
- can be deployed easily on many hosts or exported statically depending on requirements
- naturally supports growth into a **multi-tool app**
- strong component model for reusable calculator modules
- TypeScript improves correctness for calculation logic
- Tailwind + shadcn/ui supports minimal elegant UI quickly
- straightforward future path toward:
  - PWA behaviour
  - API routes if needed later
  - authentication if a tool suite grows
  - wrapping into mobile via **Capacitor**

### App strategy
Design it as a **tool shell** even if only one tool exists now.

Suggested information architecture:
- `/` = app landing / calculator shell
- `/tools/mired-shift` = current calculator
- future tools can live under `/tools/...`

If the user wants only a single-page tool visually, that’s fine — but code structure should still anticipate a broader tool suite.

### Alternative considered
**Vite + React** would also work and is slightly lighter, but **Next.js** wins because it scales more cleanly into a larger tools platform and later app-like product.

---

## 6) Architecture guidance
Structure the project cleanly so the calculation engine is independent of the UI.

### Separate concerns
1. **Core domain logic**
   - pure calculation functions
   - no UI dependencies
2. **Presentation layer**
   - input forms
   - result cards
   - inline warnings
3. **App shell / routing**
   - supports future multiple tools
4. **State layer**
   - local component state for now
   - easy migration later if global state is needed

### Suggested folder structure
```text
src/
  app/
    tools/
      mired-shift/
        page.tsx
  components/
    tool-layout/
    calculator/
      kelvin-input.tsx
      mode-toggle.tsx
      result-card.tsx
      formula-drawer.tsx
      preset-chips.tsx
  lib/
    calculators/
      mired.ts
    validation/
      kelvin.ts
    formatting/
      numbers.ts
  types/
    calculator.ts
```

### Core logic file should expose functions like
```ts
kelvinToMired(k: number): number
miredToKelvin(m: number): number
getMiredShift(lightK: number, cameraK: number): number
solveForLight(originalLightK: number, originalCameraK: number, newCameraK: number): CalculationResult
solveForCamera(originalLightK: number, originalCameraK: number, newLightK: number): CalculationResult
```

These functions should be fully reusable later in a larger app or mobile wrapper.

---

## 7) UX direction
The feel should be:
- **clean**
- **precise**
- **quietly premium**
- **not flashy**
- **fast to use under pressure**

Think more like a high-end production utility than a consumer gadget app.

### Mobile-first priorities
- large tap targets
- no clutter
- minimal scrolling
- single-column layout on phones
- sticky or prominent result area
- numeric keypad-friendly inputs

### Suggested screen structure
1. Header
   - app name
   - one-line purpose
2. Mode selector
   - `Solve for Light`
   - `Solve for Camera WB`
3. Input card
   - original light
   - original camera WB
   - new target input
   - preset chips
4. Result card
   - primary answer in large type
   - mired shift shown underneath
   - concise interpretation line
5. Optional expandable formula/details section

### Tone of UI copy
Use restrained professional language.

Examples:
- “Match the same mired offset across setups.”
- “Required light setting”
- “Required camera white balance”
- “Result may be outside the practical range of many fixtures.”

Avoid gimmicky copy.

---

## 8) UI design notes
### Visual style
- lots of breathing room
- rounded cards, but not overly soft
- sharp typography hierarchy
- subtle borders and muted contrast
- elegant dark/light support if implemented

### Design cues
- neutral palette
- avoid over-branding
- use clear separation between **input state** and **answer state**
- answer should feel authoritative and instantly readable

### Typography hierarchy
- app title: modest, strong
- result number: large and dominant
- labels: subdued
- formulas/details: small but legible

### Interaction details
- calculate live as user types
- preserve cursor behaviour properly
- debounce only if needed; ideally instant
- allow empty fields without ugly failures
- invalid input should show calm inline help, not intrusive alerts

---

## 9) Functional detail

### Mode 1: Solve for Light
Inputs:
- Original light Kelvin
- Original camera WB Kelvin
- New camera WB Kelvin

Output:
- Required new light Kelvin
- Original mired shift
- Formula breakdown

### Mode 2: Solve for Camera WB
Inputs:
- Original light Kelvin
- Original camera WB Kelvin
- New light Kelvin

Output:
- Required new camera WB Kelvin
- Original mired shift
- Formula breakdown

### Output formatting
Show:
- **primary Kelvin answer** as rounded integer by default
- optional precise mired values to 2 decimals
- optional note about whether the result is warmer/cooler than the comparison source

### Validation rules
- Kelvin must be positive numbers
- practical UI entry range could default to something like `1000–40000K`
- do not silently clamp unless the UI indicates it
- if division would produce invalid result, show an explanatory state

---

## 10) Suggested feature additions for credibility
These are small but useful and make the tool feel properly designed.

### A. Practicality badge
If result is:
- `< 1800K` or `> 20000K`, show “Potentially impractical”

### B. Relative interpretation line
Examples:
- “To maintain the same warmth relative to camera WB, set the light to **2729K**.”
- “To preserve the same offset against a **6600K** source, set camera WB to **10253K**.”

### C. One-tap copy result
Copy a compact text block like:
```text
Original: Light 4300K / Camera 5600K
Shift: +53.99 mired
New camera: 3200K
Required light: 2729K
```

### D. Preset chips
Fast entry for common set values.

---

## 11) Accessibility and usability
- proper form labels
- strong contrast
- keyboard accessible
- screen-reader-friendly result section
- numeric inputs should behave well on mobile
- avoid relying on colour alone to communicate state

This should work smoothly one-handed on a phone on set.

---

## 12) Performance and deployment
This is a tiny app. Keep it lean.

### Expectations
- very small JS footprint
- no unnecessary libraries
- no heavy animation
- instant load on mobile data

### Deployment
Make it easy to deploy to a typical server/VPS/cPanel-style environment.

If possible:
- support static export if feasible for the chosen setup
- otherwise provide a simple Node deployment path

Document deployment clearly.

---

## 13) Progressive Web App / app future
The codebase should not overbuild for native, but it should be easy to evolve.

### Prepare for this by
- keeping the calculator logic framework-agnostic
- avoiding browser-specific assumptions inside the domain logic
- structuring components so they can be wrapped later
- considering PWA metadata/service worker later
- making Capacitor wrapping feasible for iOS/Android later

Do not build the full app-wrapper now unless it adds minimal overhead.
Just avoid choices that would make later app conversion painful.

---

## 14) Testing guidance
At minimum, write tests for the calculation engine.

### Unit tests should cover
- kelvin to mired conversion
- mired to kelvin conversion
- round-trip conversion sanity
- solve-for-light known example
- solve-for-camera known example
- extreme but valid inputs
- invalid input handling

### Canonical test examples
#### Example 1
- original light: 4300
- original camera: 5600
- new camera: 3200
- expected light: about **2729K**

#### Example 2
- original light: 4300
- original camera: 5600
- new light: 6600
- expected camera: about **10253K**

Allow minor floating-point tolerance.

---

## 15) Implementation guidance for calculation logic
### Rules
- calculations must be deterministic and pure
- avoid hidden rounding in the core math
- do full precision internally
- round only in presentation layer

### Example pseudocode
```ts
function kelvinToMired(k: number) {
  return 1_000_000 / k
}

function miredToKelvin(m: number) {
  return 1_000_000 / m
}

function getMiredShift(lightK: number, cameraK: number) {
  return kelvinToMired(lightK) - kelvinToMired(cameraK)
}

function solveForLight(originalLightK: number, originalCameraK: number, newCameraK: number) {
  const shift = getMiredShift(originalLightK, originalCameraK)
  const newLightMired = kelvinToMired(newCameraK) + shift
  return {
    shift,
    resultKelvin: miredToKelvin(newLightMired),
    resultMired: newLightMired,
  }
}

function solveForCamera(originalLightK: number, originalCameraK: number, newLightK: number) {
  const shift = getMiredShift(originalLightK, originalCameraK)
  const newCameraMired = kelvinToMired(newLightK) - shift
  return {
    shift,
    resultKelvin: miredToKelvin(newCameraMired),
    resultMired: newCameraMired,
  }
}
```

---

## 16) Content / labeling recommendations
### App title options
Preferred:
- **Mired Shift Calculator**

Possible subtitle:
- “Preserve colour relationship across lighting and white balance changes.”

### Input labels
- Original light
- Original camera WB
- New camera WB
- New light source

### Result labels
- Required light setting
- Required camera WB
- Original mired shift

---

## 17) What to avoid
- No cluttered scientific dashboard aesthetic
- No skeuomorphic cinema gimmicks
- No overcomplicated graphing for v1
- No mixing Kelvin-difference logic with mired logic
- No hidden assumptions that all results are physically achievable
- No monolithic code that makes adding future tools awkward

---

## 18) Deliverables expected from Codex agent
1. A production-ready web implementation
2. Clean componentized code
3. Reusable calculation module
4. Tests for math logic
5. Readme with:
   - setup
   - local dev
   - build/deploy
   - future extension notes
6. Polished responsive UI

---

## 19) Final product standard
The finished result should feel like a **serious, elegant utility for cinematography workflows**:
- immediate
- accurate
- easy to trust
- architected for future expansion

The app should be simple on the surface and disciplined underneath.

---

## 20) Optional next-step recommendation
After v1 is complete, the next best upgrade is probably:
1. save/share presets
2. PWA installability
3. second calculator in the same shell (for example ND / stop or shutter angle)

That would validate the multi-tool architecture without much extra work.

