import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import Database from 'bun:sqlite'
import { readFile, exists } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Initialize database
const db = new Database('cms.db')
db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'en',
    key TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('draft', 'published')),
    value TEXT,
    updated_at INTEGER DEFAULT (unixepoch()),
    updated_by TEXT,
    UNIQUE(page, lang, key, state)
  );
  CREATE INDEX IF NOT EXISTS idx_content_lookup
    ON content(page, lang, state);
`)

const app = new Hono()

// Enable CORS for API
app.use('/api/*', cors())

// API Routes
app.get('/api/cms/content', (c) => {
  const page = c.req.query('page') || '/'
  const lang = c.req.query('lang') || 'en'
  const state = c.req.query('state') || 'published'

  const stmt = db.prepare(`
    SELECT key, value
    FROM content
    WHERE page = ? AND lang = ? AND state = ?
  `)

  const rows = stmt.all(page, lang, state) as Array<{key: string, value: string}>
  const content: Record<string, string> = {}

  for (const row of rows) {
    content[row.key] = row.value
  }

  return c.json(content)
})

app.put('/api/cms/content', async (c) => {
  const body = await c.req.json()
  const { page = '/', lang = 'en', key, value, state = 'draft' } = body

  if (!key) {
    return c.json({ error: 'key is required' }, 400)
  }

  // Simple auth check - in production, verify JWT
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== 'Bearer demo') {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const stmt = db.prepare(`
    INSERT INTO content (page, lang, key, state, value, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, unixepoch(), ?)
    ON CONFLICT(page, lang, key, state)
    DO UPDATE SET value = ?, updated_at = unixepoch(), updated_by = ?
  `)

  stmt.run(page, lang, key, state, value, 'demo-user', value, 'demo-user')

  return c.json({ success: true, key, state })
})

app.post('/api/cms/publish', async (c) => {
  const body = await c.req.json()
  const { page = '/', lang = 'en', keys = [] } = body

  // Simple auth check
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== 'Bearer demo') {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const stmt = db.prepare(`
    INSERT INTO content (page, lang, key, state, value, updated_at, updated_by)
    SELECT page, lang, key, 'published', value, unixepoch(), 'demo-user'
    FROM content
    WHERE page = ? AND lang = ? AND state = 'draft'
    ${keys.length > 0 ? `AND key IN (${keys.map(() => '?').join(',')})` : ''}
    ON CONFLICT(page, lang, key, state)
    DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by
  `)

  const params = [page, lang, ...keys]
  const result = stmt.run(...params)

  return c.json({
    success: true,
    published: result.changes
  })
})

// Template hydration with auto-initialization
async function hydrateTemplate(filePath: string, page: string, lang: string = 'en'): Promise<string> {
  try {
    let html = await readFile(filePath, 'utf-8')

    // Find all $placeholder$ patterns in the HTML
    const placeholderRegex = /\$([a-zA-Z0-9_-]+)\$/g
    const foundKeys = new Set<string>()
    let match

    while ((match = placeholderRegex.exec(html)) !== null) {
      foundKeys.add(match[1])
    }

    // Get existing content from DB
    const stmt = db.prepare(`
      SELECT key, value
      FROM content
      WHERE page = ? AND lang = ? AND state = 'published'
    `)
    const rows = stmt.all(page, lang) as Array<{key: string, value: string}>

    // Create a map of existing content
    const contentMap = new Map<string, string>()
    for (const row of rows) {
      contentMap.set(row.key, row.value)
    }

    // Auto-initialize any missing content
    const missingKeys = Array.from(foundKeys).filter(key => !contentMap.has(key))
    if (missingKeys.length > 0) {
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO content (page, lang, key, state, value, updated_by)
        VALUES (?, ?, ?, 'published', ?, 'system')
      `)

      for (const key of missingKeys) {
        // Generate default content based on key name
        const defaultValue = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        insertStmt.run(page, lang, key, defaultValue)
        contentMap.set(key, defaultValue)
      }

      console.log(`📝 Auto-initialized ${missingKeys.length} new content keys for ${page}`)
    }

    // Replace placeholders with content and add data-cms-key attributes
    html = html.replace(
      /(<[^>]+>)\$([a-zA-Z0-9_-]+)\$(<\/[^>]+>)/g,
      (match, openTag, key, closeTag) => {
        const value = contentMap.get(key) || `$${key}$`
        // Add data-cms-key attribute to the opening tag
        const tagWithAttr = openTag.replace(
          /(<\w+)([^>]*)(>)$/,
          `$1$2 data-cms-key="${key}"$3`
        )
        return `${tagWithAttr}${value}${closeTag}`
      }
    )

    // Also handle standalone $placeholder$ (not in tags)
    html = html.replace(
      /\$([a-zA-Z0-9_-]+)\$/g,
      (match, key) => {
        // Check if this is already inside a tag with data-cms-key
        if (html.includes(`data-cms-key="${key}"`)) {
          return match // Keep as is, will be handled by the tag replacement
        }
        return contentMap.get(key) || match
      }
    )

    // Inject CMS editor script on all pages
    const scriptTag = '<script src="/assets/js/cms-editor.js"></script>'
    if (!html.includes(scriptTag)) {
      html = html.replace('</body>', `    ${scriptTag}\n  </body>`)
    }

    return html
  } catch (err) {
    console.error('Error hydrating template:', err)
    throw err
  }
}

// Serve static assets from /assets directory
app.use('/assets/*', serveStatic({ root: './' }))

// Serve HTML pages from /pages directory with hydration
app.get('/*', async (c) => {
  const requestPath = c.req.path === '/' ? '/index' : c.req.path
  const htmlPath = requestPath.endsWith('.html') ? requestPath : `${requestPath}.html`
  const filePath = join(__dirname, 'pages', htmlPath)

  // Try to serve the HTML file
  if (await exists(filePath)) {
    // Determine page identifier for content lookup
    const page = requestPath.replace(/\.html$/, '').replace(/\/index$/, '/') || '/'
    const html = await hydrateTemplate(filePath, page)
    return c.html(html)
  }

  // Try without .html extension (for clean URLs)
  const filePathNoExt = join(__dirname, 'pages', `${requestPath}.html`)
  if (await exists(filePathNoExt)) {
    const page = requestPath || '/'
    const html = await hydrateTemplate(filePathNoExt, page)
    return c.html(html)
  }

  // Try index.html in subdirectories
  const indexPath = join(__dirname, 'pages', requestPath, 'index.html')
  if (await exists(indexPath)) {
    const page = requestPath || '/'
    const html = await hydrateTemplate(indexPath, page)
    return c.html(html)
  }

  return c.text('404 - Page Not Found', 404)
})

const port = process.env.PORT || 3000
console.log(`
🚀 Server running on http://localhost:${port}

📁 Project Structure:
   pages/     - HTML pages (just use $placeholder$ syntax!)
   assets/    - CSS, JS, images

✨ Developer workflow:
   1. Write HTML with $placeholder$ markers
   2. Server auto-adds data-cms-key attributes
   3. Content auto-initializes on first load

📝 Type "rovocms" on any page to activate the editor
🔑 Demo password: demo
`)

export default {
  port,
  fetch: app.fetch,
}