---
name: Korvo
tagline: AI-powered job outreach engine, drawn as an editorial blueprint
mood: [warm, technical, editorial, calm-confident, schematic]

color:
  mode: light-only
  palette:
    background:
      page: "#FAFAF8" # warm off-white, primary canvas
      section_alt: "#F5F5F0" # slightly recessed sections, warmer paper
      card: "#FFFFFF" # cards float on the off-white
      code: "#1A1A1A" # near-black code surface
      code_header: "#2A2A2A" # one tone lighter for code header bar
    text:
      primary: "#1A1A1A" # headings, decisive content
      body: "#4A4A4A" # body paragraphs
      muted: "#8A8A8A" # labels, hints, mono captions
      light: "#B0B0B0" # metadata, disabled, placeholders
      on_dark: "#FFFFFF"
    accent:
      base: "#0D9488" # teal-600, the only chromatic voice
      hover: "#0F766E" # teal-700, deepens on press
      bg: "#F0FDFA" # teal-50, soft tinted backgrounds
      ring: "rgba(13, 148, 136, 0.20)" # focus ring + popular-tier ring
    border:
      hairline: "#E8E8E3" # warm hairline, default rule
      card: "#EBEBEB" # neutral card border, slightly cooler
      dashed: "#E8E8E3" # repurposed hairline, dashed treatment
    status:
      success: "#2D8A56"
      success_bg: "#F0FDF4"
      warning: "#D97706"
      warning_bg: "#FFFBEB"
      error: "#DC2626"
      error_bg: "#FEF2F2"
    code_syntax:
      string: "#86EFAC" # green-300
      key: "#93C5FD" # blue-300
      class: "#0D9488" # accent teal
      line_number: "#6B7280" # gray-500
      base_text: "#E5E5E5" # gray-200
  selection:
    background: "#0D9488"
    text: "#FFFFFF"

typography:
  families:
    serif:
      stack: "Source Serif 4, ui-serif, Georgia, serif"
      role: display + headings + editorial pull-quotes
      weights: [600, 700]
      styles: [normal, italic]
    sans:
      stack: "DM Sans, ui-sans-serif, system-ui, sans-serif"
      role: body copy + UI text
      weights: [400, 500, 600]
    mono:
      stack: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
      role: technical labels, eyebrows, code, data values, button text
      weights: [400, 500]
  scale:
    eyebrow:
      {
        size: "10px",
        weight: 700,
        family: mono,
        transform: uppercase,
        tracking: "0.20em-0.30em",
      }
    micro:
      {
        size: "11px",
        weight: 700,
        family: mono,
        transform: uppercase,
        tracking: "0.20em",
      }
    caption: { size: "12px", weight: 500, family: sans }
    body_small: { size: "13px", weight: 400, family: sans, line_height: 1.5 }
    body: { size: "14px", weight: 400, family: sans, line_height: 1.6 }
    body_lead: { size: "15px", weight: 400, family: sans, line_height: 1.7 }
    body_hero:
      { size: "18px-20px", weight: 400, family: sans, line_height: 1.6 }
    h3: { size: "18px-20px", weight: 600, family: serif, line_height: 1.2 }
    h2:
      {
        size: "32px-48px",
        weight: 600,
        family: serif,
        line_height: 1.1,
        tracking: "-0.01em",
      }
    h1:
      {
        size: "48px-72px",
        weight: 700,
        family: serif,
        line_height: 1.1,
        tracking: "-0.02em",
      }
    metric: { size: "36px-48px", weight: 700, family: serif }
  treatments:
    italic_accent: "Selective single-word italics in headlines, colored teal-600. Used to mark the emotional pivot of a headline (e.g. the word 'personalized')."
    snake_case_labels: "UI affordances and section subtitles render in mono UPPER_SNAKE_CASE (OPEN_DEMO, REPLY_RATE_RESONANCE, SEC_03). Reads like a schematic, not a spec sheet."
    blueprint_eyebrow: "Section headers use a small bordered tag SEC_NN with a pulsing teal dot, followed by a hairline rule out to the column edge."
    no_em_dashes: "House style forbids em dashes in prose. Use comma, semicolon, colon, parentheses."

spacing:
  base: 4
  scale: [0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128]
  section_padding_y: { mobile: "80px", desktop: "96px-128px" }
  container_max_width: 1200
  content_max_width: 720
  copy_measure: 640

radii:
  sharp: "0px" # pricing tier cards (deliberate, technical edge)
  xs: "2px" # tag chips (rounded-sm)
  sm: "6px" # small chips, inline indicators
  md: "8px" # inputs, list items (rounded-lg)
  lg: "12px" # cards, primary surfaces (rounded-xl)
  xl: "16px" # featured cards, search bar (rounded-2xl)
  pill: "9999px" # confidence badges, status dots, dot indicators

borders:
  width:
    hairline: "1px"
    emphasis: "2px"
  default_color: "#E8E8E3"
  card_color: "#EBEBEB"
  dashed_rule: "1px dashed #E8E8E3"
  inner_rule_on_dark: "rgba(255,255,255,0.05)"

elevation:
  shadows:
    flat: "none"
    hairline: "0 1px 2px rgba(0,0,0,0.04)"
    card: "0 1px 2px rgba(0,0,0,0.04)"
    floating: "0 20px 50px rgba(0,0,0,0.04)" # the hero search bar
    pricing_pop: "0 25px 50px -12px rgba(0,0,0,0.10)"
    accent_glow: "0 10px 30px rgba(13,148,136,0.20)"
  rules:
    - "Shadows are warm and barely there. Black at 4-10 percent alpha, never below #000."
    - "Reserve glow shadows for the popular tier and accent CTAs only. Never on cards in body."
    - "Cards on the off-white page rely on a subtle border first, shadow second."

motion:
  durations:
    instant: "100ms"
    quick: "150ms"
    standard: "300ms"
    slow: "500ms"
    deliberate: "700ms"
    cinematic: "1000ms"
  easings:
    standard: "cubic-bezier(0.4, 0, 0.2, 1)"
    decelerate: "cubic-bezier(0.16, 1, 0.3, 1)" # reveal-on-scroll signature
    in_out: "ease-in-out"
  patterns:
    press: "active:scale-[0.98], 150ms"
    hover_lift: "translate-y -1px on featured cards, 300ms"
    focus_ring: "2px accent ring with 2px offset, 150ms"
    reveal: "opacity 0 -> 1 + translateY 10px -> 0, 600ms decelerate, staggered 100ms per index"
    placeholder_typewriter: "Hero input cycles 3 example queries, 80ms type, 40ms delete, 2s hold"
    pulse_dot: "Status dots breathe at 2s intervals; never blink. Used on SEC_NN tags."
    gradient_sweep: "Top-edge accent gradient slides in on hover for steps cards (HowItWorks)"
  rules:
    - "Default transition is 150ms ease-in-out. Anything longer should earn its time."
    - "Stagger group reveals by 100-150ms per child for sequence reading order."
    - "Never animate color hue on hover; shift only opacity, lightness, or border."

icons:
  library: lucide-react
  default_size_px: [12, 14, 16, 18, 20]
  stroke_weight: 1.75
  fill: none
  rules:
    - "Icons sit inside square chips at 40-48px with 8-12% accent tint background."
    - "Inline icons match adjacent text color, never gain their own color."

components:
  button:
    height: { sm: 36, default: 44, lg: 48 }
    radius: 8
    font: { family: sans, size: 14, weight: 600 }
    variants:
      primary:
        bg: accent.base
        text: on_dark
        hover_bg: accent.hover
        shadow: hairline
      outline:
        bg: transparent
        border: hairline
        text: text.body
        hover: { border: text.muted, bg: accent.bg }
      secondary:
        bg: section_alt
        border: hairline
        text: text.primary
        hover_bg: accent.bg
      ghost:
        bg: transparent
        text: text.muted
        hover: { text: accent.base, bg: accent.bg }
      destructive:
        bg: status.error
        text: on_dark
    treatments:
      cta_label_style: "Primary CTAs in mono UPPERCASE with 0.2em tracking (OPEN_DEMO, EXEC_UPGRADE_TO_PRO). Sans-case for in-app secondary actions."
  input:
    height: { default: 44, hero: 52 }
    radius: 8
    bg: card
    border: card_color
    focus: { border: accent, ring: "1px accent at 20% alpha" }
    placeholder: text.light
  card:
    radius: 12
    bg: card
    border: card_color
    padding: { mobile: 24, desktop: 32 }
    shadow: card
    states:
      default: "border card_color, shadow card"
      hovered: "border text.light"
      highlighted: "border accent, ring 1px accent/20, shadow elevated"
  search_bar_hero:
    radius: 16
    bg: card
    padding: 8
    shadow: floating
    focus_within: "border accent at 30% alpha"
    composition: "Inline icon, transparent input, primary CTA flush right"
  badge:
    section_tag: "border accent/30, bg accent/5, mono 10px bold accent, with 4px pulsing dot"
    confidence_pill: "rounded-full, hairline border, mono 10px, dot color encodes status (success/warning/error)"
    blueprint_tag: "border hairline, bg white/50, mono 10px muted, prefixed with a faded #"
    recommended_node: "absolute pill above popular pricing tier, accent bg, on_dark text, 9px mono"
  pricing_tier:
    radius: 0 # sharp on purpose, reads as engineering doc
    padding: 48
    popular: { ring: 1px accent/20, scale: 1.05, shadow: pricing_pop }
    cta:
      popular: "bg accent, on_dark, accent_glow shadow"
      base: "bg text.primary, on_dark, accent on hover"
  contact_card:
    radius: 16
    bg: card
    border: hairline
    states: "hover border accent/30"
    confidence_dot: "1.5px dot encodes confidence tier inside an outlined pill"
    hook_block: "italic 13px on accent/5 fill with accent/10 border, 12px radius"
  email_draft:
    radius: 16
    overflow: hidden
    header: "section_alt strip, mono 11px label, optional accent 'Personalized' chip"
    fields: "labels in mono 10px uppercase eyebrow above inline-styled inputs"
    actions: "stretched outline buttons in mono 11px UPPERCASE, primary slot for SEND_VIA_GMAIL"
  navbar:
    height: 64
    bg: "background page at 90% alpha + backdrop blur"
    logo: "8x8 accent square, white K, 14px bold, paired with 18px semibold wordmark"
    links: "14px sans medium, muted -> primary on hover"
    cta: "compact text-primary button, accent on hover"
  footer:
    bg: card
    border_top: hairline
    layout: "lockup left, inline link list right, single tier"
  schematic_shell:
    purpose: "Optional editorial chrome wrapping marketing pages in a draftsman frame"
    elements:
      - "Top fixed coordinate bar: mono 9px GRID_COORD_REF tokens at 40% opacity"
      - "Left fixed line-number rail: 000, 010, 020 ... at 30% opacity"
      - "Background ascii decor (boxes, dot grids, plus signs) at 2-3% opacity"
      - "Selection color forced to accent on white"
  texture_motifs:
    dot_matrix: "20px radial dot grid at 10% opacity, used as ambient background fill"
    ascii_box: "ASCII rectangle composed of ┌ ─ ┐ │ └ ┘, rotated +-12deg, 2-3% opacity"
    plus_field: "+ + +/+ + + grid, 2% opacity"
    section_connector: "vertical 1px hairline with 1.5px dot caps, 50% opacity"
  metric_strip:
    layout: "3-column grid divided by hairline rules"
    number: "serif 36-48px, primary text"
    label: "sans 14px medium, muted, uppercase, 0.2em tracking"

backgrounds:
  page_default: "#FAFAF8 warm off-white, slight pinkish neutral"
  section_alt: "#F5F5F0 for stripe/recessed sections"
  white_panel: "#FFFFFF for cards and white-paper sections"
  dark_panel: "#1A1A1A used for sidebar matrices and code blocks"
  ambient_decor: "Always passive, opacity ceiling 10 percent, never overlaps text"
---

# Korvo design system

Korvo is the technical engineer's job-outreach tool. The visual language has to read three things at once: warm and inviting (you're a broke uni student, not an enterprise buyer), technically credible (this is software that touches your real Gmail), and editorial (the emails Korvo drafts are good prose, not slop). The interface is built so a contact card and a paragraph of body copy share the same paper.

## Look and feel

The page is warm off-white paper, not white. Cards float on top in pure white, surrounded by hairline warm borders. Shadows are barely there, set in black at four to ten percent alpha so they keep the warmth instead of cooling the page. The accent is a single deep teal (`#0D9488`), used sparingly for CTAs, focus rings, status dots, italic emphasis in headlines, and the subtle tinted backgrounds behind icons. There are no other chromatic colors in marketing surfaces. Status communicates through three muted tones (green for success, amber for warning, red for error), each paired with its own faint tinted background.

Type is the structural element. Source Serif 4 sets headlines and pull quotes in 600 to 700 weight with tight tracking. DM Sans handles body copy with generous leading. JetBrains Mono does the heavy lifting for technical chrome: section eyebrows, button labels, data values, status badges, captions. The system deliberately leans on mono in places that ordinarily get sans, because the product is for engineers and the chrome should look like a schematic, not a marketing brochure. Headlines occasionally promote a single word to teal italic to mark the emotional pivot ("Land interviews with _personalized_ outreach") — this is the one moment of editorial flourish.

The aesthetic owns a mild "blueprint" treatment. Marketing sections open with a tagged eyebrow like `SEC_03` set in a small bordered chip with a pulsing teal dot, then a hairline rule that runs to the column edge. CTAs and labels often render in `UPPER_SNAKE_CASE` (OPEN_DEMO, EXEC_UPGRADE_TO_PRO, REPLY_RATE_RESONANCE). Some pages wrap themselves in an optional editorial chrome — fixed top coordinate bar, fixed left line-number rail, ambient ASCII decor at two to three percent opacity in the corners — which makes the page read like an architect's draft sheet without ever distracting from the content. Use this chrome for the highest-stakes marketing surfaces; skip it for the in-app experience, which favors calm.

## Layout and rhythm

Marketing flows on a 1200px content frame with 24px gutters. Body copy never exceeds a 640-720px measure. Sections breathe with 80px of vertical padding on mobile, 96 to 128px on desktop. Hairline borders separate sections; full-bleed dividers do the heavy structural work and let cards stay quiet inside them. The pricing trio uses sharp 0px corners on purpose — the corners read as engineering paper rather than soft consumer SaaS, and it's the one place where the product tells you it knows it's a tool. Everywhere else, corners follow a 12-16px radius that pairs with the warm paper surface.

The chat surface (in-app) is calmer. A 288px sidebar with a section-alt fill, a fluid main column, and a sticky bottom input. Contact cards and email drafts arrive as left-aligned chat bubbles capped at 85-90 percent of the column width, with a fade-in slide animation that makes the AI's work feel deliberate rather than instantaneous. Cards in chat use 16px radii, hairline borders, and the same tinted-accent hooks for personalization callouts.

## Components and patterns

Buttons come in five variants — primary teal, outline, secondary section-alt, ghost, destructive — and three sizes. Primary CTAs in marketing surfaces almost always render in mono uppercase with 0.2em tracking (OPEN_DEMO, SEND_VIA_GMAIL); secondary in-app actions use sans case. Every button presses with a 0.98 scale on active and a 150ms ease-in-out transition. Focus rings are a 2px accent at 2px offset, never thicker.

Inputs and the hero search bar share a vocabulary: white surface, hairline card border, 8-16px radius depending on prominence, a 1px accent ring at twenty percent alpha on focus. The hero search bar adds a soft floating shadow (`0 20px 50px rgba(0,0,0,0.04)`) and reads as a single tactile slab. The hero placeholder typewriter cycles three example queries on a slow loop — type at 80ms per character, hold for two seconds, delete at 40ms. It's the only autonomous animation on the page.

Cards default to white surface, hairline `#EBEBEB` border, and a `0 1px 2px rgba(0,0,0,0.04)` shadow. Highlighted cards swap the border to teal and add a 1px teal-at-20-percent ring. Hover states either drop the border down a tone or lift the card by 1px with a top-edge accent gradient sweep — never both. Status communicates through 1.5px round dots, always paired with mono uppercase labels at 9-11px. Confidence pills, section tags, recommended-node ribbons, and metric markers all reuse this dot-and-mono pattern so the UI feels written in one language.

The blueprint texture motifs (dot matrix, ascii boxes, plus fields, section connectors) are passive. They live at two to ten percent opacity, never overlap text, and never react to interaction. They give the page atmosphere without competing with content. The same applies to the optional schematic shell: its top coordinate bar and left line-number rail are decorative chrome, not navigation.

## Motion philosophy

Default to 150ms ease-in-out. Reserve 600ms decelerate (`cubic-bezier(0.16, 1, 0.3, 1)`) for the on-scroll reveal, which fades and rises elements 10px with a 100-150ms stagger between siblings. Reveal-on-scroll is the only animation that runs without user input on most pages. Press states use a 0.98 scale; hover lifts use a 1px translate. Status dots breathe on a 2s pulse — never blink, never flash. Color hue does not animate; only opacity, lightness, and borders shift. The whole vocabulary is calm, deliberate, and lets the content do the talking. The product has to feel like it's thinking, not performing.

## Voice within the surface

Writing inside the UI follows the same warmth-meets-engineering rule. No em dashes anywhere — the design system enforces it because the product writes emails for users and the house style has to match. Headlines are editorial and human ("From company name to inbox in 60 seconds"). Eyebrows and chrome go technical (`CORE_SYSTEM_CAPABILITIES`, `INTEGRATION_MATRIX`). The tension between those two registers is the whole point: a serious tool that still sounds like a person on a good day.
