# Molecule viewer

`src/components/MoleculeViewer.astro` renders an interactive molecule with
[RDKit](https://www.rdkit.org/) and [Three.js](https://threejs.org/). It accepts
either a SMILES string or an SDF record and can be reused on Astro pages and in
MDX articles.

## Basic usage

Provide exactly one of `smiles` or `sdf`. Common UI and accessibility labels
have English defaults and can be overridden for localization or additional
context.

```astro
---
import MoleculeViewer from "@/components/MoleculeViewer.astro";
---

<MoleculeViewer
  smiles="CC(=O)Oc1ccccc1C(=O)O"
  ariaLabel="Interactive molecular model of aspirin"
  title="Aspirin"
  subtitle="C₉H₈O₄"
/>
```

Markdown files cannot import Astro components. Rename an article from `.md` to
`.mdx`, then place the component import after its frontmatter:

```mdx
---
title: Molecules in an article
# Additional post frontmatter…
---

import MoleculeViewer from "@/components/MoleculeViewer.astro";

<MoleculeViewer
  smiles="CCO"
  title="Ethanol"
  class="my-8"
  viewerHeight="20rem"
/>
```

To render an SDF file, import its contents with Vite's `?raw` suffix:

```astro
---
import MoleculeViewer from "@/components/MoleculeViewer.astro";
import moleculeSdf from "@/assets/molecules/example.sdf?raw";
---

<MoleculeViewer sdf={moleculeSdf} />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `smiles` | `string` | — | SMILES input. Mutually exclusive with `sdf`. |
| `sdf` | `string` | — | Mol block or SDF input. Mutually exclusive with `smiles`. |
| `ariaLabel` | `string` | `"Interactive molecular model"` | Accessible label for the WebGL canvas. |
| `loadingLabel` | `string` | `"Loading molecule…"` | Status shown while RDKit and the molecule load. |
| `errorLabel` | `string` | `"Molecule viewer unavailable"` | Status shown when parsing or rendering fails. |
| `interactionHint` | `string` | `"Drag to rotate · Scroll to zoom"` | Desktop interaction hint displayed over the canvas. |
| `pauseLabel` | `string` | `"Pause rotation"` | Accessible label for pausing automatic rotation. |
| `playLabel` | `string` | `"Start rotation"` | Accessible label for starting automatic rotation. |
| `resetLabel` | `string` | `"Reset view"` | Accessible label for resetting the camera. |
| `autoRotate` | `boolean` | `false` | Starts automatic rotation when enabled. |
| `rotationSpeed` | `number` | `10` | Automatic rotation speed in degrees per second. Must be greater than `0`. |
| `viewPadding` | `number` | `1.1` | Camera framing multiplier. `1` is the tightest fit; larger values add more space around the molecule. |
| `hydrogens` | `"preserve" \| "add" \| "remove"` | `"preserve"` | Keeps the input hydrogens, adds explicit hydrogens, or removes them before rendering. |
| `viewerHeight` | `string` | `"clamp(24rem, 52vw, 30rem)"` | CSS height used for the desktop viewer field. |
| `mobileAspectRatio` | `number` | `4 / 3` | Canvas aspect ratio below `40rem`. Must be greater than `0`. |
| `class` | `string` | — | Additional classes applied to the root figure. |
| `title` | `string` | — | Primary caption text. |
| `titleHref` | `string` | — | Makes the title a link when provided. |
| `subtitle` | `string` | — | Secondary caption text, such as a molecular formula. |
| `sourceLabel` | `string` | — | Source or attribution text in the caption. |
| `sourceHref` | `string` | — | Makes the source label a link when provided. |
| `linkTarget` | `"_self" \| "_blank"` | `"_self"` | Target shared by title and source links. New-tab links receive `rel="noreferrer"`. |

`viewPadding` must be at least `1`. A value below `1`, an infinite value, or
`NaN` causes Astro rendering to fail with a descriptive error. Empty
`viewerHeight` values and non-positive `mobileAspectRatio` or `rotationSpeed`
values are also rejected.

The component exposes a named `backdrop` slot for decorative, page-owned
content. Slotted content is marked up and styled by the caller:

```astro
<MoleculeViewer smiles="CCO">
  <span slot="backdrop" aria-hidden="true">Example</span>
</MoleculeViewer>
```

## Rendering behavior

The browser-side renderer is implemented in `src/scripts/moleculeViewer.ts`.
It performs the following work:

1. Loads the RDKit WebAssembly module and parses the supplied molecule.
2. Uses existing 2D or 3D coordinates when available. If the input has no
   coordinates, RDKit generates a 2D depiction.
3. Applies the selected hydrogen transformation after coordinates exist, then
   reparses RDKit's resulting mol block so its dimensionality is retained. When
   hydrogens are added to a 2D structure, it regenerates the 2D depiction to
   give the new atoms valid coordinates; supplied 3D conformers are not
   flattened or otherwise regenerated.
4. Converts atoms and bonds to Three.js spheres and cylinders using common CPK
   colors.
5. Fits a perspective camera using both horizontal and vertical field of view.
   This keeps the whole molecule visible in narrow mobile canvases.
6. Recalculates the camera fit whenever the canvas changes size.

A SMILES string usually describes connectivity without Cartesian coordinates,
so its generated layout is flat even though it can be rotated in the Three.js
scene. An SDF may contain a 2D depiction or a 3D conformer. A displayed 3D
conformer is one possible geometry, not automatically a preferred or bioactive
conformation.

All viewers on a page share the same RDKit initialization promise. Each viewer
still owns its Three.js scene, renderer, controls, animation frame, and resize
observer. An `IntersectionObserver` pauses each animation loop while its viewer
is outside the viewport. These resources are disposed during Astro page
transitions.

## Interaction and responsive layout

- Drag to rotate the camera around the molecule.
- Scroll or pinch to zoom.
- Pan with the standard OrbitControls mouse or touch gesture.
- Use the rotation button to pause or resume automatic rotation.
- Use the reset button to restore the fitted camera position.
- Below `40rem`, the canvas uses `mobileAspectRatio` and the caption stacks to
  avoid horizontal clipping.

The root figure includes `not-prose`, so Tailwind Typography rules from an MDX
article do not restyle the viewer's controls, links, or caption.

Bond colors follow the site's light and dark themes. The component listens for
the site's `site:theme-change` event and updates an existing scene without
reloading RDKit or rebuilding the molecule.

## Example: 404 page

The current not-found page imports the Lesinurad SDF and enables the optional
presentation controls:

```astro
<MoleculeViewer
  sdf={lesinuradSdf}
  autoRotate
  rotationSpeed={12}
  viewPadding={1.1}
  title="Lesinurad"
  titleHref="https://en.wikipedia.org/wiki/Lesinurad"
  sourceLabel="3D conformer · PubChem CID 53465279"
  sourceHref="https://pubchem.ncbi.nlm.nih.gov/compound/53465279"
  linkTarget="_blank"
>
  <span slot="backdrop" class="error-number" aria-hidden="true">404</span>
</MoleculeViewer>
```
