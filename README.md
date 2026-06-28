# Cozy Bloom

A tiny browser garden game you can play with just your spacebar.

Built for the [Hack Club OneKey Challenge](https://hackclub.com) — one key, one game.

---

## What is it?

You grow flowers. That's basically it.

Press space to plant, double-tap to switch tools, hold to water everything at once.
There's a day-night cycle, weather, critters that show up when you have blooming flowers,
and a little journal that tracks what you've discovered.

I spent most of the time on the spacebar timing logic — getting tap vs double-tap vs hold
vs triple-tap to feel natural took longer than I expected. The SVG flowers took a while too.

## Controls

Everything is the spacebar.

| Action | What it does |
|--------|--------------|
| Tap | Use the active tool, move cursor to next plot |
| Double-tap | Cycle tool: Plant → Water → Harvest → Decorate |
| Hold | Water all plants at once (or cycle flower type in Plant mode) |
| Triple-tap | Open / close the garden journal |

There's an interactive tutorial on first launch that walks through each control step by step.

## Tools

- **Plant** — place a flower seed in the highlighted plot (costs coins)
- **Water** — keep flowers hydrated, they'll wilt without it
- **Harvest** — collect fully bloomed flowers for coins
- **Decorate** — place benches, ponds, and lanterns around the garden

## Running locally

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`.

## Stack

React, TanStack Start, Framer Motion, Tailwind CSS, Web Audio API.
No database. Game state lives in `localStorage`.

## What I'd add with more time

- More flower species (cut it down to 5 for the time limit)
- Seasons that change the visual theme
- Sound effects beyond the basic oscillator chimes
- Mobile / touch support

---

Made in ~5 hours · Hack Club OneKey Challenge · June 2026
