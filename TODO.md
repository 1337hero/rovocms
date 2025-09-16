# RovoCMS Roadmap

## Alpha Release (Current)
✅ Core CMS functionality
✅ `$placeholder$` syntax
✅ Auto-initialization of content
✅ Front-facing inline editing
✅ Draft/publish workflow
✅ Keyboard trigger ("rovocms")
✅ SSR with hydration
✅ SQLite storage

## Beta Features (Next)

### 🔗 Link Management
- [ ] Editable href attributes for `<a>` tags
- [ ] Support `$link_url$` placeholders in href attributes
- [ ] Link picker/editor in CMS interface
- [ ] Internal vs external link handling

### 🖼️ Image Management
- [ ] Editable image src attributes
- [ ] Support `$image_url$` placeholders in src attributes
- [ ] Image upload capability
- [ ] Alt text editing support
- [ ] Basic image gallery/picker

## v1.0 Features

### 🎨 Rich Media
- [ ] Slideshow component with `$slideshow_*$` placeholders
- [ ] Gallery component with drag-and-drop reordering
- [ ] Video embed support (YouTube, Vimeo)
- [ ] Lazy loading for images

### ✏️ Enhanced Editor
- [ ] Rich text editing (bold, italic, links)
- [ ] Markdown support option
- [ ] Undo/redo functionality
- [ ] Find and replace across page

### 🌍 Internationalization
- [ ] Multi-language content management
- [ ] Language switcher component
- [ ] RTL support
- [ ] Locale-specific formatting

## v1.5 Features

### 🔐 Authentication & Security
- [ ] Email-based login system (like original NovaCMS)
- [ ] JWT tokens with refresh mechanism
- [ ] Session management with secure cookies
- [ ] Password reset flow
- [ ] Optional 2FA support
- [ ] Rate limiting for login attempts
- [ ] Environment-based secrets (vs hardcoded "demo")

## v2.0 Features (Future)

### 👥 Multi-User & Permissions
- [ ] Multiple user accounts
- [ ] Role-based permissions (admin, editor, viewer)
- [ ] Content revision history with author tracking
- [ ] Audit logging
- [ ] Multi-site support (like original NovaCMS)

### 🚀 Performance
- [ ] Redis caching layer
- [ ] CDN integration
- [ ] Image optimization pipeline
- [ ] Content versioning

### 📊 Analytics & SEO
- [ ] Built-in analytics
- [ ] SEO metadata management
- [ ] Sitemap generation
- [ ] Open Graph tags

### 🔧 Developer Experience
- [ ] Component library
- [ ] Custom placeholder types
- [ ] Webhook support
- [ ] REST API expansion
- [ ] GraphQL API

## Known Issues / Improvements

### High Priority
- [ ] Better error handling for malformed placeholders
- [ ] Keyboard shortcut customization
- [ ] Mobile editing experience

### Medium Priority
- [ ] Content search functionality
- [ ] Bulk publish/revert
- [ ] Export/import content

### Low Priority
- [ ] Theme system
- [ ] Plugin architecture
- [ ] A/B testing support

## Technical Debt
- [ ] Add comprehensive test suite
- [ ] TypeScript types for server.ts
- [ ] API documentation
- [ ] Performance benchmarks
- [ ] Security audit

---

## Contributing

Want to help? Pick an item from the roadmap and:
1. Create a feature branch
2. Implement the feature
3. Add tests if applicable
4. Submit a pull request

## Notes

This roadmap is a living document. Priorities may shift based on user feedback and real-world usage patterns. The goal is to keep RovoCMS true to its philosophy: "Move fast. Edit safe."