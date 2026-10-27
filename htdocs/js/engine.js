/*
 * engine.js — runs the C toolkit `iut` (src/, compiled to wasm32-wasi by scripts/web/build-engine.sh)
 * inside the page.  Every number and every transcript shown by the web app comes out of this engine,
 * so the page cannot drift from the C data model and the process registry.
 *
 *   IUT.ready()                 → Promise that resolves once the module is compiled
 *   IUT.exec(['run', 'MapLabels', '--example', '2'])
 *                               → { code, out, err, ms }   (synchronous once ready; a fresh instance per call,
 *                                                            exactly like one invocation of ./iut)
 *   IUT.json(args)              → parsed JSON of stdout (throws on failure)
 *
 * The WASI shim below implements only what a command-line C program with stdio needs:
 * args_sizes_get / args_get, fd_write (stdout, stderr), fd_close, fd_fdstat_get, fd_seek, proc_exit.
 * Works in browsers and in node (htdocs/test.js).
 */
(function (root) {
  'use strict';

  var ENC = new TextEncoder(), DEC = new TextDecoder('utf-8');
  var wasmModule = null, readyPromise = null, bytes = null;

  function base64ToBytes(b64) {
    if (typeof Buffer !== 'undefined' && Buffer.from) return new Uint8Array(Buffer.from(b64, 'base64'));
    var bin = atob(b64), n = bin.length, out = new Uint8Array(n);
    for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function sourceBytes() {
    if (bytes) return bytes;
    var b64 = root.IUT_WASM_BASE64;
    if (!b64) throw new Error('engine/iut.wasm.js is not loaded (run scripts/web/build-engine.sh)');
    bytes = base64ToBytes(b64);
    return bytes;
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = WebAssembly.compile(sourceBytes()).then(function (m) { wasmModule = m; return m; });
    }
    return readyPromise;
  }

  /* A WASI "process": one instance, its memory, its argv and its two output streams. */
  function Exit(code) { this.code = code; }

  function makeImports(args, state) {
    var mem = null, view = null;
    function memory() { if (!view || view.buffer !== mem.buffer) view = new DataView(mem.buffer); return view; }
    function u8() { return new Uint8Array(mem.buffer); }
    var argBytes = args.map(function (a) { return ENC.encode(a + '\0'); });
    var wasi = {
      args_sizes_get: function (argcPtr, argvBufSizePtr) {
        var total = 0; argBytes.forEach(function (b) { total += b.length; });
        memory().setUint32(argcPtr, argBytes.length, true);
        memory().setUint32(argvBufSizePtr, total, true);
        return 0;
      },
      args_get: function (argvPtr, argvBufPtr) {
        var buf = u8(), off = argvBufPtr;
        for (var i = 0; i < argBytes.length; i++) {
          memory().setUint32(argvPtr + 4 * i, off, true);
          buf.set(argBytes[i], off); off += argBytes[i].length;
        }
        return 0;
      },
      fd_write: function (fd, iovs, iovsLen, nwrittenPtr) {
        var buf = u8(), written = 0, chunks = [];
        for (var i = 0; i < iovsLen; i++) {
          var ptr = memory().getUint32(iovs + 8 * i, true), len = memory().getUint32(iovs + 8 * i + 4, true);
          chunks.push(buf.subarray(ptr, ptr + len)); written += len;
        }
        var target = fd === 2 ? state.err : state.out;
        chunks.forEach(function (c) { target.push(new Uint8Array(c)); });
        memory().setUint32(nwrittenPtr, written, true);
        return 0;
      },
      fd_close: function () { return 0; },
      fd_fdstat_get: function (fd, statPtr) {
        /* filetype = character device (2), flags 0, rights all: a terminal-like stream */
        var v = memory(); v.setUint8(statPtr, 2); v.setUint16(statPtr + 2, 0, true);
        v.setBigUint64(statPtr + 8, BigInt(0xffffffff) << BigInt(32) | BigInt(0xffffffff), true);
        v.setBigUint64(statPtr + 16, BigInt(0xffffffff) << BigInt(32) | BigInt(0xffffffff), true);
        return 0;
      },
      fd_seek: function () { return 29; /* ESPIPE */ },
      proc_exit: function (code) { throw new Exit(code); }
    };
    return { wasi_snapshot_preview1: wasi, setMemory: function (m) { mem = m; } };
  }

  function concat(chunks) {
    var n = 0; chunks.forEach(function (c) { n += c.length; });
    var out = new Uint8Array(n), off = 0;
    chunks.forEach(function (c) { out.set(c, off); off += c.length; });
    return DEC.decode(out);
  }

  function exec(args) {
    if (!wasmModule) throw new Error('engine not ready: await IUT.ready() first');
    var state = { out: [], err: [] }, t0 = (root.performance || Date).now();
    var imports = makeImports(['iut'].concat(args), state);
    var instance = new WebAssembly.Instance(wasmModule, { wasi_snapshot_preview1: imports.wasi_snapshot_preview1 });
    imports.setMemory(instance.exports.memory);
    var code = 0;
    try { instance.exports._start(); }
    catch (e) { if (e instanceof Exit) code = e.code; else { state.err.push(ENC.encode('\n[engine trap] ' + (e && e.message || e) + '\n')); code = 134; } }
    return { code: code, out: concat(state.out), err: concat(state.err), ms: (root.performance || Date).now() - t0, args: args };
  }

  function json(args) {
    var r = exec(args);
    if (r.code !== 0 && !r.out) throw new Error('iut ' + args.join(' ') + ' failed (' + r.code + '): ' + r.err);
    return JSON.parse(r.out);
  }

  var API = { ready: ready, exec: exec, json: json, isReady: function () { return !!wasmModule; } };
  if (typeof exports === "object" && typeof require === "function" && typeof process !== "undefined" && process.versions && process.versions.node) {
    /* node: export, and load the embedded engine if the caller has not already done so */
    if (!root.IUT_WASM_BASE64) { try { require('../engine/iut.wasm.js'); } catch (e) { /* caller may load it */ } }
    if (typeof exports === 'object') { Object.keys(API).forEach(function (k) { exports[k] = API[k]; }); }
  }
  root.IUT = API;
})(typeof window !== 'undefined' ? window : globalThis);
