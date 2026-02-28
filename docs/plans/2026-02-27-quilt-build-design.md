# Quilt Build — Design Document
*2026-02-27*

## Overview

A personal web app for quilters to design blocks visually, assemble them into quilts, and generate fabric-efficient cutting plans.

## Tech Stack

- **Framework:** Vite + React
- **Rendering:** SVG (block editor, quilt assembler)
- **State management:** Zustand
- **Color utilities:** tinycolor2 (color harmonies), color-thief (photo color extraction)
- **PDF export:** @react-pdf/renderer
- **Persistence:** LocalStorage (auto-save) + JSON file download/upload

## App Structure

Three main views accessible from a top nav or sidebar:

1. Block Editor
2. Quilt Assembler
3. Cutting Plan

---

## 1. Block Editor

An SVG canvas divided into an N×N grid. Each cell can be:

- **Solid square** — filled with a single color
- **Half-square triangle (HST)** — cell split along one diagonal (top-left↘ or top-right↙), each triangle half assigned a color. Quarter-square triangles are out of scope for v1.

### Controls

- Grid size selector (4×4, 6×6, 8×8, 12×12)
- Finished block size (numeric input, in inches)
- Seam allowance (default 0.25", editable)
- Color palette panel (see below)
- Grayscale contrast toggle — desaturates the live SVG to check light/dark value contrast
- Clear button to reset the block

### Color Panel

Two entry points for adding colors to the working palette:

1. **Direct color picker** — color wheel or hex/RGB input
2. **Fabric photo import** — upload a photo of a fabric, then either:
   - Click anywhere on the image to sample that exact hex/RGB value
   - Auto-extract 3–5 dominant colors from the image (using color-thief)

Any color added to the palette triggers **harmony suggestions** via tinycolor2: complementary, analogous, triadic, split-complementary, and neutrals. Clicking a suggestion adds it to the palette.

---

## 2. Quilt Assembler

Tiles the designed block across a grid to preview the full quilt.

### Controls

- Blocks wide × blocks tall (numeric inputs)
- Block rotation per position (0°, 90°, 180°, 270°) — enables secondary patterns at block intersections
- Border/sashing toggle — add a plain border with a configurable width (inches)
- Finished quilt size displayed automatically (e.g. "72" × 96"")

The full quilt renders in SVG, crisp at any zoom.

**Scope note:** v1 supports a single repeating block type. Multiple block types and complex layouts (alternating blocks, sashing strips between blocks) are planned for a future version.

---

## 3. Cutting Plan

Analyzes the block design, scales to the full quilt, and produces a fabric-efficient cut list organized by color.

### Cut Size Formulas

- **Plain squares:** finished size + 0.5"
- **Half-square triangles:** finished size + 1.0" (two squares sewn and cut diagonally yield two HST units)

### Per-Color Sections

Each color in the design gets its own section:

1. **Total yardage needed**
2. **Cut list, sorted largest to smallest** — reflects the quilter's preference to cut large pieces first and trim down
3. **Strip cutting breakdown** — strips cut across 42" fabric width:
   - Strip width (= piece height)
   - Pieces per strip
   - Number of strips required
4. **Scrap yield** — remaining strip length after required pieces are cut, flagged with sub-cutting suggestions for smaller pieces in the design

*Example output: "Cut 3 strips at 4.5" wide × 42". Each strip yields 9 squares. 3" left over from strip 3 — sub-cuttable into two 1.5" squares."*

**Fabric width assumption:** 42" (standard quilting cotton bolt width, not configurable in v1)

---

## 4. Save / Export

### Project Persistence

- **Auto-save** to browser LocalStorage — no work lost mid-session
- **Download JSON** — saves full project state (block design, palette, quilt settings)
- **Upload JSON** — resumes a saved project

### PDF Export

Available from any view. Exported PDF includes:

- Visual of the block and full quilt layout
- Finished block and quilt dimensions
- Full cut list organized by color

---

## Out of Scope (v1)

- Multiple block types in one quilt layout
- Quarter-square triangles
- Fabric textures (solid colors only; textures planned for a future version)
- Cloud storage or user accounts
- Configurable fabric width (hardcoded to 42")
