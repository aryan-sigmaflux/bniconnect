# Premium Soft-Neumorphic Dating App UI Style System

## Overview

This design language is a modern soft-neumorphic mobile UI with:

* Rounded oversized cards
* Floating layered elements
* Extremely soft shadows
* Light pastel palette
* Minimal contrast
* High whitespace usage
* Bold typography hierarchy
* Floating action buttons
* Soft gradients
* Organic curved background shapes
* Airy composition
* Glass-like elevated UI feel

The style is heavily focused on:

* Emotional warmth
* Luxury simplicity
* Modern social app aesthetics
* Soft feminine visual direction
* Touchable UI depth
* Floating layers and card stacking

This document defines EVERY visual system detail needed to recreate the style.

---

# 1. Global Design Philosophy

## Visual Mood

The interface should feel:

* Soft
* Romantic
* Premium
* Weightless
* Friendly
* Elegant
* Clean
* Modern
* Slightly playful

The UI must NEVER feel:

* Corporate
* Dark
* Aggressive
* Overly colorful
* Sharp-edged
* Flat
* Brutalist
* Dense
* Technical

---

# 2. Color System

## Primary Palette

### Primary Pink

Used for:

* CTA buttons
* Active icons
* Match indicators
* Like buttons
* Dots
* Highlights

```css
#F53D6B
```

Alternative shades:

```css
#FF4D7A
#FF5B84
#F04873
```

---

### Soft Background Pink

Main screen background.

```css
#F8EDEE
```

---

### Secondary Background

Used for cards.

```css
#FFF8F8
```

---

### Light Cream Overlay

Used inside gradients.

```css
#FFF2EA
```

---

### Warm Beige

Used in image overlays.

```css
#D4B08A
```

---

### Soft White

Used for elevated surfaces.

```css
#FFFFFF
```

---

## Neutral Text Colors

### Main Heading

```css
#1A1A1A
```

### Secondary Text

```css
#666666
```

### Muted Text

```css
#9C9C9C
```

### Disabled Icons

```css
#C7C7D1
```

---

# 3. Gradient System

## Main App Background Gradient

```css
background: linear-gradient(
  135deg,
  #F7ECEE 0%,
  #F9E9EC 35%,
  #FBEDEF 100%
);
```

---

## Primary CTA Gradient

```css
background: linear-gradient(
  135deg,
  #FF4D7A 0%,
  #F53D6B 100%
);
```

---

## Soft Floating Card Glow

```css
background: linear-gradient(
  180deg,
  rgba(255,255,255,0.9) 0%,
  rgba(255,255,255,0.75) 100%
);
```

---

# 4. Typography System

Font Family:

```css
font-family: 'Poppins', sans-serif;
```

The entire app should ONLY use Poppins.

---

# 5. Typography Weight Rules

## Hero Headings

Used for:

* Match screens
* Big welcome text
* Important emotional moments

```css
font-weight: 700;
font-size: 36px;
line-height: 1.1;
letter-spacing: -0.5px;
```

Style:

* Bold
* Tight spacing
* Large
* High contrast

---

## Card Name Text

Used for user names.

```css
font-weight: 600;
font-size: 18px;
line-height: 1.2;
```

Should feel:

* Strong
* Elegant
* Clean
* Easy to scan

---

## Subtitle Text

Used for:

* Profession
* Small descriptions
* Secondary labels

```css
font-weight: 400;
font-size: 13px;
line-height: 1.4;
color: #FFFFFF;
opacity: 0.9;
```

---

## Navigation Labels

```css
font-weight: 500;
font-size: 12px;
```

---

## Small UI Text

Used for:

* Distance labels
* Metadata
* Tiny indicators

```css
font-weight: 500;
font-size: 10px;
letter-spacing: 0.3px;
```

---

## CTA Buttons

```css
font-weight: 600;
font-size: 15px;
letter-spacing: 0.2px;
```

---

## Section Labels

Like:

* CONGRATULATIONS
* FEATURED
* ACTIVE NOW

```css
font-weight: 600;
font-size: 11px;
letter-spacing: 3px;
text-transform: uppercase;
```

---

# 6. Corner Radius System

This UI heavily depends on exaggerated rounded corners.

## Main Device Frame

```css
border-radius: 38px;
```

---

## Profile Cards

```css
border-radius: 34px;
```

---

## Floating Buttons

```css
border-radius: 50%;
```

---

## CTA Buttons

```css
border-radius: 18px;
```

---

## Tiny Pills

```css
border-radius: 999px;
```

---

# 7. Shadow System

The shadows are VERY important.

Everything floats.

Nothing should feel attached to the background.

---

## Main Card Shadow

```css
box-shadow:
  0 20px 40px rgba(244, 164, 180, 0.18),
  0 8px 16px rgba(0,0,0,0.04);
```

Characteristics:

* Large blur
* Very low opacity
* Soft edge
* Pink-tinted ambient light

---

## Floating Button Shadow

```css
box-shadow:
  0 10px 24px rgba(245, 61, 107, 0.25);
```

---

## Soft Surface Shadow

```css
box-shadow:
  0 4px 12px rgba(0,0,0,0.04);
```

---

# 8. Layout Rules

## Overall Layout Style

The design uses:

* Vertical centering
* Large whitespace
* Floating stacked elements
* Breathing room between components
* Extremely balanced spacing

Never crowd the screen.

---

## Screen Padding

```css
padding-left: 20px;
padding-right: 20px;
padding-top: 24px;
padding-bottom: 24px;
```

---

## Section Gaps

```css
gap: 16px;
```

Large components:

```css
gap: 24px;
```

---

# 9. Background Design Language

The background is NOT flat.

It contains:

* Curved abstract lines
* Soft circles
* Organic wave patterns
* Floating particles
* Very low opacity decorative shapes

---

## Background Curves

Characteristics:

* Extremely subtle
* Thin lines
* Soft pink tones
* Large scale curves
* Abstract geometry

Suggested opacity:

```css
opacity: 0.08;
```

---

## Floating Dots

Used as ambient decorative particles.

Sizes:

```css
6px
8px
12px
```

Opacity:

```css
0.4 - 0.8
```

---

# 10. Phone Mockup Styling

The device container itself should feel premium.

## Device Frame

```css
background: rgba(255,255,255,0.6);
backdrop-filter: blur(20px);
border-radius: 42px;
```

---

## Device Shadow

```css
box-shadow:
  0 30px 60px rgba(238, 180, 192, 0.28);
```

---

# 11. Top Navigation Styling

## Header Layout

Structure:

```text
[Back]     Title      [Filter]
```

---

## Header Title

```css
font-size: 18px;
font-weight: 600;
```

---

## Location Subtitle

```css
font-size: 11px;
font-weight: 400;
color: #888888;
```

---

## Top Buttons

Dimensions:

```css
width: 40px;
height: 40px;
```

Style:

```css
background: #FFFFFF;
border-radius: 14px;
box-shadow: 0 4px 12px rgba(0,0,0,0.05);
```

Icons:

```css
stroke-width: 1.8px;
```

---

# 12. Profile Card System

This is the MOST important element.

---

## Card Dimensions

```css
width: 100%;
height: 72vh;
```

---

## Card Structure

```text
[Image]
[Gradient Overlay]
[Name]
[Profession]
[Indicators]
```

---

## Image Style

The image should:

* Fill entire card
* Be softly cropped
* Use portrait composition
* Have warm grading
* Slightly desaturated highlights
* Soft contrast

---

## Image Border Radius

```css
border-radius: 34px;
```

---

## Bottom Overlay Gradient

```css
background: linear-gradient(
  180deg,
  rgba(0,0,0,0) 0%,
  rgba(0,0,0,0.58) 100%
);
```

---

## Name Positioning

```css
position: absolute;
bottom: 42px;
left: 20px;
```

---

## Name Styling

```css
font-size: 18px;
font-weight: 600;
color: white;
```

---

## Profession Styling

```css
font-size: 13px;
font-weight: 400;
color: rgba(255,255,255,0.9);
```

---

# 13. Action Buttons

## Vertical Action Stack

Buttons are stacked vertically on the right side.

Structure:

```text
[X]
[Star]
[Heart]
```

---

## Button Style

Inactive:

```css
background: rgba(255,255,255,0.22);
backdrop-filter: blur(12px);
```

---

## Active Like Button

```css
background: linear-gradient(
  135deg,
  #FF5A84,
  #F53D6B
);
```

---

## Action Button Size

```css
width: 54px;
height: 54px;
```

---

## Icon Size

```css
20px
```

---

# 14. Floating Card Stack Animation

The middle screen demonstrates stacked-card animation.

Important characteristics:

* Rotated foreground card
* Layered depth
* Overlapping cards
* Soft motion
* Elastic interaction

---

## Rotation Angle

```css
transform: rotate(-9deg);
```

---

## Layer Scaling

Background card:

```css
transform: scale(0.96);
opacity: 0.92;
```

---

# 15. Bottom Navigation

## Navigation Container

```css
height: 74px;
background: rgba(255,255,255,0.95);
backdrop-filter: blur(20px);
```

---

## Navigation Layout

```css
display: flex;
justify-content: space-around;
align-items: center;
```

---

## Active Navigation Item

```css
background: linear-gradient(
  135deg,
  #FF4D7A,
  #F53D6B
);
```

Shape:

```css
width: 42px;
height: 42px;
border-radius: 14px;
```

---

## Inactive Icons

```css
opacity: 0.45;
```

---

# 16. Match Screen Design

The match screen should feel:

* Celebratory
* Airy
* Emotional
* Romantic
* Premium

---

## Match Layout

Structure:

```text
[Floating profile images]
[Small hearts]
[Congratulations label]
[Large headline]
[Description]
[Primary CTA]
[Secondary CTA]
```

---

## Floating Images

Images should:

* Float diagonally
* Overlap softly
* Use different sizes
* Have soft shadows
* Feel suspended in space

---

## Floating Hearts

Use:

```css
color: #FF5A84;
opacity: 0.5;
```

Sizes:

```css
8px
12px
16px
```

---

## Match Headline

```css
font-size: 22px;
font-weight: 700;
line-height: 1.3;
```

---

## Description Text

```css
font-size: 13px;
font-weight: 400;
color: #7A7A7A;
line-height: 1.6;
```

---

# 17. CTA Buttons

## Primary Button

```css
height: 54px;
background: linear-gradient(
  135deg,
  #FF4D7A,
  #F53D6B
);
color: white;
font-weight: 600;
font-size: 15px;
border-radius: 18px;
```

Shadow:

```css
box-shadow:
  0 12px 24px rgba(245, 61, 107, 0.25);
```

---

## Secondary Button

```css
background: rgba(255,255,255,0.65);
color: #e31212ff;
```

---

# 18. Spacing System

## Micro Spacing

```css
4px
8px
```

Used for:

* Icons
* Labels
* Tiny alignment

---

## Standard Spacing

```css
12px
16px
20px
```

Used for:

* Component gaps
* Card padding
* Layout spacing

---

## Large Spacing

```css
24px
32px
40px
```

Used for:

* Section separation
* Emotional breathing room

---

# 19. Icon Style System

Icons should:

* Be minimal
* Use rounded strokes
* Never feel sharp
* Use thin-medium line weight

Recommended:

```css
stroke-width: 1.8px;
stroke-linecap: round;
stroke-linejoin: round;
```

---

# 20. Motion System

Animations should be:

* Soft
* Slow
* Elegant
* Elastic
* Floaty

Never snappy.

---

## Default Animation Timing

```css
transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
```

---

## Card Drag Animation

```css
transition: transform 0.25s ease-out;
```

---

## Floating Effect

```css
transform: translateY(-4px);
```

---

# 21. Blur System

Blur is VERY important.

Used for:

* Floating controls
* Overlay surfaces
* Glassmorphism elements

---

## Main Blur

```css
backdrop-filter: blur(18px);
```

---

## Heavy Blur

```css
backdrop-filter: blur(28px);
```

---

# 22. Decorative Design Language

The UI uses subtle decorative elements.

Examples:

* Dashed curved lines
* Tiny hearts
* Floating circles
* Abstract waves
* Layered shapes

These should NEVER dominate the screen.

Opacity range:

```css
0.05 - 0.14
```

---

# 23. Image Treatment

All images should:

* Have warm tones
* Slight pink/beige grading
* Slight matte effect
* Soft highlights
* Reduced harsh blacks
* Cinematic softness

---

## Recommended Filter

```css
filter:
  saturate(0.95)
  contrast(0.96)
  brightness(1.02);
```

---

# 24. Overall Composition Rules

## Important Principles

### 1. Everything Floats

No harsh attachments.

### 2. Avoid Hard Lines

Minimal borders.

### 3. Use Large Radius

Rounded corners everywhere.

### 4. Use Soft Contrast

Nothing too dark.

### 5. Keep Air Between Elements

Whitespace is critical.

### 6. Use Pink as Emotional Accent

Pink should guide attention.

### 7. Shadows Must Be Soft

Never harsh black shadows.

### 8. Typography Must Feel Premium

Heavy for titles.
Thin for metadata.

---

# 25. Exact UI Feeling Summary

The final UI should feel like:

* A luxury dating startup
* Modern iOS design language
* Pinterest + Tinder + Dribbble inspiration
* Romantic soft-tech aesthetic
* Floating layered mobile concept art
* Elegant emotional design
* Minimal but highly polished

---

# 26. DO NOT DO THESE

Avoid:

* Sharp corners
* Pure black backgrounds
* Hard borders
* Thick outlines
* Heavy gradients
* Oversaturated colors
* Tiny spacing
* Dense layouts
* Material Design harshness
* Android-heavy aesthetics
* Brutalist layouts
* Flat UI

---

# 27. Recommended CSS Variables

```css
:root {
  --primary: #F53D6B;
  --primary-light: #FF5B84;
  --bg-main: #F8EDEE;
  --surface: #FFF8F8;
  --text-main: #1A1A1A;
  --text-secondary: #666666;
  --text-muted: #9C9C9C;

  --radius-large: 34px;
  --radius-medium: 18px;
  --radius-small: 14px;

  --shadow-main:
    0 20px 40px rgba(244, 164, 180, 0.18);

  --shadow-soft:
    0 8px 20px rgba(0,0,0,0.04);
}
```

---

# 28. Final Implementation Notes

To truly achieve this style:

* Focus more on spacing than decoration
* Use depth subtly
* Keep animations smooth and elegant
* Make every element feel touchable
* Use softness in every corner, shadow, and interaction
* Maintain consistent rounded geometry
* Keep typography clean and confident
* Avoid visual noise
* Prioritize emotional visual comfort

The MOST important aspects are:

1. Rounded geometry
2. Soft shadows
3. Floating depth
4. Pastel pink palette
5. Premium whitespace
6. Layered cards
7. Elegant typography hierarchy
8. Soft glassmorphism
9. Warm image grading
10. Minimal-but-premium composition
