# Digital Sales Room — LWC OSS Drag & Drop Learning Project

A minimal, heavily-commented LWC OSS project focused purely on understanding
the HTML5 Drag and Drop API inside the LWC component model.

---

## Getting Started

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
src/modules/dsr/
├── salesRoom/      ← State owner. All data lives here.
│   ├── salesRoom.js
│   ├── salesRoom.html
│   └── salesRoom.css
├── linkGroup/      ← Drop zone. Tracks dragover position.
│   ├── linkGroup.js
│   ├── linkGroup.html
│   └── linkGroup.css
└── linkItem/       ← Draggable leaf. Encodes its ID on drag start.
    ├── linkItem.js
    ├── linkItem.html
    └── linkItem.css
```

---

## The Core Mental Model

### One-way data flow

```
salesRoom (owns ALL state)
    │  passes props down via @api
    ▼
linkGroup (receives group + links, acts as drop zone)
    │  passes props down via @api
    ▼
linkItem (receives single link, is draggable)
```

Children NEVER mutate props. They fire CustomEvents upward.
The parent receives events, mutates its own state, and re-renders.

### The drag and drop sequence

```
1. User grabs a linkItem
   └─ ondragstart fires in linkItem.js
      └─ dataTransfer.setData('text/plain', JSON.stringify({ linkId }))

2. User drags over a linkGroup
   └─ ondragover fires in linkGroup.js  ← MUST call event.preventDefault()
      └─ calculates dragOverIndex by measuring DOM element midpoints
      └─ linksWithPlaceholder getter splices in a visual placeholder

3. User releases
   └─ ondrop fires in linkGroup.js
      └─ parses the linkId from dataTransfer
      └─ fires 'linkmoved' CustomEvent with { linkId, targetGroupId, targetOrder }

4. salesRoom handles 'linkmoved'
   └─ removes link from flat array
   └─ re-inserts at { targetGroupId, targetOrder }
   └─ normalizes order integers
   └─ spreads into new array → LWC re-renders
```

---

## Key LWC OSS Differences from Platform LWC

| Platform LWC               | LWC OSS (this project)           |
|----------------------------|----------------------------------|
| `<lightning-button>`       | `<button class="slds-button">` |
| Apex `@wire` for data      | Hardcoded fake data in JS        |
| SLDS auto-injected         | Linked in index.html manually    |
| `@salesforce/*` imports    | Plain ES modules only            |
| Base components everywhere | Plain HTML + SLDS classes        |

---

## Things to Experiment With

1. **Add a 4th group type** — try a `grid` type that uses `slds-grid` in linkItem
2. **Group reordering** — the group cards themselves aren't draggable yet
3. **Persist to localStorage** — save/load `groups` and `links` on change
4. **Add a real "Add Link" form** — replace the fake link button with a modal
5. **Keyboard reordering** — add ArrowUp/ArrowDown handlers for accessibility

---

## Common Gotchas

- **`event.preventDefault()` in ondragover is required** — without it, ondrop never fires
- **`composed: true` on CustomEvents** — needed to cross shadow DOM boundaries
- **Don't mutate `@api` props** — always fire an event upward; let the parent mutate
- **Spread arrays on change** — `this.links = [...this.links]` triggers reactivity; mutating in place does not
- **No method calls in templates** — `{myMethod(arg)}` won't compile; pre-compute in getters
