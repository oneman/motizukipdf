/*
 * ui.js — shared DOM helpers: element builder, transcript renderer (the C engine's text output, coloured),
 * the "form" renderer (a C struct / enum, field by field), identifier pills with a popup, canvases.
 */
(function (root) {
  'use strict';
  var M = root.MODEL, D = root.DRAW;

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] == null || attrs[k] === false) return;
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'style') e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c == null) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function esc(s) { return M.esc(s); }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }

  /* a canvas that draws itself with fn(canvas) now and again on 'change' if the view is visible */
  function canvas(fn, cls) {
    var cv = el('canvas', { class: 'diagram ' + (cls || '') });
    try { fn(cv); } catch (e) { console.error(e); cv.title = 'diagram error: ' + e.message; }
    return cv;
  }

  /* ---- transcript: the output of `iut run <id>` etc., coloured line by line */
  function transcript(text, opt) {
    opt = opt || {};
    var pre = el('div', { class: 'transcript' });
    var lines = String(text).replace(/\s+$/, '').split('\n');
    if (opt.maxLines && lines.length > opt.maxLines) { var rest = lines.length - opt.maxLines; lines = lines.slice(0, opt.maxLines); lines.push('… (' + rest + ' more lines)'); }
    var html = lines.map(function (ln) {
      var h = esc(ln);
      h = h.replace(/\[ ok \]/g, '<span class="ok">[ ok ]</span>').replace(/\[info\]/g, '<span class="info">[info]</span>').replace(/\[warn\]/g, '<span class="warn">[warn]</span>').replace(/\[FAIL\]|\[error\]|\[ERR \]/g, '<span class="err">$&</span>');
      h = h.replace(/(\[(?:IUTch(?:I|II|III|IV)|Alien|EssLgc|Pano|ExpEst|AbsTop(?:I|II|III)|EtTh|CanLift|FrdI|FrdII)\][^\n]*?)(?=\s{2,}|$)/g, '<span class="ref">$1</span>');
      if (/^  =&gt; ok/.test(h)) h = '<span class="verdict">' + h + '</span>';
      else if (/^  =&gt; /.test(h)) h = '<span class="verdict fail">' + h + '</span>';
      else if (/^[A-Za-z]+  \[/.test(ln)) h = '<span class="l0">' + h + '</span>';
      else if (/^  in: /.test(ln)) h = '<span class="l1">' + h + '</span>';
      else if (/^(PASSED|FAILED|\d+ process)/.test(ln)) h = '<span class="l0">' + h + '</span>';
      return h;
    }).join('\n');
    pre.innerHTML = html;
    return pre;
  }

  /* ---- identifier pill + popup */
  function identPill(id, opt) {
    opt = opt || {};
    var i = M.ident(id);
    var s = el('span', { class: 'ident', text: i ? i.id : id, title: i ? (i.notation + ' — ' + i.desc) : id, onclick: function (ev) { ev.stopPropagation(); showIdent(id); } });
    return s;
  }
  function identLink(id) { return identPill(id); }

  var overlay = null;
  function showIdent(id) {
    var i = M.ident(id);
    if (!overlay) {
      overlay = el('div', { class: 'overlay', onclick: function (ev) { if (ev.target === overlay) closeIdent(); } }, [el('div', { class: 'panel' })]);
      document.body.appendChild(overlay);
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeIdent(); });
    }
    var panel = clear(overlay.firstChild);
    panel.appendChild(el('button', { class: 'close ghost', text: '✕', onclick: closeIdent }));
    if (!i) { panel.appendChild(el('p', { text: 'unknown identifier ' + id })); overlay.classList.add('open'); return; }
    panel.appendChild(el('div', { class: 'kind', text: i.kind }));
    panel.appendChild(el('h2', { html: '<span class="id-notation">' + esc(i.notation) + '</span> &nbsp;<code>' + esc(i.id) + '</code>' }));
    panel.appendChild(el('p', { class: 'ref', text: i.ref }));
    panel.appendChild(el('p', { class: 'desc', text: i.desc }));
    var structs = M.structsFor(i.id);
    if (structs.length) {
      panel.appendChild(el('h4', { text: 'form: implemented by' }));
      structs.forEach(function (s) { panel.appendChild(form(s)); });
    }
    if (i.kind === 'process') {
      var p = M.proc(i.id);
      if (p) {
        panel.appendChild(el('h4', { text: 'process' }));
        panel.appendChild(el('p', { html: esc(p.name) + ' <span class="muted">— [' + esc(p.paper) + '] ' + esc(p.section) + '</span>' }));
        panel.appendChild(el('p', { html: '<a href="#processes/' + esc(p.id) + '">open in Processes →</a>' }));
      }
    } else {
      /* processes mentioning this identifier */
      var mentions = M.procs().filter(function (p) { return (p.inputs + ' ' + p.outputs + ' ' + p.name).indexOf(i.id) >= 0; });
      if (mentions.length) {
        panel.appendChild(el('h4', { text: 'used by processes' }));
        panel.appendChild(el('p', {}, mentions.map(function (p) { return el('a', { href: '#processes/' + p.id, text: p.id, style: 'margin-right:10px', class: 'mono' }); })));
      }
    }
    overlay.classList.add('open');
  }
  function closeIdent() { if (overlay) overlay.classList.remove('open'); }

  /* ---- the form of a C struct / enum */
  function form(s) {
    var isEnum = !!s.items;
    var box = el('div', { class: 'form' });
    box.appendChild(el('div', { class: 'fhead', html: (isEnum ? 'typedef enum { … } <b>' : 'typedef struct { … } <b>') + esc(s.name) + '</b> &nbsp;<span class="muted">' + esc(s.file) + ':' + s.line + '</span>' + (s.comment ? '<br>' + esc(s.comment) : '') }));
    var t = el('table');
    if (isEnum) {
      s.items.forEach(function (it) {
        if (/_COUNT$/.test(it.name)) return;
        t.appendChild(el('tr', {}, [el('td', { class: 'n', text: it.name }), el('td', { class: 't', text: it.value != null ? '= ' + it.value : '' }), el('td', { class: 'c', text: it.comment })]));
      });
    } else {
      s.fields.forEach(function (f) {
        if (f.group) t.appendChild(el('tr', {}, [el('td', { class: 'g', colspan: 3, text: f.group })]));
        t.appendChild(el('tr', {}, [el('td', { class: 't', text: f.type }), el('td', { class: 'n', text: f.name }), el('td', { class: 'c', text: f.comment })]));
      });
    }
    box.appendChild(t);
    return box;
  }

  function kv(pairs) {
    var dl = el('dl', { class: 'kv' });
    pairs.forEach(function (p) { dl.appendChild(el('dt', { text: p[0] })); dl.appendChild(typeof p[1] === 'string' ? el('dd', { text: p[1] }) : el('dd', {}, [p[1]])); });
    return dl;
  }

  function chip(text, cls) { return el('span', { class: 'chip ' + (cls || ''), html: text }); }
  function table(headers, rows, opt) {
    opt = opt || {};
    var t = el('table', { class: 'data' });
    t.appendChild(el('thead', {}, [el('tr', {}, headers.map(function (h) { return el('th', { text: h }); }))]));
    var tb = el('tbody');
    rows.forEach(function (r) { tb.appendChild(el('tr', {}, r.map(function (c, i) { return typeof c === 'string' || typeof c === 'number' ? el('td', { class: opt.num && opt.num.indexOf(i) >= 0 ? 'num' : '', html: String(c) }) : el('td', {}, [c]); }))); });
    t.appendChild(tb);
    return t;
  }

  /* lines of a process transcript (without the header/footer) */
  function procLines(id) {
    var r = M.run(id);
    return r.out.split('\n').filter(function (l) { return /^\s{4}/.test(l); });
  }

  root.UI = { el: el, esc: esc, clear: clear, canvas: canvas, transcript: transcript, identPill: identPill, identLink: identLink, showIdent: showIdent, closeIdent: closeIdent, form: form, kv: kv, chip: chip, table: table, procLines: procLines };
})(typeof window !== 'undefined' ? window : globalThis);
