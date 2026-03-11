/**
 * <bizquss-widget> — Web Component vanilla JS
 *
 * Uso:
 *   <bizquss-widget
 *     api-url="https://comments.tudominio.com"
 *     site-key="abc123"
 *     thread-url="/blog/mi-post"
 *     theme="auto"
 *   />
 *
 * Compatible con cualquier framework o CMS.
 * Shadow DOM aísla estilos — no contamina el CSS del host.
 */
class BizqussWidget extends HTMLElement {
  static get observedAttributes() {
    return ['api-url', 'site-key', 'thread-url', 'theme']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._comments = []
    this._threadId = null
    this._locked = false
  }

  connectedCallback() {
    this._render()
    this._loadComments()
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._render()
      this._loadComments()
    }
  }

  get _apiUrl()    { return this.getAttribute('api-url') ?? '' }
  get _siteKey()   { return this.getAttribute('site-key') ?? '' }
  get _threadUrl() { return this.getAttribute('thread-url') ?? window.location.pathname }
  get _theme()     { return this.getAttribute('theme') ?? 'auto' }

  async _loadComments() {
    if (!this._apiUrl || !this._siteKey) return

    const params = new URLSearchParams({
      thread_url: this._threadUrl,
      title: document.title,
    })

    try {
      const res = await fetch(`${this._apiUrl}/v1/comments?${params}`, {
        headers: { 'X-Api-Key': this._siteKey },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      this._comments = data.comments ?? []
      this._threadId = data.thread_id
      this._locked = data.locked ?? false
      this._renderComments()
    } catch (err) {
      this._showError('No se pudieron cargar los comentarios.')
      console.error('[bizquss]', err)
    }
  }

  async _submitComment(e) {
    e.preventDefault()
    const form = e.target
    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true

    const body = {
      thread_url: this._threadUrl,
      title: document.title,
      author_name: form.author_name.value.trim(),
      author_email: form.author_email.value.trim() || undefined,
      content: form.content.value.trim(),
    }

    try {
      const res = await fetch(`${this._apiUrl}/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this._siteKey,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        this._showError(err.errors?.join(', ') ?? 'Error al enviar.')
        return
      }

      form.reset()
      this._showSuccess('Tu comentario está pendiente de revisión.')
    } catch {
      this._showError('Error de red. Inténtalo de nuevo.')
    } finally {
      btn.disabled = false
    }
  }

  _buildCommentTree(comments) {
    const map = new Map()
    const roots = []
    comments.forEach(c => map.set(c.id, { ...c, replies: [] }))
    map.forEach(c => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).replies.push(c)
      } else {
        roots.push(c)
      }
    })
    return roots
  }

  _renderCommentNode(c, depth = 0) {
    const replies = c.replies.map(r => this._renderCommentNode(r, depth + 1)).join('')
    const indent = depth > 0 ? 'style="margin-left:1.5rem;border-left:2px solid var(--rmq-border);padding-left:1rem"' : ''
    return `
      <article class="rmq-comment" ${indent} data-id="${c.id}">
        <header class="rmq-comment-header">
          <strong>${this._esc(c.author_name)}</strong>
          <time datetime="${c.created_at}">${new Date(c.created_at).toLocaleDateString()}</time>
        </header>
        <div class="rmq-comment-body">${c.content_html}</div>
        ${replies}
      </article>`
  }

  _renderComments() {
    const list = this.shadowRoot.querySelector('.rmq-comments-list')
    if (!list) return

    if (this._comments.length === 0) {
      list.innerHTML = '<p class="rmq-empty">Sé el primero en comentar.</p>'
      return
    }

    const tree = this._buildCommentTree(this._comments)
    list.innerHTML = tree.map(c => this._renderCommentNode(c)).join('')
  }

  _showError(msg) {
    const el = this.shadowRoot.querySelector('.rmq-feedback')
    if (el) { el.className = 'rmq-feedback rmq-error'; el.textContent = msg }
  }

  _showSuccess(msg) {
    const el = this.shadowRoot.querySelector('.rmq-feedback')
    if (el) { el.className = 'rmq-feedback rmq-success'; el.textContent = msg }
  }

  _esc(str) {
    return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --rmq-bg: #fff;
          --rmq-text: #1a1a1a;
          --rmq-border: #e0e0e0;
          --rmq-accent: #4f46e5;
          --rmq-radius: 8px;
          --rmq-font: system-ui, sans-serif;
          display: block;
          font-family: var(--rmq-font);
          color: var(--rmq-text);
        }
        @media (prefers-color-scheme: dark) {
          :host([theme="auto"]) {
            --rmq-bg: #1e1e1e;
            --rmq-text: #e0e0e0;
            --rmq-border: #333;
          }
        }
        :host([theme="dark"]) {
          --rmq-bg: #1e1e1e;
          --rmq-text: #e0e0e0;
          --rmq-border: #333;
        }
        .rmq-wrap { max-width: 720px; margin: 0 auto; padding: 1rem; }
        h2 { font-size: 1.1rem; margin: 0 0 1rem; }
        form { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 2rem; }
        .rmq-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        input, textarea {
          width: 100%; padding: .6rem .75rem; border: 1px solid var(--rmq-border);
          border-radius: var(--rmq-radius); background: var(--rmq-bg);
          color: var(--rmq-text); font-family: var(--rmq-font); font-size: .95rem;
          box-sizing: border-box;
        }
        textarea { min-height: 100px; resize: vertical; }
        button[type=submit] {
          align-self: flex-end; padding: .6rem 1.5rem;
          background: var(--rmq-accent); color: #fff; border: none;
          border-radius: var(--rmq-radius); cursor: pointer; font-size: .95rem;
        }
        button[type=submit]:disabled { opacity: .6; cursor: not-allowed; }
        .rmq-comment { margin-bottom: 1.25rem; }
        .rmq-comment-header { display: flex; gap: .75rem; align-items: baseline; margin-bottom: .4rem; }
        .rmq-comment-header time { font-size: .8rem; color: #888; }
        .rmq-comment-body p { margin: 0 0 .5rem; }
        .rmq-comment-body code { background: var(--rmq-border); padding: .1em .3em; border-radius: 3px; }
        .rmq-feedback { padding: .6rem .9rem; border-radius: var(--rmq-radius); margin-bottom: 1rem; }
        .rmq-error   { background: #fee2e2; color: #991b1b; }
        .rmq-success { background: #dcfce7; color: #166534; }
        .rmq-empty   { color: #888; font-style: italic; }
        .rmq-locked  { color: #888; font-style: italic; border: 1px solid var(--rmq-border);
                       padding: .75rem; border-radius: var(--rmq-radius); }
      </style>
      <div class="rmq-wrap">
        <h2>Comentarios</h2>
        <div class="rmq-feedback" hidden></div>
        ${!this._locked ? `
        <form id="rmq-form">
          <div class="rmq-row">
            <input name="author_name"  placeholder="Nombre *" required maxlength="100" />
            <input name="author_email" placeholder="Email (opcional)" type="email" />
          </div>
          <textarea name="content" placeholder="Escribe tu comentario (Markdown permitido)..." required></textarea>
          <button type="submit">Enviar comentario</button>
        </form>` : `<p class="rmq-locked">Los comentarios de esta entrada están cerrados.</p>`}
        <div class="rmq-comments-list">
          <p class="rmq-empty">Cargando comentarios...</p>
        </div>
      </div>`

    const form = this.shadowRoot.querySelector('#rmq-form')
    form?.addEventListener('submit', (e) => this._submitComment(e))
    const feedback = this.shadowRoot.querySelector('.rmq-feedback')
    if (feedback) feedback.removeAttribute('hidden')
  }
}

customElements.define('bizquss-widget', BizqussWidget)
