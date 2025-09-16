# RovoCMS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with Bun](https://img.shields.io/badge/Built%20with-Bun-black?logo=bun&logoColor=white)](https://bun.sh)
[![Database: SQLite](https://img.shields.io/badge/Database-SQLite-blue?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Open Source Love](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)](https://github.com/rovocms/rovocms)

### **Move fast. Edit safe.**


The CMS that doesn't get in your way. Built for agencies. Safe for clients.

## Why RovoCMS?

- **All content, zero bloat** - Just HTML with `$placeholders$`
- **Lightweight CMS, heavyweight results** - Under 400 lines of elegant code
- **Fast, minimal, unbreakable** - No build steps, no complexity, no headaches

RovoCMS lets agencies explore creative designs while clients safely "rove" through editing. The name evokes rover/rove → exploration, freedom, movement. Perfect for a lightweight CMS that gives you creative freedom.

## Features

- **Zero Build Philosophy**: Write HTML, mark editable regions with `$placeholder$`, deploy
- **Front-Facing Editing**: Type "rovocms" on any page to edit inline
- **Auto-Everything**: Content auto-initializes, attributes auto-generate
- **Draft/Publish Workflow**: Save drafts, preview, then publish
- **Multi-Page Support**: Organize pages in a clean structure
- **SSR Hydration**: SEO-friendly server-side rendering
- **SQLite Storage**: Simple, portable database

## Quick Start

***Note***: I built this around Bun & Hono

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Visit http://localhost:3000
```

## How to Use

### 1. Create Pages

Just write HTML with `$placeholder$` markers for any text you want to be editable:

```html
<!DOCTYPE html>
<html>
<head>
  <title>$page_title$</title>
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
  <h1>$hero_title$</h1>
  <p>$intro_text$</p>
</body>
</html>
```

That's it! RovoCMS automatically:
- ✅ Adds `data-cms-key` attributes
- ✅ Creates database entries
- ✅ Makes content editable
- ✅ Generates sensible defaults

### 2. Edit Content

1. Visit any page in your browser
2. Type **"rovocms"** (not in any input field)
3. Enter password: **demo**
4. Click any outlined element to edit
5. Save to draft → Publish when ready

### 3. Deploy

RovoCMS works anywhere Bun/Node runs:

```bash
# Docker
docker build -t rovocms .
docker run -p 3000:3000 rovocms

# PM2
pm2 start server.ts --interpreter bun --name rovocms

# Any VPS
bun start
```

## Project Structure

```
rovocms/
├── pages/              # Your HTML pages
│   ├── index.html      # Just use $placeholders$
│   ├── about.html
│   └── contact.html
├── assets/             # Static assets
│   ├── css/           # Your styles
│   ├── js/            # RovoCMS editor (auto-loaded)
│   └── images/        # Your media
├── server.ts          # The entire backend (< 300 lines!)
└── cms.db            # SQLite database (auto-created)
```

## Developer Workflow

The workflow agencies love:

1. **Designer creates HTML** with `$placeholder$` markers
2. **RovoCMS auto-initializes** everything on first load
3. **Client edits content** safely through the browser
4. **No backend work needed** - it just works
5. **Client cannot wreck design** - they can edit content - but can't break the site

### Adding Pages

Drop an HTML file in `pages/`:

```html
<!-- pages/services.html -->
<h1>$services_title$</h1>
<p>$services_intro$</p>
```

Visit `/services` - boom, it's editable.

### Custom Styling

Your CSS, your rules:

```css
/* assets/css/custom.css */
.hero {
  /* RovoCMS doesn't touch your styles */
}
```

## API

Simple and predictable:

- `GET /api/cms/content?page=/&state=published` - Get content
- `PUT /api/cms/content` - Save content (auth required)
- `POST /api/cms/publish` - Publish drafts (auth required)

## Database Schema

One table, infinite possibilities:

```sql
content(
  page,       -- /about, /services
  lang,       -- en, es, fr
  key,        -- hero_title, intro_text
  state,      -- draft or published
  value,      -- The actual content
)
```

## Philosophy

RovoCMS believes in:

1. **Zero Configuration** - It should just work
2. **Progressive Enhancement** - Start simple, stay simple
3. **Developer Freedom** - Your HTML, your way
4. **Client Safety** - They can't break what they can't touch

## For Agencies

RovoCMS is built for the agency workflow:

- **Fast prototypes** - Ship in hours, not days
- **Safe for clients** - They edit content, not code
- **Easy handoff** - No documentation needed
- **Maintenance-free** - No updates, no breaking changes

## The RovoCMS Promise

> "Move fast. Edit safe."

We promise a CMS that:
- Never gets in your way
- Never breaks your design
- Never confuses your clients
- Always just works

---

**RovoCMS** - All content, zero bloat. Built with ❤️ by 1337Hero for agencies who value their time and their clients' success.

## License

RovoCMS is open-sourced under the [MIT License](LICENSE).