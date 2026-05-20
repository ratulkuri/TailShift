# TailShift

> Convert Tailwind CSS classes between **v3** and **v4** — instantly, in either direction.

TailShift is a small, accessible, SEO-tuned web tool for migrating Tailwind className strings. Paste your classes, pick a direction, copy the result. Handles renames, opacity-modifier collapsing, the new `class!` important position, and `(--var)` arbitrary-value syntax.

Built by [Kowshik Kuri](https://kowshikkuri.com).

## What it converts

| v3 | v4 |
|---|---|
| `shadow` | `shadow-sm` |
| `shadow-sm` | `shadow-xs` |
| `rounded`, `rounded-sm` | `rounded-sm`, `rounded-xs` |
| `blur`, `blur-sm`, `backdrop-blur`, `drop-shadow` | (scale-shifted equivalents) |
| `outline-none` | `outline-hidden` |
| `ring` | `ring-3` |
| `flex-grow-*`, `flex-shrink-*` | `grow-*`, `shrink-*` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice`, `decoration-clone` | `box-decoration-slice`, `box-decoration-clone` |
| `bg-red-500 bg-opacity-50` | `bg-red-500/50` |
| `!flex` | `flex!` |
| `bg-[--brand]` | `bg-(--brand)` |

All of the above run in reverse for v4 → v3.

## Stack

Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript (strict).

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run typecheck
npm run build
npm run start
```

## License

MIT — but please keep the credit to [Kowshik Kuri](https://kowshikkuri.com) intact.
