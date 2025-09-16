(function() {
  // Configuration - Everything configurable in one place
  const CONFIG = {
    LANG: document.documentElement.lang || 'en',
    PAGE: location.pathname.replace(/\/+/g, '/').replace(/\.html$/, '').replace(/\/index$/, '/') || '/',
    API_BASE: '/api/cms',
    TOKEN_KEY: 'cmsdemo:token',
    TOKEN_VAL: 'demo',
    TRIGGER_WORD: 'rovocms',
    TIMEOUTS: {
      SEQUENCE_RESET: 2000,
      TOAST_HIDE: 2000,
      RELOAD_DELAY: 500
    }
  };

  const SELECTORS = {
    editable: '[data-cms-key]',
    toolbar: '.cms-toolbar',
    toast: '.cms-toast',
    floater: '.cms-floater'
  };

  const PLACEHOLDER_RE = /^\s*\$([a-zA-Z0-9_-]+)\$\s*$/;

  // State - Centralized and clear
  const state = {
    keySequence: '',
    lastKeyTime: 0,
    isEditorActive: false,
    draftContent: {},
    publishedContent: {}
  };

  const isAdmin = () => sessionStorage.getItem(CONFIG.TOKEN_KEY) === CONFIG.TOKEN_VAL;

  // API Layer - Consistent error handling
  const api = {
    async fetchContent(contentState = 'published') {
      const url = `${CONFIG.API_BASE}/content?page=${encodeURIComponent(CONFIG.PAGE)}&lang=${CONFIG.LANG}&state=${contentState}`;

      try {
        const response = await fetch(url);
        return response.ok ? await response.json() : {};
      } catch {
        return {};
      }
    },

    async saveContent(key, value, contentState = 'draft') {
      if (!isAdmin()) return { success: false, error: 'Not authorized' };

      const payload = { page: CONFIG.PAGE, lang: CONFIG.LANG, key, value, state: contentState };

      try {
        const response = await fetch(`${CONFIG.API_BASE}/content`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem(CONFIG.TOKEN_KEY)}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true, data: await response.json() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async publishAll() {
      if (!isAdmin()) return { success: false, error: 'Not authorized' };

      try {
        const response = await fetch(`${CONFIG.API_BASE}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem(CONFIG.TOKEN_KEY)}`
          },
          body: JSON.stringify({ page: CONFIG.PAGE, lang: CONFIG.LANG })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true, data: await response.json() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  // DOM Utilities - Simple and reusable
  const dom = {
    query: (selector) => document.querySelector(selector),
    queryAll: (selector) => document.querySelectorAll(selector),

    createElement(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.firstElementChild;
    },

    showToast(message) {
      let toast = this.query(SELECTORS.toast);
      if (!toast) {
        toast = this.createElement(`<div class="cms-toast"></div>`);
        document.body.appendChild(toast);
      }

      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => toast.classList.remove('show'), CONFIG.TIMEOUTS.TOAST_HIDE);
    }
  };

  // Content Management - Clean and focused
  const content = {
    mergeStates(draft, published) {
      return { ...published, ...draft };
    },

    applyToElements(contentMap) {
      dom.queryAll(SELECTORS.editable).forEach(element => {
        const key = element.getAttribute('data-cms-key');
        if (contentMap[key] !== undefined) {
          element.textContent = contentMap[key];
        }
      });
    },

    upgradePlaceholders() {
      const candidates = dom.queryAll('*:not([data-cms-key])');
      candidates.forEach(element => {
        if (element.children.length || ['SCRIPT', 'STYLE', 'TEMPLATE'].includes(element.tagName)) return;

        const match = element.textContent?.match(PLACEHOLDER_RE);
        if (match) element.setAttribute('data-cms-key', match[1]);
      });
    }
  };

  // Keyboard Handler - Clean separation of concerns
  const keyboard = {
    isInputField(target) {
      return ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
    },

    updateSequence(key) {
      const now = Date.now();
      const timeSinceLastKey = now - state.lastKeyTime;

      if (timeSinceLastKey > CONFIG.TIMEOUTS.SEQUENCE_RESET) {
        state.keySequence = '';
      }

      state.keySequence = (state.keySequence + key.toLowerCase()).slice(-CONFIG.TRIGGER_WORD.length);
      state.lastKeyTime = now;

      return state.keySequence === CONFIG.TRIGGER_WORD;
    },

    handleKeyDown(event) {
      if (this.isInputField(event.target)) return;

      if (this.updateSequence(event.key)) {
        event.preventDefault();
        state.keySequence = '';
        editor.toggle();
      }
    },

    handleShortcut(event) {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (ctrlOrCmd && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        editor.toggle();
      }
    }
  };

  // Editor - Single responsibility
  const editor = {
    toolbar: {
      buttons: [
        { class: 'cms-view-draft', text: 'Draft', title: 'View draft content',
          action: () => { content.applyToElements(state.draftContent); dom.showToast('Viewing draft content'); }},
        { class: 'cms-view-published', text: 'Published', title: 'View published content',
          action: () => { content.applyToElements(state.publishedContent); dom.showToast('Viewing published content'); }},
        { class: 'cms-publish', text: 'Publish All', title: 'Publish all draft changes',
          action: () => editor.handlePublish() },
        { class: 'cms-logout', text: 'Logout', title: 'Logout',
          action: () => editor.deactivate() }
      ],

      create() {
        const toolbar = dom.createElement(`
          <div class="cms-toolbar">
            <span class="cms-badge">CMS Active</span>
            ${this.buttons.map(btn =>
              `<button class="${btn.class}" title="${btn.title}">${btn.text}</button>`
            ).join('')}
          </div>
        `);

        // Event delegation
        toolbar.addEventListener('click', (event) => {
          const button = this.buttons.find(btn => event.target.classList.contains(btn.class));
          if (button) button.action();
        });

        document.body.appendChild(toolbar);
        return toolbar;
      }
    },

    async activate() {
      if (!this.authenticate()) return;

      try {
        const [draft, published] = await Promise.all([
          api.fetchContent('draft'),
          api.fetchContent('published')
        ]);

        state.draftContent = draft;
        state.publishedContent = published;

        content.applyToElements(content.mergeStates(draft, published));

        document.body.classList.add('cms-active');
        this.toolbar.create();
        this.attachOutlines(true);
        document.addEventListener('click', this.handleClick, true);
        state.isEditorActive = true;

        dom.showToast('CMS activated - Click any outlined element to edit');
      } catch (error) {
        dom.showToast('Failed to load content');
      }
    },

    deactivate() {
      document.body.classList.remove('cms-active');
      dom.query(SELECTORS.toolbar)?.remove();
      this.attachOutlines(false);
      document.removeEventListener('click', this.handleClick, true);
      this.cleanupEditing();
      sessionStorage.removeItem(CONFIG.TOKEN_KEY);
      state.isEditorActive = false;
      dom.showToast('CMS deactivated');
      setTimeout(() => location.reload(), CONFIG.TIMEOUTS.RELOAD_DELAY);
    },

    toggle() {
      state.isEditorActive ? this.deactivate() : this.activate();
    },

    authenticate() {
      if (isAdmin()) return true;

      const password = prompt('Enter password:');
      if (password === 'demo') {
        sessionStorage.setItem(CONFIG.TOKEN_KEY, 'demo');
        return true;
      }

      alert('Access denied');
      return false;
    },

    attachOutlines(enabled) {
      dom.queryAll(SELECTORS.editable).forEach(element => {
        element.classList.toggle('cms-outline', enabled);
      });
    },

    cleanupEditing() {
      dom.queryAll(SELECTORS.editable).forEach(element => {
        element.classList.remove('cms-editing');
        element.removeAttribute('contenteditable');
      });
      dom.query(SELECTORS.floater)?.remove();
    },

    handleClick(event) {
      const element = event.target.closest(SELECTORS.editable);
      if (!element) return;

      event.preventDefault();
      event.stopPropagation();
      editor.beginEditing(element);
    },

    beginEditing(element) {
      if (!isAdmin()) return;

      this.cleanupEditing();
      element.classList.add('cms-editing');
      element.setAttribute('contenteditable', 'true');
      element.focus();
      this.showEditingControls(element);
    },

    showEditingControls(element) {
      const rect = element.getBoundingClientRect();
      const floater = dom.createElement(`
        <div class="cms-floater">
          <span>Editing</span>
          <button class="cms-save">Save Draft</button>
          <button class="cms-cancel">Cancel</button>
        </div>
      `);

      floater.style.left = (rect.left + rect.width/2 + window.scrollX) + 'px';
      floater.style.top = (rect.top + window.scrollY - 10) + 'px';

      floater.addEventListener('click', async (event) => {
        if (event.target.classList.contains('cms-save')) {
          await this.finishEditing(element, true);
        } else if (event.target.classList.contains('cms-cancel')) {
          await this.finishEditing(element, false);
        }
      });

      document.body.appendChild(floater);
    },

    async finishEditing(element, save) {
      const key = element.getAttribute('data-cms-key');

      if (save) {
        const value = element.textContent;
        const result = await api.saveContent(key, value, 'draft');

        if (result.success) {
          state.draftContent[key] = value;
          dom.showToast('Saved to draft');
        } else {
          dom.showToast(`Failed to save: ${result.error}`);
        }
      } else {
        // Revert to existing content
        const currentValue = state.draftContent[key] ?? state.publishedContent[key];
        if (currentValue !== undefined) element.textContent = currentValue;
      }

      element.classList.remove('cms-editing');
      element.removeAttribute('contenteditable');
      dom.query(SELECTORS.floater)?.remove();
    },

    async handlePublish() {
      const result = await api.publishAll();

      if (result.success) {
        state.publishedContent = await api.fetchContent('published');
        content.applyToElements(state.publishedContent);
        dom.showToast(`Published ${result.data.published || 0} changes`);
      } else {
        dom.showToast('Failed to publish');
      }
    }
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    content.upgradePlaceholders();
    document.addEventListener('keydown', keyboard.handleKeyDown.bind(keyboard));
    document.addEventListener('keydown', keyboard.handleShortcut.bind(keyboard));
  });
})();