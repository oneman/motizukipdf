// fmt.js — the model writes notation in plain text, with _ for a subscript and
// ^ for a superscript (F_l^⍟, D^⊢_v, q̳_v^(j²), C_{F_mod}).  The terminal shows
// that text as it is; the page turns it into real sub- and superscripts.
(function (root) {
  "use strict";
  const STOP = new Set([..." ,;:()[]{}_^|=·↦→≅⊆+×/.\"'"]);

  // returns [{ s, lvl }], lvl 0 normal, 1 superscript, -1 subscript
  function parse(text, base) {
    const cs = [...text], out = [];
    let i = 0, plain = "";
    const flush = () => { if (plain) { out.push({ s: plain, lvl: base || 0 }); plain = ""; } };
    while (i < cs.length) {
      const ch = cs[i];
      if ((ch !== "_" && ch !== "^") || i + 1 >= cs.length || cs[i + 1] === " ") { plain += ch; i++; continue; }
      const lvl = base || (ch === "^" ? 1 : -1);
      let j = i + 1, tok = "";
      const group = (open, close, keep) => {
        let depth = 0, k = j, inner = "";
        for (; k < cs.length; k++) {
          if (cs[k] === open) depth++;
          if (cs[k] === close && --depth === 0) break;
          inner += cs[k];
        }
        j = k + 1;
        return keep ? inner + close : inner.slice(1);
      };
      if (cs[j] === "{") { flush(); out.push(...parse(group("{", "}", false), lvl)); i = j; continue; }
      if (cs[j] === "(") tok = group("(", ")", true);
      else if (cs[j] === "|") { let k = j + 1; while (k < cs.length && cs[k] !== "|") k++; tok = cs.slice(j, k + 1).join(""); j = k + 1; }
      else {
        while (j < cs.length && (!STOP.has(cs[j]) || /[̀-ͯ]/.test(cs[j]))) {
          if (cs[j] === "-" && tok !== "D") break;
          tok += cs[j++];
        }
      }
      if (!tok) { plain += ch; i++; continue; }
      flush();
      out.push({ s: tok, lvl });
      i = j;
    }
    flush();
    return out;
  }

  function html(text) {
    const f = document.createDocumentFragment();
    for (const r of parse(String(text))) {
      if (r.lvl === 0) f.append(r.s);
      else { const e = document.createElement(r.lvl > 0 ? "sup" : "sub"); e.textContent = r.s; f.append(e); }
    }
    return f;
  }

  const api = { parse, html };
  if (typeof module !== "undefined") module.exports = api; else root.IUTXFmt = api;
})(typeof window !== "undefined" ? window : globalThis);
