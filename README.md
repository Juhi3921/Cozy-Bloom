# Cozy Bloom

A tiny garden game you can play with just your spacebar.
---

## What is it?

You grow flowers. That's basically it.

Press space to plant, double-tap to switch tools, hold to water everything at once.
A little cozy loop that keeps going while you're watching the day-night cycle tick by.

I spent most of the time getting the SVG flowers to sway correctly and figuring 
out how rain should auto-water the plants. The spacebar timing logic (tap vs 
double-tap vs hold vs triple-tap) was tricky to get feeling natural.

## Controls

Everything is the spacebar.

Action -> What it does 
----------------------
Tap -> Use current tool, move forward
Double-tap -> Switch tool (plant → water → harvest → decorate) 
Hold -> Water all plants at once / cycle flower type 
Triple-tap -> Open the journal 

## Tools

- 🌱 **Plant** — Choose a flower and plant it in the highlighted plot
- 💧 **Water** — Keep your flowers hydrated or they'll wilt
- ✂️ **Harvest** — Bloomed flowers earn coins
- 🏮 **Decorate** — Place benches, ponds, lanterns

## Running it locally
```
npm install
npm run dev
