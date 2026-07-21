# [<img src="https://l-malakar.github.io/LLOF/asset/logo.svg" width="35" valign="middle"/>](https://l-malakar.github.io/LLOF) LLOF - Terminal Loop

- A web 3D game made with `HTML`, `CSS`, and `JS`.

### <a href="https://l-malakar.github.io/LLOF/"><img src="https://l-malakar.github.io/LLOF/asset/logo.svg" width="120" height="120" valign="middle"></a> [▶ Play Now](https://l-malakar.github.io/LLOF/)

[![LLOF - Terminal Loop Banner](https://l-malakar.github.io/LLOF/asset/Banner.svg)](https://l-malakar.github.io/LLOF/)

## [▶ Play Now](https://l-malakar.github.io/LLOF/)

**Last Update:** `14-07-2026` (V-`2.26.8`)

### Latest Updates
1. Add different camera angles and their logic.
2. Add dynamic smooth camera movement along with the player movement.
3. Some small UI improvements.

---
## Project structure
```
LLOF/
├── index.html                  # Game's main HTML page — loads canvas, UI markup, and all scripts
├── Logo.mp4                    # Logo intro/animation video asset
├── CSS/
│   ├── style.css               # Main sci-fi theme stylesheet for the whole game UI
│   ├── banner.css              # Styling for the event banner overlay
│   └── world.css               # Per-map-skin visual overrides (backgrounds, skin effects)
├── asset/
│   ├── logo.svg                # Studio square icon/monogram logo
│   ├── Banner.svg               # Studio full wordmark logo
│   └── music.webm              # Background music track
└── JS/
    ├── main.js                 # Entry point — imports and starts every feature module in order
    ├── favicon.js               # Generates favicon/PWA icons from logo.svg at runtime
    ├── core/
    │   ├── state.js             # Holds shared game state (score, coins, planes, maps) and saves progress
    │   ├── dom-refs.js          # Caches references to DOM elements used across the game
    │   ├── game-objects.js      # Manages player/world/collectable object lifecycle
    │   └── scene-setup.js       # Sets up the Three.js scene, camera, renderer, and lighting
    ├── systems/
    │   ├── controller.js        # Handles desktop keyboard input and remappable keybinds
    │   ├── Mcontroller.js       # Handles mobile input (joystick/dpad/gyroscope)
    │   ├── camera.js            # Controls the multi-angle camera rig
    │   ├── player.js            # Manages the player plane's geometry, hitbox, and crash animation
    │   ├── world.js             # Generates terrain chunks, obstacles, and difficulty progression
    │   ├── collectable.js       # Manages coin and power-up spawning/recycling
    │   ├── banner.js            # Runs the configurable event banner system
    │   └── music-handler.js     # Plays background music and synthesized sound effects
    ├── gameplay/
    │   ├── game-loop.js         # Runs the main per-frame animate/update loop
    │   ├── play-flow.js         # Handles play/go-home/retry/leave-confirm flow
    │   ├── collisions.js        # Detects collisions with obstacles, coins, and power-ups
    │   └── powerups.js          # Manages power-up HUD display, effects, and expiry
    ├── ui/
    │   ├── hud.js                # Syncs and updates the in-game HUD display
    │   ├── toast.js              # Shows floating pickup notification toasts
    │   ├── countdown.js          # Displays the pre-round countdown overlay
    │   ├── pause.js              # Toggles the game's pause state
    │   ├── plane-selector.js     # Runs the menu's plane selection carousel
    │   ├── map-selector.js       # Runs the map skin selection UI
    │   ├── keybinds.js           # Displays and handles rebinding of keyboard controls
    │   ├── settings-panel.js     # Runs the settings modal
    │   └── confirm-modal.js      # Generic reusable yes/no confirmation modal
    └── utils/
        ├── utils.js              # Small shared helper functions (e.g. fullscreen handling)
        └── dev-cheat.js          # Developer cheat tools — flagged for removal before release
```


### Dev
[<img src="https://yt3.googleusercontent.com/Khmav_bBMzqoVJE8ubBONlKjNkwFLI07w7RfosBBB4jD9R6eQjJoZO-nnRAwfPbnNFRc_Zjx=s160-c-k-c0x00ffffff-no-rj" width="24" valign="middle" alt="L. Malakar Profile" />](https://www.youtube.com/@gdmalakar) &nbsp; [L. Malakar](https://www.youtube.com/@gdmalakar)
