# Terrador Control Center

A local-only D&D DM control app built with Next.js, React, TypeScript, and
Tailwind CSS.

Use `/dm` as the private DM control panel, then open the visual-only display
pages in separate browser windows for TVs or extra monitors:

- `/display/player-art`
- `/display/battle-map`
- `/display/secondary`

The pages communicate locally with `BroadcastChannel` and save scene, hotkey,
display, and floating layer data in `localStorage`.

## 1. Run the app locally

```bash
npm install
npm run dev
```

Open the DM panel at:

```text
http://localhost:3000/dm
```

## 2. Where to put images

Scene images go in:

```text
public/scenes/
```

Floating overlay images go in:

```text
public/overlays/
```

For example, this file:

```text
public/scenes/bio-bloom-village.jpg
```

is used in the app as:

```text
/scenes/bio-bloom-village.jpg
```

If an image is missing, the display shows a styled placeholder with the scene or
layer name.

## 3. Add a new scene

1. Open `/dm`.
2. Choose the target display card you want.
3. Click **Add New Scene**.
4. Edit the scene name, image path, target screen, hotkey, and description.
5. Click **Activate** when you want that scene to appear.

## 4. Assign a hotkey

1. Open the **Scene Editor** on `/dm`.
2. Click **Edit** on a scene.
3. Type a key in the **Hotkey** field.
4. Click **Done**.

Hotkeys only trigger when you are not typing inside an input field.

Default hotkeys:

- `1` Bio-Bloom Village
- `2` Aetheria
- `3` Glad Stone
- `4` Deadwood Wells
- `5` Nordic Jazz Club
- `6` Mountain Pass
- `7` Boss Encounter
- `B` fade the selected target display to black
- `N` next scene on the selected target display
- `P` previous scene on the selected target display
- `F` show fullscreen setup help

## 5. Open each display on a TV or monitor

1. Open `/dm` on your laptop.
2. Click **Open Player Art Screen**, **Open Battle Map Screen**, or
   **Open Secondary Screen**.
3. Drag each new browser window to the correct TV or monitor.
4. Make that browser window fullscreen using your browser or operating system.
5. Return to `/dm` to control all screens.

## 6. Use floating layers

Floating layers appear above a display's main scene image.

1. In `/dm`, choose a target display card.
2. Click **Add Layer** in the Floating Layer Editor.
3. Set the layer name and image path, such as `/overlays/mist.png`.
4. Pick the target display, size, and position.
5. Use **Show** or **Hide** to toggle the layer live.
6. Use **Delete** to remove the layer.

Useful layer ideas:

- NPC portrait over a town image
- Weather overlay over a battle map
- Title card over a location image
- Monster portrait over a combat background

## 7. Reset saved localStorage data

From the DM panel, click **Reset Saved Data**.

You can also reset manually in browser DevTools:

```js
localStorage.removeItem("terrador-control-center-state-v1");
location.reload();
```

No login, database, backend, or online sync is required for this prototype.
