/*
 * views/ids.js — "Identifiers": the 448 letters-only identifiers of src/iut_ids.c (`iut ids --json`),
 * searchable, filterable by kind, each opening the identifier panel (notation, reference, description,
 * the C struct that implements it, the processes that use it).
 */
(function (root) {
  'use strict';
  var M = root.MODEL, U = root.UI, el = U.el, esc = U.esc;
  var state = { q: '', kind: '' };
  var tableEl, countEl;

  function kinds() {
    var m = {};
    M.ids().forEach(function (i) { m[i.kind] = (m[i.kind] || 0) + 1; });
    return Object.keys(m).sort().map(function (k) { return { kind: k, n: m[k] }; });
  }
  function matches(i) {
    if (state.kind && i.kind !== state.kind) return false;
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    return (i.id + ' ' + i.notation + ' ' + i.desc + ' ' + i.ref + ' ' + i.kind).toLowerCase().indexOf(q) >= 0;
  }
  function renderTable() {
    U.clear(tableEl);
    var rows = M.ids().filter(matches);
    countEl.textContent = rows.length + ' of ' + M.ids().length + ' identifiers';
    var byKind = {};
    rows.forEach(function (i) { (byKind[i.kind] = byKind[i.kind] || []).push(i); });
    Object.keys(byKind).sort().forEach(function (k) {
      tableEl.appendChild(el('div', { class: 'section-title' }, [el('h2', { text: k }), el('span', { class: 'count', text: byKind[k].length })]));
      tableEl.appendChild(U.table(['identifier', 'notation', 'reference', 'description', 'form'], byKind[k].map(function (i) {
        var structs = M.structsFor(i.id);
        return [
          el('a', { href: '#identifiers/' + i.id, class: 'mono', text: i.id, onclick: function (ev) { ev.preventDefault(); U.showIdent(i.id); } }),
          el('span', { class: 'id-notation', text: i.notation }),
          el('span', { class: 'small muted', text: i.ref }),
          esc(i.desc),
          el('span', { class: 'small mono muted', text: structs.map(function (s) { return s.name; }).join(', ') })
        ];
      })));
    });
    if (!rows.length) tableEl.appendChild(el('p', { class: 'muted', text: 'nothing matches.' }));
  }

  function render(c) {
    U.clear(c);
    c.appendChild(el('div', { class: 'view-head' }, [
      el('h2', { text: 'Identifiers' }),
      el('p', { class: 'lead', html: 'Every notion of the theory has a letters-only identifier (<code>src/iut_ids.c</code>, <code>iut ids</code>): the name used in the C code, in the JSON output and in these pages. ' + M.ids().length + ' identifiers in ' + kinds().length + ' kinds. Click one for its notation, reference, description, the struct that implements it and the processes that use it.' })
    ]));
    var bar = el('div', { class: 'idbar' });
    var search = el('input', { type: 'search', placeholder: 'search identifier, notation, description, reference…', value: state.q });
    search.addEventListener('input', function () { state.q = search.value.trim(); renderTable(); });
    countEl = el('span', { class: 'muted small' });
    var kindBtns = el('div', { class: 'kinds' });
    function kindButton(k, label) {
      var b = el('button', { class: state.kind === k ? 'active' : '', text: label, onclick: function () { state.kind = k; Array.prototype.forEach.call(kindBtns.children, function (x) { x.classList.toggle('active', x === b); }); renderTable(); } });
      return b;
    }
    kindBtns.appendChild(kindButton('', 'all'));
    kinds().forEach(function (k) { kindBtns.appendChild(kindButton(k.kind, k.kind + ' ' + k.n)); });
    bar.appendChild(search); bar.appendChild(countEl);
    c.appendChild(bar);
    c.appendChild(kindBtns);
    tableEl = el('div');
    c.appendChild(tableEl);
    renderTable();
  }
  function onHash(parts) { if (parts[1] && M.ident(parts[1])) U.showIdent(parts[1]); }

  root.VIEW_IDS = { render: render, onHash: onHash };
})(typeof window !== 'undefined' ? window : globalThis);
