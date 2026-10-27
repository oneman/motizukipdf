#!/usr/bin/env python3
"""Index the statements, figures and sections of the source papers in pdf/ by PDF page.

Writes docs/manual/pageindex.json:  { tag: { file, npages, index: { "Def 3.1": {page, printed, line}, ... } } }
The manual generator (scripts/manual/build.js) uses it to turn a citation such as
"[IUTchI] Def 3.1" into "Inter-universal Teichmüller Theory I, Section 3, Definition 3.1, p. 61".

Requires pdftotext (poppler-utils).  Usage:  python3 scripts/manual/pageindex.py
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF = os.path.join(ROOT, 'pdf')
OUT = os.path.join(ROOT, 'docs', 'manual', 'pageindex.json')

# citation tag -> (file name without .pdf, title as used in the manual)
PAPERS = {
    'IUTchI':    ('Inter-universal Teichmuller Theory I',   'Inter-universal Teichmüller Theory I: Construction of Hodge Theaters'),
    'IUTchII':   ('Inter-universal Teichmuller Theory II',  'Inter-universal Teichmüller Theory II: Hodge–Arakelov-theoretic Evaluation'),
    'IUTchIII':  ('Inter-universal Teichmuller Theory III', 'Inter-universal Teichmüller Theory III: Canonical Splittings of the Log-theta-lattice'),
    'IUTchIV':   ('Inter-universal Teichmuller Theory IV',  'Inter-universal Teichmüller Theory IV: Log-volume Computations and Set-theoretic Foundations'),
    'EssLgc':    ('Essential Logical Structure of Inter-universal Teichmuller Theory', 'On the Essential Logical Structure of Inter-universal Teichmüller Theory'),
    'Alien':     ('Alien Copies, Gaussians, and Inter-universal Teichmuller Theory', 'The Mathematics of Mutually Alien Copies: from Gaussian Integrals to Inter-universal Teichmüller Theory'),
    'Pano':      ('Panoramic Overview of Inter-universal Teichmuller Theory', 'A Panoramic Overview of Inter-universal Teichmüller Theory'),
    'AbsTopIII': ('Topics in Absolute Anabelian Geometry III', 'Topics in Absolute Anabelian Geometry III: Global Reconstruction Algorithms'),
    'ExpEst':    ('Explicit estimates in IUTeich', 'Explicit Estimates in Inter-universal Teichmüller Theory'),
    'FormIUT':   ('Formalization of IUT (2026-04)', 'On the Formalization of Inter-universal Teichmüller Theory'),
    'EtTh':      ('The Etale Theta Function and its Frobenioid-theoretic Manifestations', 'The Étale Theta Function and its Frobenioid-theoretic Manifestations'),
    'FrdI':      ('The Geometry of Frobenioids I', 'The Geometry of Frobenioids I: The General Theory'),
    'FrdII':     ('The Geometry of Frobenioids II', 'The Geometry of Frobenioids II: Poly-Frobenioids'),
    'CanLift':   ('Canonical Liftings', 'A Theory of Ordinary p-adic Curves / Canonical Liftings'),
}
LIG = {'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl'}
KW = {'Definition': 'Def', 'Proposition': 'Prop', 'Corollary': 'Cor', 'Theorem': 'Thm', 'Remark': 'Rem', 'Example': 'Ex', 'Lemma': 'Lem'}
stmt = re.compile(r'^\s*(Definition|Proposition|Corollary|Theorem|Remark|Example|Lemma)\s*([A-Z]?\d+(?:\.\d+)*|[A-D])[.:](?!\d)')
fig = re.compile(r'^\s*Fig\.\s*([A-Z]?\d*\.?\d+(?:\.\d+)?)\s*:')
sec_word = re.compile(r'^\s*Section\s+(\d+):')
sec_sign = re.compile(r'^\s*§\s*([0-9]+(?:\.[0-9]+)*)\.\s+\S')
intro = re.compile(r'^\s*Introduction\s*$')


def index_paper(tag, fname):
    pdf = os.path.join(PDF, fname + '.pdf')
    if not os.path.exists(pdf):
        print('missing', pdf, file=sys.stderr); return None
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True, check=True).stdout
    for k, v in LIG.items(): txt = txt.replace(k, v)
    txt = re.sub(r'[\x00-\x08\x0b\x0e-\x1f]', ' ', txt)   # stray control characters inside headings
    pages = txt.split('\f')
    idx = {}
    for pno, pg in enumerate(pages, 1):
        lines = pg.split('\n')
        printed = None
        for ln in lines[:4]:  # running head: "62    SHINICHI MOCHIZUKI"  or  "...   63"
            m = re.match(r'\s*(\d{1,3})\s{3,}\S', ln) or re.match(r'.*\S\s{3,}(\d{1,3})\s*$', ln)
            if m: printed = int(m.group(1)); break
        for ln in lines:
            key = None
            m = stmt.match(ln)
            if m: key = KW[m.group(1)] + ' ' + m.group(2)
            elif fig.match(ln): key = 'Fig ' + fig.match(ln).group(1)
            elif sec_word.match(ln): key = '§' + sec_word.match(ln).group(1)
            elif sec_sign.match(ln) and not re.search(r'\s\d{1,3}\s*$', ln) and (pno > 3 or len(pages) < 20): key = '§' + sec_sign.match(ln).group(1)   # skip the table of contents
            elif intro.match(ln) and pno > 1 and '§I' not in idx and ln.startswith(' '): key = '§I'
            if key and key not in idx:
                idx[key] = {'page': pno, 'printed': printed, 'line': re.sub(r'\s+', ' ', ln.strip())[:120]}
    return {'file': fname + '.pdf', 'title': PAPERS[tag][1], 'npages': len(pages) - 1, 'index': idx}


def main():
    out = {}
    for tag, (fname, _title) in PAPERS.items():
        r = index_paper(tag, fname)
        if r: out[tag] = r; print('%-10s %4d pages, %4d entries' % (tag, r['npages'], len(r['index'])))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1, sort_keys=True)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
