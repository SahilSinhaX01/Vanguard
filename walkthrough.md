# Walkthrough - VANGUARD: High-Fidelity Cinematic Monochrome Starship

We have upgraded the landing page background to render an ultra-realistic, cold, militaristic, and zero-color 3D space scene in strict monochrome.

---

## 🖤 Visual Concept Reference

Here is the final polished cinematic artwork representing the Vanguard cruiser, which matches the styling of the live background canvas:

![Vanguard Cinematic Battle](file:///C:/Users/ASUS/.gemini/antigravity/scratch/vanguard-landing/vanguard_final_cinematic.jpg)

---

## 📂 File Architecture

The cinematic zero-color overhaul is implemented across:
* [style.css](file:///C:/Users/ASUS/.gemini/antigravity/scratch/vanguard-landing/style.css): Removed color-gradients on the canvas and set a solid near-black void background (`#040406`).
* [index.html](file:///C:/Users/ASUS/.gemini/antigravity/scratch/vanguard-landing/index.html): Imported the post-processing libraries (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass).
* [script.js](file:///C:/Users/ASUS/.gemini/antigravity/scratch/vanguard-landing/script.js): Completely redesigned the 3D scene:
  - Custom procedural ship assembly with physical overlapping armor plates, spine ridges, modules, delta fins, and twin engines.
  - Custom twinkling starfield shader.
  - Distant planet with Fresnel-glow atmosphere shader.
  - Dual-layer thruster plumes with low-frequency engine flicker.
  - Dynamically injected vignette overlay and animated film grain at 24fps.

---

## 🚀 Key Interactive & Automated Systems

### 1. High-Fidelity Starship Geometry (Anti-CAD, 8:1 Ratio)
* **Ditched Wireframes**: Completely removed all wireframe meshes from the ship and components to prevent a "preview render" look.
* **Segmented Hulls**: Built from 40 slices forming dual parallel hulls separated by a recessed center slot.
* **Physical Armor Panels**: Overlayed separate thin boxes with small gaps to represent heavy interlocking hull plates.
* **Longitudinal Spine Ridges**: Runs the length of each hull body as raised metallic ridges.
* **Dorsal Modules & Greebles**: Scattered rectangular modules on the upper dorsal surface, and antenna masts and sensor blisters along the flanks.
* **Delta Fins**: 4 swept-back extruded delta fins at the stern (2 dorsal, 2 ventral) angled outward at 30 degrees.
* **Asymmetric Engines**: Two engine nozzles offset to the left of the stern, firing custom-layered plumes (white core and diffused blue-white cone).

### 2. Twinkling Starfield & Atmospheric Planet Shaders
* **300+ Point Sprites**: Rendered via a GPU `ShaderMaterial` with size attenuation, twinkling independently at cycle frequencies ranging from 0.3s to 2.5s.
* **Planet Limb & Atmospheric Rim Glow**: A charcoal-grey planet sits left-back, enveloped by an additive-blended larger sphere rendering a cold blue-white atmospheric halo.

### 3. Shadows, Post-Processing & Cinematic Overlays
* **Hard Rim Shadow Mapping**: Rendered under a single high-intensity rim light from the upper-left, casting sharp PCFSoftShadows across 80% of the hull to emphasize shape depth.
* **Selective UnrealBloomPass**: Blooms only bright emissive elements (thruster white core and planet atmosphere edge) above threshold 0.9.
* **24fps Film Grain & Vignette**: A dynamically generated 128x128 noise pattern tiles the screen, shifting offset coordinates at 24fps, combined with a vignette darkening corners to pure black.

---

## 📋 Verification & Testing

### Local Dev Server
* **Host URL**: http://localhost:8000
* **Project Folder**: [vanguard-landing](file:///C:/Users/ASUS/./gemini/antigravity/scratch/vanguard-landing/)

> [!NOTE]
> Open the page in your browser at `http://localhost:8000` to view the live cinematic monochrome space scene!
