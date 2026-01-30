Factory 84 - Update 002

Patch Notes

⚙️ Gameplay & Progression

Dirty Grid Slots

Newly purchased grid slots can now spawn in a “dirty” state and must be cleaned for Scrap before building. Dirt chance scales with free storage and stored Burnt Scrap, and dirty tiles contain recoverable Burnt Scrap moved to storage upon cleaning. Added persistent state, visual indicators, tooltips, logging, and integrated cleaning and generation logic across grid, rendering, and systems.

Balancing

Added passive baseline cooling to slow heat buildup without requiring early Fans.

🖥️ Interface & Accessibility

Refreshed the visual language with a unified color palette, typography, and surface system for improved readability and reduced clutter. Restyled core interface elements with cleaner layouts, consistent spacing, and simplified visuals. Updated grid and overlays for better legibility, lowered background video opacity, and added responsive breakpoints to ensure smooth usability on smaller and mobile screens.

Reworked the top header with a burger menu to reduce clutter while keeping storage always visible. Added an optional Auto-place mode that automatically places selected buildings on the first available clean tile. Updated layout, state handling, input flow, and rendering to support the new header structure and placement behavior, with improved accessibility and responsive interaction.

Removed per-building context menus and local automation in favor of a unified global automation system.

Introduced inline power and upgrade buttons directly on grid tiles for faster interaction, with updated rendering, cost indicators, and styling for clearer, more efficient gameplay.

Main menu is now the default entry point (index.html).
Game page renamed to play.html.
Intro and in-game navigation updated to target play.html.
README updated to reflect new page order.