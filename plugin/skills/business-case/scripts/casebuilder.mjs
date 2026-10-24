#!/usr/bin/env node
import { createRequire as __cbRequire } from 'node:module';
const require = __cbRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/process-nextick-args/index.js
var require_process_nextick_args = __commonJS({
  "node_modules/process-nextick-args/index.js"(exports, module) {
    "use strict";
    if (typeof process === "undefined" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0) {
      module.exports = { nextTick };
    } else {
      module.exports = process;
    }
    function nextTick(fn, arg1, arg2, arg3) {
      if (typeof fn !== "function") {
        throw new TypeError('"callback" argument must be a function');
      }
      var len = arguments.length;
      var args, i;
      switch (len) {
        case 0:
        case 1:
          return process.nextTick(fn);
        case 2:
          return process.nextTick(function afterTickOne() {
            fn.call(null, arg1);
          });
        case 3:
          return process.nextTick(function afterTickTwo() {
            fn.call(null, arg1, arg2);
          });
        case 4:
          return process.nextTick(function afterTickThree() {
            fn.call(null, arg1, arg2, arg3);
          });
        default:
          args = new Array(len - 1);
          i = 0;
          while (i < args.length) {
            args[i++] = arguments[i];
          }
          return process.nextTick(function afterTick() {
            fn.apply(null, args);
          });
      }
    }
  }
});

// node_modules/isarray/index.js
var require_isarray = __commonJS({
  "node_modules/isarray/index.js"(exports, module) {
    var toString = {}.toString;
    module.exports = Array.isArray || function(arr) {
      return toString.call(arr) == "[object Array]";
    };
  }
});

// node_modules/readable-stream/lib/internal/streams/stream.js
var require_stream = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/stream.js"(exports, module) {
    module.exports = __require("stream");
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill2, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill2 !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill2, encoding);
        } else {
          buf.fill(fill2);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/core-util-is/lib/util.js
var require_util = __commonJS({
  "node_modules/core-util-is/lib/util.js"(exports) {
    function isArray(arg) {
      if (Array.isArray) {
        return Array.isArray(arg);
      }
      return objectToString(arg) === "[object Array]";
    }
    exports.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports.isUndefined = isUndefined;
    function isRegExp(re) {
      return objectToString(re) === "[object RegExp]";
    }
    exports.isRegExp = isRegExp;
    function isObject(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports.isObject = isObject;
    function isDate(d) {
      return objectToString(d) === "[object Date]";
    }
    exports.isDate = isDate;
    function isError(e) {
      return objectToString(e) === "[object Error]" || e instanceof Error;
    }
    exports.isError = isError;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports.isFunction = isFunction;
    function isPrimitive(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || // ES6 symbol
      typeof arg === "undefined";
    }
    exports.isPrimitive = isPrimitive;
    exports.isBuffer = __require("buffer").Buffer.isBuffer;
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
  }
});

// node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "node_modules/inherits/inherits_browser.js"(exports, module) {
    if (typeof Object.create === "function") {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "node_modules/inherits/inherits.js"(exports, module) {
    try {
      util = __require("util");
      if (typeof util.inherits !== "function") throw "";
      module.exports = util.inherits;
    } catch (e) {
      module.exports = require_inherits_browser();
    }
    var util;
  }
});

// node_modules/readable-stream/lib/internal/streams/BufferList.js
var require_BufferList = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/BufferList.js"(exports, module) {
    "use strict";
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    var Buffer2 = require_safe_buffer().Buffer;
    var util = __require("util");
    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }
    module.exports = function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      BufferList.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0) this.tail.next = entry;
        else this.head = entry;
        this.tail = entry;
        ++this.length;
      };
      BufferList.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
      };
      BufferList.prototype.shift = function shift() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null;
        else this.head = this.head.next;
        --this.length;
        return ret;
      };
      BufferList.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };
      BufferList.prototype.join = function join(s) {
        if (this.length === 0) return "";
        var p = this.head;
        var ret = "" + p.data;
        while (p = p.next) {
          ret += s + p.data;
        }
        return ret;
      };
      BufferList.prototype.concat = function concat(n) {
        if (this.length === 0) return Buffer2.alloc(0);
        var ret = Buffer2.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      };
      return BufferList;
    }();
    if (util && util.inspect && util.inspect.custom) {
      module.exports.prototype[util.inspect.custom] = function() {
        var obj = util.inspect({ length: this.length });
        return this.constructor.name + " " + obj;
      };
    }
  }
});

// node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/destroy.js"(exports, module) {
    "use strict";
    var pna = require_process_nextick_args();
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err) {
          if (!this._writableState) {
            pna.nextTick(emitErrorNT, this, err);
          } else if (!this._writableState.errorEmitted) {
            this._writableState.errorEmitted = true;
            pna.nextTick(emitErrorNT, this, err);
          }
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          if (!_this._writableState) {
            pna.nextTick(emitErrorNT, _this, err2);
          } else if (!_this._writableState.errorEmitted) {
            _this._writableState.errorEmitted = true;
            pna.nextTick(emitErrorNT, _this, err2);
          }
        } else if (cb) {
          cb(err2);
        }
      });
      return this;
    }
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finalCalled = false;
        this._writableState.prefinished = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    module.exports = {
      destroy,
      undestroy
    };
  }
});

// node_modules/util-deprecate/node.js
var require_node = __commonJS({
  "node_modules/util-deprecate/node.js"(exports, module) {
    module.exports = __require("util").deprecate;
  }
});

// node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable = __commonJS({
  "node_modules/readable-stream/lib/_stream_writable.js"(exports, module) {
    "use strict";
    var pna = require_process_nextick_args();
    module.exports = Writable;
    function CorkedRequest(state) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state);
      };
    }
    var asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
    var Duplex;
    Writable.WritableState = WritableState;
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    var internalUtil = {
      deprecate: require_node()
    };
    var Stream = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var destroyImpl = require_destroy();
    util.inherits(Writable, Stream);
    function nop() {
    }
    function WritableState(options, stream) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
      var hwm = options.highWaterMark;
      var writableHwm = options.writableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0) this.highWaterMark = hwm;
      else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;
      else this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    WritableState.prototype.getBuffer = function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(function() {
            return this.getBuffer();
          }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: function(object) {
          if (realHasInstance.call(this, object)) return true;
          if (this !== Writable) return false;
          return object && object._writableState instanceof WritableState;
        }
      });
    } else {
      realHasInstance = function(object) {
        return object instanceof this;
      };
    }
    function Writable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
        return new Writable(options);
      }
      this._writableState = new WritableState(options, this);
      this.writable = true;
      if (options) {
        if (typeof options.write === "function") this._write = options.write;
        if (typeof options.writev === "function") this._writev = options.writev;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
        if (typeof options.final === "function") this._final = options.final;
      }
      Stream.call(this);
    }
    Writable.prototype.pipe = function() {
      this.emit("error", new Error("Cannot pipe, not readable"));
    };
    function writeAfterEnd(stream, cb) {
      var er = new Error("write after end");
      stream.emit("error", er);
      pna.nextTick(cb, er);
    }
    function validChunk(stream, state, chunk, cb) {
      var valid = true;
      var er = false;
      if (chunk === null) {
        er = new TypeError("May not write null values to stream");
      } else if (typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      if (er) {
        stream.emit("error", er);
        pna.nextTick(cb, er);
        valid = false;
      }
      return valid;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;
      var isBuf = !state.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf) encoding = "buffer";
      else if (!encoding) encoding = state.defaultEncoding;
      if (typeof cb !== "function") cb = nop;
      if (state.ended) writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
      }
      return ret;
    };
    Writable.prototype.cork = function() {
      var state = this._writableState;
      state.corked++;
    };
    Writable.prototype.uncork = function() {
      var state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
      }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      if (typeof encoding === "string") encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret = state.length < state.highWaterMark;
      if (!ret) state.needDrain = true;
      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state, false, len, chunk, encoding, cb);
      }
      return ret;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (writev) stream._writev(chunk, state.onwrite);
      else stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      --state.pendingcb;
      if (sync) {
        pna.nextTick(cb, er);
        pna.nextTick(finishMaybe, stream, state);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
        finishMaybe(stream, state);
      }
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      onwriteStateUpdate(state);
      if (er) onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(state);
        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer(stream, state);
        }
        if (sync) {
          asyncWrite(afterWrite, stream, state, finished, cb);
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished) onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf) allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state, true, state.length, buffer, "", holder.finish);
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest(state);
        }
        state.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          state.bufferedRequestCount--;
          if (state.writing) {
            break;
          }
        }
        if (entry === null) state.lastBufferedRequest = null;
      }
      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new Error("_write() is not implemented"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (!state.ending) endWritable(this, state, cb);
    };
    function needFinish(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream, state) {
      stream._final(function(err) {
        state.pendingcb--;
        if (err) {
          stream.emit("error", err);
        }
        state.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state);
      });
    }
    function prefinish(stream, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream._final === "function") {
          state.pendingcb++;
          state.finalCalled = true;
          pna.nextTick(callFinal, stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (need) {
        prefinish(stream, state);
        if (state.pendingcb === 0) {
          state.finished = true;
          stream.emit("finish");
        }
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished) pna.nextTick(cb);
        else stream.once("finish", cb);
      }
      state.ended = true;
      stream.writable = false;
    }
    function onCorkedFinish(corkReq, state, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      state.corkedRequestsFree.next = corkReq;
    }
    Object.defineProperty(Writable.prototype, "destroyed", {
      get: function() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      },
      set: function(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      this.end();
      cb(err);
    };
  }
});

// node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex = __commonJS({
  "node_modules/readable-stream/lib/_stream_duplex.js"(exports, module) {
    "use strict";
    var pna = require_process_nextick_args();
    var objectKeys = Object.keys || function(obj) {
      var keys2 = [];
      for (var key in obj) {
        keys2.push(key);
      }
      return keys2;
    };
    module.exports = Duplex;
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    var Readable = require_stream_readable();
    var Writable = require_stream_writable();
    util.inherits(Duplex, Readable);
    {
      keys = objectKeys(Writable.prototype);
      for (v = 0; v < keys.length; v++) {
        method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v;
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      if (options && options.readable === false) this.readable = false;
      if (options && options.writable === false) this.writable = false;
      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
      this.once("end", onend);
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function onend() {
      if (this.allowHalfOpen || this._writableState.ended) return;
      pna.nextTick(onEndNT, this);
    }
    function onEndNT(self2) {
      self2.end();
    }
    Object.defineProperty(Duplex.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });
    Duplex.prototype._destroy = function(err, cb) {
      this.push(null);
      this.end();
      pna.nextTick(cb, err);
    };
  }
});

// node_modules/string_decoder/lib/string_decoder.js
var require_string_decoder = __commonJS({
  "node_modules/string_decoder/lib/string_decoder.js"(exports) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var isEncoding = Buffer2.isEncoding || function(encoding) {
      encoding = "" + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
        case "raw":
          return true;
        default:
          return false;
      }
    };
    function _normalizeEncoding(enc) {
      if (!enc) return "utf8";
      var retried;
      while (true) {
        switch (enc) {
          case "utf8":
          case "utf-8":
            return "utf8";
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return "utf16le";
          case "latin1":
          case "binary":
            return "latin1";
          case "base64":
          case "ascii":
          case "hex":
            return enc;
          default:
            if (retried) return;
            enc = ("" + enc).toLowerCase();
            retried = true;
        }
      }
    }
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
      return nenc || enc;
    }
    exports.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case "utf16le":
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case "utf8":
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case "base64":
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer2.allocUnsafe(nb);
    }
    StringDecoder.prototype.write = function(buf) {
      if (buf.length === 0) return "";
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === void 0) return "";
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || "";
    };
    StringDecoder.prototype.end = utf8End;
    StringDecoder.prototype.text = utf8Text;
    StringDecoder.prototype.fillLast = function(buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    function utf8CheckByte(byte) {
      if (byte <= 127) return 0;
      else if (byte >> 5 === 6) return 2;
      else if (byte >> 4 === 14) return 3;
      else if (byte >> 3 === 30) return 4;
      return byte >> 6 === 2 ? -1 : -2;
    }
    function utf8CheckIncomplete(self2, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0;
          else self2.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }
    function utf8CheckExtraBytes(self2, buf, p) {
      if ((buf[0] & 192) !== 128) {
        self2.lastNeed = 0;
        return "\uFFFD";
      }
      if (self2.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 192) !== 128) {
          self2.lastNeed = 1;
          return "\uFFFD";
        }
        if (self2.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 192) !== 128) {
            self2.lastNeed = 2;
            return "\uFFFD";
          }
        }
      }
    }
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== void 0) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString("utf8", i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString("utf8", i, end);
    }
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + "\uFFFD";
      return r;
    }
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString("utf16le", i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 55296 && c <= 56319) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString("utf16le", i, buf.length - 1);
    }
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString("utf16le", 0, end);
      }
      return r;
    }
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0) return buf.toString("base64", i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString("base64", i, buf.length - n);
    }
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
      return r;
    }
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
  }
});

// node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable = __commonJS({
  "node_modules/readable-stream/lib/_stream_readable.js"(exports, module) {
    "use strict";
    var pna = require_process_nextick_args();
    module.exports = Readable;
    var isArray = require_isarray();
    var Duplex;
    Readable.ReadableState = ReadableState;
    var EE = __require("events").EventEmitter;
    var EElistenerCount = function(emitter, type) {
      return emitter.listeners(type).length;
    };
    var Stream = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    var debugUtil = __require("util");
    var debug = void 0;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = function() {
      };
    }
    var BufferList = require_BufferList();
    var destroyImpl = require_destroy();
    var StringDecoder;
    util.inherits(Readable, Stream);
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
      else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);
      else emitter._events[event] = [fn, emitter._events[event]];
    }
    function ReadableState(options, stream) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
      var hwm = options.highWaterMark;
      var readableHwm = options.readableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0) this.highWaterMark = hwm;
      else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;
      else this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.destroyed = false;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!(this instanceof Readable)) return new Readable(options);
      this._readableState = new ReadableState(options, this);
      this.readable = true;
      if (options) {
        if (typeof options.read === "function") this._read = options.read;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
      }
      Stream.call(this);
    }
    Object.defineProperty(Readable.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      },
      set: function(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }
    });
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function(err, cb) {
      this.push(null);
      cb(err);
    };
    Readable.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      var skipChunkCheck;
      if (!state.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      var state = stream._readableState;
      if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else {
        var er;
        if (!skipChunkCheck) er = chunkInvalid(state, chunk);
        if (er) {
          stream.emit("error", er);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state.endEmitted) stream.emit("error", new Error("stream.unshift() after end event"));
            else addChunk(stream, state, chunk, true);
          } else if (state.ended) {
            stream.emit("error", new Error("stream.push() after EOF"));
          } else {
            state.reading = false;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
              else maybeReadMore(stream, state);
            } else {
              addChunk(stream, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.reading = false;
        }
      }
      return needMoreData(state);
    }
    function addChunk(stream, state, chunk, addToFront) {
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit("data", chunk);
        stream.read(0);
      } else {
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront) state.buffer.unshift(chunk);
        else state.buffer.push(chunk);
        if (state.needReadable) emitReadable(stream);
      }
      maybeReadMore(stream, state);
    }
    function chunkInvalid(state, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      return er;
    }
    function needMoreData(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }
    Readable.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
      this._readableState.decoder = new StringDecoder(enc);
      this._readableState.encoding = enc;
      return this;
    };
    var MAX_HWM = 8388608;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (n <= 0 || state.length === 0 && state.ended) return 0;
      if (state.objectMode) return 1;
      if (n !== n) {
        if (state.flowing && state.length) return state.buffer.head.data.length;
        else return state.length;
      }
      if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state.length) return n;
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }
    Readable.prototype.read = function(n) {
      debug("read", n);
      n = parseInt(n, 10);
      var state = this._readableState;
      var nOrig = n;
      if (n !== 0) state.emittedReadable = false;
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        debug("read: emitReadable", state.length, state.ended);
        if (state.length === 0 && state.ended) endReadable(this);
        else emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        if (state.length === 0) endReadable(this);
        return null;
      }
      var doRead = state.needReadable;
      debug("need readable", doRead);
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state.ended || state.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state.reading = true;
        state.sync = true;
        if (state.length === 0) state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
        if (!state.reading) n = howMuchToRead(nOrig, state);
      }
      var ret;
      if (n > 0) ret = fromList(n, state);
      else ret = null;
      if (ret === null) {
        state.needReadable = true;
        n = 0;
      } else {
        state.length -= n;
      }
      if (state.length === 0) {
        if (!state.ended) state.needReadable = true;
        if (nOrig !== n && state.ended) endReadable(this);
      }
      if (ret !== null) this.emit("data", ret);
      return ret;
    };
    function onEofChunk(stream, state) {
      if (state.ended) return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      emitReadable(stream);
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug("emitReadable", state.flowing);
        state.emittedReadable = true;
        if (state.sync) pna.nextTick(emitReadable_, stream);
        else emitReadable_(stream);
      }
    }
    function emitReadable_(stream) {
      debug("emit readable");
      stream.emit("readable");
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        pna.nextTick(maybeReadMore_, stream, state);
      }
    }
    function maybeReadMore_(stream, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state.length)
          break;
        else len = state.length;
      }
      state.readingMore = false;
    }
    Readable.prototype._read = function(n) {
      this.emit("error", new Error("_read() is not implemented"));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state.endEmitted) pna.nextTick(endFn);
      else src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      function onend() {
        debug("onend");
        dest.end();
      }
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }
      var increasedAwaitDrain = false;
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        increasedAwaitDrain = false;
        var ret = dest.write(chunk);
        if (false === ret && !increasedAwaitDrain) {
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", state.awaitDrain);
            state.awaitDrain++;
            increasedAwaitDrain = true;
          }
          src.pause();
        }
      }
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0) dest.emit("error", er);
      }
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      dest.emit("pipe", src);
      if (!state.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return function() {
        var state = src._readableState;
        debug("pipeOnDrain", state.awaitDrain);
        if (state.awaitDrain) state.awaitDrain--;
        if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
          state.flowing = true;
          flow(src);
        }
      };
    }
    Readable.prototype.unpipe = function(dest) {
      var state = this._readableState;
      var unpipeInfo = { hasUnpiped: false };
      if (state.pipesCount === 0) return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes) return this;
        if (!dest) dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest) dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        for (var i = 0; i < len; i++) {
          dests[i].emit("unpipe", this, { hasUnpiped: false });
        }
        return this;
      }
      var index = indexOf(state.pipes, dest);
      if (index === -1) return this;
      state.pipes.splice(index, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1) state.pipes = state.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      if (ev === "data") {
        if (this._readableState.flowing !== false) this.resume();
      } else if (ev === "readable") {
        var state = this._readableState;
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.emittedReadable = false;
          if (!state.reading) {
            pna.nextTick(nReadingNextTick, this);
          } else if (state.length) {
            emitReadable(this);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    Readable.prototype.resume = function() {
      var state = this._readableState;
      if (!state.flowing) {
        debug("resume");
        state.flowing = true;
        resume(this, state);
      }
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        pna.nextTick(resume_, stream, state);
      }
    }
    function resume_(stream, state) {
      if (!state.reading) {
        debug("resume read 0");
        stream.read(0);
      }
      state.resumeScheduled = false;
      state.awaitDrain = 0;
      stream.emit("resume");
      flow(stream);
      if (state.flowing && !state.reading) stream.read(0);
    }
    Readable.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (false !== this._readableState.flowing) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      return this;
    };
    function flow(stream) {
      var state = stream._readableState;
      debug("flow", state.flowing);
      while (state.flowing && stream.read() !== null) {
      }
    }
    Readable.prototype.wrap = function(stream) {
      var _this = this;
      var state = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state.decoder) chunk = state.decoder.write(chunk);
        if (state.objectMode && (chunk === null || chunk === void 0)) return;
        else if (!state.objectMode && (!chunk || !chunk.length)) return;
        var ret = _this.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = /* @__PURE__ */ function(method) {
            return function() {
              return stream[method].apply(stream, arguments);
            };
          }(i);
        }
      }
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }
      this._read = function(n2) {
        debug("wrapped _read", n2);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._readableState.highWaterMark;
      }
    });
    Readable._fromList = fromList;
    function fromList(n, state) {
      if (state.length === 0) return null;
      var ret;
      if (state.objectMode) ret = state.buffer.shift();
      else if (!n || n >= state.length) {
        if (state.decoder) ret = state.buffer.join("");
        else if (state.buffer.length === 1) ret = state.buffer.head.data;
        else ret = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        ret = fromListPartial(n, state.buffer, state.decoder);
      }
      return ret;
    }
    function fromListPartial(n, list, hasStrings) {
      var ret;
      if (n < list.head.data.length) {
        ret = list.head.data.slice(0, n);
        list.head.data = list.head.data.slice(n);
      } else if (n === list.head.data.length) {
        ret = list.shift();
      } else {
        ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
      }
      return ret;
    }
    function copyFromBufferString(n, list) {
      var p = list.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;
        else ret += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) list.head = p.next;
            else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }
    function copyFromBuffer(n, list) {
      var ret = Buffer2.allocUnsafe(n);
      var p = list.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) list.head = p.next;
            else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
      if (!state.endEmitted) {
        state.ended = true;
        pna.nextTick(endReadableNT, state, stream);
      }
    }
    function endReadableNT(state, stream) {
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) return i;
      }
      return -1;
    }
  }
});

// node_modules/readable-stream/lib/_stream_transform.js
var require_stream_transform = __commonJS({
  "node_modules/readable-stream/lib/_stream_transform.js"(exports, module) {
    "use strict";
    module.exports = Transform;
    var Duplex = require_stream_duplex();
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    util.inherits(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (!cb) {
        return this.emit("error", new Error("write callback called multiple times"));
      }
      ts.writechunk = null;
      ts.writecb = null;
      if (data != null)
        this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options) {
        if (typeof options.transform === "function") this._transform = options.transform;
        if (typeof options.flush === "function") this._flush = options.flush;
      }
      this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      if (typeof this._flush === "function") {
        this._flush(function(er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      throw new Error("_transform() is not implemented");
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    Transform.prototype._destroy = function(err, cb) {
      var _this2 = this;
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
        _this2.emit("close");
      });
    };
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if (data != null)
        stream.push(data);
      if (stream._writableState.length) throw new Error("Calling transform done when ws.length != 0");
      if (stream._transformState.transforming) throw new Error("Calling transform done when still transforming");
      return stream.push(null);
    }
  }
});

// node_modules/readable-stream/lib/_stream_passthrough.js
var require_stream_passthrough = __commonJS({
  "node_modules/readable-stream/lib/_stream_passthrough.js"(exports, module) {
    "use strict";
    module.exports = PassThrough;
    var Transform = require_stream_transform();
    var util = Object.create(require_util());
    util.inherits = require_inherits();
    util.inherits(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }
});

// node_modules/readable-stream/readable.js
var require_readable = __commonJS({
  "node_modules/readable-stream/readable.js"(exports, module) {
    var Stream = __require("stream");
    if (process.env.READABLE_STREAM === "disable" && Stream) {
      module.exports = Stream;
      exports = module.exports = Stream.Readable;
      exports.Readable = Stream.Readable;
      exports.Writable = Stream.Writable;
      exports.Duplex = Stream.Duplex;
      exports.Transform = Stream.Transform;
      exports.PassThrough = Stream.PassThrough;
      exports.Stream = Stream;
    } else {
      exports = module.exports = require_stream_readable();
      exports.Stream = Stream || exports;
      exports.Readable = exports;
      exports.Writable = require_stream_writable();
      exports.Duplex = require_stream_duplex();
      exports.Transform = require_stream_transform();
      exports.PassThrough = require_stream_passthrough();
    }
  }
});

// node_modules/jszip/lib/support.js
var require_support = __commonJS({
  "node_modules/jszip/lib/support.js"(exports) {
    "use strict";
    exports.base64 = true;
    exports.array = true;
    exports.string = true;
    exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
    exports.nodebuffer = typeof Buffer !== "undefined";
    exports.uint8array = typeof Uint8Array !== "undefined";
    if (typeof ArrayBuffer === "undefined") {
      exports.blob = false;
    } else {
      buffer = new ArrayBuffer(0);
      try {
        exports.blob = new Blob([buffer], {
          type: "application/zip"
        }).size === 0;
      } catch (e) {
        try {
          Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
          builder = new Builder();
          builder.append(buffer);
          exports.blob = builder.getBlob("application/zip").size === 0;
        } catch (e2) {
          exports.blob = false;
        }
      }
    }
    var buffer;
    var Builder;
    var builder;
    try {
      exports.nodestream = !!require_readable().Readable;
    } catch (e) {
      exports.nodestream = false;
    }
  }
});

// node_modules/jszip/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/jszip/lib/base64.js"(exports) {
    "use strict";
    var utils = require_utils();
    var support = require_support();
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    exports.encode = function(input) {
      var output = [];
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0, len = input.length, remainingBytes = len;
      var isArray = utils.getTypeOf(input) !== "string";
      while (i < input.length) {
        remainingBytes = len - i;
        if (!isArray) {
          chr1 = input.charCodeAt(i++);
          chr2 = i < len ? input.charCodeAt(i++) : 0;
          chr3 = i < len ? input.charCodeAt(i++) : 0;
        } else {
          chr1 = input[i++];
          chr2 = i < len ? input[i++] : 0;
          chr3 = i < len ? input[i++] : 0;
        }
        enc1 = chr1 >> 2;
        enc2 = (chr1 & 3) << 4 | chr2 >> 4;
        enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
        enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
        output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
      }
      return output.join("");
    };
    exports.decode = function(input) {
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0, resultIndex = 0;
      var dataUrlPrefix = "data:";
      if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) {
        throw new Error("Invalid base64 input, it looks like a data url.");
      }
      input = input.replace(/[^A-Za-z0-9+/=]/g, "");
      var totalLength = input.length * 3 / 4;
      if (input.charAt(input.length - 1) === _keyStr.charAt(64)) {
        totalLength--;
      }
      if (input.charAt(input.length - 2) === _keyStr.charAt(64)) {
        totalLength--;
      }
      if (totalLength % 1 !== 0) {
        throw new Error("Invalid base64 input, bad content length.");
      }
      var output;
      if (support.uint8array) {
        output = new Uint8Array(totalLength | 0);
      } else {
        output = new Array(totalLength | 0);
      }
      while (i < input.length) {
        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));
        chr1 = enc1 << 2 | enc2 >> 4;
        chr2 = (enc2 & 15) << 4 | enc3 >> 2;
        chr3 = (enc3 & 3) << 6 | enc4;
        output[resultIndex++] = chr1;
        if (enc3 !== 64) {
          output[resultIndex++] = chr2;
        }
        if (enc4 !== 64) {
          output[resultIndex++] = chr3;
        }
      }
      return output;
    };
  }
});

// node_modules/jszip/lib/nodejsUtils.js
var require_nodejsUtils = __commonJS({
  "node_modules/jszip/lib/nodejsUtils.js"(exports, module) {
    "use strict";
    module.exports = {
      /**
       * True if this is running in Nodejs, will be undefined in a browser.
       * In a browser, browserify won't include this file and the whole module
       * will be resolved an empty object.
       */
      isNode: typeof Buffer !== "undefined",
      /**
       * Create a new nodejs Buffer from an existing content.
       * @param {Object} data the data to pass to the constructor.
       * @param {String} encoding the encoding to use.
       * @return {Buffer} a new Buffer.
       */
      newBufferFrom: function(data, encoding) {
        if (Buffer.from && Buffer.from !== Uint8Array.from) {
          return Buffer.from(data, encoding);
        } else {
          if (typeof data === "number") {
            throw new Error('The "data" argument must not be a number');
          }
          return new Buffer(data, encoding);
        }
      },
      /**
       * Create a new nodejs Buffer with the specified size.
       * @param {Integer} size the size of the buffer.
       * @return {Buffer} a new Buffer.
       */
      allocBuffer: function(size) {
        if (Buffer.alloc) {
          return Buffer.alloc(size);
        } else {
          var buf = new Buffer(size);
          buf.fill(0);
          return buf;
        }
      },
      /**
       * Find out if an object is a Buffer.
       * @param {Object} b the object to test.
       * @return {Boolean} true if the object is a Buffer, false otherwise.
       */
      isBuffer: function(b) {
        return Buffer.isBuffer(b);
      },
      isStream: function(obj) {
        return obj && typeof obj.on === "function" && typeof obj.pause === "function" && typeof obj.resume === "function";
      }
    };
  }
});

// node_modules/immediate/lib/index.js
var require_lib = __commonJS({
  "node_modules/immediate/lib/index.js"(exports, module) {
    "use strict";
    var Mutation = global.MutationObserver || global.WebKitMutationObserver;
    var scheduleDrain;
    if (process.browser) {
      if (Mutation) {
        called = 0;
        observer = new Mutation(nextTick);
        element = global.document.createTextNode("");
        observer.observe(element, {
          characterData: true
        });
        scheduleDrain = function() {
          element.data = called = ++called % 2;
        };
      } else if (!global.setImmediate && typeof global.MessageChannel !== "undefined") {
        channel = new global.MessageChannel();
        channel.port1.onmessage = nextTick;
        scheduleDrain = function() {
          channel.port2.postMessage(0);
        };
      } else if ("document" in global && "onreadystatechange" in global.document.createElement("script")) {
        scheduleDrain = function() {
          var scriptEl = global.document.createElement("script");
          scriptEl.onreadystatechange = function() {
            nextTick();
            scriptEl.onreadystatechange = null;
            scriptEl.parentNode.removeChild(scriptEl);
            scriptEl = null;
          };
          global.document.documentElement.appendChild(scriptEl);
        };
      } else {
        scheduleDrain = function() {
          setTimeout(nextTick, 0);
        };
      }
    } else {
      scheduleDrain = function() {
        process.nextTick(nextTick);
      };
    }
    var called;
    var observer;
    var element;
    var channel;
    var draining;
    var queue = [];
    function nextTick() {
      draining = true;
      var i, oldQueue;
      var len = queue.length;
      while (len) {
        oldQueue = queue;
        queue = [];
        i = -1;
        while (++i < len) {
          oldQueue[i]();
        }
        len = queue.length;
      }
      draining = false;
    }
    module.exports = immediate;
    function immediate(task) {
      if (queue.push(task) === 1 && !draining) {
        scheduleDrain();
      }
    }
  }
});

// node_modules/lie/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/lie/lib/index.js"(exports, module) {
    "use strict";
    var immediate = require_lib();
    function INTERNAL() {
    }
    var handlers = {};
    var REJECTED = ["REJECTED"];
    var FULFILLED = ["FULFILLED"];
    var PENDING = ["PENDING"];
    if (!process.browser) {
      UNHANDLED = ["UNHANDLED"];
    }
    var UNHANDLED;
    module.exports = Promise2;
    function Promise2(resolver) {
      if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function");
      }
      this.state = PENDING;
      this.queue = [];
      this.outcome = void 0;
      if (!process.browser) {
        this.handled = UNHANDLED;
      }
      if (resolver !== INTERNAL) {
        safelyResolveThenable(this, resolver);
      }
    }
    Promise2.prototype.finally = function(callback) {
      if (typeof callback !== "function") {
        return this;
      }
      var p = this.constructor;
      return this.then(resolve2, reject2);
      function resolve2(value) {
        function yes() {
          return value;
        }
        return p.resolve(callback()).then(yes);
      }
      function reject2(reason) {
        function no() {
          throw reason;
        }
        return p.resolve(callback()).then(no);
      }
    };
    Promise2.prototype.catch = function(onRejected) {
      return this.then(null, onRejected);
    };
    Promise2.prototype.then = function(onFulfilled, onRejected) {
      if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) {
        return this;
      }
      var promise = new this.constructor(INTERNAL);
      if (!process.browser) {
        if (this.handled === UNHANDLED) {
          this.handled = null;
        }
      }
      if (this.state !== PENDING) {
        var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
        unwrap(promise, resolver, this.outcome);
      } else {
        this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
      }
      return promise;
    };
    function QueueItem(promise, onFulfilled, onRejected) {
      this.promise = promise;
      if (typeof onFulfilled === "function") {
        this.onFulfilled = onFulfilled;
        this.callFulfilled = this.otherCallFulfilled;
      }
      if (typeof onRejected === "function") {
        this.onRejected = onRejected;
        this.callRejected = this.otherCallRejected;
      }
    }
    QueueItem.prototype.callFulfilled = function(value) {
      handlers.resolve(this.promise, value);
    };
    QueueItem.prototype.otherCallFulfilled = function(value) {
      unwrap(this.promise, this.onFulfilled, value);
    };
    QueueItem.prototype.callRejected = function(value) {
      handlers.reject(this.promise, value);
    };
    QueueItem.prototype.otherCallRejected = function(value) {
      unwrap(this.promise, this.onRejected, value);
    };
    function unwrap(promise, func, value) {
      immediate(function() {
        var returnValue;
        try {
          returnValue = func(value);
        } catch (e) {
          return handlers.reject(promise, e);
        }
        if (returnValue === promise) {
          handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
        } else {
          handlers.resolve(promise, returnValue);
        }
      });
    }
    handlers.resolve = function(self2, value) {
      var result = tryCatch(getThen, value);
      if (result.status === "error") {
        return handlers.reject(self2, result.value);
      }
      var thenable = result.value;
      if (thenable) {
        safelyResolveThenable(self2, thenable);
      } else {
        self2.state = FULFILLED;
        self2.outcome = value;
        var i = -1;
        var len = self2.queue.length;
        while (++i < len) {
          self2.queue[i].callFulfilled(value);
        }
      }
      return self2;
    };
    handlers.reject = function(self2, error) {
      self2.state = REJECTED;
      self2.outcome = error;
      if (!process.browser) {
        if (self2.handled === UNHANDLED) {
          immediate(function() {
            if (self2.handled === UNHANDLED) {
              process.emit("unhandledRejection", error, self2);
            }
          });
        }
      }
      var i = -1;
      var len = self2.queue.length;
      while (++i < len) {
        self2.queue[i].callRejected(error);
      }
      return self2;
    };
    function getThen(obj) {
      var then = obj && obj.then;
      if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") {
        return function appyThen() {
          then.apply(obj, arguments);
        };
      }
    }
    function safelyResolveThenable(self2, thenable) {
      var called = false;
      function onError(value) {
        if (called) {
          return;
        }
        called = true;
        handlers.reject(self2, value);
      }
      function onSuccess(value) {
        if (called) {
          return;
        }
        called = true;
        handlers.resolve(self2, value);
      }
      function tryToUnwrap() {
        thenable(onSuccess, onError);
      }
      var result = tryCatch(tryToUnwrap);
      if (result.status === "error") {
        onError(result.value);
      }
    }
    function tryCatch(func, value) {
      var out = {};
      try {
        out.value = func(value);
        out.status = "success";
      } catch (e) {
        out.status = "error";
        out.value = e;
      }
      return out;
    }
    Promise2.resolve = resolve;
    function resolve(value) {
      if (value instanceof this) {
        return value;
      }
      return handlers.resolve(new this(INTERNAL), value);
    }
    Promise2.reject = reject;
    function reject(reason) {
      var promise = new this(INTERNAL);
      return handlers.reject(promise, reason);
    }
    Promise2.all = all;
    function all(iterable) {
      var self2 = this;
      if (Object.prototype.toString.call(iterable) !== "[object Array]") {
        return this.reject(new TypeError("must be an array"));
      }
      var len = iterable.length;
      var called = false;
      if (!len) {
        return this.resolve([]);
      }
      var values = new Array(len);
      var resolved = 0;
      var i = -1;
      var promise = new this(INTERNAL);
      while (++i < len) {
        allResolver(iterable[i], i);
      }
      return promise;
      function allResolver(value, i2) {
        self2.resolve(value).then(resolveFromAll, function(error) {
          if (!called) {
            called = true;
            handlers.reject(promise, error);
          }
        });
        function resolveFromAll(outValue) {
          values[i2] = outValue;
          if (++resolved === len && !called) {
            called = true;
            handlers.resolve(promise, values);
          }
        }
      }
    }
    Promise2.race = race;
    function race(iterable) {
      var self2 = this;
      if (Object.prototype.toString.call(iterable) !== "[object Array]") {
        return this.reject(new TypeError("must be an array"));
      }
      var len = iterable.length;
      var called = false;
      if (!len) {
        return this.resolve([]);
      }
      var i = -1;
      var promise = new this(INTERNAL);
      while (++i < len) {
        resolver(iterable[i]);
      }
      return promise;
      function resolver(value) {
        self2.resolve(value).then(function(response) {
          if (!called) {
            called = true;
            handlers.resolve(promise, response);
          }
        }, function(error) {
          if (!called) {
            called = true;
            handlers.reject(promise, error);
          }
        });
      }
    }
  }
});

// node_modules/jszip/lib/external.js
var require_external = __commonJS({
  "node_modules/jszip/lib/external.js"(exports, module) {
    "use strict";
    var ES6Promise = null;
    if (typeof Promise !== "undefined") {
      ES6Promise = Promise;
    } else {
      ES6Promise = require_lib2();
    }
    module.exports = {
      Promise: ES6Promise
    };
  }
});

// node_modules/setimmediate/setImmediate.js
var require_setImmediate = __commonJS({
  "node_modules/setimmediate/setImmediate.js"(exports) {
    (function(global2, undefined2) {
      "use strict";
      if (global2.setImmediate) {
        return;
      }
      var nextHandle = 1;
      var tasksByHandle = {};
      var currentlyRunningATask = false;
      var doc = global2.document;
      var registerImmediate;
      function setImmediate2(callback) {
        if (typeof callback !== "function") {
          callback = new Function("" + callback);
        }
        var args = new Array(arguments.length - 1);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
        }
        var task = { callback, args };
        tasksByHandle[nextHandle] = task;
        registerImmediate(nextHandle);
        return nextHandle++;
      }
      function clearImmediate(handle) {
        delete tasksByHandle[handle];
      }
      function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
          case 0:
            callback();
            break;
          case 1:
            callback(args[0]);
            break;
          case 2:
            callback(args[0], args[1]);
            break;
          case 3:
            callback(args[0], args[1], args[2]);
            break;
          default:
            callback.apply(undefined2, args);
            break;
        }
      }
      function runIfPresent(handle) {
        if (currentlyRunningATask) {
          setTimeout(runIfPresent, 0, handle);
        } else {
          var task = tasksByHandle[handle];
          if (task) {
            currentlyRunningATask = true;
            try {
              run(task);
            } finally {
              clearImmediate(handle);
              currentlyRunningATask = false;
            }
          }
        }
      }
      function installNextTickImplementation() {
        registerImmediate = function(handle) {
          process.nextTick(function() {
            runIfPresent(handle);
          });
        };
      }
      function canUsePostMessage() {
        if (global2.postMessage && !global2.importScripts) {
          var postMessageIsAsynchronous = true;
          var oldOnMessage = global2.onmessage;
          global2.onmessage = function() {
            postMessageIsAsynchronous = false;
          };
          global2.postMessage("", "*");
          global2.onmessage = oldOnMessage;
          return postMessageIsAsynchronous;
        }
      }
      function installPostMessageImplementation() {
        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
          if (event.source === global2 && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
            runIfPresent(+event.data.slice(messagePrefix.length));
          }
        };
        if (global2.addEventListener) {
          global2.addEventListener("message", onGlobalMessage, false);
        } else {
          global2.attachEvent("onmessage", onGlobalMessage);
        }
        registerImmediate = function(handle) {
          global2.postMessage(messagePrefix + handle, "*");
        };
      }
      function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
          var handle = event.data;
          runIfPresent(handle);
        };
        registerImmediate = function(handle) {
          channel.port2.postMessage(handle);
        };
      }
      function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
          var script = doc.createElement("script");
          script.onreadystatechange = function() {
            runIfPresent(handle);
            script.onreadystatechange = null;
            html.removeChild(script);
            script = null;
          };
          html.appendChild(script);
        };
      }
      function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
          setTimeout(runIfPresent, 0, handle);
        };
      }
      var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global2);
      attachTo = attachTo && attachTo.setTimeout ? attachTo : global2;
      if ({}.toString.call(global2.process) === "[object process]") {
        installNextTickImplementation();
      } else if (canUsePostMessage()) {
        installPostMessageImplementation();
      } else if (global2.MessageChannel) {
        installMessageChannelImplementation();
      } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        installReadyStateChangeImplementation();
      } else {
        installSetTimeoutImplementation();
      }
      attachTo.setImmediate = setImmediate2;
      attachTo.clearImmediate = clearImmediate;
    })(typeof self === "undefined" ? typeof global === "undefined" ? exports : global : self);
  }
});

// node_modules/jszip/lib/utils.js
var require_utils = __commonJS({
  "node_modules/jszip/lib/utils.js"(exports) {
    "use strict";
    var support = require_support();
    var base64 = require_base64();
    var nodejsUtils = require_nodejsUtils();
    var external = require_external();
    require_setImmediate();
    function string2binary(str) {
      var result = null;
      if (support.uint8array) {
        result = new Uint8Array(str.length);
      } else {
        result = new Array(str.length);
      }
      return stringToArrayLike(str, result);
    }
    exports.newBlob = function(part, type) {
      exports.checkSupport("blob");
      try {
        return new Blob([part], {
          type
        });
      } catch (e) {
        try {
          var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
          var builder = new Builder();
          builder.append(part);
          return builder.getBlob(type);
        } catch (e2) {
          throw new Error("Bug : can't construct the Blob.");
        }
      }
    };
    function identity(input) {
      return input;
    }
    function stringToArrayLike(str, array) {
      for (var i = 0; i < str.length; ++i) {
        array[i] = str.charCodeAt(i) & 255;
      }
      return array;
    }
    var arrayToStringHelper = {
      /**
       * Transform an array of int into a string, chunk by chunk.
       * See the performances notes on arrayLikeToString.
       * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
       * @param {String} type the type of the array.
       * @param {Integer} chunk the chunk size.
       * @return {String} the resulting string.
       * @throws Error if the chunk is too big for the stack.
       */
      stringifyByChunk: function(array, type, chunk) {
        var result = [], k = 0, len = array.length;
        if (len <= chunk) {
          return String.fromCharCode.apply(null, array);
        }
        while (k < len) {
          if (type === "array" || type === "nodebuffer") {
            result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
          } else {
            result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
          }
          k += chunk;
        }
        return result.join("");
      },
      /**
       * Call String.fromCharCode on every item in the array.
       * This is the naive implementation, which generate A LOT of intermediate string.
       * This should be used when everything else fail.
       * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
       * @return {String} the result.
       */
      stringifyByChar: function(array) {
        var resultStr = "";
        for (var i = 0; i < array.length; i++) {
          resultStr += String.fromCharCode(array[i]);
        }
        return resultStr;
      },
      applyCanBeUsed: {
        /**
         * true if the browser accepts to use String.fromCharCode on Uint8Array
         */
        uint8array: function() {
          try {
            return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch (e) {
            return false;
          }
        }(),
        /**
         * true if the browser accepts to use String.fromCharCode on nodejs Buffer.
         */
        nodebuffer: function() {
          try {
            return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
          } catch (e) {
            return false;
          }
        }()
      }
    };
    function arrayLikeToString(array) {
      var chunk = 65536, type = exports.getTypeOf(array), canUseApply = true;
      if (type === "uint8array") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
      } else if (type === "nodebuffer") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
      }
      if (canUseApply) {
        while (chunk > 1) {
          try {
            return arrayToStringHelper.stringifyByChunk(array, type, chunk);
          } catch (e) {
            chunk = Math.floor(chunk / 2);
          }
        }
      }
      return arrayToStringHelper.stringifyByChar(array);
    }
    exports.applyFromCharCode = arrayLikeToString;
    function arrayLikeToArrayLike(arrayFrom, arrayTo) {
      for (var i = 0; i < arrayFrom.length; i++) {
        arrayTo[i] = arrayFrom[i];
      }
      return arrayTo;
    }
    var transform = {};
    transform["string"] = {
      "string": identity,
      "array": function(input) {
        return stringToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return transform["string"]["uint8array"](input).buffer;
      },
      "uint8array": function(input) {
        return stringToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer": function(input) {
        return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
      }
    };
    transform["array"] = {
      "string": arrayLikeToString,
      "array": identity,
      "arraybuffer": function(input) {
        return new Uint8Array(input).buffer;
      },
      "uint8array": function(input) {
        return new Uint8Array(input);
      },
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(input);
      }
    };
    transform["arraybuffer"] = {
      "string": function(input) {
        return arrayLikeToString(new Uint8Array(input));
      },
      "array": function(input) {
        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
      },
      "arraybuffer": identity,
      "uint8array": function(input) {
        return new Uint8Array(input);
      },
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(new Uint8Array(input));
      }
    };
    transform["uint8array"] = {
      "string": arrayLikeToString,
      "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return input.buffer;
      },
      "uint8array": identity,
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(input);
      }
    };
    transform["nodebuffer"] = {
      "string": arrayLikeToString,
      "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return transform["nodebuffer"]["uint8array"](input).buffer;
      },
      "uint8array": function(input) {
        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer": identity
    };
    exports.transformTo = function(outputType, input) {
      if (!input) {
        input = "";
      }
      if (!outputType) {
        return input;
      }
      exports.checkSupport(outputType);
      var inputType = exports.getTypeOf(input);
      var result = transform[inputType][outputType](input);
      return result;
    };
    exports.resolve = function(path2) {
      var parts = path2.split("/");
      var result = [];
      for (var index = 0; index < parts.length; index++) {
        var part = parts[index];
        if (part === "." || part === "" && index !== 0 && index !== parts.length - 1) {
          continue;
        } else if (part === "..") {
          result.pop();
        } else {
          result.push(part);
        }
      }
      return result.join("/");
    };
    exports.getTypeOf = function(input) {
      if (typeof input === "string") {
        return "string";
      }
      var proto = Object.prototype.toString.call(input);
      if (proto === "[object Array]") {
        return "array";
      }
      if (support.nodebuffer && nodejsUtils.isBuffer(input)) {
        return "nodebuffer";
      }
      if (support.uint8array && proto === "[object Uint8Array]") {
        return "uint8array";
      }
      if (support.arraybuffer && proto === "[object ArrayBuffer]") {
        return "arraybuffer";
      }
    };
    exports.checkSupport = function(type) {
      var supported = support[type.toLowerCase()];
      if (!supported) {
        throw new Error(type + " is not supported by this platform");
      }
    };
    exports.MAX_VALUE_16BITS = 65535;
    exports.MAX_VALUE_32BITS = -1;
    exports.pretty = function(str) {
      var res = "", code, i;
      for (i = 0; i < (str || "").length; i++) {
        code = str.charCodeAt(i);
        res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
      }
      return res;
    };
    exports.delay = function(callback, args, self2) {
      setImmediate(function() {
        callback.apply(self2 || null, args || []);
      });
    };
    exports.inherits = function(ctor, superCtor) {
      var Obj = function() {
      };
      Obj.prototype = superCtor.prototype;
      ctor.prototype = new Obj();
    };
    exports.extend = function() {
      var result = {}, i, attr;
      for (i = 0; i < arguments.length; i++) {
        for (attr in arguments[i]) {
          if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === "undefined") {
            result[attr] = arguments[i][attr];
          }
        }
      }
      return result;
    };
    exports.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
      var promise = external.Promise.resolve(inputData).then(function(data) {
        var isBlob = support.blob && (data instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(data)) !== -1);
        if (isBlob) {
          if (typeof Blob.prototype.arrayBuffer !== "undefined") {
            return data.arrayBuffer();
          } else if (typeof FileReader !== "undefined") {
            return new external.Promise(function(resolve, reject) {
              var reader = new FileReader();
              reader.onload = function(e) {
                resolve(e.target.result);
              };
              reader.onerror = function(e) {
                reject(e.target.error);
              };
              reader.readAsArrayBuffer(data);
            });
          } else {
            return external.Promise.reject(
              new Error(name + " is a Blob, but we have no way of reading it.")
            );
          }
        }
        return data;
      });
      return promise.then(function(data) {
        var dataType = exports.getTypeOf(data);
        if (!dataType) {
          return external.Promise.reject(
            new Error("Can't read the data of '" + name + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?")
          );
        }
        if (dataType === "arraybuffer") {
          data = exports.transformTo("uint8array", data);
        } else if (dataType === "string") {
          if (isBase64) {
            data = base64.decode(data);
          } else if (isBinary) {
            if (isOptimizedBinaryString !== true) {
              data = string2binary(data);
            }
          }
        }
        return data;
      });
    };
  }
});

// node_modules/jszip/lib/stream/GenericWorker.js
var require_GenericWorker = __commonJS({
  "node_modules/jszip/lib/stream/GenericWorker.js"(exports, module) {
    "use strict";
    function GenericWorker(name) {
      this.name = name || "default";
      this.streamInfo = {};
      this.generatedError = null;
      this.extraStreamInfo = {};
      this.isPaused = true;
      this.isFinished = false;
      this.isLocked = false;
      this._listeners = {
        "data": [],
        "end": [],
        "error": []
      };
      this.previous = null;
    }
    GenericWorker.prototype = {
      /**
       * Push a chunk to the next workers.
       * @param {Object} chunk the chunk to push
       */
      push: function(chunk) {
        this.emit("data", chunk);
      },
      /**
       * End the stream.
       * @return {Boolean} true if this call ended the worker, false otherwise.
       */
      end: function() {
        if (this.isFinished) {
          return false;
        }
        this.flush();
        try {
          this.emit("end");
          this.cleanUp();
          this.isFinished = true;
        } catch (e) {
          this.emit("error", e);
        }
        return true;
      },
      /**
       * End the stream with an error.
       * @param {Error} e the error which caused the premature end.
       * @return {Boolean} true if this call ended the worker with an error, false otherwise.
       */
      error: function(e) {
        if (this.isFinished) {
          return false;
        }
        if (this.isPaused) {
          this.generatedError = e;
        } else {
          this.isFinished = true;
          this.emit("error", e);
          if (this.previous) {
            this.previous.error(e);
          }
          this.cleanUp();
        }
        return true;
      },
      /**
       * Add a callback on an event.
       * @param {String} name the name of the event (data, end, error)
       * @param {Function} listener the function to call when the event is triggered
       * @return {GenericWorker} the current object for chainability
       */
      on: function(name, listener) {
        this._listeners[name].push(listener);
        return this;
      },
      /**
       * Clean any references when a worker is ending.
       */
      cleanUp: function() {
        this.streamInfo = this.generatedError = this.extraStreamInfo = null;
        this._listeners = [];
      },
      /**
       * Trigger an event. This will call registered callback with the provided arg.
       * @param {String} name the name of the event (data, end, error)
       * @param {Object} arg the argument to call the callback with.
       */
      emit: function(name, arg) {
        if (this._listeners[name]) {
          for (var i = 0; i < this._listeners[name].length; i++) {
            this._listeners[name][i].call(this, arg);
          }
        }
      },
      /**
       * Chain a worker with an other.
       * @param {Worker} next the worker receiving events from the current one.
       * @return {worker} the next worker for chainability
       */
      pipe: function(next) {
        return next.registerPrevious(this);
      },
      /**
       * Same as `pipe` in the other direction.
       * Using an API with `pipe(next)` is very easy.
       * Implementing the API with the point of view of the next one registering
       * a source is easier, see the ZipFileWorker.
       * @param {Worker} previous the previous worker, sending events to this one
       * @return {Worker} the current worker for chainability
       */
      registerPrevious: function(previous) {
        if (this.isLocked) {
          throw new Error("The stream '" + this + "' has already been used.");
        }
        this.streamInfo = previous.streamInfo;
        this.mergeStreamInfo();
        this.previous = previous;
        var self2 = this;
        previous.on("data", function(chunk) {
          self2.processChunk(chunk);
        });
        previous.on("end", function() {
          self2.end();
        });
        previous.on("error", function(e) {
          self2.error(e);
        });
        return this;
      },
      /**
       * Pause the stream so it doesn't send events anymore.
       * @return {Boolean} true if this call paused the worker, false otherwise.
       */
      pause: function() {
        if (this.isPaused || this.isFinished) {
          return false;
        }
        this.isPaused = true;
        if (this.previous) {
          this.previous.pause();
        }
        return true;
      },
      /**
       * Resume a paused stream.
       * @return {Boolean} true if this call resumed the worker, false otherwise.
       */
      resume: function() {
        if (!this.isPaused || this.isFinished) {
          return false;
        }
        this.isPaused = false;
        var withError = false;
        if (this.generatedError) {
          this.error(this.generatedError);
          withError = true;
        }
        if (this.previous) {
          this.previous.resume();
        }
        return !withError;
      },
      /**
       * Flush any remaining bytes as the stream is ending.
       */
      flush: function() {
      },
      /**
       * Process a chunk. This is usually the method overridden.
       * @param {Object} chunk the chunk to process.
       */
      processChunk: function(chunk) {
        this.push(chunk);
      },
      /**
       * Add a key/value to be added in the workers chain streamInfo once activated.
       * @param {String} key the key to use
       * @param {Object} value the associated value
       * @return {Worker} the current worker for chainability
       */
      withStreamInfo: function(key, value) {
        this.extraStreamInfo[key] = value;
        this.mergeStreamInfo();
        return this;
      },
      /**
       * Merge this worker's streamInfo into the chain's streamInfo.
       */
      mergeStreamInfo: function() {
        for (var key in this.extraStreamInfo) {
          if (!Object.prototype.hasOwnProperty.call(this.extraStreamInfo, key)) {
            continue;
          }
          this.streamInfo[key] = this.extraStreamInfo[key];
        }
      },
      /**
       * Lock the stream to prevent further updates on the workers chain.
       * After calling this method, all calls to pipe will fail.
       */
      lock: function() {
        if (this.isLocked) {
          throw new Error("The stream '" + this + "' has already been used.");
        }
        this.isLocked = true;
        if (this.previous) {
          this.previous.lock();
        }
      },
      /**
       *
       * Pretty print the workers chain.
       */
      toString: function() {
        var me = "Worker " + this.name;
        if (this.previous) {
          return this.previous + " -> " + me;
        } else {
          return me;
        }
      }
    };
    module.exports = GenericWorker;
  }
});

// node_modules/jszip/lib/utf8.js
var require_utf8 = __commonJS({
  "node_modules/jszip/lib/utf8.js"(exports) {
    "use strict";
    var utils = require_utils();
    var support = require_support();
    var nodejsUtils = require_nodejsUtils();
    var GenericWorker = require_GenericWorker();
    var _utf8len = new Array(256);
    for (i = 0; i < 256; i++) {
      _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
    }
    var i;
    _utf8len[254] = _utf8len[254] = 1;
    var string2buf = function(str) {
      var buf, c, c2, m_pos, i2, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      if (support.uint8array) {
        buf = new Uint8Array(buf_len);
      } else {
        buf = new Array(buf_len);
      }
      for (i2 = 0, m_pos = 0; i2 < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i2++] = c;
        } else if (c < 2048) {
          buf[i2++] = 192 | c >>> 6;
          buf[i2++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i2++] = 224 | c >>> 12;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        } else {
          buf[i2++] = 240 | c >>> 18;
          buf[i2++] = 128 | c >>> 12 & 63;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        }
      }
      return buf;
    };
    var utf8border = function(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
    var buf2string = function(buf) {
      var i2, out, c, c_len;
      var len = buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i2 = 0; i2 < len; ) {
        c = buf[i2++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i2 += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i2 < len) {
          c = c << 6 | buf[i2++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      if (utf16buf.length !== out) {
        if (utf16buf.subarray) {
          utf16buf = utf16buf.subarray(0, out);
        } else {
          utf16buf.length = out;
        }
      }
      return utils.applyFromCharCode(utf16buf);
    };
    exports.utf8encode = function utf8encode(str) {
      if (support.nodebuffer) {
        return nodejsUtils.newBufferFrom(str, "utf-8");
      }
      return string2buf(str);
    };
    exports.utf8decode = function utf8decode(buf) {
      if (support.nodebuffer) {
        return utils.transformTo("nodebuffer", buf).toString("utf-8");
      }
      buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
      return buf2string(buf);
    };
    function Utf8DecodeWorker() {
      GenericWorker.call(this, "utf-8 decode");
      this.leftOver = null;
    }
    utils.inherits(Utf8DecodeWorker, GenericWorker);
    Utf8DecodeWorker.prototype.processChunk = function(chunk) {
      var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);
      if (this.leftOver && this.leftOver.length) {
        if (support.uint8array) {
          var previousData = data;
          data = new Uint8Array(previousData.length + this.leftOver.length);
          data.set(this.leftOver, 0);
          data.set(previousData, this.leftOver.length);
        } else {
          data = this.leftOver.concat(data);
        }
        this.leftOver = null;
      }
      var nextBoundary = utf8border(data);
      var usableData = data;
      if (nextBoundary !== data.length) {
        if (support.uint8array) {
          usableData = data.subarray(0, nextBoundary);
          this.leftOver = data.subarray(nextBoundary, data.length);
        } else {
          usableData = data.slice(0, nextBoundary);
          this.leftOver = data.slice(nextBoundary, data.length);
        }
      }
      this.push({
        data: exports.utf8decode(usableData),
        meta: chunk.meta
      });
    };
    Utf8DecodeWorker.prototype.flush = function() {
      if (this.leftOver && this.leftOver.length) {
        this.push({
          data: exports.utf8decode(this.leftOver),
          meta: {}
        });
        this.leftOver = null;
      }
    };
    exports.Utf8DecodeWorker = Utf8DecodeWorker;
    function Utf8EncodeWorker() {
      GenericWorker.call(this, "utf-8 encode");
    }
    utils.inherits(Utf8EncodeWorker, GenericWorker);
    Utf8EncodeWorker.prototype.processChunk = function(chunk) {
      this.push({
        data: exports.utf8encode(chunk.data),
        meta: chunk.meta
      });
    };
    exports.Utf8EncodeWorker = Utf8EncodeWorker;
  }
});

// node_modules/jszip/lib/stream/ConvertWorker.js
var require_ConvertWorker = __commonJS({
  "node_modules/jszip/lib/stream/ConvertWorker.js"(exports, module) {
    "use strict";
    var GenericWorker = require_GenericWorker();
    var utils = require_utils();
    function ConvertWorker(destType) {
      GenericWorker.call(this, "ConvertWorker to " + destType);
      this.destType = destType;
    }
    utils.inherits(ConvertWorker, GenericWorker);
    ConvertWorker.prototype.processChunk = function(chunk) {
      this.push({
        data: utils.transformTo(this.destType, chunk.data),
        meta: chunk.meta
      });
    };
    module.exports = ConvertWorker;
  }
});

// node_modules/jszip/lib/nodejs/NodejsStreamOutputAdapter.js
var require_NodejsStreamOutputAdapter = __commonJS({
  "node_modules/jszip/lib/nodejs/NodejsStreamOutputAdapter.js"(exports, module) {
    "use strict";
    var Readable = require_readable().Readable;
    var utils = require_utils();
    utils.inherits(NodejsStreamOutputAdapter, Readable);
    function NodejsStreamOutputAdapter(helper, options, updateCb) {
      Readable.call(this, options);
      this._helper = helper;
      var self2 = this;
      helper.on("data", function(data, meta) {
        if (!self2.push(data)) {
          self2._helper.pause();
        }
        if (updateCb) {
          updateCb(meta);
        }
      }).on("error", function(e) {
        self2.emit("error", e);
      }).on("end", function() {
        self2.push(null);
      });
    }
    NodejsStreamOutputAdapter.prototype._read = function() {
      this._helper.resume();
    };
    module.exports = NodejsStreamOutputAdapter;
  }
});

// node_modules/jszip/lib/stream/StreamHelper.js
var require_StreamHelper = __commonJS({
  "node_modules/jszip/lib/stream/StreamHelper.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var ConvertWorker = require_ConvertWorker();
    var GenericWorker = require_GenericWorker();
    var base64 = require_base64();
    var support = require_support();
    var external = require_external();
    var NodejsStreamOutputAdapter = null;
    if (support.nodestream) {
      try {
        NodejsStreamOutputAdapter = require_NodejsStreamOutputAdapter();
      } catch (e) {
      }
    }
    function transformZipOutput(type, content, mimeType) {
      switch (type) {
        case "blob":
          return utils.newBlob(utils.transformTo("arraybuffer", content), mimeType);
        case "base64":
          return base64.encode(content);
        default:
          return utils.transformTo(type, content);
      }
    }
    function concat(type, dataArray) {
      var i, index = 0, res = null, totalLength = 0;
      for (i = 0; i < dataArray.length; i++) {
        totalLength += dataArray[i].length;
      }
      switch (type) {
        case "string":
          return dataArray.join("");
        case "array":
          return Array.prototype.concat.apply([], dataArray);
        case "uint8array":
          res = new Uint8Array(totalLength);
          for (i = 0; i < dataArray.length; i++) {
            res.set(dataArray[i], index);
            index += dataArray[i].length;
          }
          return res;
        case "nodebuffer":
          return Buffer.concat(dataArray);
        default:
          throw new Error("concat : unsupported type '" + type + "'");
      }
    }
    function accumulate(helper, updateCallback) {
      return new external.Promise(function(resolve, reject) {
        var dataArray = [];
        var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
        helper.on("data", function(data, meta) {
          dataArray.push(data);
          if (updateCallback) {
            updateCallback(meta);
          }
        }).on("error", function(err) {
          dataArray = [];
          reject(err);
        }).on("end", function() {
          try {
            var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
            resolve(result);
          } catch (e) {
            reject(e);
          }
          dataArray = [];
        }).resume();
      });
    }
    function StreamHelper(worker, outputType, mimeType) {
      var internalType = outputType;
      switch (outputType) {
        case "blob":
        case "arraybuffer":
          internalType = "uint8array";
          break;
        case "base64":
          internalType = "string";
          break;
      }
      try {
        this._internalType = internalType;
        this._outputType = outputType;
        this._mimeType = mimeType;
        utils.checkSupport(internalType);
        this._worker = worker.pipe(new ConvertWorker(internalType));
        worker.lock();
      } catch (e) {
        this._worker = new GenericWorker("error");
        this._worker.error(e);
      }
    }
    StreamHelper.prototype = {
      /**
       * Listen a StreamHelper, accumulate its content and concatenate it into a
       * complete block.
       * @param {Function} updateCb the update callback.
       * @return Promise the promise for the accumulation.
       */
      accumulate: function(updateCb) {
        return accumulate(this, updateCb);
      },
      /**
       * Add a listener on an event triggered on a stream.
       * @param {String} evt the name of the event
       * @param {Function} fn the listener
       * @return {StreamHelper} the current helper.
       */
      on: function(evt, fn) {
        var self2 = this;
        if (evt === "data") {
          this._worker.on(evt, function(chunk) {
            fn.call(self2, chunk.data, chunk.meta);
          });
        } else {
          this._worker.on(evt, function() {
            utils.delay(fn, arguments, self2);
          });
        }
        return this;
      },
      /**
       * Resume the flow of chunks.
       * @return {StreamHelper} the current helper.
       */
      resume: function() {
        utils.delay(this._worker.resume, [], this._worker);
        return this;
      },
      /**
       * Pause the flow of chunks.
       * @return {StreamHelper} the current helper.
       */
      pause: function() {
        this._worker.pause();
        return this;
      },
      /**
       * Return a nodejs stream for this helper.
       * @param {Function} updateCb the update callback.
       * @return {NodejsStreamOutputAdapter} the nodejs stream.
       */
      toNodejsStream: function(updateCb) {
        utils.checkSupport("nodestream");
        if (this._outputType !== "nodebuffer") {
          throw new Error(this._outputType + " is not supported by this method");
        }
        return new NodejsStreamOutputAdapter(this, {
          objectMode: this._outputType !== "nodebuffer"
        }, updateCb);
      }
    };
    module.exports = StreamHelper;
  }
});

// node_modules/jszip/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/jszip/lib/defaults.js"(exports) {
    "use strict";
    exports.base64 = false;
    exports.binary = false;
    exports.dir = false;
    exports.createFolders = true;
    exports.date = null;
    exports.compression = null;
    exports.compressionOptions = null;
    exports.comment = null;
    exports.unixPermissions = null;
    exports.dosPermissions = null;
  }
});

// node_modules/jszip/lib/stream/DataWorker.js
var require_DataWorker = __commonJS({
  "node_modules/jszip/lib/stream/DataWorker.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var DEFAULT_BLOCK_SIZE = 16 * 1024;
    function DataWorker(dataP) {
      GenericWorker.call(this, "DataWorker");
      var self2 = this;
      this.dataIsReady = false;
      this.index = 0;
      this.max = 0;
      this.data = null;
      this.type = "";
      this._tickScheduled = false;
      dataP.then(function(data) {
        self2.dataIsReady = true;
        self2.data = data;
        self2.max = data && data.length || 0;
        self2.type = utils.getTypeOf(data);
        if (!self2.isPaused) {
          self2._tickAndRepeat();
        }
      }, function(e) {
        self2.error(e);
      });
    }
    utils.inherits(DataWorker, GenericWorker);
    DataWorker.prototype.cleanUp = function() {
      GenericWorker.prototype.cleanUp.call(this);
      this.data = null;
    };
    DataWorker.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (!this._tickScheduled && this.dataIsReady) {
        this._tickScheduled = true;
        utils.delay(this._tickAndRepeat, [], this);
      }
      return true;
    };
    DataWorker.prototype._tickAndRepeat = function() {
      this._tickScheduled = false;
      if (this.isPaused || this.isFinished) {
        return;
      }
      this._tick();
      if (!this.isFinished) {
        utils.delay(this._tickAndRepeat, [], this);
        this._tickScheduled = true;
      }
    };
    DataWorker.prototype._tick = function() {
      if (this.isPaused || this.isFinished) {
        return false;
      }
      var size = DEFAULT_BLOCK_SIZE;
      var data = null, nextIndex = Math.min(this.max, this.index + size);
      if (this.index >= this.max) {
        return this.end();
      } else {
        switch (this.type) {
          case "string":
            data = this.data.substring(this.index, nextIndex);
            break;
          case "uint8array":
            data = this.data.subarray(this.index, nextIndex);
            break;
          case "array":
          case "nodebuffer":
            data = this.data.slice(this.index, nextIndex);
            break;
        }
        this.index = nextIndex;
        return this.push({
          data,
          meta: {
            percent: this.max ? this.index / this.max * 100 : 0
          }
        });
      }
    };
    module.exports = DataWorker;
  }
});

// node_modules/jszip/lib/crc32.js
var require_crc32 = __commonJS({
  "node_modules/jszip/lib/crc32.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    function makeTable() {
      var c, table = [];
      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
      }
      return table;
    }
    var crcTable = makeTable();
    function crc32(crc, buf, len, pos) {
      var t = crcTable, end = pos + len;
      crc = crc ^ -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    }
    function crc32str(crc, str, len, pos) {
      var t = crcTable, end = pos + len;
      crc = crc ^ -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
      }
      return crc ^ -1;
    }
    module.exports = function crc32wrapper(input, crc) {
      if (typeof input === "undefined" || !input.length) {
        return 0;
      }
      var isArray = utils.getTypeOf(input) !== "string";
      if (isArray) {
        return crc32(crc | 0, input, input.length, 0);
      } else {
        return crc32str(crc | 0, input, input.length, 0);
      }
    };
  }
});

// node_modules/jszip/lib/stream/Crc32Probe.js
var require_Crc32Probe = __commonJS({
  "node_modules/jszip/lib/stream/Crc32Probe.js"(exports, module) {
    "use strict";
    var GenericWorker = require_GenericWorker();
    var crc32 = require_crc32();
    var utils = require_utils();
    function Crc32Probe() {
      GenericWorker.call(this, "Crc32Probe");
      this.withStreamInfo("crc32", 0);
    }
    utils.inherits(Crc32Probe, GenericWorker);
    Crc32Probe.prototype.processChunk = function(chunk) {
      this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
      this.push(chunk);
    };
    module.exports = Crc32Probe;
  }
});

// node_modules/jszip/lib/stream/DataLengthProbe.js
var require_DataLengthProbe = __commonJS({
  "node_modules/jszip/lib/stream/DataLengthProbe.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    function DataLengthProbe(propName) {
      GenericWorker.call(this, "DataLengthProbe for " + propName);
      this.propName = propName;
      this.withStreamInfo(propName, 0);
    }
    utils.inherits(DataLengthProbe, GenericWorker);
    DataLengthProbe.prototype.processChunk = function(chunk) {
      if (chunk) {
        var length = this.streamInfo[this.propName] || 0;
        this.streamInfo[this.propName] = length + chunk.data.length;
      }
      GenericWorker.prototype.processChunk.call(this, chunk);
    };
    module.exports = DataLengthProbe;
  }
});

// node_modules/jszip/lib/compressedObject.js
var require_compressedObject = __commonJS({
  "node_modules/jszip/lib/compressedObject.js"(exports, module) {
    "use strict";
    var external = require_external();
    var DataWorker = require_DataWorker();
    var Crc32Probe = require_Crc32Probe();
    var DataLengthProbe = require_DataLengthProbe();
    function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
      this.compressedSize = compressedSize;
      this.uncompressedSize = uncompressedSize;
      this.crc32 = crc32;
      this.compression = compression;
      this.compressedContent = data;
    }
    CompressedObject.prototype = {
      /**
       * Create a worker to get the uncompressed content.
       * @return {GenericWorker} the worker.
       */
      getContentWorker: function() {
        var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe("data_length"));
        var that = this;
        worker.on("end", function() {
          if (this.streamInfo["data_length"] !== that.uncompressedSize) {
            throw new Error("Bug : uncompressed data size mismatch");
          }
        });
        return worker;
      },
      /**
       * Create a worker to get the compressed content.
       * @return {GenericWorker} the worker.
       */
      getCompressedWorker: function() {
        return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
      }
    };
    CompressedObject.createWorkerFrom = function(uncompressedWorker, compression, compressionOptions) {
      return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe("uncompressedSize")).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe("compressedSize")).withStreamInfo("compression", compression);
    };
    module.exports = CompressedObject;
  }
});

// node_modules/jszip/lib/zipObject.js
var require_zipObject = __commonJS({
  "node_modules/jszip/lib/zipObject.js"(exports, module) {
    "use strict";
    var StreamHelper = require_StreamHelper();
    var DataWorker = require_DataWorker();
    var utf8 = require_utf8();
    var CompressedObject = require_compressedObject();
    var GenericWorker = require_GenericWorker();
    var ZipObject = function(name, data, options) {
      this.name = name;
      this.dir = options.dir;
      this.date = options.date;
      this.comment = options.comment;
      this.unixPermissions = options.unixPermissions;
      this.dosPermissions = options.dosPermissions;
      this._data = data;
      this._dataBinary = options.binary;
      this.options = {
        compression: options.compression,
        compressionOptions: options.compressionOptions
      };
    };
    ZipObject.prototype = {
      /**
       * Create an internal stream for the content of this object.
       * @param {String} type the type of each chunk.
       * @return StreamHelper the stream.
       */
      internalStream: function(type) {
        var result = null, outputType = "string";
        try {
          if (!type) {
            throw new Error("No output type specified.");
          }
          outputType = type.toLowerCase();
          var askUnicodeString = outputType === "string" || outputType === "text";
          if (outputType === "binarystring" || outputType === "text") {
            outputType = "string";
          }
          result = this._decompressWorker();
          var isUnicodeString = !this._dataBinary;
          if (isUnicodeString && !askUnicodeString) {
            result = result.pipe(new utf8.Utf8EncodeWorker());
          }
          if (!isUnicodeString && askUnicodeString) {
            result = result.pipe(new utf8.Utf8DecodeWorker());
          }
        } catch (e) {
          result = new GenericWorker("error");
          result.error(e);
        }
        return new StreamHelper(result, outputType, "");
      },
      /**
       * Prepare the content in the asked type.
       * @param {String} type the type of the result.
       * @param {Function} onUpdate a function to call on each internal update.
       * @return Promise the promise of the result.
       */
      async: function(type, onUpdate) {
        return this.internalStream(type).accumulate(onUpdate);
      },
      /**
       * Prepare the content as a nodejs stream.
       * @param {String} type the type of each chunk.
       * @param {Function} onUpdate a function to call on each internal update.
       * @return Stream the stream.
       */
      nodeStream: function(type, onUpdate) {
        return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
      },
      /**
       * Return a worker for the compressed content.
       * @private
       * @param {Object} compression the compression object to use.
       * @param {Object} compressionOptions the options to use when compressing.
       * @return Worker the worker.
       */
      _compressWorker: function(compression, compressionOptions) {
        if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) {
          return this._data.getCompressedWorker();
        } else {
          var result = this._decompressWorker();
          if (!this._dataBinary) {
            result = result.pipe(new utf8.Utf8EncodeWorker());
          }
          return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
        }
      },
      /**
       * Return a worker for the decompressed content.
       * @private
       * @return Worker the worker.
       */
      _decompressWorker: function() {
        if (this._data instanceof CompressedObject) {
          return this._data.getContentWorker();
        } else if (this._data instanceof GenericWorker) {
          return this._data;
        } else {
          return new DataWorker(this._data);
        }
      }
    };
    var removedMethods = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"];
    var removedFn = function() {
      throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
    };
    for (i = 0; i < removedMethods.length; i++) {
      ZipObject.prototype[removedMethods[i]] = removedFn;
    }
    var i;
    module.exports = ZipObject;
  }
});

// node_modules/pako/lib/utils/common.js
var require_common = __commonJS({
  "node_modules/pako/lib/utils/common.js"(exports) {
    "use strict";
    var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
    function _has(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
    exports.assign = function(obj) {
      var sources = Array.prototype.slice.call(arguments, 1);
      while (sources.length) {
        var source = sources.shift();
        if (!source) {
          continue;
        }
        if (typeof source !== "object") {
          throw new TypeError(source + "must be non-object");
        }
        for (var p in source) {
          if (_has(source, p)) {
            obj[p] = source[p];
          }
        }
      }
      return obj;
    };
    exports.shrinkBuf = function(buf, size) {
      if (buf.length === size) {
        return buf;
      }
      if (buf.subarray) {
        return buf.subarray(0, size);
      }
      buf.length = size;
      return buf;
    };
    var fnTyped = {
      arraySet: function(dest, src, src_offs, len, dest_offs) {
        if (src.subarray && dest.subarray) {
          dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
          return;
        }
        for (var i = 0; i < len; i++) {
          dest[dest_offs + i] = src[src_offs + i];
        }
      },
      // Join array of chunks to single array.
      flattenChunks: function(chunks) {
        var i, l, len, pos, chunk, result;
        len = 0;
        for (i = 0, l = chunks.length; i < l; i++) {
          len += chunks[i].length;
        }
        result = new Uint8Array(len);
        pos = 0;
        for (i = 0, l = chunks.length; i < l; i++) {
          chunk = chunks[i];
          result.set(chunk, pos);
          pos += chunk.length;
        }
        return result;
      }
    };
    var fnUntyped = {
      arraySet: function(dest, src, src_offs, len, dest_offs) {
        for (var i = 0; i < len; i++) {
          dest[dest_offs + i] = src[src_offs + i];
        }
      },
      // Join array of chunks to single array.
      flattenChunks: function(chunks) {
        return [].concat.apply([], chunks);
      }
    };
    exports.setTyped = function(on) {
      if (on) {
        exports.Buf8 = Uint8Array;
        exports.Buf16 = Uint16Array;
        exports.Buf32 = Int32Array;
        exports.assign(exports, fnTyped);
      } else {
        exports.Buf8 = Array;
        exports.Buf16 = Array;
        exports.Buf32 = Array;
        exports.assign(exports, fnUntyped);
      }
    };
    exports.setTyped(TYPED_OK);
  }
});

// node_modules/pako/lib/zlib/trees.js
var require_trees = __commonJS({
  "node_modules/pako/lib/zlib/trees.js"(exports) {
    "use strict";
    var utils = require_common();
    var Z_FIXED = 4;
    var Z_BINARY = 0;
    var Z_TEXT = 1;
    var Z_UNKNOWN = 2;
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    var STORED_BLOCK = 0;
    var STATIC_TREES = 1;
    var DYN_TREES = 2;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var Buf_size = 16;
    var MAX_BL_BITS = 7;
    var END_BLOCK = 256;
    var REP_3_6 = 16;
    var REPZ_3_10 = 17;
    var REPZ_11_138 = 18;
    var extra_lbits = (
      /* extra bits for each length code */
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
    );
    var extra_dbits = (
      /* extra bits for each distance code */
      [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
    );
    var extra_blbits = (
      /* extra bits for each bit length code */
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
    );
    var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    var DIST_CODE_LEN = 512;
    var static_ltree = new Array((L_CODES + 2) * 2);
    zero(static_ltree);
    var static_dtree = new Array(D_CODES * 2);
    zero(static_dtree);
    var _dist_code = new Array(DIST_CODE_LEN);
    zero(_dist_code);
    var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
    zero(_length_code);
    var base_length = new Array(LENGTH_CODES);
    zero(base_length);
    var base_dist = new Array(D_CODES);
    zero(base_dist);
    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
      this.static_tree = static_tree;
      this.extra_bits = extra_bits;
      this.extra_base = extra_base;
      this.elems = elems;
      this.max_length = max_length;
      this.has_stree = static_tree && static_tree.length;
    }
    var static_l_desc;
    var static_d_desc;
    var static_bl_desc;
    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;
      this.max_code = 0;
      this.stat_desc = stat_desc;
    }
    function d_code(dist) {
      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    }
    function put_short(s, w) {
      s.pending_buf[s.pending++] = w & 255;
      s.pending_buf[s.pending++] = w >>> 8 & 255;
    }
    function send_bits(s, value, length) {
      if (s.bi_valid > Buf_size - length) {
        s.bi_buf |= value << s.bi_valid & 65535;
        put_short(s, s.bi_buf);
        s.bi_buf = value >> Buf_size - s.bi_valid;
        s.bi_valid += length - Buf_size;
      } else {
        s.bi_buf |= value << s.bi_valid & 65535;
        s.bi_valid += length;
      }
    }
    function send_code(s, c, tree) {
      send_bits(
        s,
        tree[c * 2],
        tree[c * 2 + 1]
        /*.Len*/
      );
    }
    function bi_reverse(code, len) {
      var res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    }
    function bi_flush(s) {
      if (s.bi_valid === 16) {
        put_short(s, s.bi_buf);
        s.bi_buf = 0;
        s.bi_valid = 0;
      } else if (s.bi_valid >= 8) {
        s.pending_buf[s.pending++] = s.bi_buf & 255;
        s.bi_buf >>= 8;
        s.bi_valid -= 8;
      }
    }
    function gen_bitlen(s, desc) {
      var tree = desc.dyn_tree;
      var max_code = desc.max_code;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var extra = desc.stat_desc.extra_bits;
      var base = desc.stat_desc.extra_base;
      var max_length = desc.stat_desc.max_length;
      var h;
      var n, m;
      var bits;
      var xbits;
      var f;
      var overflow = 0;
      for (bits = 0; bits <= MAX_BITS; bits++) {
        s.bl_count[bits] = 0;
      }
      tree[s.heap[s.heap_max] * 2 + 1] = 0;
      for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n * 2 + 1] = bits;
        if (n > max_code) {
          continue;
        }
        s.bl_count[bits]++;
        xbits = 0;
        if (n >= base) {
          xbits = extra[n - base];
        }
        f = tree[n * 2];
        s.opt_len += f * (bits + xbits);
        if (has_stree) {
          s.static_len += f * (stree[n * 2 + 1] + xbits);
        }
      }
      if (overflow === 0) {
        return;
      }
      do {
        bits = max_length - 1;
        while (s.bl_count[bits] === 0) {
          bits--;
        }
        s.bl_count[bits]--;
        s.bl_count[bits + 1] += 2;
        s.bl_count[max_length]--;
        overflow -= 2;
      } while (overflow > 0);
      for (bits = max_length; bits !== 0; bits--) {
        n = s.bl_count[bits];
        while (n !== 0) {
          m = s.heap[--h];
          if (m > max_code) {
            continue;
          }
          if (tree[m * 2 + 1] !== bits) {
            s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
            tree[m * 2 + 1] = bits;
          }
          n--;
        }
      }
    }
    function gen_codes(tree, max_code, bl_count) {
      var next_code = new Array(MAX_BITS + 1);
      var code = 0;
      var bits;
      var n;
      for (bits = 1; bits <= MAX_BITS; bits++) {
        next_code[bits] = code = code + bl_count[bits - 1] << 1;
      }
      for (n = 0; n <= max_code; n++) {
        var len = tree[n * 2 + 1];
        if (len === 0) {
          continue;
        }
        tree[n * 2] = bi_reverse(next_code[len]++, len);
      }
    }
    function tr_static_init() {
      var n;
      var bits;
      var length;
      var code;
      var dist;
      var bl_count = new Array(MAX_BITS + 1);
      length = 0;
      for (code = 0; code < LENGTH_CODES - 1; code++) {
        base_length[code] = length;
        for (n = 0; n < 1 << extra_lbits[code]; n++) {
          _length_code[length++] = code;
        }
      }
      _length_code[length - 1] = code;
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;
        for (n = 0; n < 1 << extra_dbits[code]; n++) {
          _dist_code[dist++] = code;
        }
      }
      dist >>= 7;
      for (; code < D_CODES; code++) {
        base_dist[code] = dist << 7;
        for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
          _dist_code[256 + dist++] = code;
        }
      }
      for (bits = 0; bits <= MAX_BITS; bits++) {
        bl_count[bits] = 0;
      }
      n = 0;
      while (n <= 143) {
        static_ltree[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      while (n <= 255) {
        static_ltree[n * 2 + 1] = 9;
        n++;
        bl_count[9]++;
      }
      while (n <= 279) {
        static_ltree[n * 2 + 1] = 7;
        n++;
        bl_count[7]++;
      }
      while (n <= 287) {
        static_ltree[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      gen_codes(static_ltree, L_CODES + 1, bl_count);
      for (n = 0; n < D_CODES; n++) {
        static_dtree[n * 2 + 1] = 5;
        static_dtree[n * 2] = bi_reverse(n, 5);
      }
      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
    }
    function init_block(s) {
      var n;
      for (n = 0; n < L_CODES; n++) {
        s.dyn_ltree[n * 2] = 0;
      }
      for (n = 0; n < D_CODES; n++) {
        s.dyn_dtree[n * 2] = 0;
      }
      for (n = 0; n < BL_CODES; n++) {
        s.bl_tree[n * 2] = 0;
      }
      s.dyn_ltree[END_BLOCK * 2] = 1;
      s.opt_len = s.static_len = 0;
      s.last_lit = s.matches = 0;
    }
    function bi_windup(s) {
      if (s.bi_valid > 8) {
        put_short(s, s.bi_buf);
      } else if (s.bi_valid > 0) {
        s.pending_buf[s.pending++] = s.bi_buf;
      }
      s.bi_buf = 0;
      s.bi_valid = 0;
    }
    function copy_block(s, buf, len, header) {
      bi_windup(s);
      if (header) {
        put_short(s, len);
        put_short(s, ~len);
      }
      utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
      s.pending += len;
    }
    function smaller(tree, n, m, depth) {
      var _n2 = n * 2;
      var _m2 = m * 2;
      return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
    }
    function pqdownheap(s, tree, k) {
      var v = s.heap[k];
      var j = k << 1;
      while (j <= s.heap_len) {
        if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
          j++;
        }
        if (smaller(tree, v, s.heap[j], s.depth)) {
          break;
        }
        s.heap[k] = s.heap[j];
        k = j;
        j <<= 1;
      }
      s.heap[k] = v;
    }
    function compress_block(s, ltree, dtree) {
      var dist;
      var lc;
      var lx = 0;
      var code;
      var extra;
      if (s.last_lit !== 0) {
        do {
          dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
          lc = s.pending_buf[s.l_buf + lx];
          lx++;
          if (dist === 0) {
            send_code(s, lc, ltree);
          } else {
            code = _length_code[lc];
            send_code(s, code + LITERALS + 1, ltree);
            extra = extra_lbits[code];
            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s, lc, extra);
            }
            dist--;
            code = d_code(dist);
            send_code(s, code, dtree);
            extra = extra_dbits[code];
            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s, dist, extra);
            }
          }
        } while (lx < s.last_lit);
      }
      send_code(s, END_BLOCK, ltree);
    }
    function build_tree(s, desc) {
      var tree = desc.dyn_tree;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var elems = desc.stat_desc.elems;
      var n, m;
      var max_code = -1;
      var node;
      s.heap_len = 0;
      s.heap_max = HEAP_SIZE;
      for (n = 0; n < elems; n++) {
        if (tree[n * 2] !== 0) {
          s.heap[++s.heap_len] = max_code = n;
          s.depth[n] = 0;
        } else {
          tree[n * 2 + 1] = 0;
        }
      }
      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s.depth[node] = 0;
        s.opt_len--;
        if (has_stree) {
          s.static_len -= stree[node * 2 + 1];
        }
      }
      desc.max_code = max_code;
      for (n = s.heap_len >> 1; n >= 1; n--) {
        pqdownheap(s, tree, n);
      }
      node = elems;
      do {
        n = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[
          1
          /*SMALLEST*/
        ] = s.heap[s.heap_len--];
        pqdownheap(
          s,
          tree,
          1
          /*SMALLEST*/
        );
        m = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[--s.heap_max] = n;
        s.heap[--s.heap_max] = m;
        tree[node * 2] = tree[n * 2] + tree[m * 2];
        s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
        tree[n * 2 + 1] = tree[m * 2 + 1] = node;
        s.heap[
          1
          /*SMALLEST*/
        ] = node++;
        pqdownheap(
          s,
          tree,
          1
          /*SMALLEST*/
        );
      } while (s.heap_len >= 2);
      s.heap[--s.heap_max] = s.heap[
        1
        /*SMALLEST*/
      ];
      gen_bitlen(s, desc);
      gen_codes(tree, max_code, s.bl_count);
    }
    function scan_tree(s, tree, max_code) {
      var n;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1] = 65535;
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          s.bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            s.bl_tree[curlen * 2]++;
          }
          s.bl_tree[REP_3_6 * 2]++;
        } else if (count <= 10) {
          s.bl_tree[REPZ_3_10 * 2]++;
        } else {
          s.bl_tree[REPZ_11_138 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function send_tree(s, tree, max_code) {
      var n;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code(s, curlen, s.bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s, curlen, s.bl_tree);
            count--;
          }
          send_code(s, REP_3_6, s.bl_tree);
          send_bits(s, count - 3, 2);
        } else if (count <= 10) {
          send_code(s, REPZ_3_10, s.bl_tree);
          send_bits(s, count - 3, 3);
        } else {
          send_code(s, REPZ_11_138, s.bl_tree);
          send_bits(s, count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function build_bl_tree(s) {
      var max_blindex;
      scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
      scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
      build_tree(s, s.bl_desc);
      for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
        if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
          break;
        }
      }
      s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      return max_blindex;
    }
    function send_all_trees(s, lcodes, dcodes, blcodes) {
      var rank;
      send_bits(s, lcodes - 257, 5);
      send_bits(s, dcodes - 1, 5);
      send_bits(s, blcodes - 4, 4);
      for (rank = 0; rank < blcodes; rank++) {
        send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
      }
      send_tree(s, s.dyn_ltree, lcodes - 1);
      send_tree(s, s.dyn_dtree, dcodes - 1);
    }
    function detect_data_type(s) {
      var black_mask = 4093624447;
      var n;
      for (n = 0; n <= 31; n++, black_mask >>>= 1) {
        if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
          return Z_BINARY;
        }
      }
      if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
        return Z_TEXT;
      }
      for (n = 32; n < LITERALS; n++) {
        if (s.dyn_ltree[n * 2] !== 0) {
          return Z_TEXT;
        }
      }
      return Z_BINARY;
    }
    var static_init_done = false;
    function _tr_init(s) {
      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }
      s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
      s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
      s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
      s.bi_buf = 0;
      s.bi_valid = 0;
      init_block(s);
    }
    function _tr_stored_block(s, buf, stored_len, last) {
      send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
      copy_block(s, buf, stored_len, true);
    }
    function _tr_align(s) {
      send_bits(s, STATIC_TREES << 1, 3);
      send_code(s, END_BLOCK, static_ltree);
      bi_flush(s);
    }
    function _tr_flush_block(s, buf, stored_len, last) {
      var opt_lenb, static_lenb;
      var max_blindex = 0;
      if (s.level > 0) {
        if (s.strm.data_type === Z_UNKNOWN) {
          s.strm.data_type = detect_data_type(s);
        }
        build_tree(s, s.l_desc);
        build_tree(s, s.d_desc);
        max_blindex = build_bl_tree(s);
        opt_lenb = s.opt_len + 3 + 7 >>> 3;
        static_lenb = s.static_len + 3 + 7 >>> 3;
        if (static_lenb <= opt_lenb) {
          opt_lenb = static_lenb;
        }
      } else {
        opt_lenb = static_lenb = stored_len + 5;
      }
      if (stored_len + 4 <= opt_lenb && buf !== -1) {
        _tr_stored_block(s, buf, stored_len, last);
      } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
        send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s, static_ltree, static_dtree);
      } else {
        send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s, s.dyn_ltree, s.dyn_dtree);
      }
      init_block(s);
      if (last) {
        bi_windup(s);
      }
    }
    function _tr_tally(s, dist, lc) {
      s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
      s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
      s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
      s.last_lit++;
      if (dist === 0) {
        s.dyn_ltree[lc * 2]++;
      } else {
        s.matches++;
        dist--;
        s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
        s.dyn_dtree[d_code(dist) * 2]++;
      }
      return s.last_lit === s.lit_bufsize - 1;
    }
    exports._tr_init = _tr_init;
    exports._tr_stored_block = _tr_stored_block;
    exports._tr_flush_block = _tr_flush_block;
    exports._tr_tally = _tr_tally;
    exports._tr_align = _tr_align;
  }
});

// node_modules/pako/lib/zlib/adler32.js
var require_adler32 = __commonJS({
  "node_modules/pako/lib/zlib/adler32.js"(exports, module) {
    "use strict";
    function adler32(adler, buf, len, pos) {
      var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
      while (len !== 0) {
        n = len > 2e3 ? 2e3 : len;
        len -= n;
        do {
          s1 = s1 + buf[pos++] | 0;
          s2 = s2 + s1 | 0;
        } while (--n);
        s1 %= 65521;
        s2 %= 65521;
      }
      return s1 | s2 << 16 | 0;
    }
    module.exports = adler32;
  }
});

// node_modules/pako/lib/zlib/crc32.js
var require_crc322 = __commonJS({
  "node_modules/pako/lib/zlib/crc32.js"(exports, module) {
    "use strict";
    function makeTable() {
      var c, table = [];
      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
      }
      return table;
    }
    var crcTable = makeTable();
    function crc32(crc, buf, len, pos) {
      var t = crcTable, end = pos + len;
      crc ^= -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    }
    module.exports = crc32;
  }
});

// node_modules/pako/lib/zlib/messages.js
var require_messages = __commonJS({
  "node_modules/pako/lib/zlib/messages.js"(exports, module) {
    "use strict";
    module.exports = {
      2: "need dictionary",
      /* Z_NEED_DICT       2  */
      1: "stream end",
      /* Z_STREAM_END      1  */
      0: "",
      /* Z_OK              0  */
      "-1": "file error",
      /* Z_ERRNO         (-1) */
      "-2": "stream error",
      /* Z_STREAM_ERROR  (-2) */
      "-3": "data error",
      /* Z_DATA_ERROR    (-3) */
      "-4": "insufficient memory",
      /* Z_MEM_ERROR     (-4) */
      "-5": "buffer error",
      /* Z_BUF_ERROR     (-5) */
      "-6": "incompatible version"
      /* Z_VERSION_ERROR (-6) */
    };
  }
});

// node_modules/pako/lib/zlib/deflate.js
var require_deflate = __commonJS({
  "node_modules/pako/lib/zlib/deflate.js"(exports) {
    "use strict";
    var utils = require_common();
    var trees = require_trees();
    var adler32 = require_adler32();
    var crc32 = require_crc322();
    var msg = require_messages();
    var Z_NO_FLUSH = 0;
    var Z_PARTIAL_FLUSH = 1;
    var Z_FULL_FLUSH = 3;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_BUF_ERROR = -5;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_FILTERED = 1;
    var Z_HUFFMAN_ONLY = 2;
    var Z_RLE = 3;
    var Z_FIXED = 4;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_UNKNOWN = 2;
    var Z_DEFLATED = 8;
    var MAX_MEM_LEVEL = 9;
    var MAX_WBITS = 15;
    var DEF_MEM_LEVEL = 8;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
    var PRESET_DICT = 32;
    var INIT_STATE = 42;
    var EXTRA_STATE = 69;
    var NAME_STATE = 73;
    var COMMENT_STATE = 91;
    var HCRC_STATE = 103;
    var BUSY_STATE = 113;
    var FINISH_STATE = 666;
    var BS_NEED_MORE = 1;
    var BS_BLOCK_DONE = 2;
    var BS_FINISH_STARTED = 3;
    var BS_FINISH_DONE = 4;
    var OS_CODE = 3;
    function err(strm, errorCode) {
      strm.msg = msg[errorCode];
      return errorCode;
    }
    function rank(f) {
      return (f << 1) - (f > 4 ? 9 : 0);
    }
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    function flush_pending(strm) {
      var s = strm.state;
      var len = s.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) {
        return;
      }
      utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
      strm.next_out += len;
      s.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s.pending -= len;
      if (s.pending === 0) {
        s.pending_out = 0;
      }
    }
    function flush_block_only(s, last) {
      trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
      s.block_start = s.strstart;
      flush_pending(s.strm);
    }
    function put_byte(s, b) {
      s.pending_buf[s.pending++] = b;
    }
    function putShortMSB(s, b) {
      s.pending_buf[s.pending++] = b >>> 8 & 255;
      s.pending_buf[s.pending++] = b & 255;
    }
    function read_buf(strm, buf, start, size) {
      var len = strm.avail_in;
      if (len > size) {
        len = size;
      }
      if (len === 0) {
        return 0;
      }
      strm.avail_in -= len;
      utils.arraySet(buf, strm.input, strm.next_in, len, start);
      if (strm.state.wrap === 1) {
        strm.adler = adler32(strm.adler, buf, len, start);
      } else if (strm.state.wrap === 2) {
        strm.adler = crc32(strm.adler, buf, len, start);
      }
      strm.next_in += len;
      strm.total_in += len;
      return len;
    }
    function longest_match(s, cur_match) {
      var chain_length = s.max_chain_length;
      var scan = s.strstart;
      var match;
      var len;
      var best_len = s.prev_length;
      var nice_match = s.nice_match;
      var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
      var _win = s.window;
      var wmask = s.w_mask;
      var prev = s.prev;
      var strend = s.strstart + MAX_MATCH;
      var scan_end1 = _win[scan + best_len - 1];
      var scan_end = _win[scan + best_len];
      if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
      }
      if (nice_match > s.lookahead) {
        nice_match = s.lookahead;
      }
      do {
        match = cur_match;
        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
          continue;
        }
        scan += 2;
        match++;
        do {
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;
        if (len > best_len) {
          s.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1 = _win[scan + best_len - 1];
          scan_end = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
      if (best_len <= s.lookahead) {
        return best_len;
      }
      return s.lookahead;
    }
    function fill_window(s) {
      var _w_size = s.w_size;
      var p, n, m, more, str;
      do {
        more = s.window_size - s.lookahead - s.strstart;
        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
          utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
          s.match_start -= _w_size;
          s.strstart -= _w_size;
          s.block_start -= _w_size;
          n = s.hash_size;
          p = n;
          do {
            m = s.head[--p];
            s.head[p] = m >= _w_size ? m - _w_size : 0;
          } while (--n);
          n = _w_size;
          p = n;
          do {
            m = s.prev[--p];
            s.prev[p] = m >= _w_size ? m - _w_size : 0;
          } while (--n);
          more += _w_size;
        }
        if (s.strm.avail_in === 0) {
          break;
        }
        n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n;
        if (s.lookahead + s.insert >= MIN_MATCH) {
          str = s.strstart - s.insert;
          s.ins_h = s.window[str];
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
          while (s.insert) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
            s.insert--;
            if (s.lookahead + s.insert < MIN_MATCH) {
              break;
            }
          }
        }
      } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
    }
    function deflate_stored(s, flush) {
      var max_block_size = 65535;
      if (max_block_size > s.pending_buf_size - 5) {
        max_block_size = s.pending_buf_size - 5;
      }
      for (; ; ) {
        if (s.lookahead <= 1) {
          fill_window(s);
          if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        s.strstart += s.lookahead;
        s.lookahead = 0;
        var max_start = s.block_start + max_block_size;
        if (s.strstart === 0 || s.strstart >= max_start) {
          s.lookahead = s.strstart - max_start;
          s.strstart = max_start;
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.strstart > s.block_start) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_NEED_MORE;
    }
    function deflate_fast(s, flush) {
      var hash_head;
      var bflush;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH) {
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
        if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
          s.match_length = longest_match(s, hash_head);
        }
        if (s.match_length >= MIN_MATCH) {
          bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
            s.match_length--;
            do {
              s.strstart++;
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            } while (--s.match_length !== 0);
            s.strstart++;
          } else {
            s.strstart += s.match_length;
            s.match_length = 0;
            s.ins_h = s.window[s.strstart];
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
          }
        } else {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_slow(s, flush) {
      var hash_head;
      var bflush;
      var max_insert;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH) {
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH - 1;
        if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
          s.match_length = longest_match(s, hash_head);
          if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
            s.match_length = MIN_MATCH - 1;
          }
        }
        if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
          max_insert = s.strstart + s.lookahead - MIN_MATCH;
          bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
          s.lookahead -= s.prev_length - 1;
          s.prev_length -= 2;
          do {
            if (++s.strstart <= max_insert) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            }
          } while (--s.prev_length !== 0);
          s.match_available = 0;
          s.match_length = MIN_MATCH - 1;
          s.strstart++;
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        } else if (s.match_available) {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
          if (bflush) {
            flush_block_only(s, false);
          }
          s.strstart++;
          s.lookahead--;
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          s.match_available = 1;
          s.strstart++;
          s.lookahead--;
        }
      }
      if (s.match_available) {
        bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
        s.match_available = 0;
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_rle(s, flush) {
      var bflush;
      var prev;
      var scan, strend;
      var _win = s.window;
      for (; ; ) {
        if (s.lookahead <= MAX_MATCH) {
          fill_window(s);
          if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        s.match_length = 0;
        if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
          scan = s.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s.strstart + MAX_MATCH;
            do {
            } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
            s.match_length = MAX_MATCH - (strend - scan);
            if (s.match_length > s.lookahead) {
              s.match_length = s.lookahead;
            }
          }
        }
        if (s.match_length >= MIN_MATCH) {
          bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          s.strstart += s.match_length;
          s.match_length = 0;
        } else {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_huff(s, flush) {
      var bflush;
      for (; ; ) {
        if (s.lookahead === 0) {
          fill_window(s);
          if (s.lookahead === 0) {
            if (flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            break;
          }
        }
        s.match_length = 0;
        bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function Config(good_length, max_lazy, nice_length, max_chain, func) {
      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }
    var configuration_table;
    configuration_table = [
      /*      good lazy nice chain */
      new Config(0, 0, 0, 0, deflate_stored),
      /* 0 store only */
      new Config(4, 4, 8, 4, deflate_fast),
      /* 1 max speed, no lazy matches */
      new Config(4, 5, 16, 8, deflate_fast),
      /* 2 */
      new Config(4, 6, 32, 32, deflate_fast),
      /* 3 */
      new Config(4, 4, 16, 16, deflate_slow),
      /* 4 lazy matches */
      new Config(8, 16, 32, 32, deflate_slow),
      /* 5 */
      new Config(8, 16, 128, 128, deflate_slow),
      /* 6 */
      new Config(8, 32, 128, 256, deflate_slow),
      /* 7 */
      new Config(32, 128, 258, 1024, deflate_slow),
      /* 8 */
      new Config(32, 258, 258, 4096, deflate_slow)
      /* 9 max compression */
    ];
    function lm_init(s) {
      s.window_size = 2 * s.w_size;
      zero(s.head);
      s.max_lazy_match = configuration_table[s.level].max_lazy;
      s.good_match = configuration_table[s.level].good_length;
      s.nice_match = configuration_table[s.level].nice_length;
      s.max_chain_length = configuration_table[s.level].max_chain;
      s.strstart = 0;
      s.block_start = 0;
      s.lookahead = 0;
      s.insert = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      s.ins_h = 0;
    }
    function DeflateState() {
      this.strm = null;
      this.status = 0;
      this.pending_buf = null;
      this.pending_buf_size = 0;
      this.pending_out = 0;
      this.pending = 0;
      this.wrap = 0;
      this.gzhead = null;
      this.gzindex = 0;
      this.method = Z_DEFLATED;
      this.last_flush = -1;
      this.w_size = 0;
      this.w_bits = 0;
      this.w_mask = 0;
      this.window = null;
      this.window_size = 0;
      this.prev = null;
      this.head = null;
      this.ins_h = 0;
      this.hash_size = 0;
      this.hash_bits = 0;
      this.hash_mask = 0;
      this.hash_shift = 0;
      this.block_start = 0;
      this.match_length = 0;
      this.prev_match = 0;
      this.match_available = 0;
      this.strstart = 0;
      this.match_start = 0;
      this.lookahead = 0;
      this.prev_length = 0;
      this.max_chain_length = 0;
      this.max_lazy_match = 0;
      this.level = 0;
      this.strategy = 0;
      this.good_match = 0;
      this.nice_match = 0;
      this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
      this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
      this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);
      this.l_desc = null;
      this.d_desc = null;
      this.bl_desc = null;
      this.bl_count = new utils.Buf16(MAX_BITS + 1);
      this.heap = new utils.Buf16(2 * L_CODES + 1);
      zero(this.heap);
      this.heap_len = 0;
      this.heap_max = 0;
      this.depth = new utils.Buf16(2 * L_CODES + 1);
      zero(this.depth);
      this.l_buf = 0;
      this.lit_bufsize = 0;
      this.last_lit = 0;
      this.d_buf = 0;
      this.opt_len = 0;
      this.static_len = 0;
      this.matches = 0;
      this.insert = 0;
      this.bi_buf = 0;
      this.bi_valid = 0;
    }
    function deflateResetKeep(strm) {
      var s;
      if (!strm || !strm.state) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;
      s = strm.state;
      s.pending = 0;
      s.pending_out = 0;
      if (s.wrap < 0) {
        s.wrap = -s.wrap;
      }
      s.status = s.wrap ? INIT_STATE : BUSY_STATE;
      strm.adler = s.wrap === 2 ? 0 : 1;
      s.last_flush = Z_NO_FLUSH;
      trees._tr_init(s);
      return Z_OK;
    }
    function deflateReset(strm) {
      var ret = deflateResetKeep(strm);
      if (ret === Z_OK) {
        lm_init(strm.state);
      }
      return ret;
    }
    function deflateSetHeader(strm, head) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      if (strm.state.wrap !== 2) {
        return Z_STREAM_ERROR;
      }
      strm.state.gzhead = head;
      return Z_OK;
    }
    function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      var wrap = 1;
      if (level === Z_DEFAULT_COMPRESSION) {
        level = 6;
      }
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else if (windowBits > 15) {
        wrap = 2;
        windowBits -= 16;
      }
      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
        return err(strm, Z_STREAM_ERROR);
      }
      if (windowBits === 8) {
        windowBits = 9;
      }
      var s = new DeflateState();
      strm.state = s;
      s.strm = strm;
      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;
      s.hash_bits = memLevel + 7;
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
      s.window = new utils.Buf8(s.w_size * 2);
      s.head = new utils.Buf16(s.hash_size);
      s.prev = new utils.Buf16(s.w_size);
      s.lit_bufsize = 1 << memLevel + 6;
      s.pending_buf_size = s.lit_bufsize * 4;
      s.pending_buf = new utils.Buf8(s.pending_buf_size);
      s.d_buf = 1 * s.lit_bufsize;
      s.l_buf = (1 + 2) * s.lit_bufsize;
      s.level = level;
      s.strategy = strategy;
      s.method = method;
      return deflateReset(strm);
    }
    function deflateInit(strm, level) {
      return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    }
    function deflate(strm, flush) {
      var old_flush, s;
      var beg, val;
      if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
      }
      s = strm.state;
      if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
        return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
      }
      s.strm = strm;
      old_flush = s.last_flush;
      s.last_flush = flush;
      if (s.status === INIT_STATE) {
        if (s.wrap === 2) {
          strm.adler = 0;
          put_byte(s, 31);
          put_byte(s, 139);
          put_byte(s, 8);
          if (!s.gzhead) {
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, OS_CODE);
            s.status = BUSY_STATE;
          } else {
            put_byte(
              s,
              (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
            );
            put_byte(s, s.gzhead.time & 255);
            put_byte(s, s.gzhead.time >> 8 & 255);
            put_byte(s, s.gzhead.time >> 16 & 255);
            put_byte(s, s.gzhead.time >> 24 & 255);
            put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
            put_byte(s, s.gzhead.os & 255);
            if (s.gzhead.extra && s.gzhead.extra.length) {
              put_byte(s, s.gzhead.extra.length & 255);
              put_byte(s, s.gzhead.extra.length >> 8 & 255);
            }
            if (s.gzhead.hcrc) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
            }
            s.gzindex = 0;
            s.status = EXTRA_STATE;
          }
        } else {
          var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
          var level_flags = -1;
          if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
            level_flags = 0;
          } else if (s.level < 6) {
            level_flags = 1;
          } else if (s.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }
          header |= level_flags << 6;
          if (s.strstart !== 0) {
            header |= PRESET_DICT;
          }
          header += 31 - header % 31;
          s.status = BUSY_STATE;
          putShortMSB(s, header);
          if (s.strstart !== 0) {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 65535);
          }
          strm.adler = 1;
        }
      }
      if (s.status === EXTRA_STATE) {
        if (s.gzhead.extra) {
          beg = s.pending;
          while (s.gzindex < (s.gzhead.extra.length & 65535)) {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                break;
              }
            }
            put_byte(s, s.gzhead.extra[s.gzindex] & 255);
            s.gzindex++;
          }
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (s.gzindex === s.gzhead.extra.length) {
            s.gzindex = 0;
            s.status = NAME_STATE;
          }
        } else {
          s.status = NAME_STATE;
        }
      }
      if (s.status === NAME_STATE) {
        if (s.gzhead.name) {
          beg = s.pending;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.gzindex = 0;
            s.status = COMMENT_STATE;
          }
        } else {
          s.status = COMMENT_STATE;
        }
      }
      if (s.status === COMMENT_STATE) {
        if (s.gzhead.comment) {
          beg = s.pending;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.status = HCRC_STATE;
          }
        } else {
          s.status = HCRC_STATE;
        }
      }
      if (s.status === HCRC_STATE) {
        if (s.gzhead.hcrc) {
          if (s.pending + 2 > s.pending_buf_size) {
            flush_pending(strm);
          }
          if (s.pending + 2 <= s.pending_buf_size) {
            put_byte(s, strm.adler & 255);
            put_byte(s, strm.adler >> 8 & 255);
            strm.adler = 0;
            s.status = BUSY_STATE;
          }
        } else {
          s.status = BUSY_STATE;
        }
      }
      if (s.pending !== 0) {
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK;
        }
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
        return err(strm, Z_BUF_ERROR);
      }
      if (s.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR);
      }
      if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
        var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s.last_flush = -1;
          }
          return Z_OK;
        }
        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            trees._tr_align(s);
          } else if (flush !== Z_BLOCK) {
            trees._tr_stored_block(s, 0, 0, false);
            if (flush === Z_FULL_FLUSH) {
              zero(s.head);
              if (s.lookahead === 0) {
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
              }
            }
          }
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK;
          }
        }
      }
      if (flush !== Z_FINISH) {
        return Z_OK;
      }
      if (s.wrap <= 0) {
        return Z_STREAM_END;
      }
      if (s.wrap === 2) {
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        put_byte(s, strm.adler >> 16 & 255);
        put_byte(s, strm.adler >> 24 & 255);
        put_byte(s, strm.total_in & 255);
        put_byte(s, strm.total_in >> 8 & 255);
        put_byte(s, strm.total_in >> 16 & 255);
        put_byte(s, strm.total_in >> 24 & 255);
      } else {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      flush_pending(strm);
      if (s.wrap > 0) {
        s.wrap = -s.wrap;
      }
      return s.pending !== 0 ? Z_OK : Z_STREAM_END;
    }
    function deflateEnd(strm) {
      var status;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      status = strm.state.status;
      if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.state = null;
      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    }
    function deflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;
      var s;
      var str, n;
      var wrap;
      var avail;
      var next;
      var input;
      var tmpDict;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      s = strm.state;
      wrap = s.wrap;
      if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
        return Z_STREAM_ERROR;
      }
      if (wrap === 1) {
        strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
      }
      s.wrap = 0;
      if (dictLength >= s.w_size) {
        if (wrap === 0) {
          zero(s.head);
          s.strstart = 0;
          s.block_start = 0;
          s.insert = 0;
        }
        tmpDict = new utils.Buf8(s.w_size);
        utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
        dictionary = tmpDict;
        dictLength = s.w_size;
      }
      avail = strm.avail_in;
      next = strm.next_in;
      input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s);
      while (s.lookahead >= MIN_MATCH) {
        str = s.strstart;
        n = s.lookahead - (MIN_MATCH - 1);
        do {
          s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
          s.prev[str & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str;
          str++;
        } while (--n);
        s.strstart = str;
        s.lookahead = MIN_MATCH - 1;
        fill_window(s);
      }
      s.strstart += s.lookahead;
      s.block_start = s.strstart;
      s.insert = s.lookahead;
      s.lookahead = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s.wrap = wrap;
      return Z_OK;
    }
    exports.deflateInit = deflateInit;
    exports.deflateInit2 = deflateInit2;
    exports.deflateReset = deflateReset;
    exports.deflateResetKeep = deflateResetKeep;
    exports.deflateSetHeader = deflateSetHeader;
    exports.deflate = deflate;
    exports.deflateEnd = deflateEnd;
    exports.deflateSetDictionary = deflateSetDictionary;
    exports.deflateInfo = "pako deflate (from Nodeca project)";
  }
});

// node_modules/pako/lib/utils/strings.js
var require_strings = __commonJS({
  "node_modules/pako/lib/utils/strings.js"(exports) {
    "use strict";
    var utils = require_common();
    var STR_APPLY_OK = true;
    var STR_APPLY_UIA_OK = true;
    try {
      String.fromCharCode.apply(null, [0]);
    } catch (__) {
      STR_APPLY_OK = false;
    }
    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
      STR_APPLY_UIA_OK = false;
    }
    var _utf8len = new utils.Buf8(256);
    for (q = 0; q < 256; q++) {
      _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }
    var q;
    _utf8len[254] = _utf8len[254] = 1;
    exports.string2buf = function(str) {
      var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      buf = new utils.Buf8(buf_len);
      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i++] = c;
        } else if (c < 2048) {
          buf[i++] = 192 | c >>> 6;
          buf[i++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i++] = 224 | c >>> 12;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        } else {
          buf[i++] = 240 | c >>> 18;
          buf[i++] = 128 | c >>> 12 & 63;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        }
      }
      return buf;
    };
    function buf2binstring(buf, len) {
      if (len < 65534) {
        if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
          return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
        }
      }
      var result = "";
      for (var i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }
      return result;
    }
    exports.buf2binstring = function(buf) {
      return buf2binstring(buf, buf.length);
    };
    exports.binstring2buf = function(str) {
      var buf = new utils.Buf8(str.length);
      for (var i = 0, len = buf.length; i < len; i++) {
        buf[i] = str.charCodeAt(i);
      }
      return buf;
    };
    exports.buf2string = function(buf, max) {
      var i, out, c, c_len;
      var len = max || buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i = 0; i < len; ) {
        c = buf[i++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i < len) {
          c = c << 6 | buf[i++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      return buf2binstring(utf16buf, out);
    };
    exports.utf8border = function(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
  }
});

// node_modules/pako/lib/zlib/zstream.js
var require_zstream = __commonJS({
  "node_modules/pako/lib/zlib/zstream.js"(exports, module) {
    "use strict";
    function ZStream() {
      this.input = null;
      this.next_in = 0;
      this.avail_in = 0;
      this.total_in = 0;
      this.output = null;
      this.next_out = 0;
      this.avail_out = 0;
      this.total_out = 0;
      this.msg = "";
      this.state = null;
      this.data_type = 2;
      this.adler = 0;
    }
    module.exports = ZStream;
  }
});

// node_modules/pako/lib/deflate.js
var require_deflate2 = __commonJS({
  "node_modules/pako/lib/deflate.js"(exports) {
    "use strict";
    var zlib_deflate = require_deflate();
    var utils = require_common();
    var strings = require_strings();
    var msg = require_messages();
    var ZStream = require_zstream();
    var toString = Object.prototype.toString;
    var Z_NO_FLUSH = 0;
    var Z_FINISH = 4;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_SYNC_FLUSH = 2;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_DEFLATED = 8;
    function Deflate(options) {
      if (!(this instanceof Deflate)) return new Deflate(options);
      this.options = utils.assign({
        level: Z_DEFAULT_COMPRESSION,
        method: Z_DEFLATED,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY,
        to: ""
      }, options || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits > 0) {
        opt.windowBits = -opt.windowBits;
      } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
        opt.windowBits += 16;
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      var status = zlib_deflate.deflateInit2(
        this.strm,
        opt.level,
        opt.method,
        opt.windowBits,
        opt.memLevel,
        opt.strategy
      );
      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }
      if (opt.header) {
        zlib_deflate.deflateSetHeader(this.strm, opt.header);
      }
      if (opt.dictionary) {
        var dict;
        if (typeof opt.dictionary === "string") {
          dict = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }
        status = zlib_deflate.deflateSetDictionary(this.strm, dict);
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        this._dict_set = true;
      }
    }
    Deflate.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var status, _mode;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.string2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_deflate.deflate(strm, _mode);
        if (status !== Z_STREAM_END && status !== Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
          if (this.options.to === "string") {
            this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
          } else {
            this.onData(utils.shrinkBuf(strm.output, strm.next_out));
          }
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
      if (_mode === Z_FINISH) {
        status = zlib_deflate.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK;
      }
      if (_mode === Z_SYNC_FLUSH) {
        this.onEnd(Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Deflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Deflate.prototype.onEnd = function(status) {
      if (status === Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function deflate(input, options) {
      var deflator = new Deflate(options);
      deflator.push(input, true);
      if (deflator.err) {
        throw deflator.msg || msg[deflator.err];
      }
      return deflator.result;
    }
    function deflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return deflate(input, options);
    }
    function gzip(input, options) {
      options = options || {};
      options.gzip = true;
      return deflate(input, options);
    }
    exports.Deflate = Deflate;
    exports.deflate = deflate;
    exports.deflateRaw = deflateRaw;
    exports.gzip = gzip;
  }
});

// node_modules/pako/lib/zlib/inffast.js
var require_inffast = __commonJS({
  "node_modules/pako/lib/zlib/inffast.js"(exports, module) {
    "use strict";
    var BAD = 30;
    var TYPE = 12;
    module.exports = function inflate_fast(strm, start) {
      var state;
      var _in;
      var last;
      var _out;
      var beg;
      var end;
      var dmax;
      var wsize;
      var whave;
      var wnext;
      var s_window;
      var hold;
      var bits;
      var lcode;
      var dcode;
      var lmask;
      var dmask;
      var here;
      var op;
      var len;
      var dist;
      var from;
      var from_source;
      var input, output;
      state = strm.state;
      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257);
      dmax = state.dmax;
      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;
      top:
        do {
          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }
          here = lcode[hold & lmask];
          dolen:
            for (; ; ) {
              op = here >>> 24;
              hold >>>= op;
              bits -= op;
              op = here >>> 16 & 255;
              if (op === 0) {
                output[_out++] = here & 65535;
              } else if (op & 16) {
                len = here & 65535;
                op &= 15;
                if (op) {
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  len += hold & (1 << op) - 1;
                  hold >>>= op;
                  bits -= op;
                }
                if (bits < 15) {
                  hold += input[_in++] << bits;
                  bits += 8;
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                here = dcode[hold & dmask];
                dodist:
                  for (; ; ) {
                    op = here >>> 24;
                    hold >>>= op;
                    bits -= op;
                    op = here >>> 16 & 255;
                    if (op & 16) {
                      dist = here & 65535;
                      op &= 15;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                        }
                      }
                      dist += hold & (1 << op) - 1;
                      if (dist > dmax) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD;
                        break top;
                      }
                      hold >>>= op;
                      bits -= op;
                      op = _out - beg;
                      if (dist > op) {
                        op = dist - op;
                        if (op > whave) {
                          if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                          }
                        }
                        from = 0;
                        from_source = s_window;
                        if (wnext === 0) {
                          from += wsize - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        } else if (wnext < op) {
                          from += wsize + wnext - op;
                          op -= wnext;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = 0;
                            if (wnext < len) {
                              op = wnext;
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                        } else {
                          from += wnext - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        }
                        while (len > 2) {
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          len -= 3;
                        }
                        if (len) {
                          output[_out++] = from_source[from++];
                          if (len > 1) {
                            output[_out++] = from_source[from++];
                          }
                        }
                      } else {
                        from = _out - dist;
                        do {
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          len -= 3;
                        } while (len > 2);
                        if (len) {
                          output[_out++] = output[from++];
                          if (len > 1) {
                            output[_out++] = output[from++];
                          }
                        }
                      }
                    } else if ((op & 64) === 0) {
                      here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                      continue dodist;
                    } else {
                      strm.msg = "invalid distance code";
                      state.mode = BAD;
                      break top;
                    }
                    break;
                  }
              } else if ((op & 64) === 0) {
                here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
              } else if (op & 32) {
                state.mode = TYPE;
                break top;
              } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break top;
              }
              break;
            }
        } while (_in < last && _out < end);
      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;
      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
      strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
      state.hold = hold;
      state.bits = bits;
      return;
    };
  }
});

// node_modules/pako/lib/zlib/inftrees.js
var require_inftrees = __commonJS({
  "node_modules/pako/lib/zlib/inftrees.js"(exports, module) {
    "use strict";
    var utils = require_common();
    var MAXBITS = 15;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var lbase = [
      /* Length codes 257..285 base */
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      13,
      15,
      17,
      19,
      23,
      27,
      31,
      35,
      43,
      51,
      59,
      67,
      83,
      99,
      115,
      131,
      163,
      195,
      227,
      258,
      0,
      0
    ];
    var lext = [
      /* Length codes 257..285 extra */
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      17,
      17,
      17,
      17,
      18,
      18,
      18,
      18,
      19,
      19,
      19,
      19,
      20,
      20,
      20,
      20,
      21,
      21,
      21,
      21,
      16,
      72,
      78
    ];
    var dbase = [
      /* Distance codes 0..29 base */
      1,
      2,
      3,
      4,
      5,
      7,
      9,
      13,
      17,
      25,
      33,
      49,
      65,
      97,
      129,
      193,
      257,
      385,
      513,
      769,
      1025,
      1537,
      2049,
      3073,
      4097,
      6145,
      8193,
      12289,
      16385,
      24577,
      0,
      0
    ];
    var dext = [
      /* Distance codes 0..29 extra */
      16,
      16,
      16,
      16,
      17,
      17,
      18,
      18,
      19,
      19,
      20,
      20,
      21,
      21,
      22,
      22,
      23,
      23,
      24,
      24,
      25,
      25,
      26,
      26,
      27,
      27,
      28,
      28,
      29,
      29,
      64,
      64
    ];
    module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
      var bits = opts.bits;
      var len = 0;
      var sym = 0;
      var min = 0, max = 0;
      var root = 0;
      var curr = 0;
      var drop = 0;
      var left = 0;
      var used = 0;
      var huff = 0;
      var incr;
      var fill2;
      var low;
      var mask;
      var next;
      var base = null;
      var base_index = 0;
      var end;
      var count = new utils.Buf16(MAXBITS + 1);
      var offs = new utils.Buf16(MAXBITS + 1);
      var extra = null;
      var extra_index = 0;
      var here_bits, here_op, here_val;
      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }
      root = bits;
      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) {
          break;
        }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) {
          break;
        }
      }
      if (root < min) {
        root = min;
      }
      left = 1;
      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }
      }
      if (left > 0 && (type === CODES || max !== 1)) {
        return -1;
      }
      offs[1] = 0;
      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }
      if (type === CODES) {
        base = extra = work;
        end = 19;
      } else if (type === LENS) {
        base = lbase;
        base_index -= 257;
        extra = lext;
        extra_index -= 257;
        end = 256;
      } else {
        base = dbase;
        extra = dext;
        end = -1;
      }
      huff = 0;
      sym = 0;
      len = min;
      next = table_index;
      curr = root;
      drop = 0;
      low = -1;
      used = 1 << root;
      mask = used - 1;
      if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
        return 1;
      }
      for (; ; ) {
        here_bits = len - drop;
        if (work[sym] < end) {
          here_op = 0;
          here_val = work[sym];
        } else if (work[sym] > end) {
          here_op = extra[extra_index + work[sym]];
          here_val = base[base_index + work[sym]];
        } else {
          here_op = 32 + 64;
          here_val = 0;
        }
        incr = 1 << len - drop;
        fill2 = 1 << curr;
        min = fill2;
        do {
          fill2 -= incr;
          table[next + (huff >> drop) + fill2] = here_bits << 24 | here_op << 16 | here_val | 0;
        } while (fill2 !== 0);
        incr = 1 << len - 1;
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }
        sym++;
        if (--count[len] === 0) {
          if (len === max) {
            break;
          }
          len = lens[lens_index + work[sym]];
        }
        if (len > root && (huff & mask) !== low) {
          if (drop === 0) {
            drop = root;
          }
          next += min;
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) {
              break;
            }
            curr++;
            left <<= 1;
          }
          used += 1 << curr;
          if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
            return 1;
          }
          low = huff & mask;
          table[low] = root << 24 | curr << 16 | next - table_index | 0;
        }
      }
      if (huff !== 0) {
        table[next + huff] = len - drop << 24 | 64 << 16 | 0;
      }
      opts.bits = root;
      return 0;
    };
  }
});

// node_modules/pako/lib/zlib/inflate.js
var require_inflate = __commonJS({
  "node_modules/pako/lib/zlib/inflate.js"(exports) {
    "use strict";
    var utils = require_common();
    var adler32 = require_adler32();
    var crc32 = require_crc322();
    var inflate_fast = require_inffast();
    var inflate_table = require_inftrees();
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_TREES = 6;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_NEED_DICT = 2;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_MEM_ERROR = -4;
    var Z_BUF_ERROR = -5;
    var Z_DEFLATED = 8;
    var HEAD = 1;
    var FLAGS = 2;
    var TIME = 3;
    var OS = 4;
    var EXLEN = 5;
    var EXTRA = 6;
    var NAME = 7;
    var COMMENT = 8;
    var HCRC = 9;
    var DICTID = 10;
    var DICT = 11;
    var TYPE = 12;
    var TYPEDO = 13;
    var STORED = 14;
    var COPY_ = 15;
    var COPY = 16;
    var TABLE = 17;
    var LENLENS = 18;
    var CODELENS = 19;
    var LEN_ = 20;
    var LEN = 21;
    var LENEXT = 22;
    var DIST = 23;
    var DISTEXT = 24;
    var MATCH = 25;
    var LIT = 26;
    var CHECK = 27;
    var LENGTH = 28;
    var DONE = 29;
    var BAD = 30;
    var MEM = 31;
    var SYNC = 32;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var MAX_WBITS = 15;
    var DEF_WBITS = MAX_WBITS;
    function zswap32(q) {
      return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
    }
    function InflateState() {
      this.mode = 0;
      this.last = false;
      this.wrap = 0;
      this.havedict = false;
      this.flags = 0;
      this.dmax = 0;
      this.check = 0;
      this.total = 0;
      this.head = null;
      this.wbits = 0;
      this.wsize = 0;
      this.whave = 0;
      this.wnext = 0;
      this.window = null;
      this.hold = 0;
      this.bits = 0;
      this.length = 0;
      this.offset = 0;
      this.extra = 0;
      this.lencode = null;
      this.distcode = null;
      this.lenbits = 0;
      this.distbits = 0;
      this.ncode = 0;
      this.nlen = 0;
      this.ndist = 0;
      this.have = 0;
      this.next = null;
      this.lens = new utils.Buf16(320);
      this.work = new utils.Buf16(288);
      this.lendyn = null;
      this.distdyn = null;
      this.sane = 0;
      this.back = 0;
      this.was = 0;
    }
    function inflateResetKeep(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = "";
      if (state.wrap) {
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.dmax = 32768;
      state.head = null;
      state.hold = 0;
      state.bits = 0;
      state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
      state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
      state.sane = 1;
      state.back = -1;
      return Z_OK;
    }
    function inflateReset(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);
    }
    function inflateReset2(strm, windowBits) {
      var wrap;
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    }
    function inflateInit2(strm, windowBits) {
      var ret;
      var state;
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      state = new InflateState();
      strm.state = state;
      state.window = null;
      ret = inflateReset2(strm, windowBits);
      if (ret !== Z_OK) {
        strm.state = null;
      }
      return ret;
    }
    function inflateInit(strm) {
      return inflateInit2(strm, DEF_WBITS);
    }
    var virgin = true;
    var lenfix;
    var distfix;
    function fixedtables(state) {
      if (virgin) {
        var sym;
        lenfix = new utils.Buf32(512);
        distfix = new utils.Buf32(32);
        sym = 0;
        while (sym < 144) {
          state.lens[sym++] = 8;
        }
        while (sym < 256) {
          state.lens[sym++] = 9;
        }
        while (sym < 280) {
          state.lens[sym++] = 7;
        }
        while (sym < 288) {
          state.lens[sym++] = 8;
        }
        inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
        sym = 0;
        while (sym < 32) {
          state.lens[sym++] = 5;
        }
        inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
        virgin = false;
      }
      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    }
    function updatewindow(strm, src, end, copy) {
      var dist;
      var state = strm.state;
      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new utils.Buf8(state.wsize);
      }
      if (copy >= state.wsize) {
        utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
        state.wnext = 0;
        state.whave = state.wsize;
      } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        utils.arraySet(state.window, src, end - copy, dist, state.wnext);
        copy -= dist;
        if (copy) {
          utils.arraySet(state.window, src, end - copy, copy, 0);
          state.wnext = copy;
          state.whave = state.wsize;
        } else {
          state.wnext += dist;
          if (state.wnext === state.wsize) {
            state.wnext = 0;
          }
          if (state.whave < state.wsize) {
            state.whave += dist;
          }
        }
      }
      return 0;
    }
    function inflate(strm, flush) {
      var state;
      var input, output;
      var next;
      var put;
      var have, left;
      var hold;
      var bits;
      var _in, _out;
      var copy;
      var from;
      var from_source;
      var here = 0;
      var here_bits, here_op, here_val;
      var last_bits, last_op, last_val;
      var len;
      var ret;
      var hbuf = new utils.Buf8(4);
      var opts;
      var n;
      var order = (
        /* permutation of code lengths */
        [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
      );
      if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.mode === TYPE) {
        state.mode = TYPEDO;
      }
      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits;
      _in = have;
      _out = left;
      ret = Z_OK;
      inf_leave:
        for (; ; ) {
          switch (state.mode) {
            case HEAD:
              if (state.wrap === 0) {
                state.mode = TYPEDO;
                break;
              }
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 2 && hold === 35615) {
                state.check = 0;
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
                hold = 0;
                bits = 0;
                state.mode = FLAGS;
                break;
              }
              state.flags = 0;
              if (state.head) {
                state.head.done = false;
              }
              if (!(state.wrap & 1) || /* check if zlib header allowed */
              (((hold & 255) << 8) + (hold >> 8)) % 31) {
                strm.msg = "incorrect header check";
                state.mode = BAD;
                break;
              }
              if ((hold & 15) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              hold >>>= 4;
              bits -= 4;
              len = (hold & 15) + 8;
              if (state.wbits === 0) {
                state.wbits = len;
              } else if (len > state.wbits) {
                strm.msg = "invalid window size";
                state.mode = BAD;
                break;
              }
              state.dmax = 1 << len;
              strm.adler = state.check = 1;
              state.mode = hold & 512 ? DICTID : TYPE;
              hold = 0;
              bits = 0;
              break;
            case FLAGS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.flags = hold;
              if ((state.flags & 255) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              if (state.flags & 57344) {
                strm.msg = "unknown header flags set";
                state.mode = BAD;
                break;
              }
              if (state.head) {
                state.head.text = hold >> 8 & 1;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = TIME;
            case TIME:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.time = hold;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                hbuf[2] = hold >>> 16 & 255;
                hbuf[3] = hold >>> 24 & 255;
                state.check = crc32(state.check, hbuf, 4, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = OS;
            case OS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.xflags = hold & 255;
                state.head.os = hold >> 8;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = EXLEN;
            case EXLEN:
              if (state.flags & 1024) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length = hold;
                if (state.head) {
                  state.head.extra_len = hold;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
              } else if (state.head) {
                state.head.extra = null;
              }
              state.mode = EXTRA;
            case EXTRA:
              if (state.flags & 1024) {
                copy = state.length;
                if (copy > have) {
                  copy = have;
                }
                if (copy) {
                  if (state.head) {
                    len = state.head.extra_len - state.length;
                    if (!state.head.extra) {
                      state.head.extra = new Array(state.head.extra_len);
                    }
                    utils.arraySet(
                      state.head.extra,
                      input,
                      next,
                      // extra field is limited to 65536 bytes
                      // - no need for additional size check
                      copy,
                      /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                      len
                    );
                  }
                  if (state.flags & 512) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  state.length -= copy;
                }
                if (state.length) {
                  break inf_leave;
                }
              }
              state.length = 0;
              state.mode = NAME;
            case NAME:
              if (state.flags & 2048) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.name += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.name = null;
              }
              state.length = 0;
              state.mode = COMMENT;
            case COMMENT:
              if (state.flags & 4096) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.comment += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.comment = null;
              }
              state.mode = HCRC;
            case HCRC:
              if (state.flags & 512) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.check & 65535)) {
                  strm.msg = "header crc mismatch";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              if (state.head) {
                state.head.hcrc = state.flags >> 9 & 1;
                state.head.done = true;
              }
              strm.adler = state.check = 0;
              state.mode = TYPE;
              break;
            case DICTID:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              strm.adler = state.check = zswap32(hold);
              hold = 0;
              bits = 0;
              state.mode = DICT;
            case DICT:
              if (state.havedict === 0) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                return Z_NEED_DICT;
              }
              strm.adler = state.check = 1;
              state.mode = TYPE;
            case TYPE:
              if (flush === Z_BLOCK || flush === Z_TREES) {
                break inf_leave;
              }
            case TYPEDO:
              if (state.last) {
                hold >>>= bits & 7;
                bits -= bits & 7;
                state.mode = CHECK;
                break;
              }
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.last = hold & 1;
              hold >>>= 1;
              bits -= 1;
              switch (hold & 3) {
                case 0:
                  state.mode = STORED;
                  break;
                case 1:
                  fixedtables(state);
                  state.mode = LEN_;
                  if (flush === Z_TREES) {
                    hold >>>= 2;
                    bits -= 2;
                    break inf_leave;
                  }
                  break;
                case 2:
                  state.mode = TABLE;
                  break;
                case 3:
                  strm.msg = "invalid block type";
                  state.mode = BAD;
              }
              hold >>>= 2;
              bits -= 2;
              break;
            case STORED:
              hold >>>= bits & 7;
              bits -= bits & 7;
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                strm.msg = "invalid stored block lengths";
                state.mode = BAD;
                break;
              }
              state.length = hold & 65535;
              hold = 0;
              bits = 0;
              state.mode = COPY_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            case COPY_:
              state.mode = COPY;
            case COPY:
              copy = state.length;
              if (copy) {
                if (copy > have) {
                  copy = have;
                }
                if (copy > left) {
                  copy = left;
                }
                if (copy === 0) {
                  break inf_leave;
                }
                utils.arraySet(output, input, next, copy, put);
                have -= copy;
                next += copy;
                left -= copy;
                put += copy;
                state.length -= copy;
                break;
              }
              state.mode = TYPE;
              break;
            case TABLE:
              while (bits < 14) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.nlen = (hold & 31) + 257;
              hold >>>= 5;
              bits -= 5;
              state.ndist = (hold & 31) + 1;
              hold >>>= 5;
              bits -= 5;
              state.ncode = (hold & 15) + 4;
              hold >>>= 4;
              bits -= 4;
              if (state.nlen > 286 || state.ndist > 30) {
                strm.msg = "too many length or distance symbols";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = LENLENS;
            case LENLENS:
              while (state.have < state.ncode) {
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.lens[order[state.have++]] = hold & 7;
                hold >>>= 3;
                bits -= 3;
              }
              while (state.have < 19) {
                state.lens[order[state.have++]] = 0;
              }
              state.lencode = state.lendyn;
              state.lenbits = 7;
              opts = { bits: state.lenbits };
              ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid code lengths set";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = CODELENS;
            case CODELENS:
              while (state.have < state.nlen + state.ndist) {
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_val < 16) {
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.lens[state.have++] = here_val;
                } else {
                  if (here_val === 16) {
                    n = here_bits + 2;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    if (state.have === 0) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    len = state.lens[state.have - 1];
                    copy = 3 + (hold & 3);
                    hold >>>= 2;
                    bits -= 2;
                  } else if (here_val === 17) {
                    n = here_bits + 3;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 3 + (hold & 7);
                    hold >>>= 3;
                    bits -= 3;
                  } else {
                    n = here_bits + 7;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 11 + (hold & 127);
                    hold >>>= 7;
                    bits -= 7;
                  }
                  if (state.have + copy > state.nlen + state.ndist) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  while (copy--) {
                    state.lens[state.have++] = len;
                  }
                }
              }
              if (state.mode === BAD) {
                break;
              }
              if (state.lens[256] === 0) {
                strm.msg = "invalid code -- missing end-of-block";
                state.mode = BAD;
                break;
              }
              state.lenbits = 9;
              opts = { bits: state.lenbits };
              ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid literal/lengths set";
                state.mode = BAD;
                break;
              }
              state.distbits = 6;
              state.distcode = state.distdyn;
              opts = { bits: state.distbits };
              ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
              state.distbits = opts.bits;
              if (ret) {
                strm.msg = "invalid distances set";
                state.mode = BAD;
                break;
              }
              state.mode = LEN_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            case LEN_:
              state.mode = LEN;
            case LEN:
              if (have >= 6 && left >= 258) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                inflate_fast(strm, _out);
                put = strm.next_out;
                output = strm.output;
                left = strm.avail_out;
                next = strm.next_in;
                input = strm.input;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                if (state.mode === TYPE) {
                  state.back = -1;
                }
                break;
              }
              state.back = 0;
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (here_op && (here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              state.length = here_val;
              if (here_op === 0) {
                state.mode = LIT;
                break;
              }
              if (here_op & 32) {
                state.back = -1;
                state.mode = TYPE;
                break;
              }
              if (here_op & 64) {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break;
              }
              state.extra = here_op & 15;
              state.mode = LENEXT;
            case LENEXT:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              state.was = state.length;
              state.mode = DIST;
            case DIST:
              for (; ; ) {
                here = state.distcode[hold & (1 << state.distbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              if (here_op & 64) {
                strm.msg = "invalid distance code";
                state.mode = BAD;
                break;
              }
              state.offset = here_val;
              state.extra = here_op & 15;
              state.mode = DISTEXT;
            case DISTEXT:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.offset += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              if (state.offset > state.dmax) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
              state.mode = MATCH;
            case MATCH:
              if (left === 0) {
                break inf_leave;
              }
              copy = _out - left;
              if (state.offset > copy) {
                copy = state.offset - copy;
                if (copy > state.whave) {
                  if (state.sane) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                  }
                }
                if (copy > state.wnext) {
                  copy -= state.wnext;
                  from = state.wsize - copy;
                } else {
                  from = state.wnext - copy;
                }
                if (copy > state.length) {
                  copy = state.length;
                }
                from_source = state.window;
              } else {
                from_source = output;
                from = put - state.offset;
                copy = state.length;
              }
              if (copy > left) {
                copy = left;
              }
              left -= copy;
              state.length -= copy;
              do {
                output[put++] = from_source[from++];
              } while (--copy);
              if (state.length === 0) {
                state.mode = LEN;
              }
              break;
            case LIT:
              if (left === 0) {
                break inf_leave;
              }
              output[put++] = state.length;
              left--;
              state.mode = LEN;
              break;
            case CHECK:
              if (state.wrap) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold |= input[next++] << bits;
                  bits += 8;
                }
                _out -= left;
                strm.total_out += _out;
                state.total += _out;
                if (_out) {
                  strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
                  state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                }
                _out = left;
                if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                  strm.msg = "incorrect data check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = LENGTH;
            case LENGTH:
              if (state.wrap && state.flags) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.total & 4294967295)) {
                  strm.msg = "incorrect length check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = DONE;
            case DONE:
              ret = Z_STREAM_END;
              break inf_leave;
            case BAD:
              ret = Z_DATA_ERROR;
              break inf_leave;
            case MEM:
              return Z_MEM_ERROR;
            case SYNC:
            default:
              return Z_STREAM_ERROR;
          }
        }
      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits;
      if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap && _out) {
        strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
        state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
      if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
        ret = Z_BUF_ERROR;
      }
      return ret;
    }
    function inflateEnd(strm) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      var state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK;
    }
    function inflateGetHeader(strm, head) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if ((state.wrap & 2) === 0) {
        return Z_STREAM_ERROR;
      }
      state.head = head;
      head.done = false;
      return Z_OK;
    }
    function inflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;
      var state;
      var dictid;
      var ret;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR;
      }
      if (state.mode === DICT) {
        dictid = 1;
        dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR;
        }
      }
      ret = updatewindow(strm, dictionary, dictLength, dictLength);
      if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR;
      }
      state.havedict = 1;
      return Z_OK;
    }
    exports.inflateReset = inflateReset;
    exports.inflateReset2 = inflateReset2;
    exports.inflateResetKeep = inflateResetKeep;
    exports.inflateInit = inflateInit;
    exports.inflateInit2 = inflateInit2;
    exports.inflate = inflate;
    exports.inflateEnd = inflateEnd;
    exports.inflateGetHeader = inflateGetHeader;
    exports.inflateSetDictionary = inflateSetDictionary;
    exports.inflateInfo = "pako inflate (from Nodeca project)";
  }
});

// node_modules/pako/lib/zlib/constants.js
var require_constants = __commonJS({
  "node_modules/pako/lib/zlib/constants.js"(exports, module) {
    "use strict";
    module.exports = {
      /* Allowed flush values; see deflate() and inflate() below for details */
      Z_NO_FLUSH: 0,
      Z_PARTIAL_FLUSH: 1,
      Z_SYNC_FLUSH: 2,
      Z_FULL_FLUSH: 3,
      Z_FINISH: 4,
      Z_BLOCK: 5,
      Z_TREES: 6,
      /* Return codes for the compression/decompression functions. Negative values
      * are errors, positive values are used for special but normal events.
      */
      Z_OK: 0,
      Z_STREAM_END: 1,
      Z_NEED_DICT: 2,
      Z_ERRNO: -1,
      Z_STREAM_ERROR: -2,
      Z_DATA_ERROR: -3,
      //Z_MEM_ERROR:     -4,
      Z_BUF_ERROR: -5,
      //Z_VERSION_ERROR: -6,
      /* compression levels */
      Z_NO_COMPRESSION: 0,
      Z_BEST_SPEED: 1,
      Z_BEST_COMPRESSION: 9,
      Z_DEFAULT_COMPRESSION: -1,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4,
      Z_DEFAULT_STRATEGY: 0,
      /* Possible values of the data_type field (though see inflate()) */
      Z_BINARY: 0,
      Z_TEXT: 1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
      Z_UNKNOWN: 2,
      /* The deflate compression method */
      Z_DEFLATED: 8
      //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };
  }
});

// node_modules/pako/lib/zlib/gzheader.js
var require_gzheader = __commonJS({
  "node_modules/pako/lib/zlib/gzheader.js"(exports, module) {
    "use strict";
    function GZheader() {
      this.text = 0;
      this.time = 0;
      this.xflags = 0;
      this.os = 0;
      this.extra = null;
      this.extra_len = 0;
      this.name = "";
      this.comment = "";
      this.hcrc = 0;
      this.done = false;
    }
    module.exports = GZheader;
  }
});

// node_modules/pako/lib/inflate.js
var require_inflate2 = __commonJS({
  "node_modules/pako/lib/inflate.js"(exports) {
    "use strict";
    var zlib_inflate = require_inflate();
    var utils = require_common();
    var strings = require_strings();
    var c = require_constants();
    var msg = require_messages();
    var ZStream = require_zstream();
    var GZheader = require_gzheader();
    var toString = Object.prototype.toString;
    function Inflate(options) {
      if (!(this instanceof Inflate)) return new Inflate(options);
      this.options = utils.assign({
        chunkSize: 16384,
        windowBits: 0,
        to: ""
      }, options || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) {
          opt.windowBits = -15;
        }
      }
      if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
        opt.windowBits += 32;
      }
      if (opt.windowBits > 15 && opt.windowBits < 48) {
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      var status = zlib_inflate.inflateInit2(
        this.strm,
        opt.windowBits
      );
      if (status !== c.Z_OK) {
        throw new Error(msg[status]);
      }
      this.header = new GZheader();
      zlib_inflate.inflateGetHeader(this.strm, this.header);
      if (opt.dictionary) {
        if (typeof opt.dictionary === "string") {
          opt.dictionary = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }
        if (opt.raw) {
          status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
          if (status !== c.Z_OK) {
            throw new Error(msg[status]);
          }
        }
      }
    }
    Inflate.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var dictionary = this.options.dictionary;
      var status, _mode;
      var next_out_utf8, tail, utf8str;
      var allowBufError = false;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.binstring2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
        if (status === c.Z_NEED_DICT && dictionary) {
          status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
        }
        if (status === c.Z_BUF_ERROR && allowBufError === true) {
          status = c.Z_OK;
          allowBufError = false;
        }
        if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.next_out) {
          if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
              tail = strm.next_out - next_out_utf8;
              utf8str = strings.buf2string(strm.output, next_out_utf8);
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) {
                utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
              }
              this.onData(utf8str);
            } else {
              this.onData(utils.shrinkBuf(strm.output, strm.next_out));
            }
          }
        }
        if (strm.avail_in === 0 && strm.avail_out === 0) {
          allowBufError = true;
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
      if (status === c.Z_STREAM_END) {
        _mode = c.Z_FINISH;
      }
      if (_mode === c.Z_FINISH) {
        status = zlib_inflate.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === c.Z_OK;
      }
      if (_mode === c.Z_SYNC_FLUSH) {
        this.onEnd(c.Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Inflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Inflate.prototype.onEnd = function(status) {
      if (status === c.Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function inflate(input, options) {
      var inflator = new Inflate(options);
      inflator.push(input, true);
      if (inflator.err) {
        throw inflator.msg || msg[inflator.err];
      }
      return inflator.result;
    }
    function inflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return inflate(input, options);
    }
    exports.Inflate = Inflate;
    exports.inflate = inflate;
    exports.inflateRaw = inflateRaw;
    exports.ungzip = inflate;
  }
});

// node_modules/pako/index.js
var require_pako = __commonJS({
  "node_modules/pako/index.js"(exports, module) {
    "use strict";
    var assign = require_common().assign;
    var deflate = require_deflate2();
    var inflate = require_inflate2();
    var constants = require_constants();
    var pako = {};
    assign(pako, deflate, inflate, constants);
    module.exports = pako;
  }
});

// node_modules/jszip/lib/flate.js
var require_flate = __commonJS({
  "node_modules/jszip/lib/flate.js"(exports) {
    "use strict";
    var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
    var pako = require_pako();
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";
    exports.magic = "\b\0";
    function FlateWorker(action, options) {
      GenericWorker.call(this, "FlateWorker/" + action);
      this._pako = null;
      this._pakoAction = action;
      this._pakoOptions = options;
      this.meta = {};
    }
    utils.inherits(FlateWorker, GenericWorker);
    FlateWorker.prototype.processChunk = function(chunk) {
      this.meta = chunk.meta;
      if (this._pako === null) {
        this._createPako();
      }
      this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
    };
    FlateWorker.prototype.flush = function() {
      GenericWorker.prototype.flush.call(this);
      if (this._pako === null) {
        this._createPako();
      }
      this._pako.push([], true);
    };
    FlateWorker.prototype.cleanUp = function() {
      GenericWorker.prototype.cleanUp.call(this);
      this._pako = null;
    };
    FlateWorker.prototype._createPako = function() {
      this._pako = new pako[this._pakoAction]({
        raw: true,
        level: this._pakoOptions.level || -1
        // default compression
      });
      var self2 = this;
      this._pako.onData = function(data) {
        self2.push({
          data,
          meta: self2.meta
        });
      };
    };
    exports.compressWorker = function(compressionOptions) {
      return new FlateWorker("Deflate", compressionOptions);
    };
    exports.uncompressWorker = function() {
      return new FlateWorker("Inflate", {});
    };
  }
});

// node_modules/jszip/lib/compressions.js
var require_compressions = __commonJS({
  "node_modules/jszip/lib/compressions.js"(exports) {
    "use strict";
    var GenericWorker = require_GenericWorker();
    exports.STORE = {
      magic: "\0\0",
      compressWorker: function() {
        return new GenericWorker("STORE compression");
      },
      uncompressWorker: function() {
        return new GenericWorker("STORE decompression");
      }
    };
    exports.DEFLATE = require_flate();
  }
});

// node_modules/jszip/lib/signature.js
var require_signature = __commonJS({
  "node_modules/jszip/lib/signature.js"(exports) {
    "use strict";
    exports.LOCAL_FILE_HEADER = "PK";
    exports.CENTRAL_FILE_HEADER = "PK";
    exports.CENTRAL_DIRECTORY_END = "PK";
    exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07";
    exports.ZIP64_CENTRAL_DIRECTORY_END = "PK";
    exports.DATA_DESCRIPTOR = "PK\x07\b";
  }
});

// node_modules/jszip/lib/generate/ZipFileWorker.js
var require_ZipFileWorker = __commonJS({
  "node_modules/jszip/lib/generate/ZipFileWorker.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var utf8 = require_utf8();
    var crc32 = require_crc32();
    var signature = require_signature();
    var decToHex = function(dec, bytes) {
      var hex2 = "", i;
      for (i = 0; i < bytes; i++) {
        hex2 += String.fromCharCode(dec & 255);
        dec = dec >>> 8;
      }
      return hex2;
    };
    var generateUnixExternalFileAttr = function(unixPermissions, isDir) {
      var result = unixPermissions;
      if (!unixPermissions) {
        result = isDir ? 16893 : 33204;
      }
      return (result & 65535) << 16;
    };
    var generateDosExternalFileAttr = function(dosPermissions) {
      return (dosPermissions || 0) & 63;
    };
    var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
      var file = streamInfo["file"], compression = streamInfo["compression"], useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo("string", encodeFileName(file.name)), utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)), comment = file.comment, encodedComment = utils.transformTo("string", encodeFileName(comment)), utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, dosTime, dosDate, extraFields = "", unicodePathExtraField = "", unicodeCommentExtraField = "", dir = file.dir, date = file.date;
      var dataInfo = {
        crc32: 0,
        compressedSize: 0,
        uncompressedSize: 0
      };
      if (!streamedContent || streamingEnded) {
        dataInfo.crc32 = streamInfo["crc32"];
        dataInfo.compressedSize = streamInfo["compressedSize"];
        dataInfo.uncompressedSize = streamInfo["uncompressedSize"];
      }
      var bitflag = 0;
      if (streamedContent) {
        bitflag |= 8;
      }
      if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) {
        bitflag |= 2048;
      }
      var extFileAttr = 0;
      var versionMadeBy = 0;
      if (dir) {
        extFileAttr |= 16;
      }
      if (platform === "UNIX") {
        versionMadeBy = 798;
        extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
      } else {
        versionMadeBy = 20;
        extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
      }
      dosTime = date.getUTCHours();
      dosTime = dosTime << 6;
      dosTime = dosTime | date.getUTCMinutes();
      dosTime = dosTime << 5;
      dosTime = dosTime | date.getUTCSeconds() / 2;
      dosDate = date.getUTCFullYear() - 1980;
      dosDate = dosDate << 4;
      dosDate = dosDate | date.getUTCMonth() + 1;
      dosDate = dosDate << 5;
      dosDate = dosDate | date.getUTCDate();
      if (useUTF8ForFileName) {
        unicodePathExtraField = // Version
        decToHex(1, 1) + // NameCRC32
        decToHex(crc32(encodedFileName), 4) + // UnicodeName
        utfEncodedFileName;
        extraFields += // Info-ZIP Unicode Path Extra Field
        "up" + // size
        decToHex(unicodePathExtraField.length, 2) + // content
        unicodePathExtraField;
      }
      if (useUTF8ForComment) {
        unicodeCommentExtraField = // Version
        decToHex(1, 1) + // CommentCRC32
        decToHex(crc32(encodedComment), 4) + // UnicodeName
        utfEncodedComment;
        extraFields += // Info-ZIP Unicode Path Extra Field
        "uc" + // size
        decToHex(unicodeCommentExtraField.length, 2) + // content
        unicodeCommentExtraField;
      }
      var header = "";
      header += "\n\0";
      header += decToHex(bitflag, 2);
      header += compression.magic;
      header += decToHex(dosTime, 2);
      header += decToHex(dosDate, 2);
      header += decToHex(dataInfo.crc32, 4);
      header += decToHex(dataInfo.compressedSize, 4);
      header += decToHex(dataInfo.uncompressedSize, 4);
      header += decToHex(encodedFileName.length, 2);
      header += decToHex(extraFields.length, 2);
      var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;
      var dirRecord = signature.CENTRAL_FILE_HEADER + // version made by (00: DOS)
      decToHex(versionMadeBy, 2) + // file header (common to file and central directory)
      header + // file comment length
      decToHex(encodedComment.length, 2) + // disk number start
      "\0\0\0\0" + // external file attributes
      decToHex(extFileAttr, 4) + // relative offset of local header
      decToHex(offset, 4) + // file name
      encodedFileName + // extra field
      extraFields + // file comment
      encodedComment;
      return {
        fileRecord,
        dirRecord
      };
    };
    var generateCentralDirectoryEnd = function(entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
      var dirEnd = "";
      var encodedComment = utils.transformTo("string", encodeFileName(comment));
      dirEnd = signature.CENTRAL_DIRECTORY_END + // number of this disk
      "\0\0\0\0" + // total number of entries in the central directory on this disk
      decToHex(entriesCount, 2) + // total number of entries in the central directory
      decToHex(entriesCount, 2) + // size of the central directory   4 bytes
      decToHex(centralDirLength, 4) + // offset of start of central directory with respect to the starting disk number
      decToHex(localDirLength, 4) + // .ZIP file comment length
      decToHex(encodedComment.length, 2) + // .ZIP file comment
      encodedComment;
      return dirEnd;
    };
    var generateDataDescriptors = function(streamInfo) {
      var descriptor = "";
      descriptor = signature.DATA_DESCRIPTOR + // crc-32                          4 bytes
      decToHex(streamInfo["crc32"], 4) + // compressed size                 4 bytes
      decToHex(streamInfo["compressedSize"], 4) + // uncompressed size               4 bytes
      decToHex(streamInfo["uncompressedSize"], 4);
      return descriptor;
    };
    function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
      GenericWorker.call(this, "ZipFileWorker");
      this.bytesWritten = 0;
      this.zipComment = comment;
      this.zipPlatform = platform;
      this.encodeFileName = encodeFileName;
      this.streamFiles = streamFiles;
      this.accumulate = false;
      this.contentBuffer = [];
      this.dirRecords = [];
      this.currentSourceOffset = 0;
      this.entriesCount = 0;
      this.currentFile = null;
      this._sources = [];
    }
    utils.inherits(ZipFileWorker, GenericWorker);
    ZipFileWorker.prototype.push = function(chunk) {
      var currentFilePercent = chunk.meta.percent || 0;
      var entriesCount = this.entriesCount;
      var remainingFiles = this._sources.length;
      if (this.accumulate) {
        this.contentBuffer.push(chunk);
      } else {
        this.bytesWritten += chunk.data.length;
        GenericWorker.prototype.push.call(this, {
          data: chunk.data,
          meta: {
            currentFile: this.currentFile,
            percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
          }
        });
      }
    };
    ZipFileWorker.prototype.openedSource = function(streamInfo) {
      this.currentSourceOffset = this.bytesWritten;
      this.currentFile = streamInfo["file"].name;
      var streamedContent = this.streamFiles && !streamInfo["file"].dir;
      if (streamedContent) {
        var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
        this.push({
          data: record.fileRecord,
          meta: { percent: 0 }
        });
      } else {
        this.accumulate = true;
      }
    };
    ZipFileWorker.prototype.closedSource = function(streamInfo) {
      this.accumulate = false;
      var streamedContent = this.streamFiles && !streamInfo["file"].dir;
      var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
      this.dirRecords.push(record.dirRecord);
      if (streamedContent) {
        this.push({
          data: generateDataDescriptors(streamInfo),
          meta: { percent: 100 }
        });
      } else {
        this.push({
          data: record.fileRecord,
          meta: { percent: 0 }
        });
        while (this.contentBuffer.length) {
          this.push(this.contentBuffer.shift());
        }
      }
      this.currentFile = null;
    };
    ZipFileWorker.prototype.flush = function() {
      var localDirLength = this.bytesWritten;
      for (var i = 0; i < this.dirRecords.length; i++) {
        this.push({
          data: this.dirRecords[i],
          meta: { percent: 100 }
        });
      }
      var centralDirLength = this.bytesWritten - localDirLength;
      var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);
      this.push({
        data: dirEnd,
        meta: { percent: 100 }
      });
    };
    ZipFileWorker.prototype.prepareNextSource = function() {
      this.previous = this._sources.shift();
      this.openedSource(this.previous.streamInfo);
      if (this.isPaused) {
        this.previous.pause();
      } else {
        this.previous.resume();
      }
    };
    ZipFileWorker.prototype.registerPrevious = function(previous) {
      this._sources.push(previous);
      var self2 = this;
      previous.on("data", function(chunk) {
        self2.processChunk(chunk);
      });
      previous.on("end", function() {
        self2.closedSource(self2.previous.streamInfo);
        if (self2._sources.length) {
          self2.prepareNextSource();
        } else {
          self2.end();
        }
      });
      previous.on("error", function(e) {
        self2.error(e);
      });
      return this;
    };
    ZipFileWorker.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (!this.previous && this._sources.length) {
        this.prepareNextSource();
        return true;
      }
      if (!this.previous && !this._sources.length && !this.generatedError) {
        this.end();
        return true;
      }
    };
    ZipFileWorker.prototype.error = function(e) {
      var sources = this._sources;
      if (!GenericWorker.prototype.error.call(this, e)) {
        return false;
      }
      for (var i = 0; i < sources.length; i++) {
        try {
          sources[i].error(e);
        } catch (e2) {
        }
      }
      return true;
    };
    ZipFileWorker.prototype.lock = function() {
      GenericWorker.prototype.lock.call(this);
      var sources = this._sources;
      for (var i = 0; i < sources.length; i++) {
        sources[i].lock();
      }
    };
    module.exports = ZipFileWorker;
  }
});

// node_modules/jszip/lib/generate/index.js
var require_generate = __commonJS({
  "node_modules/jszip/lib/generate/index.js"(exports) {
    "use strict";
    var compressions = require_compressions();
    var ZipFileWorker = require_ZipFileWorker();
    var getCompression = function(fileCompression, zipCompression) {
      var compressionName = fileCompression || zipCompression;
      var compression = compressions[compressionName];
      if (!compression) {
        throw new Error(compressionName + " is not a valid compression method !");
      }
      return compression;
    };
    exports.generateWorker = function(zip, options, comment) {
      var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
      var entriesCount = 0;
      try {
        zip.forEach(function(relativePath, file) {
          entriesCount++;
          var compression = getCompression(file.options.compression, options.compression);
          var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
          var dir = file.dir, date = file.date;
          file._compressWorker(compression, compressionOptions).withStreamInfo("file", {
            name: relativePath,
            dir,
            date,
            comment: file.comment || "",
            unixPermissions: file.unixPermissions,
            dosPermissions: file.dosPermissions
          }).pipe(zipFileWorker);
        });
        zipFileWorker.entriesCount = entriesCount;
      } catch (e) {
        zipFileWorker.error(e);
      }
      return zipFileWorker;
    };
  }
});

// node_modules/jszip/lib/nodejs/NodejsStreamInputAdapter.js
var require_NodejsStreamInputAdapter = __commonJS({
  "node_modules/jszip/lib/nodejs/NodejsStreamInputAdapter.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    function NodejsStreamInputAdapter(filename, stream) {
      GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
      this._upstreamEnded = false;
      this._bindStream(stream);
    }
    utils.inherits(NodejsStreamInputAdapter, GenericWorker);
    NodejsStreamInputAdapter.prototype._bindStream = function(stream) {
      var self2 = this;
      this._stream = stream;
      stream.pause();
      stream.on("data", function(chunk) {
        self2.push({
          data: chunk,
          meta: {
            percent: 0
          }
        });
      }).on("error", function(e) {
        if (self2.isPaused) {
          this.generatedError = e;
        } else {
          self2.error(e);
        }
      }).on("end", function() {
        if (self2.isPaused) {
          self2._upstreamEnded = true;
        } else {
          self2.end();
        }
      });
    };
    NodejsStreamInputAdapter.prototype.pause = function() {
      if (!GenericWorker.prototype.pause.call(this)) {
        return false;
      }
      this._stream.pause();
      return true;
    };
    NodejsStreamInputAdapter.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (this._upstreamEnded) {
        this.end();
      } else {
        this._stream.resume();
      }
      return true;
    };
    module.exports = NodejsStreamInputAdapter;
  }
});

// node_modules/jszip/lib/object.js
var require_object = __commonJS({
  "node_modules/jszip/lib/object.js"(exports, module) {
    "use strict";
    var utf8 = require_utf8();
    var utils = require_utils();
    var GenericWorker = require_GenericWorker();
    var StreamHelper = require_StreamHelper();
    var defaults = require_defaults();
    var CompressedObject = require_compressedObject();
    var ZipObject = require_zipObject();
    var generate = require_generate();
    var nodejsUtils = require_nodejsUtils();
    var NodejsStreamInputAdapter = require_NodejsStreamInputAdapter();
    var fileAdd = function(name, data, originalOptions) {
      var dataType = utils.getTypeOf(data), parent;
      var o = utils.extend(originalOptions || {}, defaults);
      o.date = o.date || /* @__PURE__ */ new Date();
      if (o.compression !== null) {
        o.compression = o.compression.toUpperCase();
      }
      if (typeof o.unixPermissions === "string") {
        o.unixPermissions = parseInt(o.unixPermissions, 8);
      }
      if (o.unixPermissions && o.unixPermissions & 16384) {
        o.dir = true;
      }
      if (o.dosPermissions && o.dosPermissions & 16) {
        o.dir = true;
      }
      if (o.dir) {
        name = forceTrailingSlash(name);
      }
      if (o.createFolders && (parent = parentFolder(name))) {
        folderAdd.call(this, parent, true);
      }
      var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
      if (!originalOptions || typeof originalOptions.binary === "undefined") {
        o.binary = !isUnicodeString;
      }
      var isCompressedEmpty = data instanceof CompressedObject && data.uncompressedSize === 0;
      if (isCompressedEmpty || o.dir || !data || data.length === 0) {
        o.base64 = false;
        o.binary = true;
        data = "";
        o.compression = "STORE";
        dataType = "string";
      }
      var zipObjectContent = null;
      if (data instanceof CompressedObject || data instanceof GenericWorker) {
        zipObjectContent = data;
      } else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        zipObjectContent = new NodejsStreamInputAdapter(name, data);
      } else {
        zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
      }
      var object = new ZipObject(name, zipObjectContent, o);
      this.files[name] = object;
    };
    var parentFolder = function(path2) {
      if (path2.slice(-1) === "/") {
        path2 = path2.substring(0, path2.length - 1);
      }
      var lastSlash = path2.lastIndexOf("/");
      return lastSlash > 0 ? path2.substring(0, lastSlash) : "";
    };
    var forceTrailingSlash = function(path2) {
      if (path2.slice(-1) !== "/") {
        path2 += "/";
      }
      return path2;
    };
    var folderAdd = function(name, createFolders) {
      createFolders = typeof createFolders !== "undefined" ? createFolders : defaults.createFolders;
      name = forceTrailingSlash(name);
      if (!this.files[name]) {
        fileAdd.call(this, name, null, {
          dir: true,
          createFolders
        });
      }
      return this.files[name];
    };
    function isRegExp(object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
    }
    var out = {
      /**
       * @see loadAsync
       */
      load: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      },
      /**
       * Call a callback function for each entry at this folder level.
       * @param {Function} cb the callback function:
       * function (relativePath, file) {...}
       * It takes 2 arguments : the relative path and the file.
       */
      forEach: function(cb) {
        var filename, relativePath, file;
        for (filename in this.files) {
          file = this.files[filename];
          relativePath = filename.slice(this.root.length, filename.length);
          if (relativePath && filename.slice(0, this.root.length) === this.root) {
            cb(relativePath, file);
          }
        }
      },
      /**
       * Filter nested files/folders with the specified function.
       * @param {Function} search the predicate to use :
       * function (relativePath, file) {...}
       * It takes 2 arguments : the relative path and the file.
       * @return {Array} An array of matching elements.
       */
      filter: function(search) {
        var result = [];
        this.forEach(function(relativePath, entry) {
          if (search(relativePath, entry)) {
            result.push(entry);
          }
        });
        return result;
      },
      /**
       * Add a file to the zip file, or search a file.
       * @param   {string|RegExp} name The name of the file to add (if data is defined),
       * the name of the file to find (if no data) or a regex to match files.
       * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
       * @param   {Object} o     File options
       * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
       * a file (when searching by string) or an array of files (when searching by regex).
       */
      file: function(name, data, o) {
        if (arguments.length === 1) {
          if (isRegExp(name)) {
            var regexp = name;
            return this.filter(function(relativePath, file) {
              return !file.dir && regexp.test(relativePath);
            });
          } else {
            var obj = this.files[this.root + name];
            if (obj && !obj.dir) {
              return obj;
            } else {
              return null;
            }
          }
        } else {
          name = this.root + name;
          fileAdd.call(this, name, data, o);
        }
        return this;
      },
      /**
       * Add a directory to the zip file, or search.
       * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
       * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
       */
      folder: function(arg) {
        if (!arg) {
          return this;
        }
        if (isRegExp(arg)) {
          return this.filter(function(relativePath, file) {
            return file.dir && arg.test(relativePath);
          });
        }
        var name = this.root + arg;
        var newFolder = folderAdd.call(this, name);
        var ret = this.clone();
        ret.root = newFolder.name;
        return ret;
      },
      /**
       * Delete a file, or a directory and all sub-files, from the zip
       * @param {string} name the name of the file to delete
       * @return {JSZip} this JSZip object
       */
      remove: function(name) {
        name = this.root + name;
        var file = this.files[name];
        if (!file) {
          if (name.slice(-1) !== "/") {
            name += "/";
          }
          file = this.files[name];
        }
        if (file && !file.dir) {
          delete this.files[name];
        } else {
          var kids = this.filter(function(relativePath, file2) {
            return file2.name.slice(0, name.length) === name;
          });
          for (var i = 0; i < kids.length; i++) {
            delete this.files[kids[i].name];
          }
        }
        return this;
      },
      /**
       * @deprecated This method has been removed in JSZip 3.0, please check the upgrade guide.
       */
      generate: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      },
      /**
       * Generate the complete zip file as an internal stream.
       * @param {Object} options the options to generate the zip file :
       * - compression, "STORE" by default.
       * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
       * @return {StreamHelper} the streamed zip file.
       */
      generateInternalStream: function(options) {
        var worker, opts = {};
        try {
          opts = utils.extend(options || {}, {
            streamFiles: false,
            compression: "STORE",
            compressionOptions: null,
            type: "",
            platform: "DOS",
            comment: null,
            mimeType: "application/zip",
            encodeFileName: utf8.utf8encode
          });
          opts.type = opts.type.toLowerCase();
          opts.compression = opts.compression.toUpperCase();
          if (opts.type === "binarystring") {
            opts.type = "string";
          }
          if (!opts.type) {
            throw new Error("No output type specified.");
          }
          utils.checkSupport(opts.type);
          if (opts.platform === "darwin" || opts.platform === "freebsd" || opts.platform === "linux" || opts.platform === "sunos") {
            opts.platform = "UNIX";
          }
          if (opts.platform === "win32") {
            opts.platform = "DOS";
          }
          var comment = opts.comment || this.comment || "";
          worker = generate.generateWorker(this, opts, comment);
        } catch (e) {
          worker = new GenericWorker("error");
          worker.error(e);
        }
        return new StreamHelper(worker, opts.type || "string", opts.mimeType);
      },
      /**
       * Generate the complete zip file asynchronously.
       * @see generateInternalStream
       */
      generateAsync: function(options, onUpdate) {
        return this.generateInternalStream(options).accumulate(onUpdate);
      },
      /**
       * Generate the complete zip file asynchronously.
       * @see generateInternalStream
       */
      generateNodeStream: function(options, onUpdate) {
        options = options || {};
        if (!options.type) {
          options.type = "nodebuffer";
        }
        return this.generateInternalStream(options).toNodejsStream(onUpdate);
      }
    };
    module.exports = out;
  }
});

// node_modules/jszip/lib/reader/DataReader.js
var require_DataReader = __commonJS({
  "node_modules/jszip/lib/reader/DataReader.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    function DataReader(data) {
      this.data = data;
      this.length = data.length;
      this.index = 0;
      this.zero = 0;
    }
    DataReader.prototype = {
      /**
       * Check that the offset will not go too far.
       * @param {string} offset the additional offset to check.
       * @throws {Error} an Error if the offset is out of bounds.
       */
      checkOffset: function(offset) {
        this.checkIndex(this.index + offset);
      },
      /**
       * Check that the specified index will not be too far.
       * @param {string} newIndex the index to check.
       * @throws {Error} an Error if the index is out of bounds.
       */
      checkIndex: function(newIndex) {
        if (this.length < this.zero + newIndex || newIndex < 0) {
          throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
        }
      },
      /**
       * Change the index.
       * @param {number} newIndex The new index.
       * @throws {Error} if the new index is out of the data.
       */
      setIndex: function(newIndex) {
        this.checkIndex(newIndex);
        this.index = newIndex;
      },
      /**
       * Skip the next n bytes.
       * @param {number} n the number of bytes to skip.
       * @throws {Error} if the new index is out of the data.
       */
      skip: function(n) {
        this.setIndex(this.index + n);
      },
      /**
       * Get the byte at the specified index.
       * @param {number} i the index to use.
       * @return {number} a byte.
       */
      byteAt: function() {
      },
      /**
       * Get the next number with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {number} the corresponding number.
       */
      readInt: function(size) {
        var result = 0, i;
        this.checkOffset(size);
        for (i = this.index + size - 1; i >= this.index; i--) {
          result = (result << 8) + this.byteAt(i);
        }
        this.index += size;
        return result;
      },
      /**
       * Get the next string with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {string} the corresponding string.
       */
      readString: function(size) {
        return utils.transformTo("string", this.readData(size));
      },
      /**
       * Get raw data without conversion, <size> bytes.
       * @param {number} size the number of bytes to read.
       * @return {Object} the raw data, implementation specific.
       */
      readData: function() {
      },
      /**
       * Find the last occurrence of a zip signature (4 bytes).
       * @param {string} sig the signature to find.
       * @return {number} the index of the last occurrence, -1 if not found.
       */
      lastIndexOfSignature: function() {
      },
      /**
       * Read the signature (4 bytes) at the current position and compare it with sig.
       * @param {string} sig the expected signature
       * @return {boolean} true if the signature matches, false otherwise.
       */
      readAndCheckSignature: function() {
      },
      /**
       * Get the next date.
       * @return {Date} the date.
       */
      readDate: function() {
        var dostime = this.readInt(4);
        return new Date(Date.UTC(
          (dostime >> 25 & 127) + 1980,
          // year
          (dostime >> 21 & 15) - 1,
          // month
          dostime >> 16 & 31,
          // day
          dostime >> 11 & 31,
          // hour
          dostime >> 5 & 63,
          // minute
          (dostime & 31) << 1
        ));
      }
    };
    module.exports = DataReader;
  }
});

// node_modules/jszip/lib/reader/ArrayReader.js
var require_ArrayReader = __commonJS({
  "node_modules/jszip/lib/reader/ArrayReader.js"(exports, module) {
    "use strict";
    var DataReader = require_DataReader();
    var utils = require_utils();
    function ArrayReader(data) {
      DataReader.call(this, data);
      for (var i = 0; i < this.data.length; i++) {
        data[i] = data[i] & 255;
      }
    }
    utils.inherits(ArrayReader, DataReader);
    ArrayReader.prototype.byteAt = function(i) {
      return this.data[this.zero + i];
    };
    ArrayReader.prototype.lastIndexOfSignature = function(sig) {
      var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
      for (var i = this.length - 4; i >= 0; --i) {
        if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
          return i - this.zero;
        }
      }
      return -1;
    };
    ArrayReader.prototype.readAndCheckSignature = function(sig) {
      var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
      return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
    };
    ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return [];
      }
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = ArrayReader;
  }
});

// node_modules/jszip/lib/reader/StringReader.js
var require_StringReader = __commonJS({
  "node_modules/jszip/lib/reader/StringReader.js"(exports, module) {
    "use strict";
    var DataReader = require_DataReader();
    var utils = require_utils();
    function StringReader(data) {
      DataReader.call(this, data);
    }
    utils.inherits(StringReader, DataReader);
    StringReader.prototype.byteAt = function(i) {
      return this.data.charCodeAt(this.zero + i);
    };
    StringReader.prototype.lastIndexOfSignature = function(sig) {
      return this.data.lastIndexOf(sig) - this.zero;
    };
    StringReader.prototype.readAndCheckSignature = function(sig) {
      var data = this.readData(4);
      return sig === data;
    };
    StringReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = StringReader;
  }
});

// node_modules/jszip/lib/reader/Uint8ArrayReader.js
var require_Uint8ArrayReader = __commonJS({
  "node_modules/jszip/lib/reader/Uint8ArrayReader.js"(exports, module) {
    "use strict";
    var ArrayReader = require_ArrayReader();
    var utils = require_utils();
    function Uint8ArrayReader(data) {
      ArrayReader.call(this, data);
    }
    utils.inherits(Uint8ArrayReader, ArrayReader);
    Uint8ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return new Uint8Array(0);
      }
      var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = Uint8ArrayReader;
  }
});

// node_modules/jszip/lib/reader/NodeBufferReader.js
var require_NodeBufferReader = __commonJS({
  "node_modules/jszip/lib/reader/NodeBufferReader.js"(exports, module) {
    "use strict";
    var Uint8ArrayReader = require_Uint8ArrayReader();
    var utils = require_utils();
    function NodeBufferReader(data) {
      Uint8ArrayReader.call(this, data);
    }
    utils.inherits(NodeBufferReader, Uint8ArrayReader);
    NodeBufferReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = NodeBufferReader;
  }
});

// node_modules/jszip/lib/reader/readerFor.js
var require_readerFor = __commonJS({
  "node_modules/jszip/lib/reader/readerFor.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var support = require_support();
    var ArrayReader = require_ArrayReader();
    var StringReader = require_StringReader();
    var NodeBufferReader = require_NodeBufferReader();
    var Uint8ArrayReader = require_Uint8ArrayReader();
    module.exports = function(data) {
      var type = utils.getTypeOf(data);
      utils.checkSupport(type);
      if (type === "string" && !support.uint8array) {
        return new StringReader(data);
      }
      if (type === "nodebuffer") {
        return new NodeBufferReader(data);
      }
      if (support.uint8array) {
        return new Uint8ArrayReader(utils.transformTo("uint8array", data));
      }
      return new ArrayReader(utils.transformTo("array", data));
    };
  }
});

// node_modules/jszip/lib/zipEntry.js
var require_zipEntry = __commonJS({
  "node_modules/jszip/lib/zipEntry.js"(exports, module) {
    "use strict";
    var readerFor = require_readerFor();
    var utils = require_utils();
    var CompressedObject = require_compressedObject();
    var crc32fn = require_crc32();
    var utf8 = require_utf8();
    var compressions = require_compressions();
    var support = require_support();
    var MADE_BY_DOS = 0;
    var MADE_BY_UNIX = 3;
    var findCompression = function(compressionMethod) {
      for (var method in compressions) {
        if (!Object.prototype.hasOwnProperty.call(compressions, method)) {
          continue;
        }
        if (compressions[method].magic === compressionMethod) {
          return compressions[method];
        }
      }
      return null;
    };
    function ZipEntry(options, loadOptions) {
      this.options = options;
      this.loadOptions = loadOptions;
    }
    ZipEntry.prototype = {
      /**
       * say if the file is encrypted.
       * @return {boolean} true if the file is encrypted, false otherwise.
       */
      isEncrypted: function() {
        return (this.bitFlag & 1) === 1;
      },
      /**
       * say if the file has utf-8 filename/comment.
       * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
       */
      useUTF8: function() {
        return (this.bitFlag & 2048) === 2048;
      },
      /**
       * Read the local part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readLocalPart: function(reader) {
        var compression, localExtraFieldsLength;
        reader.skip(22);
        this.fileNameLength = reader.readInt(2);
        localExtraFieldsLength = reader.readInt(2);
        this.fileName = reader.readData(this.fileNameLength);
        reader.skip(localExtraFieldsLength);
        if (this.compressedSize === -1 || this.uncompressedSize === -1) {
          throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
        }
        compression = findCompression(this.compressionMethod);
        if (compression === null) {
          throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
        }
        this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readCentralPart: function(reader) {
        this.versionMadeBy = reader.readInt(2);
        reader.skip(2);
        this.bitFlag = reader.readInt(2);
        this.compressionMethod = reader.readString(2);
        this.date = reader.readDate();
        this.crc32 = reader.readInt(4);
        this.compressedSize = reader.readInt(4);
        this.uncompressedSize = reader.readInt(4);
        var fileNameLength = reader.readInt(2);
        this.extraFieldsLength = reader.readInt(2);
        this.fileCommentLength = reader.readInt(2);
        this.diskNumberStart = reader.readInt(2);
        this.internalFileAttributes = reader.readInt(2);
        this.externalFileAttributes = reader.readInt(4);
        this.localHeaderOffset = reader.readInt(4);
        if (this.isEncrypted()) {
          throw new Error("Encrypted zip are not supported");
        }
        reader.skip(fileNameLength);
        this.readExtraFields(reader);
        this.parseZIP64ExtraField(reader);
        this.fileComment = reader.readData(this.fileCommentLength);
      },
      /**
       * Parse the external file attributes and get the unix/dos permissions.
       */
      processAttributes: function() {
        this.unixPermissions = null;
        this.dosPermissions = null;
        var madeBy = this.versionMadeBy >> 8;
        this.dir = this.externalFileAttributes & 16 ? true : false;
        if (madeBy === MADE_BY_DOS) {
          this.dosPermissions = this.externalFileAttributes & 63;
        }
        if (madeBy === MADE_BY_UNIX) {
          this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
        }
        if (!this.dir && this.fileNameStr.slice(-1) === "/") {
          this.dir = true;
        }
      },
      /**
       * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
       * @param {DataReader} reader the reader to use.
       */
      parseZIP64ExtraField: function() {
        if (!this.extraFields[1]) {
          return;
        }
        var extraReader = readerFor(this.extraFields[1].value);
        if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
          this.uncompressedSize = extraReader.readInt(8);
        }
        if (this.compressedSize === utils.MAX_VALUE_32BITS) {
          this.compressedSize = extraReader.readInt(8);
        }
        if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
          this.localHeaderOffset = extraReader.readInt(8);
        }
        if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
          this.diskNumberStart = extraReader.readInt(4);
        }
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readExtraFields: function(reader) {
        var end = reader.index + this.extraFieldsLength, extraFieldId, extraFieldLength, extraFieldValue;
        if (!this.extraFields) {
          this.extraFields = {};
        }
        while (reader.index + 4 < end) {
          extraFieldId = reader.readInt(2);
          extraFieldLength = reader.readInt(2);
          extraFieldValue = reader.readData(extraFieldLength);
          this.extraFields[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
        reader.setIndex(end);
      },
      /**
       * Apply an UTF8 transformation if needed.
       */
      handleUTF8: function() {
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        if (this.useUTF8()) {
          this.fileNameStr = utf8.utf8decode(this.fileName);
          this.fileCommentStr = utf8.utf8decode(this.fileComment);
        } else {
          var upath = this.findExtraFieldUnicodePath();
          if (upath !== null) {
            this.fileNameStr = upath;
          } else {
            var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
            this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
          }
          var ucomment = this.findExtraFieldUnicodeComment();
          if (ucomment !== null) {
            this.fileCommentStr = ucomment;
          } else {
            var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
            this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
          }
        }
      },
      /**
       * Find the unicode path declared in the extra field, if any.
       * @return {String} the unicode path, null otherwise.
       */
      findExtraFieldUnicodePath: function() {
        var upathField = this.extraFields[28789];
        if (upathField) {
          var extraReader = readerFor(upathField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (crc32fn(this.fileName) !== extraReader.readInt(4)) {
            return null;
          }
          return utf8.utf8decode(extraReader.readData(upathField.length - 5));
        }
        return null;
      },
      /**
       * Find the unicode comment declared in the extra field, if any.
       * @return {String} the unicode comment, null otherwise.
       */
      findExtraFieldUnicodeComment: function() {
        var ucommentField = this.extraFields[25461];
        if (ucommentField) {
          var extraReader = readerFor(ucommentField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (crc32fn(this.fileComment) !== extraReader.readInt(4)) {
            return null;
          }
          return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
        }
        return null;
      }
    };
    module.exports = ZipEntry;
  }
});

// node_modules/jszip/lib/zipEntries.js
var require_zipEntries = __commonJS({
  "node_modules/jszip/lib/zipEntries.js"(exports, module) {
    "use strict";
    var readerFor = require_readerFor();
    var utils = require_utils();
    var sig = require_signature();
    var ZipEntry = require_zipEntry();
    var support = require_support();
    function ZipEntries(loadOptions) {
      this.files = [];
      this.loadOptions = loadOptions;
    }
    ZipEntries.prototype = {
      /**
       * Check that the reader is on the specified signature.
       * @param {string} expectedSignature the expected signature.
       * @throws {Error} if it is an other signature.
       */
      checkSignature: function(expectedSignature) {
        if (!this.reader.readAndCheckSignature(expectedSignature)) {
          this.reader.index -= 4;
          var signature = this.reader.readString(4);
          throw new Error("Corrupted zip or bug: unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
        }
      },
      /**
       * Check if the given signature is at the given index.
       * @param {number} askedIndex the index to check.
       * @param {string} expectedSignature the signature to expect.
       * @return {boolean} true if the signature is here, false otherwise.
       */
      isSignature: function(askedIndex, expectedSignature) {
        var currentIndex = this.reader.index;
        this.reader.setIndex(askedIndex);
        var signature = this.reader.readString(4);
        var result = signature === expectedSignature;
        this.reader.setIndex(currentIndex);
        return result;
      },
      /**
       * Read the end of the central directory.
       */
      readBlockEndOfCentral: function() {
        this.diskNumber = this.reader.readInt(2);
        this.diskWithCentralDirStart = this.reader.readInt(2);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
        this.centralDirRecords = this.reader.readInt(2);
        this.centralDirSize = this.reader.readInt(4);
        this.centralDirOffset = this.reader.readInt(4);
        this.zipCommentLength = this.reader.readInt(2);
        var zipComment = this.reader.readData(this.zipCommentLength);
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        var decodeContent = utils.transformTo(decodeParamType, zipComment);
        this.zipComment = this.loadOptions.decodeFileName(decodeContent);
      },
      /**
       * Read the end of the Zip 64 central directory.
       * Not merged with the method readEndOfCentral :
       * The end of central can coexist with its Zip64 brother,
       * I don't want to read the wrong number of bytes !
       */
      readBlockZip64EndOfCentral: function() {
        this.zip64EndOfCentralSize = this.reader.readInt(8);
        this.reader.skip(4);
        this.diskNumber = this.reader.readInt(4);
        this.diskWithCentralDirStart = this.reader.readInt(4);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
        this.centralDirRecords = this.reader.readInt(8);
        this.centralDirSize = this.reader.readInt(8);
        this.centralDirOffset = this.reader.readInt(8);
        this.zip64ExtensibleData = {};
        var extraDataSize = this.zip64EndOfCentralSize - 44, index = 0, extraFieldId, extraFieldLength, extraFieldValue;
        while (index < extraDataSize) {
          extraFieldId = this.reader.readInt(2);
          extraFieldLength = this.reader.readInt(4);
          extraFieldValue = this.reader.readData(extraFieldLength);
          this.zip64ExtensibleData[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
      },
      /**
       * Read the end of the Zip 64 central directory locator.
       */
      readBlockZip64EndOfCentralLocator: function() {
        this.diskWithZip64CentralDirStart = this.reader.readInt(4);
        this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
        this.disksCount = this.reader.readInt(4);
        if (this.disksCount > 1) {
          throw new Error("Multi-volumes zip are not supported");
        }
      },
      /**
       * Read the local files, based on the offset read in the central part.
       */
      readLocalFiles: function() {
        var i, file;
        for (i = 0; i < this.files.length; i++) {
          file = this.files[i];
          this.reader.setIndex(file.localHeaderOffset);
          this.checkSignature(sig.LOCAL_FILE_HEADER);
          file.readLocalPart(this.reader);
          file.handleUTF8();
          file.processAttributes();
        }
      },
      /**
       * Read the central directory.
       */
      readCentralDir: function() {
        var file;
        this.reader.setIndex(this.centralDirOffset);
        while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
          file = new ZipEntry({
            zip64: this.zip64
          }, this.loadOptions);
          file.readCentralPart(this.reader);
          this.files.push(file);
        }
        if (this.centralDirRecords !== this.files.length) {
          if (this.centralDirRecords !== 0 && this.files.length === 0) {
            throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
          } else {
          }
        }
      },
      /**
       * Read the end of central directory.
       */
      readEndOfCentral: function() {
        var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
        if (offset < 0) {
          var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);
          if (isGarbage) {
            throw new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          } else {
            throw new Error("Corrupted zip: can't find end of central directory");
          }
        }
        this.reader.setIndex(offset);
        var endOfCentralDirOffset = offset;
        this.checkSignature(sig.CENTRAL_DIRECTORY_END);
        this.readBlockEndOfCentral();
        if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
          this.zip64 = true;
          offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          if (offset < 0) {
            throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
          }
          this.reader.setIndex(offset);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          this.readBlockZip64EndOfCentralLocator();
          if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
            this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
            if (this.relativeOffsetEndOfZip64CentralDir < 0) {
              throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            }
          }
          this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
          this.readBlockZip64EndOfCentral();
        }
        var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
        if (this.zip64) {
          expectedEndOfCentralDirOffset += 20;
          expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
        }
        var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
        if (extraBytes > 0) {
          if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
          } else {
            this.reader.zero = extraBytes;
          }
        } else if (extraBytes < 0) {
          throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
        }
      },
      prepareReader: function(data) {
        this.reader = readerFor(data);
      },
      /**
       * Read a zip file and create ZipEntries.
       * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
       */
      load: function(data) {
        this.prepareReader(data);
        this.readEndOfCentral();
        this.readCentralDir();
        this.readLocalFiles();
      }
    };
    module.exports = ZipEntries;
  }
});

// node_modules/jszip/lib/load.js
var require_load = __commonJS({
  "node_modules/jszip/lib/load.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var external = require_external();
    var utf8 = require_utf8();
    var ZipEntries = require_zipEntries();
    var Crc32Probe = require_Crc32Probe();
    var nodejsUtils = require_nodejsUtils();
    function checkEntryCRC32(zipEntry) {
      return new external.Promise(function(resolve, reject) {
        var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
        worker.on("error", function(e) {
          reject(e);
        }).on("end", function() {
          if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
            reject(new Error("Corrupted zip : CRC32 mismatch"));
          } else {
            resolve();
          }
        }).resume();
      });
    }
    module.exports = function(data, options) {
      var zip = this;
      options = utils.extend(options || {}, {
        base64: false,
        checkCRC32: false,
        optimizedBinaryString: false,
        createFolders: false,
        decodeFileName: utf8.utf8decode
      });
      if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
      }
      return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64).then(function(data2) {
        var zipEntries = new ZipEntries(options);
        zipEntries.load(data2);
        return zipEntries;
      }).then(function checkCRC32(zipEntries) {
        var promises = [external.Promise.resolve(zipEntries)];
        var files = zipEntries.files;
        if (options.checkCRC32) {
          for (var i = 0; i < files.length; i++) {
            promises.push(checkEntryCRC32(files[i]));
          }
        }
        return external.Promise.all(promises);
      }).then(function addFiles(results) {
        var zipEntries = results.shift();
        var files = zipEntries.files;
        for (var i = 0; i < files.length; i++) {
          var input = files[i];
          var unsafeName = input.fileNameStr;
          var safeName = utils.resolve(input.fileNameStr);
          zip.file(safeName, input.decompressed, {
            binary: true,
            optimizedBinaryString: true,
            date: input.date,
            dir: input.dir,
            comment: input.fileCommentStr.length ? input.fileCommentStr : null,
            unixPermissions: input.unixPermissions,
            dosPermissions: input.dosPermissions,
            createFolders: options.createFolders
          });
          if (!input.dir) {
            zip.file(safeName).unsafeOriginalName = unsafeName;
          }
        }
        if (zipEntries.zipComment.length) {
          zip.comment = zipEntries.zipComment;
        }
        return zip;
      });
    };
  }
});

// node_modules/jszip/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/jszip/lib/index.js"(exports, module) {
    "use strict";
    function JSZip2() {
      if (!(this instanceof JSZip2)) {
        return new JSZip2();
      }
      if (arguments.length) {
        throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
      }
      this.files = /* @__PURE__ */ Object.create(null);
      this.comment = null;
      this.root = "";
      this.clone = function() {
        var newObj = new JSZip2();
        for (var i in this) {
          if (typeof this[i] !== "function") {
            newObj[i] = this[i];
          }
        }
        return newObj;
      };
    }
    JSZip2.prototype = require_object();
    JSZip2.prototype.loadAsync = require_load();
    JSZip2.support = require_support();
    JSZip2.defaults = require_defaults();
    JSZip2.version = "3.10.2";
    JSZip2.loadAsync = function(content, options) {
      return new JSZip2().loadAsync(content, options);
    };
    JSZip2.external = require_external();
    module.exports = JSZip2;
  }
});

// plugin-src/cli.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

// node_modules/pptxgenjs/dist/pptxgen.es.js
var import_jszip = __toESM(require_lib3());
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
var EMU = 914400;
var ONEPT = 12700;
var CRLF = "\r\n";
var LAYOUT_IDX_SERIES_BASE = 2147483649;
var REGEX_HEX_COLOR = /^[0-9a-fA-F]{6}$/;
var LINEH_MODIFIER = 1.67;
var DEF_BULLET_MARGIN = 27;
var DEF_CELL_BORDER = { type: "solid", color: "666666", pt: 1 };
var DEF_CELL_MARGIN_IN = [0.05, 0.1, 0.05, 0.1];
var DEF_CHART_BORDER = { color: "363636", pt: 1 };
var DEF_CHART_GRIDLINE = { color: "888888", style: "solid", size: 1, cap: "flat" };
var DEF_FONT_COLOR = "000000";
var DEF_FONT_SIZE = 12;
var DEF_FONT_TITLE_SIZE = 18;
var DEF_PRES_LAYOUT = "LAYOUT_16x9";
var DEF_PRES_LAYOUT_NAME = "DEFAULT";
var DEF_SHAPE_LINE_COLOR = "333333";
var DEF_SHAPE_SHADOW = { type: "outer", blur: 3, offset: 23e3 / 12700, angle: 90, color: "000000", opacity: 0.35, rotateWithShape: true };
var DEF_SLIDE_MARGIN_IN = [0.5, 0.5, 0.5, 0.5];
var DEF_TEXT_SHADOW = { color: "000000" };
var DEF_TEXT_GLOW = { size: 8, color: "FFFFFF", opacity: 0.75 };
var AXIS_ID_VALUE_PRIMARY = "2094734552";
var AXIS_ID_VALUE_SECONDARY = "2094734553";
var AXIS_ID_CATEGORY_PRIMARY = "2094734554";
var AXIS_ID_CATEGORY_SECONDARY = "2094734555";
var AXIS_ID_SERIES_PRIMARY = "2094734556";
var LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var BARCHART_COLORS = [
  "C0504D",
  "4F81BD",
  "9BBB59",
  "8064A2",
  "4BACC6",
  "F79646",
  "628FC6",
  "C86360",
  "C0504D",
  "4F81BD",
  "9BBB59",
  "8064A2",
  "4BACC6",
  "F79646",
  "628FC6",
  "C86360"
];
var PIECHART_COLORS = [
  "5DA5DA",
  "FAA43A",
  "60BD68",
  "F17CB0",
  "B2912F",
  "B276B2",
  "DECF3F",
  "F15854",
  "A7A7A7",
  "5DA5DA",
  "FAA43A",
  "60BD68",
  "F17CB0",
  "B2912F",
  "B276B2",
  "DECF3F",
  "F15854",
  "A7A7A7"
];
var TEXT_HALIGN;
(function(TEXT_HALIGN2) {
  TEXT_HALIGN2["left"] = "left";
  TEXT_HALIGN2["center"] = "center";
  TEXT_HALIGN2["right"] = "right";
  TEXT_HALIGN2["justify"] = "justify";
})(TEXT_HALIGN || (TEXT_HALIGN = {}));
var TEXT_VALIGN;
(function(TEXT_VALIGN2) {
  TEXT_VALIGN2["b"] = "b";
  TEXT_VALIGN2["ctr"] = "ctr";
  TEXT_VALIGN2["t"] = "t";
})(TEXT_VALIGN || (TEXT_VALIGN = {}));
var SLDNUMFLDID = "{F7021451-1387-4CA6-816F-3879F97B5CBC}";
var OutputType;
(function(OutputType2) {
  OutputType2["arraybuffer"] = "arraybuffer";
  OutputType2["base64"] = "base64";
  OutputType2["binarystring"] = "binarystring";
  OutputType2["blob"] = "blob";
  OutputType2["nodebuffer"] = "nodebuffer";
  OutputType2["uint8array"] = "uint8array";
})(OutputType || (OutputType = {}));
var ChartType;
(function(ChartType2) {
  ChartType2["area"] = "area";
  ChartType2["bar"] = "bar";
  ChartType2["bar3d"] = "bar3D";
  ChartType2["bubble"] = "bubble";
  ChartType2["bubble3d"] = "bubble3D";
  ChartType2["doughnut"] = "doughnut";
  ChartType2["line"] = "line";
  ChartType2["pie"] = "pie";
  ChartType2["radar"] = "radar";
  ChartType2["scatter"] = "scatter";
})(ChartType || (ChartType = {}));
var ShapeType;
(function(ShapeType2) {
  ShapeType2["accentBorderCallout1"] = "accentBorderCallout1";
  ShapeType2["accentBorderCallout2"] = "accentBorderCallout2";
  ShapeType2["accentBorderCallout3"] = "accentBorderCallout3";
  ShapeType2["accentCallout1"] = "accentCallout1";
  ShapeType2["accentCallout2"] = "accentCallout2";
  ShapeType2["accentCallout3"] = "accentCallout3";
  ShapeType2["actionButtonBackPrevious"] = "actionButtonBackPrevious";
  ShapeType2["actionButtonBeginning"] = "actionButtonBeginning";
  ShapeType2["actionButtonBlank"] = "actionButtonBlank";
  ShapeType2["actionButtonDocument"] = "actionButtonDocument";
  ShapeType2["actionButtonEnd"] = "actionButtonEnd";
  ShapeType2["actionButtonForwardNext"] = "actionButtonForwardNext";
  ShapeType2["actionButtonHelp"] = "actionButtonHelp";
  ShapeType2["actionButtonHome"] = "actionButtonHome";
  ShapeType2["actionButtonInformation"] = "actionButtonInformation";
  ShapeType2["actionButtonMovie"] = "actionButtonMovie";
  ShapeType2["actionButtonReturn"] = "actionButtonReturn";
  ShapeType2["actionButtonSound"] = "actionButtonSound";
  ShapeType2["arc"] = "arc";
  ShapeType2["bentArrow"] = "bentArrow";
  ShapeType2["bentUpArrow"] = "bentUpArrow";
  ShapeType2["bevel"] = "bevel";
  ShapeType2["blockArc"] = "blockArc";
  ShapeType2["borderCallout1"] = "borderCallout1";
  ShapeType2["borderCallout2"] = "borderCallout2";
  ShapeType2["borderCallout3"] = "borderCallout3";
  ShapeType2["bracePair"] = "bracePair";
  ShapeType2["bracketPair"] = "bracketPair";
  ShapeType2["callout1"] = "callout1";
  ShapeType2["callout2"] = "callout2";
  ShapeType2["callout3"] = "callout3";
  ShapeType2["can"] = "can";
  ShapeType2["chartPlus"] = "chartPlus";
  ShapeType2["chartStar"] = "chartStar";
  ShapeType2["chartX"] = "chartX";
  ShapeType2["chevron"] = "chevron";
  ShapeType2["chord"] = "chord";
  ShapeType2["circularArrow"] = "circularArrow";
  ShapeType2["cloud"] = "cloud";
  ShapeType2["cloudCallout"] = "cloudCallout";
  ShapeType2["corner"] = "corner";
  ShapeType2["cornerTabs"] = "cornerTabs";
  ShapeType2["cube"] = "cube";
  ShapeType2["curvedDownArrow"] = "curvedDownArrow";
  ShapeType2["curvedLeftArrow"] = "curvedLeftArrow";
  ShapeType2["curvedRightArrow"] = "curvedRightArrow";
  ShapeType2["curvedUpArrow"] = "curvedUpArrow";
  ShapeType2["custGeom"] = "custGeom";
  ShapeType2["decagon"] = "decagon";
  ShapeType2["diagStripe"] = "diagStripe";
  ShapeType2["diamond"] = "diamond";
  ShapeType2["dodecagon"] = "dodecagon";
  ShapeType2["donut"] = "donut";
  ShapeType2["doubleWave"] = "doubleWave";
  ShapeType2["downArrow"] = "downArrow";
  ShapeType2["downArrowCallout"] = "downArrowCallout";
  ShapeType2["ellipse"] = "ellipse";
  ShapeType2["ellipseRibbon"] = "ellipseRibbon";
  ShapeType2["ellipseRibbon2"] = "ellipseRibbon2";
  ShapeType2["flowChartAlternateProcess"] = "flowChartAlternateProcess";
  ShapeType2["flowChartCollate"] = "flowChartCollate";
  ShapeType2["flowChartConnector"] = "flowChartConnector";
  ShapeType2["flowChartDecision"] = "flowChartDecision";
  ShapeType2["flowChartDelay"] = "flowChartDelay";
  ShapeType2["flowChartDisplay"] = "flowChartDisplay";
  ShapeType2["flowChartDocument"] = "flowChartDocument";
  ShapeType2["flowChartExtract"] = "flowChartExtract";
  ShapeType2["flowChartInputOutput"] = "flowChartInputOutput";
  ShapeType2["flowChartInternalStorage"] = "flowChartInternalStorage";
  ShapeType2["flowChartMagneticDisk"] = "flowChartMagneticDisk";
  ShapeType2["flowChartMagneticDrum"] = "flowChartMagneticDrum";
  ShapeType2["flowChartMagneticTape"] = "flowChartMagneticTape";
  ShapeType2["flowChartManualInput"] = "flowChartManualInput";
  ShapeType2["flowChartManualOperation"] = "flowChartManualOperation";
  ShapeType2["flowChartMerge"] = "flowChartMerge";
  ShapeType2["flowChartMultidocument"] = "flowChartMultidocument";
  ShapeType2["flowChartOfflineStorage"] = "flowChartOfflineStorage";
  ShapeType2["flowChartOffpageConnector"] = "flowChartOffpageConnector";
  ShapeType2["flowChartOnlineStorage"] = "flowChartOnlineStorage";
  ShapeType2["flowChartOr"] = "flowChartOr";
  ShapeType2["flowChartPredefinedProcess"] = "flowChartPredefinedProcess";
  ShapeType2["flowChartPreparation"] = "flowChartPreparation";
  ShapeType2["flowChartProcess"] = "flowChartProcess";
  ShapeType2["flowChartPunchedCard"] = "flowChartPunchedCard";
  ShapeType2["flowChartPunchedTape"] = "flowChartPunchedTape";
  ShapeType2["flowChartSort"] = "flowChartSort";
  ShapeType2["flowChartSummingJunction"] = "flowChartSummingJunction";
  ShapeType2["flowChartTerminator"] = "flowChartTerminator";
  ShapeType2["folderCorner"] = "folderCorner";
  ShapeType2["frame"] = "frame";
  ShapeType2["funnel"] = "funnel";
  ShapeType2["gear6"] = "gear6";
  ShapeType2["gear9"] = "gear9";
  ShapeType2["halfFrame"] = "halfFrame";
  ShapeType2["heart"] = "heart";
  ShapeType2["heptagon"] = "heptagon";
  ShapeType2["hexagon"] = "hexagon";
  ShapeType2["homePlate"] = "homePlate";
  ShapeType2["horizontalScroll"] = "horizontalScroll";
  ShapeType2["irregularSeal1"] = "irregularSeal1";
  ShapeType2["irregularSeal2"] = "irregularSeal2";
  ShapeType2["leftArrow"] = "leftArrow";
  ShapeType2["leftArrowCallout"] = "leftArrowCallout";
  ShapeType2["leftBrace"] = "leftBrace";
  ShapeType2["leftBracket"] = "leftBracket";
  ShapeType2["leftCircularArrow"] = "leftCircularArrow";
  ShapeType2["leftRightArrow"] = "leftRightArrow";
  ShapeType2["leftRightArrowCallout"] = "leftRightArrowCallout";
  ShapeType2["leftRightCircularArrow"] = "leftRightCircularArrow";
  ShapeType2["leftRightRibbon"] = "leftRightRibbon";
  ShapeType2["leftRightUpArrow"] = "leftRightUpArrow";
  ShapeType2["leftUpArrow"] = "leftUpArrow";
  ShapeType2["lightningBolt"] = "lightningBolt";
  ShapeType2["line"] = "line";
  ShapeType2["lineInv"] = "lineInv";
  ShapeType2["mathDivide"] = "mathDivide";
  ShapeType2["mathEqual"] = "mathEqual";
  ShapeType2["mathMinus"] = "mathMinus";
  ShapeType2["mathMultiply"] = "mathMultiply";
  ShapeType2["mathNotEqual"] = "mathNotEqual";
  ShapeType2["mathPlus"] = "mathPlus";
  ShapeType2["moon"] = "moon";
  ShapeType2["noSmoking"] = "noSmoking";
  ShapeType2["nonIsoscelesTrapezoid"] = "nonIsoscelesTrapezoid";
  ShapeType2["notchedRightArrow"] = "notchedRightArrow";
  ShapeType2["octagon"] = "octagon";
  ShapeType2["parallelogram"] = "parallelogram";
  ShapeType2["pentagon"] = "pentagon";
  ShapeType2["pie"] = "pie";
  ShapeType2["pieWedge"] = "pieWedge";
  ShapeType2["plaque"] = "plaque";
  ShapeType2["plaqueTabs"] = "plaqueTabs";
  ShapeType2["plus"] = "plus";
  ShapeType2["quadArrow"] = "quadArrow";
  ShapeType2["quadArrowCallout"] = "quadArrowCallout";
  ShapeType2["rect"] = "rect";
  ShapeType2["ribbon"] = "ribbon";
  ShapeType2["ribbon2"] = "ribbon2";
  ShapeType2["rightArrow"] = "rightArrow";
  ShapeType2["rightArrowCallout"] = "rightArrowCallout";
  ShapeType2["rightBrace"] = "rightBrace";
  ShapeType2["rightBracket"] = "rightBracket";
  ShapeType2["round1Rect"] = "round1Rect";
  ShapeType2["round2DiagRect"] = "round2DiagRect";
  ShapeType2["round2SameRect"] = "round2SameRect";
  ShapeType2["roundRect"] = "roundRect";
  ShapeType2["rtTriangle"] = "rtTriangle";
  ShapeType2["smileyFace"] = "smileyFace";
  ShapeType2["snip1Rect"] = "snip1Rect";
  ShapeType2["snip2DiagRect"] = "snip2DiagRect";
  ShapeType2["snip2SameRect"] = "snip2SameRect";
  ShapeType2["snipRoundRect"] = "snipRoundRect";
  ShapeType2["squareTabs"] = "squareTabs";
  ShapeType2["star10"] = "star10";
  ShapeType2["star12"] = "star12";
  ShapeType2["star16"] = "star16";
  ShapeType2["star24"] = "star24";
  ShapeType2["star32"] = "star32";
  ShapeType2["star4"] = "star4";
  ShapeType2["star5"] = "star5";
  ShapeType2["star6"] = "star6";
  ShapeType2["star7"] = "star7";
  ShapeType2["star8"] = "star8";
  ShapeType2["stripedRightArrow"] = "stripedRightArrow";
  ShapeType2["sun"] = "sun";
  ShapeType2["swooshArrow"] = "swooshArrow";
  ShapeType2["teardrop"] = "teardrop";
  ShapeType2["trapezoid"] = "trapezoid";
  ShapeType2["triangle"] = "triangle";
  ShapeType2["upArrow"] = "upArrow";
  ShapeType2["upArrowCallout"] = "upArrowCallout";
  ShapeType2["upDownArrow"] = "upDownArrow";
  ShapeType2["upDownArrowCallout"] = "upDownArrowCallout";
  ShapeType2["uturnArrow"] = "uturnArrow";
  ShapeType2["verticalScroll"] = "verticalScroll";
  ShapeType2["wave"] = "wave";
  ShapeType2["wedgeEllipseCallout"] = "wedgeEllipseCallout";
  ShapeType2["wedgeRectCallout"] = "wedgeRectCallout";
  ShapeType2["wedgeRoundRectCallout"] = "wedgeRoundRectCallout";
})(ShapeType || (ShapeType = {}));
var SchemeColor;
(function(SchemeColor2) {
  SchemeColor2["text1"] = "tx1";
  SchemeColor2["text2"] = "tx2";
  SchemeColor2["background1"] = "bg1";
  SchemeColor2["background2"] = "bg2";
  SchemeColor2["accent1"] = "accent1";
  SchemeColor2["accent2"] = "accent2";
  SchemeColor2["accent3"] = "accent3";
  SchemeColor2["accent4"] = "accent4";
  SchemeColor2["accent5"] = "accent5";
  SchemeColor2["accent6"] = "accent6";
})(SchemeColor || (SchemeColor = {}));
var AlignH;
(function(AlignH2) {
  AlignH2["left"] = "left";
  AlignH2["center"] = "center";
  AlignH2["right"] = "right";
  AlignH2["justify"] = "justify";
})(AlignH || (AlignH = {}));
var AlignV;
(function(AlignV2) {
  AlignV2["top"] = "top";
  AlignV2["middle"] = "middle";
  AlignV2["bottom"] = "bottom";
})(AlignV || (AlignV = {}));
var SHAPE_TYPE;
(function(SHAPE_TYPE2) {
  SHAPE_TYPE2["ACTION_BUTTON_BACK_OR_PREVIOUS"] = "actionButtonBackPrevious";
  SHAPE_TYPE2["ACTION_BUTTON_BEGINNING"] = "actionButtonBeginning";
  SHAPE_TYPE2["ACTION_BUTTON_CUSTOM"] = "actionButtonBlank";
  SHAPE_TYPE2["ACTION_BUTTON_DOCUMENT"] = "actionButtonDocument";
  SHAPE_TYPE2["ACTION_BUTTON_END"] = "actionButtonEnd";
  SHAPE_TYPE2["ACTION_BUTTON_FORWARD_OR_NEXT"] = "actionButtonForwardNext";
  SHAPE_TYPE2["ACTION_BUTTON_HELP"] = "actionButtonHelp";
  SHAPE_TYPE2["ACTION_BUTTON_HOME"] = "actionButtonHome";
  SHAPE_TYPE2["ACTION_BUTTON_INFORMATION"] = "actionButtonInformation";
  SHAPE_TYPE2["ACTION_BUTTON_MOVIE"] = "actionButtonMovie";
  SHAPE_TYPE2["ACTION_BUTTON_RETURN"] = "actionButtonReturn";
  SHAPE_TYPE2["ACTION_BUTTON_SOUND"] = "actionButtonSound";
  SHAPE_TYPE2["ARC"] = "arc";
  SHAPE_TYPE2["BALLOON"] = "wedgeRoundRectCallout";
  SHAPE_TYPE2["BENT_ARROW"] = "bentArrow";
  SHAPE_TYPE2["BENT_UP_ARROW"] = "bentUpArrow";
  SHAPE_TYPE2["BEVEL"] = "bevel";
  SHAPE_TYPE2["BLOCK_ARC"] = "blockArc";
  SHAPE_TYPE2["CAN"] = "can";
  SHAPE_TYPE2["CHART_PLUS"] = "chartPlus";
  SHAPE_TYPE2["CHART_STAR"] = "chartStar";
  SHAPE_TYPE2["CHART_X"] = "chartX";
  SHAPE_TYPE2["CHEVRON"] = "chevron";
  SHAPE_TYPE2["CHORD"] = "chord";
  SHAPE_TYPE2["CIRCULAR_ARROW"] = "circularArrow";
  SHAPE_TYPE2["CLOUD"] = "cloud";
  SHAPE_TYPE2["CLOUD_CALLOUT"] = "cloudCallout";
  SHAPE_TYPE2["CORNER"] = "corner";
  SHAPE_TYPE2["CORNER_TABS"] = "cornerTabs";
  SHAPE_TYPE2["CROSS"] = "plus";
  SHAPE_TYPE2["CUBE"] = "cube";
  SHAPE_TYPE2["CURVED_DOWN_ARROW"] = "curvedDownArrow";
  SHAPE_TYPE2["CURVED_DOWN_RIBBON"] = "ellipseRibbon";
  SHAPE_TYPE2["CURVED_LEFT_ARROW"] = "curvedLeftArrow";
  SHAPE_TYPE2["CURVED_RIGHT_ARROW"] = "curvedRightArrow";
  SHAPE_TYPE2["CURVED_UP_ARROW"] = "curvedUpArrow";
  SHAPE_TYPE2["CURVED_UP_RIBBON"] = "ellipseRibbon2";
  SHAPE_TYPE2["CUSTOM_GEOMETRY"] = "custGeom";
  SHAPE_TYPE2["DECAGON"] = "decagon";
  SHAPE_TYPE2["DIAGONAL_STRIPE"] = "diagStripe";
  SHAPE_TYPE2["DIAMOND"] = "diamond";
  SHAPE_TYPE2["DODECAGON"] = "dodecagon";
  SHAPE_TYPE2["DONUT"] = "donut";
  SHAPE_TYPE2["DOUBLE_BRACE"] = "bracePair";
  SHAPE_TYPE2["DOUBLE_BRACKET"] = "bracketPair";
  SHAPE_TYPE2["DOUBLE_WAVE"] = "doubleWave";
  SHAPE_TYPE2["DOWN_ARROW"] = "downArrow";
  SHAPE_TYPE2["DOWN_ARROW_CALLOUT"] = "downArrowCallout";
  SHAPE_TYPE2["DOWN_RIBBON"] = "ribbon";
  SHAPE_TYPE2["EXPLOSION1"] = "irregularSeal1";
  SHAPE_TYPE2["EXPLOSION2"] = "irregularSeal2";
  SHAPE_TYPE2["FLOWCHART_ALTERNATE_PROCESS"] = "flowChartAlternateProcess";
  SHAPE_TYPE2["FLOWCHART_CARD"] = "flowChartPunchedCard";
  SHAPE_TYPE2["FLOWCHART_COLLATE"] = "flowChartCollate";
  SHAPE_TYPE2["FLOWCHART_CONNECTOR"] = "flowChartConnector";
  SHAPE_TYPE2["FLOWCHART_DATA"] = "flowChartInputOutput";
  SHAPE_TYPE2["FLOWCHART_DECISION"] = "flowChartDecision";
  SHAPE_TYPE2["FLOWCHART_DELAY"] = "flowChartDelay";
  SHAPE_TYPE2["FLOWCHART_DIRECT_ACCESS_STORAGE"] = "flowChartMagneticDrum";
  SHAPE_TYPE2["FLOWCHART_DISPLAY"] = "flowChartDisplay";
  SHAPE_TYPE2["FLOWCHART_DOCUMENT"] = "flowChartDocument";
  SHAPE_TYPE2["FLOWCHART_EXTRACT"] = "flowChartExtract";
  SHAPE_TYPE2["FLOWCHART_INTERNAL_STORAGE"] = "flowChartInternalStorage";
  SHAPE_TYPE2["FLOWCHART_MAGNETIC_DISK"] = "flowChartMagneticDisk";
  SHAPE_TYPE2["FLOWCHART_MANUAL_INPUT"] = "flowChartManualInput";
  SHAPE_TYPE2["FLOWCHART_MANUAL_OPERATION"] = "flowChartManualOperation";
  SHAPE_TYPE2["FLOWCHART_MERGE"] = "flowChartMerge";
  SHAPE_TYPE2["FLOWCHART_MULTIDOCUMENT"] = "flowChartMultidocument";
  SHAPE_TYPE2["FLOWCHART_OFFLINE_STORAGE"] = "flowChartOfflineStorage";
  SHAPE_TYPE2["FLOWCHART_OFFPAGE_CONNECTOR"] = "flowChartOffpageConnector";
  SHAPE_TYPE2["FLOWCHART_OR"] = "flowChartOr";
  SHAPE_TYPE2["FLOWCHART_PREDEFINED_PROCESS"] = "flowChartPredefinedProcess";
  SHAPE_TYPE2["FLOWCHART_PREPARATION"] = "flowChartPreparation";
  SHAPE_TYPE2["FLOWCHART_PROCESS"] = "flowChartProcess";
  SHAPE_TYPE2["FLOWCHART_PUNCHED_TAPE"] = "flowChartPunchedTape";
  SHAPE_TYPE2["FLOWCHART_SEQUENTIAL_ACCESS_STORAGE"] = "flowChartMagneticTape";
  SHAPE_TYPE2["FLOWCHART_SORT"] = "flowChartSort";
  SHAPE_TYPE2["FLOWCHART_STORED_DATA"] = "flowChartOnlineStorage";
  SHAPE_TYPE2["FLOWCHART_SUMMING_JUNCTION"] = "flowChartSummingJunction";
  SHAPE_TYPE2["FLOWCHART_TERMINATOR"] = "flowChartTerminator";
  SHAPE_TYPE2["FOLDED_CORNER"] = "folderCorner";
  SHAPE_TYPE2["FRAME"] = "frame";
  SHAPE_TYPE2["FUNNEL"] = "funnel";
  SHAPE_TYPE2["GEAR_6"] = "gear6";
  SHAPE_TYPE2["GEAR_9"] = "gear9";
  SHAPE_TYPE2["HALF_FRAME"] = "halfFrame";
  SHAPE_TYPE2["HEART"] = "heart";
  SHAPE_TYPE2["HEPTAGON"] = "heptagon";
  SHAPE_TYPE2["HEXAGON"] = "hexagon";
  SHAPE_TYPE2["HORIZONTAL_SCROLL"] = "horizontalScroll";
  SHAPE_TYPE2["ISOSCELES_TRIANGLE"] = "triangle";
  SHAPE_TYPE2["LEFT_ARROW"] = "leftArrow";
  SHAPE_TYPE2["LEFT_ARROW_CALLOUT"] = "leftArrowCallout";
  SHAPE_TYPE2["LEFT_BRACE"] = "leftBrace";
  SHAPE_TYPE2["LEFT_BRACKET"] = "leftBracket";
  SHAPE_TYPE2["LEFT_CIRCULAR_ARROW"] = "leftCircularArrow";
  SHAPE_TYPE2["LEFT_RIGHT_ARROW"] = "leftRightArrow";
  SHAPE_TYPE2["LEFT_RIGHT_ARROW_CALLOUT"] = "leftRightArrowCallout";
  SHAPE_TYPE2["LEFT_RIGHT_CIRCULAR_ARROW"] = "leftRightCircularArrow";
  SHAPE_TYPE2["LEFT_RIGHT_RIBBON"] = "leftRightRibbon";
  SHAPE_TYPE2["LEFT_RIGHT_UP_ARROW"] = "leftRightUpArrow";
  SHAPE_TYPE2["LEFT_UP_ARROW"] = "leftUpArrow";
  SHAPE_TYPE2["LIGHTNING_BOLT"] = "lightningBolt";
  SHAPE_TYPE2["LINE_CALLOUT_1"] = "borderCallout1";
  SHAPE_TYPE2["LINE_CALLOUT_1_ACCENT_BAR"] = "accentCallout1";
  SHAPE_TYPE2["LINE_CALLOUT_1_BORDER_AND_ACCENT_BAR"] = "accentBorderCallout1";
  SHAPE_TYPE2["LINE_CALLOUT_1_NO_BORDER"] = "callout1";
  SHAPE_TYPE2["LINE_CALLOUT_2"] = "borderCallout2";
  SHAPE_TYPE2["LINE_CALLOUT_2_ACCENT_BAR"] = "accentCallout2";
  SHAPE_TYPE2["LINE_CALLOUT_2_BORDER_AND_ACCENT_BAR"] = "accentBorderCallout2";
  SHAPE_TYPE2["LINE_CALLOUT_2_NO_BORDER"] = "callout2";
  SHAPE_TYPE2["LINE_CALLOUT_3"] = "borderCallout3";
  SHAPE_TYPE2["LINE_CALLOUT_3_ACCENT_BAR"] = "accentCallout3";
  SHAPE_TYPE2["LINE_CALLOUT_3_BORDER_AND_ACCENT_BAR"] = "accentBorderCallout3";
  SHAPE_TYPE2["LINE_CALLOUT_3_NO_BORDER"] = "callout3";
  SHAPE_TYPE2["LINE_CALLOUT_4"] = "borderCallout4";
  SHAPE_TYPE2["LINE_CALLOUT_4_ACCENT_BAR"] = "accentCallout3=4";
  SHAPE_TYPE2["LINE_CALLOUT_4_BORDER_AND_ACCENT_BAR"] = "accentBorderCallout4";
  SHAPE_TYPE2["LINE_CALLOUT_4_NO_BORDER"] = "callout4";
  SHAPE_TYPE2["LINE"] = "line";
  SHAPE_TYPE2["LINE_INVERSE"] = "lineInv";
  SHAPE_TYPE2["MATH_DIVIDE"] = "mathDivide";
  SHAPE_TYPE2["MATH_EQUAL"] = "mathEqual";
  SHAPE_TYPE2["MATH_MINUS"] = "mathMinus";
  SHAPE_TYPE2["MATH_MULTIPLY"] = "mathMultiply";
  SHAPE_TYPE2["MATH_NOT_EQUAL"] = "mathNotEqual";
  SHAPE_TYPE2["MATH_PLUS"] = "mathPlus";
  SHAPE_TYPE2["MOON"] = "moon";
  SHAPE_TYPE2["NON_ISOSCELES_TRAPEZOID"] = "nonIsoscelesTrapezoid";
  SHAPE_TYPE2["NOTCHED_RIGHT_ARROW"] = "notchedRightArrow";
  SHAPE_TYPE2["NO_SYMBOL"] = "noSmoking";
  SHAPE_TYPE2["OCTAGON"] = "octagon";
  SHAPE_TYPE2["OVAL"] = "ellipse";
  SHAPE_TYPE2["OVAL_CALLOUT"] = "wedgeEllipseCallout";
  SHAPE_TYPE2["PARALLELOGRAM"] = "parallelogram";
  SHAPE_TYPE2["PENTAGON"] = "homePlate";
  SHAPE_TYPE2["PIE"] = "pie";
  SHAPE_TYPE2["PIE_WEDGE"] = "pieWedge";
  SHAPE_TYPE2["PLAQUE"] = "plaque";
  SHAPE_TYPE2["PLAQUE_TABS"] = "plaqueTabs";
  SHAPE_TYPE2["QUAD_ARROW"] = "quadArrow";
  SHAPE_TYPE2["QUAD_ARROW_CALLOUT"] = "quadArrowCallout";
  SHAPE_TYPE2["RECTANGLE"] = "rect";
  SHAPE_TYPE2["RECTANGULAR_CALLOUT"] = "wedgeRectCallout";
  SHAPE_TYPE2["REGULAR_PENTAGON"] = "pentagon";
  SHAPE_TYPE2["RIGHT_ARROW"] = "rightArrow";
  SHAPE_TYPE2["RIGHT_ARROW_CALLOUT"] = "rightArrowCallout";
  SHAPE_TYPE2["RIGHT_BRACE"] = "rightBrace";
  SHAPE_TYPE2["RIGHT_BRACKET"] = "rightBracket";
  SHAPE_TYPE2["RIGHT_TRIANGLE"] = "rtTriangle";
  SHAPE_TYPE2["ROUNDED_RECTANGLE"] = "roundRect";
  SHAPE_TYPE2["ROUNDED_RECTANGULAR_CALLOUT"] = "wedgeRoundRectCallout";
  SHAPE_TYPE2["ROUND_1_RECTANGLE"] = "round1Rect";
  SHAPE_TYPE2["ROUND_2_DIAG_RECTANGLE"] = "round2DiagRect";
  SHAPE_TYPE2["ROUND_2_SAME_RECTANGLE"] = "round2SameRect";
  SHAPE_TYPE2["SMILEY_FACE"] = "smileyFace";
  SHAPE_TYPE2["SNIP_1_RECTANGLE"] = "snip1Rect";
  SHAPE_TYPE2["SNIP_2_DIAG_RECTANGLE"] = "snip2DiagRect";
  SHAPE_TYPE2["SNIP_2_SAME_RECTANGLE"] = "snip2SameRect";
  SHAPE_TYPE2["SNIP_ROUND_RECTANGLE"] = "snipRoundRect";
  SHAPE_TYPE2["SQUARE_TABS"] = "squareTabs";
  SHAPE_TYPE2["STAR_10_POINT"] = "star10";
  SHAPE_TYPE2["STAR_12_POINT"] = "star12";
  SHAPE_TYPE2["STAR_16_POINT"] = "star16";
  SHAPE_TYPE2["STAR_24_POINT"] = "star24";
  SHAPE_TYPE2["STAR_32_POINT"] = "star32";
  SHAPE_TYPE2["STAR_4_POINT"] = "star4";
  SHAPE_TYPE2["STAR_5_POINT"] = "star5";
  SHAPE_TYPE2["STAR_6_POINT"] = "star6";
  SHAPE_TYPE2["STAR_7_POINT"] = "star7";
  SHAPE_TYPE2["STAR_8_POINT"] = "star8";
  SHAPE_TYPE2["STRIPED_RIGHT_ARROW"] = "stripedRightArrow";
  SHAPE_TYPE2["SUN"] = "sun";
  SHAPE_TYPE2["SWOOSH_ARROW"] = "swooshArrow";
  SHAPE_TYPE2["TEAR"] = "teardrop";
  SHAPE_TYPE2["TRAPEZOID"] = "trapezoid";
  SHAPE_TYPE2["UP_ARROW"] = "upArrow";
  SHAPE_TYPE2["UP_ARROW_CALLOUT"] = "upArrowCallout";
  SHAPE_TYPE2["UP_DOWN_ARROW"] = "upDownArrow";
  SHAPE_TYPE2["UP_DOWN_ARROW_CALLOUT"] = "upDownArrowCallout";
  SHAPE_TYPE2["UP_RIBBON"] = "ribbon2";
  SHAPE_TYPE2["U_TURN_ARROW"] = "uturnArrow";
  SHAPE_TYPE2["VERTICAL_SCROLL"] = "verticalScroll";
  SHAPE_TYPE2["WAVE"] = "wave";
})(SHAPE_TYPE || (SHAPE_TYPE = {}));
var CHART_TYPE;
(function(CHART_TYPE2) {
  CHART_TYPE2["AREA"] = "area";
  CHART_TYPE2["BAR"] = "bar";
  CHART_TYPE2["BAR3D"] = "bar3D";
  CHART_TYPE2["BUBBLE"] = "bubble";
  CHART_TYPE2["BUBBLE3D"] = "bubble3D";
  CHART_TYPE2["DOUGHNUT"] = "doughnut";
  CHART_TYPE2["LINE"] = "line";
  CHART_TYPE2["PIE"] = "pie";
  CHART_TYPE2["RADAR"] = "radar";
  CHART_TYPE2["SCATTER"] = "scatter";
})(CHART_TYPE || (CHART_TYPE = {}));
var SCHEME_COLOR_NAMES;
(function(SCHEME_COLOR_NAMES2) {
  SCHEME_COLOR_NAMES2["TEXT1"] = "tx1";
  SCHEME_COLOR_NAMES2["TEXT2"] = "tx2";
  SCHEME_COLOR_NAMES2["BACKGROUND1"] = "bg1";
  SCHEME_COLOR_NAMES2["BACKGROUND2"] = "bg2";
  SCHEME_COLOR_NAMES2["ACCENT1"] = "accent1";
  SCHEME_COLOR_NAMES2["ACCENT2"] = "accent2";
  SCHEME_COLOR_NAMES2["ACCENT3"] = "accent3";
  SCHEME_COLOR_NAMES2["ACCENT4"] = "accent4";
  SCHEME_COLOR_NAMES2["ACCENT5"] = "accent5";
  SCHEME_COLOR_NAMES2["ACCENT6"] = "accent6";
})(SCHEME_COLOR_NAMES || (SCHEME_COLOR_NAMES = {}));
var MASTER_OBJECTS;
(function(MASTER_OBJECTS2) {
  MASTER_OBJECTS2["chart"] = "chart";
  MASTER_OBJECTS2["image"] = "image";
  MASTER_OBJECTS2["line"] = "line";
  MASTER_OBJECTS2["rect"] = "rect";
  MASTER_OBJECTS2["text"] = "text";
  MASTER_OBJECTS2["placeholder"] = "placeholder";
})(MASTER_OBJECTS || (MASTER_OBJECTS = {}));
var SLIDE_OBJECT_TYPES;
(function(SLIDE_OBJECT_TYPES2) {
  SLIDE_OBJECT_TYPES2["chart"] = "chart";
  SLIDE_OBJECT_TYPES2["hyperlink"] = "hyperlink";
  SLIDE_OBJECT_TYPES2["image"] = "image";
  SLIDE_OBJECT_TYPES2["media"] = "media";
  SLIDE_OBJECT_TYPES2["online"] = "online";
  SLIDE_OBJECT_TYPES2["placeholder"] = "placeholder";
  SLIDE_OBJECT_TYPES2["table"] = "table";
  SLIDE_OBJECT_TYPES2["tablecell"] = "tablecell";
  SLIDE_OBJECT_TYPES2["text"] = "text";
  SLIDE_OBJECT_TYPES2["notes"] = "notes";
})(SLIDE_OBJECT_TYPES || (SLIDE_OBJECT_TYPES = {}));
var PLACEHOLDER_TYPES;
(function(PLACEHOLDER_TYPES2) {
  PLACEHOLDER_TYPES2["title"] = "title";
  PLACEHOLDER_TYPES2["body"] = "body";
  PLACEHOLDER_TYPES2["image"] = "pic";
  PLACEHOLDER_TYPES2["chart"] = "chart";
  PLACEHOLDER_TYPES2["table"] = "tbl";
  PLACEHOLDER_TYPES2["media"] = "media";
})(PLACEHOLDER_TYPES || (PLACEHOLDER_TYPES = {}));
var BULLET_TYPES;
(function(BULLET_TYPES2) {
  BULLET_TYPES2["DEFAULT"] = "&#x2022;";
  BULLET_TYPES2["CHECK"] = "&#x2713;";
  BULLET_TYPES2["STAR"] = "&#x2605;";
  BULLET_TYPES2["TRIANGLE"] = "&#x25B6;";
})(BULLET_TYPES || (BULLET_TYPES = {}));
var IMG_BROKEN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAB3CAYAAAD1oOVhAAAGAUlEQVR4Xu2dT0xcRRzHf7tAYSsc0EBSIq2xEg8mtTGebVzEqOVIolz0siRE4gGTStqKwdpWsXoyGhMuyAVJOHBgqyvLNgonDkabeCBYW/8kTUr0wsJC+Wfm0bfuvn37Znbem9mR9303mJnf/Pb7ed95M7PDI5JIJPYJV5EC7e3t1N/fT62trdqViQCIu+bVgpIHEo/Hqbe3V/sdYVKHyWSSZmZm8ilVA0oeyNjYmEnaVC2Xvr6+qg5fAOJAz4DU1dURGzFSqZRVqtMpAFIGyMjICC0vL9PExIRWKADiAYTNshYWFrRCARAOEFZcCKWtrY0GBgaUTYkBRACIE4rKZwqACALR5RQAqQCIDqcASIVAVDsFQCSAqHQKgEgCUeUUAPEBRIVTAMQnEBvK5OQkbW9vk991CoAEAMQJxc86BUACAhKUUwAkQCBBOAVAAgbi1ykAogCIH6cAiCIgsk4BEIVAZJwCIIqBVLqiBxANQFgXS0tLND4+zl08AogmIG5OSSQS1gGKwgtANAIRcQqAaAbCe6YASBWA2E6xDyeyDUl7+AKQMkDYYevm5mZHabA/Li4uUiaTsYLau8QA4gLE/hU7wajyYtv1hReDAiAOxQcHBymbzark4BkbQKom/X8dp9Npmpqasn4BIAYAYSnYp+4BBEAMUcCwNOCQsAKZnp62NtQOw8WmwT09PUo+ijaHsOMx7GppaaH6+nolH0Z10K2tLVpdXbW6UfV3mNqBdHd3U1NTk2rtlMRfW1uj2dlZAFGirkRQAJEQTWUTAFGprkRsAJEQTWUTAFGprkRsAJEQTWUTAFGprkRsAJEQTWUTAFGprkRsAJEQTWUTAFGprkRsAJEQTWUTAGHqrm8caPzQ0WC1logbeiC7X3xJm0PvUmRzh45cuki1588FAmVn9BO6P3yF9utrqGH0MtW82S8UN9RA9v/4k7InjhcJFTs/TLVXLwmJV67S7vD7tHF5pKi46fYdosdOcOOGG8j1OcqefbFEJD9Q3GCwDhqT31HklS4A8VRgfYM2Op6k3bt/BQJl58J7lPvwg5JYNccepaMry0LPqFA7hCm39+NNyp2J0172b19QysGINj5CsRtpij57musOViH0QPJQXn6J9u7dlYJSFkbrMYolrwvDAJAC+WWdEpQz7FTgECeUCpzi6YxvvqXoM6eEhqnCSgDikEzUKUE7Aw7xuHctKB5OYU3dZlNR9syQdAaAcAYTC0pXF+39c09o2Ik+3EqxVKqiB7hbYAxZkk4pbBaEM+AQofv+wTrFwylBOQNABIGwavdfe4O2pg5elO+86l99nY58/VUF0byrYsjiSFluNlXYrOHcBar7+EogUADEQ0YRGHbzoKAASBkg2+9cpM1rV0tK2QOcXW7bLEFAARAXIF4w2DrDWoeUWaf4hQIgDiA8GPZ2iNfi0Q8UACkAIgrDbrJ385eDxaPLLrEsFAB5oG6lMPJQPLZZZKAACBGVhcG2Q+bmuLu2nk55e4jqPv1IeEoceiBeX7s2zCa5MAqdstl91vfXwaEGsv/rb5TtOFk6tWXOuJGh6KmnhO9sayrMninPx103JBtXblHkice58cINZP4Hyr5wpkgkdiChEmc4FWazLzenNKa/p0jncwDiqcD6BuWePk07t1asatZGoYQzSqA4nFJ7soNiP/+EUyfc25GI2GG53dHPrKo1g/1Cw4pIXLrzO+1c+/wg7tBbFDle/EbQcjFCPWQJCau5EoBoFpzXHYDwFNJcDiCaBed1ByA8hTSXA4hmwXndAQhPIc3lAKJZcF53AMJTSHM5gGgWnNcdgPAU0lwOIJoF53UHIDyFNJcfSiCdnZ0Ui8U0SxlMd7lcjubn561gh+Y1scFIU/0o/3sgeLO12E2k7UXKYumgFoAYdg8ACIAYpoBh6cAhAGKYAoalA4cAiGEKGJYOHAIghilgWDpwCIAYpoBh6cAhAGKYAoalA4cAiGEKGJYOHAIghilgWDpwCIAYpoBh6ZQ4JB6PKzviYthnNy4d9h+1M5mMlVckkUjsG5dhiBMCEMPg/wuOfrZZ/RSywQAAAABJRU5ErkJggg==";
var IMG_PLAYBTN = "data:image/png;base64,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AAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKSEAhgAAAAAAAAgJRTAAAAAAAAAACmhAAYAAAAAAABICQUwAAAAAAAAQEoogAEAAAAAAABSQgEMAAAAAAAAkBIKYAAAAAAAAICUUAADAAAAAAAApIQCGAAAAAAAACAlFMAAAAAAAAAAKaEABgAAAAAAAEgJBTAAAAAAAABASiiAAQAAAAAAAFJCAQwAAAAAAACQEgpgAAAAAAAAgJRQAAMAAAAAAACkhAIYAAAAAAAAICUUwAAAAAAAAAApoQAGAAAAAAAASAkFMAAAAAAAAEBKKIABAAAAAAAAUkIBDAAAAAAAAJASCmAAAAAAAACAlFAAAwAAAAAAAKREkRUAAACwrUpLSwuGDRvWfMCAAS26du3avKysrLiioqKkZcuWzZs1a1bcvHnz0tLS0rJsNtusuLi4ebNmzUoLCgo+8/eijY2N9Zs3b66pra2tqqur21xTU1NdVVVVs2nTptqNGzdWbdiwoeYvf/nL5hUrVlQtWLBgw6xZs6pqamoaJQYAAEDaKYABAACIiIghQ4aUHnTQQW379u3bql27dq3at2/fpkWLFq2bN29eWVpa2qpZs2bNCwsLm2ez2fLCwsLyoqKi8sLCwtKknK+hoaG6vr6+qqGh4S91dXV/aWhoqNq8eXNVTU3NuqqqqvUbNmxYu2rVqjWrV69e99Zbb6177rnnPpgzZ06NTwYAAABJogAGAADIA8OGDWt+xBFHdBwwYECnLl26dGjdunXHFi1adCgtLe1YUlLSvlmzZq0KCgqK07yDwsLCssLCwrKIaPdp/zuNjY21mzdvXrdp06ZVNTU172/YsGHl2rVr31+2bNnKBQsWrHjyySffnzVrVpVPGAAAAE1Fpuexsd9HfaF+ZcSal0ptCAAAIAE6deqUPf744zvtueeeXbp3796lbdu2XSorKzuXlpZ2KS0t7VBYWFhhSztGQ0PDxpqampU1NTXL169fv+yDDz5Y9s477yybPXv2sj/96U8rVqxYUWdLAAAAbE9t9q6Jog4f/TUFMAAAQEJks9nMt7/97Y4jRozo1bdv397t2rXrXl5e3rWsrKxzcXFx+4gosKUmp7G2tnZVTU3Nso0bNy5btWrV0tdff/2tJ598cvG999672noAAADYFgpgAACAhPne977X6a9Fb/v27Xu1bNmyV1lZWa8kvXOXLauvr9/wl7/8ZdG6desWL1u2bNHChQsX/fGPf1w8derUjbYDAADAliiAAQAAmqhsNps59dRTuxx66KH9+/Tp87n27dv3Ly8v719UVOSRzXlq06ZNKzZu3Pj6+++//8abb775xqOPPvrG3XffvcpmAAAA+CsFMAAAQBNx6qmndvniF784qHfv3v3btWv3uYqKis8VFhaW2wxbUl9fv37Dhg1vfPDBB68vXrz4jccee2z+jTfeuNxmAAAA8pMCGAAAYBc45phjWn/rW9/aq3///kPatGnTv6Kiop9HOLO9NDQ0VG/cuPGtNWvWLFy4cOGcO+6445WHHnporc0AAACknwIYAABgJzjjjDO6f+lLX9qrV69eg1u3bj2orKysR0RkbIadJFddXb103bp18xcvXjz30UcffeXqq69+x1oAAADSRwEMAACwnZWWlhb86le/2u3QQw8d1r17931btmw5qLCwsMxmaEoaGhqqP/zww/nvvPPOzGeeeWbW2LFj36ipqWm0GQAAgGRTAAMAAGwHP/7xj7t+9atf3bdXr15D27Ztu1c2m21jKyRJXV3dmg8++OCVRYsWvfznP/95xh/+8IdltgIAAJA8CmAAAIBtcOKJJ7Y75ZRTDujXr9+w1q1bD81ms61shTSpq6tbt3bt2pfffPPNWbfccsvUe++9d7WtAAAANH0KYAAAgE+hoqKi4IILLhg0YsSI/bp27bpfy5YtB2YymUKbIR/kcrmGDz/8cP6777474/nnn59x4YUXvrZx40aPiwYAAGiCFMAAAAAf4/jjj2/7/e9//8D+/fsf2Lp1630KCgpKbAUiGhsbN61fv37eW2+9NeWGG2545u67715lKwAAAE2DAhgAAOB/ZLPZzAUXXPC5I4888sDu3bsfWFFRsVtEFNgMbFl1dfWSd999d8qsWbNmnnvuuS+vW7euwVYAAAB2DQUwAACQ10pLSwsuvfTSQYcccsjBXbt2HVFWVtbDVmDb1dbWrnr//fdfmDp16uRf/vKXL65evbreVgAAAHYeBTAAAJB3Bg0aVHrBBRd8fs899zywQ4cOBxQVFbWwFdj+Ghsba9euXTtrzpw5T59//vmTX3755WpbAQAA2LEUwAAAQF4YNmxY8/POO+/gIUOGHOZ9vrDz/W0ZfNFFFz07a9asKlsBAADY/hTAAABAarVq1arwyiuv3HfEiBEjO3TocFBhYWGZrcCu19DQUP3+++8/O2XKlIk/+clPZm7cuLHRVgAAALYPBTAAAJAqrVq1Kvztb3+7/3777Xd4x44dRxQWFpbbCjRdDQ0NG99///0pM2bMeOqHP/zhC8pgAACAz0YBDAAApMJZZ53V45vf/OaRvXr1GllaWtrVRiB5ampq3l28ePHEO++8c9LVV1/9jo0AAABsPQUwAACQWMOHDy+/6KKLvjB48OCjW7RoMdBGID0+/PDDV+fNmzfhvPPOe3L69Ol/sREAAIBPRwEMAAAkSqtWrQpvuOGGQ/bbb79/atOmzX6ZTCZrK5BeuVyubs2aNTNmzJjx2JgxYyavW7euwVYAAAA+ngIYAABIhB//+Mddv/e9732lZ8+e/1RcXNzWRiD/1NbWfvD2228/dssttzz029/+9l0bAQAA+L8UwAAAQJNVUVFRcO21137+4IMPPrZ169b7ZTKZAlsBIqJxzZo1M59//vnxp5122hR3BQMAAPx/CmAAAKDJOeWUUzqefvrpx/bu3ftL2Wy2jY0AH6e+vn7j0qVLH/vd7373x+uvv36ZjQAAAPlOAQwAADQJ2Ww2c+uttx5wyCGHnNC6deu9I8LdvsDWaFy7du1L06ZN+/OPfvSjZ1evXl1vJQAAQD5SAAMAALtU//79S6655pp/2nPPPY8tLy/vayPAZ1VTU7NswYIF488999wHp06dutFGAACAfKIABgAAdomf//znPU855ZQTu3btemRhYWGZjQDbW2NjY92KFSuevOWWW+689NJLF9kIAACQDxTAAADATuMxz8Cusn79+rlPP/30f5188slT6+rqcjYCAACklQIYAADY4fr27Vv8hz/84a+Pee5nI8CuUlNT8+68efPu/8EPfvDgwoULN9kIAACQNgpgAABghxkyZEjpNddc89XBgwefWFxc3MFGgKaitrZ21dy5c+/5yU9+8uc5c+bU2AgAAJAWWyqAPYoNAADYJqNHj+4wb968n06ZMuXRYcOGnaH8BZqa4uLi9sOGDTtjypQpj86bN++nJ510UntbAQAA0s4dwAAAwFY599xze33/+9//dufOnY/IZDJZGwGSIpfL1S1fvvzJG2644fbLLrvsbRsBAACSyiOgAQCAz+y8887r+53vfOfbHTt2PDyTyRTaCJBUuVyuYcWKFU/cdNNN//XrX/96sY0AAABJowAGAAC22WWXXTboG9/4xg9at249zDaAtFm7du2su++++9pzzjnnNdsAAACSQgEMAABsNcUvkE8UwQAAQJIogAEAgE9N8Qvks7Vr18665557rvv5z38+3zYAAICmaksFcGHlwOj6UV9orIqoWZG1PQAAyBO/+MUvet9xxx3nHHrooT8pLS3tYiNAPiotLe2y7777HvP973+/X1lZ2ZIpU6assxUAAKCpKetcHwXlH/01BTAAAOS5M844o/u99957zpe//OWflZeX94qIjK0AeS5TXl7e8+CDDx71/e9/v3dEvDVjxowPrQUAAGgqFMAAAMD/ceKJJ7a77777fjJq1Kh/KS8v7xOKX4B/lCkvL+99+OGHj/rWt77VfvXq1Qvnz59fbS0AAMCutqUC2DuAAQAgzwwdOrTs+uuvP6l///4nFRYWltkI20NjY2Ns2rQpqquro6amJurr62PTpk2xefPmqK+vj+rq6qivr4/NmzfHpk2boqGhYZv/fxUWFkZJSUk0a9YsioqKoqysLIqKiqJZs2ZRUlISRUVFUVpa+r9/FRQUCIjtoqGhoeq11167a8yYMffMmTOnxkYAAIBdZUvvAFYAAwBAnujUqVP2nnvuGbXXXnudnM1mK22Ej9PQ0BAbN26MDRs2/J+/Nm7cGBs3boyamprYtGlTbNq0KWpqaqK2trbJnqe4uDhKSkqitLT0f/9eUVERFRUV0aJFi//zV0VFRRQWFvog8LHq6urWvvjii7eceOKJf169enW9jQAAADubAhgAAPLcXXfdddAXv/jF00tLS7vZRn7L5XKxYcOGWLt2baxbty7Wrl37d3+tW7cuNmzYkPd7atGiRbRu3TpatWoVrVu3jjZt2vzvf27dunW0aNHCh4morq5e+sgjj1zzne98Z6ptAAAAO5MCGAAA8tTVV189+MQTTzyzoqJioG3kj8bGxli5cmUsX748Pvjgg1i9evX//n3t2rXR2NhoSZ9RYWFhtGrVKtq1axdt27b937937tw5OnTo4LHTeWbDhg3z77333qvOPPPMebYBAADsDApgAADIM1/72tfaXHrppad27979qIjQRKVUQ0NDrFq1KlasWBHvv//+//595cqVTfqRzGlXXFwcHTp0iI4dO0bnzp2jY8eO0alTp2jXrp1HS6dYLpdrfOeddx76+c9/fv2ECRPW2QgAALAjKYABACBP9OrVq9ldd931jT322OM7hYWFZTaSHh9++GG88847sXTp0njvvfdixYoVsXr16mhoaLCchCgsLIz27dtHp06dolu3btG9e/fo3r27x0mnTENDQ9W8efNu++Y3v/nHJUuWbLYRAABgR1AAAwBAHrjrrrtG/NM//dOZJSUlXWwj2davXx9Lly6Nd955539L3w8//NBiUqqysvJ/y+C//tWqVSuLSbiamppljz322G9Gjx49xTYAAIDtTQEMAAAp9qtf/arPD3/4w5+1atVqL9tIno0bN8aSJUvirbfeikWLFsV7770XmzZtspg8V1JSEl27do0+ffpE3759o3fv3lFeXm4xCbRu3bqXr7322ivGjh27yDYAAIDtRQEMAAApNGjQoNI77rjju7vttttJBQUFWRtJhtWrV8ebb74ZixcvjiVLlsTy5cujsbHRYtiigoKC6Ny5c/Tu3Tt69+4d/fr1i7Zt21pMQjQ2Nta98cYbd33rW9+6ff78+TU2AgAAfFYKYAAASJHS0tKCBx988Jj99tvvn7PZbBsbaboaGhri7bffjrfeeisWLFgQS5YscXcv201FRUX06tUr+vbtG3379o2ePXtGYWGhxTRhdXV1a2bMmHHjV77ylYdqamr85gcAALDNFMAAAJASp59+erdf/vKX51ZWVu5jG03T6tWr47XXXouFCxfGm2++GRs3brQUdooWLVpE3759Y8CAATFw4EB3CDdh69evf/E//uM//vPqq69+xzYAAIBtoQAGAICEGzRoUOm99977w969ex+byWTc4teErF+/PubNmxcLFiyIN954Q+FLk9GiRYvo169fDBgwIPbYY4+orKy0lCYkl8s1LF68eNyJJ554rcdCAwAAW0sBDAAACXbNNdcMOemkk35RVlbWyzZ2vVwuF++++27MnTs3XnvttViyZIl3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B7lcrm7y5Mm//vKXv/yIbQAAwK63pXcAK4ABAMg7paWlBTNnzjyzT58+x9vG39uwYUOMGzcuZsyY4VHPQF7KZDKx3377xde//vWoqKiwkH+waNGiP+27775X1dTUeCwEAADsQgpgAAD4H926dctOnjz5V506dRppG/9fLpeLqVOnxp///OfYuHGjhQB5r6KiIkaNGhX777+/x0L/g+XLlz9+6KGHXvLuu+/W2QYAAOwaWyqAvQMYAIC8MXz48PInnnjiynbt2o2wjf/vnXfeiWuvvTaee+652Lx5s4UARMTmzZtjzpw58dprr0XPnj2jRYsWlvI/Kioq+n7rW98aMnXq1Ofee+89f3AAAMAusKV3ACuAAQDIC9/+9rc73n777X9o0aLFANv4b1VVVXHXXXfFvffeG+vXr7cQgI+wbt26eP7552P9+vWx2267RVFRkaVERElJSefjjjvuoA8++GDKK6+88hcbAQCAnUsBDABAXjv//PP7XXzxxX8oKSnpbBv/bfr06XHttdfGokWLLAPgU3jnnXdi2rRp0bp16+jc2R8nERHZbLbyC1/4whElJSUvTp48eY2NAADAzqMABgAgb/3ud7/b60c/+tFVRUVFrWwjYs2aNXHzzTfHpEmTora21kIAtkJtbW289NJL8c4770Tfvn2jtLQ073dSWFhYNnz48C/26dNn4UMPPbTMpwQAAHYOBTAAAHnp1ltv3f+b3/zmfxYWFjbP913kcrl4/vnn4/rrr4/ly5f7cAB8BitXroxp06ZFRUVFdOvWLTKZTF7vo6CgIDto0KBDBw0atOiBBx54xycEAAB2vC0VwJmex8Z+H/WF+pURa17ym6wAACTTww8//KXDDjvsXzKZTN6/rPGDDz6I22+/Pd544w0fDIDtbMCAAfGtb30r2rRpk/e7yOVyjVOmTPn1yJEjH/LJAACAHavN3jVR1OGjv6YABgAgdV555ZXTPve5z30r3/fQ0NAQjz32WDz++ONRV1fngwGwg2Sz2Tj66KPjC1/4QhQUFOT9Pl5//fU79tprr9/7ZAAAwI6jAAYAIC9ks9nMyy+/fFafPn2Oz/ddvPvuu3HbbbfFe++954MBsJN069YtvvOd70S3bt3yfhdLliy5f5999rmypqam0ScDAAC2PwUwAACpV1paWjBr1qyzevfufVw+7yGXy8WTTz4ZDz74oLt+AXaBbDYbxxxzTBxxxBF5fzfw0qVLHxg6dOjlSmAAANj+FMAAAKRar169mk2ePHlsu3btDsrnPaxcuTJuueWWePvtt30oAHaxnj17ximnnBIdOnTI6z2sXr16yiGHHPIvS5Ys2exTAQAA28+WCuDCyoHR9aO+0FgVUbMia3sAADRpQ4cOLXvqqacub9Omzf75uoNcLhfPPPNMXH/99bF27VofCoAmYP369TFlypQoKSmJnj17RiaTycs9NG/evPtJJ500ZPLkyc+sWLHCoykAAGA7KetcHwXlH/01BTAAAIk1ZMiQ0kceeeSKVq1a7Z2vO6iuro7bb789nnjiiWhs9IRNgKaksbEx5s+fH++//34MGDAgstn8/DlLaWlpp6997WuDn3rqqadXrlxZ75MBAACfnQIYAIDUOfTQQ1s8+OCDv2/ZsuUe+bqDOXPmxNVXX+2RzwBN3PLly+OFF16Ijh075u0joUtLSzudcMIJ+7/00ktPv/3227U+FQAA8NkogAEASJVhw4Y1v++++37TsmXLQfl4/vr6+hg/fnz88Y9/jNpaP0MHSILNmzfHiy++GJs3b47ddtstCgoK8m4HxcXFbY866qg9n3vuuaeXL1/ucdAAAPAZKIABAEiNI488snLcuHG/b9GixcB8PP97770XV111VcyZM8eHASCBFi1aFC+//HL069cvWrRokXfnLykp6XDcccftP2fOnGcWLVq0yScCAAC2jQIYAIBUOPLIIyvvvPPO35aXl++Wj+d/+umn48Ybb4wPP/zQhwEgwf7yl7/ECy+8ECUlJdGrV6+8O3+zZs3aHHXUUfspgQEAYNspgAEASLxjjz227W233faH5s2b98m3s1dVVcXNN98cTz31VDQ2NvowAKRAY2NjzJ8/P5YtWxYDBgyIZs2a5dX5mzVr1uaYY4458M0333xm4cKFNT4RAACwdRTAAAAk2qGHHtritttuuzofy9+33347rrnmmli8eLEPAkAKvf/++/HKK69Enz59orKyMq/Ons1mK4888sh9Zs6c+dTSpUs3+zQAAMCnpwAGACCxjjjiiJb33nvvteXl5f3y6dy5XC4mTZoUN998c1RVVfkgAKRYVVVVTJ06NbLZbPTp0ycymUzenL24uLjtV7/61c+/8sorTy1evLjWpwEAAD4dBTAAAIl06KGHtrj33nt/l2/lb3V1ddx0000xefLkyOVyPggAeSCXy8WCBQvi3Xffjd133z2y2fz5mUyzZs1aH3300fvNmDHjSXcCAwDAp6MABgAgcYYOHVo2fvz4qysqKgbk07mXLVsWV111lUc+A+SplStXxiuvvBKf+9znoqKiIm/O3axZszZHH3300GeeeebJFStW1PkkAADAlimAAQBIlCFDhpQ++uij17Rs2XL3fDr31KlT49prr42NGzf6EADksaqqqpg+fXq0bds2unTpkjfnLikpaT9q1KihTz755JMrV66s90kAAICPt6UCuMB6AABoSjp16pSdMGHCv1dWVu6RL2dubGyMcePGxR133BF1dW56AiCitrY2br755hg/fnw0NjbmzbkrKyv3mDBhwr9369bNXQkAALCNFMAAADQZrVq1Kpw+ffolbdq02T9fzlxdXR2/+93vYtKkSd73C8DfyeVy8fjjj8fvf//7qK6uzptzt2nTZv8pU6Zc0qpVq0KfAgAA2HoKYAAAmoSKioqC2bNnX9KuXbuD8uXMS5cujYsuuijmz5/vAwDAx3r11VfjoosuiqVLl+bNmdu1a3fQ7Nmz/72iosLPrgAAYCu5iAYAoEmYOXPmz9q1a3dIvpz35ZdfjiuuuCLWrVsnfAA+0bp16+KKK66Il19+OW/O3K5du4Nnzpz5M+kDAMDWUQADALDLvfjii2N69OgxKh/Omsvl4oEHHogbbrghamtrhQ/Ap1ZbWxs33HBDPPDAA3nz2oAePXqMevHFF8dIHwAAPj0FMAAAu9SkSZO+NnDgwFPy4ax1dXVx8803x8SJE73vF4BtksvlYuLEiXHLLbdEXV1dXpx54MCBJ0+aNOlr0gcAgE9HAQwAwC7z6KOPHnXggQeekw9nXbduXfz617+OWbNmCR6Az2zmzJnx61//Ol9eJZA58MADz3n00UePkjwAAHyywsqB0fWjvtBYFVGzImtDAADsEDfeeOO+Rx999EWZTKYw7Wddvnx5XHXVVbFy5UrBA7DdbNiwIWbPnh0DBw6MioqKtB8307179/179uz56sMPP7xc+gAA5LuyzvVRUP7RX1MAAwCw011xxRV7fPe7372qoKCgWdrPOmfOnPjtb38bGzduFDwA2111dXVMmzYtOnfuHB07dkz1WTOZTOHuu+9+eJs2bV6aNGnSKukDAJDPFMAAADQZZ5xxRvef/exnvy0sLCxP+1knTJgQd999d9TX1wsegB2moaEhXnrppchms9G3b99UnzWTyRTttddeB/3lL395dubMmRukDwBAvlIAAwDQJBx00EEVf/jDH64pLi7ulOZz5nK5eOCBB+Kxxx4TOgA77c+eBQsWRF1dXfTv3z8ymUxqz1pQUFBywAEHDJs+ffqkpUuXbpY+AAD5aEsFcIH1AACwMwwaNKj0vvvuu7qsrKxXms9ZV1cX1113XUyaNEnoAOx0EydOjOuvvz7q6upSfc6ysrJef/rTn67u379/idQBAODvKYABANjhKioqCh577LGLKyoqBqb5nNXV1XHNNdfE7NmzhQ7ALvPKK6/ElVdeGVVVVak+Z4sWLQZOnDhxbEVFhZ9vAQDA33CBDADADjdz5syftW3b9sA0n3HdunVx2WWXxRtvvCFwAHa5xYsXx2WXXRZr165N9TnbtWt34MyZM38mcQAA+P8UwAAA7FBPPvnkqB49eoxK8xlXrVoVV1xxRSxfvlzgADQZK1asiCuuuCJWrlyZ6nP26NFj1KRJk0ZJHAAA/lth5cDo+lFfaKyKqFmRtSEAALbZjTfeuO+XvvSlCzOZTGp/8fDdd9+NK6+8MtatWydwAJqc6urqmDVrVvTv3z8qKytTe85u3boN79mz57yHH37Yb2MBAJAXyjrXR0H5R39NAQwAwA5x3nnn9T311FOvLigoKE7rGV977bW45pprorq6WuAANFmbN2+OGTNmRI8ePaJ9+/apPGMmkykYNGjQIYWFhVOee+45v5UFAEDqKYABANipjjrqqFb/8R//8YdmzZq1SusZX3755bj++uujrq5O4AA0eQ0NDfHSSy9Fp06dolOnTqk8Y0FBQXbYsGGfnz9//qQ33nhjk9QBAEizLRXA3gEMAMB21a1bt+wNN9zwnyUlJR3TesYpU6bEjTfeGPX19QIHIDHq6+vjxhtvjKlTp6b2jCUlJZ1uuOGG/+jWrZu7GgAAyFsKYAAAtqunn376XyorK/dI6/kmTZoUd955ZzQ2NgobgMRpbGyMO+64I5588snUnrGysnLw008//UtpAwCQrxTAAABsN88///w3unTp8k9pPd/EiRNj3LhxkcvlhA1AYuVyubj//vtTXQJ36dLlS88+++yJ0gYAIB95BzAAANvFTTfdNPzII488L5PJZNJ4vsceeyzGjx8vaABS47XXXotmzZpF3759U3m+zp0779urV695Dz/88DJpAwCQNlt6B7ACGACAz+wXv/hF7x/+8IdXFxQUNEvj+R544IF45JFHBA1A6ixYsCDq6upiwIABqTtbJpPJDBo06ODGxsbnpk6dul7aAACkiQIYAIAd5oADDqj43e9+99tmzZq1TeP5xo0bF5MmTRI0AKm1aNGi2Lx5cwwcODB1ZysoKMjut99+w5577rnH33vvvc3SBgAgLbZUAHsHMAAA2yybzWbuvPPOfyktLe2exvNNmDBB+QtAXpg0aVI89NBDqTxbaWlpj3vuuedfstlsRtIAAOQDBTAAANvs+eef/06HDh0OTePZHn744Xj44YeFDEDeeOSRR+LPf/5zKs/WoUOHw5599tlvSxkAgHygAAYAYJvcd999hw8ePPjUNJ7t/vvvjwkTJggZgLzz2GOPxX333ZfKs+25554/+NOf/nSYlAEASDvvAAYAYKudccYZ3ceMGXN5QUFBcdrONnHixHjkkUeEDEDeWrx4cWSz2ejbt2/ajpbp06fPvn/5y18mz5w5c4OkAQBIsi29A1gBDADAVhk2bFjzG2+88Q/NmjVrl7azPfroo6l99CUAbI2FCxdGUVFR9OvXL1XnKigoKD7wwAP3e/LJJx9dsWJFnaQBAEiqLRXAHgENAMBWuffee39ZWlraPW3nevzxx+PBBx8UMAD8jz//+c8xceLE1J2rtLS0x3333fdLCQMAkFYKYAAAPrVJkyaN6tSp0xEpPFeMHz9ewADwD8aPHx+TJ09O3bk6der0hUmTJn1VwgAApJFHQAMA8Kmcd955fU888cR/z2QyRWk618yZM+Puu+8WMAB8jNdeey06duwYnTt3TtW5unbtuk9BQcHzzz333DopAwCQNN4BDADAZ3LEEUe0vOKKK67NZrOVaTrXyy+/HDfffHPkcjkhA8DHyOVyMXv27OjSpUt06tQpNefKZDJF++yzz/CpU6c+9u67726WNAAASeIdwAAAbLNsNpu55ZZb/q2kpKRjms61YMGCuPnmm6OxsVHIAPAJGhsb4+abb44333wzVecqLS3tcvfdd5+fzWYzUgYAIC0UwAAAbNGkSZO+3rZt2wPTdKZly5bFDTfcEPX19QIGgE+prq4urr322li+fHmqztWuXbsDH3/88VESBgAgLTwCGgCAj3XZZZcN+upXvzo2k8mk5hcH33///bjyyiujqqpKwACwlerq6uLll1+OIUOGRHl5eWrO1aVLl31LS0unPvPMM2ukDABAEngENAAAW61///4lJ5988q8ymUxRWs60YcOG+P3vfx8bN24UMABso40bN8bvfve7VP15WlBQkP3hD394ft++fYslDABA4q9vrQAAgI/y4IMPnl1WVtYrLeeprq6O3/zmN7Fq1SrhAsBntGrVqrjyyiujuro6NWcqKyvr8/DDD58lXQAAkk4BDADA/zF+/Pgju3XrdnRazlNfX5/KdxYCwK60fPnyuO6666K+vj41Z+rRo8dXx40bd4R0AQBIMgUwAAB/53vf+16nI4444py0nCeXy8Vtt90Wb7zxhnABYDt7/fXX47bbbotcLpeaMx155JHnfvvb3+4oXQAAkkoBDADA/6qoqCi4+OKLLywsLCxPy5nGjx8fs2bNEi4A7CCzZs2Khx56KDXnKSwsrPj1r399QUVFhZ+bAQCQSC5kAQD4XxMnThxdWVk5OC3nef7552PixImCBYAd7LHHHosXXnghNeeprKzc89FHHz1RsgAAJFFh5cDo+lFfaKyKqFmRtSEAgDxxwQUX7DZq1KgLM5lMYRrO8+qrr8Ytt9ySqkdSAkBT/7O3d+/e0a5du1Scp2PHjkNzudxzU6ZMWSddAACamrLO9VHwMc/wcwcwAADRt2/f4h//+McXZzKZVPwG4HvvvRc33HBDNDY2ChcAdpKGhoa47rrrYtmyZak4T0FBQfbss88e27dv32LpAgCQqGtZKwAAYPz48T8qKyvrkYazbNiwIX7/+99HbW2tYAFgJ9u0aVP8/ve/j40bN6biPGVlZb3GjRs3RrIAACSJAhgAIM/ddNNNw/v06XN8Gs5SX18f1157baxdu1awALCLrFmzJq699tqor69PxXn69ev3jd///vdDJQsAQFIogAEA8thBBx1Uceyxx/5rRGTScJ477rgjFi9eLFgA2MUWLVoUd955Z1qOU/CNb3zj34YNG9ZcsgAAJOIC1goAAPLXzTfffFZxcXG7NJxl4sSJMX36dKECQBMxbdq0mDRpUirOUlJS0unOO+88Q6oAACSBAhgAIE/913/914FdunT5UhrO8tprr8Wf//xnoQJAEzN+/PhYsGBBKs7SrVu3o2+66abhUgUAoKlTAAMA5KEvfelLlV/5yld+lYazrFixIq6//vpobGwULAA0MY2NjXHdddfFihUr0nCczHHHHfergw46qEKyAAA0ZQpgAIA8dPXVV5+ezWYrk36OmpqauPbaa2PTpk1CBYAmatOmTXHttddGTU1N4s+SzWbb3njjjT+RKgAATZkCGAAgz9x6663Du3Tp8uWknyOXy8Utt9wSK1euFCoANHErV66MW2+9NXK5XOLP4lHQAAA0dQpgAIA8MnTo0LKvfvWrv0jDWSZMmBBz584VKgAkxJw5c+Kxxx5LxVlGjRr1i6FDh5ZJFQCApkgBDACQR+64444fFRcXd0z6OV5++eV45JFHBAoACfPQQw+l4he4SkpKOt5xxx0/lCgAAE2RAhgAIE9cfvnlu/fs2XNU0s/xwQcfxB133JGKR0gCQL7J5XJx2223xZo1axJ/lp49ex57+eWX7y5VAACaGgUwAEAe6NatW/a73/3uv2YymURf/9XX18cNN9wQ1dXVQgWAhKqqqoobb7wx6uvrE32OTCZT8N3vfvdX3bp1y0oVAICmRAEMAJAHxo8ff0pZWVmvpJ/jnnvuiaVLlwoUABJuyZIlcd999yX+HGVlZT3Hjx9/ikQBAGhKFMAAACn385//vOeAAQNGJ/0c06dPjylTpggUAFJi8uTJMWPGjMSfY8CAAaN//vOf95QoAABNhQIYACDFstls5qyzzjo3k8kk+tGEK1asiLvvvlugAJAyd911V6xYsSLRZ8hkMtmzzjrr3Gw2m5EoAABNgQIYACDFxo0b98XKysq9knyG2trauOGGG6K2tlagAJAyf/1zfvPmzYk+R2Vl5V7jxo0bKVEAAJoCBTAAQEoNHz68/OCDDz4t6ee4//77Y/ny5QIFgJRavnx5jBs3LvHnGDFixI+HDRvWXKIAAOxqCmAAgJS69dZbT8tms22TfIYZM2bEc889J0wASLnJkyfHzJkzE32G4uLitrfffvtp0gQAYFdTAAMApNBVV121R48ePb6S5DOsXLky7rrrLmECQJ64++6744MPPkj0GXr27PnVK664Yg9pAgCwKymAAQBSprS0tOAb3/jGT5N8rdfY2Bi333679/4CQB6pqamJ2267LRobG5N8jIJvfvObZ5aWlvqZGwAAu+6i1AoAANJlwoQJX6uoqBiQ5DOMHz8+Fi1aJEwAyDNvvvlmPPjgg4k+Q4sWLQY9+OCDx0gTAIBdRQEMAJAiRx55ZOWwYcN+kOQzzJ07N5544glhAkCemjhxYixYsCDRZxg+fPiPjjjiiJbSBABgV1AAAwCkyBVXXHFyUVFRRVLnr6qqijvvvDNyuZwwASBP5XK5uP3226O6ujqxZygqKmrxm9/85mRpAgCwKyiAAQBS4vzzz+/Xu3fv45J8httvvz0+/PBDYQJAnlu3bl3cfvvtiT5D7969jz///PP7SRMAgJ1NAQwAkALZbDZz6qmn/jyTyST2+m769OkxZ84cYQIAERExe/bsmDFjRmLnz2QyBaeeeurPs9lsRpoAAOxMCmAAgBT44x//eERlZeXgpM6/du3auPfeewUJAPyde+65J9atW5fY+SsrKwf/6U9/+oIkAQDYmRTAAAAJ17dv3+JDDjnkR0k+w9133x01NTXCBAD+Tk1NTdx9992JPsPBBx/8o759+xZLEwCAnUUBDACQcHfdddc3S0pKOiV1/smTJ8e8efMECQB8pLlz58azzz6b2PlLSko63nPPPd+SJAAAO4sCGAAgwb70pS9VDhw48KSkzr9mzZoYP368IAGALXrggQdizZo1iZ2/f//+Jx111FGtJAkAwM6gAAYASLArrrji1MLCwvIkzp7L5eK2226LTZs2CRIA2KJNmzbFbbfdFrlcLpHzFxYWll1++eU/kCQAADuDAhgAIKF+8Ytf9O7evftXkjr/s88+G2+88YYgAYBP5Y033ojnn38+sfN369bt6F/96ld9JAkAwI6mAAYASKgf/vCHP8pkMom8nvvggw/igQceECIAsFXGjRsX69atS+TsmUym4NRTT/2xFAEA2NEUwAAACXTdddcNa9eu3YFJnD2Xy8Udd9wRtbW1ggQAtsqmTZvizjvvTOz8bdq02f+mm27aT5IAAOxICmAAgIQpLS0t+NrXvnZ6Uud/4YUXYuHChYIEALbJq6++GjNmzEjs/Mccc8zpFRUVfiYHAMAO42ITACBhbr/99oMrKip2S+LsGzZsiHHjxgkRAPhM7r///qiqqkrk7OXl5X3/67/+6wgpAgCwoyiAAQASpKKiouCwww47Nanz33vvvYn9YS0A0HRs2LAh7r///sTOf9BBB/1zq1atCiUJAMCOoAAGAEiQ+++//+iysrKeSZx9zpw58dJLLwkRANguXnjhhViwYEEiZy8tLe32xz/+8StSBABgR1AAAwAkRN++fYv33Xfff07i7LW1tXHvvfcKEQDYru6+++6oq6tL5Oz77bffKf379y+RIgAA25sCGAAgIW6++eZRxcXFbZM4+yOPPBJr164VIgCwXa1atSoee+yxRM6ezWbb3njjjV+TIgAA25sCGAAgAYYOHVq21157fSeJs7/33nvxxBNPCBEA2CEmTpwYK1asSOTsQ4YM+c7QoUPLpAgAwPakAAYASIBrr732xKKiosqkzZ3L5eKee+6JxsZGIQIAO0R9fX3cddddkcvlEjd7UVFR5bXXXnuCFAEA2J4UwAAATdwBBxxQMWDAgG8kcfYZM2bEW2+9JUQAYId6880348UXX0zk7AMGDPjG8OHDy6UIAMD2ogAGAGjirrrqqhOKiooqkjb3pk2b4oEHHhAgALBT3H///VFbW5u4uYuKilpcffXV7gIGAGC7UQADADRhBx10UEX//v0Teffvww8/HB9++KEQAYCdYv369TFhwoREzj5w4MBvHHDAARVSBABge1AAAwA0Yf/5n/95bGFhYfOkzb1q1aqYPHmyAAGAnerpp5+O1atXJ27uwsLC8ssuu2yUBAEA2B4UwAAATdQBBxxQMWjQoNFJnP3uu++O+vp6IQIAO1V9fX3cddddiZx99913/+bQoUPLpAgAwGelAAYAaKIuv/zyYwsLC8uTNvfcuXNjwYIFAgQAdokFCxbE3LlzEzd3UVFRi9/97ndflyAAAJ+VAhgAoAkaOnRo2aBBgxL37t+6urr405/+JEAAYJf605/+FHV1dYmbe/fdd//mkCFDSiUIAMBnoQAGAGiCfvOb33ylqKioZdLmfu655xL53j0AIF1Wr14dzz33XOLmLioqann11VcfLUEAAD4LBTAAQBPTq1evZoMHD/5m0uaurq6ORx55RIAAQJPwyCOPRHV1deLmHjJkyLe6deuWlSAAANtKAQwA0MTcdNNNxxQXF7dN2twTJkyIqqoqAQIATUJVVVUifzmtuLi43a233uouYAAAtpkCGACgCWnVqlXhXnvtdVLS5l61alU8++yzAgQAmpTJkyfHqlWrEjf30KFDR7dq1apQggAAbAsFMABAE3LLLbccXlJS0jlpcz/44INRX18vQACgSamvr48HH3wwcXOXlJR0vummmw6VIAAA20IBDADQRGSz2cwBBxzw7aTNvWjRonjppZcECAA0SS+99FIsXrw4cXOPGDHiO9lsNiNBAAC2lgIYAKCJuOaaa/YuLy/vm7S5H3roocjlcgIEAJqkXC6XyLuAy8vL+1111VV7SRAAgK2lAAYAaCK+8pWvfDdpM8+bNy8WLlwoPACgSVu4cGG8+uqrrg8BAMgLCmAAgCbgsssuG1RZWblPkmbO5XIxfvx44QEAifDAAw8k7qklrVu33veSSy7pLz0AALaGAhgAoAkYNWrUCUmbefbs2bFs2TLhAQCJsGzZsnjllVcSN/cJJ5xwovQAANgaCmAAgF3sn//5nzt37NjxiCTN3NjYGA888IDwAIBEGT9+fDQ0NCRq5k6dOn1h9OjRHaQHAMCnpQAGANjFfvSjH30tk8kk6rps2rRpsWrVKuEBAImyatWqeOGFFxI1cyaTKfzpT386SnoAAHxaCmAAgF1o0KBBpX369Plqkmaur6+PCRMmCA8ASKQJEyZEXV1dombu27fvV/r27VssPQAAPg0FMADALnTZZZcdXlRUVJGkmadOnRpr164VHgCQSOvXr48pU6YkauaioqLK3/zmN0dIDwCAT0MBDACwi2Sz2cy+++57UpJmrqurc/cvAJB4jz76aOLuAt5///1PymazGekBAPBJFMAAALvI1VdfPbSsrKx3kmaeMmVKbNiwQXgAQKJt2LAhnn/++UTNXFZW1ueqq67aS3oAAHwSBTAAwC7y5S9/+bgkzVtfXx8TJ04UHACQCo8//nji7gL+0pe+dLzkAAD4JApgAIBdYPTo0R3atm07IkkzT5s2LdatWyc8ACAVPvzww5g+fXqiZm7fvv2I0aNHd5AeAABbogAGANgFfvrTn47KZDKFSZm3vr4+HnnkEcEBAKnyyCOPRH19fWLmzWQyhT/96U+/JjkAALZEAQwAsJN16tQp26dPn6OTNLO7fwGANFq3bl1MmzYtUTP36dPnmE6dOmWlBwDAx1EAAwDsZFddddUB2Wy2dVLmbWxsjEmTJgmOVOvYsWN06OCJmgD5aNKkSdHY2JiYebPZbOurrrrqAMkBAPBxFMAAADvZiBEjvp6keV988cVYtWqV4Ei1Ll26xIUXXhinnXZadO3a1UIA8siqVavipZdecj0JAEBqKIABAHaiM844o3tlZeXeSZk3l8vFxIkTBUdeyGQyMXjw4PjVr34VY8aMcUcwQB55/PHHI5fLJWbeysrKvc8444zukgMA4KMogAEAdqJTTjnlqxGRScq8CxYsiPfee09w5JVMJhN77713XHjhhTFmzJho3769pQCk3HvvvRcLFy5M1B9X/3NdCQAA/4cCGABgJ+nVq1ezXr16fTlJM3v3L/nsr0XwBRdcECeffHK0bdvWUgBSLGnXPb169fpyr169mkkOAIB/pAAGANhJrrjiioOLiopaJmXeBN4JAztEYWFhDB8+PC688MIYPXp0VFZWWgpACi1YsCCWLVuWmHmLiopaXnnllYdIDgCAf6QABgDYSYYPH/6VJM2btHfhwY5WVFQUI0aMiEsuuSRGjx4dLVu2tBSAFMnlcvH4448naub99tvvK5IDAOAfKYABAHaC0aNHd6isrByalHnXrl0bL7/8suDgI/y1CL744ovjhBNOiBYtWlgKQEq89NJLsW7dusTMW1lZudfo0aM7SA4AgL+lAAYA2AlOP/30o5J07fXMM89EQ0OD4GALiouL47DDDouxY8fGqFGjoqyszFIAEq6hoSGeeeaZJI1c8D/XmQAA8P8vEq0AAGDHymazmX79+n05KfPW1tbGlClTBAefUnFxcYwcOTIuvfTSGDVqVJSWlloKQII9//zzUVtbm5h5+/Xr9+VsNpuRHAAAf6UABgDYwX7zm9/sWVJS0jkp886YMSOqq6sFB1uppKQkRo4cGZdcckkcffTRUVJSYikACVRdXR0zZ85M0p8/na+44orBkgMA4K8UwAAAO9gXvvCFLyVl1lwuF08//bTQ4DNo3rx5HHXUUXHJJZfEyJEjI5vNWgpAwjz11FORy+USM++RRx75ZakBAPBXCmAAgB1oyJAhpZ07dz4iKfO+/vrrsWLFCsHBdlBeXh6jRo2KSy+9VBEMkDArVqyI119/PTHzdunS5fD+/ft79AQAABGhAAYA2KHGjh17aGFhYWJeCOruX9j+KioqYtSoUXHxxRfH4YcfHkVFRZYC4LpouyosLGz+H//xHwdLDQCACAUwAMAOteeeex6ZlFnXrl0b8+bNExrsIK1atYrjjz8+LrroohgxYkQUFPh2DKApmzdvXqxZsyYx8+61115HSg0AgAgFMADADnPMMce0bt269b5Jmfe5556LxsZGwcEO1qZNmxg9enRcfPHFimCAJqyxsTGee+65JP35MvyYY45pLTkAAPykAQBgBznzzDMPz2Qyibje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FpafffbZvaQFAJA+CmAAgE9p//3375+EOV9//XVhAXmjvLw8Ro0aFf/+7/8eI0eOjGw2aymA67FP6fOf//xAaQEApI8CGADgU+rRo8fuTX3G2traePvtt4UF5J2KiooYNWpUXHzxxXH44Yc3+XdvAum2ePHiRLySo1evXoOkBQCQPgpgAIBPqXXr1k3+DoklS5ZEQ0ODsIC81apVqzj++OPj4osvjhEjRkRBgW97gZ2voaEhlixZ0uTnbNOmjQIYACCFfCcMAPApDBkypLR58+a9m/qcb775prAAIqJ169YxevToGDt2rCIYcF32MZo3b95n0KBBpdICAEgX3wEDAHwKp556av9MJtPkr53eeustYQH8jTZt2sTo0aPjvPPOi+HDhyuCAddlfyOTyRT84Ac/+Jy0AADSxXe+AACfwuDBg5v84/Hq6+tj0aJFwgL4CJ06dYqTTz45/u3f/i323nvvyGQylgLsUIsXL07Eqzn23HPPgdICAEgXBTAAwKfQpUuXAU19xnfeeSfq6uqEBbAFnTt3jjFjxiiCgR2utrY23n333SRc53oPMABAyiiAAQA+hZYtW/Zv6jN6/DPAp9elS5cYM2ZMnHvuuTF48GALAfL2+iwJ17kAAGwdBTAAwCcYPnx4eUlJSeemPqfHPwNsvV69esVpp50W55xzTvTvrwMB8u/6rLS0tPPw4cPLpQUAkB4KYACAT/Ctb31rt4ho8s8IXbx4sbAAtlGfPn3irLPOinPOOSd22203CwG2i4T8gl7m29/+dj9pAQCkhwIYAOAT7L777k2+CVi7dm1s2LBBWACfUZ8+feLss8+OM888M3r27GkhwGfy4Ycfxrp165r8nAMHDlQAAwCkSJEVAABsWadOnZr8D8TefvttQQFsRwMGDIgBAwbEggULYvz48bF06VJLAbb5Oq1Vq1audwEA2GkUwAAAn6CyslIBDJCnBgwYEP3794958+bFQw89FO+++66lAFtlyZIlsddeezX1613PvgcASBEFMADAFnTq1CnbvHnzXk19ziVLlggLYAfJZDIxePDg2GOPPeLll1+OBx98MFauXGkxQGqu05o3b967Xbt2RatXr66XGABA8nkHMADAFowZM6ZnJpPJNuUZGxsbPZoUYCfIZDKx9957x4UXXhhjxoyJ9u3bWwrwiZYuXRqNjY1NesaCgoLsqaee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k8nE7NmzY+LEibFmzRoNAXif/VNSzJo161kTAwBongTAAAC70O233/7KOeecszU/P78022sdMGBAtG/f3tWu0My9+uqrMWnSpFi1apVmALyPjh07xgEHHJCIWhsbG6u/8Y1v/NXUAACaJwEwAMAutHLlyob169fP6tat2+hsrzWVSsXhhx8ekyZNMjhohubMmROTJ0+OJUuWaAbAh3D44YdHKpVKRK3r16+fVVFR0WhqAADNU54WAADsWq+++mpirts77LDDDAyamTfffDP+/d//PX7yk58IfwE+pFQqFSNGjEhMva+88sozpgYA0Hw5AQwAsIvddNNNz5166qnV+fn5rbO91m7dukX//v1j4cKFBgc5btmyZfHYY4/F/PnzNQPgIzrggAOic+fOiai1sbFxy4033jjL1AAAmi8BMADALrZy5cqG8vLyGT179vx0Euo9+uijBcCQw5YvXx7jxo0T/AJ8wv1SUpSXlz9TXl7eYGoAAM2XABgAYDeYMWPGUxdccEEiAuAhQ4ZE69ato7q62uAgh6xcuTImTJgQc+fOjUwmoyEAH1ObNm3i0EMPTUy9zz777FOmBgDQvPkGMADAbvDVr371lYaGhk1JqLWgoCCOOOIIQ4McsW7duvj5z38ed955Z8yZM0f4C/AJjRw5MvLz8xNRa0NDw8abbrrpVVMDAGjenAAGANgNKisrm1atWjW9T58+5ySh3qOPPjqefPJJQREk2Pr16+Oxxx6L2bNn+3cZYBdJpVIxatSoxNS7cuXKadXV1WmTAwBo3pwABgDYTaZNm5aY6/c6duwYAwYMMDRIoA0bNsSvf/3r+Nd//dd49dVXhb8Au9CAAQOiY8eOian36aefftLUAAAQAAMA7CZf+9rX5tTX11ckpd6jjjrK0CBBqqqq4v77749vf/vb8eKLL0ZTU5OmAOxiRx55ZGJqra+vX/eNb3zjdVMDAMAV0AAAu0ltbW16xYoVT++///6fT0K9hx56aLRt2zaqqqoMD7LYli1bYsqUKfHcc8/F9u3bNQRgN2nbtm0MGTIkMfUuX778qdraWtc/AwDgBDAAwO70xz/+cUJSas3Pz4/jjjvO0CBL1dTUxKOPPhq33XZb/OUvfxH+Auxmxx57bOTn5yel3Myvf/3rCaYGAECEABgAYLe66667llZXV89PSr1HH310tGjRwuAgi7wd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qATAAABZ4umnn968fPnyxF3xN3r06GjXrp0BAgBZqUOHDnH88ccnru5ly5ZNmD59+hYTBADgoxIAAwBkkbvvvvtPmUymKUk1FxYWxumnn254AEBWOvPMMxP3yYpMJtN41113/dH0AAD4OATAAABZ5Be/+MWatWvXTkta3UcccUT06tXLAAGArNK7d+847LDDEld3eXn5X+6///51JggAwMchAAYAyDIPP/zwn5JWcyqVijPPPNPwAICsMmbMmEilUomr+8EHH/yT6QEA8HEJgAEAsszXv/71NzZs2DAraXUPHDgwDj74YAMEALLCoEGDYsCAAYmru6KiYuatt966wAQBAPi4BMAAAFlo3Lhxv01i3WPGjIm8PFtMAGDvysvLizFjxiSy9j//+c+/NUEAAD7RflgLAACyz/XXXz+nqqrqr0mru1evXnHUUUcZIACwVx1zzDHRvXv3xNW9adOmV2666aa5JggAwCchAAYAyFJ/+tOf7k1i3WPGjInS0lIDBAD2ijZt2sRZZ52VyNofeOCBe00QAIBPSgAMAJClbrrpprlJPAVcXFwcZ555pgECAHvFWWedFS1btkxc3Zs2bXrl5ptvnmeCAAB8UgJgAIAsNm7cuF8lse5Ro0ZF7969DRAA2KP69OkTI0eOTGTtjz322K9MEACAXUEADACQxcaOHTu7qqrqb0mrO5VKxfnnnx+pVMoQAYA9tv/4/Oc/n8j9R2Vl5d+uueaav5kiAAC7ggAYACDLTZ069bdJrLtv374xZMgQAwQA9ojDDjsssTeQTJ48+TcmCADAriIABgDIcpdeeumLVVVVryax9s9//vNRXFxsiADAblVaWhrnn39+Imuvqqr66+WXX/6SKQIAsKsIgAEAEuChhx76WRLrLisri9NPP90AAYDd6qyzzoqSkpIklp753e9+91MTBABgVxIAAwAkwA033DB3w4YNs5JY+3HHHRd9+vQxRABgt+jbt28cddRRiay9oqJi1te//vU3TBEAgF1JAAwAkBA///nPfxoR6aTVnUql4vOf/3zk5dl6AgC7Vn5+flx00UWRSqWSWH76F7/4xX+bIgAAu5q3cAAACXHHHXe8tW7duulJrL13795xzDHHGCIAsEudcMIJ0b1790TWXl5e/pc77rjjLVMEAGBXEwADACTI3XfffW8mk2lKYu1nnXVWtG3b1hAB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onv37vEv//IvccABBzSrdWcymaYnnnji9s997nPPeAoAAODDEQADAJBYDz/88NJjjjlmY+/evY+KiGZzFKq0tDSGDx8eq1evjvXr13sQAHLcwIED45prrol27do1t6VnZsyY8YOzzjprqqcAAAA+PAEwAACJdv/99795zDHHVO6zzz5HRDMKgVu0aBGHHXZYtGzZMhYuXBjpdNrDAJBjCgoK4pxzzonzzz8/WrRo0dyWn37uuefuOuWUUyZ4EgAA4KMRAAMAkHi///3v5w8bNmxF3759j2lO10GnUqno27dvDB06NBYvXhxbtmzxMADkiJ49e8YNN9wQgwcPblbf+434x7XPU6ZM+fbpp58+2ZMAAAAfnQAYAICc8OCDDy4ZNmzYin79+jWrEDgionXr1nHEEUdEfX19LF261MMAkGCpVCpOOOGEuOKKK6JNmzbNbv07wt9vnXPOOX/xNAAAwMcjAAYAIGc89NBDS4YNG7a8X79+xza3EDg/Pz8OPvjg6NWrV8yfPz8aGho8EAAJU1JSEpdffnmccMIJkZ+f3+zWn8lkGp944olvffazn53maQAAgI9PAAwAQE556KGHlo4cOXJdnz59RqWa252ZEdG1a9cYNmxYLFu2LCorKz0QAAnRt2/fuO6662K//fZrluvPZDLpp59++rvnnHPO054GAAD4ZATAAADknD/96U+LDj300KX7779/s7sOOiKiuLg4jjzyyCgpKYk333wz0um0hwIgSxUUFMRnP/vZuPDCC6OkpKRZ9iCdTjc88sgjt5x//vnTPREAAPDJCYABAMhJDz/88NId3wQelUqlmt09mqlUKvr06RMHH3xwLFy4MLZt2+ahAMgynTt3jrFjx8bQoUOjGV5aERH/CH+feOKJ2y+88MLnPBEAALBrCIABAMhZDz300JIePXq8NmjQoGPz8vJaNMcetG3bNkaNGhVNTU2xZMkSDwVAFkilUjF69Oi48soro0OHDs22D01NTdt++9vf/stll132oqcCAAB2HQEwAAA5bdKkSeXdu3efM3jw4GYbAufn58eAAQOiV69esWDBgti+fbsHA2Avad26dVx66aVx/PHHR35+frPtQ2NjY/WvfvWrf7nuuute81QAAMCuJQAGACDnTZ48eW1jY+OMI4444uiCgoKS5tqHrl27xqhRo2Lbtm2xcuVKDwbAHpRKpWLUqFExduzY6NWrV7PuRX19/fo77rjjK9/61rcWejIAAGDXEwADANAsPP/881UbNmx45rjjjjuqsLCwrLn2obCwMAYNGhT77bdfLF68OGpraz0cALtZ+/bt44orrogTTzwxCgub9/uU2tralTfffPPVP/nJT1Z7MgAAYPcQAAMA0Gz87W9/27p27doZJ5xwwsjCwsK2zbkXnTp1ipEjR0Z1dbXTwAC70ciRI+Pqq6+OHj16NPte1NTULL/hhhuu/e1vf7vOkwEAALuPABgAgGbltdde2zpv3rynTznllKFFRUWdmnMvCgsL49BDD4399tsvFi1a5DQwwC709qnfk08+udmf+o2I2Lx587yLL774unHjxm30dAAAwO71fgFwat9zYsTOftC4LmLjq610DwCAxOrVq1fhs88++69du3Y9QTciGhoaYurUqTF58uRobGzUEICPqaCgIE499dQYPXq04HeH8vLyp4499tjvrly5skE3AABg9+swrDYKuuz8ZwJgAAByWuvWrfNeeumlm/fdd9+zdeMfVq9eHffff38sWbJEMwA+ov322y8uuugi1z2/w8KFC38/fPjwnzY0NGR0AwAA9gwBMAAAzd7zzz9/8aGHHnp1RKR0IyKTycTMmTPjz3/+c9TV1WkIwAcoKSmJ8847L0aMGBGplL9Kdki//PLL9xx77LEPagUAAOxZ7xcA+wYwAADNwn333Tfn+OOP39yrV6/DQwgcqVQqevfuHcOHD49169ZFRUWFhwTgPRxyyCExduzY6N+/v/B3h0wm0/jMM8/828knnzxONwAAYM97v28AC4ABAGg2fve7370xePDgJf369Ts6lUrl60hEcXFxjBgxInr06BFLly6N2tpaTQHYoUOHDvGFL3whzjzzzCguLtaQHZqammoeeOCBWz73uc9N1w0AANg7BMAAALDDww8/vKygoOC54cOHH1FQUFCqI//QrVu3OO6446K0tDQWL14cTU1NmgI0Wy1btoxzzjknLr300ujevbuGvENtbe2K22677arbbrvtDd0AAIC9RwAMAADv8Oyzz25avHjx0yeddNKQoqKiTjryD3l5edGnT58YOXJkbN26NVatWqUpQLNz+OGHx1e+8pUYMGBA5OXlacg7VFVV/e3CCy+8/oEHHvDdAAAA2MsEwAAA8C7z58+vefbZZ58+44wz+hcX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OigOOOCAKCoq0pQs0djYuGXmzJk/PvPMMyc2NDS4XgAAAPjQBMAAAJADjjzyyNY/+9nPrujbt++5EZGnI9mluro6Fi5cGPPnz4958+ZFZWWlprBXtGvXLg455JAYMGBA9O/fP1q39nsjWSj91ltv/fmqq676xaxZs6q1AwAA+KgEwAAAkEN++ctfjhgzZsyNrVq16q0b2SmdTsfKlStj0aJFsXDhwli8eHFs27ZNY9gtSkpKol+/ftG/f//Yf//9o1evXpGX53dEslVNTc3yRx999EdXXnnlK7oBAAB8XAJgAADIMd26dSt8+OGHPzd48ODL8vPzbdyzXCaTiTVr1sTChQtj0aJFsWjRotiyZYvG8LGUlZVF//79/xn6du/ePVKplMZkuaampprXXnvtV2PGjHmgoqKiUUcAAIBPQgAMAAA56rjjjiv7r//6r8tdC508mzdvjuXLl8eKFSti+fLlsXjx4qipqdEY/pfi4uLo169f9O7dO/bZZ5/Yd999o6ysTGMSJJPJpJcsWfLn66677pfTp0/3mx8AAMAuIQAGAIAc99Of/nTIueeee3NpaWlf3UimxsbGWLlyZSxdujSWLVsWy5cvj3Xr1kUmk9GcZiKVSkWXLl1in332iT59+kSfPn2iV69eUVBQoDkJtXXr1sUPPvjgj6699tq/6wYAALArCYABAKAZaNeuXf64cePOGTp06BUFBQWtdST56uvrY+XKlf88KbxixYpYu3ZtpNNpzUm4vLy86Nq1a+yzzz7//KdXr17RsmVLzckBjY2NW/7617/+4pxzznm0srKySUcAAIBdTQAMAADNyIknntjmnnvuuXzfffcdk0qlHB3MMdu3b481a9bEmjVrYu3atbF27dooLy+PDRs2CIazUF5eXnTs2DG6desWXbt2jW7dukW3bt2iR48eUVhYqEE5JpPJNC5ZsuRR1z0DAAC7mwAYAACaoa9+9av7Xnfdddd16NDhCN3IfY2Njf8MhNetWxfr1q2LioqKWLduXWzbtk2DdrPS0tLo3LnzP//p0qVLdO3aNbp27eoK52Ziw4YNM//rv/7rxz/60Y+W6wYAALC7CYABAKAZ++UvfznirLPOuq64uNj3gZupmpqaWL9+/T//qaioiMrKyqisrIxNmzZFY2OjJn2AgoKCaN++fbRr1y7at28fHTt2jC5dukSnTp2ic+fOUVxcrEnN1NatW98aP378PVdcccXLugEAAOwpAmAAAGjm2rVrl//ggw+eOWLEiCsLCwvb6gjvtHnz5n+GwZs2bYrKysqorq6OLVu2xJYtW6K6ujqqq6sjk8nk3NpTqVS0bt06WrduHWVlZdGmTZsoLS39X2Fvu3btok2bNh4U/peGhobKl1566efnnHPO+OrqavevAwAAe5QAGAAAiIiIoUOHFt97770XHHjggRfk5+c7ssiHlk6n/xkEV1dXR01Nzfv+k8lkora2NtLpdNTX10dTU1PU1dXt0u8U5+XlRcuWLSM/Pz+KiooiLy8vWrVqFalUKoqLi3f6T0lJSbRq1eqfgW9paWnk5eUZMB9aU1NTzYIFC/745S9/+Y+zZ8+u0REAAGBvEAADAAD/y2mnndb2rrvuurRPnz5n5+XlFeoIe9LbgfDbtm/f/r7XUBcUFESLFi3++b/fDnxhT8pkMg1LliwZd8stt/xq0qRJVToCAADsTQJgAABgp0477bS2d95554X777//5wTBAP9XJpNpWLhw4QO33nrrHwS/AABAtni/ADi/7UHRc2c/SG+LqC33/gcAAHLZokWL6u69995X0un0swcddFCnkpKS3roC8A8VFRUz/7//7/+77aKLLpq6aNGiOh0BAACyRXH3xsgr3fnPBMAAAEDMnDmz8u67736qqalpWr9+/Ypbt27dN5VKpXQGaG4ymUx6zZo1U+65555/Peeccx6cOXNmpa4AAADZRgAMAAB8KDNnzqz88Y9//Gw6nZ4uCAaak7eD37vvvvtfzz///McEvwAAQDYTAAMAAB+JIBhoLgS/AABAEgmAAQCAj+XtILisrOyFvn37diwuLu4VEYJgIBdkKioqnrv33nu/PWbMmEcEvwAAQJK8XwCc2vecGLGzHzSui9j4aivdAwAA/unqq6/u8ZWvfOX8Pn36nJWXl9dCR4CkSafT9UuXLh3/X//1Xw/84he/WKMjAABAEnUYVhsFXXb+MwEwAADwkZ1xxhntb7/99rMPPPDA8/Pz81vrCJDtmpqaqhcsWPDgd77znUcmTpzotC8AAJBoAmAAAGC3GD58eMkPf/jDzwwePPjioqKijjoCZJv6+voNr7322u9vvPHGx2fPnl2jIwAAQC4QAAMAALvV0KFDi++5556zDjnkkPOKioq66giwt9XV1a19/fXXH7z++uvHC34BAIBcIwAGAAD2iFatWuXdc889w0455ZTzO3bseJSOAHtYZsOGDbOmTJny4PXXX/9qbW1tWksAAIBcJAAGAAD2uH/913/tf/7555/dq1ev0/Ly8lroCLC7pNPp+pUrV05+4IEHHvnOd76zSEcAAIBcJwAGAAD2mjPOOKP97bfffvYBBxzw2YKCgjY6AuwqjY2NVW+++eafv/e97z06YcKETToCAAA0FwJgAABgrxs+fHjJ97///dGDBg0aU1paur+OAB9XdXX1wtdee+3Rr371q1Nfe+21Wh0BAACaGwEwAACQVb761a/ue8EFF3y6b9++ZxUUFLTWEeCDNDY2bnnrrbfG/+EPf5j4ox/9aLmOAAAAzZkAGAAAyEpDhw4t/sEPfnDy4MGDz27dunV/HQHerbq6+s2XX375weuuu+7ppUuXbtcRAAAAATAAAJDlCgsLU3ffffeQ0aNHn9G1a9fj8vLyinQFmq90Ol1XXl4+bcqUKROuvfbav+sIAADA/yYABgAAEqNPnz4t/v3f/33UyJEjz2rfvv2nIiKlK9AsZDZt2vTXF1544bGvfe1rzzntCwAA8N4EwAAAQCJddNFFXa6++uqTDzzwwLNbtmzZTUcg99TV1a1ZsGDBuJ/+9KdP3n///et0BAAA4IMJgAEAgETr1q1b4d13333k4YcffmqHDh2OyMvLK9QVSK50Ot2wcePGWbNmzZp8/fXXz6qoqGjUFQAAgA9PAAwAAOSMo48+uvWtt956/CGHHHJKu3btBkdEnq5AIqQrKytfmzdv3uQ777xz+owZM6q1BAAA4OMRAAMAADnpuOOOK/vGN75x/CGHHHJa27ZtB4bvBUO2yVRVVc2dN2/epO9///vTpk+fvkVLAAAAPjkBMAAAkPNuu+22vmedddZJffr0Oa5Vq1a9dQT2ntra2uXLly+f/uijjz51xx13vKUjAAAAu5YAGAAAaFa+9KUvdbv44ouP7t+//wlOBsMekamqqpq7cOHCv/z+97+fcd9995VrCQAAwO4jAAYAAJqtSy65pOtll112jDAYdrl0VVXVvIULF/7lV7/61bO/+93v1moJAADAniEABgAAiIirr766x/nnnz9q//33P7JNmzZDUqlUga7Ah5fJZBoqKyv/vnjx4uf+9Kc/zbr33ntX6woAAMCeJwAGAAB4l379+hV97WtfGzRy5MhRPXv2PLaoqKizrsD/VV9fv37VqlXPvPDCC8/9+7//+5zFixfX6woAAMDeJQAGAAB4H61bt8678847Bx599NFHde/efURpaen+4apomq/M1q1bF69Zs+bF5557btY3v/nNOdXV1WltAQAAyB4CYAAAgI9g8ODBrcaOHXvI8OHDD+vevfvw1q1bHxACYXJXprq6+s01a9a88sorr7z8k5/8ZN5rr71Wqy0AAADZSwAMAADwCVx//fX7nHHGGYf169dvePv27Yfm5+e31hWSrLGxsXrjxo2vvvXWWy+PHz/+lR//+McrdQUAACA5BMAAAAC70Je//OUe55xzzvA+ffoM7tix45CioqKuukI2q6+vX7t27doXFy9ePGfixImv3Xvvvat1BQAAILkEwAAAALvRl7/85R6f+cxnBvfr129Qly5dDm/ZsqVAmL2qrq5u7bp16wS+AAAAOUoADAAAsIe0atUq75prrtnn2GOPPXi//fY7uH379oeUlpb2TaVS+brDbpKuqalZtnHjxnlvvfXW3GeffXbef/3Xfy2vra1Naw0AAEBuEgADAADsRQceeGDLq6+++oAhQ4Yc3LNnz4Pbtm17sGuj+biampqqq6qqXi8vL583Z86ceb/85S/nvfjii1t1BgAAoPkQAAMAAGSZoUOHFn/xi1/cf9CgQQf26NHjwHbt2h3YqlWr3qlUKk932CFdU1OzvLKycsHq1asXzJkzZ8Gf//znJTNmzKjWGgAAgOZNAAwAAJAAxx13XNkFF1xw4MEHH3xA165dDywtLd23pKRkn1QqVag7uS2TyTRs27ZtRXV19dJ169YtfOONNxZOmDBh4YQJEzbpDgAAAO8mAAYAAEiw8847r+OJJ57Yp3///vt16dKlT5s2bfZr3bp1v/z8/GLdSZampqaa6urqxZs3b16ybt26pQsXLlzy9NNPL33ooYc26A4AAAAflgAYAAAgx7Rr1y7/kksu6TFkyJCe++67b89OnTr1Kisr61VcXNyzZcuW3VKpVL4u7R2ZTKaprq6uvKamZtWWLVtWVlRUrFy6dOnK2bNnr7r//vvXVFZWNukSAAAAn4QAGAAAoBnp1KlTwec+97luQ4cO7bnPPvv0aNeuXafWrVt3Li4u7tqyZcvORUVFnfLy8lro1MeTTqe319fXr6+rq6uoqalZW11dvb6y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AACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoIQADAAAAAAAAlBCAAQAAAAAAAEoIwAAAAAAAAAAlBGAAAAAAAACAEgIwAAAAAAAAQAkBGAAAAAAAAKCEAAwAAAAAAABQQgAGAAAAAAAAKCEAAwAAAAAAAJQQgAEAAAAAAABKCMAAAAAAAAAAJQRgAAAAAAAAgBICMAAAAAAAAEAJARgAAAAAAACghAAMAAAAAAAAUEIABgAAAAAAACghAAMAAAAAAACUEIABAAAAAAAASgjAAAAAAAAAACUEYAAAAAAAAIASAjAAAAAAAABACQEYAAAAAAAAoIQADAAAAAAAAFBCAAYAAAAAAAAoMY3JP//9K8My551lzpAk293a7QAAAAAAAAD8iIw3r+SL7TpPxuSt4/ibJJuz20QDBgAAAAAAAHhzrJPp6NvHYcyyjLl7dJTPbl/Jp6sPLufSsM+5ec7q5YOrF0OeP/SVaAAAAAAAAIA3weH7u6zfm79dWDIMSw6225w785vsx3XyzasOby5ssz69c4sAAAAAAAAAr9n69C6bC9sT93a7rKdnORin5Otxynzi1JQcfiwCAwAAAAAAALxO69O7HH68TaaT98cp85R8vbp3Nfszv8q0LHn7xMF1sjk/ZzUPmZ/MmWefhAYAAAAAAAD4oayPdjn7223Gn7x6ZrXPnetX8mBKkpv3cufDd/Pufn5FL56SzcVtNheT3dNt8tQlAwAAAAAAAHyv1sm0ySv/9XtsNWZ3I/lHkgzHi7/4XY7WYz5yiwAAAAAAAAA/Ivtcv/3nPEyS1fHa42t5+vNLyX7JoRsCAAAAAAAAePPt1/nbV3/KvePn1Xc371/NYxEYAAAAAAAA4M0yTHk2rvNo2WdzvHZqzN9v/SF3vju3evng/at5fPDLPDu1yuGyZHSVAAAAAAAAAK/XOGe4ueSvZ4e8M8xZbVe5ceuPufvy3Oqkw4+v5emDX+fuuTlLhhwsEYIBAAAAAAAAXpclGR8OuXP0TR4cPM/9z/+SRyfNDf/1TZezOp/87KdjzizJZkhO7edMy/w/nAUAAAAAAADg/zaMWcZkP8/ZLsmLacr2/MV8+cnvs/tP5/4FmLjAq1ifcioAAAAASUVORK5CYII=";
function getSmartParseNumber(size, xyDir, layout) {
  if (typeof size === "string" && !isNaN(Number(size)))
    size = Number(size);
  if (typeof size === "number" && size < 100)
    return inch2Emu(size);
  if (typeof size === "number" && size >= 100)
    return size;
  if (typeof size === "string" && size.includes("%")) {
    if (xyDir && xyDir === "X")
      return Math.round(parseFloat(size) / 100 * layout.width);
    if (xyDir && xyDir === "Y")
      return Math.round(parseFloat(size) / 100 * layout.height);
    return Math.round(parseFloat(size) / 100 * layout.width);
  }
  return 0;
}
function getUuid(uuidFormat) {
  return uuidFormat.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function encodeXmlEntities(xml) {
  if (typeof xml === "undefined" || xml == null)
    return "";
  return xml.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function inch2Emu(inches) {
  if (typeof inches === "number" && inches > 100)
    return inches;
  if (typeof inches === "string")
    inches = Number(inches.replace(/in*/gi, ""));
  return Math.round(EMU * inches);
}
function valToPts(pt) {
  const points = Number(pt) || 0;
  return isNaN(points) ? 0 : Math.round(points * ONEPT);
}
function convertRotationDegrees(d) {
  d = d || 0;
  return Math.round((d > 360 ? d - 360 : d) * 6e4);
}
function componentToHex(c) {
  const hex2 = c.toString(16);
  return hex2.length === 1 ? "0" + hex2 : hex2;
}
function rgbToHex(r, g, b) {
  return (componentToHex(r) + componentToHex(g) + componentToHex(b)).toUpperCase();
}
function createColorElement(colorStr, innerElements) {
  let colorVal = (colorStr || "").replace("#", "");
  if (!REGEX_HEX_COLOR.test(colorVal) && colorVal !== SchemeColor.background1 && colorVal !== SchemeColor.background2 && colorVal !== SchemeColor.text1 && colorVal !== SchemeColor.text2 && colorVal !== SchemeColor.accent1 && colorVal !== SchemeColor.accent2 && colorVal !== SchemeColor.accent3 && colorVal !== SchemeColor.accent4 && colorVal !== SchemeColor.accent5 && colorVal !== SchemeColor.accent6) {
    console.warn(`"${colorVal}" is not a valid scheme color or hex RGB! "${DEF_FONT_COLOR}" used instead. Only provide 6-digit RGB or 'pptx.SchemeColor' values!`);
    colorVal = DEF_FONT_COLOR;
  }
  const tagName = REGEX_HEX_COLOR.test(colorVal) ? "srgbClr" : "schemeClr";
  const colorAttr = 'val="' + (REGEX_HEX_COLOR.test(colorVal) ? colorVal.toUpperCase() : colorVal) + '"';
  return innerElements ? `<a:${tagName} ${colorAttr}>${innerElements}</a:${tagName}>` : `<a:${tagName} ${colorAttr}/>`;
}
function createGlowElement(options, defaults) {
  let strXml = "";
  const opts = Object.assign(Object.assign({}, defaults), options);
  const size = Math.round(opts.size * ONEPT);
  const color = opts.color;
  const opacity = Math.round(opts.opacity * 1e5);
  strXml += `<a:glow rad="${size}">`;
  strXml += createColorElement(color, `<a:alpha val="${opacity}"/>`);
  strXml += "</a:glow>";
  return strXml;
}
function genXmlColorSelection(props) {
  let fillType = "solid";
  let colorVal = "";
  let internalElements = "";
  let outText = "";
  if (props) {
    if (typeof props === "string")
      colorVal = props;
    else {
      if (props.type)
        fillType = props.type;
      if (props.color)
        colorVal = props.color;
      if (props.alpha)
        internalElements += `<a:alpha val="${Math.round((100 - props.alpha) * 1e3)}"/>`;
      if (props.transparency)
        internalElements += `<a:alpha val="${Math.round((100 - props.transparency) * 1e3)}"/>`;
    }
    switch (fillType) {
      case "solid":
        outText += `<a:solidFill>${createColorElement(colorVal, internalElements)}</a:solidFill>`;
        break;
      default:
        outText += "";
        break;
    }
  }
  return outText;
}
function getNewRelId(target) {
  return target._rels.length + target._relsChart.length + target._relsMedia.length + 1;
}
function correctShadowOptions(ShadowProps) {
  if (!ShadowProps || typeof ShadowProps !== "object") {
    return;
  }
  if (ShadowProps.type !== "outer" && ShadowProps.type !== "inner" && ShadowProps.type !== "none") {
    console.warn("Warning: shadow.type options are `outer`, `inner` or `none`.");
    ShadowProps.type = "outer";
  }
  if (ShadowProps.angle) {
    if (isNaN(Number(ShadowProps.angle)) || ShadowProps.angle < 0 || ShadowProps.angle > 359) {
      console.warn("Warning: shadow.angle can only be 0-359");
      ShadowProps.angle = 270;
    }
    ShadowProps.angle = Math.round(Number(ShadowProps.angle));
  }
  if (ShadowProps.opacity) {
    if (isNaN(Number(ShadowProps.opacity)) || ShadowProps.opacity < 0 || ShadowProps.opacity > 1) {
      console.warn("Warning: shadow.opacity can only be 0-1");
      ShadowProps.opacity = 0.75;
    }
    ShadowProps.opacity = Number(ShadowProps.opacity);
  }
  if (ShadowProps.color) {
    if (ShadowProps.color.startsWith("#")) {
      console.warn('Warning: shadow.color should not include hash (#) character, , e.g. "FF0000"');
      ShadowProps.color = ShadowProps.color.replace("#", "");
    }
  }
  return ShadowProps;
}
function parseTextToLines(cell, colWidth, verbose) {
  var _a, _b;
  const FOCO = 2.3 + (((_a = cell.options) === null || _a === void 0 ? void 0 : _a.autoPageCharWeight) ? cell.options.autoPageCharWeight : 0);
  const CPL = Math.floor(colWidth / ONEPT * EMU) / ((((_b = cell.options) === null || _b === void 0 ? void 0 : _b.fontSize) ? cell.options.fontSize : DEF_FONT_SIZE) / FOCO);
  const parsedLines = [];
  let inputCells = [];
  const inputLines1 = [];
  const inputLines2 = [];
  if (cell.text && cell.text.toString().trim().length === 0) {
    inputCells.push({ _type: SLIDE_OBJECT_TYPES.tablecell, text: " " });
  } else if (typeof cell.text === "number" || typeof cell.text === "string") {
    inputCells.push({ _type: SLIDE_OBJECT_TYPES.tablecell, text: (cell.text || "").toString().trim() });
  } else if (Array.isArray(cell.text)) {
    inputCells = cell.text;
  }
  let newLine = [];
  inputCells.forEach((cell2) => {
    var _a2;
    if (typeof cell2.text === "string") {
      if (cell2.text.split("\n").length > 1) {
        cell2.text.split("\n").forEach((textLine) => {
          newLine.push({
            _type: SLIDE_OBJECT_TYPES.tablecell,
            text: textLine,
            options: Object.assign(Object.assign({}, cell2.options), { breakLine: true })
          });
        });
      } else {
        newLine.push({
          _type: SLIDE_OBJECT_TYPES.tablecell,
          text: cell2.text.trim(),
          options: cell2.options
        });
      }
      if ((_a2 = cell2.options) === null || _a2 === void 0 ? void 0 : _a2.breakLine) {
        inputLines1.push(newLine);
        newLine = [];
      }
    }
    if (newLine.length > 0) {
      inputLines1.push(newLine);
      newLine = [];
    }
  });
  inputLines1.forEach((line) => {
    line.forEach((cell2) => {
      const lineCells = [];
      const cellTextStr = String(cell2.text);
      const lineWords = cellTextStr.split(" ");
      lineWords.forEach((word, idx) => {
        const cellProps = Object.assign({}, cell2.options);
        if (cellProps === null || cellProps === void 0 ? void 0 : cellProps.breakLine)
          cellProps.breakLine = idx + 1 === lineWords.length;
        lineCells.push({ _type: SLIDE_OBJECT_TYPES.tablecell, text: word + (idx + 1 < lineWords.length ? " " : ""), options: cellProps });
      });
      inputLines2.push(lineCells);
    });
  });
  inputLines2.forEach((line) => {
    let lineCells = [];
    let strCurrLine = "";
    line.forEach((word) => {
      if (strCurrLine.length + word.text.length > CPL) {
        parsedLines.push(lineCells);
        lineCells = [];
        strCurrLine = "";
      }
      lineCells.push(word);
      strCurrLine += word.text.toString();
    });
    if (lineCells.length > 0)
      parsedLines.push(lineCells);
  });
  return parsedLines;
}
function getSlidesForTableRows(tableRows = [], tableProps = {}, presLayout, masterSlide) {
  let arrInchMargins = DEF_SLIDE_MARGIN_IN;
  let emuSlideTabW = EMU * 1;
  let emuSlideTabH = EMU * 1;
  let emuTabCurrH = 0;
  let numCols = 0;
  const tableRowSlides = [];
  const tablePropX = getSmartParseNumber(tableProps.x, "X", presLayout);
  const tablePropY = getSmartParseNumber(tableProps.y, "Y", presLayout);
  const tablePropW = getSmartParseNumber(tableProps.w, "X", presLayout);
  const tablePropH = getSmartParseNumber(tableProps.h, "Y", presLayout);
  let tableCalcW = tablePropW;
  function calcSlideTabH() {
    let emuStartY = 0;
    if (tableRowSlides.length === 0)
      emuStartY = tablePropY || inch2Emu(arrInchMargins[0]);
    if (tableRowSlides.length > 0)
      emuStartY = inch2Emu(tableProps.autoPageSlideStartY || tableProps.newSlideStartY || arrInchMargins[0]);
    emuSlideTabH = (tablePropH || presLayout.height) - emuStartY - inch2Emu(arrInchMargins[2]);
    if (tableRowSlides.length > 1) {
      if (typeof tableProps.autoPageSlideStartY === "number") {
        emuSlideTabH = (tablePropH || presLayout.height) - inch2Emu(tableProps.autoPageSlideStartY + arrInchMargins[2]);
      } else if (typeof tableProps.newSlideStartY === "number") {
        emuSlideTabH = (tablePropH || presLayout.height) - inch2Emu(tableProps.newSlideStartY + arrInchMargins[2]);
      } else if (tablePropY) {
        emuSlideTabH = (tablePropH || presLayout.height) - inch2Emu((tablePropY / EMU < arrInchMargins[0] ? tablePropY / EMU : arrInchMargins[0]) + arrInchMargins[2]);
        if (emuSlideTabH < tablePropH)
          emuSlideTabH = tablePropH;
      }
    }
  }
  if (tableProps.verbose) {
    console.log("[[VERBOSE MODE]]");
    console.log("|-- TABLE PROPS --------------------------------------------------------|");
    console.log(`| presLayout.width ................................ = ${(presLayout.width / EMU).toFixed(1)}`);
    console.log(`| presLayout.height ............................... = ${(presLayout.height / EMU).toFixed(1)}`);
    console.log(`| tableProps.x .................................... = ${typeof tableProps.x === "number" ? (tableProps.x / EMU).toFixed(1) : tableProps.x}`);
    console.log(`| tableProps.y .................................... = ${typeof tableProps.y === "number" ? (tableProps.y / EMU).toFixed(1) : tableProps.y}`);
    console.log(`| tableProps.w .................................... = ${typeof tableProps.w === "number" ? (tableProps.w / EMU).toFixed(1) : tableProps.w}`);
    console.log(`| tableProps.h .................................... = ${typeof tableProps.h === "number" ? (tableProps.h / EMU).toFixed(1) : tableProps.h}`);
    console.log(`| tableProps.slideMargin .......................... = ${tableProps.slideMargin ? String(tableProps.slideMargin) : ""}`);
    console.log(`| tableProps.margin ............................... = ${String(tableProps.margin)}`);
    console.log(`| tableProps.colW ................................. = ${String(tableProps.colW)}`);
    console.log(`| tableProps.autoPageSlideStartY .................. = ${tableProps.autoPageSlideStartY}`);
    console.log(`| tableProps.autoPageCharWeight ................... = ${tableProps.autoPageCharWeight}`);
    console.log("|-- CALCULATIONS -------------------------------------------------------|");
    console.log(`| tablePropX ...................................... = ${tablePropX / EMU}`);
    console.log(`| tablePropY ...................................... = ${tablePropY / EMU}`);
    console.log(`| tablePropW ...................................... = ${tablePropW / EMU}`);
    console.log(`| tablePropH ...................................... = ${tablePropH / EMU}`);
    console.log(`| tableCalcW ...................................... = ${tableCalcW / EMU}`);
  }
  {
    if (!tableProps.slideMargin && tableProps.slideMargin !== 0)
      tableProps.slideMargin = DEF_SLIDE_MARGIN_IN[0];
    if (masterSlide && typeof masterSlide._margin !== "undefined") {
      if (Array.isArray(masterSlide._margin))
        arrInchMargins = masterSlide._margin;
      else if (!isNaN(Number(masterSlide._margin))) {
        arrInchMargins = [Number(masterSlide._margin), Number(masterSlide._margin), Number(masterSlide._margin), Number(masterSlide._margin)];
      }
    } else if (tableProps.slideMargin || tableProps.slideMargin === 0) {
      if (Array.isArray(tableProps.slideMargin))
        arrInchMargins = tableProps.slideMargin;
      else if (!isNaN(tableProps.slideMargin))
        arrInchMargins = [tableProps.slideMargin, tableProps.slideMargin, tableProps.slideMargin, tableProps.slideMargin];
    }
    if (tableProps.verbose)
      console.log(`| arrInchMargins .................................. = [${arrInchMargins.join(", ")}]`);
  }
  {
    const firstRow = tableRows[0] || [];
    firstRow.forEach((cell) => {
      if (!cell)
        cell = { _type: SLIDE_OBJECT_TYPES.tablecell };
      const cellOpts = cell.options || null;
      numCols += Number((cellOpts === null || cellOpts === void 0 ? void 0 : cellOpts.colspan) ? cellOpts.colspan : 1);
    });
    if (tableProps.verbose)
      console.log(`| numCols ......................................... = ${numCols}`);
  }
  if (!tablePropW && tableProps.colW) {
    tableCalcW = Array.isArray(tableProps.colW) ? tableProps.colW.reduce((p, n) => p + n) * EMU : tableProps.colW * numCols || 0;
    if (tableProps.verbose)
      console.log(`| tableCalcW ...................................... = ${tableCalcW / EMU}`);
  }
  {
    emuSlideTabW = tableCalcW || inch2Emu((tablePropX ? tablePropX / EMU : arrInchMargins[1]) + arrInchMargins[3]);
    if (tableProps.verbose)
      console.log(`| emuSlideTabW .................................... = ${(emuSlideTabW / EMU).toFixed(1)}`);
  }
  if (!tableProps.colW || !Array.isArray(tableProps.colW)) {
    if (tableProps.colW && !isNaN(Number(tableProps.colW))) {
      const arrColW = [];
      const firstRow = tableRows[0] || [];
      firstRow.forEach(() => arrColW.push(tableProps.colW));
      tableProps.colW = [];
      arrColW.forEach((val) => {
        if (Array.isArray(tableProps.colW))
          tableProps.colW.push(val);
      });
    } else {
      tableProps.colW = [];
      for (let iCol = 0; iCol < numCols; iCol++) {
        tableProps.colW.push(emuSlideTabW / EMU / numCols);
      }
    }
  }
  let newTableRowSlide = { rows: [] };
  tableRows.forEach((row, iRow) => {
    const rowCellLines = [];
    let maxCellMarTopEmu = 0;
    let maxCellMarBtmEmu = 0;
    let currTableRow = [];
    row.forEach((cell) => {
      var _a, _b, _c, _d;
      currTableRow.push({
        _type: SLIDE_OBJECT_TYPES.tablecell,
        text: [],
        options: cell.options
      });
      if (cell.options.margin && cell.options.margin[0] >= 1) {
        if (((_a = cell.options) === null || _a === void 0 ? void 0 : _a.margin) && cell.options.margin[0] && valToPts(cell.options.margin[0]) > maxCellMarTopEmu)
          maxCellMarTopEmu = valToPts(cell.options.margin[0]);
        else if ((tableProps === null || tableProps === void 0 ? void 0 : tableProps.margin) && tableProps.margin[0] && valToPts(tableProps.margin[0]) > maxCellMarTopEmu)
          maxCellMarTopEmu = valToPts(tableProps.margin[0]);
        if (((_b = cell.options) === null || _b === void 0 ? void 0 : _b.margin) && cell.options.margin[2] && valToPts(cell.options.margin[2]) > maxCellMarBtmEmu)
          maxCellMarBtmEmu = valToPts(cell.options.margin[2]);
        else if ((tableProps === null || tableProps === void 0 ? void 0 : tableProps.margin) && tableProps.margin[2] && valToPts(tableProps.margin[2]) > maxCellMarBtmEmu)
          maxCellMarBtmEmu = valToPts(tableProps.margin[2]);
      } else {
        if (((_c = cell.options) === null || _c === void 0 ? void 0 : _c.margin) && cell.options.margin[0] && inch2Emu(cell.options.margin[0]) > maxCellMarTopEmu)
          maxCellMarTopEmu = inch2Emu(cell.options.margin[0]);
        else if ((tableProps === null || tableProps === void 0 ? void 0 : tableProps.margin) && tableProps.margin[0] && inch2Emu(tableProps.margin[0]) > maxCellMarTopEmu)
          maxCellMarTopEmu = inch2Emu(tableProps.margin[0]);
        if (((_d = cell.options) === null || _d === void 0 ? void 0 : _d.margin) && cell.options.margin[2] && inch2Emu(cell.options.margin[2]) > maxCellMarBtmEmu)
          maxCellMarBtmEmu = inch2Emu(cell.options.margin[2]);
        else if ((tableProps === null || tableProps === void 0 ? void 0 : tableProps.margin) && tableProps.margin[2] && inch2Emu(tableProps.margin[2]) > maxCellMarBtmEmu)
          maxCellMarBtmEmu = inch2Emu(tableProps.margin[2]);
      }
    });
    calcSlideTabH();
    emuTabCurrH += maxCellMarTopEmu + maxCellMarBtmEmu;
    if (tableProps.verbose && iRow === 0)
      console.log(`| SLIDE [${tableRowSlides.length}]: emuSlideTabH ...... = ${(emuSlideTabH / EMU).toFixed(1)} `);
    row.forEach((cell, iCell) => {
      var _a;
      const newCell = {
        _type: SLIDE_OBJECT_TYPES.tablecell,
        _lines: null,
        _lineHeight: inch2Emu((((_a = cell.options) === null || _a === void 0 ? void 0 : _a.fontSize) ? cell.options.fontSize : tableProps.fontSize ? tableProps.fontSize : DEF_FONT_SIZE) * (LINEH_MODIFIER + (tableProps.autoPageLineWeight ? tableProps.autoPageLineWeight : 0)) / 100),
        text: [],
        options: cell.options
      };
      if (newCell.options.rowspan)
        newCell._lineHeight = 0;
      newCell.options.autoPageCharWeight = tableProps.autoPageCharWeight ? tableProps.autoPageCharWeight : null;
      let totalColW = tableProps.colW[iCell];
      if (cell.options.colspan && Array.isArray(tableProps.colW)) {
        totalColW = tableProps.colW.filter((_cell, idx) => idx >= iCell && idx < idx + cell.options.colspan).reduce((prev, curr) => prev + curr);
      }
      newCell._lines = parseTextToLines(cell, totalColW);
      rowCellLines.push(newCell);
    });
    if (tableProps.verbose)
      console.log(`
| SLIDE [${tableRowSlides.length}]: ROW [${iRow}]: START...`);
    let currCellIdx = 0;
    let emuLineMaxH = 0;
    let isDone = false;
    while (!isDone) {
      const srcCell = rowCellLines[currCellIdx];
      let tgtCell = currTableRow[currCellIdx];
      rowCellLines.forEach((cell) => {
        if (cell._lineHeight >= emuLineMaxH)
          emuLineMaxH = cell._lineHeight;
      });
      if (emuTabCurrH + emuLineMaxH > emuSlideTabH) {
        if (tableProps.verbose) {
          console.log("\n|-----------------------------------------------------------------------|");
          console.log(`|-- NEW SLIDE CREATED (currTabH+currLineH > maxH) => ${(emuTabCurrH / EMU).toFixed(2)} + ${(srcCell._lineHeight / EMU).toFixed(2)} > ${emuSlideTabH / EMU}`);
          console.log("|-----------------------------------------------------------------------|\n\n");
        }
        if (currTableRow.length > 0 && currTableRow.map((cell) => cell.text.length).reduce((p, n) => p + n) > 0)
          newTableRowSlide.rows.push(currTableRow);
        tableRowSlides.push(newTableRowSlide);
        const newRows = [];
        newTableRowSlide = { rows: newRows };
        currTableRow = [];
        row.forEach((cell) => currTableRow.push({ _type: SLIDE_OBJECT_TYPES.tablecell, text: [], options: cell.options }));
        calcSlideTabH();
        emuTabCurrH += maxCellMarTopEmu + maxCellMarBtmEmu;
        if (tableProps.verbose)
          console.log(`| SLIDE [${tableRowSlides.length}]: emuSlideTabH ...... = ${(emuSlideTabH / EMU).toFixed(1)} `);
        emuTabCurrH = 0;
        if ((tableProps.addHeaderToEach || tableProps.autoPageRepeatHeader) && tableProps._arrObjTabHeadRows) {
          tableProps._arrObjTabHeadRows.forEach((row2) => {
            const newHeadRow = [];
            let maxLineHeight = 0;
            row2.forEach((cell) => {
              newHeadRow.push(cell);
              if (cell._lineHeight > maxLineHeight)
                maxLineHeight = cell._lineHeight;
            });
            newTableRowSlide.rows.push(newHeadRow);
            emuTabCurrH += maxLineHeight;
          });
        }
        tgtCell = currTableRow[currCellIdx];
      }
      const currLine = srcCell._lines.shift();
      if (Array.isArray(tgtCell.text)) {
        if (currLine)
          tgtCell.text = tgtCell.text.concat(currLine);
        else if (tgtCell.text.length === 0)
          tgtCell.text = tgtCell.text.concat({ _type: SLIDE_OBJECT_TYPES.tablecell, text: "" });
      }
      if (currCellIdx === rowCellLines.length - 1)
        emuTabCurrH += emuLineMaxH;
      currCellIdx = currCellIdx < rowCellLines.length - 1 ? currCellIdx + 1 : 0;
      const brent = rowCellLines.map((cell) => cell._lines.length).reduce((prev, next) => prev + next);
      if (brent === 0)
        isDone = true;
    }
    if (currTableRow.length > 0)
      newTableRowSlide.rows.push(currTableRow);
    if (tableProps.verbose) {
      console.log(`- SLIDE [${tableRowSlides.length}]: ROW [${iRow}]: ...COMPLETE ...... emuTabCurrH = ${(emuTabCurrH / EMU).toFixed(2)} ( emuSlideTabH = ${(emuSlideTabH / EMU).toFixed(2)} )`);
    }
  });
  tableRowSlides.push(newTableRowSlide);
  if (tableProps.verbose) {
    console.log("\n|================================================|");
    console.log(`| FINAL: tableRowSlides.length = ${tableRowSlides.length}`);
    tableRowSlides.forEach((slide2) => console.log(slide2));
    console.log("|================================================|\n\n");
  }
  return tableRowSlides;
}
function genTableToSlides(pptx, tabEleId, options = {}, masterSlide) {
  const opts = options || {};
  opts.slideMargin = opts.slideMargin || opts.slideMargin === 0 ? opts.slideMargin : 0.5;
  let emuSlideTabW = opts.w || pptx.presLayout.width;
  const arrObjTabHeadRows = [];
  const arrObjTabBodyRows = [];
  const arrObjTabFootRows = [];
  const arrColW = [];
  const arrTabColW = [];
  let arrInchMargins = [0.5, 0.5, 0.5, 0.5];
  let intTabW = 0;
  if (!document.getElementById(tabEleId))
    throw new Error('tableToSlides: Table ID "' + tabEleId + '" does not exist!');
  if (masterSlide === null || masterSlide === void 0 ? void 0 : masterSlide._margin) {
    if (Array.isArray(masterSlide._margin))
      arrInchMargins = masterSlide._margin;
    else if (!isNaN(masterSlide._margin))
      arrInchMargins = [masterSlide._margin, masterSlide._margin, masterSlide._margin, masterSlide._margin];
    opts.slideMargin = arrInchMargins;
  } else if (opts === null || opts === void 0 ? void 0 : opts.slideMargin) {
    if (Array.isArray(opts.slideMargin))
      arrInchMargins = opts.slideMargin;
    else if (!isNaN(opts.slideMargin))
      arrInchMargins = [opts.slideMargin, opts.slideMargin, opts.slideMargin, opts.slideMargin];
  }
  emuSlideTabW = (opts.w ? inch2Emu(opts.w) : pptx.presLayout.width) - inch2Emu(arrInchMargins[1] + arrInchMargins[3]);
  if (opts.verbose) {
    console.log("[[VERBOSE MODE]]");
    console.log("|-- `tableToSlides` ----------------------------------------------------|");
    console.log(`| tableProps.h .................................... = ${opts.h}`);
    console.log(`| tableProps.w .................................... = ${opts.w}`);
    console.log(`| pptx.presLayout.width ........................... = ${(pptx.presLayout.width / EMU).toFixed(1)}`);
    console.log(`| pptx.presLayout.height .......................... = ${(pptx.presLayout.height / EMU).toFixed(1)}`);
    console.log(`| emuSlideTabW .................................... = ${(emuSlideTabW / EMU).toFixed(1)}`);
  }
  let firstRowCells = document.querySelectorAll(`#${tabEleId} tr:first-child th`);
  if (firstRowCells.length === 0)
    firstRowCells = document.querySelectorAll(`#${tabEleId} tr:first-child td`);
  firstRowCells.forEach((cellEle) => {
    const cell = cellEle;
    if (cell.getAttribute("colspan")) {
      for (let idxc = 0; idxc < Number(cell.getAttribute("colspan")); idxc++) {
        arrTabColW.push(Math.round(cell.offsetWidth / Number(cell.getAttribute("colspan"))));
      }
    } else {
      arrTabColW.push(cell.offsetWidth);
    }
  });
  arrTabColW.forEach((colW) => {
    intTabW += colW;
  });
  arrTabColW.forEach((colW, idxW) => {
    const intCalcWidth = Number((Number(emuSlideTabW) * (colW / intTabW * 100) / 100 / EMU).toFixed(2));
    let intMinWidth = 0;
    const colSelectorMin = document.querySelector(`#${tabEleId} thead tr:first-child th:nth-child(${idxW + 1})`);
    if (colSelectorMin)
      intMinWidth = Number(colSelectorMin.getAttribute("data-pptx-min-width"));
    const colSelectorSet = document.querySelector(`#${tabEleId} thead tr:first-child th:nth-child(${idxW + 1})`);
    if (colSelectorSet)
      intMinWidth = Number(colSelectorSet.getAttribute("data-pptx-width"));
    arrColW.push(intMinWidth > intCalcWidth ? intMinWidth : intCalcWidth);
  });
  if (opts.verbose) {
    console.log(`| arrColW ......................................... = [${arrColW.join(", ")}]`);
  }
  const tableParts = ["thead", "tbody", "tfoot"];
  tableParts.forEach((part) => {
    document.querySelectorAll(`#${tabEleId} ${part} tr`).forEach((row) => {
      const htmlRow = row;
      const arrObjTabCells = [];
      Array.from(htmlRow.cells).forEach((cell) => {
        const arrRGB1 = window.getComputedStyle(cell).getPropertyValue("color").replace(/\s+/gi, "").replace("rgba(", "").replace("rgb(", "").replace(")", "").split(",");
        let arrRGB2 = window.getComputedStyle(cell).getPropertyValue("background-color").replace(/\s+/gi, "").replace("rgba(", "").replace("rgb(", "").replace(")", "").split(",");
        if (
          // NOTE: (ISSUE#57): Default for unstyled tables is black bkgd, so use white instead
          window.getComputedStyle(cell).getPropertyValue("background-color") === "rgba(0, 0, 0, 0)" || window.getComputedStyle(cell).getPropertyValue("transparent")
        ) {
          arrRGB2 = ["255", "255", "255"];
        }
        const cellOpts = {
          align: null,
          bold: !!(window.getComputedStyle(cell).getPropertyValue("font-weight") === "bold" || Number(window.getComputedStyle(cell).getPropertyValue("font-weight")) >= 500),
          border: null,
          color: rgbToHex(Number(arrRGB1[0]), Number(arrRGB1[1]), Number(arrRGB1[2])),
          fill: { color: rgbToHex(Number(arrRGB2[0]), Number(arrRGB2[1]), Number(arrRGB2[2])) },
          fontFace: (window.getComputedStyle(cell).getPropertyValue("font-family") || "").split(",")[0].replace(/"/g, "").replace("inherit", "").replace("initial", "") || null,
          fontSize: Number(window.getComputedStyle(cell).getPropertyValue("font-size").replace(/[a-z]/gi, "")),
          margin: null,
          colspan: Number(cell.getAttribute("colspan")) || null,
          rowspan: Number(cell.getAttribute("rowspan")) || null,
          valign: null
        };
        if (["left", "center", "right", "start", "end"].includes(window.getComputedStyle(cell).getPropertyValue("text-align"))) {
          const align = window.getComputedStyle(cell).getPropertyValue("text-align").replace("start", "left").replace("end", "right");
          cellOpts.align = align === "center" ? "center" : align === "left" ? "left" : align === "right" ? "right" : null;
        }
        if (["top", "middle", "bottom"].includes(window.getComputedStyle(cell).getPropertyValue("vertical-align"))) {
          const valign = window.getComputedStyle(cell).getPropertyValue("vertical-align");
          cellOpts.valign = valign === "top" ? "top" : valign === "middle" ? "middle" : valign === "bottom" ? "bottom" : null;
        }
        if (window.getComputedStyle(cell).getPropertyValue("padding-left")) {
          cellOpts.margin = [0, 0, 0, 0];
          const sidesPad = ["padding-top", "padding-right", "padding-bottom", "padding-left"];
          sidesPad.forEach((val, idxs) => {
            cellOpts.margin[idxs] = Math.round(Number(window.getComputedStyle(cell).getPropertyValue(val).replace(/\D/gi, "")));
          });
        }
        if (window.getComputedStyle(cell).getPropertyValue("border-top-width") || window.getComputedStyle(cell).getPropertyValue("border-right-width") || window.getComputedStyle(cell).getPropertyValue("border-bottom-width") || window.getComputedStyle(cell).getPropertyValue("border-left-width")) {
          cellOpts.border = [null, null, null, null];
          const sidesBor = ["top", "right", "bottom", "left"];
          sidesBor.forEach((val, idxb) => {
            const intBorderW = Math.round(Number(window.getComputedStyle(cell).getPropertyValue("border-" + val + "-width").replace("px", "")));
            let arrRGB = [];
            arrRGB = window.getComputedStyle(cell).getPropertyValue("border-" + val + "-color").replace(/\s+/gi, "").replace("rgba(", "").replace("rgb(", "").replace(")", "").split(",");
            const strBorderC = rgbToHex(Number(arrRGB[0]), Number(arrRGB[1]), Number(arrRGB[2]));
            cellOpts.border[idxb] = { pt: intBorderW, color: strBorderC };
          });
        }
        arrObjTabCells.push({
          _type: SLIDE_OBJECT_TYPES.tablecell,
          text: cell.innerText,
          // `innerText` returns <br> as "\n", so linebreak etc. work later!
          options: cellOpts
        });
      });
      switch (part) {
        case "thead":
          arrObjTabHeadRows.push(arrObjTabCells);
          break;
        case "tbody":
          arrObjTabBodyRows.push(arrObjTabCells);
          break;
        case "tfoot":
          arrObjTabFootRows.push(arrObjTabCells);
          break;
        default:
          console.log(`table parsing: unexpected table part: ${part}`);
          break;
      }
    });
  });
  opts._arrObjTabHeadRows = arrObjTabHeadRows || null;
  opts.colW = arrColW;
  getSlidesForTableRows([...arrObjTabHeadRows, ...arrObjTabBodyRows, ...arrObjTabFootRows], opts, pptx.presLayout, masterSlide).forEach((slide2, idxTr) => {
    const newSlide = pptx.addSlide({ masterName: opts.masterSlideName || null });
    if (idxTr === 0)
      opts.y = opts.y || arrInchMargins[0];
    if (idxTr > 0)
      opts.y = opts.autoPageSlideStartY || opts.newSlideStartY || arrInchMargins[0];
    if (opts.verbose)
      console.log(`| opts.autoPageSlideStartY: ${opts.autoPageSlideStartY} / arrInchMargins[0]: ${arrInchMargins[0]} => opts.y = ${opts.y}`);
    newSlide.addTable(slide2.rows, { x: opts.x || arrInchMargins[3], y: opts.y, w: Number(emuSlideTabW) / EMU, colW: arrColW, autoPage: false });
    if (opts.addImage) {
      opts.addImage.options = opts.addImage.options || {};
      if (!opts.addImage.image || !opts.addImage.image.path && !opts.addImage.image.data) {
        console.warn("Warning: tableToSlides.addImage requires either `path` or `data`");
      } else {
        newSlide.addImage({
          path: opts.addImage.image.path,
          data: opts.addImage.image.data,
          x: opts.addImage.options.x,
          y: opts.addImage.options.y,
          w: opts.addImage.options.w,
          h: opts.addImage.options.h
        });
      }
    }
    if (opts.addShape)
      newSlide.addShape(opts.addShape.shapeName, opts.addShape.options || {});
    if (opts.addTable)
      newSlide.addTable(opts.addTable.rows, opts.addTable.options || {});
    if (opts.addText)
      newSlide.addText(opts.addText.text, opts.addText.options || {});
  });
}
var _chartCounter = 0;
function createSlideMaster(props, target) {
  if (props.bkgd)
    target.bkgd = props.bkgd;
  if (props.objects && Array.isArray(props.objects) && props.objects.length > 0) {
    props.objects.forEach((object, idx) => {
      const key = Object.keys(object)[0];
      const tgt = target;
      if (MASTER_OBJECTS[key] && key === "chart")
        addChartDefinition(tgt, object[key].type, object[key].data, object[key].opts);
      else if (MASTER_OBJECTS[key] && key === "image")
        addImageDefinition(tgt, object[key]);
      else if (MASTER_OBJECTS[key] && key === "line")
        addShapeDefinition(tgt, SHAPE_TYPE.LINE, object[key]);
      else if (MASTER_OBJECTS[key] && key === "rect")
        addShapeDefinition(tgt, SHAPE_TYPE.RECTANGLE, object[key]);
      else if (MASTER_OBJECTS[key] && key === "text")
        addTextDefinition(tgt, [{ text: object[key].text }], object[key].options, false);
      else if (MASTER_OBJECTS[key] && key === "placeholder") {
        object[key].options.placeholder = object[key].options.name;
        delete object[key].options.name;
        object[key].options._placeholderType = object[key].options.type;
        delete object[key].options.type;
        object[key].options._placeholderIdx = 100 + idx;
        addTextDefinition(tgt, [{ text: object[key].text }], object[key].options, true);
      }
    });
  }
  if (props.slideNumber && typeof props.slideNumber === "object")
    target._slideNumberProps = props.slideNumber;
}
function addChartDefinition(target, type, data, opt) {
  var _a;
  function correctGridLineOptions(glOpts) {
    if (!glOpts || glOpts.style === "none")
      return;
    if (glOpts.size !== void 0 && (isNaN(Number(glOpts.size)) || glOpts.size <= 0)) {
      console.warn("Warning: chart.gridLine.size must be greater than 0.");
      delete glOpts.size;
    }
    if (glOpts.style && !["solid", "dash", "dot"].includes(glOpts.style)) {
      console.warn("Warning: chart.gridLine.style options: `solid`, `dash`, `dot`.");
      delete glOpts.style;
    }
    if (glOpts.cap && !["flat", "square", "round"].includes(glOpts.cap)) {
      console.warn("Warning: chart.gridLine.cap options: `flat`, `square`, `round`.");
      delete glOpts.cap;
    }
  }
  const chartId = ++_chartCounter;
  const resultObject = {
    _type: null,
    text: null,
    options: null,
    chartRid: null
  };
  let tmpOpt = null;
  let tmpData = [];
  if (Array.isArray(type)) {
    type.forEach((obj) => {
      tmpData = tmpData.concat(obj.data);
    });
    tmpOpt = data || opt;
  } else {
    tmpData = data;
    tmpOpt = opt;
  }
  tmpData.forEach((item, i) => {
    item._dataIndex = i;
    if (item.labels !== void 0 && !Array.isArray(item.labels[0])) {
      item.labels = [item.labels];
    }
  });
  const options = tmpOpt && typeof tmpOpt === "object" ? tmpOpt : {};
  options._type = type;
  options.x = typeof options.x !== "undefined" && options.x != null && !isNaN(Number(options.x)) ? options.x : 1;
  options.y = typeof options.y !== "undefined" && options.y != null && !isNaN(Number(options.y)) ? options.y : 1;
  options.w = options.w || "50%";
  options.h = options.h || "50%";
  options.objectName = options.objectName ? encodeXmlEntities(options.objectName) : `Chart ${target._slideObjects.filter((obj) => obj._type === SLIDE_OBJECT_TYPES.chart).length}`;
  if (!["bar", "col"].includes(options.barDir || ""))
    options.barDir = "col";
  if (options._type === CHART_TYPE.AREA) {
    if (!["stacked", "standard", "percentStacked"].includes(options.barGrouping || ""))
      options.barGrouping = "standard";
  }
  if (options._type === CHART_TYPE.BAR) {
    if (!["clustered", "stacked", "percentStacked"].includes(options.barGrouping || ""))
      options.barGrouping = "clustered";
  }
  if (options._type === CHART_TYPE.BAR3D) {
    if (!["clustered", "stacked", "standard", "percentStacked"].includes(options.barGrouping || ""))
      options.barGrouping = "standard";
  }
  if ((_a = options.barGrouping) === null || _a === void 0 ? void 0 : _a.includes("tacked")) {
    if (!options.barGapWidthPct)
      options.barGapWidthPct = 50;
  }
  if (options.dataLabelPosition) {
    if (options._type === CHART_TYPE.AREA || options._type === CHART_TYPE.BAR3D || options._type === CHART_TYPE.DOUGHNUT || options._type === CHART_TYPE.RADAR) {
      delete options.dataLabelPosition;
    }
    if (options._type === CHART_TYPE.PIE) {
      if (!["bestFit", "ctr", "inEnd", "outEnd"].includes(options.dataLabelPosition))
        delete options.dataLabelPosition;
    }
    if (options._type === CHART_TYPE.BUBBLE || options._type === CHART_TYPE.BUBBLE3D || options._type === CHART_TYPE.LINE || options._type === CHART_TYPE.SCATTER) {
      if (!["b", "ctr", "l", "r", "t"].includes(options.dataLabelPosition))
        delete options.dataLabelPosition;
    }
    if (options._type === CHART_TYPE.BAR) {
      if (!["stacked", "percentStacked"].includes(options.barGrouping || "")) {
        if (!["ctr", "inBase", "inEnd"].includes(options.dataLabelPosition))
          delete options.dataLabelPosition;
      }
      if (!["clustered"].includes(options.barGrouping || "")) {
        if (!["ctr", "inBase", "inEnd", "outEnd"].includes(options.dataLabelPosition))
          delete options.dataLabelPosition;
      }
    }
  }
  options.dataLabelBkgrdColors = options.dataLabelBkgrdColors || !options.dataLabelBkgrdColors ? options.dataLabelBkgrdColors : false;
  if (!["b", "l", "r", "t", "tr"].includes(options.legendPos || ""))
    options.legendPos = "r";
  if (!["cone", "coneToMax", "box", "cylinder", "pyramid", "pyramidToMax"].includes(options.bar3DShape || ""))
    options.bar3DShape = "box";
  if (!["circle", "dash", "diamond", "dot", "none", "square", "triangle"].includes(options.lineDataSymbol || ""))
    options.lineDataSymbol = "circle";
  if (!["gap", "span"].includes(options.displayBlanksAs || ""))
    options.displayBlanksAs = "span";
  if (!["standard", "marker", "filled"].includes(options.radarStyle || ""))
    options.radarStyle = "standard";
  options.lineDataSymbolSize = options.lineDataSymbolSize && !isNaN(options.lineDataSymbolSize) ? options.lineDataSymbolSize : 6;
  options.lineDataSymbolLineSize = options.lineDataSymbolLineSize && !isNaN(options.lineDataSymbolLineSize) ? valToPts(options.lineDataSymbolLineSize) : valToPts(0.75);
  if (options.layout) {
    ["x", "y", "w", "h"].forEach((key) => {
      const val = options.layout[key];
      if (isNaN(Number(val)) || val < 0 || val > 1) {
        console.warn("Warning: chart.layout." + key + " can only be 0-1");
        delete options.layout[key];
      }
    });
  }
  options.catGridLine = options.catGridLine || (options._type === CHART_TYPE.SCATTER ? { color: "D9D9D9", size: 1 } : { style: "none" });
  options.valGridLine = options.valGridLine || (options._type === CHART_TYPE.SCATTER ? { color: "D9D9D9", size: 1 } : {});
  options.serGridLine = options.serGridLine || (options._type === CHART_TYPE.SCATTER ? { color: "D9D9D9", size: 1 } : { style: "none" });
  correctGridLineOptions(options.catGridLine);
  correctGridLineOptions(options.valGridLine);
  correctGridLineOptions(options.serGridLine);
  correctShadowOptions(options.shadow);
  options.showDataTable = options.showDataTable || !options.showDataTable ? options.showDataTable : false;
  options.showDataTableHorzBorder = options.showDataTableHorzBorder || !options.showDataTableHorzBorder ? options.showDataTableHorzBorder : true;
  options.showDataTableVertBorder = options.showDataTableVertBorder || !options.showDataTableVertBorder ? options.showDataTableVertBorder : true;
  options.showDataTableOutline = options.showDataTableOutline || !options.showDataTableOutline ? options.showDataTableOutline : true;
  options.showDataTableKeys = options.showDataTableKeys || !options.showDataTableKeys ? options.showDataTableKeys : true;
  options.showLabel = options.showLabel || !options.showLabel ? options.showLabel : false;
  options.showLegend = options.showLegend || !options.showLegend ? options.showLegend : false;
  options.showPercent = options.showPercent || !options.showPercent ? options.showPercent : true;
  options.showTitle = options.showTitle || !options.showTitle ? options.showTitle : false;
  options.showValue = options.showValue || !options.showValue ? options.showValue : false;
  options.showLeaderLines = options.showLeaderLines || !options.showLeaderLines ? options.showLeaderLines : false;
  options.catAxisLineShow = typeof options.catAxisLineShow !== "undefined" ? options.catAxisLineShow : true;
  options.valAxisLineShow = typeof options.valAxisLineShow !== "undefined" ? options.valAxisLineShow : true;
  options.serAxisLineShow = typeof options.serAxisLineShow !== "undefined" ? options.serAxisLineShow : true;
  options.v3DRotX = !isNaN(options.v3DRotX) && options.v3DRotX >= -90 && options.v3DRotX <= 90 ? options.v3DRotX : 30;
  options.v3DRotY = !isNaN(options.v3DRotY) && options.v3DRotY >= 0 && options.v3DRotY <= 360 ? options.v3DRotY : 30;
  options.v3DRAngAx = options.v3DRAngAx || !options.v3DRAngAx ? options.v3DRAngAx : true;
  options.v3DPerspective = !isNaN(options.v3DPerspective) && options.v3DPerspective >= 0 && options.v3DPerspective <= 240 ? options.v3DPerspective : 30;
  options.barGapWidthPct = !isNaN(options.barGapWidthPct) && options.barGapWidthPct >= 0 && options.barGapWidthPct <= 1e3 ? options.barGapWidthPct : 150;
  options.barGapDepthPct = !isNaN(options.barGapDepthPct) && options.barGapDepthPct >= 0 && options.barGapDepthPct <= 1e3 ? options.barGapDepthPct : 150;
  options.chartColors = Array.isArray(options.chartColors) ? options.chartColors : options._type === CHART_TYPE.PIE || options._type === CHART_TYPE.DOUGHNUT ? PIECHART_COLORS : BARCHART_COLORS;
  options.chartColorsOpacity = options.chartColorsOpacity && !isNaN(options.chartColorsOpacity) ? options.chartColorsOpacity : null;
  options.border = options.border && typeof options.border === "object" ? options.border : null;
  if (options.border && (!options.border.pt || isNaN(options.border.pt)))
    options.border.pt = DEF_CHART_BORDER.pt;
  if (options.border && (!options.border.color || typeof options.border.color !== "string"))
    options.border.color = DEF_CHART_BORDER.color;
  options.plotArea = options.plotArea || {};
  options.plotArea.border = options.plotArea.border && typeof options.plotArea.border === "object" ? options.plotArea.border : null;
  if (options.plotArea.border && (!options.plotArea.border.pt || isNaN(options.plotArea.border.pt)))
    options.plotArea.border.pt = DEF_CHART_BORDER.pt;
  if (options.plotArea.border && (!options.plotArea.border.color || typeof options.plotArea.border.color !== "string")) {
    options.plotArea.border.color = DEF_CHART_BORDER.color;
  }
  if (options.border)
    options.plotArea.border = options.border;
  options.plotArea.fill = options.plotArea.fill || { color: null, transparency: null };
  if (options.fill)
    options.plotArea.fill.color = options.fill;
  options.chartArea = options.chartArea || {};
  options.chartArea.border = options.chartArea.border && typeof options.chartArea.border === "object" ? options.chartArea.border : null;
  if (options.chartArea.border) {
    options.chartArea.border = {
      color: options.chartArea.border.color || DEF_CHART_BORDER.color,
      pt: options.chartArea.border.pt || DEF_CHART_BORDER.pt
    };
  }
  options.chartArea.roundedCorners = typeof options.chartArea.roundedCorners === "boolean" ? options.chartArea.roundedCorners : true;
  options.dataBorder = options.dataBorder && typeof options.dataBorder === "object" ? options.dataBorder : null;
  if (options.dataBorder && (!options.dataBorder.pt || isNaN(options.dataBorder.pt)))
    options.dataBorder.pt = 0.75;
  if (options.dataBorder && options.dataBorder.color) {
    const isHexColor = typeof options.dataBorder.color === "string" && options.dataBorder.color.length === 6 && /^[0-9A-Fa-f]{6}$/.test(options.dataBorder.color);
    const isSchemeColor = Object.values(SCHEME_COLOR_NAMES).includes(options.dataBorder.color);
    if (!isHexColor && !isSchemeColor) {
      options.dataBorder.color = "F9F9F9";
    }
  }
  if (!options.dataLabelFormatCode && options._type === CHART_TYPE.SCATTER)
    options.dataLabelFormatCode = "General";
  if (!options.dataLabelFormatCode && (options._type === CHART_TYPE.PIE || options._type === CHART_TYPE.DOUGHNUT)) {
    options.dataLabelFormatCode = options.showPercent ? "0%" : "General";
  }
  options.dataLabelFormatCode = options.dataLabelFormatCode && typeof options.dataLabelFormatCode === "string" ? options.dataLabelFormatCode : "#,##0";
  if (!options.dataLabelFormatScatter && options._type === CHART_TYPE.SCATTER)
    options.dataLabelFormatScatter = "custom";
  options.lineSize = typeof options.lineSize === "number" ? options.lineSize : 2;
  options.valAxisMajorUnit = typeof options.valAxisMajorUnit === "number" ? options.valAxisMajorUnit : null;
  if (options._type === CHART_TYPE.AREA || options._type === CHART_TYPE.BAR || options._type === CHART_TYPE.BAR3D || options._type === CHART_TYPE.LINE) {
    options.catAxisMultiLevelLabels = !!options.catAxisMultiLevelLabels;
  } else {
    delete options.catAxisMultiLevelLabels;
  }
  resultObject._type = "chart";
  resultObject.options = options;
  resultObject.chartRid = getNewRelId(target);
  target._relsChart.push({
    rId: getNewRelId(target),
    data: tmpData,
    opts: options,
    type: options._type,
    globalId: chartId,
    fileName: `chart${chartId}.xml`,
    Target: `/ppt/charts/chart${chartId}.xml`
  });
  target._slideObjects.push(resultObject);
  return resultObject;
}
function addImageDefinition(target, opt) {
  const newObject = {
    _type: null,
    text: null,
    options: null,
    image: null,
    imageRid: null,
    hyperlink: null
  };
  const intPosX = opt.x || 0;
  const intPosY = opt.y || 0;
  const intWidth = opt.w || 0;
  const intHeight = opt.h || 0;
  const sizing = opt.sizing || null;
  const objHyperlink = opt.hyperlink || "";
  const strImageData = opt.data || "";
  const strImagePath = opt.path || "";
  let imageRelId = getNewRelId(target);
  const objectName = opt.objectName ? encodeXmlEntities(opt.objectName) : `Image ${target._slideObjects.filter((obj) => obj._type === SLIDE_OBJECT_TYPES.image).length}`;
  if (!strImagePath && !strImageData) {
    console.error("ERROR: addImage() requires either 'data' or 'path' parameter!");
    return null;
  } else if (strImagePath && typeof strImagePath !== "string") {
    console.error(`ERROR: addImage() 'path' should be a string, ex: {path:'/img/sample.png'} - you sent ${String(strImagePath)}`);
    return null;
  } else if (strImageData && typeof strImageData !== "string") {
    console.error(`ERROR: addImage() 'data' should be a string, ex: {data:'image/png;base64,NMP[...]'} - you sent ${String(strImageData)}`);
    return null;
  } else if (strImageData && typeof strImageData === "string" && !strImageData.toLowerCase().includes("base64,")) {
    console.error("ERROR: Image `data` value lacks a base64 header! Ex: 'image/png;base64,NMP[...]')");
    return null;
  }
  let strImgExtn = (strImagePath.substring(strImagePath.lastIndexOf("/") + 1).split("?")[0].split(".").pop().split("#")[0] || "png").toLowerCase();
  if (strImageData && /image\/(\w+);/.exec(strImageData) && /image\/(\w+);/.exec(strImageData).length > 0) {
    strImgExtn = /image\/(\w+);/.exec(strImageData)[1];
  } else if (strImageData === null || strImageData === void 0 ? void 0 : strImageData.toLowerCase().includes("image/svg+xml")) {
    strImgExtn = "svg";
  }
  newObject._type = SLIDE_OBJECT_TYPES.image;
  newObject.image = strImagePath || "preencoded.png";
  newObject.options = {
    x: intPosX || 0,
    y: intPosY || 0,
    w: intWidth || 1,
    h: intHeight || 1,
    altText: opt.altText || "",
    rounding: typeof opt.rounding === "boolean" ? opt.rounding : false,
    sizing,
    placeholder: opt.placeholder,
    rotate: opt.rotate || 0,
    flipV: opt.flipV || false,
    flipH: opt.flipH || false,
    transparency: opt.transparency || 0,
    objectName,
    shadow: correctShadowOptions(opt.shadow)
  };
  if (strImgExtn === "svg") {
    target._relsMedia.push({
      path: strImagePath || strImageData + "png",
      type: "image/png",
      extn: "png",
      data: strImageData || "",
      rId: imageRelId,
      Target: `../media/image-${target._slideNum}-${target._relsMedia.length + 1}.png`,
      isSvgPng: true,
      svgSize: { w: getSmartParseNumber(newObject.options.w, "X", target._presLayout), h: getSmartParseNumber(newObject.options.h, "Y", target._presLayout) }
    });
    newObject.imageRid = imageRelId;
    target._relsMedia.push({
      path: strImagePath || strImageData,
      type: "image/svg+xml",
      extn: strImgExtn,
      data: strImageData || "",
      rId: imageRelId + 1,
      Target: `../media/image-${target._slideNum}-${target._relsMedia.length + 1}.${strImgExtn}`
    });
    newObject.imageRid = imageRelId + 1;
  } else {
    const dupeItem = target._relsMedia.filter((item) => item.path && item.path === strImagePath && item.type === "image/" + strImgExtn && !item.isDuplicate)[0];
    target._relsMedia.push({
      path: strImagePath || "preencoded." + strImgExtn,
      type: "image/" + strImgExtn,
      extn: strImgExtn,
      data: strImageData || "",
      rId: imageRelId,
      isDuplicate: !!(dupeItem === null || dupeItem === void 0 ? void 0 : dupeItem.Target),
      Target: (dupeItem === null || dupeItem === void 0 ? void 0 : dupeItem.Target) ? dupeItem.Target : `../media/image-${target._slideNum}-${target._relsMedia.length + 1}.${strImgExtn}`
    });
    newObject.imageRid = imageRelId;
  }
  if (typeof objHyperlink === "object") {
    if (!objHyperlink.url && !objHyperlink.slide)
      throw new Error("ERROR: `hyperlink` option requires either: `url` or `slide`");
    else {
      imageRelId++;
      target._rels.push({
        type: SLIDE_OBJECT_TYPES.hyperlink,
        data: objHyperlink.slide ? "slide" : "dummy",
        rId: imageRelId,
        Target: objHyperlink.url || objHyperlink.slide.toString()
      });
      objHyperlink._rId = imageRelId;
      newObject.hyperlink = objHyperlink;
    }
  }
  target._slideObjects.push(newObject);
}
function addMediaDefinition(target, opt) {
  const intPosX = opt.x || 0;
  const intPosY = opt.y || 0;
  const intSizeX = opt.w || 2;
  const intSizeY = opt.h || 2;
  const strData = opt.data || "";
  const strLink = opt.link || "";
  const strPath = opt.path || "";
  const strType = opt.type || "audio";
  let strExtn = "";
  const strCover = opt.cover || IMG_PLAYBTN;
  const objectName = opt.objectName ? encodeXmlEntities(opt.objectName) : `Media ${target._slideObjects.filter((obj) => obj._type === SLIDE_OBJECT_TYPES.media).length}`;
  const slideData = { _type: SLIDE_OBJECT_TYPES.media };
  if (!strPath && !strData && strType !== "online") {
    throw new Error("addMedia() error: either `data` or `path` are required!");
  } else if (strData && !strData.toLowerCase().includes("base64,")) {
    throw new Error("addMedia() error: `data` value lacks a base64 header! Ex: 'video/mpeg;base64,NMP[...]')");
  } else if (!strCover.toLowerCase().includes("base64,")) {
    throw new Error("addMedia() error: `cover` value lacks a base64 header! Ex: 'data:image/png;base64,iV[...]')");
  }
  if (strType === "online" && !strLink) {
    throw new Error("addMedia() error: online videos require `link` value");
  }
  strExtn = opt.extn || (strData ? strData.split(";")[0].split("/")[1] : strPath.split(".").pop()) || "mp3";
  slideData.mtype = strType;
  slideData.media = strPath || "preencoded.mov";
  slideData.options = {};
  slideData.options.x = intPosX;
  slideData.options.y = intPosY;
  slideData.options.w = intSizeX;
  slideData.options.h = intSizeY;
  slideData.options.objectName = objectName;
  if (strType === "online") {
    const relId1 = getNewRelId(target);
    target._relsMedia.push({
      path: strPath || "preencoded" + strExtn,
      data: "dummy",
      type: "online",
      extn: strExtn,
      rId: relId1,
      Target: strLink
    });
    slideData.mediaRid = relId1;
    target._relsMedia.push({
      path: "preencoded.png",
      data: strCover,
      type: "image/png",
      extn: "png",
      rId: getNewRelId(target),
      Target: `../media/image-${target._slideNum}-${target._relsMedia.length + 1}.png`
    });
  } else {
    const dupeItem = target._relsMedia.filter((item) => item.path && item.path === strPath && item.type === strType + "/" + strExtn && !item.isDuplicate)[0];
    const relId1 = getNewRelId(target);
    target._relsMedia.push({
      path: strPath || "preencoded" + strExtn,
      type: strType + "/" + strExtn,
      extn: strExtn,
      data: strData || "",
      rId: relId1,
      isDuplicate: !!(dupeItem === null || dupeItem === void 0 ? void 0 : dupeItem.Target),
      Target: (dupeItem === null || dupeItem === void 0 ? void 0 : dupeItem.Target) ? dupeItem.Target : `../media/media-${target._slideNum}-${target._relsMedia.length + 1}.${strExtn}`
    });
    slideData.mediaRid = relId1;
    target._relsMedia.push({
      path: strPath || "preencoded" + strExtn,
      type: strType + "/" + strExtn,
      extn: strExtn,
      data: strData || "",
      rId: getNewRelId(target),
      isDuplicate: !!(dupeItem === null || dupeItem === void 0 ? void 0 : dupeItem.Target),
      Target: (dupeItem === null || dupeItem === void 0 ? void 0 : dupeItem.Target) ? dupeItem.Target : `../media/media-${target._slideNum}-${target._relsMedia.length + 0}.${strExtn}`
    });
    target._relsMedia.push({
      path: "preencoded.png",
      type: "image/png",
      extn: "png",
      data: strCover,
      rId: getNewRelId(target),
      Target: `../media/image-${target._slideNum}-${target._relsMedia.length + 1}.png`
    });
  }
  target._slideObjects.push(slideData);
}
function addNotesDefinition(target, notes) {
  target._slideObjects.push({
    _type: SLIDE_OBJECT_TYPES.notes,
    text: [{ text: notes }]
  });
}
function addShapeDefinition(target, shapeName, opts) {
  const options = typeof opts === "object" ? opts : {};
  options.line = options.line || { type: "none" };
  const newObject = {
    _type: SLIDE_OBJECT_TYPES.text,
    shape: shapeName || SHAPE_TYPE.RECTANGLE,
    options,
    text: null
  };
  if (!shapeName)
    throw new Error("Missing/Invalid shape parameter! Example: `addShape(pptxgen.shapes.LINE, {x:1, y:1, w:1, h:1});`");
  const newLineOpts = {
    type: options.line.type || "solid",
    color: options.line.color || DEF_SHAPE_LINE_COLOR,
    transparency: options.line.transparency || 0,
    width: options.line.width || 1,
    dashType: options.line.dashType || "solid",
    beginArrowType: options.line.beginArrowType || null,
    endArrowType: options.line.endArrowType || null
  };
  if (typeof options.line === "object" && options.line.type !== "none")
    options.line = newLineOpts;
  options.x = options.x || (options.x === 0 ? 0 : 1);
  options.y = options.y || (options.y === 0 ? 0 : 1);
  options.w = options.w || (options.w === 0 ? 0 : 1);
  options.h = options.h || (options.h === 0 ? 0 : 1);
  options.objectName = options.objectName ? encodeXmlEntities(options.objectName) : `Shape ${target._slideObjects.filter((obj) => obj._type === SLIDE_OBJECT_TYPES.text).length}`;
  if (typeof options.line === "string") {
    const tmpOpts = newLineOpts;
    tmpOpts.color = String(options.line);
    options.line = tmpOpts;
  }
  if (typeof options.lineSize === "number")
    options.line.width = options.lineSize;
  if (typeof options.lineDash === "string")
    options.line.dashType = options.lineDash;
  if (typeof options.lineHead === "string")
    options.line.beginArrowType = options.lineHead;
  if (typeof options.lineTail === "string")
    options.line.endArrowType = options.lineTail;
  createHyperlinkRels(target, newObject);
  target._slideObjects.push(newObject);
}
function addTableDefinition(target, tableRows, options, slideLayout, presLayout, addSlide, getSlide) {
  const slides = [target];
  const opt = options && typeof options === "object" ? options : {};
  opt.objectName = opt.objectName ? encodeXmlEntities(opt.objectName) : `Table ${target._slideObjects.filter((obj) => obj._type === SLIDE_OBJECT_TYPES.table).length}`;
  {
    if (tableRows === null || tableRows.length === 0 || !Array.isArray(tableRows)) {
      throw new Error("addTable: Array expected! EX: 'slide.addTable( [rows], {options} );' (https://gitbrent.github.io/PptxGenJS/docs/api-tables.html)");
    }
    if (!tableRows[0] || !Array.isArray(tableRows[0])) {
      throw new Error("addTable: 'rows' should be an array of cells! EX: 'slide.addTable( [ ['A'], ['B'], {text:'C',options:{align:'center'}} ] );' (https://gitbrent.github.io/PptxGenJS/docs/api-tables.html)");
    }
  }
  const arrRows = [];
  tableRows.forEach((row) => {
    const newRow = [];
    if (Array.isArray(row)) {
      row.forEach((cell) => {
        const newCell = {
          _type: SLIDE_OBJECT_TYPES.tablecell,
          text: "",
          options: typeof cell === "object" && cell.options ? cell.options : {}
        };
        if (typeof cell === "string" || typeof cell === "number")
          newCell.text = cell.toString();
        else if (cell.text) {
          if (typeof cell.text === "string" || typeof cell.text === "number")
            newCell.text = cell.text.toString();
          else if (cell.text)
            newCell.text = cell.text;
          if (cell.options && typeof cell.options === "object")
            newCell.options = cell.options;
        }
        newCell.options.border = newCell.options.border || opt.border || [{ type: "none" }, { type: "none" }, { type: "none" }, { type: "none" }];
        const cellBorder = newCell.options.border;
        if (!Array.isArray(cellBorder) && typeof cellBorder === "object")
          newCell.options.border = [cellBorder, cellBorder, cellBorder, cellBorder];
        if (!newCell.options.border[0])
          newCell.options.border[0] = { type: "none" };
        if (!newCell.options.border[1])
          newCell.options.border[1] = { type: "none" };
        if (!newCell.options.border[2])
          newCell.options.border[2] = { type: "none" };
        if (!newCell.options.border[3])
          newCell.options.border[3] = { type: "none" };
        const arrSides = [0, 1, 2, 3];
        arrSides.forEach((idx) => {
          newCell.options.border[idx] = {
            type: newCell.options.border[idx].type || DEF_CELL_BORDER.type,
            color: newCell.options.border[idx].color || DEF_CELL_BORDER.color,
            pt: typeof newCell.options.border[idx].pt === "number" ? newCell.options.border[idx].pt : DEF_CELL_BORDER.pt
          };
        });
        newRow.push(newCell);
      });
    } else {
      console.log("addTable: tableRows has a bad row. A row should be an array of cells. You provided:");
      console.log(row);
    }
    arrRows.push(newRow);
  });
  opt.x = getSmartParseNumber(opt.x || (opt.x === 0 ? 0 : EMU / 2), "X", presLayout);
  opt.y = getSmartParseNumber(opt.y || (opt.y === 0 ? 0 : EMU / 2), "Y", presLayout);
  if (opt.h)
    opt.h = getSmartParseNumber(opt.h, "Y", presLayout);
  opt.fontSize = opt.fontSize || DEF_FONT_SIZE;
  opt.margin = opt.margin === 0 || opt.margin ? opt.margin : DEF_CELL_MARGIN_IN;
  if (typeof opt.margin === "number")
    opt.margin = [Number(opt.margin), Number(opt.margin), Number(opt.margin), Number(opt.margin)];
  if (JSON.stringify({ arrRows }).indexOf("hyperlink") === -1) {
    if (!opt.color)
      opt.color = opt.color || DEF_FONT_COLOR;
  }
  if (typeof opt.border === "string") {
    console.warn("addTable `border` option must be an object. Ex: `{border: {type:'none'}}`");
    opt.border = null;
  } else if (Array.isArray(opt.border)) {
    [0, 1, 2, 3].forEach((idx) => {
      opt.border[idx] = opt.border[idx] ? { type: opt.border[idx].type || DEF_CELL_BORDER.type, color: opt.border[idx].color || DEF_CELL_BORDER.color, pt: opt.border[idx].pt || DEF_CELL_BORDER.pt } : { type: "none" };
    });
  }
  opt.autoPage = typeof opt.autoPage === "boolean" ? opt.autoPage : false;
  opt.autoPageRepeatHeader = typeof opt.autoPageRepeatHeader === "boolean" ? opt.autoPageRepeatHeader : false;
  opt.autoPageHeaderRows = typeof opt.autoPageHeaderRows !== "undefined" && !isNaN(Number(opt.autoPageHeaderRows)) ? Number(opt.autoPageHeaderRows) : 1;
  opt.autoPageLineWeight = typeof opt.autoPageLineWeight !== "undefined" && !isNaN(Number(opt.autoPageLineWeight)) ? Number(opt.autoPageLineWeight) : 0;
  if (opt.autoPageLineWeight) {
    if (opt.autoPageLineWeight > 1)
      opt.autoPageLineWeight = 1;
    else if (opt.autoPageLineWeight < -1)
      opt.autoPageLineWeight = -1;
  }
  let arrTableMargin = DEF_SLIDE_MARGIN_IN;
  if (slideLayout && typeof slideLayout._margin !== "undefined") {
    if (Array.isArray(slideLayout._margin))
      arrTableMargin = slideLayout._margin;
    else if (!isNaN(Number(slideLayout._margin))) {
      arrTableMargin = [Number(slideLayout._margin), Number(slideLayout._margin), Number(slideLayout._margin), Number(slideLayout._margin)];
    }
  }
  if (opt.colW) {
    const firstRowColCnt = arrRows[0].reduce((totalLen, c) => {
      var _a;
      if (((_a = c === null || c === void 0 ? void 0 : c.options) === null || _a === void 0 ? void 0 : _a.colspan) && typeof c.options.colspan === "number") {
        totalLen += c.options.colspan;
      } else {
        totalLen += 1;
      }
      return totalLen;
    }, 0);
    if (typeof opt.colW === "string" || typeof opt.colW === "number") {
      opt.w = Math.floor(Number(opt.colW) * firstRowColCnt);
      opt.colW = null;
    } else if (opt.colW && Array.isArray(opt.colW) && opt.colW.length === 1 && firstRowColCnt > 1) {
      opt.w = Math.floor(Number(opt.colW) * firstRowColCnt);
      opt.colW = null;
    } else if (opt.colW && Array.isArray(opt.colW) && opt.colW.length !== firstRowColCnt) {
      console.warn("addTable: mismatch: (colW.length != data.length) Therefore, defaulting to evenly distributed col widths.");
      opt.colW = null;
    }
  } else if (opt.w) {
    opt.w = getSmartParseNumber(opt.w, "X", presLayout);
  } else {
    opt.w = Math.floor(presLayout._sizeW / EMU - arrTableMargin[1] - arrTableMargin[3]);
  }
  if (opt.x && opt.x < 20)
    opt.x = inch2Emu(opt.x);
  if (opt.y && opt.y < 20)
    opt.y = inch2Emu(opt.y);
  if (opt.w && typeof opt.w === "number" && opt.w < 20)
    opt.w = inch2Emu(opt.w);
  if (opt.h && typeof opt.h === "number" && opt.h < 20)
    opt.h = inch2Emu(opt.h);
  arrRows.forEach((row) => {
    row.forEach((cell, idy) => {
      if (typeof cell === "number" || typeof cell === "string") {
        row[idy] = { _type: SLIDE_OBJECT_TYPES.tablecell, text: String(row[idy]), options: opt };
      } else if (typeof cell === "object") {
        if (typeof cell.text === "number")
          row[idy].text = row[idy].text.toString();
        else if (typeof cell.text === "undefined" || cell.text === null)
          row[idy].text = "";
        row[idy].options = cell.options || {};
        row[idy]._type = SLIDE_OBJECT_TYPES.tablecell;
      }
    });
  });
  const newAutoPagedSlides = [];
  if (opt && !opt.autoPage) {
    createHyperlinkRels(target, arrRows);
    target._slideObjects.push({
      _type: SLIDE_OBJECT_TYPES.table,
      arrTabRows: arrRows,
      options: Object.assign({}, opt)
    });
  } else {
    if (opt.autoPageRepeatHeader)
      opt._arrObjTabHeadRows = arrRows.filter((_row, idx) => idx < opt.autoPageHeaderRows);
    getSlidesForTableRows(arrRows, opt, presLayout, slideLayout).forEach((slide2, idx) => {
      if (!getSlide(target._slideNum + idx))
        slides.push(addSlide({ masterName: (slideLayout === null || slideLayout === void 0 ? void 0 : slideLayout._name) || null }));
      if (idx > 0)
        opt.y = inch2Emu(opt.autoPageSlideStartY || opt.newSlideStartY || arrTableMargin[0]);
      {
        const newSlide = getSlide(target._slideNum + idx);
        opt.autoPage = false;
        createHyperlinkRels(newSlide, slide2.rows);
        newSlide.addTable(slide2.rows, Object.assign({}, opt));
        if (idx > 0)
          newAutoPagedSlides.push(newSlide);
      }
    });
  }
  return newAutoPagedSlides;
}
function addTextDefinition(target, text2, opts, isPlaceholder) {
  const newObject = {
    _type: isPlaceholder ? SLIDE_OBJECT_TYPES.placeholder : SLIDE_OBJECT_TYPES.text,
    shape: (opts === null || opts === void 0 ? void 0 : opts.shape) || SHAPE_TYPE.RECTANGLE,
    text: !text2 || text2.length === 0 ? [{ text: "", options: null }] : text2,
    options: opts || {}
  };
  function cleanOpts(itemOpts) {
    {
      if (!itemOpts.placeholder) {
        itemOpts.color = itemOpts.color || newObject.options.color || target.color || DEF_FONT_COLOR;
      }
      if (itemOpts.placeholder || isPlaceholder) {
        itemOpts.bullet = itemOpts.bullet || false;
      }
      if (itemOpts.placeholder && target._slideLayout && target._slideLayout._slideObjects) {
        const placeHold = target._slideLayout._slideObjects.filter((item) => item._type === "placeholder" && item.options && item.options.placeholder && item.options.placeholder === itemOpts.placeholder)[0];
        if (placeHold === null || placeHold === void 0 ? void 0 : placeHold.options)
          itemOpts = Object.assign(Object.assign({}, itemOpts), placeHold.options);
      }
      itemOpts.objectName = itemOpts.objectName ? encodeXmlEntities(itemOpts.objectName) : `Text ${target._slideObjects.filter((obj) => obj._type === SLIDE_OBJECT_TYPES.text).length}`;
      if (itemOpts.shape === SHAPE_TYPE.LINE) {
        const newLineOpts = {
          type: itemOpts.line.type || "solid",
          color: itemOpts.line.color || DEF_SHAPE_LINE_COLOR,
          transparency: itemOpts.line.transparency || 0,
          width: itemOpts.line.width || 1,
          dashType: itemOpts.line.dashType || "solid",
          beginArrowType: itemOpts.line.beginArrowType || null,
          endArrowType: itemOpts.line.endArrowType || null
        };
        if (typeof itemOpts.line === "object")
          itemOpts.line = newLineOpts;
        if (typeof itemOpts.line === "string") {
          const tmpOpts = newLineOpts;
          if (typeof itemOpts.line === "string")
            tmpOpts.color = itemOpts.line;
          itemOpts.line = tmpOpts;
        }
        if (typeof itemOpts.lineSize === "number")
          itemOpts.line.width = itemOpts.lineSize;
        if (typeof itemOpts.lineDash === "string")
          itemOpts.line.dashType = itemOpts.lineDash;
        if (typeof itemOpts.lineHead === "string")
          itemOpts.line.beginArrowType = itemOpts.lineHead;
        if (typeof itemOpts.lineTail === "string")
          itemOpts.line.endArrowType = itemOpts.lineTail;
      }
      itemOpts.line = itemOpts.line || {};
      itemOpts.lineSpacing = itemOpts.lineSpacing && !isNaN(itemOpts.lineSpacing) ? itemOpts.lineSpacing : null;
      itemOpts.lineSpacingMultiple = itemOpts.lineSpacingMultiple && !isNaN(itemOpts.lineSpacingMultiple) ? itemOpts.lineSpacingMultiple : null;
      itemOpts._bodyProp = itemOpts._bodyProp || {};
      itemOpts._bodyProp.autoFit = itemOpts.autoFit || false;
      itemOpts._bodyProp.anchor = !itemOpts.placeholder ? TEXT_VALIGN.ctr : null;
      itemOpts._bodyProp.vert = itemOpts.vert || null;
      itemOpts._bodyProp.wrap = typeof itemOpts.wrap === "boolean" ? itemOpts.wrap : true;
      if (itemOpts.inset && !isNaN(Number(itemOpts.inset)) || itemOpts.inset === 0) {
        itemOpts._bodyProp.lIns = inch2Emu(itemOpts.inset);
        itemOpts._bodyProp.rIns = inch2Emu(itemOpts.inset);
        itemOpts._bodyProp.tIns = inch2Emu(itemOpts.inset);
        itemOpts._bodyProp.bIns = inch2Emu(itemOpts.inset);
      }
      if (typeof itemOpts.underline === "boolean" && itemOpts.underline === true)
        itemOpts.underline = { style: "sng" };
    }
    {
      if ((itemOpts.align || "").toLowerCase().indexOf("c") === 0)
        itemOpts._bodyProp.align = TEXT_HALIGN.center;
      else if ((itemOpts.align || "").toLowerCase().indexOf("l") === 0)
        itemOpts._bodyProp.align = TEXT_HALIGN.left;
      else if ((itemOpts.align || "").toLowerCase().indexOf("r") === 0)
        itemOpts._bodyProp.align = TEXT_HALIGN.right;
      else if ((itemOpts.align || "").toLowerCase().indexOf("j") === 0)
        itemOpts._bodyProp.align = TEXT_HALIGN.justify;
      if ((itemOpts.valign || "").toLowerCase().indexOf("b") === 0)
        itemOpts._bodyProp.anchor = TEXT_VALIGN.b;
      else if ((itemOpts.valign || "").toLowerCase().indexOf("m") === 0)
        itemOpts._bodyProp.anchor = TEXT_VALIGN.ctr;
      else if ((itemOpts.valign || "").toLowerCase().indexOf("t") === 0)
        itemOpts._bodyProp.anchor = TEXT_VALIGN.t;
    }
    correctShadowOptions(itemOpts.shadow);
    return itemOpts;
  }
  newObject.options = cleanOpts(newObject.options);
  newObject.text.forEach((item) => item.options = cleanOpts(item.options || {}));
  createHyperlinkRels(target, newObject.text || "");
  target._slideObjects.push(newObject);
}
function addPlaceholdersToSlideLayouts(slide2) {
  (slide2._slideLayout._slideObjects || []).forEach((slideLayoutObj) => {
    if (slideLayoutObj._type === SLIDE_OBJECT_TYPES.placeholder) {
      if (slide2._slideObjects.filter((slideObj) => slideObj.options && slideObj.options.placeholder === slideLayoutObj.options.placeholder).length === 0) {
        addTextDefinition(slide2, [{ text: "" }], slideLayoutObj.options, false);
      }
    }
  });
}
function addBackgroundDefinition(props, target) {
  var _a;
  if (target.bkgd) {
    if (!target.background)
      target.background = {};
    if (typeof target.bkgd === "string")
      target.background.color = target.bkgd;
    else {
      if (target.bkgd.data)
        target.background.data = target.bkgd.data;
      if (target.bkgd.path)
        target.background.path = target.bkgd.path;
      if (target.bkgd.src)
        target.background.path = target.bkgd.src;
    }
  }
  if ((_a = target.background) === null || _a === void 0 ? void 0 : _a.fill)
    target.background.color = target.background.fill;
  if (props && (props.path || props.data)) {
    props.path = props.path || "preencoded.png";
    let strImgExtn = (props.path.split(".").pop() || "png").split("?")[0];
    if (strImgExtn === "jpg")
      strImgExtn = "jpeg";
    target._relsMedia = target._relsMedia || [];
    const intRels = target._relsMedia.length + 1;
    target._relsMedia.push({
      path: props.path,
      type: SLIDE_OBJECT_TYPES.image,
      extn: strImgExtn,
      data: props.data || null,
      rId: intRels,
      Target: `../media/${(target._name || "").replace(/\s+/gi, "-")}-image-${target._relsMedia.length + 1}.${strImgExtn}`
    });
    target._bkgdImgRid = intRels;
  }
}
function createHyperlinkRels(target, text2, options) {
  let textObjs = [];
  if (typeof text2 === "string" || typeof text2 === "number")
    return;
  else if (Array.isArray(text2))
    textObjs = text2;
  else if (typeof text2 === "object")
    textObjs = [text2];
  textObjs.forEach((text3, idx) => {
    if (options && options[idx] && options[idx].hyperlink)
      text3.options = Object.assign(Object.assign({}, text3.options), options[idx]);
    if (Array.isArray(text3)) {
      const cellOpts = [];
      text3.forEach((tablecell) => {
        if (tablecell.options && !tablecell.text.options) {
          cellOpts.push(tablecell.options);
        }
      });
      createHyperlinkRels(target, text3, cellOpts);
    } else if (Array.isArray(text3.text)) {
      createHyperlinkRels(target, text3.text, options && options[idx] ? [options[idx]] : void 0);
    } else if (text3 && typeof text3 === "object" && text3.options && text3.options.hyperlink && !text3.options.hyperlink._rId) {
      if (typeof text3.options.hyperlink !== "object") {
        console.log("ERROR: text `hyperlink` option should be an object. Ex: `hyperlink: {url:'https://github.com'}` ");
      } else if (!text3.options.hyperlink.url && !text3.options.hyperlink.slide) {
        console.log("ERROR: 'hyperlink requires either: `url` or `slide`'");
      } else {
        const relId = getNewRelId(target);
        target._rels.push({
          type: SLIDE_OBJECT_TYPES.hyperlink,
          data: text3.options.hyperlink.slide ? "slide" : "dummy",
          rId: relId,
          Target: encodeXmlEntities(text3.options.hyperlink.url) || text3.options.hyperlink.slide.toString()
        });
        text3.options.hyperlink._rId = relId;
      }
    } else if (text3 && typeof text3 === "object" && text3.options && text3.options.hyperlink && text3.options.hyperlink._rId) {
      if (target._rels.filter((rel) => rel.rId === text3.options.hyperlink._rId).length === 0) {
        target._rels.push({
          type: SLIDE_OBJECT_TYPES.hyperlink,
          data: text3.options.hyperlink.slide ? "slide" : "dummy",
          rId: text3.options.hyperlink._rId,
          Target: encodeXmlEntities(text3.options.hyperlink.url) || text3.options.hyperlink.slide.toString()
        });
      }
    }
  });
}
var Slide = class {
  constructor(params) {
    var _a;
    this.addSlide = params.addSlide;
    this.getSlide = params.getSlide;
    this._name = `Slide ${params.slideNumber}`;
    this._presLayout = params.presLayout;
    this._rId = params.slideRId;
    this._rels = [];
    this._relsChart = [];
    this._relsMedia = [];
    this._setSlideNum = params.setSlideNum;
    this._slideId = params.slideId;
    this._slideLayout = params.slideLayout || null;
    this._slideNum = params.slideNumber;
    this._slideObjects = [];
    this._slideNumberProps = ((_a = this._slideLayout) === null || _a === void 0 ? void 0 : _a._slideNumberProps) ? this._slideLayout._slideNumberProps : null;
  }
  set bkgd(value) {
    this._bkgd = value;
    if (!this._background || !this._background.color) {
      if (!this._background)
        this._background = {};
      if (typeof value === "string")
        this._background.color = value;
    }
  }
  get bkgd() {
    return this._bkgd;
  }
  set background(props) {
    this._background = props;
    if (props)
      addBackgroundDefinition(props, this);
  }
  get background() {
    return this._background;
  }
  set color(value) {
    this._color = value;
  }
  get color() {
    return this._color;
  }
  set hidden(value) {
    this._hidden = value;
  }
  get hidden() {
    return this._hidden;
  }
  /**
   * @type {SlideNumberProps}
   */
  set slideNumber(value) {
    this._slideNumberProps = value;
    this._setSlideNum(value);
  }
  get slideNumber() {
    return this._slideNumberProps;
  }
  get newAutoPagedSlides() {
    return this._newAutoPagedSlides;
  }
  /**
   * Add chart to Slide
   * @param {CHART_NAME|IChartMulti[]} type - chart type
   * @param {object[]} data - data object
   * @param {IChartOpts} options - chart options
   * @return {Slide} this Slide
   */
  addChart(type, data, options) {
    const optionsWithType = options || {};
    optionsWithType._type = type;
    addChartDefinition(this, type, data, options);
    return this;
  }
  /**
   * Add image to Slide
   * @param {ImageProps} options - image options
   * @return {Slide} this Slide
   */
  addImage(options) {
    addImageDefinition(this, options);
    return this;
  }
  /**
   * Add media (audio/video) to Slide
   * @param {MediaProps} options - media options
   * @return {Slide} this Slide
   */
  addMedia(options) {
    addMediaDefinition(this, options);
    return this;
  }
  /**
   * Add speaker notes to Slide
   * @docs https://gitbrent.github.io/PptxGenJS/docs/speaker-notes.html
   * @param {string} notes - notes to add to slide
   * @return {Slide} this Slide
   */
  addNotes(notes) {
    addNotesDefinition(this, notes);
    return this;
  }
  /**
   * Add shape to Slide
   * @param {SHAPE_NAME} shapeName - shape name
   * @param {ShapeProps} options - shape options
   * @return {Slide} this Slide
   */
  addShape(shapeName, options) {
    addShapeDefinition(this, shapeName, options);
    return this;
  }
  /**
   * Add table to Slide
   * @param {TableRow[]} tableRows - table rows
   * @param {TableProps} options - table options
   * @return {Slide} this Slide
   */
  addTable(tableRows, options) {
    this._newAutoPagedSlides = addTableDefinition(this, tableRows, options, this._slideLayout, this._presLayout, this.addSlide, this.getSlide);
    return this;
  }
  /**
   * Add text to Slide
   * @param {string|TextProps[]} text - text string or complex object
   * @param {TextPropsOptions} options - text options
   * @return {Slide} this Slide
   */
  addText(text2, options) {
    const textParam = typeof text2 === "string" || typeof text2 === "number" ? [{ text: text2, options }] : text2;
    addTextDefinition(this, textParam, options, false);
    return this;
  }
};
function createExcelWorksheet(chartObject, zip) {
  return __awaiter(this, void 0, void 0, function* () {
    const data = chartObject.data;
    return yield new Promise((resolve, reject) => {
      var _a, _b;
      const zipExcel = new import_jszip.default();
      const intBubbleCols = (data.length - 1) * 2 + 1;
      const IS_MULTI_CAT_AXES = ((_b = (_a = data[0]) === null || _a === void 0 ? void 0 : _a.labels) === null || _b === void 0 ? void 0 : _b.length) > 1;
      zipExcel.folder("_rels");
      zipExcel.folder("docProps");
      zipExcel.folder("xl/_rels");
      zipExcel.folder("xl/tables");
      zipExcel.folder("xl/theme");
      zipExcel.folder("xl/worksheets");
      zipExcel.folder("xl/worksheets/_rels");
      {
        zipExcel.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>  <Default Extension="xml" ContentType="application/xml"/>  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>  <Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>  <Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>\n');
        zipExcel.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>\n');
        zipExcel.file("docProps/app.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Macintosh Excel</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>Sheet1</vt:lpstr></vt:vector></TitlesOfParts><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion></Properties>\n');
        zipExcel.file("docProps/core.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>PptxGenJS</dc:creator><cp:lastModifiedBy>PptxGenJS</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">' + (/* @__PURE__ */ new Date()).toISOString() + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + (/* @__PURE__ */ new Date()).toISOString() + "</dcterms:modified></cp:coreProperties>");
        zipExcel.file("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>');
        zipExcel.file("xl/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="0" formatCode="General"/></numFmts><fonts count="4"><font><sz val="9"/><color indexed="8"/><name val="Geneva"/></font><font><sz val="9"/><color indexed="8"/><name val="Geneva"/></font><font><sz val="10"/><color indexed="8"/><name val="Geneva"/></font><font><sz val="18"/><color indexed="8"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><dxfs count="0"/><tableStyles count="0"/><colors><indexedColors><rgbColor rgb="ff000000"/><rgbColor rgb="ffffffff"/><rgbColor rgb="ffff0000"/><rgbColor rgb="ff00ff00"/><rgbColor rgb="ff0000ff"/><rgbColor rgb="ffffff00"/><rgbColor rgb="ffff00ff"/><rgbColor rgb="ff00ffff"/><rgbColor rgb="ff000000"/><rgbColor rgb="ffffffff"/><rgbColor rgb="ff878787"/><rgbColor rgb="fff9f9f9"/></indexedColors></colors></styleSheet>\n');
        zipExcel.file("xl/theme/theme1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light" panose="020F0302020204030204"/><a:ea typeface=""/><a:cs typeface=""/><a:font script="Jpan" typeface="Yu Gothic Light"/><a:font script="Hang" typeface="\uB9D1\uC740 \uACE0\uB515"/><a:font script="Hans" typeface="DengXian Light"/><a:font script="Hant" typeface="\u65B0\u7D30\u660E\u9AD4"/><a:font script="Arab" typeface="Times New Roman"/><a:font script="Hebr" typeface="Times New Roman"/><a:font script="Thai" typeface="Tahoma"/><a:font script="Ethi" typeface="Nyala"/><a:font script="Beng" typeface="Vrinda"/><a:font script="Gujr" typeface="Shruti"/><a:font script="Khmr" typeface="MoolBoran"/><a:font script="Knda" typeface="Tunga"/><a:font script="Guru" typeface="Raavi"/><a:font script="Cans" typeface="Euphemia"/><a:font script="Cher" typeface="Plantagenet Cherokee"/><a:font script="Yiii" typeface="Microsoft Yi Baiti"/><a:font script="Tibt" typeface="Microsoft Himalaya"/><a:font script="Thaa" typeface="MV Boli"/><a:font script="Deva" typeface="Mangal"/><a:font script="Telu" typeface="Gautami"/><a:font script="Taml" typeface="Latha"/><a:font script="Syrc" typeface="Estrangelo Edessa"/><a:font script="Orya" typeface="Kalinga"/><a:font script="Mlym" typeface="Kartika"/><a:font script="Laoo" typeface="DokChampa"/><a:font script="Sinh" typeface="Iskoola Pota"/><a:font script="Mong" typeface="Mongolian Baiti"/><a:font script="Viet" typeface="Times New Roman"/><a:font script="Uigh" typeface="Microsoft Uighur"/><a:font script="Geor" typeface="Sylfaen"/></a:majorFont><a:minorFont><a:latin typeface="Calibri" panose="020F0502020204030204"/><a:ea typeface=""/><a:cs typeface=""/><a:font script="Jpan" typeface="Yu Gothic"/><a:font script="Hang" typeface="\uB9D1\uC740 \uACE0\uB515"/><a:font script="Hans" typeface="DengXian"/><a:font script="Hant" typeface="\u65B0\u7D30\u660E\u9AD4"/><a:font script="Arab" typeface="Arial"/><a:font script="Hebr" typeface="Arial"/><a:font script="Thai" typeface="Tahoma"/><a:font script="Ethi" typeface="Nyala"/><a:font script="Beng" typeface="Vrinda"/><a:font script="Gujr" typeface="Shruti"/><a:font script="Khmr" typeface="DaunPenh"/><a:font script="Knda" typeface="Tunga"/><a:font script="Guru" typeface="Raavi"/><a:font script="Cans" typeface="Euphemia"/><a:font script="Cher" typeface="Plantagenet Cherokee"/><a:font script="Yiii" typeface="Microsoft Yi Baiti"/><a:font script="Tibt" typeface="Microsoft Himalaya"/><a:font script="Thaa" typeface="MV Boli"/><a:font script="Deva" typeface="Mangal"/><a:font script="Telu" typeface="Gautami"/><a:font script="Taml" typeface="Latha"/><a:font script="Syrc" typeface="Estrangelo Edessa"/><a:font script="Orya" typeface="Kalinga"/><a:font script="Mlym" typeface="Kartika"/><a:font script="Laoo" typeface="DokChampa"/><a:font script="Sinh" typeface="Iskoola Pota"/><a:font script="Mong" typeface="Mongolian Baiti"/><a:font script="Viet" typeface="Arial"/><a:font script="Uigh" typeface="Microsoft Uighur"/><a:font script="Geor" typeface="Sylfaen"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:satMod val="103000"/><a:lumMod val="102000"/><a:tint val="94000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:satMod val="110000"/><a:lumMod val="100000"/><a:shade val="100000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="63000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/><a:extLst><a:ext uri="{05A4C25C-085E-4340-85A3-A5531E510DB2}"><thm15:themeFamily xmlns:thm15="http://schemas.microsoft.com/office/thememl/2012/main" name="Office Theme" id="{62F939B6-93AF-4DB8-9C6B-D6C7DFDC589F}" vid="{4A3C46E8-61CC-4603-A589-7422A47A8E4A}"/></a:ext></a:extLst></a:theme>');
        zipExcel.file("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x15" xmlns:x15="http://schemas.microsoft.com/office/spreadsheetml/2010/11/main"><fileVersion appName="xl" lastEdited="7" lowestEdited="6" rupBuild="10507"/><workbookPr/><bookViews><workbookView xWindow="0" yWindow="500" windowWidth="20960" windowHeight="15960"/></bookViews><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="0" concurrentCalc="0"/></workbook>\n');
        zipExcel.file("xl/worksheets/_rels/sheet1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/></Relationships>\n');
      }
      {
        let strSharedStrings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        if (chartObject.opts._type === CHART_TYPE.BUBBLE || chartObject.opts._type === CHART_TYPE.BUBBLE3D) {
          strSharedStrings += `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${intBubbleCols}" uniqueCount="${intBubbleCols}">`;
        } else if (chartObject.opts._type === CHART_TYPE.SCATTER) {
          strSharedStrings += `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${data.length}" uniqueCount="${data.length}">`;
        } else if (IS_MULTI_CAT_AXES) {
          let totCount = data.length;
          data[0].labels.forEach((arrLabel) => totCount += arrLabel.filter((label) => label && label !== "").length);
          strSharedStrings += `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${totCount}" uniqueCount="${totCount}">`;
          strSharedStrings += "<si><t/></si>";
        } else {
          const totCount = data.length + data[0].labels.length * data[0].labels[0].length + data[0].labels.length;
          const unqCount = data.length + data[0].labels.length * data[0].labels[0].length + 1;
          strSharedStrings += `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${totCount}" uniqueCount="${unqCount}">`;
          strSharedStrings += '<si><t xml:space="preserve"></t></si>';
        }
        if (chartObject.opts._type === CHART_TYPE.BUBBLE || chartObject.opts._type === CHART_TYPE.BUBBLE3D) {
          data.forEach((objData, idx) => {
            if (idx === 0)
              strSharedStrings += "<si><t>X-Axis</t></si>";
            else {
              strSharedStrings += `<si><t>${encodeXmlEntities(objData.name || `Y-Axis${idx}`)}</t></si>`;
              strSharedStrings += `<si><t>${encodeXmlEntities(`Size${idx}`)}</t></si>`;
            }
          });
        } else {
          data.forEach((objData) => {
            strSharedStrings += `<si><t>${encodeXmlEntities((objData.name || " ").replace("X-Axis", "X-Values"))}</t></si>`;
          });
        }
        if (chartObject.opts._type !== CHART_TYPE.BUBBLE && chartObject.opts._type !== CHART_TYPE.BUBBLE3D && chartObject.opts._type !== CHART_TYPE.SCATTER) {
          data[0].labels.slice().reverse().forEach((labelsGroup) => {
            labelsGroup.filter((label) => label && label !== "").forEach((label) => {
              strSharedStrings += `<si><t>${encodeXmlEntities(label)}</t></si>`;
            });
          });
        }
        strSharedStrings += "</sst>\n";
        zipExcel.file("xl/sharedStrings.xml", strSharedStrings);
      }
      {
        let strTableXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        if (chartObject.opts._type === CHART_TYPE.BUBBLE || chartObject.opts._type === CHART_TYPE.BUBBLE3D) {
          strTableXml += `<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="1" name="Table1" displayName="Table1" ref="A1:${getExcelColName(intBubbleCols)}${intBubbleCols}" totalsRowShown="0">`;
          strTableXml += `<tableColumns count="${intBubbleCols}">`;
          let idxColLtr = 1;
          data.forEach((obj, idx) => {
            if (idx === 0) {
              strTableXml += `<tableColumn id="${idx + 1}" name="X-Values"/>`;
            } else {
              strTableXml += `<tableColumn id="${idx + idxColLtr}" name="${obj.name}"/>`;
              idxColLtr++;
              strTableXml += `<tableColumn id="${idx + idxColLtr}" name="Size${idx}"/>`;
            }
          });
        } else if (chartObject.opts._type === CHART_TYPE.SCATTER) {
          strTableXml += `<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="1" name="Table1" displayName="Table1" ref="A1:${getExcelColName(data.length)}${data[0].values.length + 1}" totalsRowShown="0">`;
          strTableXml += `<tableColumns count="${data.length}">`;
          data.forEach((_obj, idx) => {
            strTableXml += `<tableColumn id="${idx + 1}" name="${idx === 0 ? "X-Values" : "Y-Value "}${idx}"/>`;
          });
        } else {
          strTableXml += `<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="1" name="Table1" displayName="Table1" ref="A1:${getExcelColName(data.length + data[0].labels.length)}${data[0].labels[0].length + 1}'" totalsRowShown="0">`;
          strTableXml += `<tableColumns count="${data.length + data[0].labels.length}">`;
          data[0].labels.forEach((_labelsGroup, idx) => {
            strTableXml += `<tableColumn id="${idx + 1}" name="Column${idx + 1}"/>`;
          });
          data.forEach((obj, idx) => {
            strTableXml += `<tableColumn id="${idx + data[0].labels.length + 1}" name="${encodeXmlEntities(obj.name)}"/>`;
          });
        }
        strTableXml += "</tableColumns>";
        strTableXml += '<tableStyleInfo showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/>';
        strTableXml += "</table>";
        zipExcel.file("xl/tables/table1.xml", strTableXml);
      }
      {
        let strSheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        strSheetXml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">';
        if (chartObject.opts._type === CHART_TYPE.BUBBLE || chartObject.opts._type === CHART_TYPE.BUBBLE3D) {
          strSheetXml += `<dimension ref="A1:${getExcelColName(intBubbleCols)}${data[0].values.length + 1}"/>`;
        } else if (chartObject.opts._type === CHART_TYPE.SCATTER) {
          strSheetXml += `<dimension ref="A1:${getExcelColName(data.length)}${data[0].values.length + 1}"/>`;
        } else {
          strSheetXml += `<dimension ref="A1:${getExcelColName(data.length + 1)}${data[0].values.length + 1}"/>`;
        }
        strSheetXml += '<sheetViews><sheetView tabSelected="1" workbookViewId="0"><selection activeCell="B1" sqref="B1"/></sheetView></sheetViews>';
        strSheetXml += '<sheetFormatPr baseColWidth="10" defaultRowHeight="16"/>';
        if (chartObject.opts._type === CHART_TYPE.BUBBLE || chartObject.opts._type === CHART_TYPE.BUBBLE3D) {
          strSheetXml += "<sheetData>";
          strSheetXml += `<row r="1" spans="1:${intBubbleCols}">`;
          strSheetXml += '<c r="A1" t="s"><v>0</v></c>';
          for (let idx = 1; idx < intBubbleCols; idx++) {
            strSheetXml += `<c r="${getExcelColName(idx + 1)}1" t="s"><v>${idx}</v></c>`;
          }
          strSheetXml += "</row>";
          data[0].values.forEach((val, idx) => {
            strSheetXml += `<row r="${idx + 2}" spans="1:${intBubbleCols}">`;
            strSheetXml += `<c r="A${idx + 2}"><v>${val}</v></c>`;
            let idxColLtr = 2;
            for (let idy = 1; idy < data.length; idy++) {
              strSheetXml += `<c r="${getExcelColName(idxColLtr)}${idx + 2}"><v>${data[idy].values[idx] || ""}</v></c>`;
              idxColLtr++;
              strSheetXml += `<c r="${getExcelColName(idxColLtr)}${idx + 2}"><v>${data[idy].sizes[idx] || ""}</v></c>`;
              idxColLtr++;
            }
            strSheetXml += "</row>";
          });
        } else if (chartObject.opts._type === CHART_TYPE.SCATTER) {
          strSheetXml += "<sheetData>";
          strSheetXml += `<row r="1" spans="1:${data.length}">`;
          for (let idx = 0; idx < data.length; idx++) {
            strSheetXml += `<c r="${getExcelColName(idx + 1)}1" t="s"><v>${idx}</v></c>`;
          }
          strSheetXml += "</row>";
          data[0].values.forEach((val, idx) => {
            strSheetXml += `<row r="${idx + 2}" spans="1:${data.length}">`;
            strSheetXml += `<c r="A${idx + 2}"><v>${val}</v></c>`;
            for (let idy = 1; idy < data.length; idy++) {
              strSheetXml += `<c r="${getExcelColName(idy + 1)}${idx + 2}"><v>${data[idy].values[idx] || data[idy].values[idx] === 0 ? data[idy].values[idx] : ""}</v></c>`;
            }
            strSheetXml += "</row>";
          });
        } else {
          strSheetXml += "<sheetData>";
          if (!IS_MULTI_CAT_AXES) {
            strSheetXml += `<row r="1" spans="1:${data.length + data[0].labels.length}">`;
            data[0].labels.forEach((_labelsGroup, idx) => {
              strSheetXml += `<c r="${getExcelColName(idx + 1)}1" t="s"><v>0</v></c>`;
            });
            for (let idx = 0; idx < data.length; idx++) {
              strSheetXml += `<c r="${getExcelColName(idx + 1 + data[0].labels.length)}1" t="s"><v>${idx + 1}</v></c>`;
            }
            strSheetXml += "</row>";
            data[0].labels[0].forEach((_cat, idx) => {
              strSheetXml += `<row r="${idx + 2}" spans="1:${data.length + data[0].labels.length}">`;
              for (let idx2 = data[0].labels.length - 1; idx2 >= 0; idx2--) {
                strSheetXml += `<c r="${getExcelColName(data[0].labels.length - idx2)}${idx + 2}" t="s">`;
                strSheetXml += `<v>${data.length + idx + 1}</v>`;
                strSheetXml += "</c>";
              }
              for (let idy = 0; idy < data.length; idy++) {
                strSheetXml += `<c r="${getExcelColName(data[0].labels.length + idy + 1)}${idx + 2}"><v>${data[idy].values[idx] || ""}</v></c>`;
              }
              strSheetXml += "</row>";
            });
          } else {
            strSheetXml += `<row r="1" spans="1:${data.length + data[0].labels.length}">`;
            for (let idx = 0; idx < data[0].labels.length; idx++) {
              strSheetXml += `<c r="${getExcelColName(idx + 1)}1" t="s"><v>0</v></c>`;
            }
            for (let idx = data[0].labels.length - 1; idx < data.length + data[0].labels.length - 1; idx++) {
              strSheetXml += `<c r="${getExcelColName(idx + data[0].labels.length)}1" t="s"><v>${idx}</v></c>`;
            }
            strSheetXml += "</row>";
            const TOT_SER = data.length;
            const TOT_CAT = data[0].labels[0].length;
            const TOT_LVL = data[0].labels.length;
            for (let idx = 0; idx < TOT_CAT; idx++) {
              strSheetXml += `<row r="${idx + 2}" spans="1:${TOT_SER + TOT_LVL}">`;
              let totLabels = TOT_SER;
              const revLabelGroups = data[0].labels.slice().reverse();
              revLabelGroups.forEach((labelsGroup, idy) => {
                const colLabel = labelsGroup[idx];
                if (colLabel) {
                  const totGrpLbls = idy === 0 ? 1 : revLabelGroups[idy - 1].filter((label) => label && label !== "").length;
                  totLabels += totGrpLbls;
                  strSheetXml += `<c r="${getExcelColName(idx + 1 + idy)}${idx + 2}" t="s"><v>${totLabels}</v></c>`;
                }
              });
              for (let idy = 0; idy < TOT_SER; idy++) {
                strSheetXml += `<c r="${getExcelColName(TOT_LVL + idy + 1)}${idx + 2}"><v>${data[idy].values[idx] || 0}</v></c>`;
              }
              strSheetXml += "</row>";
            }
          }
        }
        strSheetXml += "</sheetData>";
        strSheetXml += '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>';
        strSheetXml += "</worksheet>\n";
        zipExcel.file("xl/worksheets/sheet1.xml", strSheetXml);
      }
      zipExcel.generateAsync({ type: "base64" }).then((content) => {
        zip.file(`ppt/embeddings/Microsoft_Excel_Worksheet${chartObject.globalId}.xlsx`, content, { base64: true });
        zip.file("ppt/charts/_rels/" + chartObject.fileName + ".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="../embeddings/Microsoft_Excel_Worksheet${chartObject.globalId}.xlsx"/></Relationships>`);
        zip.file(`ppt/charts/${chartObject.fileName}`, makeXmlCharts(chartObject));
        resolve("");
      }).catch((strErr) => {
        reject(strErr);
      });
    });
  });
}
function makeXmlCharts(rel) {
  var _a, _b, _c, _d;
  let strXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  let usesSecondaryValAxis = false;
  {
    strXml += '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
    strXml += '<c:date1904 val="0"/>';
    strXml += `<c:roundedCorners val="${rel.opts.chartArea.roundedCorners ? "1" : "0"}"/>`;
    strXml += "<c:chart>";
    if (rel.opts.showTitle) {
      strXml += genXmlTitle({
        title: rel.opts.title || "Chart Title",
        color: rel.opts.titleColor,
        fontFace: rel.opts.titleFontFace,
        fontSize: rel.opts.titleFontSize || DEF_FONT_TITLE_SIZE,
        titleAlign: rel.opts.titleAlign,
        titleBold: rel.opts.titleBold,
        titlePos: rel.opts.titlePos,
        titleRotate: rel.opts.titleRotate
      }, rel.opts.x, rel.opts.y);
      strXml += '<c:autoTitleDeleted val="0"/>';
    } else {
      strXml += '<c:autoTitleDeleted val="1"/>';
    }
    if (rel.opts._type === CHART_TYPE.BAR3D) {
      strXml += `<c:view3D><c:rotX val="${rel.opts.v3DRotX}"/><c:rotY val="${rel.opts.v3DRotY}"/><c:rAngAx val="${!rel.opts.v3DRAngAx ? 0 : 1}"/><c:perspective val="${rel.opts.v3DPerspective}"/></c:view3D>`;
    }
    strXml += "<c:plotArea>";
    if (rel.opts.layout) {
      strXml += "<c:layout>";
      strXml += " <c:manualLayout>";
      strXml += '  <c:layoutTarget val="inner" />';
      strXml += '  <c:xMode val="edge" />';
      strXml += '  <c:yMode val="edge" />';
      strXml += '  <c:x val="' + (rel.opts.layout.x || 0) + '" />';
      strXml += '  <c:y val="' + (rel.opts.layout.y || 0) + '" />';
      strXml += '  <c:w val="' + (rel.opts.layout.w || 1) + '" />';
      strXml += '  <c:h val="' + (rel.opts.layout.h || 1) + '" />';
      strXml += " </c:manualLayout>";
      strXml += "</c:layout>";
    } else {
      strXml += "<c:layout/>";
    }
  }
  if (Array.isArray(rel.opts._type)) {
    rel.opts._type.forEach((type) => {
      const options = Object.assign(Object.assign({}, rel.opts), type.options);
      const valAxisId = options.secondaryValAxis ? AXIS_ID_VALUE_SECONDARY : AXIS_ID_VALUE_PRIMARY;
      const catAxisId = options.secondaryCatAxis ? AXIS_ID_CATEGORY_SECONDARY : AXIS_ID_CATEGORY_PRIMARY;
      usesSecondaryValAxis = usesSecondaryValAxis || options.secondaryValAxis;
      strXml += makeChartType(type.type, type.data, options, valAxisId, catAxisId);
    });
  } else {
    strXml += makeChartType(rel.opts._type, rel.data, rel.opts, AXIS_ID_VALUE_PRIMARY, AXIS_ID_CATEGORY_PRIMARY);
  }
  if (rel.opts._type !== CHART_TYPE.PIE && rel.opts._type !== CHART_TYPE.DOUGHNUT) {
    if (rel.opts.valAxes && rel.opts.valAxes.length > 1 && !usesSecondaryValAxis) {
      throw new Error("Secondary axis must be used by one of the multiple charts");
    }
    if (rel.opts.catAxes) {
      if (!rel.opts.valAxes || rel.opts.valAxes.length !== rel.opts.catAxes.length) {
        throw new Error("There must be the same number of value and category axes.");
      }
      strXml += makeCatAxis(Object.assign(Object.assign({}, rel.opts), rel.opts.catAxes[0]), AXIS_ID_CATEGORY_PRIMARY, AXIS_ID_VALUE_PRIMARY);
    } else {
      strXml += makeCatAxis(rel.opts, AXIS_ID_CATEGORY_PRIMARY, AXIS_ID_VALUE_PRIMARY);
    }
    if (rel.opts.valAxes) {
      strXml += makeValAxis(Object.assign(Object.assign({}, rel.opts), rel.opts.valAxes[0]), AXIS_ID_VALUE_PRIMARY);
      if (rel.opts.valAxes[1]) {
        strXml += makeValAxis(Object.assign(Object.assign({}, rel.opts), rel.opts.valAxes[1]), AXIS_ID_VALUE_SECONDARY);
      }
    } else {
      strXml += makeValAxis(rel.opts, AXIS_ID_VALUE_PRIMARY);
      if (rel.opts._type === CHART_TYPE.BAR3D) {
        strXml += makeSerAxis(rel.opts, AXIS_ID_SERIES_PRIMARY, AXIS_ID_VALUE_PRIMARY);
      }
    }
    if (((_a = rel.opts) === null || _a === void 0 ? void 0 : _a.catAxes) && ((_b = rel.opts) === null || _b === void 0 ? void 0 : _b.catAxes[1])) {
      strXml += makeCatAxis(Object.assign(Object.assign({}, rel.opts), rel.opts.catAxes[1]), AXIS_ID_CATEGORY_SECONDARY, AXIS_ID_VALUE_SECONDARY);
    }
  }
  {
    if (rel.opts.showDataTable) {
      strXml += "<c:dTable>";
      strXml += `  <c:showHorzBorder val="${!rel.opts.showDataTableHorzBorder ? 0 : 1}"/>`;
      strXml += `  <c:showVertBorder val="${!rel.opts.showDataTableVertBorder ? 0 : 1}"/>`;
      strXml += `  <c:showOutline    val="${!rel.opts.showDataTableOutline ? 0 : 1}"/>`;
      strXml += `  <c:showKeys       val="${!rel.opts.showDataTableKeys ? 0 : 1}"/>`;
      strXml += "  <c:spPr>";
      strXml += "    <a:noFill/>";
      strXml += '    <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1"><a:lumMod val="15000"/><a:lumOff val="85000"/></a:schemeClr></a:solidFill><a:round/></a:ln>';
      strXml += "    <a:effectLst/>";
      strXml += "  </c:spPr>";
      strXml += "  <c:txPr>";
      strXml += '   <a:bodyPr rot="0" spcFirstLastPara="1" vertOverflow="ellipsis" vert="horz" wrap="square" anchor="ctr" anchorCtr="1"/>';
      strXml += "   <a:lstStyle/>";
      strXml += "   <a:p>";
      strXml += '     <a:pPr rtl="0">';
      strXml += `       <a:defRPr sz="${Math.round((rel.opts.dataTableFontSize || DEF_FONT_SIZE) * 100)}" b="0" i="0" u="none" strike="noStrike" kern="1200" baseline="0">`;
      strXml += '         <a:solidFill><a:schemeClr val="tx1"><a:lumMod val="65000"/><a:lumOff val="35000"/></a:schemeClr></a:solidFill>';
      strXml += '         <a:latin typeface="+mn-lt"/>';
      strXml += '         <a:ea typeface="+mn-ea"/>';
      strXml += '         <a:cs typeface="+mn-cs"/>';
      strXml += "       </a:defRPr>";
      strXml += "     </a:pPr>";
      strXml += '    <a:endParaRPr lang="en-US"/>';
      strXml += "   </a:p>";
      strXml += " </c:txPr>";
      strXml += "</c:dTable>";
    }
    strXml += "  <c:spPr>";
    strXml += ((_c = rel.opts.plotArea.fill) === null || _c === void 0 ? void 0 : _c.color) ? genXmlColorSelection(rel.opts.plotArea.fill) : "<a:noFill/>";
    strXml += rel.opts.plotArea.border ? `<a:ln w="${valToPts(rel.opts.plotArea.border.pt)}" cap="flat">${genXmlColorSelection(rel.opts.plotArea.border.color)}</a:ln>` : "<a:ln><a:noFill/></a:ln>";
    strXml += "    <a:effectLst/>";
    strXml += "  </c:spPr>";
    strXml += "</c:plotArea>";
    if (rel.opts.showLegend) {
      strXml += "<c:legend>";
      strXml += '<c:legendPos val="' + rel.opts.legendPos + '"/>';
      strXml += '<c:overlay val="0"/>';
      if (rel.opts.legendFontFace || rel.opts.legendFontSize || rel.opts.legendColor) {
        strXml += "<c:txPr>";
        strXml += "  <a:bodyPr/>";
        strXml += "  <a:lstStyle/>";
        strXml += "  <a:p>";
        strXml += "    <a:pPr>";
        strXml += rel.opts.legendFontSize ? `<a:defRPr sz="${Math.round(Number(rel.opts.legendFontSize) * 100)}">` : "<a:defRPr>";
        if (rel.opts.legendColor)
          strXml += genXmlColorSelection(rel.opts.legendColor);
        if (rel.opts.legendFontFace)
          strXml += '<a:latin typeface="' + rel.opts.legendFontFace + '"/>';
        if (rel.opts.legendFontFace)
          strXml += '<a:cs    typeface="' + rel.opts.legendFontFace + '"/>';
        strXml += "      </a:defRPr>";
        strXml += "    </a:pPr>";
        strXml += '    <a:endParaRPr lang="en-US"/>';
        strXml += "  </a:p>";
        strXml += "</c:txPr>";
      }
      strXml += "</c:legend>";
    }
  }
  strXml += '  <c:plotVisOnly val="1"/>';
  strXml += '  <c:dispBlanksAs val="' + rel.opts.displayBlanksAs + '"/>';
  if (rel.opts._type === CHART_TYPE.SCATTER)
    strXml += '<c:showDLblsOverMax val="1"/>';
  strXml += "</c:chart>";
  strXml += "<c:spPr>";
  strXml += ((_d = rel.opts.chartArea.fill) === null || _d === void 0 ? void 0 : _d.color) ? genXmlColorSelection(rel.opts.chartArea.fill) : "<a:noFill/>";
  strXml += rel.opts.chartArea.border ? `<a:ln w="${valToPts(rel.opts.chartArea.border.pt)}" cap="flat">${genXmlColorSelection(rel.opts.chartArea.border.color)}</a:ln>` : "<a:ln><a:noFill/></a:ln>";
  strXml += "  <a:effectLst/>";
  strXml += "</c:spPr>";
  strXml += '<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData>';
  strXml += "</c:chartSpace>";
  return strXml;
}
function makeChartType(chartType, data, opts, valAxisId, catAxisId, isMultiTypeChart) {
  let colorIndex = -1;
  let idxColLtr = 1;
  let optsChartData = null;
  let strXml = "";
  switch (chartType) {
    case CHART_TYPE.AREA:
    case CHART_TYPE.BAR:
    case CHART_TYPE.BAR3D:
    case CHART_TYPE.LINE:
    case CHART_TYPE.RADAR:
      strXml += `<c:${chartType}Chart>`;
      if (chartType === CHART_TYPE.AREA && opts.barGrouping === "stacked") {
        strXml += '<c:grouping val="' + opts.barGrouping + '"/>';
      }
      if (chartType === CHART_TYPE.BAR || chartType === CHART_TYPE.BAR3D) {
        strXml += '<c:barDir val="' + opts.barDir + '"/>';
        strXml += '<c:grouping val="' + (opts.barGrouping || "clustered") + '"/>';
      }
      if (chartType === CHART_TYPE.RADAR) {
        strXml += '<c:radarStyle val="' + opts.radarStyle + '"/>';
      }
      strXml += '<c:varyColors val="0"/>';
      data.forEach((obj) => {
        var _a;
        colorIndex++;
        strXml += "<c:ser>";
        strXml += `  <c:idx val="${obj._dataIndex}"/><c:order val="${obj._dataIndex}"/>`;
        strXml += "  <c:tx>";
        strXml += "    <c:strRef>";
        strXml += "      <c:f>Sheet1!$" + getExcelColName(obj._dataIndex + obj.labels.length + 1) + "$1</c:f>";
        strXml += '      <c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>' + encodeXmlEntities(obj.name) + "</c:v></c:pt></c:strCache>";
        strXml += "    </c:strRef>";
        strXml += "  </c:tx>";
        const seriesColor = opts.chartColors ? opts.chartColors[colorIndex % opts.chartColors.length] : null;
        strXml += "  <c:spPr>";
        if (seriesColor === "transparent") {
          strXml += "<a:noFill/>";
        } else if (opts.chartColorsOpacity) {
          strXml += "<a:solidFill>" + createColorElement(seriesColor, `<a:alpha val="${Math.round(opts.chartColorsOpacity * 1e3)}"/>`) + "</a:solidFill>";
        } else {
          strXml += "<a:solidFill>" + createColorElement(seriesColor) + "</a:solidFill>";
        }
        if (chartType === CHART_TYPE.LINE || chartType === CHART_TYPE.RADAR) {
          if (opts.lineSize === 0) {
            strXml += "<a:ln><a:noFill/></a:ln>";
          } else {
            strXml += `<a:ln w="${valToPts(opts.lineSize)}" cap="${createLineCap(opts.lineCap)}"><a:solidFill>${createColorElement(seriesColor)}</a:solidFill>`;
            strXml += '<a:prstDash val="' + (opts.lineDash || "solid") + '"/><a:round/></a:ln>';
          }
        } else if (opts.dataBorder) {
          strXml += `<a:ln w="${valToPts(opts.dataBorder.pt)}" cap="${createLineCap(opts.lineCap)}"><a:solidFill>${createColorElement(opts.dataBorder.color)}</a:solidFill><a:prstDash val="solid"/><a:round/></a:ln>`;
        }
        strXml += createShadowElement(opts.shadow, DEF_SHAPE_SHADOW);
        strXml += "  </c:spPr>";
        strXml += '  <c:invertIfNegative val="0"/>';
        if (chartType !== CHART_TYPE.RADAR) {
          strXml += "<c:dLbls>";
          strXml += `<c:numFmt formatCode="${encodeXmlEntities(opts.dataLabelFormatCode) || "General"}" sourceLinked="0"/>`;
          if (opts.dataLabelBkgrdColors)
            strXml += `<c:spPr><a:solidFill>${createColorElement(seriesColor)}</a:solidFill></c:spPr>`;
          strXml += "<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr>";
          strXml += `<a:defRPr b="${opts.dataLabelFontBold ? 1 : 0}" i="${opts.dataLabelFontItalic ? 1 : 0}" strike="noStrike" sz="${Math.round((opts.dataLabelFontSize || DEF_FONT_SIZE) * 100)}" u="none">`;
          strXml += `<a:solidFill>${createColorElement(opts.dataLabelColor || DEF_FONT_COLOR)}</a:solidFill>`;
          strXml += `<a:latin typeface="${opts.dataLabelFontFace || "Arial"}"/>`;
          strXml += "</a:defRPr></a:pPr></a:p></c:txPr>";
          if (opts.dataLabelPosition)
            strXml += `<c:dLblPos val="${opts.dataLabelPosition}"/>`;
          strXml += '<c:showLegendKey val="0"/>';
          strXml += `<c:showVal val="${opts.showValue ? "1" : "0"}"/>`;
          strXml += `<c:showCatName val="0"/><c:showSerName val="${opts.showSerName ? "1" : "0"}"/><c:showPercent val="0"/><c:showBubbleSize val="0"/>`;
          strXml += `<c:showLeaderLines val="${opts.showLeaderLines ? "1" : "0"}"/>`;
          strXml += "</c:dLbls>";
        }
        if (chartType === CHART_TYPE.LINE || chartType === CHART_TYPE.RADAR) {
          strXml += "<c:marker>";
          strXml += '  <c:symbol val="' + opts.lineDataSymbol + '"/>';
          if (opts.lineDataSymbolSize)
            strXml += `<c:size val="${opts.lineDataSymbolSize}"/>`;
          strXml += "  <c:spPr>";
          strXml += `    <a:solidFill>${createColorElement(opts.chartColors[obj._dataIndex + 1 > opts.chartColors.length ? Math.floor(Math.random() * opts.chartColors.length) : obj._dataIndex])}</a:solidFill>`;
          strXml += `    <a:ln w="${opts.lineDataSymbolLineSize}" cap="flat"><a:solidFill>${createColorElement(opts.lineDataSymbolLineColor || seriesColor)}</a:solidFill><a:prstDash val="solid"/><a:round/></a:ln>`;
          strXml += "    <a:effectLst/>";
          strXml += "  </c:spPr>";
          strXml += "</c:marker>";
        }
        if ((chartType === CHART_TYPE.BAR || chartType === CHART_TYPE.BAR3D) && data.length === 1 && (opts.chartColors && opts.chartColors !== BARCHART_COLORS && opts.chartColors.length > 1 || ((_a = opts.invertedColors) === null || _a === void 0 ? void 0 : _a.length))) {
          obj.values.forEach((value, index) => {
            const arrColors = value < 0 ? opts.invertedColors || opts.chartColors || BARCHART_COLORS : opts.chartColors || [];
            strXml += "  <c:dPt>";
            strXml += `    <c:idx val="${index}"/>`;
            strXml += '      <c:invertIfNegative val="0"/>';
            strXml += '    <c:bubble3D val="0"/>';
            strXml += "    <c:spPr>";
            if (opts.lineSize === 0) {
              strXml += "<a:ln><a:noFill/></a:ln>";
            } else if (chartType === CHART_TYPE.BAR) {
              strXml += "<a:solidFill>";
              strXml += '  <a:srgbClr val="' + arrColors[index % arrColors.length] + '"/>';
              strXml += "</a:solidFill>";
            } else {
              strXml += "<a:ln>";
              strXml += "  <a:solidFill>";
              strXml += '   <a:srgbClr val="' + arrColors[index % arrColors.length] + '"/>';
              strXml += "  </a:solidFill>";
              strXml += "</a:ln>";
            }
            strXml += createShadowElement(opts.shadow, DEF_SHAPE_SHADOW);
            strXml += "    </c:spPr>";
            strXml += "  </c:dPt>";
          });
        }
        {
          strXml += "<c:cat>";
          if (opts.catLabelFormatCode) {
            strXml += "  <c:numRef>";
            strXml += `    <c:f>Sheet1!$A$2:$A$${obj.labels[0].length + 1}</c:f>`;
            strXml += "    <c:numCache>";
            strXml += "      <c:formatCode>" + (opts.catLabelFormatCode || "General") + "</c:formatCode>";
            strXml += `      <c:ptCount val="${obj.labels[0].length}"/>`;
            obj.labels[0].forEach((label, idx) => strXml += `<c:pt idx="${idx}"><c:v>${encodeXmlEntities(label)}</c:v></c:pt>`);
            strXml += "    </c:numCache>";
            strXml += "  </c:numRef>";
          } else {
            strXml += "  <c:multiLvlStrRef>";
            strXml += `    <c:f>Sheet1!$A$2:$${getExcelColName(obj.labels.length)}$${obj.labels[0].length + 1}</c:f>`;
            strXml += "    <c:multiLvlStrCache>";
            strXml += `      <c:ptCount val="${obj.labels[0].length}"/>`;
            obj.labels.forEach((labelsGroup) => {
              strXml += "<c:lvl>";
              labelsGroup.forEach((label, idx) => strXml += `<c:pt idx="${idx}"><c:v>${encodeXmlEntities(label)}</c:v></c:pt>`);
              strXml += "</c:lvl>";
            });
            strXml += "    </c:multiLvlStrCache>";
            strXml += "  </c:multiLvlStrRef>";
          }
          strXml += "</c:cat>";
        }
        {
          strXml += "<c:val>";
          strXml += "  <c:numRef>";
          strXml += `<c:f>Sheet1!$${getExcelColName(obj._dataIndex + obj.labels.length + 1)}$2:$${getExcelColName(obj._dataIndex + obj.labels.length + 1)}$${obj.labels[0].length + 1}</c:f>`;
          strXml += "    <c:numCache>";
          strXml += "      <c:formatCode>" + (opts.valLabelFormatCode || opts.dataTableFormatCode || "General") + "</c:formatCode>";
          strXml += `      <c:ptCount val="${obj.labels[0].length}"/>`;
          obj.values.forEach((value, idx) => strXml += `<c:pt idx="${idx}"><c:v>${value || value === 0 ? value : ""}</c:v></c:pt>`);
          strXml += "    </c:numCache>";
          strXml += "  </c:numRef>";
          strXml += "</c:val>";
        }
        if (chartType === CHART_TYPE.LINE)
          strXml += '<c:smooth val="' + (opts.lineSmooth ? "1" : "0") + '"/>';
        strXml += "</c:ser>";
      });
      {
        strXml += "  <c:dLbls>";
        strXml += `    <c:numFmt formatCode="${encodeXmlEntities(opts.dataLabelFormatCode) || "General"}" sourceLinked="0"/>`;
        strXml += "    <c:txPr>";
        strXml += "      <a:bodyPr/>";
        strXml += "      <a:lstStyle/>";
        strXml += "      <a:p><a:pPr>";
        strXml += `        <a:defRPr b="${opts.dataLabelFontBold ? 1 : 0}" i="${opts.dataLabelFontItalic ? 1 : 0}" strike="noStrike" sz="${Math.round((opts.dataLabelFontSize || DEF_FONT_SIZE) * 100)}" u="none">`;
        strXml += "          <a:solidFill>" + createColorElement(opts.dataLabelColor || DEF_FONT_COLOR) + "</a:solidFill>";
        strXml += '          <a:latin typeface="' + (opts.dataLabelFontFace || "Arial") + '"/>';
        strXml += "        </a:defRPr>";
        strXml += "      </a:pPr></a:p>";
        strXml += "    </c:txPr>";
        if (opts.dataLabelPosition)
          strXml += ' <c:dLblPos val="' + opts.dataLabelPosition + '"/>';
        strXml += '    <c:showLegendKey val="0"/>';
        strXml += '    <c:showVal val="' + (opts.showValue ? "1" : "0") + '"/>';
        strXml += '    <c:showCatName val="0"/>';
        strXml += '    <c:showSerName val="' + (opts.showSerName ? "1" : "0") + '"/>';
        strXml += '    <c:showPercent val="0"/>';
        strXml += '    <c:showBubbleSize val="0"/>';
        strXml += `    <c:showLeaderLines val="${opts.showLeaderLines ? "1" : "0"}"/>`;
        strXml += "  </c:dLbls>";
      }
      if (chartType === CHART_TYPE.BAR) {
        strXml += `  <c:gapWidth val="${opts.barGapWidthPct}"/>`;
        strXml += `  <c:overlap val="${(opts.barGrouping || "").includes("tacked") ? 100 : opts.barOverlapPct ? opts.barOverlapPct : 0}"/>`;
      } else if (chartType === CHART_TYPE.BAR3D) {
        strXml += `  <c:gapWidth val="${opts.barGapWidthPct}"/>`;
        strXml += `  <c:gapDepth val="${opts.barGapDepthPct}"/>`;
        strXml += '  <c:shape val="' + opts.bar3DShape + '"/>';
      } else if (chartType === CHART_TYPE.LINE) {
        strXml += '  <c:marker val="1"/>';
      }
      strXml += `<c:axId val="${catAxisId}"/><c:axId val="${valAxisId}"/><c:axId val="${AXIS_ID_SERIES_PRIMARY}"/>`;
      strXml += `</c:${chartType}Chart>`;
      break;
    case CHART_TYPE.SCATTER:
      strXml += "<c:" + chartType + "Chart>";
      strXml += '<c:scatterStyle val="lineMarker"/>';
      strXml += '<c:varyColors val="0"/>';
      colorIndex = -1;
      data.filter((_obj, idx) => idx > 0).forEach((obj, idx) => {
        colorIndex++;
        strXml += "<c:ser>";
        strXml += `  <c:idx val="${idx}"/>`;
        strXml += `  <c:order val="${idx}"/>`;
        strXml += "  <c:tx>";
        strXml += "    <c:strRef>";
        strXml += `      <c:f>Sheet1!$${getExcelColName(idx + 2)}$1</c:f>`;
        strXml += '      <c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>' + encodeXmlEntities(obj.name) + "</c:v></c:pt></c:strCache>";
        strXml += "    </c:strRef>";
        strXml += "  </c:tx>";
        strXml += "  <c:spPr>";
        {
          const tmpSerColor = opts.chartColors[colorIndex % opts.chartColors.length];
          if (tmpSerColor === "transparent") {
            strXml += "<a:noFill/>";
          } else if (opts.chartColorsOpacity) {
            strXml += "<a:solidFill>" + createColorElement(tmpSerColor, '<a:alpha val="' + Math.round(opts.chartColorsOpacity * 1e3).toString() + '"/>') + "</a:solidFill>";
          } else {
            strXml += "<a:solidFill>" + createColorElement(tmpSerColor) + "</a:solidFill>";
          }
          if (opts.lineSize === 0) {
            strXml += "<a:ln><a:noFill/></a:ln>";
          } else {
            strXml += `<a:ln w="${valToPts(opts.lineSize)}" cap="${createLineCap(opts.lineCap)}"><a:solidFill>${createColorElement(tmpSerColor)}</a:solidFill>`;
            strXml += `<a:prstDash val="${opts.lineDash || "solid"}"/><a:round/></a:ln>`;
          }
          strXml += createShadowElement(opts.shadow, DEF_SHAPE_SHADOW);
        }
        strXml += "  </c:spPr>";
        {
          strXml += "<c:marker>";
          strXml += '  <c:symbol val="' + opts.lineDataSymbol + '"/>';
          if (opts.lineDataSymbolSize) {
            strXml += `<c:size val="${opts.lineDataSymbolSize}"/>`;
          }
          strXml += "<c:spPr>";
          strXml += `<a:solidFill>${createColorElement(opts.chartColors[idx + 1 > opts.chartColors.length ? Math.floor(Math.random() * opts.chartColors.length) : idx])}</a:solidFill>`;
          strXml += `<a:ln w="${opts.lineDataSymbolLineSize}" cap="flat"><a:solidFill>${createColorElement(opts.lineDataSymbolLineColor || opts.chartColors[colorIndex % opts.chartColors.length])}</a:solidFill><a:prstDash val="solid"/><a:round/></a:ln>`;
          strXml += "<a:effectLst/>";
          strXml += "</c:spPr>";
          strXml += "</c:marker>";
        }
        if (opts.showLabel) {
          const chartUuid = getUuid("-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
          if (obj.labels[0] && (opts.dataLabelFormatScatter === "custom" || opts.dataLabelFormatScatter === "customXY")) {
            strXml += "<c:dLbls>";
            obj.labels[0].forEach((label, idx2) => {
              if (opts.dataLabelFormatScatter === "custom" || opts.dataLabelFormatScatter === "customXY") {
                strXml += "  <c:dLbl>";
                strXml += `    <c:idx val="${idx2}"/>`;
                strXml += "    <c:tx>";
                strXml += "      <c:rich>";
                strXml += "            <a:bodyPr>";
                strXml += "                <a:spAutoFit/>";
                strXml += "            </a:bodyPr>";
                strXml += "            <a:lstStyle/>";
                strXml += "            <a:p>";
                strXml += "                <a:pPr>";
                strXml += "                    <a:defRPr/>";
                strXml += "                </a:pPr>";
                strXml += "              <a:r>";
                strXml += '                    <a:rPr lang="' + (opts.lang || "en-US") + '" dirty="0"/>';
                strXml += "                    <a:t>" + encodeXmlEntities(label) + "</a:t>";
                strXml += "              </a:r>";
                if (opts.dataLabelFormatScatter === "customXY" && !/^ *$/.test(label)) {
                  strXml += "              <a:r>";
                  strXml += '                  <a:rPr lang="' + (opts.lang || "en-US") + '" baseline="0" dirty="0"/>';
                  strXml += "                  <a:t> (</a:t>";
                  strXml += "              </a:r>";
                  strXml += '              <a:fld id="{' + getUuid("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx") + '}" type="XVALUE">';
                  strXml += '                  <a:rPr lang="' + (opts.lang || "en-US") + '" baseline="0"/>';
                  strXml += "                  <a:pPr>";
                  strXml += "                      <a:defRPr/>";
                  strXml += "                  </a:pPr>";
                  strXml += "                  <a:t>[" + encodeXmlEntities(obj.name) + "</a:t>";
                  strXml += "              </a:fld>";
                  strXml += "              <a:r>";
                  strXml += '                  <a:rPr lang="' + (opts.lang || "en-US") + '" baseline="0" dirty="0"/>';
                  strXml += "                  <a:t>, </a:t>";
                  strXml += "              </a:r>";
                  strXml += '              <a:fld id="{' + getUuid("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx") + '}" type="YVALUE">';
                  strXml += '                  <a:rPr lang="' + (opts.lang || "en-US") + '" baseline="0"/>';
                  strXml += "                  <a:pPr>";
                  strXml += "                      <a:defRPr/>";
                  strXml += "                  </a:pPr>";
                  strXml += "                  <a:t>[" + encodeXmlEntities(obj.name) + "]</a:t>";
                  strXml += "              </a:fld>";
                  strXml += "              <a:r>";
                  strXml += '                  <a:rPr lang="' + (opts.lang || "en-US") + '" baseline="0" dirty="0"/>';
                  strXml += "                  <a:t>)</a:t>";
                  strXml += "              </a:r>";
                  strXml += '              <a:endParaRPr lang="' + (opts.lang || "en-US") + '" dirty="0"/>';
                }
                strXml += "            </a:p>";
                strXml += "      </c:rich>";
                strXml += "    </c:tx>";
                strXml += "    <c:spPr>";
                strXml += "        <a:noFill/>";
                strXml += "        <a:ln>";
                strXml += "            <a:noFill/>";
                strXml += "        </a:ln>";
                strXml += "        <a:effectLst/>";
                strXml += "    </c:spPr>";
                if (opts.dataLabelPosition)
                  strXml += ' <c:dLblPos val="' + opts.dataLabelPosition + '"/>';
                strXml += '    <c:showLegendKey val="0"/>';
                strXml += '    <c:showVal val="0"/>';
                strXml += '    <c:showCatName val="0"/>';
                strXml += '    <c:showSerName val="0"/>';
                strXml += '    <c:showPercent val="0"/>';
                strXml += '    <c:showBubbleSize val="0"/>';
                strXml += '       <c:showLeaderLines val="1"/>';
                strXml += "    <c:extLst>";
                strXml += '      <c:ext uri="{CE6537A1-D6FC-4f65-9D91-7224C49458BB}" xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart"/>';
                strXml += '      <c:ext uri="{C3380CC4-5D6E-409C-BE32-E72D297353CC}" xmlns:c16="http://schemas.microsoft.com/office/drawing/2014/chart">';
                strXml += `            <c16:uniqueId val="{${"00000000".substring(0, 8 - (idx2 + 1).toString().length).toString()}${idx2 + 1}${chartUuid}}"/>`;
                strXml += "      </c:ext>";
                strXml += "        </c:extLst>";
                strXml += "</c:dLbl>";
              }
            });
            strXml += "</c:dLbls>";
          }
          if (opts.dataLabelFormatScatter === "XY") {
            strXml += "<c:dLbls>";
            strXml += "    <c:spPr>";
            strXml += "        <a:noFill/>";
            strXml += "        <a:ln>";
            strXml += "            <a:noFill/>";
            strXml += "        </a:ln>";
            strXml += "          <a:effectLst/>";
            strXml += "    </c:spPr>";
            strXml += "    <c:txPr>";
            strXml += "        <a:bodyPr>";
            strXml += "            <a:spAutoFit/>";
            strXml += "        </a:bodyPr>";
            strXml += "        <a:lstStyle/>";
            strXml += "        <a:p>";
            strXml += "            <a:pPr>";
            strXml += "                <a:defRPr/>";
            strXml += "            </a:pPr>";
            strXml += '            <a:endParaRPr lang="en-US"/>';
            strXml += "        </a:p>";
            strXml += "    </c:txPr>";
            if (opts.dataLabelPosition)
              strXml += ' <c:dLblPos val="' + opts.dataLabelPosition + '"/>';
            strXml += '    <c:showLegendKey val="0"/>';
            strXml += ` <c:showVal val="${opts.showLabel ? "1" : "0"}"/>`;
            strXml += ` <c:showCatName val="${opts.showLabel ? "1" : "0"}"/>`;
            strXml += ` <c:showSerName val="${opts.showSerName ? "1" : "0"}"/>`;
            strXml += '    <c:showPercent val="0"/>';
            strXml += '    <c:showBubbleSize val="0"/>';
            strXml += "    <c:extLst>";
            strXml += '        <c:ext uri="{CE6537A1-D6FC-4f65-9D91-7224C49458BB}" xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart">';
            strXml += '            <c15:showLeaderLines val="1"/>';
            strXml += "        </c:ext>";
            strXml += "    </c:extLst>";
            strXml += "</c:dLbls>";
          }
        }
        if (data.length === 1 && opts.chartColors !== BARCHART_COLORS) {
          obj.values.forEach((value, index) => {
            const arrColors = value < 0 ? opts.invertedColors || opts.chartColors || BARCHART_COLORS : opts.chartColors || [];
            strXml += "  <c:dPt>";
            strXml += `    <c:idx val="${index}"/>`;
            strXml += '      <c:invertIfNegative val="0"/>';
            strXml += '    <c:bubble3D val="0"/>';
            strXml += "    <c:spPr>";
            if (opts.lineSize === 0) {
              strXml += "<a:ln><a:noFill/></a:ln>";
            } else {
              strXml += "<a:solidFill>";
              strXml += ' <a:srgbClr val="' + arrColors[index % arrColors.length] + '"/>';
              strXml += "</a:solidFill>";
            }
            strXml += createShadowElement(opts.shadow, DEF_SHAPE_SHADOW);
            strXml += "    </c:spPr>";
            strXml += "  </c:dPt>";
          });
        }
        {
          strXml += "<c:xVal>";
          strXml += "  <c:numRef>";
          strXml += `    <c:f>Sheet1!$A$2:$A$${data[0].values.length + 1}</c:f>`;
          strXml += "    <c:numCache>";
          strXml += "      <c:formatCode>General</c:formatCode>";
          strXml += `      <c:ptCount val="${data[0].values.length}"/>`;
          data[0].values.forEach((value, idx2) => {
            strXml += `<c:pt idx="${idx2}"><c:v>${value || value === 0 ? value : ""}</c:v></c:pt>`;
          });
          strXml += "    </c:numCache>";
          strXml += "  </c:numRef>";
          strXml += "</c:xVal>";
          strXml += "<c:yVal>";
          strXml += "  <c:numRef>";
          strXml += `    <c:f>Sheet1!$${getExcelColName(idx + 2)}$2:$${getExcelColName(idx + 2)}$${data[0].values.length + 1}</c:f>`;
          strXml += "    <c:numCache>";
          strXml += "      <c:formatCode>General</c:formatCode>";
          strXml += `      <c:ptCount val="${data[0].values.length}"/>`;
          data[0].values.forEach((_value, idx2) => {
            strXml += `<c:pt idx="${idx2}"><c:v>${obj.values[idx2] || obj.values[idx2] === 0 ? obj.values[idx2] : ""}</c:v></c:pt>`;
          });
          strXml += "    </c:numCache>";
          strXml += "  </c:numRef>";
          strXml += "</c:yVal>";
        }
        strXml += '<c:smooth val="' + (opts.lineSmooth ? "1" : "0") + '"/>';
        strXml += "</c:ser>";
      });
      {
        strXml += "  <c:dLbls>";
        strXml += `    <c:numFmt formatCode="${encodeXmlEntities(opts.dataLabelFormatCode) || "General"}" sourceLinked="0"/>`;
        strXml += "    <c:txPr>";
        strXml += "      <a:bodyPr/>";
        strXml += "      <a:lstStyle/>";
        strXml += "      <a:p><a:pPr>";
        strXml += `        <a:defRPr b="${opts.dataLabelFontBold ? "1" : "0"}" i="${opts.dataLabelFontItalic ? "1" : "0"}" strike="noStrike" sz="${Math.round((opts.dataLabelFontSize || DEF_FONT_SIZE) * 100)}" u="none">`;
        strXml += "          <a:solidFill>" + createColorElement(opts.dataLabelColor || DEF_FONT_COLOR) + "</a:solidFill>";
        strXml += '          <a:latin typeface="' + (opts.dataLabelFontFace || "Arial") + '"/>';
        strXml += "        </a:defRPr>";
        strXml += "      </a:pPr></a:p>";
        strXml += "    </c:txPr>";
        if (opts.dataLabelPosition)
          strXml += ' <c:dLblPos val="' + opts.dataLabelPosition + '"/>';
        strXml += '    <c:showLegendKey val="0"/>';
        strXml += '    <c:showVal val="' + (opts.showValue ? "1" : "0") + '"/>';
        strXml += '    <c:showCatName val="0"/>';
        strXml += '    <c:showSerName val="' + (opts.showSerName ? "1" : "0") + '"/>';
        strXml += '    <c:showPercent val="0"/>';
        strXml += '    <c:showBubbleSize val="0"/>';
        strXml += "  </c:dLbls>";
      }
      strXml += `<c:axId val="${catAxisId}"/><c:axId val="${valAxisId}"/>`;
      strXml += "</c:" + chartType + "Chart>";
      break;
    case CHART_TYPE.BUBBLE:
    case CHART_TYPE.BUBBLE3D:
      strXml += "<c:bubbleChart>";
      strXml += '<c:varyColors val="0"/>';
      colorIndex = -1;
      data.filter((_obj, idx) => idx > 0).forEach((obj, idx) => {
        colorIndex++;
        strXml += "<c:ser>";
        strXml += `  <c:idx val="${idx}"/>`;
        strXml += `  <c:order val="${idx}"/>`;
        strXml += "  <c:tx>";
        strXml += "    <c:strRef>";
        strXml += "      <c:f>Sheet1!$" + getExcelColName(idxColLtr + 1) + "$1</c:f>";
        strXml += '      <c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>' + encodeXmlEntities(obj.name) + "</c:v></c:pt></c:strCache>";
        strXml += "    </c:strRef>";
        strXml += "  </c:tx>";
        {
          strXml += "<c:spPr>";
          const tmpSerColor = opts.chartColors[colorIndex % opts.chartColors.length];
          if (tmpSerColor === "transparent") {
            strXml += "<a:noFill/>";
          } else if (opts.chartColorsOpacity) {
            strXml += `<a:solidFill>${createColorElement(tmpSerColor, '<a:alpha val="' + Math.round(opts.chartColorsOpacity * 1e3).toString() + '"/>')}</a:solidFill>`;
          } else {
            strXml += "<a:solidFill>" + createColorElement(tmpSerColor) + "</a:solidFill>";
          }
          if (opts.lineSize === 0) {
            strXml += "<a:ln><a:noFill/></a:ln>";
          } else if (opts.dataBorder) {
            strXml += `<a:ln w="${valToPts(opts.dataBorder.pt)}" cap="flat"><a:solidFill>${createColorElement(opts.dataBorder.color)}</a:solidFill><a:prstDash val="solid"/><a:round/></a:ln>`;
          } else {
            strXml += `<a:ln w="${valToPts(opts.lineSize)}" cap="flat"><a:solidFill>${createColorElement(tmpSerColor)}</a:solidFill>`;
            strXml += `<a:prstDash val="${opts.lineDash || "solid"}"/><a:round/></a:ln>`;
          }
          strXml += createShadowElement(opts.shadow, DEF_SHAPE_SHADOW);
          strXml += "</c:spPr>";
        }
        {
          strXml += "<c:xVal>";
          strXml += "  <c:numRef>";
          strXml += `    <c:f>Sheet1!$A$2:$A$${data[0].values.length + 1}</c:f>`;
          strXml += "    <c:numCache>";
          strXml += "      <c:formatCode>General</c:formatCode>";
          strXml += `      <c:ptCount val="${data[0].values.length}"/>`;
          data[0].values.forEach((value, idx2) => {
            strXml += `<c:pt idx="${idx2}"><c:v>${value || value === 0 ? value : ""}</c:v></c:pt>`;
          });
          strXml += "    </c:numCache>";
          strXml += "  </c:numRef>";
          strXml += "</c:xVal>";
          strXml += "<c:yVal>";
          strXml += "  <c:numRef>";
          strXml += `<c:f>Sheet1!$${getExcelColName(idxColLtr + 1)}$2:$${getExcelColName(idxColLtr + 1)}$${data[0].values.length + 1}</c:f>`;
          idxColLtr++;
          strXml += "    <c:numCache>";
          strXml += "      <c:formatCode>General</c:formatCode>";
          strXml += `      <c:ptCount val="${data[0].values.length}"/>`;
          data[0].values.forEach((_value, idx2) => {
            strXml += `<c:pt idx="${idx2}"><c:v>${obj.values[idx2] || obj.values[idx2] === 0 ? obj.values[idx2] : ""}</c:v></c:pt>`;
          });
          strXml += "    </c:numCache>";
          strXml += "  </c:numRef>";
          strXml += "</c:yVal>";
        }
        strXml += "  <c:bubbleSize>";
        strXml += "    <c:numRef>";
        strXml += `<c:f>Sheet1!$${getExcelColName(idxColLtr + 1)}$2:$${getExcelColName(idxColLtr + 1)}$${obj.sizes.length + 1}</c:f>`;
        idxColLtr++;
        strXml += "      <c:numCache>";
        strXml += "        <c:formatCode>General</c:formatCode>";
        strXml += `           <c:ptCount val="${obj.sizes.length}"/>`;
        obj.sizes.forEach((value, idx2) => {
          strXml += `<c:pt idx="${idx2}"><c:v>${value || ""}</c:v></c:pt>`;
        });
        strXml += "      </c:numCache>";
        strXml += "    </c:numRef>";
        strXml += "  </c:bubbleSize>";
        strXml += '  <c:bubble3D val="' + (chartType === CHART_TYPE.BUBBLE3D ? "1" : "0") + '"/>';
        strXml += "</c:ser>";
      });
      {
        strXml += "<c:dLbls>";
        strXml += `<c:numFmt formatCode="${encodeXmlEntities(opts.dataLabelFormatCode) || "General"}" sourceLinked="0"/>`;
        strXml += "<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr>";
        strXml += `<a:defRPr b="${opts.dataLabelFontBold ? 1 : 0}" i="${opts.dataLabelFontItalic ? 1 : 0}" strike="noStrike" sz="${Math.round(Math.round(opts.dataLabelFontSize || DEF_FONT_SIZE) * 100)}" u="none">`;
        strXml += `<a:solidFill>${createColorElement(opts.dataLabelColor || DEF_FONT_COLOR)}</a:solidFill>`;
        strXml += `<a:latin typeface="${opts.dataLabelFontFace || "Arial"}"/>`;
        strXml += "</a:defRPr></a:pPr></a:p></c:txPr>";
        if (opts.dataLabelPosition)
          strXml += `<c:dLblPos val="${opts.dataLabelPosition}"/>`;
        strXml += '<c:showLegendKey val="0"/>';
        strXml += `<c:showVal val="${opts.showValue ? "1" : "0"}"/>`;
        strXml += `<c:showCatName val="0"/><c:showSerName val="${opts.showSerName ? "1" : "0"}"/><c:showPercent val="0"/><c:showBubbleSize val="0"/>`;
        strXml += "<c:extLst>";
        strXml += '  <c:ext uri="{CE6537A1-D6FC-4f65-9D91-7224C49458BB}" xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart">';
        strXml += '    <c15:showLeaderLines val="' + (opts.showLeaderLines ? "1" : "0") + '"/>';
        strXml += "  </c:ext>";
        strXml += "</c:extLst>";
        strXml += "</c:dLbls>";
      }
      strXml += `<c:axId val="${catAxisId}"/><c:axId val="${valAxisId}"/>`;
      strXml += "</c:bubbleChart>";
      break;
    case CHART_TYPE.DOUGHNUT:
    case CHART_TYPE.PIE:
      optsChartData = data[0];
      strXml += "<c:" + chartType + "Chart>";
      strXml += '  <c:varyColors val="1"/>';
      strXml += "<c:ser>";
      strXml += '  <c:idx val="0"/>';
      strXml += '  <c:order val="0"/>';
      strXml += "  <c:tx>";
      strXml += "    <c:strRef>";
      strXml += "      <c:f>Sheet1!$B$1</c:f>";
      strXml += "      <c:strCache>";
      strXml += '        <c:ptCount val="1"/>';
      strXml += '        <c:pt idx="0"><c:v>' + encodeXmlEntities(optsChartData.name) + "</c:v></c:pt>";
      strXml += "      </c:strCache>";
      strXml += "    </c:strRef>";
      strXml += "  </c:tx>";
      strXml += "  <c:spPr>";
      strXml += '    <a:solidFill><a:schemeClr val="accent1"/></a:solidFill>';
      strXml += '    <a:ln w="9525" cap="flat"><a:solidFill><a:srgbClr val="F9F9F9"/></a:solidFill><a:prstDash val="solid"/><a:round/></a:ln>';
      if (opts.dataNoEffects) {
        strXml += "<a:effectLst/>";
      } else {
        strXml += createShadowElement(opts.shadow, DEF_SHAPE_SHADOW);
      }
      strXml += "  </c:spPr>";
      optsChartData.labels[0].forEach((_label, idx) => {
        strXml += "<c:dPt>";
        strXml += ` <c:idx val="${idx}"/>`;
        strXml += ' <c:bubble3D val="0"/>';
        strXml += " <c:spPr>";
        strXml += `<a:solidFill>${createColorElement(opts.chartColors[idx + 1 > opts.chartColors.length ? Math.floor(Math.random() * opts.chartColors.length) : idx])}</a:solidFill>`;
        if (opts.dataBorder) {
          strXml += `<a:ln w="${valToPts(opts.dataBorder.pt)}" cap="flat"><a:solidFill>${createColorElement(opts.dataBorder.color)}</a:solidFill><a:prstDash val="solid"/><a:round/></a:ln>`;
        }
        strXml += createShadowElement(opts.shadow, DEF_SHAPE_SHADOW);
        strXml += "  </c:spPr>";
        strXml += "</c:dPt>";
      });
      strXml += "<c:dLbls>";
      optsChartData.labels[0].forEach((_label, idx) => {
        strXml += "<c:dLbl>";
        strXml += ` <c:idx val="${idx}"/>`;
        strXml += `  <c:numFmt formatCode="${encodeXmlEntities(opts.dataLabelFormatCode) || "General"}" sourceLinked="0"/>`;
        strXml += "  <c:spPr/><c:txPr>";
        strXml += "   <a:bodyPr/><a:lstStyle/>";
        strXml += "   <a:p><a:pPr>";
        strXml += `   <a:defRPr sz="${Math.round((opts.dataLabelFontSize || DEF_FONT_SIZE) * 100)}" b="${opts.dataLabelFontBold ? 1 : 0}" i="${opts.dataLabelFontItalic ? 1 : 0}" u="none" strike="noStrike">`;
        strXml += "    <a:solidFill>" + createColorElement(opts.dataLabelColor || DEF_FONT_COLOR) + "</a:solidFill>";
        strXml += `    <a:latin typeface="${opts.dataLabelFontFace || "Arial"}"/>`;
        strXml += "   </a:defRPr>";
        strXml += "      </a:pPr></a:p>";
        strXml += "    </c:txPr>";
        if (chartType === CHART_TYPE.PIE && opts.dataLabelPosition)
          strXml += `<c:dLblPos val="${opts.dataLabelPosition}"/>`;
        strXml += '    <c:showLegendKey val="0"/>';
        strXml += '    <c:showVal val="' + (opts.showValue ? "1" : "0") + '"/>';
        strXml += '    <c:showCatName val="' + (opts.showLabel ? "1" : "0") + '"/>';
        strXml += '    <c:showSerName val="' + (opts.showSerName ? "1" : "0") + '"/>';
        strXml += '    <c:showPercent val="' + (opts.showPercent ? "1" : "0") + '"/>';
        strXml += '    <c:showBubbleSize val="0"/>';
        strXml += "  </c:dLbl>";
      });
      strXml += ` <c:numFmt formatCode="${encodeXmlEntities(opts.dataLabelFormatCode) || "General"}" sourceLinked="0"/>`;
      strXml += "    <c:txPr>";
      strXml += "      <a:bodyPr/>";
      strXml += "      <a:lstStyle/>";
      strXml += "      <a:p>";
      strXml += "        <a:pPr>";
      strXml += `          <a:defRPr sz="1800" b="${opts.dataLabelFontBold ? "1" : "0"}" i="${opts.dataLabelFontItalic ? "1" : "0"}" u="none" strike="noStrike">`;
      strXml += '            <a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:latin typeface="Arial"/>';
      strXml += "          </a:defRPr>";
      strXml += "        </a:pPr>";
      strXml += "      </a:p>";
      strXml += "    </c:txPr>";
      strXml += chartType === CHART_TYPE.PIE ? '<c:dLblPos val="ctr"/>' : "";
      strXml += '    <c:showLegendKey val="0"/>';
      strXml += '    <c:showVal val="0"/>';
      strXml += '    <c:showCatName val="1"/>';
      strXml += '    <c:showSerName val="0"/>';
      strXml += '    <c:showPercent val="1"/>';
      strXml += '    <c:showBubbleSize val="0"/>';
      strXml += ` <c:showLeaderLines val="${opts.showLeaderLines ? "1" : "0"}"/>`;
      strXml += "</c:dLbls>";
      strXml += "<c:cat>";
      strXml += "  <c:strRef>";
      strXml += `    <c:f>Sheet1!$A$2:$A$${optsChartData.labels[0].length + 1}</c:f>`;
      strXml += "    <c:strCache>";
      strXml += `         <c:ptCount val="${optsChartData.labels[0].length}"/>`;
      optsChartData.labels[0].forEach((label, idx) => {
        strXml += `<c:pt idx="${idx}"><c:v>${encodeXmlEntities(label)}</c:v></c:pt>`;
      });
      strXml += "    </c:strCache>";
      strXml += "  </c:strRef>";
      strXml += "</c:cat>";
      strXml += "  <c:val>";
      strXml += "    <c:numRef>";
      strXml += `      <c:f>Sheet1!$B$2:$B$${optsChartData.labels[0].length + 1}</c:f>`;
      strXml += "      <c:numCache>";
      strXml += `           <c:ptCount val="${optsChartData.labels[0].length}"/>`;
      optsChartData.values.forEach((value, idx) => {
        strXml += `<c:pt idx="${idx}"><c:v>${value || value === 0 ? value : ""}</c:v></c:pt>`;
      });
      strXml += "      </c:numCache>";
      strXml += "    </c:numRef>";
      strXml += "  </c:val>";
      strXml += "  </c:ser>";
      strXml += `  <c:firstSliceAng val="${opts.firstSliceAng ? Math.round(opts.firstSliceAng) : 0}"/>`;
      if (chartType === CHART_TYPE.DOUGHNUT)
        strXml += `<c:holeSize val="${typeof opts.holeSize === "number" ? opts.holeSize : "50"}"/>`;
      strXml += "</c:" + chartType + "Chart>";
      break;
    default:
      strXml += "";
      break;
  }
  return strXml;
}
function makeCatAxis(opts, axisId, valAxisId) {
  let strXml = "";
  if (opts._type === CHART_TYPE.SCATTER || opts._type === CHART_TYPE.BUBBLE || opts._type === CHART_TYPE.BUBBLE3D) {
    strXml += "<c:valAx>";
  } else {
    strXml += "<c:" + (opts.catLabelFormatCode ? "dateAx" : "catAx") + ">";
  }
  strXml += '  <c:axId val="' + axisId + '"/>';
  strXml += "  <c:scaling>";
  strXml += '<c:orientation val="' + (opts.catAxisOrientation || (opts.barDir === "col" ? "minMax" : "minMax")) + '"/>';
  if (opts.catAxisMaxVal || opts.catAxisMaxVal === 0)
    strXml += `<c:max val="${opts.catAxisMaxVal}"/>`;
  if (opts.catAxisMinVal || opts.catAxisMinVal === 0)
    strXml += `<c:min val="${opts.catAxisMinVal}"/>`;
  strXml += "</c:scaling>";
  strXml += '  <c:delete val="' + (opts.catAxisHidden ? "1" : "0") + '"/>';
  strXml += '  <c:axPos val="' + (opts.barDir === "col" ? "b" : "l") + '"/>';
  strXml += opts.catGridLine.style !== "none" ? createGridLineElement(opts.catGridLine) : "";
  if (opts.showCatAxisTitle) {
    strXml += genXmlTitle({
      color: opts.catAxisTitleColor,
      fontFace: opts.catAxisTitleFontFace,
      fontSize: opts.catAxisTitleFontSize,
      titleRotate: opts.catAxisTitleRotate,
      title: opts.catAxisTitle || "Axis Title"
    });
  }
  if (opts._type === CHART_TYPE.SCATTER || opts._type === CHART_TYPE.BUBBLE || opts._type === CHART_TYPE.BUBBLE3D) {
    strXml += '  <c:numFmt formatCode="' + (opts.valAxisLabelFormatCode ? encodeXmlEntities(opts.valAxisLabelFormatCode) : "General") + '" sourceLinked="1"/>';
  } else {
    strXml += '  <c:numFmt formatCode="' + (encodeXmlEntities(opts.catLabelFormatCode) || "General") + '" sourceLinked="1"/>';
  }
  if (opts._type === CHART_TYPE.SCATTER) {
    strXml += '  <c:majorTickMark val="none"/>';
    strXml += '  <c:minorTickMark val="none"/>';
    strXml += '  <c:tickLblPos val="nextTo"/>';
  } else {
    strXml += '  <c:majorTickMark val="' + (opts.catAxisMajorTickMark || "out") + '"/>';
    strXml += '  <c:minorTickMark val="' + (opts.catAxisMinorTickMark || "none") + '"/>';
    strXml += '  <c:tickLblPos val="' + (opts.catAxisLabelPos || (opts.barDir === "col" ? "low" : "nextTo")) + '"/>';
  }
  strXml += "  <c:spPr>";
  strXml += `    <a:ln w="${opts.catAxisLineSize ? valToPts(opts.catAxisLineSize) : ONEPT}" cap="flat">`;
  strXml += !opts.catAxisLineShow ? "<a:noFill/>" : "<a:solidFill>" + createColorElement(opts.catAxisLineColor || DEF_CHART_GRIDLINE.color) + "</a:solidFill>";
  strXml += '      <a:prstDash val="' + (opts.catAxisLineStyle || "solid") + '"/>';
  strXml += "      <a:round/>";
  strXml += "    </a:ln>";
  strXml += "  </c:spPr>";
  strXml += "  <c:txPr>";
  if (opts.catAxisLabelRotate) {
    strXml += `<a:bodyPr rot="${convertRotationDegrees(opts.catAxisLabelRotate)}"/>`;
  } else {
    strXml += "<a:bodyPr/>";
  }
  strXml += "    <a:lstStyle/>";
  strXml += "    <a:p>";
  strXml += "    <a:pPr>";
  strXml += `      <a:defRPr sz="${Math.round((opts.catAxisLabelFontSize || DEF_FONT_SIZE) * 100)}" b="${opts.catAxisLabelFontBold ? 1 : 0}" i="${opts.catAxisLabelFontItalic ? 1 : 0}" u="none" strike="noStrike">`;
  strXml += "      <a:solidFill>" + createColorElement(opts.catAxisLabelColor || DEF_FONT_COLOR) + "</a:solidFill>";
  strXml += '      <a:latin typeface="' + (opts.catAxisLabelFontFace || "Arial") + '"/>';
  strXml += "   </a:defRPr>";
  strXml += "  </a:pPr>";
  strXml += '  <a:endParaRPr lang="' + (opts.lang || "en-US") + '"/>';
  strXml += "  </a:p>";
  strXml += " </c:txPr>";
  strXml += ' <c:crossAx val="' + valAxisId + '"/>';
  strXml += ` <c:${typeof opts.valAxisCrossesAt === "number" ? "crossesAt" : "crosses"} val="${opts.valAxisCrossesAt || "autoZero"}"/>`;
  strXml += ' <c:auto val="1"/>';
  strXml += ' <c:lblAlgn val="ctr"/>';
  strXml += ` <c:noMultiLvlLbl val="${opts.catAxisMultiLevelLabels ? 0 : 1}"/>`;
  if (opts.catAxisLabelFrequency)
    strXml += ' <c:tickLblSkip val="' + opts.catAxisLabelFrequency + '"/>';
  if (opts.catLabelFormatCode || opts._type === CHART_TYPE.SCATTER || opts._type === CHART_TYPE.BUBBLE || opts._type === CHART_TYPE.BUBBLE3D) {
    if (opts.catLabelFormatCode) {
      ["catAxisBaseTimeUnit", "catAxisMajorTimeUnit", "catAxisMinorTimeUnit"].forEach((opt) => {
        if (opts[opt] && (typeof opts[opt] !== "string" || !["days", "months", "years"].includes(opts[opt].toLowerCase()))) {
          console.warn(`"${opt}" must be one of: 'days','months','years' !`);
          opts[opt] = null;
        }
      });
      if (opts.catAxisBaseTimeUnit)
        strXml += '<c:baseTimeUnit val="' + opts.catAxisBaseTimeUnit.toLowerCase() + '"/>';
      if (opts.catAxisMajorTimeUnit)
        strXml += '<c:majorTimeUnit val="' + opts.catAxisMajorTimeUnit.toLowerCase() + '"/>';
      if (opts.catAxisMinorTimeUnit)
        strXml += '<c:minorTimeUnit val="' + opts.catAxisMinorTimeUnit.toLowerCase() + '"/>';
    }
    if (opts.catAxisMajorUnit)
      strXml += `<c:majorUnit val="${opts.catAxisMajorUnit}"/>`;
    if (opts.catAxisMinorUnit)
      strXml += `<c:minorUnit val="${opts.catAxisMinorUnit}"/>`;
  }
  if (opts._type === CHART_TYPE.SCATTER || opts._type === CHART_TYPE.BUBBLE || opts._type === CHART_TYPE.BUBBLE3D) {
    strXml += "</c:valAx>";
  } else {
    strXml += "</c:" + (opts.catLabelFormatCode ? "dateAx" : "catAx") + ">";
  }
  return strXml;
}
function makeValAxis(opts, valAxisId) {
  let axisPos = valAxisId === AXIS_ID_VALUE_PRIMARY ? opts.barDir === "col" ? "l" : "b" : opts.barDir !== "col" ? "r" : "t";
  if (valAxisId === AXIS_ID_VALUE_SECONDARY)
    axisPos = "r";
  const crossAxId = valAxisId === AXIS_ID_VALUE_PRIMARY ? AXIS_ID_CATEGORY_PRIMARY : AXIS_ID_CATEGORY_SECONDARY;
  let strXml = "";
  strXml += "<c:valAx>";
  strXml += '  <c:axId val="' + valAxisId + '"/>';
  strXml += "  <c:scaling>";
  if (opts.valAxisLogScaleBase)
    strXml += `<c:logBase val="${opts.valAxisLogScaleBase}"/>`;
  strXml += '<c:orientation val="' + (opts.valAxisOrientation || (opts.barDir === "col" ? "minMax" : "minMax")) + '"/>';
  if (opts.valAxisMaxVal || opts.valAxisMaxVal === 0)
    strXml += `<c:max val="${opts.valAxisMaxVal}"/>`;
  if (opts.valAxisMinVal || opts.valAxisMinVal === 0)
    strXml += `<c:min val="${opts.valAxisMinVal}"/>`;
  strXml += "  </c:scaling>";
  strXml += `  <c:delete val="${opts.valAxisHidden ? 1 : 0}"/>`;
  strXml += '  <c:axPos val="' + axisPos + '"/>';
  if (opts.valGridLine.style !== "none")
    strXml += createGridLineElement(opts.valGridLine);
  if (opts.showValAxisTitle) {
    strXml += genXmlTitle({
      color: opts.valAxisTitleColor,
      fontFace: opts.valAxisTitleFontFace,
      fontSize: opts.valAxisTitleFontSize,
      titleRotate: opts.valAxisTitleRotate,
      title: opts.valAxisTitle || "Axis Title"
    });
  }
  strXml += `<c:numFmt formatCode="${opts.valAxisLabelFormatCode ? encodeXmlEntities(opts.valAxisLabelFormatCode) : "General"}" sourceLinked="0"/>`;
  if (opts._type === CHART_TYPE.SCATTER) {
    strXml += '  <c:majorTickMark val="none"/>';
    strXml += '  <c:minorTickMark val="none"/>';
    strXml += '  <c:tickLblPos val="nextTo"/>';
  } else {
    strXml += ' <c:majorTickMark val="' + (opts.valAxisMajorTickMark || "out") + '"/>';
    strXml += ' <c:minorTickMark val="' + (opts.valAxisMinorTickMark || "none") + '"/>';
    strXml += ' <c:tickLblPos val="' + (opts.valAxisLabelPos || (opts.barDir === "col" ? "nextTo" : "low")) + '"/>';
  }
  strXml += " <c:spPr>";
  strXml += `   <a:ln w="${opts.valAxisLineSize ? valToPts(opts.valAxisLineSize) : ONEPT}" cap="flat">`;
  strXml += !opts.valAxisLineShow ? "<a:noFill/>" : "<a:solidFill>" + createColorElement(opts.valAxisLineColor || DEF_CHART_GRIDLINE.color) + "</a:solidFill>";
  strXml += '     <a:prstDash val="' + (opts.valAxisLineStyle || "solid") + '"/>';
  strXml += "     <a:round/>";
  strXml += "   </a:ln>";
  strXml += " </c:spPr>";
  strXml += " <c:txPr>";
  strXml += `  <a:bodyPr${opts.valAxisLabelRotate ? ' rot="' + convertRotationDegrees(opts.valAxisLabelRotate).toString() + '"' : ""}/>`;
  strXml += "  <a:lstStyle/>";
  strXml += "  <a:p>";
  strXml += "    <a:pPr>";
  strXml += `      <a:defRPr sz="${Math.round((opts.valAxisLabelFontSize || DEF_FONT_SIZE) * 100)}" b="${opts.valAxisLabelFontBold ? 1 : 0}" i="${opts.valAxisLabelFontItalic ? 1 : 0}" u="none" strike="noStrike">`;
  strXml += "        <a:solidFill>" + createColorElement(opts.valAxisLabelColor || DEF_FONT_COLOR) + "</a:solidFill>";
  strXml += '        <a:latin typeface="' + (opts.valAxisLabelFontFace || "Arial") + '"/>';
  strXml += "      </a:defRPr>";
  strXml += "    </a:pPr>";
  strXml += '  <a:endParaRPr lang="' + (opts.lang || "en-US") + '"/>';
  strXml += "  </a:p>";
  strXml += " </c:txPr>";
  strXml += ' <c:crossAx val="' + crossAxId + '"/>';
  if (typeof opts.catAxisCrossesAt === "number") {
    strXml += ` <c:crossesAt val="${opts.catAxisCrossesAt}"/>`;
  } else if (typeof opts.catAxisCrossesAt === "string") {
    strXml += ' <c:crosses val="' + opts.catAxisCrossesAt + '"/>';
  } else {
    const isRight = axisPos === "r" || axisPos === "t";
    const crosses = isRight ? "max" : "autoZero";
    strXml += ' <c:crosses val="' + crosses + '"/>';
  }
  strXml += ' <c:crossBetween val="' + (opts._type === CHART_TYPE.SCATTER || !!(Array.isArray(opts._type) && opts._type.filter((type) => type.type === CHART_TYPE.AREA).length > 0) ? "midCat" : "between") + '"/>';
  if (opts.valAxisMajorUnit)
    strXml += ` <c:majorUnit val="${opts.valAxisMajorUnit}"/>`;
  if (opts.valAxisDisplayUnit) {
    strXml += `<c:dispUnits><c:builtInUnit val="${opts.valAxisDisplayUnit}"/>${opts.valAxisDisplayUnitLabel ? "<c:dispUnitsLbl/>" : ""}</c:dispUnits>`;
  }
  strXml += "</c:valAx>";
  return strXml;
}
function makeSerAxis(opts, axisId, valAxisId) {
  let strXml = "";
  strXml += "<c:serAx>";
  strXml += '  <c:axId val="' + axisId + '"/>';
  strXml += '  <c:scaling><c:orientation val="' + (opts.serAxisOrientation || (opts.barDir === "col" ? "minMax" : "minMax")) + '"/></c:scaling>';
  strXml += '  <c:delete val="' + (opts.serAxisHidden ? "1" : "0") + '"/>';
  strXml += '  <c:axPos val="' + (opts.barDir === "col" ? "b" : "l") + '"/>';
  strXml += opts.serGridLine.style !== "none" ? createGridLineElement(opts.serGridLine) : "";
  if (opts.showSerAxisTitle) {
    strXml += genXmlTitle({
      color: opts.serAxisTitleColor,
      fontFace: opts.serAxisTitleFontFace,
      fontSize: opts.serAxisTitleFontSize,
      titleRotate: opts.serAxisTitleRotate,
      title: opts.serAxisTitle || "Axis Title"
    });
  }
  strXml += `  <c:numFmt formatCode="${encodeXmlEntities(opts.serLabelFormatCode) || "General"}" sourceLinked="0"/>`;
  strXml += '  <c:majorTickMark val="out"/>';
  strXml += '  <c:minorTickMark val="none"/>';
  strXml += `  <c:tickLblPos val="${opts.serAxisLabelPos || opts.barDir === "col" ? "low" : "nextTo"}"/>`;
  strXml += "  <c:spPr>";
  strXml += '    <a:ln w="12700" cap="flat">';
  strXml += !opts.serAxisLineShow ? "<a:noFill/>" : `<a:solidFill>${createColorElement(opts.serAxisLineColor || DEF_CHART_GRIDLINE.color)}</a:solidFill>`;
  strXml += '      <a:prstDash val="solid"/>';
  strXml += "      <a:round/>";
  strXml += "    </a:ln>";
  strXml += "  </c:spPr>";
  strXml += "  <c:txPr>";
  strXml += "    <a:bodyPr/>";
  strXml += "    <a:lstStyle/>";
  strXml += "    <a:p>";
  strXml += "    <a:pPr>";
  strXml += `    <a:defRPr sz="${Math.round((opts.serAxisLabelFontSize || DEF_FONT_SIZE) * 100)}" b="${opts.serAxisLabelFontBold ? "1" : "0"}" i="${opts.serAxisLabelFontItalic ? "1" : "0"}" u="none" strike="noStrike">`;
  strXml += `      <a:solidFill>${createColorElement(opts.serAxisLabelColor || DEF_FONT_COLOR)}</a:solidFill>`;
  strXml += `      <a:latin typeface="${opts.serAxisLabelFontFace || "Arial"}"/>`;
  strXml += "   </a:defRPr>";
  strXml += "  </a:pPr>";
  strXml += '  <a:endParaRPr lang="' + (opts.lang || "en-US") + '"/>';
  strXml += "  </a:p>";
  strXml += " </c:txPr>";
  strXml += ' <c:crossAx val="' + valAxisId + '"/>';
  strXml += ' <c:crosses val="autoZero"/>';
  if (opts.serAxisLabelFrequency)
    strXml += ' <c:tickLblSkip val="' + opts.serAxisLabelFrequency + '"/>';
  if (opts.serLabelFormatCode) {
    ["serAxisBaseTimeUnit", "serAxisMajorTimeUnit", "serAxisMinorTimeUnit"].forEach((opt) => {
      if (opts[opt] && (typeof opts[opt] !== "string" || !["days", "months", "years"].includes(opt.toLowerCase()))) {
        console.warn(`"${opt}" must be one of: 'days','months','years' !`);
        opts[opt] = null;
      }
    });
    if (opts.serAxisBaseTimeUnit)
      strXml += ` <c:baseTimeUnit  val="${opts.serAxisBaseTimeUnit.toLowerCase()}"/>`;
    if (opts.serAxisMajorTimeUnit)
      strXml += ` <c:majorTimeUnit val="${opts.serAxisMajorTimeUnit.toLowerCase()}"/>`;
    if (opts.serAxisMinorTimeUnit)
      strXml += ` <c:minorTimeUnit val="${opts.serAxisMinorTimeUnit.toLowerCase()}"/>`;
    if (opts.serAxisMajorUnit)
      strXml += ` <c:majorUnit val="${opts.serAxisMajorUnit}"/>`;
    if (opts.serAxisMinorUnit)
      strXml += ` <c:minorUnit val="${opts.serAxisMinorUnit}"/>`;
  }
  strXml += "</c:serAx>";
  return strXml;
}
function genXmlTitle(opts, chartX, chartY) {
  const align = opts.titleAlign === "left" || opts.titleAlign === "right" ? `<a:pPr algn="${opts.titleAlign.substring(0, 1)}">` : "<a:pPr>";
  const rotate = opts.titleRotate ? `<a:bodyPr rot="${convertRotationDegrees(opts.titleRotate)}"/>` : "<a:bodyPr/>";
  const sizeAttr = opts.fontSize ? `sz="${Math.round(opts.fontSize * 100)}"` : "";
  const titleBold = opts.titleBold ? 1 : 0;
  let layout = "<c:layout/>";
  if (opts.titlePos && typeof opts.titlePos.x === "number" && typeof opts.titlePos.y === "number") {
    const totalX = opts.titlePos.x + chartX;
    const totalY = opts.titlePos.y + chartY;
    let valX = totalX === 0 ? 0 : totalX * (totalX / 5) / 10;
    if (valX >= 1)
      valX = valX / 10;
    if (valX >= 0.1)
      valX = valX / 10;
    let valY = totalY === 0 ? 0 : totalY * (totalY / 5) / 10;
    if (valY >= 1)
      valY = valY / 10;
    if (valY >= 0.1)
      valY = valY / 10;
    layout = `<c:layout><c:manualLayout><c:xMode val="edge"/><c:yMode val="edge"/><c:x val="${valX}"/><c:y val="${valY}"/></c:manualLayout></c:layout>`;
  }
  return `<c:title>
      <c:tx>
        <c:rich>
          ${rotate}
          <a:lstStyle/>
          <a:p>
            ${align}
            <a:defRPr ${sizeAttr} b="${titleBold}" i="0" u="none" strike="noStrike">
              <a:solidFill>${createColorElement(opts.color || DEF_FONT_COLOR)}</a:solidFill>
              <a:latin typeface="${opts.fontFace || "Arial"}"/>
            </a:defRPr>
          </a:pPr>
          <a:r>
            <a:rPr ${sizeAttr} b="${titleBold}" i="0" u="none" strike="noStrike">
              <a:solidFill>${createColorElement(opts.color || DEF_FONT_COLOR)}</a:solidFill>
              <a:latin typeface="${opts.fontFace || "Arial"}"/>
            </a:rPr>
            <a:t>${encodeXmlEntities(opts.title) || ""}</a:t>
          </a:r>
        </a:p>
        </c:rich>
      </c:tx>
      ${layout}
      <c:overlay val="0"/>
    </c:title>`;
}
function getExcelColName(colIndex) {
  let colStr = "";
  const colIdx = colIndex - 1;
  if (colIdx <= 25) {
    colStr = LETTERS[colIdx];
  } else {
    colStr = `${LETTERS[Math.floor(colIdx / LETTERS.length - 1)]}${LETTERS[colIdx % LETTERS.length]}`;
  }
  return colStr;
}
function createShadowElement(options, defaults) {
  if (!options) {
    return "<a:effectLst/>";
  } else if (typeof options !== "object") {
    console.warn("`shadow` options must be an object. Ex: `{shadow: {type:'none'}}`");
    return "<a:effectLst/>";
  }
  let strXml = "<a:effectLst>";
  const opts = Object.assign(Object.assign({}, defaults), options);
  const type = opts.type || "outer";
  const blur = valToPts(opts.blur);
  const offset = valToPts(opts.offset);
  const angle = Math.round(opts.angle * 6e4);
  const color = opts.color;
  const opacity = Math.round(opts.opacity * 1e5);
  const rotShape = opts.rotateWithShape ? 1 : 0;
  strXml += `<a:${type}Shdw sx="100000" sy="100000" kx="0" ky="0"  algn="bl" blurRad="${blur}" rotWithShape="${rotShape}" dist="${offset}" dir="${angle}">`;
  strXml += `<a:srgbClr val="${color}">`;
  strXml += `<a:alpha val="${opacity}"/></a:srgbClr>`;
  strXml += `</a:${type}Shdw>`;
  strXml += "</a:effectLst>";
  return strXml;
}
function createGridLineElement(glOpts) {
  let strXml = "<c:majorGridlines>";
  strXml += " <c:spPr>";
  strXml += `  <a:ln w="${valToPts(glOpts.size || DEF_CHART_GRIDLINE.size)}" cap="${createLineCap(glOpts.cap || DEF_CHART_GRIDLINE.cap)}">`;
  strXml += '  <a:solidFill><a:srgbClr val="' + (glOpts.color || DEF_CHART_GRIDLINE.color) + '"/></a:solidFill>';
  strXml += '   <a:prstDash val="' + (glOpts.style || DEF_CHART_GRIDLINE.style) + '"/><a:round/>';
  strXml += "  </a:ln>";
  strXml += " </c:spPr>";
  strXml += "</c:majorGridlines>";
  return strXml;
}
function createLineCap(lineCap) {
  if (!lineCap || lineCap === "flat") {
    return "flat";
  } else if (lineCap === "square") {
    return "sq";
  } else if (lineCap === "round") {
    return "rnd";
  } else {
    const neverLineCap = lineCap;
    throw new Error(`Invalid chart line cap: ${neverLineCap}`);
  }
}
function encodeSlideMediaRels(layout) {
  var _a, _b;
  const isNode = typeof process !== "undefined" && !!((_a = process.versions) === null || _a === void 0 ? void 0 : _a.node) && ((_b = process.release) === null || _b === void 0 ? void 0 : _b.name) === "node";
  let fs2;
  let https;
  const loadNodeDeps = isNode ? () => __awaiter(this, void 0, void 0, function* () {
    ({ default: fs2 } = yield import("node:fs"));
    ({ default: https } = yield import("node:https"));
  }) : () => __awaiter(this, void 0, void 0, function* () {
  });
  if (isNode)
    loadNodeDeps();
  const imageProms = [];
  const candidateRels = layout._relsMedia.filter((rel) => rel.type !== "online" && !rel.data && (!rel.path || rel.path && !rel.path.includes("preencoded")));
  const unqPaths = [];
  candidateRels.forEach((rel) => {
    if (!unqPaths.includes(rel.path)) {
      rel.isDuplicate = false;
      unqPaths.push(rel.path);
    } else {
      rel.isDuplicate = true;
    }
  });
  candidateRels.filter((rel) => !rel.isDuplicate).forEach((rel) => {
    imageProms.push((() => __awaiter(this, void 0, void 0, function* () {
      if (!https)
        yield loadNodeDeps();
      if (isNode && fs2 && rel.path.indexOf("http") !== 0) {
        try {
          const bitmap = fs2.readFileSync(rel.path);
          rel.data = Buffer.from(bitmap).toString("base64");
          candidateRels.filter((dupe) => dupe.isDuplicate && dupe.path === rel.path).forEach((dupe) => dupe.data = rel.data);
          return "done";
        } catch (ex) {
          rel.data = IMG_BROKEN;
          candidateRels.filter((dupe) => dupe.isDuplicate && dupe.path === rel.path).forEach((dupe) => dupe.data = rel.data);
          throw new Error(`ERROR: Unable to read media: "${rel.path}"
${String(ex)}`);
        }
      }
      if (isNode && https && rel.path.startsWith("http")) {
        return yield new Promise((resolve, reject) => {
          https.get(rel.path, (res) => {
            let raw = "";
            res.setEncoding("binary");
            res.on("data", (chunk) => raw += chunk);
            res.on("end", () => {
              rel.data = Buffer.from(raw, "binary").toString("base64");
              candidateRels.filter((dupe) => dupe.isDuplicate && dupe.path === rel.path).forEach((dupe) => dupe.data = rel.data);
              resolve("done");
            });
            res.on("error", () => {
              rel.data = IMG_BROKEN;
              candidateRels.filter((dupe) => dupe.isDuplicate && dupe.path === rel.path).forEach((dupe) => dupe.data = rel.data);
              reject(new Error(`ERROR! Unable to load image (https.get): ${rel.path}`));
            });
          });
        });
      }
      return yield new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          const reader = new FileReader();
          reader.onloadend = () => {
            rel.data = reader.result;
            candidateRels.filter((dupe) => dupe.isDuplicate && dupe.path === rel.path).forEach((dupe) => dupe.data = rel.data);
            if (!rel.isSvgPng) {
              resolve("done");
            } else {
              createSvgPngPreview(rel).then(() => resolve("done")).catch(reject);
            }
          };
          reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = () => {
          rel.data = IMG_BROKEN;
          candidateRels.filter((dupe) => dupe.isDuplicate && dupe.path === rel.path).forEach((dupe) => dupe.data = rel.data);
          reject(new Error(`ERROR! Unable to load image (xhr.onerror): ${rel.path}`));
        };
        xhr.open("GET", rel.path);
        xhr.responseType = "blob";
        xhr.send();
      });
    }))());
  });
  layout._relsMedia.filter((rel) => rel.isSvgPng && rel.data).forEach((rel) => {
    (() => __awaiter(this, void 0, void 0, function* () {
      if (isNode && !fs2)
        yield loadNodeDeps();
      if (isNode && fs2) {
        rel.data = IMG_BROKEN;
        imageProms.push(Promise.resolve("done"));
      } else {
        imageProms.push(createSvgPngPreview(rel));
      }
    }))();
  });
  return imageProms;
}
function createSvgPngPreview(rel) {
  return __awaiter(this, void 0, void 0, function* () {
    return yield new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (image.width + image.height === 0) {
          image.onerror("h/w=0");
        }
        let canvas = document.createElement("CANVAS");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        try {
          rel.data = canvas.toDataURL(rel.type);
          resolve("done");
        } catch (ex) {
          image.onerror(ex.toString());
        }
        canvas = null;
      };
      image.onerror = () => {
        rel.data = IMG_BROKEN;
        reject(new Error(`ERROR! Unable to load image (image.onerror): ${rel.path}`));
      };
      image.src = typeof rel.data === "string" ? rel.data : IMG_BROKEN;
    });
  });
}
var ImageSizingXml = {
  cover: function(imgSize, boxDim) {
    const imgRatio = imgSize.h / imgSize.w;
    const boxRatio = boxDim.h / boxDim.w;
    const isBoxBased = boxRatio > imgRatio;
    const width = isBoxBased ? boxDim.h / imgRatio : boxDim.w;
    const height = isBoxBased ? boxDim.h : boxDim.w * imgRatio;
    const hzPerc = Math.round(1e5 * 0.5 * (1 - boxDim.w / width));
    const vzPerc = Math.round(1e5 * 0.5 * (1 - boxDim.h / height));
    return `<a:srcRect l="${hzPerc}" r="${hzPerc}" t="${vzPerc}" b="${vzPerc}"/><a:stretch/>`;
  },
  contain: function(imgSize, boxDim) {
    const imgRatio = imgSize.h / imgSize.w;
    const boxRatio = boxDim.h / boxDim.w;
    const widthBased = boxRatio > imgRatio;
    const width = widthBased ? boxDim.w : boxDim.h / imgRatio;
    const height = widthBased ? boxDim.w * imgRatio : boxDim.h;
    const hzPerc = Math.round(1e5 * 0.5 * (1 - boxDim.w / width));
    const vzPerc = Math.round(1e5 * 0.5 * (1 - boxDim.h / height));
    return `<a:srcRect l="${hzPerc}" r="${hzPerc}" t="${vzPerc}" b="${vzPerc}"/><a:stretch/>`;
  },
  crop: function(imgSize, boxDim) {
    const l = boxDim.x;
    const r = imgSize.w - (boxDim.x + boxDim.w);
    const t = boxDim.y;
    const b = imgSize.h - (boxDim.y + boxDim.h);
    const lPerc = Math.round(1e5 * (l / imgSize.w));
    const rPerc = Math.round(1e5 * (r / imgSize.w));
    const tPerc = Math.round(1e5 * (t / imgSize.h));
    const bPerc = Math.round(1e5 * (b / imgSize.h));
    return `<a:srcRect l="${lPerc}" r="${rPerc}" t="${tPerc}" b="${bPerc}"/><a:stretch/>`;
  }
};
function slideObjectToXml(slide2) {
  var _a;
  let strSlideXml = slide2._name ? '<p:cSld name="' + slide2._name + '">' : "<p:cSld>";
  let intTableNum = 1;
  if (slide2._bkgdImgRid) {
    strSlideXml += `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="rId${slide2._bkgdImgRid}"><a:lum/></a:blip><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>`;
  } else if ((_a = slide2.background) === null || _a === void 0 ? void 0 : _a.color) {
    strSlideXml += `<p:bg><p:bgPr>${genXmlColorSelection(slide2.background)}</p:bgPr></p:bg>`;
  } else if (!slide2.bkgd && slide2._name && slide2._name === DEF_PRES_LAYOUT_NAME) {
    strSlideXml += '<p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>';
  }
  strSlideXml += "<p:spTree>";
  strSlideXml += '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>';
  strSlideXml += '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>';
  strSlideXml += '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  slide2._slideObjects.forEach((slideItemObj, idx) => {
    var _a2, _b, _c, _d, _e, _f, _g, _h;
    let x = 0;
    let y = 0;
    let cx = getSmartParseNumber("75%", "X", slide2._presLayout);
    let cy = 0;
    let placeholderObj;
    let locationAttr = "";
    let arrTabRows = null;
    let objTabOpts = null;
    let intColCnt = 0;
    let intColW = 0;
    let cellOpts = null;
    let strXml = null;
    const sizing = (_a2 = slideItemObj.options) === null || _a2 === void 0 ? void 0 : _a2.sizing;
    const rounding = (_b = slideItemObj.options) === null || _b === void 0 ? void 0 : _b.rounding;
    if (slide2._slideLayout !== void 0 && slide2._slideLayout._slideObjects !== void 0 && slideItemObj.options && slideItemObj.options.placeholder) {
      placeholderObj = slide2._slideLayout._slideObjects.filter((object) => object.options.placeholder === slideItemObj.options.placeholder)[0];
    }
    slideItemObj.options = slideItemObj.options || {};
    if (typeof slideItemObj.options.x !== "undefined")
      x = getSmartParseNumber(slideItemObj.options.x, "X", slide2._presLayout);
    if (typeof slideItemObj.options.y !== "undefined")
      y = getSmartParseNumber(slideItemObj.options.y, "Y", slide2._presLayout);
    if (typeof slideItemObj.options.w !== "undefined")
      cx = getSmartParseNumber(slideItemObj.options.w, "X", slide2._presLayout);
    if (typeof slideItemObj.options.h !== "undefined")
      cy = getSmartParseNumber(slideItemObj.options.h, "Y", slide2._presLayout);
    let imgWidth = cx;
    let imgHeight = cy;
    if (placeholderObj) {
      if (placeholderObj.options.x || placeholderObj.options.x === 0)
        x = getSmartParseNumber(placeholderObj.options.x, "X", slide2._presLayout);
      if (placeholderObj.options.y || placeholderObj.options.y === 0)
        y = getSmartParseNumber(placeholderObj.options.y, "Y", slide2._presLayout);
      if (placeholderObj.options.w || placeholderObj.options.w === 0)
        cx = getSmartParseNumber(placeholderObj.options.w, "X", slide2._presLayout);
      if (placeholderObj.options.h || placeholderObj.options.h === 0)
        cy = getSmartParseNumber(placeholderObj.options.h, "Y", slide2._presLayout);
    }
    if (slideItemObj.options.flipH)
      locationAttr += ' flipH="1"';
    if (slideItemObj.options.flipV)
      locationAttr += ' flipV="1"';
    if (slideItemObj.options.rotate)
      locationAttr += ` rot="${convertRotationDegrees(slideItemObj.options.rotate)}"`;
    switch (slideItemObj._type) {
      case SLIDE_OBJECT_TYPES.table:
        arrTabRows = slideItemObj.arrTabRows;
        objTabOpts = slideItemObj.options;
        intColCnt = 0;
        intColW = 0;
        arrTabRows[0].forEach((cell) => {
          cellOpts = cell.options || null;
          intColCnt += (cellOpts === null || cellOpts === void 0 ? void 0 : cellOpts.colspan) ? Number(cellOpts.colspan) : 1;
        });
        strXml = `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${intTableNum * slide2._slideNum + 1}" name="${slideItemObj.options.objectName}"/>`;
        strXml += '<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>  <p:nvPr><p:extLst><p:ext uri="{D42A27DB-BD31-4B8C-83A1-F6EECF244321}"><p14:modId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="1579011935"/></p:ext></p:extLst></p:nvPr></p:nvGraphicFramePr>';
        strXml += `<p:xfrm><a:off x="${x || (x === 0 ? 0 : EMU)}" y="${y || (y === 0 ? 0 : EMU)}"/><a:ext cx="${cx || (cx === 0 ? 0 : EMU)}" cy="${cy || EMU}"/></p:xfrm>`;
        strXml += '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr/>';
        if (Array.isArray(objTabOpts.colW)) {
          strXml += "<a:tblGrid>";
          for (let col = 0; col < intColCnt; col++) {
            let w = inch2Emu(objTabOpts.colW[col]);
            if (w == null || isNaN(w)) {
              w = (typeof slideItemObj.options.w === "number" ? slideItemObj.options.w : 1) / intColCnt;
            }
            strXml += `<a:gridCol w="${Math.round(w)}"/>`;
          }
          strXml += "</a:tblGrid>";
        } else {
          intColW = objTabOpts.colW ? objTabOpts.colW : EMU;
          if (slideItemObj.options.w && !objTabOpts.colW)
            intColW = Math.round((typeof slideItemObj.options.w === "number" ? slideItemObj.options.w : 1) / intColCnt);
          strXml += "<a:tblGrid>";
          for (let colw = 0; colw < intColCnt; colw++) {
            strXml += `<a:gridCol w="${intColW}"/>`;
          }
          strXml += "</a:tblGrid>";
        }
        arrTabRows.forEach((cells) => {
          var _a3, _b2;
          for (let cIdx = 0; cIdx < cells.length; ) {
            const cell = cells[cIdx];
            const colspan = (_a3 = cell.options) === null || _a3 === void 0 ? void 0 : _a3.colspan;
            const rowspan = (_b2 = cell.options) === null || _b2 === void 0 ? void 0 : _b2.rowspan;
            if (colspan && colspan > 1) {
              const vMergeCells = new Array(colspan - 1).fill(void 0).map(() => {
                return { _type: SLIDE_OBJECT_TYPES.tablecell, options: { rowspan }, _hmerge: true };
              });
              cells.splice(cIdx + 1, 0, ...vMergeCells);
              cIdx += colspan;
            } else {
              cIdx += 1;
            }
          }
        });
        arrTabRows.forEach((cells, rIdx) => {
          const nextRow = arrTabRows[rIdx + 1];
          if (!nextRow)
            return;
          cells.forEach((cell, cIdx) => {
            var _a3, _b2;
            const rowspan = cell._rowContinue || ((_a3 = cell.options) === null || _a3 === void 0 ? void 0 : _a3.rowspan);
            const colspan = (_b2 = cell.options) === null || _b2 === void 0 ? void 0 : _b2.colspan;
            const _hmerge = cell._hmerge;
            if (rowspan && rowspan > 1) {
              const hMergeCell = { _type: SLIDE_OBJECT_TYPES.tablecell, options: { colspan }, _rowContinue: rowspan - 1, _vmerge: true, _hmerge };
              nextRow.splice(cIdx, 0, hMergeCell);
            }
          });
        });
        arrTabRows.forEach((cells, rIdx) => {
          let intRowH = 0;
          if (Array.isArray(objTabOpts.rowH) && objTabOpts.rowH[rIdx])
            intRowH = inch2Emu(Number(objTabOpts.rowH[rIdx]));
          else if (objTabOpts.rowH && !isNaN(Number(objTabOpts.rowH)))
            intRowH = inch2Emu(Number(objTabOpts.rowH));
          else if (slideItemObj.options.cy || slideItemObj.options.h) {
            intRowH = Math.round((slideItemObj.options.h ? inch2Emu(slideItemObj.options.h) : typeof slideItemObj.options.cy === "number" ? slideItemObj.options.cy : 1) / arrTabRows.length);
          }
          strXml += `<a:tr h="${intRowH}">`;
          cells.forEach((cellObj) => {
            var _a3, _b2, _c2, _d2, _e2;
            const cell = cellObj;
            const cellSpanAttrs = {
              rowSpan: ((_a3 = cell.options) === null || _a3 === void 0 ? void 0 : _a3.rowspan) > 1 ? cell.options.rowspan : void 0,
              gridSpan: ((_b2 = cell.options) === null || _b2 === void 0 ? void 0 : _b2.colspan) > 1 ? cell.options.colspan : void 0,
              vMerge: cell._vmerge ? 1 : void 0,
              hMerge: cell._hmerge ? 1 : void 0
            };
            let cellSpanAttrStr = Object.keys(cellSpanAttrs).map((k) => [k, cellSpanAttrs[k]]).filter(([, v]) => !!v).map(([k, v]) => `${String(k)}="${String(v)}"`).join(" ");
            if (cellSpanAttrStr)
              cellSpanAttrStr = " " + cellSpanAttrStr;
            if (cell._hmerge || cell._vmerge) {
              strXml += `<a:tc${cellSpanAttrStr}><a:tcPr/></a:tc>`;
              return;
            }
            const cellOpts2 = cell.options || {};
            cell.options = cellOpts2;
            ["align", "bold", "border", "color", "fill", "fontFace", "fontSize", "margin", "textDirection", "underline", "valign"].forEach((name) => {
              if (objTabOpts[name] && !cellOpts2[name] && cellOpts2[name] !== 0)
                cellOpts2[name] = objTabOpts[name];
            });
            const cellValign = cellOpts2.valign ? ` anchor="${cellOpts2.valign.replace(/^c$/i, "ctr").replace(/^m$/i, "ctr").replace("center", "ctr").replace("middle", "ctr").replace("top", "t").replace("btm", "b").replace("bottom", "b")}"` : "";
            const cellTextDir = cellOpts2.textDirection && cellOpts2.textDirection !== "horz" ? ` vert="${cellOpts2.textDirection}"` : "";
            let fillColor = ((_d2 = (_c2 = cell._optImp) === null || _c2 === void 0 ? void 0 : _c2.fill) === null || _d2 === void 0 ? void 0 : _d2.color) ? cell._optImp.fill.color : ((_e2 = cell._optImp) === null || _e2 === void 0 ? void 0 : _e2.fill) && typeof cell._optImp.fill === "string" ? cell._optImp.fill : "";
            fillColor = fillColor || cellOpts2.fill ? cellOpts2.fill : "";
            const cellFill = fillColor ? genXmlColorSelection(fillColor) : "";
            let cellMargin = cellOpts2.margin === 0 || cellOpts2.margin ? cellOpts2.margin : DEF_CELL_MARGIN_IN;
            if (!Array.isArray(cellMargin) && typeof cellMargin === "number")
              cellMargin = [cellMargin, cellMargin, cellMargin, cellMargin];
            let cellMarginXml = "";
            if (cellMargin[0] >= 1) {
              cellMarginXml = ` marL="${valToPts(cellMargin[3])}" marR="${valToPts(cellMargin[1])}" marT="${valToPts(cellMargin[0])}" marB="${valToPts(cellMargin[2])}"`;
            } else {
              cellMarginXml = ` marL="${inch2Emu(cellMargin[3])}" marR="${inch2Emu(cellMargin[1])}" marT="${inch2Emu(cellMargin[0])}" marB="${inch2Emu(cellMargin[2])}"`;
            }
            strXml += `<a:tc${cellSpanAttrStr}>${genXmlTextBody(cell)}<a:tcPr${cellMarginXml}${cellValign}${cellTextDir}>`;
            if (cellOpts2.border && Array.isArray(cellOpts2.border)) {
              [
                { idx: 3, name: "lnL" },
                { idx: 1, name: "lnR" },
                { idx: 0, name: "lnT" },
                { idx: 2, name: "lnB" }
              ].forEach((obj) => {
                if (cellOpts2.border[obj.idx].type !== "none") {
                  strXml += `<a:${obj.name} w="${valToPts(cellOpts2.border[obj.idx].pt)}" cap="flat" cmpd="sng" algn="ctr">`;
                  strXml += `<a:solidFill>${createColorElement(cellOpts2.border[obj.idx].color)}</a:solidFill>`;
                  strXml += `<a:prstDash val="${cellOpts2.border[obj.idx].type === "dash" ? "sysDash" : "solid"}"/><a:round/><a:headEnd type="none" w="med" len="med"/><a:tailEnd type="none" w="med" len="med"/>`;
                  strXml += `</a:${obj.name}>`;
                } else {
                  strXml += `<a:${obj.name} w="0" cap="flat" cmpd="sng" algn="ctr"><a:noFill/></a:${obj.name}>`;
                }
              });
            }
            strXml += cellFill;
            strXml += "  </a:tcPr>";
            strXml += " </a:tc>";
          });
          strXml += "</a:tr>";
        });
        strXml += "      </a:tbl>";
        strXml += "    </a:graphicData>";
        strXml += "  </a:graphic>";
        strXml += "</p:graphicFrame>";
        strSlideXml += strXml;
        intTableNum++;
        break;
      case SLIDE_OBJECT_TYPES.text:
      case SLIDE_OBJECT_TYPES.placeholder:
        if (!slideItemObj.options.line && cy === 0)
          cy = EMU * 0.3;
        if (!slideItemObj.options._bodyProp)
          slideItemObj.options._bodyProp = {};
        if (slideItemObj.options.margin && Array.isArray(slideItemObj.options.margin)) {
          slideItemObj.options._bodyProp.lIns = valToPts(slideItemObj.options.margin[0] || 0);
          slideItemObj.options._bodyProp.rIns = valToPts(slideItemObj.options.margin[1] || 0);
          slideItemObj.options._bodyProp.bIns = valToPts(slideItemObj.options.margin[2] || 0);
          slideItemObj.options._bodyProp.tIns = valToPts(slideItemObj.options.margin[3] || 0);
        } else if (typeof slideItemObj.options.margin === "number") {
          slideItemObj.options._bodyProp.lIns = valToPts(slideItemObj.options.margin);
          slideItemObj.options._bodyProp.rIns = valToPts(slideItemObj.options.margin);
          slideItemObj.options._bodyProp.bIns = valToPts(slideItemObj.options.margin);
          slideItemObj.options._bodyProp.tIns = valToPts(slideItemObj.options.margin);
        }
        strSlideXml += "<p:sp>";
        strSlideXml += `<p:nvSpPr><p:cNvPr id="${idx + 2}" name="${slideItemObj.options.objectName}">`;
        if ((_c = slideItemObj.options.hyperlink) === null || _c === void 0 ? void 0 : _c.url) {
          strSlideXml += `<a:hlinkClick r:id="rId${slideItemObj.options.hyperlink._rId}" tooltip="${slideItemObj.options.hyperlink.tooltip ? encodeXmlEntities(slideItemObj.options.hyperlink.tooltip) : ""}"/>`;
        }
        if ((_d = slideItemObj.options.hyperlink) === null || _d === void 0 ? void 0 : _d.slide) {
          strSlideXml += `<a:hlinkClick r:id="rId${slideItemObj.options.hyperlink._rId}" tooltip="${slideItemObj.options.hyperlink.tooltip ? encodeXmlEntities(slideItemObj.options.hyperlink.tooltip) : ""}" action="ppaction://hlinksldjump"/>`;
        }
        strSlideXml += "</p:cNvPr>";
        strSlideXml += "<p:cNvSpPr" + (((_e = slideItemObj.options) === null || _e === void 0 ? void 0 : _e.isTextBox) ? ' txBox="1"/>' : "/>");
        strSlideXml += `<p:nvPr>${slideItemObj._type === "placeholder" ? genXmlPlaceholder(slideItemObj) : genXmlPlaceholder(placeholderObj)}</p:nvPr>`;
        strSlideXml += "</p:nvSpPr><p:spPr>";
        strSlideXml += `<a:xfrm${locationAttr}>`;
        strSlideXml += `<a:off x="${x}" y="${y}"/>`;
        strSlideXml += `<a:ext cx="${cx}" cy="${cy}"/></a:xfrm>`;
        if (slideItemObj.shape === "custGeom") {
          strSlideXml += "<a:custGeom><a:avLst />";
          strSlideXml += "<a:gdLst>";
          strSlideXml += "</a:gdLst>";
          strSlideXml += "<a:ahLst />";
          strSlideXml += "<a:cxnLst>";
          strSlideXml += "</a:cxnLst>";
          strSlideXml += '<a:rect l="l" t="t" r="r" b="b" />';
          strSlideXml += "<a:pathLst>";
          strSlideXml += `<a:path w="${cx}" h="${cy}">`;
          (_f = slideItemObj.options.points) === null || _f === void 0 ? void 0 : _f.forEach((point, i) => {
            if ("curve" in point) {
              switch (point.curve.type) {
                case "arc":
                  strSlideXml += `<a:arcTo hR="${getSmartParseNumber(point.curve.hR, "Y", slide2._presLayout)}" wR="${getSmartParseNumber(point.curve.wR, "X", slide2._presLayout)}" stAng="${convertRotationDegrees(point.curve.stAng)}" swAng="${convertRotationDegrees(point.curve.swAng)}" />`;
                  break;
                case "cubic":
                  strSlideXml += `<a:cubicBezTo>
									<a:pt x="${getSmartParseNumber(point.curve.x1, "X", slide2._presLayout)}" y="${getSmartParseNumber(point.curve.y1, "Y", slide2._presLayout)}" />
									<a:pt x="${getSmartParseNumber(point.curve.x2, "X", slide2._presLayout)}" y="${getSmartParseNumber(point.curve.y2, "Y", slide2._presLayout)}" />
									<a:pt x="${getSmartParseNumber(point.x, "X", slide2._presLayout)}" y="${getSmartParseNumber(point.y, "Y", slide2._presLayout)}" />
									</a:cubicBezTo>`;
                  break;
                case "quadratic":
                  strSlideXml += `<a:quadBezTo>
									<a:pt x="${getSmartParseNumber(point.curve.x1, "X", slide2._presLayout)}" y="${getSmartParseNumber(point.curve.y1, "Y", slide2._presLayout)}" />
									<a:pt x="${getSmartParseNumber(point.x, "X", slide2._presLayout)}" y="${getSmartParseNumber(point.y, "Y", slide2._presLayout)}" />
									</a:quadBezTo>`;
                  break;
              }
            } else if ("close" in point) {
              strSlideXml += "<a:close />";
            } else if (point.moveTo || i === 0) {
              strSlideXml += `<a:moveTo><a:pt x="${getSmartParseNumber(point.x, "X", slide2._presLayout)}" y="${getSmartParseNumber(point.y, "Y", slide2._presLayout)}" /></a:moveTo>`;
            } else {
              strSlideXml += `<a:lnTo><a:pt x="${getSmartParseNumber(point.x, "X", slide2._presLayout)}" y="${getSmartParseNumber(point.y, "Y", slide2._presLayout)}" /></a:lnTo>`;
            }
          });
          strSlideXml += "</a:path>";
          strSlideXml += "</a:pathLst>";
          strSlideXml += "</a:custGeom>";
        } else {
          strSlideXml += '<a:prstGeom prst="' + slideItemObj.shape + '"><a:avLst>';
          if (slideItemObj.options.rectRadius) {
            strSlideXml += `<a:gd name="adj" fmla="val ${Math.round(slideItemObj.options.rectRadius * EMU * 1e5 / Math.min(cx, cy))}"/>`;
          } else if (slideItemObj.options.angleRange) {
            for (let i = 0; i < 2; i++) {
              const angle = slideItemObj.options.angleRange[i];
              strSlideXml += `<a:gd name="adj${i + 1}" fmla="val ${convertRotationDegrees(angle)}" />`;
            }
            if (slideItemObj.options.arcThicknessRatio) {
              strSlideXml += `<a:gd name="adj3" fmla="val ${Math.round(slideItemObj.options.arcThicknessRatio * 5e4)}" />`;
            }
          }
          strSlideXml += "</a:avLst></a:prstGeom>";
        }
        strSlideXml += slideItemObj.options.fill ? genXmlColorSelection(slideItemObj.options.fill) : "<a:noFill/>";
        if (slideItemObj.options.line) {
          strSlideXml += slideItemObj.options.line.width ? `<a:ln w="${valToPts(slideItemObj.options.line.width)}">` : "<a:ln>";
          if (slideItemObj.options.line.color)
            strSlideXml += genXmlColorSelection(slideItemObj.options.line);
          if (slideItemObj.options.line.dashType)
            strSlideXml += `<a:prstDash val="${slideItemObj.options.line.dashType}"/>`;
          if (slideItemObj.options.line.beginArrowType)
            strSlideXml += `<a:headEnd type="${slideItemObj.options.line.beginArrowType}"/>`;
          if (slideItemObj.options.line.endArrowType)
            strSlideXml += `<a:tailEnd type="${slideItemObj.options.line.endArrowType}"/>`;
          strSlideXml += "</a:ln>";
        }
        if (slideItemObj.options.shadow && slideItemObj.options.shadow.type !== "none") {
          slideItemObj.options.shadow.type = slideItemObj.options.shadow.type || "outer";
          slideItemObj.options.shadow.blur = valToPts(slideItemObj.options.shadow.blur || 8);
          slideItemObj.options.shadow.offset = valToPts(slideItemObj.options.shadow.offset || 4);
          slideItemObj.options.shadow.angle = Math.round((slideItemObj.options.shadow.angle || 270) * 6e4);
          slideItemObj.options.shadow.opacity = Math.round((slideItemObj.options.shadow.opacity || 0.75) * 1e5);
          slideItemObj.options.shadow.color = slideItemObj.options.shadow.color || DEF_TEXT_SHADOW.color;
          strSlideXml += "<a:effectLst>";
          strSlideXml += ` <a:${slideItemObj.options.shadow.type}Shdw ${slideItemObj.options.shadow.type === "outer" ? 'sx="100000" sy="100000" kx="0" ky="0" algn="bl" rotWithShape="0"' : ""} blurRad="${slideItemObj.options.shadow.blur}" dist="${slideItemObj.options.shadow.offset}" dir="${slideItemObj.options.shadow.angle}">`;
          strSlideXml += ` <a:srgbClr val="${slideItemObj.options.shadow.color}">`;
          strSlideXml += ` <a:alpha val="${slideItemObj.options.shadow.opacity}"/></a:srgbClr>`;
          strSlideXml += " </a:outerShdw>";
          strSlideXml += "</a:effectLst>";
        }
        strSlideXml += "</p:spPr>";
        strSlideXml += genXmlTextBody(slideItemObj);
        strSlideXml += "</p:sp>";
        break;
      case SLIDE_OBJECT_TYPES.image:
        strSlideXml += "<p:pic>";
        strSlideXml += "  <p:nvPicPr>";
        strSlideXml += `<p:cNvPr id="${idx + 2}" name="${slideItemObj.options.objectName}" descr="${encodeXmlEntities(slideItemObj.options.altText || slideItemObj.image)}">`;
        if ((_g = slideItemObj.hyperlink) === null || _g === void 0 ? void 0 : _g.url) {
          strSlideXml += `<a:hlinkClick r:id="rId${slideItemObj.hyperlink._rId}" tooltip="${slideItemObj.hyperlink.tooltip ? encodeXmlEntities(slideItemObj.hyperlink.tooltip) : ""}"/>`;
        }
        if ((_h = slideItemObj.hyperlink) === null || _h === void 0 ? void 0 : _h.slide) {
          strSlideXml += `<a:hlinkClick r:id="rId${slideItemObj.hyperlink._rId}" tooltip="${slideItemObj.hyperlink.tooltip ? encodeXmlEntities(slideItemObj.hyperlink.tooltip) : ""}" action="ppaction://hlinksldjump"/>`;
        }
        strSlideXml += "    </p:cNvPr>";
        strSlideXml += '    <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>';
        strSlideXml += "    <p:nvPr>" + genXmlPlaceholder(placeholderObj) + "</p:nvPr>";
        strSlideXml += "  </p:nvPicPr>";
        strSlideXml += "<p:blipFill>";
        if ((slide2._relsMedia || []).filter((rel) => rel.rId === slideItemObj.imageRid)[0] && (slide2._relsMedia || []).filter((rel) => rel.rId === slideItemObj.imageRid)[0].extn === "svg") {
          strSlideXml += `<a:blip r:embed="rId${slideItemObj.imageRid - 1}">`;
          strSlideXml += slideItemObj.options.transparency ? ` <a:alphaModFix amt="${Math.round((100 - slideItemObj.options.transparency) * 1e3)}"/>` : "";
          strSlideXml += " <a:extLst>";
          strSlideXml += '  <a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}">';
          strSlideXml += `   <asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="rId${slideItemObj.imageRid}"/>`;
          strSlideXml += "  </a:ext>";
          strSlideXml += " </a:extLst>";
          strSlideXml += "</a:blip>";
        } else {
          strSlideXml += `<a:blip r:embed="rId${slideItemObj.imageRid}">`;
          strSlideXml += slideItemObj.options.transparency ? `<a:alphaModFix amt="${Math.round((100 - slideItemObj.options.transparency) * 1e3)}"/>` : "";
          strSlideXml += "</a:blip>";
        }
        if (sizing === null || sizing === void 0 ? void 0 : sizing.type) {
          const boxW = sizing.w ? getSmartParseNumber(sizing.w, "X", slide2._presLayout) : cx;
          const boxH = sizing.h ? getSmartParseNumber(sizing.h, "Y", slide2._presLayout) : cy;
          const boxX = getSmartParseNumber(sizing.x || 0, "X", slide2._presLayout);
          const boxY = getSmartParseNumber(sizing.y || 0, "Y", slide2._presLayout);
          strSlideXml += ImageSizingXml[sizing.type]({ w: imgWidth, h: imgHeight }, { w: boxW, h: boxH, x: boxX, y: boxY });
          imgWidth = boxW;
          imgHeight = boxH;
        } else {
          strSlideXml += "  <a:stretch><a:fillRect/></a:stretch>";
        }
        strSlideXml += "</p:blipFill>";
        strSlideXml += "<p:spPr>";
        strSlideXml += " <a:xfrm" + locationAttr + ">";
        strSlideXml += `  <a:off x="${x}" y="${y}"/>`;
        strSlideXml += `  <a:ext cx="${imgWidth}" cy="${imgHeight}"/>`;
        strSlideXml += " </a:xfrm>";
        strSlideXml += ` <a:prstGeom prst="${rounding ? "ellipse" : "rect"}"><a:avLst/></a:prstGeom>`;
        if (slideItemObj.options.shadow && slideItemObj.options.shadow.type !== "none") {
          slideItemObj.options.shadow.type = slideItemObj.options.shadow.type || "outer";
          slideItemObj.options.shadow.blur = valToPts(slideItemObj.options.shadow.blur || 8);
          slideItemObj.options.shadow.offset = valToPts(slideItemObj.options.shadow.offset || 4);
          slideItemObj.options.shadow.angle = Math.round((slideItemObj.options.shadow.angle || 270) * 6e4);
          slideItemObj.options.shadow.opacity = Math.round((slideItemObj.options.shadow.opacity || 0.75) * 1e5);
          slideItemObj.options.shadow.color = slideItemObj.options.shadow.color || DEF_TEXT_SHADOW.color;
          strSlideXml += "<a:effectLst>";
          strSlideXml += `<a:${slideItemObj.options.shadow.type}Shdw ${slideItemObj.options.shadow.type === "outer" ? 'sx="100000" sy="100000" kx="0" ky="0" algn="bl" rotWithShape="0"' : ""} blurRad="${slideItemObj.options.shadow.blur}" dist="${slideItemObj.options.shadow.offset}" dir="${slideItemObj.options.shadow.angle}">`;
          strSlideXml += `<a:srgbClr val="${slideItemObj.options.shadow.color}">`;
          strSlideXml += `<a:alpha val="${slideItemObj.options.shadow.opacity}"/></a:srgbClr>`;
          strSlideXml += `</a:${slideItemObj.options.shadow.type}Shdw>`;
          strSlideXml += "</a:effectLst>";
        }
        strSlideXml += "</p:spPr>";
        strSlideXml += "</p:pic>";
        break;
      case SLIDE_OBJECT_TYPES.media:
        if (slideItemObj.mtype === "online") {
          strSlideXml += "<p:pic>";
          strSlideXml += " <p:nvPicPr>";
          strSlideXml += `<p:cNvPr id="${slideItemObj.mediaRid + 2}" name="${slideItemObj.options.objectName}"/>`;
          strSlideXml += " <p:cNvPicPr/>";
          strSlideXml += " <p:nvPr>";
          strSlideXml += `  <a:videoFile r:link="rId${slideItemObj.mediaRid}"/>`;
          strSlideXml += " </p:nvPr>";
          strSlideXml += " </p:nvPicPr>";
          strSlideXml += ` <p:blipFill><a:blip r:embed="rId${slideItemObj.mediaRid + 1}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
          strSlideXml += " <p:spPr>";
          strSlideXml += `  <a:xfrm${locationAttr}><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>`;
          strSlideXml += '  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
          strSlideXml += " </p:spPr>";
          strSlideXml += "</p:pic>";
        } else {
          strSlideXml += "<p:pic>";
          strSlideXml += " <p:nvPicPr>";
          strSlideXml += `<p:cNvPr id="${slideItemObj.mediaRid + 2}" name="${slideItemObj.options.objectName}"><a:hlinkClick r:id="" action="ppaction://media"/></p:cNvPr>`;
          strSlideXml += ' <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>';
          strSlideXml += " <p:nvPr>";
          strSlideXml += `  <a:videoFile r:link="rId${slideItemObj.mediaRid}"/>`;
          strSlideXml += "  <p:extLst>";
          strSlideXml += '   <p:ext uri="{DAA4B4D4-6D71-4841-9C94-3DE7FCFB9230}">';
          strSlideXml += `    <p14:media xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" r:embed="rId${slideItemObj.mediaRid + 1}"/>`;
          strSlideXml += "   </p:ext>";
          strSlideXml += "  </p:extLst>";
          strSlideXml += " </p:nvPr>";
          strSlideXml += " </p:nvPicPr>";
          strSlideXml += ` <p:blipFill><a:blip r:embed="rId${slideItemObj.mediaRid + 2}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
          strSlideXml += " <p:spPr>";
          strSlideXml += `  <a:xfrm${locationAttr}><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>`;
          strSlideXml += '  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
          strSlideXml += " </p:spPr>";
          strSlideXml += "</p:pic>";
        }
        break;
      case SLIDE_OBJECT_TYPES.chart:
        strSlideXml += "<p:graphicFrame>";
        strSlideXml += " <p:nvGraphicFramePr>";
        strSlideXml += `   <p:cNvPr id="${idx + 2}" name="${slideItemObj.options.objectName}" descr="${encodeXmlEntities(slideItemObj.options.altText || "")}"/>`;
        strSlideXml += "   <p:cNvGraphicFramePr/>";
        strSlideXml += `   <p:nvPr>${genXmlPlaceholder(placeholderObj)}</p:nvPr>`;
        strSlideXml += " </p:nvGraphicFramePr>";
        strSlideXml += ` <p:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></p:xfrm>`;
        strSlideXml += ' <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">';
        strSlideXml += '  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">';
        strSlideXml += `   <c:chart r:id="rId${slideItemObj.chartRid}" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"/>`;
        strSlideXml += "  </a:graphicData>";
        strSlideXml += " </a:graphic>";
        strSlideXml += "</p:graphicFrame>";
        break;
      default:
        strSlideXml += "";
        break;
    }
  });
  if (slide2._slideNumberProps) {
    if (!slide2._slideNumberProps.align)
      slide2._slideNumberProps.align = "left";
    strSlideXml += "<p:sp>";
    strSlideXml += " <p:nvSpPr>";
    strSlideXml += '  <p:cNvPr id="25" name="Slide Number Placeholder 0"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>';
    strSlideXml += '  <p:nvPr><p:ph type="sldNum" sz="quarter" idx="4294967295"/></p:nvPr>';
    strSlideXml += " </p:nvSpPr>";
    strSlideXml += " <p:spPr>";
    strSlideXml += `<a:xfrm><a:off x="${getSmartParseNumber(slide2._slideNumberProps.x, "X", slide2._presLayout)}" y="${getSmartParseNumber(slide2._slideNumberProps.y, "Y", slide2._presLayout)}"/><a:ext cx="${slide2._slideNumberProps.w ? getSmartParseNumber(slide2._slideNumberProps.w, "X", slide2._presLayout) : "800000"}" cy="${slide2._slideNumberProps.h ? getSmartParseNumber(slide2._slideNumberProps.h, "Y", slide2._presLayout) : "300000"}"/></a:xfrm> <a:prstGeom prst="rect"><a:avLst/></a:prstGeom> <a:extLst><a:ext uri="{C572A759-6A51-4108-AA02-DFA0A04FC94B}"><ma14:wrappingTextBoxFlag val="0" xmlns:ma14="http://schemas.microsoft.com/office/mac/drawingml/2011/main"/></a:ext></a:extLst></p:spPr>`;
    strSlideXml += "<p:txBody>";
    strSlideXml += "<a:bodyPr";
    if (slide2._slideNumberProps.margin && Array.isArray(slide2._slideNumberProps.margin)) {
      strSlideXml += ` lIns="${valToPts(slide2._slideNumberProps.margin[3] || 0)}"`;
      strSlideXml += ` tIns="${valToPts(slide2._slideNumberProps.margin[0] || 0)}"`;
      strSlideXml += ` rIns="${valToPts(slide2._slideNumberProps.margin[1] || 0)}"`;
      strSlideXml += ` bIns="${valToPts(slide2._slideNumberProps.margin[2] || 0)}"`;
    } else if (typeof slide2._slideNumberProps.margin === "number") {
      strSlideXml += ` lIns="${valToPts(slide2._slideNumberProps.margin || 0)}"`;
      strSlideXml += ` tIns="${valToPts(slide2._slideNumberProps.margin || 0)}"`;
      strSlideXml += ` rIns="${valToPts(slide2._slideNumberProps.margin || 0)}"`;
      strSlideXml += ` bIns="${valToPts(slide2._slideNumberProps.margin || 0)}"`;
    }
    if (slide2._slideNumberProps.valign) {
      strSlideXml += ` anchor="${slide2._slideNumberProps.valign.replace("top", "t").replace("middle", "ctr").replace("bottom", "b")}"`;
    }
    strSlideXml += "/>";
    strSlideXml += "  <a:lstStyle><a:lvl1pPr>";
    if (slide2._slideNumberProps.fontFace || slide2._slideNumberProps.fontSize || slide2._slideNumberProps.color) {
      strSlideXml += `<a:defRPr sz="${Math.round((slide2._slideNumberProps.fontSize || 12) * 100)}">`;
      if (slide2._slideNumberProps.color)
        strSlideXml += genXmlColorSelection(slide2._slideNumberProps.color);
      if (slide2._slideNumberProps.fontFace) {
        strSlideXml += `<a:latin typeface="${slide2._slideNumberProps.fontFace}"/><a:ea typeface="${slide2._slideNumberProps.fontFace}"/><a:cs typeface="${slide2._slideNumberProps.fontFace}"/>`;
      }
      strSlideXml += "</a:defRPr>";
    }
    strSlideXml += "</a:lvl1pPr></a:lstStyle>";
    strSlideXml += "<a:p>";
    if (slide2._slideNumberProps.align.startsWith("l"))
      strSlideXml += '<a:pPr algn="l"/>';
    else if (slide2._slideNumberProps.align.startsWith("c"))
      strSlideXml += '<a:pPr algn="ctr"/>';
    else if (slide2._slideNumberProps.align.startsWith("r"))
      strSlideXml += '<a:pPr algn="r"/>';
    else
      strSlideXml += '<a:pPr algn="l"/>';
    strSlideXml += `<a:fld id="${SLDNUMFLDID}" type="slidenum"><a:rPr b="${slide2._slideNumberProps.bold ? 1 : 0}" lang="en-US"/>`;
    strSlideXml += `<a:t>${slide2._slideNum}</a:t></a:fld><a:endParaRPr lang="en-US"/></a:p>`;
    strSlideXml += "</p:txBody></p:sp>";
  }
  strSlideXml += "</p:spTree>";
  strSlideXml += "</p:cSld>";
  return strSlideXml;
}
function slideObjectRelationsToXml(slide2, defaultRels) {
  let lastRid = 0;
  let strXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + CRLF + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  slide2._rels.forEach((rel) => {
    lastRid = Math.max(lastRid, rel.rId);
    if (rel.type.toLowerCase().includes("hyperlink")) {
      if (rel.data === "slide") {
        strXml += `<Relationship Id="rId${rel.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slide${rel.Target}.xml"/>`;
      } else {
        strXml += `<Relationship Id="rId${rel.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${rel.Target}" TargetMode="External"/>`;
      }
    } else if (rel.type.toLowerCase().includes("notesSlide")) {
      strXml += `<Relationship Id="rId${rel.rId}" Target="${rel.Target}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"/>`;
    }
  });
  (slide2._relsChart || []).forEach((rel) => {
    lastRid = Math.max(lastRid, rel.rId);
    strXml += `<Relationship Id="rId${rel.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="${rel.Target}"/>`;
  });
  (slide2._relsMedia || []).forEach((rel) => {
    const relRid = rel.rId.toString();
    lastRid = Math.max(lastRid, rel.rId);
    if (rel.type.toLowerCase().includes("image")) {
      strXml += '<Relationship Id="rId' + relRid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="' + rel.Target + '"/>';
    } else if (rel.type.toLowerCase().includes("audio")) {
      if (strXml.includes(' Target="' + rel.Target + '"')) {
        strXml += '<Relationship Id="rId' + relRid + '" Type="http://schemas.microsoft.com/office/2007/relationships/media" Target="' + rel.Target + '"/>';
      } else {
        strXml += '<Relationship Id="rId' + relRid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio" Target="' + rel.Target + '"/>';
      }
    } else if (rel.type.toLowerCase().includes("video")) {
      if (strXml.includes(' Target="' + rel.Target + '"')) {
        strXml += '<Relationship Id="rId' + relRid + '" Type="http://schemas.microsoft.com/office/2007/relationships/media" Target="' + rel.Target + '"/>';
      } else {
        strXml += '<Relationship Id="rId' + relRid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/video" Target="' + rel.Target + '"/>';
      }
    } else if (rel.type.toLowerCase().includes("online")) {
      if (strXml.includes(' Target="' + rel.Target + '"')) {
        strXml += '<Relationship Id="rId' + relRid + '" Type="http://schemas.microsoft.com/office/2007/relationships/image" Target="' + rel.Target + '"/>';
      } else {
        strXml += '<Relationship Id="rId' + relRid + '" Target="' + rel.Target + '" TargetMode="External" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/video"/>';
      }
    }
  });
  defaultRels.forEach((rel, idx) => {
    strXml += `<Relationship Id="rId${lastRid + idx + 1}" Type="${rel.type}" Target="${rel.target}"/>`;
  });
  strXml += "</Relationships>";
  return strXml;
}
function genXmlParagraphProperties(textObj, isDefault) {
  var _a, _b;
  let strXmlBullet = "";
  let strXmlLnSpc = "";
  let strXmlParaSpc = "";
  let strXmlTabStops = "";
  const tag = isDefault ? "a:lvl1pPr" : "a:pPr";
  let bulletMarL = valToPts(DEF_BULLET_MARGIN);
  let paragraphPropXml = `<${tag}${textObj.options.rtlMode ? ' rtl="1" ' : ""}`;
  {
    if (textObj.options.align) {
      switch (textObj.options.align) {
        case "left":
          paragraphPropXml += ' algn="l"';
          break;
        case "right":
          paragraphPropXml += ' algn="r"';
          break;
        case "center":
          paragraphPropXml += ' algn="ctr"';
          break;
        case "justify":
          paragraphPropXml += ' algn="just"';
          break;
        default:
          paragraphPropXml += "";
          break;
      }
    }
    if (textObj.options.lineSpacing) {
      strXmlLnSpc = `<a:lnSpc><a:spcPts val="${Math.round(textObj.options.lineSpacing * 100)}"/></a:lnSpc>`;
    } else if (textObj.options.lineSpacingMultiple) {
      strXmlLnSpc = `<a:lnSpc><a:spcPct val="${Math.round(textObj.options.lineSpacingMultiple * 1e5)}"/></a:lnSpc>`;
    }
    if (textObj.options.indentLevel && !isNaN(Number(textObj.options.indentLevel)) && textObj.options.indentLevel > 0) {
      paragraphPropXml += ` lvl="${textObj.options.indentLevel}"`;
    }
    if (textObj.options.paraSpaceBefore && !isNaN(Number(textObj.options.paraSpaceBefore)) && textObj.options.paraSpaceBefore > 0) {
      strXmlParaSpc += `<a:spcBef><a:spcPts val="${Math.round(textObj.options.paraSpaceBefore * 100)}"/></a:spcBef>`;
    }
    if (textObj.options.paraSpaceAfter && !isNaN(Number(textObj.options.paraSpaceAfter)) && textObj.options.paraSpaceAfter > 0) {
      strXmlParaSpc += `<a:spcAft><a:spcPts val="${Math.round(textObj.options.paraSpaceAfter * 100)}"/></a:spcAft>`;
    }
    if (typeof textObj.options.bullet === "object") {
      if ((_b = (_a = textObj === null || textObj === void 0 ? void 0 : textObj.options) === null || _a === void 0 ? void 0 : _a.bullet) === null || _b === void 0 ? void 0 : _b.indent)
        bulletMarL = valToPts(textObj.options.bullet.indent);
      if (textObj.options.bullet.type) {
        if (textObj.options.bullet.type.toString().toLowerCase() === "number") {
          paragraphPropXml += ` marL="${textObj.options.indentLevel && textObj.options.indentLevel > 0 ? bulletMarL + bulletMarL * textObj.options.indentLevel : bulletMarL}" indent="-${bulletMarL}"`;
          strXmlBullet = `<a:buSzPct val="100000"/><a:buFont typeface="+mj-lt"/><a:buAutoNum type="${textObj.options.bullet.style || "arabicPeriod"}" startAt="${textObj.options.bullet.numberStartAt || textObj.options.bullet.startAt || "1"}"/>`;
        }
      } else if (textObj.options.bullet.characterCode) {
        let bulletCode = `&#x${textObj.options.bullet.characterCode};`;
        if (!/^[0-9A-Fa-f]{4}$/.test(textObj.options.bullet.characterCode)) {
          console.warn("Warning: `bullet.characterCode should be a 4-digit unicode charatcer (ex: 22AB)`!");
          bulletCode = BULLET_TYPES.DEFAULT;
        }
        paragraphPropXml += ` marL="${textObj.options.indentLevel && textObj.options.indentLevel > 0 ? bulletMarL + bulletMarL * textObj.options.indentLevel : bulletMarL}" indent="-${bulletMarL}"`;
        strXmlBullet = '<a:buSzPct val="100000"/><a:buChar char="' + bulletCode + '"/>';
      } else if (textObj.options.bullet.code) {
        let bulletCode = `&#x${textObj.options.bullet.code};`;
        if (!/^[0-9A-Fa-f]{4}$/.test(textObj.options.bullet.code)) {
          console.warn("Warning: `bullet.code should be a 4-digit hex code (ex: 22AB)`!");
          bulletCode = BULLET_TYPES.DEFAULT;
        }
        paragraphPropXml += ` marL="${textObj.options.indentLevel && textObj.options.indentLevel > 0 ? bulletMarL + bulletMarL * textObj.options.indentLevel : bulletMarL}" indent="-${bulletMarL}"`;
        strXmlBullet = '<a:buSzPct val="100000"/><a:buChar char="' + bulletCode + '"/>';
      } else {
        paragraphPropXml += ` marL="${textObj.options.indentLevel && textObj.options.indentLevel > 0 ? bulletMarL + bulletMarL * textObj.options.indentLevel : bulletMarL}" indent="-${bulletMarL}"`;
        strXmlBullet = `<a:buSzPct val="100000"/><a:buChar char="${BULLET_TYPES.DEFAULT}"/>`;
      }
    } else if (textObj.options.bullet) {
      paragraphPropXml += ` marL="${textObj.options.indentLevel && textObj.options.indentLevel > 0 ? bulletMarL + bulletMarL * textObj.options.indentLevel : bulletMarL}" indent="-${bulletMarL}"`;
      strXmlBullet = `<a:buSzPct val="100000"/><a:buChar char="${BULLET_TYPES.DEFAULT}"/>`;
    } else if (!textObj.options.bullet) {
      paragraphPropXml += ' indent="0" marL="0"';
      strXmlBullet = "<a:buNone/>";
    }
    if (textObj.options.tabStops && Array.isArray(textObj.options.tabStops)) {
      const tabStopsXml = textObj.options.tabStops.map((stop) => `<a:tab pos="${inch2Emu(stop.position || 1)}" algn="${stop.alignment || "l"}"/>`).join("");
      strXmlTabStops = `<a:tabLst>${tabStopsXml}</a:tabLst>`;
    }
    paragraphPropXml += ">" + strXmlLnSpc + strXmlParaSpc + strXmlBullet + strXmlTabStops;
    if (isDefault)
      paragraphPropXml += genXmlTextRunProperties(textObj.options, true);
    paragraphPropXml += "</" + tag + ">";
  }
  return paragraphPropXml;
}
function genXmlTextRunProperties(opts, isDefault) {
  var _a;
  let runProps = "";
  const runPropsTag = isDefault ? "a:defRPr" : "a:rPr";
  runProps += "<" + runPropsTag + ' lang="' + (opts.lang ? opts.lang : "en-US") + '"' + (opts.lang ? ' altLang="en-US"' : "");
  runProps += opts.fontSize ? ` sz="${Math.round(opts.fontSize * 100)}"` : "";
  runProps += (opts === null || opts === void 0 ? void 0 : opts.bold) ? ` b="${opts.bold ? "1" : "0"}"` : "";
  runProps += (opts === null || opts === void 0 ? void 0 : opts.italic) ? ` i="${opts.italic ? "1" : "0"}"` : "";
  runProps += (opts === null || opts === void 0 ? void 0 : opts.strike) ? ` strike="${typeof opts.strike === "string" ? opts.strike : "sngStrike"}"` : "";
  if (typeof opts.underline === "object" && ((_a = opts.underline) === null || _a === void 0 ? void 0 : _a.style)) {
    runProps += ` u="${opts.underline.style}"`;
  } else if (typeof opts.underline === "string") {
    runProps += ` u="${String(opts.underline)}"`;
  } else if (opts.hyperlink) {
    runProps += ' u="sng"';
  }
  if (opts.baseline) {
    runProps += ` baseline="${Math.round(opts.baseline * 50)}"`;
  } else if (opts.subscript) {
    runProps += ' baseline="-40000"';
  } else if (opts.superscript) {
    runProps += ' baseline="30000"';
  }
  runProps += opts.charSpacing ? ` spc="${Math.round(opts.charSpacing * 100)}" kern="0"` : "";
  runProps += ' dirty="0">';
  if (opts.color || opts.fontFace || opts.outline || typeof opts.underline === "object" && opts.underline.color) {
    if (opts.outline && typeof opts.outline === "object") {
      runProps += `<a:ln w="${valToPts(opts.outline.size || 0.75)}">${genXmlColorSelection(opts.outline.color || "FFFFFF")}</a:ln>`;
    }
    if (opts.color)
      runProps += genXmlColorSelection({ color: opts.color, transparency: opts.transparency });
    if (opts.highlight)
      runProps += `<a:highlight>${createColorElement(opts.highlight)}</a:highlight>`;
    if (typeof opts.underline === "object" && opts.underline.color)
      runProps += `<a:uFill>${genXmlColorSelection(opts.underline.color)}</a:uFill>`;
    if (opts.glow)
      runProps += `<a:effectLst>${createGlowElement(opts.glow, DEF_TEXT_GLOW)}</a:effectLst>`;
    if (opts.fontFace) {
      runProps += `<a:latin typeface="${opts.fontFace}" pitchFamily="34" charset="0"/><a:ea typeface="${opts.fontFace}" pitchFamily="34" charset="-122"/><a:cs typeface="${opts.fontFace}" pitchFamily="34" charset="-120"/>`;
    }
  }
  if (opts.hyperlink) {
    if (typeof opts.hyperlink !== "object")
      throw new Error("ERROR: text `hyperlink` option should be an object. Ex: `hyperlink:{url:'https://github.com'}` ");
    else if (!opts.hyperlink.url && !opts.hyperlink.slide)
      throw new Error("ERROR: 'hyperlink requires either `url` or `slide`'");
    else if (opts.hyperlink.url) {
      runProps += `<a:hlinkClick r:id="rId${opts.hyperlink._rId}" invalidUrl="" action="" tgtFrame="" tooltip="${opts.hyperlink.tooltip ? encodeXmlEntities(opts.hyperlink.tooltip) : ""}" history="1" highlightClick="0" endSnd="0"${opts.color ? ">" : "/>"}`;
    } else if (opts.hyperlink.slide) {
      runProps += `<a:hlinkClick r:id="rId${opts.hyperlink._rId}" action="ppaction://hlinksldjump" tooltip="${opts.hyperlink.tooltip ? encodeXmlEntities(opts.hyperlink.tooltip) : ""}"${opts.color ? ">" : "/>"}`;
    }
    if (opts.color) {
      runProps += " <a:extLst>";
      runProps += '  <a:ext uri="{A12FA001-AC4F-418D-AE19-62706E023703}">';
      runProps += '   <ahyp:hlinkClr xmlns:ahyp="http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor" val="tx"/>';
      runProps += "  </a:ext>";
      runProps += " </a:extLst>";
      runProps += "</a:hlinkClick>";
    }
  }
  runProps += `</${runPropsTag}>`;
  return runProps;
}
function genXmlTextRun(textObj) {
  return textObj.text ? `<a:r>${genXmlTextRunProperties(textObj.options, false)}<a:t>${encodeXmlEntities(textObj.text)}</a:t></a:r>` : "";
}
function genXmlBodyProperties(slideObject) {
  let bodyProperties = "<a:bodyPr";
  if (slideObject && slideObject._type === SLIDE_OBJECT_TYPES.text && slideObject.options._bodyProp) {
    bodyProperties += slideObject.options._bodyProp.wrap ? ' wrap="square"' : ' wrap="none"';
    if (slideObject.options._bodyProp.lIns || slideObject.options._bodyProp.lIns === 0)
      bodyProperties += ` lIns="${slideObject.options._bodyProp.lIns}"`;
    if (slideObject.options._bodyProp.tIns || slideObject.options._bodyProp.tIns === 0)
      bodyProperties += ` tIns="${slideObject.options._bodyProp.tIns}"`;
    if (slideObject.options._bodyProp.rIns || slideObject.options._bodyProp.rIns === 0)
      bodyProperties += ` rIns="${slideObject.options._bodyProp.rIns}"`;
    if (slideObject.options._bodyProp.bIns || slideObject.options._bodyProp.bIns === 0)
      bodyProperties += ` bIns="${slideObject.options._bodyProp.bIns}"`;
    bodyProperties += ' rtlCol="0"';
    if (slideObject.options._bodyProp.anchor)
      bodyProperties += ' anchor="' + slideObject.options._bodyProp.anchor + '"';
    if (slideObject.options._bodyProp.vert)
      bodyProperties += ' vert="' + slideObject.options._bodyProp.vert + '"';
    bodyProperties += ">";
    if (slideObject.options.fit) {
      if (slideObject.options.fit === "none")
        bodyProperties += "";
      else if (slideObject.options.fit === "shrink")
        bodyProperties += "<a:normAutofit/>";
      else if (slideObject.options.fit === "resize")
        bodyProperties += "<a:spAutoFit/>";
    }
    if (slideObject.options.shrinkText)
      bodyProperties += "<a:normAutofit/>";
    bodyProperties += slideObject.options._bodyProp.autoFit ? "<a:spAutoFit/>" : "";
    bodyProperties += "</a:bodyPr>";
  } else {
    bodyProperties += ' wrap="square" rtlCol="0">';
    bodyProperties += "</a:bodyPr>";
  }
  return slideObject._type === SLIDE_OBJECT_TYPES.tablecell ? "<a:bodyPr/>" : bodyProperties;
}
function genXmlTextBody(slideObj) {
  const opts = slideObj.options || {};
  let tmpTextObjects = [];
  const arrTextObjects = [];
  if (opts && slideObj._type !== SLIDE_OBJECT_TYPES.tablecell && (typeof slideObj.text === "undefined" || slideObj.text === null))
    return "";
  let strSlideXml = slideObj._type === SLIDE_OBJECT_TYPES.tablecell ? "<a:txBody>" : "<p:txBody>";
  {
    strSlideXml += genXmlBodyProperties(slideObj);
    if (opts.h === 0 && opts.line && opts.align)
      strSlideXml += '<a:lstStyle><a:lvl1pPr algn="l"/></a:lstStyle>';
    else if (slideObj._type === "placeholder")
      strSlideXml += `<a:lstStyle>${genXmlParagraphProperties(slideObj, true)}</a:lstStyle>`;
    else
      strSlideXml += "<a:lstStyle/>";
  }
  if (typeof slideObj.text === "string" || typeof slideObj.text === "number") {
    tmpTextObjects.push({ text: slideObj.text.toString(), options: opts || {} });
  } else if (slideObj.text && !Array.isArray(slideObj.text) && typeof slideObj.text === "object" && Object.keys(slideObj.text).includes("text")) {
    tmpTextObjects.push({ text: slideObj.text || "", options: slideObj.options || {} });
  } else if (Array.isArray(slideObj.text)) {
    tmpTextObjects = slideObj.text.map((item) => ({ text: item.text, options: item.options }));
  }
  tmpTextObjects.forEach((itext, idx) => {
    if (!itext.text)
      itext.text = "";
    itext.options = itext.options || opts || {};
    if (idx === 0 && itext.options && !itext.options.bullet && opts.bullet)
      itext.options.bullet = opts.bullet;
    if (typeof itext.text === "string" || typeof itext.text === "number") {
      itext.text = itext.text.toString().replace(/\r*\n/g, CRLF);
    }
    if (itext.text.includes(CRLF) && itext.text.match(/\n$/g) === null) {
      itext.text.split(CRLF).forEach((line) => {
        itext.options.breakLine = true;
        arrTextObjects.push({ text: line, options: itext.options });
      });
    } else {
      arrTextObjects.push(itext);
    }
  });
  const arrLines = [];
  let arrTexts = [];
  arrTextObjects.forEach((textObj, idx) => {
    if (arrTexts.length > 0 && (textObj.options.align || opts.align)) {
      if (textObj.options.align !== arrTextObjects[idx - 1].options.align) {
        arrLines.push(arrTexts);
        arrTexts = [];
      }
    } else if (arrTexts.length > 0 && textObj.options.bullet && arrTexts.length > 0) {
      arrLines.push(arrTexts);
      arrTexts = [];
      textObj.options.breakLine = false;
    }
    arrTexts.push(textObj);
    if (arrTexts.length > 0 && textObj.options.breakLine) {
      if (idx + 1 < arrTextObjects.length) {
        arrLines.push(arrTexts);
        arrTexts = [];
      }
    }
    if (idx + 1 === arrTextObjects.length)
      arrLines.push(arrTexts);
  });
  arrLines.forEach((line) => {
    var _a;
    let reqsClosingFontSize = false;
    strSlideXml += "<a:p>";
    let paragraphPropXml = `<a:pPr ${((_a = line[0].options) === null || _a === void 0 ? void 0 : _a.rtlMode) ? ' rtl="1" ' : ""}`;
    line.forEach((textObj, idx) => {
      textObj.options._lineIdx = idx;
      if (idx > 0 && textObj.options.softBreakBefore) {
        strSlideXml += "<a:br/>";
      }
      textObj.options.align = textObj.options.align || opts.align;
      textObj.options.lineSpacing = textObj.options.lineSpacing || opts.lineSpacing;
      textObj.options.lineSpacingMultiple = textObj.options.lineSpacingMultiple || opts.lineSpacingMultiple;
      textObj.options.indentLevel = textObj.options.indentLevel || opts.indentLevel;
      textObj.options.paraSpaceBefore = textObj.options.paraSpaceBefore || opts.paraSpaceBefore;
      textObj.options.paraSpaceAfter = textObj.options.paraSpaceAfter || opts.paraSpaceAfter;
      paragraphPropXml = genXmlParagraphProperties(textObj, false);
      strSlideXml += paragraphPropXml.replace("<a:pPr></a:pPr>", "");
      Object.entries(opts).filter(([key]) => !(textObj.options.hyperlink && key === "color")).forEach(([key, val]) => {
        if (key !== "bullet" && !textObj.options[key])
          textObj.options[key] = val;
      });
      strSlideXml += genXmlTextRun(textObj);
      if (!textObj.text && opts.fontSize || textObj.options.fontSize) {
        reqsClosingFontSize = true;
        opts.fontSize = opts.fontSize || textObj.options.fontSize;
      }
    });
    if (slideObj._type === SLIDE_OBJECT_TYPES.tablecell && (opts.fontSize || opts.fontFace)) {
      if (opts.fontFace) {
        strSlideXml += `<a:endParaRPr lang="${opts.lang || "en-US"}"` + (opts.fontSize ? ` sz="${Math.round(opts.fontSize * 100)}"` : "") + ' dirty="0">';
        strSlideXml += `<a:latin typeface="${opts.fontFace}" charset="0"/>`;
        strSlideXml += `<a:ea typeface="${opts.fontFace}" charset="0"/>`;
        strSlideXml += `<a:cs typeface="${opts.fontFace}" charset="0"/>`;
        strSlideXml += "</a:endParaRPr>";
      } else {
        strSlideXml += `<a:endParaRPr lang="${opts.lang || "en-US"}"` + (opts.fontSize ? ` sz="${Math.round(opts.fontSize * 100)}"` : "") + ' dirty="0"/>';
      }
    } else if (reqsClosingFontSize) {
      strSlideXml += `<a:endParaRPr lang="${opts.lang || "en-US"}"` + (opts.fontSize ? ` sz="${Math.round(opts.fontSize * 100)}"` : "") + ' dirty="0"/>';
    } else {
      strSlideXml += `<a:endParaRPr lang="${opts.lang || "en-US"}" dirty="0"/>`;
    }
    strSlideXml += "</a:p>";
  });
  if (strSlideXml.indexOf("<a:p>") === -1) {
    strSlideXml += "<a:p><a:endParaRPr/></a:p>";
  }
  strSlideXml += slideObj._type === SLIDE_OBJECT_TYPES.tablecell ? "</a:txBody>" : "</p:txBody>";
  return strSlideXml;
}
function genXmlPlaceholder(placeholderObj) {
  var _a, _b;
  if (!placeholderObj)
    return "";
  const placeholderIdx = ((_a = placeholderObj.options) === null || _a === void 0 ? void 0 : _a._placeholderIdx) ? placeholderObj.options._placeholderIdx : "";
  const placeholderTyp = ((_b = placeholderObj.options) === null || _b === void 0 ? void 0 : _b._placeholderType) ? placeholderObj.options._placeholderType : "";
  const placeholderType = placeholderTyp && PLACEHOLDER_TYPES[placeholderTyp] ? PLACEHOLDER_TYPES[placeholderTyp].toString() : "";
  return `<p:ph
		${placeholderIdx ? ' idx="' + placeholderIdx.toString() + '"' : ""}
		${placeholderType && PLACEHOLDER_TYPES[placeholderType] ? ` type="${placeholderType}"` : ""}
		${placeholderObj.text && placeholderObj.text.length > 0 ? ' hasCustomPrompt="1"' : ""}
		/>`;
}
function makeXmlContTypes(slides, slideLayouts, masterSlide) {
  let strXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + CRLF;
  strXml += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';
  strXml += '<Default Extension="xml" ContentType="application/xml"/>';
  strXml += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>';
  strXml += '<Default Extension="jpeg" ContentType="image/jpeg"/>';
  strXml += '<Default Extension="jpg" ContentType="image/jpg"/>';
  strXml += '<Default Extension="svg" ContentType="image/svg+xml"/>';
  strXml += '<Default Extension="png" ContentType="image/png"/>';
  strXml += '<Default Extension="gif" ContentType="image/gif"/>';
  strXml += '<Default Extension="m4v" ContentType="video/mp4"/>';
  strXml += '<Default Extension="mp4" ContentType="video/mp4"/>';
  slides.forEach((slide2) => {
    (slide2._relsMedia || []).forEach((rel) => {
      if (rel.type !== "image" && rel.type !== "online" && rel.type !== "chart" && rel.extn !== "m4v" && !strXml.includes(rel.type)) {
        strXml += '<Default Extension="' + rel.extn + '" ContentType="' + rel.type + '"/>';
      }
    });
  });
  strXml += '<Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/>';
  strXml += '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>';
  strXml += '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>';
  strXml += '<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>';
  slides.forEach((slide2, idx) => {
    strXml += `<Override PartName="/ppt/slideMasters/slideMaster${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>`;
    strXml += `<Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
    slide2._relsChart.forEach((rel) => {
      strXml += `<Override PartName="${rel.Target}" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`;
    });
  });
  strXml += '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>';
  strXml += '<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>';
  strXml += '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>';
  strXml += '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>';
  slideLayouts.forEach((layout, idx) => {
    strXml += `<Override PartName="/ppt/slideLayouts/slideLayout${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`;
    (layout._relsChart || []).forEach((rel) => {
      strXml += ' <Override PartName="' + rel.Target + '" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>';
    });
  });
  slides.forEach((_slide, idx) => {
    strXml += `<Override PartName="/ppt/notesSlides/notesSlide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`;
  });
  masterSlide._relsChart.forEach((rel) => {
    strXml += ' <Override PartName="' + rel.Target + '" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>';
  });
  masterSlide._relsMedia.forEach((rel) => {
    if (rel.type !== "image" && rel.type !== "online" && rel.type !== "chart" && rel.extn !== "m4v" && !strXml.includes(rel.type)) {
      strXml += ' <Default Extension="' + rel.extn + '" ContentType="' + rel.type + '"/>';
    }
  });
  strXml += ' <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>';
  strXml += ' <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>';
  strXml += "</Types>";
  return strXml;
}
function makeXmlRootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
		<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
		<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
		<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
		</Relationships>`;
}
function makeXmlApp(slides, company) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
	<TotalTime>0</TotalTime>
	<Words>0</Words>
	<Application>Microsoft Office PowerPoint</Application>
	<PresentationFormat>On-screen Show (16:9)</PresentationFormat>
	<Paragraphs>0</Paragraphs>
	<Slides>${slides.length}</Slides>
	<Notes>${slides.length}</Notes>
	<HiddenSlides>0</HiddenSlides>
	<MMClips>0</MMClips>
	<ScaleCrop>false</ScaleCrop>
	<HeadingPairs>
		<vt:vector size="6" baseType="variant">
			<vt:variant><vt:lpstr>Fonts Used</vt:lpstr></vt:variant>
			<vt:variant><vt:i4>2</vt:i4></vt:variant>
			<vt:variant><vt:lpstr>Theme</vt:lpstr></vt:variant>
			<vt:variant><vt:i4>1</vt:i4></vt:variant>
			<vt:variant><vt:lpstr>Slide Titles</vt:lpstr></vt:variant>
			<vt:variant><vt:i4>${slides.length}</vt:i4></vt:variant>
		</vt:vector>
	</HeadingPairs>
	<TitlesOfParts>
		<vt:vector size="${slides.length + 1 + 2}" baseType="lpstr">
			<vt:lpstr>Arial</vt:lpstr>
			<vt:lpstr>Calibri</vt:lpstr>
			<vt:lpstr>Office Theme</vt:lpstr>
			${slides.map((_slideObj, idx) => `<vt:lpstr>Slide ${idx + 1}</vt:lpstr>`).join("")}
		</vt:vector>
	</TitlesOfParts>
	<Company>${company}</Company>
	<LinksUpToDate>false</LinksUpToDate>
	<SharedDoc>false</SharedDoc>
	<HyperlinksChanged>false</HyperlinksChanged>
	<AppVersion>16.0000</AppVersion>
	</Properties>`;
}
function makeXmlCore(title, subject, author, revision) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
	<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<dc:title>${encodeXmlEntities(title)}</dc:title>
		<dc:subject>${encodeXmlEntities(subject)}</dc:subject>
		<dc:creator>${encodeXmlEntities(author)}</dc:creator>
		<cp:lastModifiedBy>${encodeXmlEntities(author)}</cp:lastModifiedBy>
		<cp:revision>${revision}</cp:revision>
		<dcterms:created xsi:type="dcterms:W3CDTF">${(/* @__PURE__ */ new Date()).toISOString().replace(/\.\d\d\dZ/, "Z")}</dcterms:created>
		<dcterms:modified xsi:type="dcterms:W3CDTF">${(/* @__PURE__ */ new Date()).toISOString().replace(/\.\d\d\dZ/, "Z")}</dcterms:modified>
	</cp:coreProperties>`;
}
function makeXmlPresentationRels(slides) {
  let intRelNum = 1;
  let strXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + CRLF;
  strXml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  strXml += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>';
  for (let idx = 1; idx <= slides.length; idx++) {
    strXml += `<Relationship Id="rId${++intRelNum}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx}.xml"/>`;
  }
  intRelNum++;
  strXml += `<Relationship Id="rId${intRelNum + 0}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="notesMasters/notesMaster1.xml"/><Relationship Id="rId${intRelNum + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/><Relationship Id="rId${intRelNum + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/><Relationship Id="rId${intRelNum + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId${intRelNum + 4}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/></Relationships>`;
  return strXml;
}
function makeXmlSlide(slide2) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"${(slide2 === null || slide2 === void 0 ? void 0 : slide2.hidden) ? ' show="0"' : ""}>${slideObjectToXml(slide2)}<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
function getNotesFromSlide(slide2) {
  let notesText = "";
  slide2._slideObjects.forEach((data) => {
    if (data._type === SLIDE_OBJECT_TYPES.notes)
      notesText += (data === null || data === void 0 ? void 0 : data.text) && data.text[0] ? data.text[0].text : "";
  });
  return notesText.replace(/\r*\n/g, CRLF);
}
function makeXmlNotesMaster() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<p:notesMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Header Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="hdr" sz="quarter"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2971800" cy="458788"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle><a:lvl1pPr algn="l"><a:defRPr sz="1200"/></a:lvl1pPr></a:lstStyle><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Date Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="dt" idx="1"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="3884613" y="0"/><a:ext cx="2971800" cy="458788"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle><a:lvl1pPr algn="r"><a:defRPr sz="1200"/></a:lvl1pPr></a:lstStyle><a:p><a:fld id="{5282F153-3F37-0F45-9E97-73ACFA13230C}" type="datetimeFigureOut"><a:rPr lang="en-US"/><a:t>7/23/19</a:t></a:fld><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="4" name="Slide Image Placeholder 3"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="5" name="Notes Placeholder 4"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4400550"/><a:ext cx="5486400" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p><a:p><a:pPr lvl="1"/><a:r><a:rPr lang="en-US"/><a:t>Second level</a:t></a:r></a:p><a:p><a:pPr lvl="2"/><a:r><a:rPr lang="en-US"/><a:t>Third level</a:t></a:r></a:p><a:p><a:pPr lvl="3"/><a:r><a:rPr lang="en-US"/><a:t>Fourth level</a:t></a:r></a:p><a:p><a:pPr lvl="4"/><a:r><a:rPr lang="en-US"/><a:t>Fifth level</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="6" name="Footer Placeholder 5"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="ftr" sz="quarter" idx="4"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="8685213"/><a:ext cx="2971800" cy="458787"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="b"/><a:lstStyle><a:lvl1pPr algn="l"><a:defRPr sz="1200"/></a:lvl1pPr></a:lstStyle><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="7" name="Slide Number Placeholder 6"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldNum" sz="quarter" idx="5"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="3884613" y="8685213"/><a:ext cx="2971800" cy="458787"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="b"/><a:lstStyle><a:lvl1pPr algn="r"><a:defRPr sz="1200"/></a:lvl1pPr></a:lstStyle><a:p><a:fld id="{CE5E9CC1-C706-0F49-92D6-E571CC5EEA8F}" type="slidenum"><a:rPr lang="en-US"/><a:t>\u2039#\u203A</a:t></a:fld><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp></p:spTree><p:extLst><p:ext uri="{BB962C8B-B14F-4D97-AF65-F5344CB8AC3E}"><p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="1024086991"/></p:ext></p:extLst></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr><a:lvl2pPr marL="457200" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl2pPr><a:lvl3pPr marL="914400" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl3pPr><a:lvl4pPr marL="1371600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl4pPr><a:lvl5pPr marL="1828800" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl5pPr><a:lvl6pPr marL="2286000" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl6pPr><a:lvl7pPr marL="2743200" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl7pPr><a:lvl8pPr marL="3200400" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl8pPr><a:lvl9pPr marL="3657600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl9pPr></p:notesStyle></p:notesMaster>`;
}
function makeXmlNotesSlide(slide2) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${encodeXmlEntities(getNotesFromSlide(slide2))}</a:t></a:r><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="4" name="Slide Number Placeholder 3"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldNum" sz="quarter" idx="10"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:fld id="${SLDNUMFLDID}" type="slidenum"><a:rPr lang="en-US"/><a:t>${slide2._slideNum}</a:t></a:fld><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp></p:spTree><p:extLst><p:ext uri="{BB962C8B-B14F-4D97-AF65-F5344CB8AC3E}"><p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="1024086991"/></p:ext></p:extLst></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
function makeXmlLayout(layout) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
		<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" preserve="1">
		${slideObjectToXml(layout)}
		<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}
function makeXmlMaster(slide2, layouts) {
  const layoutDefs = layouts.map((_layoutDef, idx) => `<p:sldLayoutId id="${LAYOUT_IDX_SERIES_BASE + idx}" r:id="rId${slide2._rels.length + idx + 1}"/>`);
  let strXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + CRLF;
  strXml += '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">';
  strXml += slideObjectToXml(slide2);
  strXml += '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>';
  strXml += "<p:sldLayoutIdLst>" + layoutDefs.join("") + "</p:sldLayoutIdLst>";
  strXml += '<p:hf sldNum="0" hdr="0" ftr="0" dt="0"/>';
  strXml += '<p:txStyles> <p:titleStyle>  <a:lvl1pPr algn="ctr" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="0"/></a:spcBef><a:buNone/><a:defRPr sz="4400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mj-lt"/><a:ea typeface="+mj-ea"/><a:cs typeface="+mj-cs"/></a:defRPr></a:lvl1pPr> </p:titleStyle> <p:bodyStyle>  <a:lvl1pPr marL="342900" indent="-342900" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2022"/><a:defRPr sz="3200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>  <a:lvl2pPr marL="742950" indent="-285750" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2013"/><a:defRPr sz="2800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl2pPr>  <a:lvl3pPr marL="1143000" indent="-228600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2022"/><a:defRPr sz="2400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl3pPr>  <a:lvl4pPr marL="1600200" indent="-228600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2013"/><a:defRPr sz="2000" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl4pPr>  <a:lvl5pPr marL="2057400" indent="-228600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\xBB"/><a:defRPr sz="2000" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl5pPr>  <a:lvl6pPr marL="2514600" indent="-228600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2022"/><a:defRPr sz="2000" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl6pPr>  <a:lvl7pPr marL="2971800" indent="-228600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2022"/><a:defRPr sz="2000" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl7pPr>  <a:lvl8pPr marL="3429000" indent="-228600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2022"/><a:defRPr sz="2000" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl8pPr>  <a:lvl9pPr marL="3886200" indent="-228600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:spcBef><a:spcPct val="20000"/></a:spcBef><a:buFont typeface="Arial" pitchFamily="34" charset="0"/><a:buChar char="\u2022"/><a:defRPr sz="2000" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl9pPr> </p:bodyStyle> <p:otherStyle>  <a:defPPr><a:defRPr lang="en-US"/></a:defPPr>  <a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>  <a:lvl2pPr marL="457200" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl2pPr>  <a:lvl3pPr marL="914400" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl3pPr>  <a:lvl4pPr marL="1371600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl4pPr>  <a:lvl5pPr marL="1828800" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl5pPr>  <a:lvl6pPr marL="2286000" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl6pPr>  <a:lvl7pPr marL="2743200" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl7pPr>  <a:lvl8pPr marL="3200400" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl8pPr>  <a:lvl9pPr marL="3657600" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl9pPr> </p:otherStyle></p:txStyles>';
  strXml += "</p:sldMaster>";
  return strXml;
}
function makeXmlSlideLayoutRel(layoutNumber, slideLayouts) {
  return slideObjectRelationsToXml(slideLayouts[layoutNumber - 1], [
    {
      target: "../slideMasters/slideMaster1.xml",
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster"
    }
  ]);
}
function makeXmlSlideRel(slides, slideLayouts, slideNumber) {
  return slideObjectRelationsToXml(slides[slideNumber - 1], [
    {
      target: `../slideLayouts/slideLayout${getLayoutIdxForSlide(slides, slideLayouts, slideNumber)}.xml`,
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
    },
    {
      target: `../notesSlides/notesSlide${slideNumber}.xml`,
      type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"
    }
  ]);
}
function makeXmlNotesSlideRel(slideNumber) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
		<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
			<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>
			<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNumber}.xml"/>
		</Relationships>`;
}
function makeXmlMasterRel(masterSlide, slideLayouts) {
  const defaultRels = slideLayouts.map((_layoutDef, idx) => ({
    target: `../slideLayouts/slideLayout${idx + 1}.xml`,
    type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
  }));
  defaultRels.push({ target: "../theme/theme1.xml", type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" });
  return slideObjectRelationsToXml(masterSlide, defaultRels);
}
function makeXmlNotesMasterRel() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
		<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
		</Relationships>`;
}
function getLayoutIdxForSlide(slides, slideLayouts, slideNumber) {
  for (let i = 0; i < slideLayouts.length; i++) {
    if (slideLayouts[i]._name === slides[slideNumber - 1]._slideLayout._name) {
      return i + 1;
    }
  }
  return 1;
}
function makeXmlTheme(pres) {
  var _a, _b, _c, _d;
  const majorFont = ((_a = pres.theme) === null || _a === void 0 ? void 0 : _a.headFontFace) ? `<a:latin typeface="${(_b = pres.theme) === null || _b === void 0 ? void 0 : _b.headFontFace}"/>` : '<a:latin typeface="Calibri Light" panose="020F0302020204030204"/>';
  const minorFont = ((_c = pres.theme) === null || _c === void 0 ? void 0 : _c.bodyFontFace) ? `<a:latin typeface="${(_d = pres.theme) === null || _d === void 0 ? void 0 : _d.bodyFontFace}"/>` : '<a:latin typeface="Calibri" panose="020F0502020204030204"/>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont>${majorFont}<a:ea typeface=""/><a:cs typeface=""/><a:font script="Jpan" typeface="\u6E38\u30B4\u30B7\u30C3\u30AF Light"/><a:font script="Hang" typeface="\uB9D1\uC740 \uACE0\uB515"/><a:font script="Hans" typeface="\u7B49\u7EBF Light"/><a:font script="Hant" typeface="\u65B0\u7D30\u660E\u9AD4"/><a:font script="Arab" typeface="Times New Roman"/><a:font script="Hebr" typeface="Times New Roman"/><a:font script="Thai" typeface="Angsana New"/><a:font script="Ethi" typeface="Nyala"/><a:font script="Beng" typeface="Vrinda"/><a:font script="Gujr" typeface="Shruti"/><a:font script="Khmr" typeface="MoolBoran"/><a:font script="Knda" typeface="Tunga"/><a:font script="Guru" typeface="Raavi"/><a:font script="Cans" typeface="Euphemia"/><a:font script="Cher" typeface="Plantagenet Cherokee"/><a:font script="Yiii" typeface="Microsoft Yi Baiti"/><a:font script="Tibt" typeface="Microsoft Himalaya"/><a:font script="Thaa" typeface="MV Boli"/><a:font script="Deva" typeface="Mangal"/><a:font script="Telu" typeface="Gautami"/><a:font script="Taml" typeface="Latha"/><a:font script="Syrc" typeface="Estrangelo Edessa"/><a:font script="Orya" typeface="Kalinga"/><a:font script="Mlym" typeface="Kartika"/><a:font script="Laoo" typeface="DokChampa"/><a:font script="Sinh" typeface="Iskoola Pota"/><a:font script="Mong" typeface="Mongolian Baiti"/><a:font script="Viet" typeface="Times New Roman"/><a:font script="Uigh" typeface="Microsoft Uighur"/><a:font script="Geor" typeface="Sylfaen"/><a:font script="Armn" typeface="Arial"/><a:font script="Bugi" typeface="Leelawadee UI"/><a:font script="Bopo" typeface="Microsoft JhengHei"/><a:font script="Java" typeface="Javanese Text"/><a:font script="Lisu" typeface="Segoe UI"/><a:font script="Mymr" typeface="Myanmar Text"/><a:font script="Nkoo" typeface="Ebrima"/><a:font script="Olck" typeface="Nirmala UI"/><a:font script="Osma" typeface="Ebrima"/><a:font script="Phag" typeface="Phagspa"/><a:font script="Syrn" typeface="Estrangelo Edessa"/><a:font script="Syrj" typeface="Estrangelo Edessa"/><a:font script="Syre" typeface="Estrangelo Edessa"/><a:font script="Sora" typeface="Nirmala UI"/><a:font script="Tale" typeface="Microsoft Tai Le"/><a:font script="Talu" typeface="Microsoft New Tai Lue"/><a:font script="Tfng" typeface="Ebrima"/></a:majorFont><a:minorFont>${minorFont}<a:ea typeface=""/><a:cs typeface=""/><a:font script="Jpan" typeface="\u6E38\u30B4\u30B7\u30C3\u30AF"/><a:font script="Hang" typeface="\uB9D1\uC740 \uACE0\uB515"/><a:font script="Hans" typeface="\u7B49\u7EBF"/><a:font script="Hant" typeface="\u65B0\u7D30\u660E\u9AD4"/><a:font script="Arab" typeface="Arial"/><a:font script="Hebr" typeface="Arial"/><a:font script="Thai" typeface="Cordia New"/><a:font script="Ethi" typeface="Nyala"/><a:font script="Beng" typeface="Vrinda"/><a:font script="Gujr" typeface="Shruti"/><a:font script="Khmr" typeface="DaunPenh"/><a:font script="Knda" typeface="Tunga"/><a:font script="Guru" typeface="Raavi"/><a:font script="Cans" typeface="Euphemia"/><a:font script="Cher" typeface="Plantagenet Cherokee"/><a:font script="Yiii" typeface="Microsoft Yi Baiti"/><a:font script="Tibt" typeface="Microsoft Himalaya"/><a:font script="Thaa" typeface="MV Boli"/><a:font script="Deva" typeface="Mangal"/><a:font script="Telu" typeface="Gautami"/><a:font script="Taml" typeface="Latha"/><a:font script="Syrc" typeface="Estrangelo Edessa"/><a:font script="Orya" typeface="Kalinga"/><a:font script="Mlym" typeface="Kartika"/><a:font script="Laoo" typeface="DokChampa"/><a:font script="Sinh" typeface="Iskoola Pota"/><a:font script="Mong" typeface="Mongolian Baiti"/><a:font script="Viet" typeface="Arial"/><a:font script="Uigh" typeface="Microsoft Uighur"/><a:font script="Geor" typeface="Sylfaen"/><a:font script="Armn" typeface="Arial"/><a:font script="Bugi" typeface="Leelawadee UI"/><a:font script="Bopo" typeface="Microsoft JhengHei"/><a:font script="Java" typeface="Javanese Text"/><a:font script="Lisu" typeface="Segoe UI"/><a:font script="Mymr" typeface="Myanmar Text"/><a:font script="Nkoo" typeface="Ebrima"/><a:font script="Olck" typeface="Nirmala UI"/><a:font script="Osma" typeface="Ebrima"/><a:font script="Phag" typeface="Phagspa"/><a:font script="Syrn" typeface="Estrangelo Edessa"/><a:font script="Syrj" typeface="Estrangelo Edessa"/><a:font script="Syre" typeface="Estrangelo Edessa"/><a:font script="Sora" typeface="Nirmala UI"/><a:font script="Tale" typeface="Microsoft Tai Le"/><a:font script="Talu" typeface="Microsoft New Tai Lue"/><a:font script="Tfng" typeface="Ebrima"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:satMod val="103000"/><a:lumMod val="102000"/><a:tint val="94000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:satMod val="110000"/><a:lumMod val="100000"/><a:shade val="100000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="63000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="93000"/><a:satMod val="150000"/><a:shade val="98000"/><a:lumMod val="102000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:tint val="98000"/><a:satMod val="130000"/><a:shade val="90000"/><a:lumMod val="103000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="63000"/><a:satMod val="120000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/><a:extLst><a:ext uri="{05A4C25C-085E-4340-85A3-A5531E510DB2}"><thm15:themeFamily xmlns:thm15="http://schemas.microsoft.com/office/thememl/2012/main" name="Office Theme" id="{62F939B6-93AF-4DB8-9C6B-D6C7DFDC589F}" vid="{4A3C46E8-61CC-4603-A589-7422A47A8E4A}"/></a:ext></a:extLst></a:theme>`;
}
function makeXmlPresentation(pres) {
  let strXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" ${pres.rtlMode ? 'rtl="1"' : ""} saveSubsetFonts="1" autoCompressPictures="0">`;
  strXml += '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>';
  strXml += "<p:sldIdLst>";
  pres.slides.forEach((slide2) => strXml += `<p:sldId id="${slide2._slideId}" r:id="rId${slide2._rId}"/>`);
  strXml += "</p:sldIdLst>";
  strXml += `<p:notesMasterIdLst><p:notesMasterId r:id="rId${pres.slides.length + 2}"/></p:notesMasterIdLst>`;
  strXml += `<p:sldSz cx="${pres.presLayout.width}" cy="${pres.presLayout.height}"/>`;
  strXml += `<p:notesSz cx="${pres.presLayout.height}" cy="${pres.presLayout.width}"/>`;
  strXml += "<p:defaultTextStyle>";
  for (let idy = 1; idy < 10; idy++) {
    strXml += `<a:lvl${idy}pPr marL="${(idy - 1) * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${idy}pPr>`;
  }
  strXml += "</p:defaultTextStyle>";
  if (pres.sections && pres.sections.length > 0) {
    strXml += '<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}">';
    strXml += '<p14:sectionLst xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main">';
    pres.sections.forEach((sect) => {
      strXml += `<p14:section name="${encodeXmlEntities(sect.title)}" id="{${getUuid("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")}}"><p14:sldIdLst>`;
      sect._slides.forEach((slide2) => strXml += `<p14:sldId id="${slide2._slideId}"/>`);
      strXml += "</p14:sldIdLst></p14:section>";
    });
    strXml += "</p14:sectionLst></p:ext>";
    strXml += '<p:ext uri="{EFAFB233-063F-42B5-8137-9DF3F51BA10A}"><p15:sldGuideLst xmlns:p15="http://schemas.microsoft.com/office/powerpoint/2012/main"/></p:ext>';
    strXml += "</p:extLst>";
  }
  strXml += "</p:presentation>";
  return strXml;
}
function makeXmlPresProps() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`;
}
function makeXmlTableStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`;
}
function makeXmlViewProps() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${CRLF}<p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:normalViewPr horzBarState="maximized"><p:restoredLeft sz="15611"/><p:restoredTop sz="94610"/></p:normalViewPr><p:slideViewPr><p:cSldViewPr snapToGrid="0" snapToObjects="1"><p:cViewPr varScale="1"><p:scale><a:sx n="136" d="100"/><a:sy n="136" d="100"/></p:scale><p:origin x="216" y="312"/></p:cViewPr><p:guideLst/></p:cSldViewPr></p:slideViewPr><p:notesTextViewPr><p:cViewPr><p:scale><a:sx n="1" d="1"/><a:sy n="1" d="1"/></p:scale><p:origin x="0" y="0"/></p:cViewPr></p:notesTextViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`;
}
var VERSION = "4.0.1";
var PptxGenJS = class {
  set layout(value) {
    const newLayout = this.LAYOUTS[value];
    if (newLayout) {
      this._layout = value;
      this._presLayout = newLayout;
    } else {
      throw new Error("UNKNOWN-LAYOUT");
    }
  }
  get layout() {
    return this._layout;
  }
  get version() {
    return this._version;
  }
  set author(value) {
    this._author = value;
  }
  get author() {
    return this._author;
  }
  set company(value) {
    this._company = value;
  }
  get company() {
    return this._company;
  }
  set revision(value) {
    this._revision = value;
  }
  get revision() {
    return this._revision;
  }
  set subject(value) {
    this._subject = value;
  }
  get subject() {
    return this._subject;
  }
  set theme(value) {
    this._theme = value;
  }
  get theme() {
    return this._theme;
  }
  set title(value) {
    this._title = value;
  }
  get title() {
    return this._title;
  }
  set rtlMode(value) {
    this._rtlMode = value;
  }
  get rtlMode() {
    return this._rtlMode;
  }
  get masterSlide() {
    return this._masterSlide;
  }
  get slides() {
    return this._slides;
  }
  get sections() {
    return this._sections;
  }
  get slideLayouts() {
    return this._slideLayouts;
  }
  get AlignH() {
    return this._alignH;
  }
  get AlignV() {
    return this._alignV;
  }
  get ChartType() {
    return this._chartType;
  }
  get OutputType() {
    return this._outputType;
  }
  get presLayout() {
    return this._presLayout;
  }
  get SchemeColor() {
    return this._schemeColor;
  }
  get ShapeType() {
    return this._shapeType;
  }
  get charts() {
    return this._charts;
  }
  get colors() {
    return this._colors;
  }
  get shapes() {
    return this._shapes;
  }
  constructor() {
    this._version = VERSION;
    this._alignH = AlignH;
    this._alignV = AlignV;
    this._chartType = ChartType;
    this._outputType = OutputType;
    this._schemeColor = SchemeColor;
    this._shapeType = ShapeType;
    this._charts = CHART_TYPE;
    this._colors = SCHEME_COLOR_NAMES;
    this._shapes = SHAPE_TYPE;
    this.addNewSlide = (options) => {
      const sectAlreadyInUse = this.sections.length > 0 && this.sections[this.sections.length - 1]._slides.filter((slide2) => slide2._slideNum === this.slides[this.slides.length - 1]._slideNum).length > 0;
      options.sectionTitle = sectAlreadyInUse ? this.sections[this.sections.length - 1].title : null;
      return this.addSlide(options);
    };
    this.getSlide = (slideNum) => this.slides.filter((slide2) => slide2._slideNum === slideNum)[0];
    this.setSlideNumber = (slideNum) => {
      this.masterSlide._slideNumberProps = slideNum;
      this.slideLayouts.filter((layout) => layout._name === DEF_PRES_LAYOUT_NAME)[0]._slideNumberProps = slideNum;
    };
    this.createChartMediaRels = (slide2, zip, chartPromises) => {
      slide2._relsChart.forEach((rel) => chartPromises.push(createExcelWorksheet(rel, zip)));
      slide2._relsMedia.forEach((rel) => {
        if (rel.type !== "online" && rel.type !== "hyperlink") {
          let data = rel.data && typeof rel.data === "string" ? rel.data : "";
          if (!data.includes(",") && !data.includes(";"))
            data = "image/png;base64," + data;
          else if (!data.includes(","))
            data = "image/png;base64," + data;
          else if (!data.includes(";"))
            data = "image/png;" + data;
          zip.file(rel.Target.replace("..", "ppt"), data.split(",").pop(), { base64: true });
        }
      });
    };
    this.writeFileToBrowser = (exportName, blobContent) => __awaiter(this, void 0, void 0, function* () {
      const eleLink = document.createElement("a");
      eleLink.setAttribute("style", "display:none;");
      eleLink.dataset.interception = "off";
      document.body.appendChild(eleLink);
      if (window.URL.createObjectURL) {
        const url = window.URL.createObjectURL(new Blob([blobContent], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }));
        eleLink.href = url;
        eleLink.download = exportName;
        eleLink.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(eleLink);
        }, 100);
        return yield Promise.resolve(exportName);
      }
    });
    this.exportPresentation = (props) => __awaiter(this, void 0, void 0, function* () {
      const arrChartPromises = [];
      let arrMediaPromises = [];
      const zip = new import_jszip.default();
      this.slides.forEach((slide2) => {
        arrMediaPromises = arrMediaPromises.concat(encodeSlideMediaRels(slide2));
      });
      this.slideLayouts.forEach((layout) => {
        arrMediaPromises = arrMediaPromises.concat(encodeSlideMediaRels(layout));
      });
      arrMediaPromises = arrMediaPromises.concat(encodeSlideMediaRels(this.masterSlide));
      return yield Promise.all(arrMediaPromises).then(() => __awaiter(this, void 0, void 0, function* () {
        this.slides.forEach((slide2) => {
          if (slide2._slideLayout)
            addPlaceholdersToSlideLayouts(slide2);
        });
        zip.folder("_rels");
        zip.folder("docProps");
        zip.folder("ppt").folder("_rels");
        zip.folder("ppt/charts").folder("_rels");
        zip.folder("ppt/embeddings");
        zip.folder("ppt/media");
        zip.folder("ppt/slideLayouts").folder("_rels");
        zip.folder("ppt/slideMasters").folder("_rels");
        zip.folder("ppt/slides").folder("_rels");
        zip.folder("ppt/theme");
        zip.folder("ppt/notesMasters").folder("_rels");
        zip.folder("ppt/notesSlides").folder("_rels");
        zip.file("[Content_Types].xml", makeXmlContTypes(this.slides, this.slideLayouts, this.masterSlide));
        zip.file("_rels/.rels", makeXmlRootRels());
        zip.file("docProps/app.xml", makeXmlApp(this.slides, this.company));
        zip.file("docProps/core.xml", makeXmlCore(this.title, this.subject, this.author, this.revision));
        zip.file("ppt/_rels/presentation.xml.rels", makeXmlPresentationRels(this.slides));
        zip.file("ppt/theme/theme1.xml", makeXmlTheme(this));
        zip.file("ppt/presentation.xml", makeXmlPresentation(this));
        zip.file("ppt/presProps.xml", makeXmlPresProps());
        zip.file("ppt/tableStyles.xml", makeXmlTableStyles());
        zip.file("ppt/viewProps.xml", makeXmlViewProps());
        this.slideLayouts.forEach((layout, idx) => {
          zip.file(`ppt/slideLayouts/slideLayout${idx + 1}.xml`, makeXmlLayout(layout));
          zip.file(`ppt/slideLayouts/_rels/slideLayout${idx + 1}.xml.rels`, makeXmlSlideLayoutRel(idx + 1, this.slideLayouts));
        });
        this.slides.forEach((slide2, idx) => {
          zip.file(`ppt/slides/slide${idx + 1}.xml`, makeXmlSlide(slide2));
          zip.file(`ppt/slides/_rels/slide${idx + 1}.xml.rels`, makeXmlSlideRel(this.slides, this.slideLayouts, idx + 1));
          zip.file(`ppt/notesSlides/notesSlide${idx + 1}.xml`, makeXmlNotesSlide(slide2));
          zip.file(`ppt/notesSlides/_rels/notesSlide${idx + 1}.xml.rels`, makeXmlNotesSlideRel(idx + 1));
        });
        zip.file("ppt/slideMasters/slideMaster1.xml", makeXmlMaster(this.masterSlide, this.slideLayouts));
        zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", makeXmlMasterRel(this.masterSlide, this.slideLayouts));
        zip.file("ppt/notesMasters/notesMaster1.xml", makeXmlNotesMaster());
        zip.file("ppt/notesMasters/_rels/notesMaster1.xml.rels", makeXmlNotesMasterRel());
        this.slideLayouts.forEach((layout) => {
          this.createChartMediaRels(layout, zip, arrChartPromises);
        });
        this.slides.forEach((slide2) => {
          this.createChartMediaRels(slide2, zip, arrChartPromises);
        });
        this.createChartMediaRels(this.masterSlide, zip, arrChartPromises);
        return yield Promise.all(arrChartPromises).then(() => __awaiter(this, void 0, void 0, function* () {
          if (props.outputType === "STREAM") {
            return yield zip.generateAsync({ type: "nodebuffer", compression: props.compression ? "DEFLATE" : "STORE" });
          } else if (props.outputType) {
            return yield zip.generateAsync({ type: props.outputType });
          } else {
            return yield zip.generateAsync({ type: "blob", compression: props.compression ? "DEFLATE" : "STORE" });
          }
        }));
      }));
    });
    const layout4x3 = { name: "screen4x3", width: 9144e3, height: 6858e3 };
    const layout16x9 = { name: "screen16x9", width: 9144e3, height: 5143500 };
    const layout16x10 = { name: "screen16x10", width: 9144e3, height: 5715e3 };
    const layoutWide = { name: "custom", width: 12192e3, height: 6858e3 };
    this.LAYOUTS = {
      LAYOUT_4x3: layout4x3,
      LAYOUT_16x9: layout16x9,
      LAYOUT_16x10: layout16x10,
      LAYOUT_WIDE: layoutWide
    };
    this._author = "PptxGenJS";
    this._company = "PptxGenJS";
    this._revision = "1";
    this._subject = "PptxGenJS Presentation";
    this._title = "PptxGenJS Presentation";
    this._presLayout = {
      name: this.LAYOUTS[DEF_PRES_LAYOUT].name,
      _sizeW: this.LAYOUTS[DEF_PRES_LAYOUT].width,
      _sizeH: this.LAYOUTS[DEF_PRES_LAYOUT].height,
      width: this.LAYOUTS[DEF_PRES_LAYOUT].width,
      height: this.LAYOUTS[DEF_PRES_LAYOUT].height
    };
    this._rtlMode = false;
    this._slideLayouts = [
      {
        _margin: DEF_SLIDE_MARGIN_IN,
        _name: DEF_PRES_LAYOUT_NAME,
        _presLayout: this._presLayout,
        _rels: [],
        _relsChart: [],
        _relsMedia: [],
        _slide: null,
        _slideNum: 1e3,
        _slideNumberProps: null,
        _slideObjects: []
      }
    ];
    this._slides = [];
    this._sections = [];
    this._masterSlide = {
      addChart: null,
      addImage: null,
      addMedia: null,
      addNotes: null,
      addShape: null,
      addTable: null,
      addText: null,
      //
      _name: null,
      _presLayout: this._presLayout,
      _rId: null,
      _rels: [],
      _relsChart: [],
      _relsMedia: [],
      _slideId: null,
      _slideLayout: null,
      _slideNum: null,
      _slideNumberProps: null,
      _slideObjects: []
    };
  }
  // EXPORT METHODS
  /**
   * Export the current Presentation to stream
   * @param {WriteBaseProps} props - output properties
   * @returns {Promise<string | ArrayBuffer | Blob | Buffer | Uint8Array>} file stream
   */
  stream(props) {
    return __awaiter(this, void 0, void 0, function* () {
      return yield this.exportPresentation({
        compression: props === null || props === void 0 ? void 0 : props.compression,
        outputType: "STREAM"
      });
    });
  }
  /**
   * Export the current Presentation as JSZip content with the selected type
   * @param {WriteProps} props output properties
   * @returns {Promise<string | ArrayBuffer | Blob | Buffer | Uint8Array>} file content in selected type
   */
  write(props) {
    return __awaiter(this, void 0, void 0, function* () {
      const propsOutpType = typeof props === "object" && (props === null || props === void 0 ? void 0 : props.outputType) ? props.outputType : props ? props : null;
      const propsCompress = typeof props === "object" && (props === null || props === void 0 ? void 0 : props.compression) ? props.compression : false;
      return yield this.exportPresentation({
        compression: propsCompress,
        outputType: propsOutpType
      });
    });
  }
  /**
   * Export the current Presentation.
   * Write the generated presentation to disk (Node) or trigger a download (browser).
   * @param {WriteFileProps} props - output file properties
   * @returns {Promise<string>} the presentation name
   */
  writeFile(props) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b;
      const isNode = typeof process !== "undefined" && !!((_a = process.versions) === null || _a === void 0 ? void 0 : _a.node) && ((_b = process.release) === null || _b === void 0 ? void 0 : _b.name) === "node";
      if (typeof props === "string") {
        console.warn("[WARNING] writeFile(string) is deprecated - pass { fileName } instead.");
        props = { fileName: props };
      }
      const { fileName: rawName = "Presentation.pptx", compression = false } = props;
      const fileName = rawName.toLowerCase().endsWith(".pptx") ? rawName : `${rawName}.pptx`;
      const outputType = isNode ? "nodebuffer" : null;
      const data = yield this.exportPresentation({ compression, outputType });
      if (isNode) {
        const { promises: fs2 } = yield import("node:fs");
        const { writeFile } = fs2;
        yield writeFile(fileName, data);
        return fileName;
      }
      yield this.writeFileToBrowser(fileName, data);
      return fileName;
    });
  }
  // PRESENTATION METHODS
  /**
   * Add a new Section to Presentation
   * @param {ISectionProps} section - section properties
   * @example pptx.addSection({ title:'Charts' });
   */
  addSection(section) {
    if (!section)
      console.warn("addSection requires an argument");
    else if (!section.title)
      console.warn("addSection requires a title");
    const newSection = {
      _type: "user",
      _slides: [],
      title: section.title
    };
    if (section.order)
      this.sections.splice(section.order, 0, newSection);
    else
      this._sections.push(newSection);
  }
  /**
   * Add a new Slide to Presentation
   * @param {AddSlideProps} options - slide options
   * @returns {PresSlide} the new Slide
   */
  addSlide(options) {
    const masterSlideName = typeof options === "string" ? options : (options === null || options === void 0 ? void 0 : options.masterName) ? options.masterName : "";
    let slideLayout = {
      _name: this.LAYOUTS[DEF_PRES_LAYOUT].name,
      _presLayout: this.presLayout,
      _rels: [],
      _relsChart: [],
      _relsMedia: [],
      _slideNum: this.slides.length + 1
    };
    if (masterSlideName) {
      const tmpLayout = this.slideLayouts.filter((layout) => layout._name === masterSlideName)[0];
      if (tmpLayout)
        slideLayout = tmpLayout;
    }
    const newSlide = new Slide({
      addSlide: this.addNewSlide,
      getSlide: this.getSlide,
      presLayout: this.presLayout,
      setSlideNum: this.setSlideNumber,
      slideId: this.slides.length + 256,
      slideRId: this.slides.length + 2,
      slideNumber: this.slides.length + 1,
      slideLayout
    });
    this._slides.push(newSlide);
    if (options === null || options === void 0 ? void 0 : options.sectionTitle) {
      const sect = this.sections.filter((section) => section.title === options.sectionTitle)[0];
      if (!sect)
        console.warn(`addSlide: unable to find section with title: "${options.sectionTitle}"`);
      else
        sect._slides.push(newSlide);
    } else if (this.sections && this.sections.length > 0 && !(options === null || options === void 0 ? void 0 : options.sectionTitle)) {
      const lastSect = this._sections[this.sections.length - 1];
      if (lastSect._type === "default")
        lastSect._slides.push(newSlide);
      else {
        this._sections.push({
          title: `Default-${this.sections.filter((sect) => sect._type === "default").length + 1}`,
          _type: "default",
          _slides: [newSlide]
        });
      }
    }
    return newSlide;
  }
  /**
   * Create a custom Slide Layout in any size
   * @param {PresLayout} layout - layout properties
   * @example pptx.defineLayout({ name:'A3', width:16.5, height:11.7 });
   */
  defineLayout(layout) {
    if (!layout)
      console.warn("defineLayout requires `{name, width, height}`");
    else if (!layout.name)
      console.warn("defineLayout requires `name`");
    else if (!layout.width)
      console.warn("defineLayout requires `width`");
    else if (!layout.height)
      console.warn("defineLayout requires `height`");
    else if (typeof layout.height !== "number")
      console.warn("defineLayout `height` should be a number (inches)");
    else if (typeof layout.width !== "number")
      console.warn("defineLayout `width` should be a number (inches)");
    this.LAYOUTS[layout.name] = {
      name: layout.name,
      _sizeW: Math.round(Number(layout.width) * EMU),
      _sizeH: Math.round(Number(layout.height) * EMU),
      width: Math.round(Number(layout.width) * EMU),
      height: Math.round(Number(layout.height) * EMU)
    };
  }
  /**
   * Create a new slide master [layout] for the Presentation
   * @param {SlideMasterProps} props - layout properties
   */
  defineSlideMaster(props) {
    const propsClone = JSON.parse(JSON.stringify(props));
    if (!propsClone.title)
      throw new Error("defineSlideMaster() object argument requires a `title` value. (https://gitbrent.github.io/PptxGenJS/docs/masters.html)");
    const newLayout = {
      _margin: propsClone.margin || DEF_SLIDE_MARGIN_IN,
      _name: propsClone.title,
      _presLayout: this.presLayout,
      _rels: [],
      _relsChart: [],
      _relsMedia: [],
      _slide: null,
      _slideNum: 1e3 + this.slideLayouts.length + 1,
      _slideNumberProps: propsClone.slideNumber || null,
      _slideObjects: [],
      background: propsClone.background || null,
      bkgd: propsClone.bkgd || null
    };
    createSlideMaster(propsClone, newLayout);
    this.slideLayouts.push(newLayout);
    if (propsClone.background || propsClone.bkgd)
      addBackgroundDefinition(propsClone.background, newLayout);
    if (newLayout._slideNumberProps && !this.masterSlide._slideNumberProps)
      this.masterSlide._slideNumberProps = newLayout._slideNumberProps;
  }
  // HTML-TO-SLIDES METHODS
  /**
   * Reproduces an HTML table as a PowerPoint table - including column widths, style, etc. - creates 1 or more slides as needed
   * @param {string} eleId - table HTML element ID
   * @param {TableToSlidesProps} options - generation options
   */
  tableToSlides(eleId, options = {}) {
    genTableToSlides(this, eleId, options, (options === null || options === void 0 ? void 0 : options.masterSlideName) ? this.slideLayouts.filter((layout) => layout._name === options.masterSlideName)[0] : null);
  }
};

// src/assets/backstage-logo.svg
var backstage_logo_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2079.95 456.05"><defs><style>.cls-1{fill:#7df3e1}</style></defs><path d="M302.9,180a80.62,80.62,0,0,0,13.44-10.37c.8-.77,1.55-1.54,2.31-2.31a81.89,81.89,0,0,0,7.92-9.37,62.37,62.37,0,0,0,6.27-10.77,48.6,48.6,0,0,0,4.36-16.4c1.49-19.39-10-38.67-35.62-54.22L198.42,14,78.16,129.22l-78.29,75,108.6,65.9a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.8,66.42-25.69,19.16-18.36,25.52-42.12,13.7-61.87a49.69,49.69,0,0,0-6.8-8.87,89.78,89.78,0,0,0,19.28,2.15H259a85.09,85.09,0,0,0,31-5.79A80.88,80.88,0,0,0,302.9,180Zm-100.59,59.8c-19.32,18.51-50.4,21.24-75.7,5.9l-75.13-45.6,67.44-64.65,76.42,46.39C222.88,198.57,221.36,221.6,202.31,239.84Zm8.94-82.21L140.6,114.74,205,53l69.37,42.11c25.94,15.73,29.31,37.05,10.55,55A60.71,60.71,0,0,1,211.25,157.63Zm29.86,190c-19.57,18.75-46.17,29.08-74.88,29.08a123.84,123.84,0,0,1-64.11-18.19L-.13,296.51v24.67l108.6,65.91a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.81,66.42-25.69,12.88-12.34,20-27.13,19.68-41.49v-1.79A87.85,87.85,0,0,1,241.11,347.67Zm0-39c-19.57,18.76-46.17,29.09-74.88,29.09a123.84,123.84,0,0,1-64.11-18.19L-.13,257.52V282.2l108.6,65.91a111.59,111.59,0,0,0,57.76,16.41c24.92,0,48.8-8.8,66.42-25.68,12.88-12.35,20-27.13,19.68-41.5v-1.79A86.86,86.86,0,0,1,241.11,308.68Zm0-39c-19.57,18.76-46.17,29.09-74.88,29.09a123.84,123.84,0,0,1-64.11-18.19L-.13,218.54v24.68l108.6,65.91a111.59,111.59,0,0,0,57.76,16.41c24.92,0,48.8-8.8,66.42-25.69,12.88-12.34,20-27.12,19.68-41.49v-1.82A87.14,87.14,0,0,1,241.11,269.7Zm83.69,25.74a94.16,94.16,0,0,1-60.19,25.86h0V348a81.6,81.6,0,0,0,51.73-22.37c14-13.38,21.15-28.11,21-42.64v-2.2A95.14,95.14,0,0,1,324.8,295.44Zm-83.69,91.21c-19.57,18.75-46.17,29.09-74.88,29.09a123.76,123.76,0,0,1-64.11-18.2L-.13,335.49v24.67l108.6,65.91a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.81,66.42-25.69,12.88-12.34,20-27.13,19.68-41.49v-1.79A87.35,87.35,0,0,1,241.11,386.65Zm85.75-210.21c-.68.69-1.35,1.38-2.06,2.05a99.19,99.19,0,0,1-22.23,15.69,94.53,94.53,0,0,1-26.24,8.71,97.84,97.84,0,0,1-14.16,1.57c.5,1.61.9,3.25,1.25,4.9a52.7,52.7,0,0,1,1.13,12V231h.05A84.48,84.48,0,0,0,290,225.47a80.83,80.83,0,0,0,26.38-16.82c.81-.77,1.51-1.56,2.27-2.34a82,82,0,0,0,7.92-9.38,62.85,62.85,0,0,0,6.29-10.78,48.5,48.5,0,0,0,4.32-16.44c.09-1.23.2-2.47.19-3.7v-2c-.72,1-1.48,2.06-2.26,3.09A98,98,0,0,1,326.86,176.44Zm0,77.92c-.68.7-1.3,1.41-2,2.1a94.09,94.09,0,0,1-60.19,25.85h0V309h0a81.65,81.65,0,0,0,51.73-22.37,73.51,73.51,0,0,0,16.48-22.49,48.56,48.56,0,0,0,4.32-16.44c.09-1.24.2-2.48.19-3.71v-2.2c-.74,1.08-1.47,2.16-2.27,3.22A95.81,95.81,0,0,1,326.82,254.36Zm0-39c-.68.7-1.3,1.41-2,2.1a92.22,92.22,0,0,1-10.62,8.65,93.53,93.53,0,0,1-11.63,7,95.63,95.63,0,0,1-37.94,10.18h-.05l0,26.67h0a81.63,81.63,0,0,0,51.73-22.37c.81-.77,1.51-1.56,2.27-2.34a82,82,0,0,0,7.92-9.38,63.16,63.16,0,0,0,6.29-10.77,48.55,48.55,0,0,0,4.32-16.45c.09-1.23.2-2.47.19-3.7v-2.2c-.74,1.08-1.47,2.16-2.27,3.22A98.19,98.19,0,0,1,326.82,215.38Zm241-88.84q7.94,0,17.09.17t18.12,1a139.3,139.3,0,0,1,16.74,2.57,42.78,42.78,0,0,1,13.3,5.14,64.27,64.27,0,0,1,20.54,19.89Q662,168,662,186.54q0,19.54-9.49,33.78t-27.1,21.09v.68q22.78,4.82,34.87,20.58t12.08,38.4a72.62,72.62,0,0,1-4.83,26.06,65.29,65.29,0,0,1-14.33,22.46,71.57,71.57,0,0,1-23.47,15.78q-14,6-32.28,6H478.38V126.54Zm9,105.27q28,0,40.21-9.78t12.26-29.31q0-13-4.14-20.58a29.47,29.47,0,0,0-11.4-11.66A45,45,0,0,0,597,155.17a161.2,161.2,0,0,0-20.19-1.2h-65.6v77.84Zm16.57,112.13q21.74,0,34-11.66T639.59,300q0-12-4.48-19.88a34.85,34.85,0,0,0-11.91-12.52,50.14,50.14,0,0,0-17.09-6.52,105,105,0,0,0-20-1.88H511.17v84.7Zm274.79,26.74q-7.61,4.45-21.06,4.46-11.4,0-18.12-6.34t-6.74-20.75a70.17,70.17,0,0,1-28.13,20.75,97.87,97.87,0,0,1-57.65,3.6,53.51,53.51,0,0,1-18.82-8.58A41.19,41.19,0,0,1,705,348.56q-4.65-9.42-4.66-22.8,0-15.09,5.18-24.69a44.92,44.92,0,0,1,13.64-15.6,62.63,62.63,0,0,1,19.33-9.09q10.88-3.08,22.27-5.14,12.08-2.4,23-3.6a128,128,0,0,0,19.16-3.43c5.53-1.48,9.89-3.65,13.12-6.51s4.83-7,4.83-12.52q0-9.6-3.62-15.43a24.94,24.94,0,0,0-9.32-8.92,38.38,38.38,0,0,0-12.78-4.11,96.54,96.54,0,0,0-14-1q-18.63,0-31.07,7T736.6,249.29H707.26q.69-16.46,6.9-27.77a52.21,52.21,0,0,1,16.57-18.35,70,70,0,0,1,23.65-10.11A125.51,125.51,0,0,1,782.86,190a168.63,168.63,0,0,1,24,1.72,63.26,63.26,0,0,1,21.58,7A41.23,41.23,0,0,1,844,213.59q5.87,9.57,5.87,25v91q0,10.26,1.21,15.05t8.11,4.79a35.57,35.57,0,0,0,9-1.37Zm-47.64-90.87c-3.69,2.74-8.52,4.72-14.5,6s-12.26,2.27-18.82,3.07-13.17,1.71-19.85,2.73a73.7,73.7,0,0,0-18,4.94,32.62,32.62,0,0,0-12.94,9.73q-5,6.32-5,17.23a23.31,23.31,0,0,0,2.94,12.11,24.11,24.11,0,0,0,7.59,8,32,32,0,0,0,10.88,4.44,60.94,60.94,0,0,0,13.11,1.36q14.5,0,24.86-3.92a52.49,52.49,0,0,0,16.91-9.9,39.1,39.1,0,0,0,9.67-13,32.53,32.53,0,0,0,3.11-13.14ZM1002.07,225q-11.05-9.25-29.69-9.26-15.89,0-26.58,5.83A47.29,47.29,0,0,0,928.71,237a64.66,64.66,0,0,0-9.15,22.12A119.83,119.83,0,0,0,916.8,285a98.22,98.22,0,0,0,2.93,24,64.18,64.18,0,0,0,9.15,20.74,46.2,46.2,0,0,0,16.23,14.58q10,5.49,23.82,5.48,21.75,0,34-11.31t15-31.89h30q-4.83,32.91-24.68,50.75t-54,17.83q-20.37,0-36.07-6.52A69.86,69.86,0,0,1,907,350.11a79.92,79.92,0,0,1-15.88-28.63A118.64,118.64,0,0,1,885.73,285a129.41,129.41,0,0,1,5.18-37.21,85.63,85.63,0,0,1,15.71-30.17A73.46,73.46,0,0,1,933,197.35Q948.91,190,970,190a108.54,108.54,0,0,1,28.48,3.6,69.59,69.59,0,0,1,23.48,11.15,61,61,0,0,1,16.74,19q6.55,11.49,8.29,27.26h-30.38Q1013.11,234.21,1002.07,225Zm109.77-98.41v145l81.47-77.49h39.36l-70.77,64.46,75.95,112.82h-37.29l-61.1-92.59-27.62,25.38v67.21H1082.5V126.54Zm170.54,205.22a31.07,31.07,0,0,0,10.87,10.63,49,49,0,0,0,15.19,5.66,87.06,87.06,0,0,0,17.44,1.71,109.18,109.18,0,0,0,14.5-1,53.22,53.22,0,0,0,14-3.78,26.27,26.27,0,0,0,10.53-8q4.14-5.32,4.14-13.55,0-11.31-8.63-17.14a73.69,73.69,0,0,0-21.58-9.43q-12.94-3.6-28.13-6.52a146,146,0,0,1-28.14-8.23A58.16,58.16,0,0,1,1261,267.13q-8.64-9.6-8.63-26.75,0-13.38,6-23a49.26,49.26,0,0,1,15.53-15.61,71.76,71.76,0,0,1,21.4-8.91A99.41,99.41,0,0,1,1319,190a141.31,141.31,0,0,1,28,2.58,64.85,64.85,0,0,1,22.62,8.91,46.16,46.16,0,0,1,15.7,17.15q5.87,10.8,6.91,26.91h-29.35q-.69-8.57-4.48-14.23a29.36,29.36,0,0,0-9.67-9.08,44.16,44.16,0,0,0-12.94-5,67.68,67.68,0,0,0-14.33-1.54,87.29,87.29,0,0,0-13.29,1,45.28,45.28,0,0,0-12.26,3.6,24.49,24.49,0,0,0-9,6.86q-3.46,4.29-3.46,11.14a16.32,16.32,0,0,0,5.36,12.52,42.75,42.75,0,0,0,13.63,8.23,120,120,0,0,0,18.64,5.48q10.37,2.24,20.72,4.63,11,2.4,21.57,5.83A70.74,70.74,0,0,1,1382,284.1a44.55,44.55,0,0,1,13.12,14.23q5,8.58,5,21.26,0,16.13-6.73,26.75a52.5,52.5,0,0,1-17.61,17.14,73.89,73.89,0,0,1-24.51,9.09,146.3,146.3,0,0,1-27.1,2.57,126.24,126.24,0,0,1-28.31-3.09A69.56,69.56,0,0,1,1272,361.94a51.74,51.74,0,0,1-16.57-18.52q-6.21-11.49-6.9-27.95h29.34A32.65,32.65,0,0,0,1282.38,331.76Zm226.46-137.67v25.72h-35.56V329.88a31.37,31.37,0,0,0,.87,8.23,8.42,8.42,0,0,0,3.28,4.8,14.61,14.61,0,0,0,6.73,2.23,99.19,99.19,0,0,0,11.22.51h13.46v25.72H1486.4a105.8,105.8,0,0,1-19.5-1.55,28.65,28.65,0,0,1-13.12-5.65,24.09,24.09,0,0,1-7.42-11.66q-2.43-7.54-2.42-19.89V219.81h-30.38V194.09h30.38V140.94h29.34v53.15ZM1699.4,370.68q-7.61,4.45-21.06,4.46-11.4,0-18.12-6.34t-6.74-20.75a70.17,70.17,0,0,1-28.13,20.75,97.87,97.87,0,0,1-57.65,3.6,53.51,53.51,0,0,1-18.82-8.58,41.19,41.19,0,0,1-12.6-15.26q-4.65-9.42-4.66-22.8,0-15.09,5.18-24.69a44.92,44.92,0,0,1,13.64-15.6,62.63,62.63,0,0,1,19.33-9.09q10.88-3.08,22.27-5.14,12.07-2.4,23-3.6a128,128,0,0,0,19.16-3.43c5.53-1.48,9.89-3.65,13.12-6.51s4.83-7,4.83-12.52q0-9.6-3.62-15.43a24.94,24.94,0,0,0-9.32-8.92,38.38,38.38,0,0,0-12.78-4.11,96.54,96.54,0,0,0-14-1q-18.63,0-31.07,7t-13.46,26.57h-29.34q.67-16.46,6.9-27.77A52.21,52.21,0,0,1,1562,203.17a70,70,0,0,1,23.65-10.11,125.51,125.51,0,0,1,28.48-3.09,168.63,168.63,0,0,1,24,1.72,63.26,63.26,0,0,1,21.58,7,41.23,41.23,0,0,1,15.53,14.89q5.87,9.57,5.87,25v91q0,10.26,1.21,15.05t8.11,4.79a35.57,35.57,0,0,0,9-1.37Zm-47.64-90.87c-3.69,2.74-8.52,4.72-14.5,6s-12.26,2.27-18.82,3.07-13.17,1.71-19.85,2.73a73.7,73.7,0,0,0-17.95,4.94,32.62,32.62,0,0,0-12.94,9.73q-5,6.32-5,17.23a23.31,23.31,0,0,0,2.94,12.11,24.11,24.11,0,0,0,7.59,8,32,32,0,0,0,10.88,4.44,60.94,60.94,0,0,0,13.11,1.36q14.51,0,24.86-3.92a52.49,52.49,0,0,0,16.91-9.9,39.1,39.1,0,0,0,9.67-13,32.53,32.53,0,0,0,3.11-13.14Zm208.85,141.62q-20,21.6-62.83,21.6a122.11,122.11,0,0,1-25.37-2.74,78,78,0,0,1-23.48-8.92,54.41,54.41,0,0,1-17.43-16.11q-6.91-10-7.6-24.35h29.35a21.47,21.47,0,0,0,5,13.38,36.67,36.67,0,0,0,11.4,8.91,55.52,55.52,0,0,0,14.67,5,79.51,79.51,0,0,0,15.19,1.55q14.49,0,24.51-5A46,46,0,0,0,1840.59,401a56.53,56.53,0,0,0,9.49-21.09,117.46,117.46,0,0,0,2.94-27.09V341.19h-.7q-7.59,16.46-23,24.18a71.8,71.8,0,0,1-32.63,7.71q-20,0-34.86-7.2A72.88,72.88,0,0,1,1737,346.51a82.13,82.13,0,0,1-15-28.46,116.62,116.62,0,0,1-5-34.47,133.92,133.92,0,0,1,4.14-32.4A88.17,88.17,0,0,1,1735,221a75.49,75.49,0,0,1,25.55-22.29q15.87-8.75,39-8.75a66.21,66.21,0,0,1,31.07,7.38,52.13,52.13,0,0,1,22.09,22.11h.35V194.09h27.61V356.28Q1880.63,399.83,1860.61,421.43Zm-37.46-79.72a47.94,47.94,0,0,0,16.4-15.78,71.89,71.89,0,0,0,9.15-22.11,106.77,106.77,0,0,0,2.93-24.69,96.71,96.71,0,0,0-2.76-23,64,64,0,0,0-8.8-20.4,45.76,45.76,0,0,0-15.71-14.57q-9.66-5.49-23.47-5.49-14.16,0-24.17,5.32a46.77,46.77,0,0,0-16.4,14.23,60.14,60.14,0,0,0-9.32,20.57,99.69,99.69,0,0,0-2.93,24.35,120.63,120.63,0,0,0,2.42,24,67.5,67.5,0,0,0,8.28,21.77,46.37,46.37,0,0,0,15.54,15.78q9.66,6,24.16,6T1823.15,341.71Zm228,18.34q-20,15.09-50.41,15.09-21.4,0-37.11-6.86a73.16,73.16,0,0,1-26.41-19.2,81.52,81.52,0,0,1-16-29.49,141.12,141.12,0,0,1-6-37.38,106.1,106.1,0,0,1,6.21-37A88.56,88.56,0,0,1,1938.8,216a79.09,79.09,0,0,1,26.58-19.2A81.66,81.66,0,0,1,1999,190q23.82,0,39.53,9.78a78,78,0,0,1,25.2,24.86,98.18,98.18,0,0,1,13.12,32.91,140.6,140.6,0,0,1,2.93,34h-133.6a70,70,0,0,0,2.76,22.12,49.9,49.9,0,0,0,10,18.51A49.1,49.1,0,0,0,1976.6,345q10.7,4.82,25.2,4.8,18.65,0,30.55-8.57t15.71-26.06h29Q2071.18,345,2051.17,360.05Zm-7.08-113.84a50,50,0,0,0-10.7-16,53.1,53.1,0,0,0-56.62-10.63,47.48,47.48,0,0,0-15.71,10.81,51.69,51.69,0,0,0-10.35,15.94,60.18,60.18,0,0,0-4.49,19.37h102.53A59.47,59.47,0,0,0,2044.09,246.21ZM302.9,180a80.62,80.62,0,0,0,13.44-10.37c.8-.77,1.55-1.54,2.31-2.31a81.89,81.89,0,0,0,7.92-9.37,62.37,62.37,0,0,0,6.27-10.77,48.6,48.6,0,0,0,4.36-16.4c1.49-19.39-10-38.67-35.62-54.22L198.42,14,78.16,129.22l-78.29,75,108.6,65.9a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.8,66.42-25.69,19.16-18.36,25.52-42.12,13.7-61.87a49.69,49.69,0,0,0-6.8-8.87,89.78,89.78,0,0,0,19.28,2.15H259a85.09,85.09,0,0,0,31-5.79A80.88,80.88,0,0,0,302.9,180Zm-100.59,59.8c-19.32,18.51-50.4,21.24-75.7,5.9l-75.13-45.6,67.44-64.65,76.42,46.39C222.88,198.57,221.36,221.6,202.31,239.84Zm8.94-82.21L140.6,114.74,205,53l69.37,42.11c25.94,15.73,29.31,37.05,10.55,55A60.71,60.71,0,0,1,211.25,157.63Zm29.86,190c-19.57,18.75-46.17,29.08-74.88,29.08a123.84,123.84,0,0,1-64.11-18.19L-.13,296.51v24.67l108.6,65.91a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.81,66.42-25.69,12.88-12.34,20-27.13,19.68-41.49v-1.79A87.85,87.85,0,0,1,241.11,347.67Zm0-39c-19.57,18.76-46.17,29.09-74.88,29.09a123.84,123.84,0,0,1-64.11-18.19L-.13,257.52V282.2l108.6,65.91a111.59,111.59,0,0,0,57.76,16.41c24.92,0,48.8-8.8,66.42-25.68,12.88-12.35,20-27.13,19.68-41.5v-1.79A86.86,86.86,0,0,1,241.11,308.68Zm0-39c-19.57,18.76-46.17,29.09-74.88,29.09a123.84,123.84,0,0,1-64.11-18.19L-.13,218.54v24.68l108.6,65.91a111.59,111.59,0,0,0,57.76,16.41c24.92,0,48.8-8.8,66.42-25.69,12.88-12.34,20-27.12,19.68-41.49v-1.82A87.14,87.14,0,0,1,241.11,269.7Zm83.69,25.74a94.16,94.16,0,0,1-60.19,25.86h0V348a81.6,81.6,0,0,0,51.73-22.37c14-13.38,21.15-28.11,21-42.64v-2.2A95.14,95.14,0,0,1,324.8,295.44Zm-83.69,91.21c-19.57,18.75-46.17,29.09-74.88,29.09a123.76,123.76,0,0,1-64.11-18.2L-.13,335.49v24.67l108.6,65.91a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.81,66.42-25.69,12.88-12.34,20-27.13,19.68-41.49v-1.79A87.35,87.35,0,0,1,241.11,386.65Zm85.75-210.21c-.68.69-1.35,1.38-2.06,2.05a99.19,99.19,0,0,1-22.23,15.69,94.53,94.53,0,0,1-26.24,8.71,97.84,97.84,0,0,1-14.16,1.57c.5,1.61.9,3.25,1.25,4.9a52.7,52.7,0,0,1,1.13,12V231h.05A84.48,84.48,0,0,0,290,225.47a80.83,80.83,0,0,0,26.38-16.82c.81-.77,1.51-1.56,2.27-2.34a82,82,0,0,0,7.92-9.38,62.85,62.85,0,0,0,6.29-10.78,48.5,48.5,0,0,0,4.32-16.44c.09-1.23.2-2.47.19-3.7v-2c-.72,1-1.48,2.06-2.26,3.09A98,98,0,0,1,326.86,176.44Zm0,77.92c-.68.7-1.3,1.41-2,2.1a94.09,94.09,0,0,1-60.19,25.85h0V309h0a81.65,81.65,0,0,0,51.73-22.37,73.51,73.51,0,0,0,16.48-22.49,48.56,48.56,0,0,0,4.32-16.44c.09-1.24.2-2.48.19-3.71v-2.2c-.74,1.08-1.47,2.16-2.27,3.22A95.81,95.81,0,0,1,326.82,254.36Zm0-39c-.68.7-1.3,1.41-2,2.1a92.22,92.22,0,0,1-10.62,8.65,93.53,93.53,0,0,1-11.63,7,95.63,95.63,0,0,1-37.94,10.18h-.05l0,26.67h0a81.63,81.63,0,0,0,51.73-22.37c.81-.77,1.51-1.56,2.27-2.34a82,82,0,0,0,7.92-9.38,63.16,63.16,0,0,0,6.29-10.77,48.55,48.55,0,0,0,4.32-16.45c.09-1.23.2-2.47.19-3.7v-2.2c-.74,1.08-1.47,2.16-2.27,3.22A98.19,98.19,0,0,1,326.82,215.38Z" class="cls-1"/></svg>';

// public/favicon.svg
var favicon_default = '<svg xmlns="http://www.w3.org/2000/svg" id="Assets" viewBox="0 0 337.46 428.5"><style>path{fill:#121212}@media (prefers-color-scheme:dark){path{fill:#7df3e1}}</style><path d="M303,166.05a80.69,80.69,0,0,0,13.45-10.37c.79-.77,1.55-1.53,2.3-2.3a83.12,83.12,0,0,0,7.93-9.38A63.69,63.69,0,0,0,333,133.23a48.58,48.58,0,0,0,4.35-16.4c1.49-19.39-10-38.67-35.62-54.22L198.56,0,78.3,115.23,0,190.25l108.6,65.91a111.59,111.59,0,0,0,57.76,16.41c24.92,0,48.8-8.8,66.42-25.69,19.16-18.36,25.52-42.12,13.7-61.87a49.22,49.22,0,0,0-6.8-8.87A89.17,89.17,0,0,0,259,178.29h.15a85.08,85.08,0,0,0,31-5.79A80.88,80.88,0,0,0,303,166.05ZM202.45,225.86c-19.32,18.51-50.4,21.23-75.7,5.9L51.61,186.15l67.45-64.64,76.41,46.38C223,184.58,221.49,207.61,202.45,225.86Zm8.93-82.22-70.65-42.89L205.14,39,274.51,81.1c25.94,15.72,29.31,37,10.55,55A60.69,60.69,0,0,1,211.38,143.64Zm29.86,190c-19.57,18.75-46.17,29.09-74.88,29.09a123.73,123.73,0,0,1-64.1-18.2L0,282.52v24.67L108.6,373.1a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.81,66.42-25.69,12.88-12.34,20-27.13,19.68-41.49v-1.79A87.27,87.27,0,0,1,241.24,333.68Zm0-39c-19.57,18.75-46.17,29.08-74.88,29.08a123.81,123.81,0,0,1-64.1-18.19L0,243.53v24.68l108.6,65.91a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.81,66.42-25.69,12.88-12.34,20-27.13,19.68-41.5v-1.78A87.27,87.27,0,0,1,241.24,294.7Zm0-39c-19.57,18.76-46.17,29.09-74.88,29.09a123.81,123.81,0,0,1-64.1-18.19L0,204.55v24.68l108.6,65.91a111.59,111.59,0,0,0,57.76,16.41c24.92,0,48.8-8.8,66.42-25.68,12.88-12.35,20-27.13,19.68-41.5v-1.82A86.09,86.09,0,0,1,241.24,255.71Zm83.7,25.74a94.15,94.15,0,0,1-60.2,25.86h0V334a81.6,81.6,0,0,0,51.74-22.37c14-13.38,21.14-28.11,21-42.64v-2.19A94.92,94.92,0,0,1,324.94,281.45Zm-83.7,91.21c-19.57,18.76-46.17,29.09-74.88,29.09a123.73,123.73,0,0,1-64.1-18.2L0,321.5v24.68l108.6,65.9a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.8,66.42-25.69,12.88-12.34,20-27.13,19.68-41.49v-1.79A86.29,86.29,0,0,1,241.24,372.66ZM327,162.45c-.68.69-1.35,1.38-2.05,2.06a94.37,94.37,0,0,1-10.64,8.65,91.35,91.35,0,0,1-11.6,7,94.53,94.53,0,0,1-26.24,8.71,97.69,97.69,0,0,1-14.16,1.57c.5,1.61.9,3.25,1.25,4.9a53.27,53.27,0,0,1,1.14,12V217h.05a84.41,84.41,0,0,0,25.35-5.55,81,81,0,0,0,26.39-16.82c.8-.77,1.5-1.56,2.26-2.34a82.08,82.08,0,0,0,7.93-9.38A63.76,63.76,0,0,0,333,172.17a48.55,48.55,0,0,0,4.32-16.45c.09-1.23.2-2.47.19-3.7V150q-1.08,1.54-2.25,3.09A96.73,96.73,0,0,1,327,162.45Zm0,77.92c-.69.7-1.31,1.41-2,2.1a94.2,94.2,0,0,1-60.2,25.86h0l0,26.67h0a81.6,81.6,0,0,0,51.74-22.37A73.51,73.51,0,0,0,333,250.13a48.56,48.56,0,0,0,4.32-16.44c.09-1.24.2-2.47.19-3.71v-2.19c-.74,1.07-1.46,2.15-2.27,3.21A95.68,95.68,0,0,1,327,240.37Zm0-39c-.69.7-1.31,1.41-2,2.1a93.18,93.18,0,0,1-10.63,8.65,91.63,91.63,0,0,1-11.63,7,95.47,95.47,0,0,1-37.94,10.18h0V256h0a81.65,81.65,0,0,0,51.74-22.37c.8-.77,1.5-1.56,2.26-2.34a82.08,82.08,0,0,0,7.93-9.38A63.76,63.76,0,0,0,333,211.15a48.56,48.56,0,0,0,4.32-16.44c.09-1.24.2-2.48.19-3.71v-2.2c-.74,1.08-1.46,2.16-2.27,3.22A95.68,95.68,0,0,1,327,201.39Z"/></svg>';

// src/assets/logo-teal.png
var logo_teal_default = "data:image/png;base64,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";

// .build/valueModel.txt
var valueModel_default = "// Number formatting shared by the model, the deck and the exports. Pure.\n\nexport function fmtMoney(n) {\n  if (n == null || isNaN(n)) return '-'\n  const abs = Math.abs(n)\n  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`\n  if (abs >= 1_000) return `$${Math.round(n / 1000)}k`\n  return `$${Math.round(n)}`\n}\n\nexport function fmtMoneyFull(n) {\n  if (n == null || isNaN(n)) return '-'\n  return `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`\n}\n\nexport function fmtNum(n) {\n  if (n == null || isNaN(n)) return '-'\n  return Math.round(n).toLocaleString('en-US')\n}\n\n// A number with up to `max` decimals and no trailing zeros: 3, 2.5, 0.8, 1,440.\nexport function fmtDec(n, max = 2) {\n  if (n == null || isNaN(n)) return '-'\n  return Number(n.toFixed(max)).toLocaleString('en-US', { maximumFractionDigits: max })\n}\n\nexport function fmtHours(n) {\n  if (n == null || isNaN(n)) return '-'\n  if (n >= 1000) return `${Math.round(n / 1000)}k hours`\n  return `${Math.round(n)} hours`\n}\n\nexport function fmtMonths(n) {\n  if (n == null || isNaN(n) || n <= 0) return 'n/a'\n  if (n < 1) return 'under 1 month'\n  const r = Math.round(n)\n  return `${r} ${r === 1 ? 'month' : 'months'}`\n}\n\n// The model. Every figure on the deck comes from here, by plain arithmetic.\n//\n// computeModel(inputs) is a pure function: no async, no fetch, no model call, no\n// side effects. Given the same inputs it returns the same figures. The deck, the\n// exports and the website are renders of what it returns, and none of them holds\n// a number of its own.\n//\n// Each figure is { value, raw, equation, flag }\n//   value     the number to show: finite and never below zero\n//   raw       the same number before clamping (still finite), so a case where\n//             Portal costs more than it returns can still be told apart from zero\n//   equation  the formula with the current values substituted, so anyone can check it\n//   flag      null, or why the value is not simply the arithmetic:\n//               'clamped'          the result was below zero and is shown as 0\n//               'divide-by-zero'   the divisor was 0, so the figure is 0\n//               'not-finite'       the result was NaN or Infinity, so the figure is 0\n//\n// Inputs are read as numbers; anything missing, non-numeric or negative is read\n// as 0 (and listed in `invalidInputs`), and percentages are held to 0 to 100.\n\nimport { fmtMoneyFull, fmtDec } from './format.js'\n\nexport const FIGURE_ORDER = [\n  'platformEngineers',\n  // speed\n  'hoursSavedPerEngPerWeek',\n  'productivityValue',\n  'rampDaysSaved',\n  'onboardingValue',\n  // chaos-control\n  'incidentHoursSaved',\n  'incidentValue',\n  // scale\n  'maintHoursSaved',\n  'platformValue',\n  'toolingValue',\n  // roll-ups\n  'totalValue',\n  'netValue',\n  'paybackMonths',\n  'roiMultiple',\n  'fiveYearValue',\n  // alternative\n  'selfHostCost',\n  'versusSelfHost'\n]\n\nexport const NUMERIC_INPUTS = [\n  'engineers',\n  'platformShare',\n  'hourlyCost',\n  'searchHoursToday',\n  'searchHoursPortal',\n  'rampDaysToday',\n  'rampDaysPortal',\n  'newHiresPerYear',\n  'incidentHoursToday',\n  'incidentHoursPortal',\n  'peoplePerIncident',\n  'incidentsPerMonth',\n  'maintPctToday',\n  'maintPctPortal',\n  'toolSpendToday',\n  'toolSpendPortal',\n  'portalCost',\n  'selfHostEngineers',\n  'selfHostSalary',\n  'weeksPerYear',\n  'hoursPerDay',\n  'hoursPerYear'\n]\n\nconst PERCENT_INPUTS = new Set(['platformShare', 'maintPctToday', 'maintPctPortal'])\n\n// Spotify's own deck puts standing up Backstage at 2 to 5 developers.\nexport const SELF_HOST_RANGE = [2, 5]\n// Upkeep Portal removes and headcount self-hosting needs describe the same\n// thing, so they should land within this share of each other.\nexport const CONSISTENCY_TOLERANCE = 0.5\n\nconst money = n => fmtMoneyFull(n)\nconst num = n => fmtDec(n, 2)\n\nexport function computeModel(rawInputs = {}) {\n  // ---- read the inputs as safe numbers\n  const invalidInputs = []\n  const I = {}\n  for (const key of NUMERIC_INPUTS) {\n    const given = rawInputs ? rawInputs[key] : undefined\n    let v = given === '' || given == null ? NaN : Number(given)\n    let bad = null\n    if (!Number.isFinite(v)) {\n      bad = 'not a number'\n      v = 0\n    } else if (v < 0) {\n      bad = 'negative'\n      v = 0\n    } else if (PERCENT_INPUTS.has(key) && v > 100) {\n      bad = 'over 100%'\n      v = 100\n    }\n    if (bad && !(given === undefined)) invalidInputs.push({ key, problem: bad })\n    I[key] = v\n  }\n\n  // ---- one figure\n  const F = {}\n  const figure = (key, raw, equation, divideByZero = false) => {\n    let flag = null\n    let value = raw\n    if (divideByZero) {\n      value = 0\n      flag = 'divide-by-zero'\n    } else if (!Number.isFinite(value)) {\n      value = 0\n      flag = 'not-finite'\n    } else if (value < 0) {\n      value = 0\n      flag = 'clamped'\n    }\n    F[key] = { value, raw: Number.isFinite(raw) && !divideByZero ? raw : 0, equation, flag }\n    return F[key]\n  }\n  // a difference that was clamped prints as 0, not as a negative that was not used\n  const diff = (f, a, b, fmt = num) => (f.flag === 'clamped' ? '0' : `(${fmt(a)} - ${fmt(b)})`)\n\n  // ---- platform engineers are derived, not asked for\n  figure('platformEngineers', I.engineers * (I.platformShare / 100), `${num(I.engineers)} * ${num(I.platformShare)}%`)\n\n  // ---- SPEED\n  const hs = figure('hoursSavedPerEngPerWeek', I.searchHoursToday - I.searchHoursPortal, `${num(I.searchHoursToday)} - ${num(I.searchHoursPortal)}`)\n  figure(\n    'productivityValue',\n    hs.value * I.engineers * I.weeksPerYear * I.hourlyCost,\n    `${diff(hs, I.searchHoursToday, I.searchHoursPortal)} * ${num(I.engineers)} * ${num(I.weeksPerYear)} * ${money(I.hourlyCost)}`\n  )\n  const rd = figure('rampDaysSaved', I.rampDaysToday - I.rampDaysPortal, `${num(I.rampDaysToday)} - ${num(I.rampDaysPortal)}`)\n  figure(\n    'onboardingValue',\n    rd.value * I.newHiresPerYear * I.hoursPerDay * I.hourlyCost,\n    `${diff(rd, I.rampDaysToday, I.rampDaysPortal)} * ${num(I.newHiresPerYear)} * ${num(I.hoursPerDay)} * ${money(I.hourlyCost)}`\n  )\n\n  // ---- CHAOS-CONTROL\n  const ihDiff = I.incidentHoursToday - I.incidentHoursPortal\n  const ih = figure(\n    'incidentHoursSaved',\n    Math.max(0, ihDiff) * I.peoplePerIncident * I.incidentsPerMonth * 12,\n    `${ihDiff < 0 ? '0' : `(${num(I.incidentHoursToday)} - ${num(I.incidentHoursPortal)})`} * ${num(I.peoplePerIncident)} * ${num(I.incidentsPerMonth)} * 12`\n  )\n  // a negative saving is clamped at the difference, not by multiplying negatives together\n  if (ihDiff < 0) F.incidentHoursSaved.flag = 'clamped'\n  figure('incidentValue', ih.value * I.hourlyCost, `${num(ih.value)} * ${money(I.hourlyCost)}`)\n\n  // ---- SCALE\n  const pe = F.platformEngineers.value\n  const mDiff = I.maintPctToday - I.maintPctPortal\n  const mh = figure(\n    'maintHoursSaved',\n    pe * (Math.max(0, mDiff) / 100) * I.hoursPerYear,\n    `${num(pe)} * ${mDiff < 0 ? '0' : `(${num(I.maintPctToday)} - ${num(I.maintPctPortal)})`} / 100 * ${num(I.hoursPerYear)}`\n  )\n  if (mDiff < 0) F.maintHoursSaved.flag = 'clamped'\n  figure('platformValue', mh.value * I.hourlyCost, `${num(mh.value)} * ${money(I.hourlyCost)}`)\n  figure('toolingValue', I.toolSpendToday - I.toolSpendPortal, `${money(I.toolSpendToday)} - ${money(I.toolSpendPortal)}`)\n\n  // ---- ROLL-UPS\n  const drivers = ['productivityValue', 'onboardingValue', 'incidentValue', 'platformValue', 'toolingValue']\n  const total = figure('totalValue', drivers.reduce((s, k) => s + F[k].value, 0), drivers.map(k => money(F[k].value)).join(' + '))\n  const net = figure('netValue', total.value - I.portalCost, `${money(total.value)} - ${money(I.portalCost)}`)\n  const monthly = total.value / 12\n  figure(\n    'paybackMonths',\n    monthly === 0 ? 0 : I.portalCost / monthly,\n    `${money(I.portalCost)} / (${money(total.value)} / 12)`,\n    monthly === 0\n  )\n  figure('roiMultiple', I.portalCost === 0 ? 0 : total.value / I.portalCost, `${money(total.value)} / ${money(I.portalCost)}`, I.portalCost === 0)\n  figure('fiveYearValue', net.raw * 5, `${money(net.raw)} * 5`)\n\n  // ---- ALTERNATIVE\n  const sh = figure('selfHostCost', I.selfHostEngineers * I.selfHostSalary, `${num(I.selfHostEngineers)} * ${money(I.selfHostSalary)}`)\n  figure('versusSelfHost', sh.value - I.portalCost, `${money(sh.value)} - ${money(I.portalCost)}`)\n\n  return { inputs: I, figures: F, order: FIGURE_ORDER, warnings: consistencyWarnings(I, F), invalidInputs }\n}\n\n// The case has to agree with itself: the upkeep burden Portal removes\n// (maintHoursSaved / hoursPerYear, in engineers) and the headcount that\n// self-hosting needs describe the same thing from two directions.\nfunction consistencyWarnings(I, F) {\n  const warnings = []\n  const removed = I.hoursPerYear > 0 ? F.maintHoursSaved.value / I.hoursPerYear : 0\n  const needed = I.selfHostEngineers\n\n  const apart = needed === 0 ? removed > 0 : Math.abs(removed - needed) / needed > CONSISTENCY_TOLERANCE\n  if (apart) {\n    warnings.push({\n      key: 'consistency',\n      severity: 'warning',\n      inputs: ['maintPctToday', 'maintPctPortal', 'platformShare', 'selfHostEngineers'],\n      message: `The case is not internally consistent. The upkeep Portal removes equals about ${num(removed)} engineers, but self-hosting is set to need ${num(needed)}. These describe the same thing, so they should be within ${Math.round(CONSISTENCY_TOLERANCE * 100)}% of each other.`\n    })\n  }\n  if (needed < SELF_HOST_RANGE[0] || needed > SELF_HOST_RANGE[1]) {\n    warnings.push({\n      key: 'selfHostRange',\n      severity: 'warning',\n      inputs: ['selfHostEngineers'],\n      message: `Spotify's own deck puts standing up Backstage at ${SELF_HOST_RANGE[0]} to ${SELF_HOST_RANGE[1]} developers. ${num(needed)} is outside that range, so expect the customer to question it.`\n    })\n  }\n  return warnings\n}\n\n// A plain { figureKey: value } view of a model.\nexport function figureValues(model) {\n  return Object.fromEntries(FIGURE_ORDER.map(k => [k, model.figures[k].value]))\n}\n\n// The content around the model: what the inputs are, how they are grouped under\n// Spotify's three pillars, who the stakeholders are, and how archetypes bias the\n// case. The arithmetic itself lives in model.js; nothing here calculates a figure.\n//\n// Every formula comes from Chris's written answer to Q8 (\"What inputs and KPIs\n// do you use to calculate ROI?\"). Every saving is a difference, so the inputs\n// come in pairs: how it is today, and how it is with Portal.\n\nimport { fmtMoney, fmtHours, fmtMonths } from './format.js'\n\nexport { fmtMoney, fmtMoneyFull, fmtNum, fmtDec, fmtHours, fmtMonths } from './format.js'\n\nexport const WORKING_WEEKS = 48 // Chris's worked example uses about 48\nexport const HOURS_PER_YEAR = 2080\n\n// ---------------------------------------------------------------------------\n// Spotify's three pillars. Every value driver sits under one of them.\n// ---------------------------------------------------------------------------\n\nexport const PILLARS = [\n  { key: 'speed', label: 'Speed', blurb: 'Engineers spend their time building, not searching.', color: '#2fc7a8' },\n  { key: 'chaos', label: 'Chaos-control', blurb: 'Fewer and shorter incidents, with clear owners.', color: '#e5399a' },\n  { key: 'scale', label: 'Scale', blurb: 'The platform grows without growing the upkeep.', color: '#111111' }\n]\n\nexport const DRIVERS = [\n  { key: 'productivity', label: 'Engineer time recovered', short: 'Productivity', pillar: 'speed', figure: 'productivityValue' },\n  { key: 'onboarding', label: 'Faster onboarding', short: 'Onboarding', pillar: 'speed', figure: 'onboardingValue' },\n  { key: 'incidents', label: 'Shorter incidents', short: 'Incidents', pillar: 'chaos', figure: 'incidentValue' },\n  { key: 'platform', label: 'Platform team maintenance avoided', short: 'Platform load', pillar: 'scale', figure: 'platformValue' },\n  { key: 'tooling', label: 'Overlapping tooling retired', short: 'Tooling', pillar: 'scale', figure: 'toolingValue' }\n].map(d => ({ ...d, color: PILLARS.find(p => p.key === d.pillar).color }))\n\n// ---------------------------------------------------------------------------\n// Inputs\n// ---------------------------------------------------------------------------\n// `confirmed: false` means this is still an ASSUMPTION. It flips to true when the\n// customer confirms it on a call. `structural` inputs (the calendar) are not\n// claims about the customer, so they do not count toward confidence.\n\nexport const INPUT_GROUPS = ['Account', 'Scale', 'Speed', 'Chaos-control', 'Cost and alternative', 'Calendar']\n\nexport const INPUT_FIELDS = [\n  // ---- Account\n  { key: 'companyName', label: 'Company', group: 'Account', type: 'text', value: 'Northwind Retail', confirmed: true, help: 'Who the case is for.' },\n  {\n    key: 'archetype',\n    label: 'Archetype',\n    group: 'Account',\n    type: 'select',\n    options: ['Fast / AI-native', 'Scaling tech', 'Enterprise', 'Regulated enterprise'],\n    value: 'Enterprise',\n    confirmed: true,\n    help: 'Sets which stakeholder tabs exist and which pillar leads the case.'\n  },\n\n  // ---- Scale\n  { key: 'engineers', label: 'Engineers', group: 'Scale', type: 'number', value: 500, confirmed: true, help: 'Usually findable from LinkedIn before the first call.' },\n  {\n    key: 'platformShare',\n    label: 'Share of engineering that is platform / DevEx',\n    group: 'Scale',\n    type: 'percent',\n    value: 30,\n    confirmed: false,\n    help: \"Chris's rule: roughly 30% of the engineering org is platform or DevEx. The platform headcount is worked out from this.\"\n  },\n  { key: 'hourlyCost', label: 'Fully loaded cost per engineer hour', group: 'Scale', type: 'number', value: 100, unit: '$/hr', confirmed: false, help: \"Salary, benefits and overhead. Chris uses $100/hr in his worked example.\" },\n  {\n    key: 'maintPctToday', label: 'Platform team time spent maintaining the portal, today', group: 'Scale', type: 'number', value: 4, unit: '%', step: 0.5, confirmed: false, pair: 'maint', side: 'today',\n    help: 'Share of the platform / DevEx team (not all engineers) kept busy upgrading, patching and running their current portal or wiki.'\n  },\n  { key: 'maintPctPortal', label: 'Platform team time spent maintaining the portal, with Portal', group: 'Scale', type: 'number', value: 2, unit: '%', step: 0.5, confirmed: false, pair: 'maint', side: 'portal' },\n  { key: 'toolSpendToday', label: 'Overlapping tool spend, today', group: 'Scale', type: 'number', value: 180000, unit: '$/yr', step: 5000, confirmed: false, pair: 'tool', side: 'today', help: 'What they pay each year for tools Portal would replace or consolidate.' },\n  { key: 'toolSpendPortal', label: 'Overlapping tool spend, with Portal', group: 'Scale', type: 'number', value: 90000, unit: '$/yr', step: 5000, confirmed: false, pair: 'tool', side: 'portal' },\n\n  // ---- Speed\n  {\n    key: 'searchHoursToday', label: 'Time spent searching for docs, services and owners, today', group: 'Speed', type: 'number', value: 3, unit: 'hrs / eng / week', step: 0.5, confirmed: false, pair: 'search', side: 'today',\n    help: 'Hours each engineer loses per week hunting. Industry estimates put tech debt at 2 to 5 days per engineer per month.'\n  },\n  {\n    key: 'searchHoursPortal', label: 'Time spent searching, with Portal', group: 'Speed', type: 'number', value: 2, unit: 'hrs / eng / week', step: 0.5, confirmed: false, pair: 'search', side: 'portal',\n    help: 'The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them.'\n  },\n  { key: 'rampDaysToday', label: 'Days for a new hire to first contribution, today', group: 'Speed', type: 'number', value: 14, unit: 'days', confirmed: false, pair: 'ramp', side: 'today' },\n  { key: 'rampDaysPortal', label: 'Days to first contribution, with Portal', group: 'Speed', type: 'number', value: 10, unit: 'days', confirmed: false, pair: 'ramp', side: 'portal' },\n  { key: 'newHiresPerYear', label: 'Engineers hired per year', group: 'Speed', type: 'number', value: 80, confirmed: false, help: 'From the hiring plan if you can get it.' },\n\n  // ---- Chaos-control\n  {\n    key: 'incidentHoursToday', label: 'Hours each person spends on an incident, today', group: 'Chaos-control', type: 'number', value: 4, unit: 'hrs', step: 0.1, confirmed: false, pair: 'incident', side: 'today',\n    help: 'Most of it is finding who owns the failing service.'\n  },\n  { key: 'incidentHoursPortal', label: 'Hours each person spends on an incident, with Portal', group: 'Chaos-control', type: 'number', value: 3.2, unit: 'hrs', step: 0.1, confirmed: false, pair: 'incident', side: 'portal' },\n  { key: 'peoplePerIncident', label: 'People pulled into each incident', group: 'Chaos-control', type: 'number', value: 5, confirmed: false },\n  { key: 'incidentsPerMonth', label: 'Incidents per month', group: 'Chaos-control', type: 'number', value: 12, confirmed: false },\n\n  // ---- Cost and alternative\n  { key: 'portalCost', label: 'Portal annual subscription', group: 'Cost and alternative', type: 'number', value: 400000, unit: '$/yr', step: 10000, confirmed: false, help: 'A placeholder until there is a quote.' },\n  {\n    key: 'selfHostEngineers', label: 'Engineers needed to self-host Backstage', group: 'Cost and alternative', type: 'number', value: 3, step: 0.5, confirmed: false,\n    help: \"The comparison that decides most deals. Spotify's own deck puts standing up Backstage at 2 to 5 developers. It should also roughly match the upkeep hours Portal saves.\"\n  },\n  { key: 'selfHostSalary', label: 'Fully loaded cost per self-host engineer', group: 'Cost and alternative', type: 'number', value: 210000, unit: '$/yr', step: 5000, confirmed: false },\n\n  // ---- Calendar (structural: not claims about the customer)\n  { key: 'weeksPerYear', label: 'Working weeks per year', group: 'Calendar', type: 'number', value: WORKING_WEEKS, confirmed: true, structural: true, help: \"Chris's worked example uses about 48.\" },\n  { key: 'hoursPerDay', label: 'Working hours per day', group: 'Calendar', type: 'number', value: 8, confirmed: true, structural: true },\n  { key: 'hoursPerYear', label: 'Working hours per year', group: 'Calendar', type: 'number', value: HOURS_PER_YEAR, confirmed: true, structural: true }\n]\n\n// The today / with-Portal pairs. `valueFigure` is the model figure the saving is worth.\nexport const PAIRS = [\n  { key: 'search', group: 'Speed', label: 'Time spent searching', unit: 'hrs / eng / week', today: 'searchHoursToday', portal: 'searchHoursPortal', saved: 'saved per engineer per week', valueFigure: 'productivityValue', driver: 'productivity' },\n  { key: 'ramp', group: 'Speed', label: 'Days to first contribution', unit: 'days', today: 'rampDaysToday', portal: 'rampDaysPortal', saved: 'saved per new hire', valueFigure: 'onboardingValue', driver: 'onboarding' },\n  { key: 'incident', group: 'Chaos-control', label: 'Hours per person per incident', unit: 'hrs', today: 'incidentHoursToday', portal: 'incidentHoursPortal', saved: 'saved per person per incident', valueFigure: 'incidentValue', driver: 'incidents' },\n  { key: 'maint', group: 'Scale', label: 'Platform team time on upkeep', unit: '%', today: 'maintPctToday', portal: 'maintPctPortal', saved: 'of the platform team freed up', valueFigure: 'platformValue', driver: 'platform' },\n  { key: 'tool', group: 'Scale', label: 'Overlapping tool spend', unit: '$/yr', today: 'toolSpendToday', portal: 'toolSpendPortal', saved: 'a year saved', valueFigure: 'toolingValue', driver: 'tooling', money: true }\n]\n\nconst isClaim = f => (f.type === 'number' || f.type === 'percent') && !f.structural\n\n// Share of the numbers that actually move the case that have been confirmed.\nexport function confidence(fields) {\n  const material = fields.filter(isClaim)\n  if (!material.length) return 0\n  return Math.round((material.filter(f => f.confirmed).length / material.length) * 100)\n}\n\nexport function unconfirmed(fields) {\n  return fields.filter(f => !f.confirmed && isClaim(f))\n}\n\n// ---------------------------------------------------------------------------\n// Stakeholder views\n// ---------------------------------------------------------------------------\n// REPLACE THE PLACEHOLDER COPY BELOW WITH CHRIS'S OWN WORDS. Headlines read the\n// model: headline(model) where model = computeModel(inputs).\n\nexport const hoursBack = model =>\n  model.figures.hoursSavedPerEngPerWeek.value * model.inputs.engineers * model.inputs.weeksPerYear\n\nexport const costsAvoided = model => model.figures.platformValue.value + model.figures.toolingValue.value\n\nexport const STAKEHOLDERS = [\n  {\n    key: 'champion',\n    role: 'Director / VP Engineering',\n    tag: 'Usually the champion',\n    cares: 'Their team shipping instead of searching',\n    lead: ['productivity', 'onboarding'],\n    headline: m => `${fmtHours(hoursBack(m))} of engineering time back per year`,\n    objection: 'My team already knows where things are.',\n    counter: 'Ask how a new hire finds the owner of a service during an incident. The cost lands on the people who joined most recently.',\n    needsToSee: [\n      'Time recovered per engineer, not just in aggregate',\n      'Onboarding time for the hires they are about to make',\n      'That it does not become another system their team has to maintain'\n    ]\n  },\n  {\n    key: 'cto',\n    role: 'CTO',\n    tag: 'Often has the opposite goal',\n    cares: 'Cutting spend while the org keeps growing',\n    lead: ['platform', 'tooling'],\n    headline: m => `${fmtMoney(costsAvoided(m))} of run cost avoided per year`,\n    objection: 'Backstage is open source. Why are we paying for it?',\n    counter: 'The licence is free, the operation is not. Self-hosting means a standing platform team for upgrades, patches and infrastructure, permanently.',\n    needsToSee: [\n      'Total cost of ownership against self-hosting, not against doing nothing',\n      'What gets retired, not just what gets added',\n      'That this is one line item replacing several'\n    ]\n  },\n  {\n    key: 'finance',\n    role: 'Finance / Procurement',\n    tag: 'Shows up late and can stall a done deal',\n    cares: 'Payback, contract terms, and whether the numbers survive scrutiny',\n    lead: ['productivity', 'tooling'],\n    headline: m => {\n      const months = m.figures.paybackMonths.value\n      return months > 0 ? `Payback in ${fmtMonths(months)}` : 'No payback on these figures'\n    },\n    objection: 'These savings are soft. Nobody gets laid off because of this.',\n    counter: 'Present recovered capacity against hiring plans rather than as cash. The claim is avoided headcount, not reduced headcount.',\n    needsToSee: [\n      'Payback period and five-year value',\n      'Which inputs are confirmed and which are still assumptions',\n      'A conservative case, not the best case'\n    ]\n  },\n  {\n    key: 'security',\n    role: 'Security / Compliance',\n    tag: 'The late arrival that kills timelines',\n    cares: 'Proving which services meet which standards, on a date',\n    lead: ['incidents', 'platform'],\n    headline: () => 'Ownership and standards provable on demand',\n    objection: 'This is another system holding our service metadata.',\n    counter: 'Bring them in during discovery rather than at contract. Chris lost weeks on a deal where procurement rules surfaced only after everyone had agreed.',\n    needsToSee: [\n      'Where the data lives and who can see it',\n      'How standards are enforced and evidenced for an audit',\n      'The review timeline, raised early enough to matter'\n    ]\n  }\n]\n\n// ---------------------------------------------------------------------------\n// Archetype presets\n// ---------------------------------------------------------------------------\n// An archetype decides who is in the room (the stakeholder tabs) and which pillar\n// leads the case.\n\nexport const ARCHETYPES = {\n  'Fast / AI-native': {\n    stakeholders: ['champion', 'cto'],\n    pillars: ['speed', 'chaos', 'scale'],\n    note: 'Short cycle, few approvers. Lead with speed, not governance.',\n    alternative: 'Build something lightweight in-house'\n  },\n  'Scaling tech': {\n    stakeholders: ['champion', 'cto', 'finance'],\n    pillars: ['scale', 'speed', 'chaos'],\n    note: 'Informal systems are breaking as headcount grows.',\n    alternative: 'Self-host open source Backstage'\n  },\n  Enterprise: {\n    stakeholders: ['champion', 'cto', 'finance', 'security'],\n    pillars: ['scale', 'speed', 'chaos'],\n    note: 'Several approvers. Map the path early; procurement surfaces late.',\n    alternative: 'Self-host open source Backstage with a funded platform team'\n  },\n  'Regulated enterprise': {\n    stakeholders: ['champion', 'cto', 'finance', 'security'],\n    pillars: ['chaos', 'scale', 'speed'],\n    note: 'Long cycle, many layers. Compliance evidence is the lever.',\n    alternative: 'Self-host, or defer to the next budget year'\n  }\n}\n\nexport const archetypePillars = name => (ARCHETYPES[name] || ARCHETYPES.Enterprise).pillars\n\n// The stakeholders that should exist for an archetype: its built-in roles (keeping\n// any edits or positions already made) plus every custom stakeholder the user added.\nexport function stakeholdersForArchetype(current, archetype) {\n  const wanted = (ARCHETYPES[archetype] || ARCHETYPES.Enterprise).stakeholders\n  const builtinKeys = STAKEHOLDERS.map(s => s.key)\n  const kept = Object.fromEntries(current.filter(s => builtinKeys.includes(s.key)).map(s => [s.key, s]))\n  const builtin = wanted.map(key => kept[key] || { key, builtin: true })\n  const custom = current.filter(s => !builtinKeys.includes(s.key))\n  return [...builtin, ...custom]\n}\n\n// ---------------------------------------------------------------------------\n// The drivers, as the deck lays them out\n// ---------------------------------------------------------------------------\n\nexport function allDrivers(model) {\n  return DRIVERS.map(d => {\n    const f = model.figures[d.figure]\n    return { ...d, value: f.value, detail: f.equation, flag: f.flag }\n  })\n}\n\n// Drivers grouped under the three pillars, in the archetype's order. The first\n// pillar is the one that leads.\nexport function driversByPillar(model, archetype) {\n  const drivers = allDrivers(model)\n  return archetypePillars(archetype).map((key, i) => {\n    const pillar = PILLARS.find(p => p.key === key)\n    const items = drivers.filter(d => d.pillar === key)\n    return { ...pillar, leads: i === 0, items, total: items.reduce((s, d) => s + d.value, 0) }\n  })\n}\n\n// ---------------------------------------------------------------------------\n// Projects saved before the inputs were pairs\n// ---------------------------------------------------------------------------\n\nexport const OLD_INPUT_KEYS = new Set([\n  'hoursLostPerWeek', 'captureRate', 'platformEngineers', 'pctTimeMaintaining', 'daysSavedOnboarding',\n  'hoursPerIncident', 'incidentReduction', 'currentToolSpend', 'toolConsolidation'\n])\n\nconst round1 = n => Math.round(n * 10) / 10\n\n// Takes { key: { value, confirmed } } and returns the new-style keys derived from\n// any old-style ones, so a case built the old way keeps its numbers. Existing\n// new-style keys are never overwritten.\nexport function migrateOldInputs(saved) {\n  const out = {}\n  const has = k => saved[k] && saved[k].value != null\n  const val = k => Number(saved[k].value)\n  const ok = k => !!saved[k].confirmed\n\n  if (has('hoursLostPerWeek') && !('searchHoursToday' in saved)) {\n    const today = val('hoursLostPerWeek')\n    const capture = has('captureRate') ? val('captureRate') : 33\n    out.searchHoursToday = { value: today, confirmed: ok('hoursLostPerWeek') }\n    out.searchHoursPortal = { value: round1(today * (1 - capture / 100)), confirmed: ok('hoursLostPerWeek') && has('captureRate') && ok('captureRate') }\n  }\n  if (has('daysSavedOnboarding') && !('rampDaysToday' in saved)) {\n    const saving = val('daysSavedOnboarding')\n    const today = Math.max(14, saving)\n    out.rampDaysToday = { value: today, confirmed: false }\n    out.rampDaysPortal = { value: today - saving, confirmed: false }\n  }\n  if (has('hoursPerIncident') && !('incidentHoursToday' in saved)) {\n    const today = val('hoursPerIncident')\n    const cut = has('incidentReduction') ? val('incidentReduction') : 20\n    out.incidentHoursToday = { value: today, confirmed: ok('hoursPerIncident') }\n    out.incidentHoursPortal = { value: round1(today * (1 - cut / 100)), confirmed: ok('hoursPerIncident') && has('incidentReduction') && ok('incidentReduction') }\n  }\n  if (has('currentToolSpend') && !('toolSpendToday' in saved)) {\n    const today = val('currentToolSpend')\n    const cut = has('toolConsolidation') ? val('toolConsolidation') : 50\n    out.toolSpendToday = { value: today, confirmed: ok('currentToolSpend') }\n    out.toolSpendPortal = { value: Math.round(today * (1 - cut / 100)), confirmed: ok('currentToolSpend') && has('toolConsolidation') && ok('toolConsolidation') }\n  }\n  if (has('pctTimeMaintaining') && !('maintPctToday' in saved)) {\n    // The old model assumed Portal removed all of that upkeep.\n    out.maintPctToday = { value: val('pctTimeMaintaining'), confirmed: false }\n    out.maintPctPortal = { value: 0, confirmed: false }\n    if (has('platformEngineers') && has('engineers') && val('engineers') > 0 && !('platformShare' in saved)) {\n      out.platformShare = { value: Math.min(100, round1((val('platformEngineers') / val('engineers')) * 100)), confirmed: false }\n    }\n  }\n  return out\n}\n";

// src/format.js
function fmtMoney(n) {
  if (n == null || isNaN(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${Math.round(n)}`;
}
function fmtMoneyFull(n) {
  if (n == null || isNaN(n)) return "-";
  return `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}
function fmtDec(n, max = 2) {
  if (n == null || isNaN(n)) return "-";
  return Number(n.toFixed(max)).toLocaleString("en-US", { maximumFractionDigits: max });
}
function fmtHours(n) {
  if (n == null || isNaN(n)) return "-";
  if (n >= 1e3) return `${Math.round(n / 1e3)}k hours`;
  return `${Math.round(n)} hours`;
}
function fmtMonths(n) {
  if (n == null || isNaN(n) || n <= 0) return "n/a";
  if (n < 1) return "under 1 month";
  const r = Math.round(n);
  return `${r} ${r === 1 ? "month" : "months"}`;
}

// src/valueModel.js
var WORKING_WEEKS = 48;
var HOURS_PER_YEAR = 2080;
var PILLARS = [
  { key: "speed", label: "Speed", blurb: "Engineers spend their time building, not searching.", color: "#2fc7a8" },
  { key: "chaos", label: "Chaos-control", blurb: "Fewer and shorter incidents, with clear owners.", color: "#e5399a" },
  { key: "scale", label: "Scale", blurb: "The platform grows without growing the upkeep.", color: "#111111" }
];
var DRIVERS = [
  { key: "productivity", label: "Engineer time recovered", short: "Productivity", pillar: "speed", figure: "productivityValue" },
  { key: "onboarding", label: "Faster onboarding", short: "Onboarding", pillar: "speed", figure: "onboardingValue" },
  { key: "incidents", label: "Shorter incidents", short: "Incidents", pillar: "chaos", figure: "incidentValue" },
  { key: "platform", label: "Platform team maintenance avoided", short: "Platform load", pillar: "scale", figure: "platformValue" },
  { key: "tooling", label: "Overlapping tooling retired", short: "Tooling", pillar: "scale", figure: "toolingValue" }
].map((d) => ({ ...d, color: PILLARS.find((p) => p.key === d.pillar).color }));
var INPUT_FIELDS = [
  // ---- Account
  { key: "companyName", label: "Company", group: "Account", type: "text", value: "Northwind Retail", confirmed: true, help: "Who the case is for." },
  {
    key: "archetype",
    label: "Archetype",
    group: "Account",
    type: "select",
    options: ["Fast / AI-native", "Scaling tech", "Enterprise", "Regulated enterprise"],
    value: "Enterprise",
    confirmed: true,
    help: "Sets which stakeholder tabs exist and which pillar leads the case."
  },
  // ---- Scale
  { key: "engineers", label: "Engineers", group: "Scale", type: "number", value: 500, confirmed: true, help: "Usually findable from LinkedIn before the first call." },
  {
    key: "platformShare",
    label: "Share of engineering that is platform / DevEx",
    group: "Scale",
    type: "percent",
    value: 30,
    confirmed: false,
    help: "Chris's rule: roughly 30% of the engineering org is platform or DevEx. The platform headcount is worked out from this."
  },
  { key: "hourlyCost", label: "Fully loaded cost per engineer hour", group: "Scale", type: "number", value: 100, unit: "$/hr", confirmed: false, help: "Salary, benefits and overhead. Chris uses $100/hr in his worked example." },
  {
    key: "maintPctToday",
    label: "Platform team time spent maintaining the portal, today",
    group: "Scale",
    type: "number",
    value: 4,
    unit: "%",
    step: 0.5,
    confirmed: false,
    pair: "maint",
    side: "today",
    help: "Share of the platform / DevEx team (not all engineers) kept busy upgrading, patching and running their current portal or wiki."
  },
  { key: "maintPctPortal", label: "Platform team time spent maintaining the portal, with Portal", group: "Scale", type: "number", value: 2, unit: "%", step: 0.5, confirmed: false, pair: "maint", side: "portal" },
  { key: "toolSpendToday", label: "Overlapping tool spend, today", group: "Scale", type: "number", value: 18e4, unit: "$/yr", step: 5e3, confirmed: false, pair: "tool", side: "today", help: "What they pay each year for tools Portal would replace or consolidate." },
  { key: "toolSpendPortal", label: "Overlapping tool spend, with Portal", group: "Scale", type: "number", value: 9e4, unit: "$/yr", step: 5e3, confirmed: false, pair: "tool", side: "portal" },
  // ---- Speed
  {
    key: "searchHoursToday",
    label: "Time spent searching for docs, services and owners, today",
    group: "Speed",
    type: "number",
    value: 3,
    unit: "hrs / eng / week",
    step: 0.5,
    confirmed: false,
    pair: "search",
    side: "today",
    help: "Hours each engineer loses per week hunting. Industry estimates put tech debt at 2 to 5 days per engineer per month."
  },
  {
    key: "searchHoursPortal",
    label: "Time spent searching, with Portal",
    group: "Speed",
    type: "number",
    value: 2,
    unit: "hrs / eng / week",
    step: 0.5,
    confirmed: false,
    pair: "search",
    side: "portal",
    help: "The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them."
  },
  { key: "rampDaysToday", label: "Days for a new hire to first contribution, today", group: "Speed", type: "number", value: 14, unit: "days", confirmed: false, pair: "ramp", side: "today" },
  { key: "rampDaysPortal", label: "Days to first contribution, with Portal", group: "Speed", type: "number", value: 10, unit: "days", confirmed: false, pair: "ramp", side: "portal" },
  { key: "newHiresPerYear", label: "Engineers hired per year", group: "Speed", type: "number", value: 80, confirmed: false, help: "From the hiring plan if you can get it." },
  // ---- Chaos-control
  {
    key: "incidentHoursToday",
    label: "Hours each person spends on an incident, today",
    group: "Chaos-control",
    type: "number",
    value: 4,
    unit: "hrs",
    step: 0.1,
    confirmed: false,
    pair: "incident",
    side: "today",
    help: "Most of it is finding who owns the failing service."
  },
  { key: "incidentHoursPortal", label: "Hours each person spends on an incident, with Portal", group: "Chaos-control", type: "number", value: 3.2, unit: "hrs", step: 0.1, confirmed: false, pair: "incident", side: "portal" },
  { key: "peoplePerIncident", label: "People pulled into each incident", group: "Chaos-control", type: "number", value: 5, confirmed: false },
  { key: "incidentsPerMonth", label: "Incidents per month", group: "Chaos-control", type: "number", value: 12, confirmed: false },
  // ---- Cost and alternative
  { key: "portalCost", label: "Portal annual subscription", group: "Cost and alternative", type: "number", value: 4e5, unit: "$/yr", step: 1e4, confirmed: false, help: "A placeholder until there is a quote." },
  {
    key: "selfHostEngineers",
    label: "Engineers needed to self-host Backstage",
    group: "Cost and alternative",
    type: "number",
    value: 3,
    step: 0.5,
    confirmed: false,
    help: "The comparison that decides most deals. Spotify's own deck puts standing up Backstage at 2 to 5 developers. It should also roughly match the upkeep hours Portal saves."
  },
  { key: "selfHostSalary", label: "Fully loaded cost per self-host engineer", group: "Cost and alternative", type: "number", value: 21e4, unit: "$/yr", step: 5e3, confirmed: false },
  // ---- Calendar (structural: not claims about the customer)
  { key: "weeksPerYear", label: "Working weeks per year", group: "Calendar", type: "number", value: WORKING_WEEKS, confirmed: true, structural: true, help: "Chris's worked example uses about 48." },
  { key: "hoursPerDay", label: "Working hours per day", group: "Calendar", type: "number", value: 8, confirmed: true, structural: true },
  { key: "hoursPerYear", label: "Working hours per year", group: "Calendar", type: "number", value: HOURS_PER_YEAR, confirmed: true, structural: true }
];
var PAIRS = [
  { key: "search", group: "Speed", label: "Time spent searching", unit: "hrs / eng / week", today: "searchHoursToday", portal: "searchHoursPortal", saved: "saved per engineer per week", valueFigure: "productivityValue", driver: "productivity" },
  { key: "ramp", group: "Speed", label: "Days to first contribution", unit: "days", today: "rampDaysToday", portal: "rampDaysPortal", saved: "saved per new hire", valueFigure: "onboardingValue", driver: "onboarding" },
  { key: "incident", group: "Chaos-control", label: "Hours per person per incident", unit: "hrs", today: "incidentHoursToday", portal: "incidentHoursPortal", saved: "saved per person per incident", valueFigure: "incidentValue", driver: "incidents" },
  { key: "maint", group: "Scale", label: "Platform team time on upkeep", unit: "%", today: "maintPctToday", portal: "maintPctPortal", saved: "of the platform team freed up", valueFigure: "platformValue", driver: "platform" },
  { key: "tool", group: "Scale", label: "Overlapping tool spend", unit: "$/yr", today: "toolSpendToday", portal: "toolSpendPortal", saved: "a year saved", valueFigure: "toolingValue", driver: "tooling", money: true }
];
var isClaim = (f) => (f.type === "number" || f.type === "percent") && !f.structural;
function confidence(fields) {
  const material = fields.filter(isClaim);
  if (!material.length) return 0;
  return Math.round(material.filter((f) => f.confirmed).length / material.length * 100);
}
function unconfirmed(fields) {
  return fields.filter((f) => !f.confirmed && isClaim(f));
}
var hoursBack = (model) => model.figures.hoursSavedPerEngPerWeek.value * model.inputs.engineers * model.inputs.weeksPerYear;
var costsAvoided = (model) => model.figures.platformValue.value + model.figures.toolingValue.value;
var STAKEHOLDERS = [
  {
    key: "champion",
    role: "Director / VP Engineering",
    tag: "Usually the champion",
    cares: "Their team shipping instead of searching",
    lead: ["productivity", "onboarding"],
    headline: (m) => `${fmtHours(hoursBack(m))} of engineering time back per year`,
    objection: "My team already knows where things are.",
    counter: "Ask how a new hire finds the owner of a service during an incident. The cost lands on the people who joined most recently.",
    needsToSee: [
      "Time recovered per engineer, not just in aggregate",
      "Onboarding time for the hires they are about to make",
      "That it does not become another system their team has to maintain"
    ]
  },
  {
    key: "cto",
    role: "CTO",
    tag: "Often has the opposite goal",
    cares: "Cutting spend while the org keeps growing",
    lead: ["platform", "tooling"],
    headline: (m) => `${fmtMoney(costsAvoided(m))} of run cost avoided per year`,
    objection: "Backstage is open source. Why are we paying for it?",
    counter: "The licence is free, the operation is not. Self-hosting means a standing platform team for upgrades, patches and infrastructure, permanently.",
    needsToSee: [
      "Total cost of ownership against self-hosting, not against doing nothing",
      "What gets retired, not just what gets added",
      "That this is one line item replacing several"
    ]
  },
  {
    key: "finance",
    role: "Finance / Procurement",
    tag: "Shows up late and can stall a done deal",
    cares: "Payback, contract terms, and whether the numbers survive scrutiny",
    lead: ["productivity", "tooling"],
    headline: (m) => {
      const months = m.figures.paybackMonths.value;
      return months > 0 ? `Payback in ${fmtMonths(months)}` : "No payback on these figures";
    },
    objection: "These savings are soft. Nobody gets laid off because of this.",
    counter: "Present recovered capacity against hiring plans rather than as cash. The claim is avoided headcount, not reduced headcount.",
    needsToSee: [
      "Payback period and five-year value",
      "Which inputs are confirmed and which are still assumptions",
      "A conservative case, not the best case"
    ]
  },
  {
    key: "security",
    role: "Security / Compliance",
    tag: "The late arrival that kills timelines",
    cares: "Proving which services meet which standards, on a date",
    lead: ["incidents", "platform"],
    headline: () => "Ownership and standards provable on demand",
    objection: "This is another system holding our service metadata.",
    counter: "Bring them in during discovery rather than at contract. Chris lost weeks on a deal where procurement rules surfaced only after everyone had agreed.",
    needsToSee: [
      "Where the data lives and who can see it",
      "How standards are enforced and evidenced for an audit",
      "The review timeline, raised early enough to matter"
    ]
  }
];
var ARCHETYPES = {
  "Fast / AI-native": {
    stakeholders: ["champion", "cto"],
    pillars: ["speed", "chaos", "scale"],
    note: "Short cycle, few approvers. Lead with speed, not governance.",
    alternative: "Build something lightweight in-house"
  },
  "Scaling tech": {
    stakeholders: ["champion", "cto", "finance"],
    pillars: ["scale", "speed", "chaos"],
    note: "Informal systems are breaking as headcount grows.",
    alternative: "Self-host open source Backstage"
  },
  Enterprise: {
    stakeholders: ["champion", "cto", "finance", "security"],
    pillars: ["scale", "speed", "chaos"],
    note: "Several approvers. Map the path early; procurement surfaces late.",
    alternative: "Self-host open source Backstage with a funded platform team"
  },
  "Regulated enterprise": {
    stakeholders: ["champion", "cto", "finance", "security"],
    pillars: ["chaos", "scale", "speed"],
    note: "Long cycle, many layers. Compliance evidence is the lever.",
    alternative: "Self-host, or defer to the next budget year"
  }
};
var archetypePillars = (name) => (ARCHETYPES[name] || ARCHETYPES.Enterprise).pillars;
function allDrivers(model) {
  return DRIVERS.map((d) => {
    const f = model.figures[d.figure];
    return { ...d, value: f.value, detail: f.equation, flag: f.flag };
  });
}
function driversByPillar(model, archetype) {
  const drivers = allDrivers(model);
  return archetypePillars(archetype).map((key, i) => {
    const pillar = PILLARS.find((p) => p.key === key);
    const items = drivers.filter((d) => d.pillar === key);
    return { ...pillar, leads: i === 0, items, total: items.reduce((s, d) => s + d.value, 0) };
  });
}
var OLD_INPUT_KEYS = /* @__PURE__ */ new Set([
  "hoursLostPerWeek",
  "captureRate",
  "platformEngineers",
  "pctTimeMaintaining",
  "daysSavedOnboarding",
  "hoursPerIncident",
  "incidentReduction",
  "currentToolSpend",
  "toolConsolidation"
]);
var round1 = (n) => Math.round(n * 10) / 10;
function migrateOldInputs(saved) {
  const out = {};
  const has2 = (k) => saved[k] && saved[k].value != null;
  const val = (k) => Number(saved[k].value);
  const ok = (k) => !!saved[k].confirmed;
  if (has2("hoursLostPerWeek") && !("searchHoursToday" in saved)) {
    const today = val("hoursLostPerWeek");
    const capture = has2("captureRate") ? val("captureRate") : 33;
    out.searchHoursToday = { value: today, confirmed: ok("hoursLostPerWeek") };
    out.searchHoursPortal = { value: round1(today * (1 - capture / 100)), confirmed: ok("hoursLostPerWeek") && has2("captureRate") && ok("captureRate") };
  }
  if (has2("daysSavedOnboarding") && !("rampDaysToday" in saved)) {
    const saving = val("daysSavedOnboarding");
    const today = Math.max(14, saving);
    out.rampDaysToday = { value: today, confirmed: false };
    out.rampDaysPortal = { value: today - saving, confirmed: false };
  }
  if (has2("hoursPerIncident") && !("incidentHoursToday" in saved)) {
    const today = val("hoursPerIncident");
    const cut = has2("incidentReduction") ? val("incidentReduction") : 20;
    out.incidentHoursToday = { value: today, confirmed: ok("hoursPerIncident") };
    out.incidentHoursPortal = { value: round1(today * (1 - cut / 100)), confirmed: ok("hoursPerIncident") && has2("incidentReduction") && ok("incidentReduction") };
  }
  if (has2("currentToolSpend") && !("toolSpendToday" in saved)) {
    const today = val("currentToolSpend");
    const cut = has2("toolConsolidation") ? val("toolConsolidation") : 50;
    out.toolSpendToday = { value: today, confirmed: ok("currentToolSpend") };
    out.toolSpendPortal = { value: Math.round(today * (1 - cut / 100)), confirmed: ok("currentToolSpend") && has2("toolConsolidation") && ok("toolConsolidation") };
  }
  if (has2("pctTimeMaintaining") && !("maintPctToday" in saved)) {
    out.maintPctToday = { value: val("pctTimeMaintaining"), confirmed: false };
    out.maintPctPortal = { value: 0, confirmed: false };
    if (has2("platformEngineers") && has2("engineers") && val("engineers") > 0 && !("platformShare" in saved)) {
      out.platformShare = { value: Math.min(100, round1(val("platformEngineers") / val("engineers") * 100)), confirmed: false };
    }
  }
  return out;
}

// src/model.js
var FIGURE_ORDER = [
  "platformEngineers",
  // speed
  "hoursSavedPerEngPerWeek",
  "productivityValue",
  "rampDaysSaved",
  "onboardingValue",
  // chaos-control
  "incidentHoursSaved",
  "incidentValue",
  // scale
  "maintHoursSaved",
  "platformValue",
  "toolingValue",
  // roll-ups
  "totalValue",
  "netValue",
  "paybackMonths",
  "roiMultiple",
  "fiveYearValue",
  // alternative
  "selfHostCost",
  "versusSelfHost"
];
var NUMERIC_INPUTS = [
  "engineers",
  "platformShare",
  "hourlyCost",
  "searchHoursToday",
  "searchHoursPortal",
  "rampDaysToday",
  "rampDaysPortal",
  "newHiresPerYear",
  "incidentHoursToday",
  "incidentHoursPortal",
  "peoplePerIncident",
  "incidentsPerMonth",
  "maintPctToday",
  "maintPctPortal",
  "toolSpendToday",
  "toolSpendPortal",
  "portalCost",
  "selfHostEngineers",
  "selfHostSalary",
  "weeksPerYear",
  "hoursPerDay",
  "hoursPerYear"
];
var PERCENT_INPUTS = /* @__PURE__ */ new Set(["platformShare", "maintPctToday", "maintPctPortal"]);
var SELF_HOST_RANGE = [2, 5];
var CONSISTENCY_TOLERANCE = 0.5;
var money = (n) => fmtMoneyFull(n);
var num = (n) => fmtDec(n, 2);
function computeModel(rawInputs = {}) {
  const invalidInputs = [];
  const I = {};
  for (const key of NUMERIC_INPUTS) {
    const given = rawInputs ? rawInputs[key] : void 0;
    let v = given === "" || given == null ? NaN : Number(given);
    let bad = null;
    if (!Number.isFinite(v)) {
      bad = "not a number";
      v = 0;
    } else if (v < 0) {
      bad = "negative";
      v = 0;
    } else if (PERCENT_INPUTS.has(key) && v > 100) {
      bad = "over 100%";
      v = 100;
    }
    if (bad && !(given === void 0)) invalidInputs.push({ key, problem: bad });
    I[key] = v;
  }
  const F = {};
  const figure = (key, raw, equation, divideByZero = false) => {
    let flag = null;
    let value = raw;
    if (divideByZero) {
      value = 0;
      flag = "divide-by-zero";
    } else if (!Number.isFinite(value)) {
      value = 0;
      flag = "not-finite";
    } else if (value < 0) {
      value = 0;
      flag = "clamped";
    }
    F[key] = { value, raw: Number.isFinite(raw) && !divideByZero ? raw : 0, equation, flag };
    return F[key];
  };
  const diff = (f, a, b, fmt = num) => f.flag === "clamped" ? "0" : `(${fmt(a)} - ${fmt(b)})`;
  figure("platformEngineers", I.engineers * (I.platformShare / 100), `${num(I.engineers)} * ${num(I.platformShare)}%`);
  const hs = figure("hoursSavedPerEngPerWeek", I.searchHoursToday - I.searchHoursPortal, `${num(I.searchHoursToday)} - ${num(I.searchHoursPortal)}`);
  figure(
    "productivityValue",
    hs.value * I.engineers * I.weeksPerYear * I.hourlyCost,
    `${diff(hs, I.searchHoursToday, I.searchHoursPortal)} * ${num(I.engineers)} * ${num(I.weeksPerYear)} * ${money(I.hourlyCost)}`
  );
  const rd = figure("rampDaysSaved", I.rampDaysToday - I.rampDaysPortal, `${num(I.rampDaysToday)} - ${num(I.rampDaysPortal)}`);
  figure(
    "onboardingValue",
    rd.value * I.newHiresPerYear * I.hoursPerDay * I.hourlyCost,
    `${diff(rd, I.rampDaysToday, I.rampDaysPortal)} * ${num(I.newHiresPerYear)} * ${num(I.hoursPerDay)} * ${money(I.hourlyCost)}`
  );
  const ihDiff = I.incidentHoursToday - I.incidentHoursPortal;
  const ih = figure(
    "incidentHoursSaved",
    Math.max(0, ihDiff) * I.peoplePerIncident * I.incidentsPerMonth * 12,
    `${ihDiff < 0 ? "0" : `(${num(I.incidentHoursToday)} - ${num(I.incidentHoursPortal)})`} * ${num(I.peoplePerIncident)} * ${num(I.incidentsPerMonth)} * 12`
  );
  if (ihDiff < 0) F.incidentHoursSaved.flag = "clamped";
  figure("incidentValue", ih.value * I.hourlyCost, `${num(ih.value)} * ${money(I.hourlyCost)}`);
  const pe = F.platformEngineers.value;
  const mDiff = I.maintPctToday - I.maintPctPortal;
  const mh = figure(
    "maintHoursSaved",
    pe * (Math.max(0, mDiff) / 100) * I.hoursPerYear,
    `${num(pe)} * ${mDiff < 0 ? "0" : `(${num(I.maintPctToday)} - ${num(I.maintPctPortal)})`} / 100 * ${num(I.hoursPerYear)}`
  );
  if (mDiff < 0) F.maintHoursSaved.flag = "clamped";
  figure("platformValue", mh.value * I.hourlyCost, `${num(mh.value)} * ${money(I.hourlyCost)}`);
  figure("toolingValue", I.toolSpendToday - I.toolSpendPortal, `${money(I.toolSpendToday)} - ${money(I.toolSpendPortal)}`);
  const drivers = ["productivityValue", "onboardingValue", "incidentValue", "platformValue", "toolingValue"];
  const total = figure("totalValue", drivers.reduce((s, k) => s + F[k].value, 0), drivers.map((k) => money(F[k].value)).join(" + "));
  const net = figure("netValue", total.value - I.portalCost, `${money(total.value)} - ${money(I.portalCost)}`);
  const monthly = total.value / 12;
  figure(
    "paybackMonths",
    monthly === 0 ? 0 : I.portalCost / monthly,
    `${money(I.portalCost)} / (${money(total.value)} / 12)`,
    monthly === 0
  );
  figure("roiMultiple", I.portalCost === 0 ? 0 : total.value / I.portalCost, `${money(total.value)} / ${money(I.portalCost)}`, I.portalCost === 0);
  figure("fiveYearValue", net.raw * 5, `${money(net.raw)} * 5`);
  const sh = figure("selfHostCost", I.selfHostEngineers * I.selfHostSalary, `${num(I.selfHostEngineers)} * ${money(I.selfHostSalary)}`);
  figure("versusSelfHost", sh.value - I.portalCost, `${money(sh.value)} - ${money(I.portalCost)}`);
  return { inputs: I, figures: F, order: FIGURE_ORDER, warnings: consistencyWarnings(I, F), invalidInputs };
}
function consistencyWarnings(I, F) {
  const warnings = [];
  const removed = I.hoursPerYear > 0 ? F.maintHoursSaved.value / I.hoursPerYear : 0;
  const needed = I.selfHostEngineers;
  const apart = needed === 0 ? removed > 0 : Math.abs(removed - needed) / needed > CONSISTENCY_TOLERANCE;
  if (apart) {
    warnings.push({
      key: "consistency",
      severity: "warning",
      inputs: ["maintPctToday", "maintPctPortal", "platformShare", "selfHostEngineers"],
      message: `The case is not internally consistent. The upkeep Portal removes equals about ${num(removed)} engineers, but self-hosting is set to need ${num(needed)}. These describe the same thing, so they should be within ${Math.round(CONSISTENCY_TOLERANCE * 100)}% of each other.`
    });
  }
  if (needed < SELF_HOST_RANGE[0] || needed > SELF_HOST_RANGE[1]) {
    warnings.push({
      key: "selfHostRange",
      severity: "warning",
      inputs: ["selfHostEngineers"],
      message: `Spotify's own deck puts standing up Backstage at ${SELF_HOST_RANGE[0]} to ${SELF_HOST_RANGE[1]} developers. ${num(needed)} is outside that range, so expect the customer to question it.`
    });
  }
  return warnings;
}

// src/uid.js
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// src/deck/model.js
var TEXT_STYLES = [
  ["hero", "Hero title"],
  ["headline", "Headline"],
  ["title", "Title"],
  ["sub", "Subtitle"],
  ["lede", "Lede"],
  ["body", "Body"],
  ["note", "Note"],
  ["label", "Label"],
  ["eyebrow", "Eyebrow"],
  ["tag", "Tag"],
  ["forwhom", "Small caps"],
  ["caption", "Caption"]
];
var STAT_KEYS = [
  ["annual", "Annual value"],
  ["cost", "Portal cost"],
  ["net", "Net, year one"],
  ["payback", "Payback"],
  ["roi", "Return"],
  ["five", "Five-year net"]
];
var block = (type, props = {}) => ({ id: uid(), type, ...props });
var text = (style, t) => block("text", { style, text: t });
var slide = (variant, blocks) => ({ id: uid(), variant, blocks });
function fill(str, ctx) {
  return String(str ?? "").replace(/\{(\w+)\}/g, (m, k) => k in ctx ? ctx[k] : m);
}
function buildEnv(inputs, fields, active, model = computeModel(inputs)) {
  const F = model.figures;
  const ctx = {
    company: inputs.companyName || "Untitled",
    role: active.role,
    archetype: inputs.archetype,
    headline: active.headline(model),
    cares: active.cares,
    tag: active.tag,
    annual: fmtMoney(F.totalValue.value),
    cost: fmtMoney(model.inputs.portalCost),
    net: fmtMoney(F.netValue.raw),
    payback: F.paybackMonths.value > 0 ? fmtMonths(F.paybackMonths.value) : "n/a",
    roi: `${F.roiMultiple.value.toFixed(1)}x`,
    five: fmtMoney(F.fiveYearValue.raw)
  };
  return { inputs, fields, active, ctx, model };
}
function builtin(type, ed = {}) {
  switch (type) {
    case "title":
      return slide("hero", [
        block("logo"),
        text("eyebrow", "Technology / Business case"),
        text("hero", ed.title ?? "{company}"),
        text("lede", ed.lede ?? "Spotify Portal for Backstage, costed against {company}'s own numbers."),
        text("forwhom", ed.forwhom ?? "Prepared for {role} \xB7 {archetype}")
      ]);
    case "headline":
      return slide("plain", [
        text("label", "The number"),
        text("headline", ed.headline ?? "{headline}"),
        text("sub", ed.sub ?? "{cares}"),
        block("stats", { items: STAT_KEYS.map(([k]) => k) })
      ]);
    case "drivers":
      return slide("plain", [
        text("label", "Where the value comes from"),
        text("title", ed.title ?? "Speed, chaos-control, scale"),
        text("note", ed.note ?? "Grouped under the three pillars. Under each bar is the arithmetic with this customer's numbers. The two {role} cares about most are marked."),
        block("drivers")
      ]);
    case "pairs":
      return slide("plain", [
        text("label", "Today and with Portal"),
        text("title", ed.title ?? "What changes, input by input"),
        text("note", ed.note ?? "Each pair is a number the customer can check against their own. The difference is what the case is built on."),
        block("pairs")
      ]);
    case "versus":
      return slide("plain", [
        text("label", "Against the alternative"),
        text("title", ed.title ?? "Backstage is free. Running it is not."),
        text(
          "note",
          ed.note ?? "The comparison that decides most deals is Portal against self-hosting the open-source project, not Portal against doing nothing."
        ),
        block("versus")
      ]);
    case "stakeholder":
      return slide("plain", [
        text("label", "This room"),
        text("title", "{role}"),
        text("tag", "{tag}"),
        block("room")
      ]);
    case "assumptions":
      return slide("plain", [
        text("label", "Honesty slide"),
        text("title", ed.title ?? "What is confirmed and what is not"),
        text("note", ed.note ?? "Finance will ask. Showing it first is stronger than being caught by it."),
        block("assumptions"),
        text(
          "note",
          ed.note2 ?? "Each one is a question for the next call. Confirming them is what turns this from a pitch into a case."
        )
      ]);
    default:
      return null;
  }
}
var BUILTIN_TYPES = ["title", "headline", "drivers", "pairs", "versus", "stakeholder", "assumptions"];
function defaultDeck() {
  return BUILTIN_TYPES.map((t) => builtin(t));
}
function migrateDeck(deck) {
  return deck.map((s) => {
    if (Array.isArray(s.blocks)) return s;
    if (s.type === "custom") {
      return {
        id: s.id,
        variant: "plain",
        blocks: [text("label", s.label || "Notes"), text("title", s.title || ""), text("body", s.body || "")]
      };
    }
    const made = builtin(s.type, s.ed || {});
    return made && { ...made, id: s.id || made.id };
  }).filter(Boolean);
}
function parseBody(str) {
  return String(str || "").split(/\n\s*\n/).map((b) => b.split("\n").filter((l) => l.trim())).filter((b) => b.length).map(
    (lines) => lines.every((l) => /^\s*[-•]\s+/.test(l)) ? { type: "ul", items: lines.map((l) => l.replace(/^\s*[-•]\s+/, "")) } : { type: "p", text: lines.join(" ") }
  );
}
function statValue(key, env) {
  const F = env.model.figures;
  switch (key) {
    case "annual":
      return { label: "Annual value", value: fmtMoney(F.totalValue.value), eq: F.totalValue.equation };
    case "cost":
      return { label: "Portal cost", value: fmtMoney(env.model.inputs.portalCost), eq: "" };
    case "net":
      return { label: "Net, year one", value: fmtMoney(F.netValue.raw), tone: F.netValue.raw > 0 ? "good" : "bad", eq: F.netValue.equation };
    case "payback":
      return { label: "Payback", value: F.paybackMonths.value > 0 ? fmtMonths(F.paybackMonths.value) : "n/a", eq: F.paybackMonths.equation };
    case "roi":
      return { label: "Return", value: `${F.roiMultiple.value.toFixed(1)}x`, eq: F.roiMultiple.equation };
    case "five":
      return { label: "Five-year net", value: fmtMoney(F.fiveYearValue.raw), eq: F.fiveYearValue.equation };
    default:
      return null;
  }
}
function resolveBlock(b, env) {
  const { ctx, inputs, active, model } = env;
  switch (b.type) {
    case "text": {
      const t = fill(b.text, ctx);
      return { kind: "text", style: b.style, text: t, paras: b.style === "body" ? parseBody(t) : null };
    }
    case "quote":
      return { kind: "quote", text: fill(b.text, ctx) };
    case "columns":
      return { kind: "columns", left: parseBody(fill(b.left, ctx)), right: parseBody(fill(b.right, ctx)) };
    case "image":
      return { kind: "image", src: b.src || "", caption: fill(b.caption || "", ctx) };
    case "stats":
      return {
        kind: "stats",
        items: (b.items || STAT_KEYS.map(([k]) => k)).map((k) => ({ key: k, ...statValue(k, env) })).filter((i) => i.label)
      };
    case "drivers": {
      const groups = driversByPillar(model, inputs.archetype);
      const max = Math.max(...groups.flatMap((g) => g.items.map((d) => d.value)), 1);
      return {
        kind: "drivers",
        groups: groups.map((g) => ({
          key: g.key,
          label: g.label,
          blurb: g.blurb,
          leads: g.leads,
          total: fmtMoney(g.total),
          rows: g.items.map((d) => ({
            key: d.key,
            label: d.label,
            value: d.value,
            valueStr: fmtMoney(d.value),
            detail: d.detail,
            flag: d.flag,
            color: d.color,
            lead: active.lead.includes(d.key),
            pct: d.value / max * 100
          }))
        })),
        total: fmtMoneyFull(model.figures.totalValue.value),
        totalEq: model.figures.totalValue.equation
      };
    }
    case "pairs": {
      const I = model.inputs;
      return {
        kind: "pairs",
        rows: PAIRS.map((p) => {
          const today = I[p.today];
          const portal = I[p.portal];
          const show = (n) => p.money ? fmtMoney(n) : `${fmtDec(n, 2)}${p.unit === "%" ? "%" : ""}`;
          const f = model.figures[p.valueFigure];
          return {
            key: p.key,
            group: p.group,
            label: p.label,
            unit: p.money || p.unit === "%" ? "" : p.unit,
            today: show(today),
            portal: show(portal),
            diff: show(Math.max(0, today - portal)),
            saved: p.saved,
            value: fmtMoney(f.value),
            eq: f.equation
          };
        })
      };
    }
    case "versus": {
      const F = model.figures;
      const selfHost = F.selfHostCost.value;
      const portalCost = model.inputs.portalCost;
      const max = Math.max(selfHost, portalCost, 1);
      const delta = F.versusSelfHost.raw;
      return {
        kind: "versus",
        rows: [
          { name: "Self-host open source", value: selfHost, valueStr: `${fmtMoney(selfHost)}/yr`, tone: "bad", pct: selfHost / max * 100, eq: F.selfHostCost.equation },
          { name: "Spotify Portal", value: portalCost, valueStr: `${fmtMoney(portalCost)}/yr`, tone: "good", pct: portalCost / max * 100, eq: "" }
        ],
        lead: `${fmtDec(model.inputs.selfHostEngineers, 1)} platform engineers at ${fmtMoney(model.inputs.selfHostSalary)} fully loaded, permanently, for upgrades, patches and infrastructure.`,
        verdict: delta > 0 ? `Portal is ${fmtMoney(delta)}/yr cheaper before any of the value above.` : "On these figures self-hosting is cheaper. The case has to rest on the value drivers, not on cost avoidance.",
        eq: F.versusSelfHost.equation
      };
    }
    case "assumptions": {
      const open = unconfirmed(env.fields);
      return {
        kind: "assumptions",
        count: open.length,
        items: open.map((f) => ({
          label: f.label,
          assumed: `assumed at ${f.type === "percent" ? `${f.value}%` : fmtDec(f.value, 2)}${f.unit && f.unit !== "%" ? ` ${f.unit}` : ""}`
        }))
      };
    }
    case "room":
      return {
        kind: "room",
        needs: (active.needsToSee || []).filter(Boolean),
        objection: active.objection,
        counter: active.counter
      };
    default:
      return { kind: b.type };
  }
}
function resolveSlides(deck, env) {
  return deck.map((s) => ({ id: s.id, variant: s.variant || "plain", blocks: s.blocks.map((b) => ({ id: b.id, ...resolveBlock(b, env) })) }));
}

// src/projects.js
function defaultFields() {
  return INPUT_FIELDS.map((f) => ({ ...f }));
}
function defaultStakeholders() {
  return STAKEHOLDERS.map((s) => ({ key: s.key, builtin: true }));
}
function newProject(name) {
  const fields = defaultFields();
  const company = fields.find((f) => f.key === "companyName");
  if (company) company.value = name;
  return {
    id: uid(),
    name,
    updatedAt: Date.now(),
    fields,
    stakeholders: defaultStakeholders(),
    deck: defaultDeck(),
    people: {}
  };
}

// src/caseFile.js
var CASE_VERSION = 1;
var BUILTIN_KEYS = STAKEHOLDERS.map((s) => s.key);
var FIELD_BY_KEY = Object.fromEntries(INPUT_FIELDS.map((f) => [f.key, f]));
var BLOCK_TYPES = [
  "text",
  "quote",
  "columns",
  "image",
  "stats",
  "drivers",
  "pairs",
  "versus",
  "assumptions",
  "room",
  "logo",
  "divider",
  "spacer"
];
var LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s?#]+/i;
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function projectToCaseFile(project) {
  const inputs = {};
  for (const f of project.fields) {
    inputs[f.key] = f.custom ? { label: f.label, type: f.type, unit: f.unit || "", value: f.value, confirmed: !!f.confirmed } : { value: f.value, confirmed: !!f.confirmed };
  }
  return {
    caseBuilder: CASE_VERSION,
    company: project.name,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    inputs,
    stakeholders: project.stakeholders.map((s) => s.builtin && !s.edit && !s.pos ? s.key : s),
    people: project.people || {},
    deck: project.deck
  };
}
function checkCaseFile(file) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  if (!file || typeof file !== "object" || Array.isArray(file)) return { errors: ["The file is not a JSON object."], warnings };
  if (file.caseBuilder !== CASE_VERSION) err(`"caseBuilder" must be ${CASE_VERSION} (this is how the file is recognised).`);
  if (typeof file.company !== "string" || !file.company.trim()) err('"company" must be the customer name.');
  const inputs = file.inputs ?? {};
  if (typeof inputs !== "object" || Array.isArray(inputs)) err('"inputs" must be an object of { key: { value, confirmed } }.');
  else {
    for (const [key, v] of Object.entries(inputs)) {
      if (!v || typeof v !== "object" || !("value" in v)) {
        err(`inputs.${key} must look like { "value": ..., "confirmed": true|false }.`);
        continue;
      }
      const base = FIELD_BY_KEY[key];
      const old = OLD_INPUT_KEYS.has(key);
      const type = base ? base.type : old ? "number" : v.type;
      if (!base && !old && !["number", "percent", "text"].includes(v.type)) warn(`inputs.${key} is not a known input; give it "label" and "type" (number, percent or text) to keep it as a custom input.`);
      if (type === "number" || type === "percent") {
        if (typeof v.value !== "number" || !Number.isFinite(v.value)) err(`inputs.${key}.value must be a number.`);
        else if (type === "percent" && (v.value < 0 || v.value > 100)) err(`inputs.${key}.value is a percent, so it must be between 0 and 100.`);
        else if (v.value < 0) err(`inputs.${key}.value cannot be negative.`);
      }
      if (type === "select" && base && !base.options.includes(v.value)) err(`inputs.${key}.value must be one of: ${base.options.join(", ")}.`);
      if ("confirmed" in v && typeof v.confirmed !== "boolean") err(`inputs.${key}.confirmed must be true or false.`);
    }
  }
  if (file.stakeholders != null) {
    if (!Array.isArray(file.stakeholders)) err('"stakeholders" must be a list.');
    else {
      file.stakeholders.forEach((s, i) => {
        if (typeof s === "string") {
          if (!BUILTIN_KEYS.includes(s)) err(`stakeholders[${i}] "${s}" is not a built-in stakeholder (${BUILTIN_KEYS.join(", ")}). For a new role, use an object with a "role".`);
        } else if (s && typeof s === "object") {
          const builtin2 = BUILTIN_KEYS.includes(s.key);
          if (!builtin2 && (typeof s.role !== "string" || !s.role.trim())) err(`stakeholders[${i}] needs a "role".`);
        } else err(`stakeholders[${i}] must be a key or an object.`);
      });
    }
  }
  const known = /* @__PURE__ */ new Set([
    ...Array.isArray(file.stakeholders) ? file.stakeholders.map((s) => typeof s === "string" ? s : s?.key).filter(Boolean) : BUILTIN_KEYS
  ]);
  if (file.people != null) {
    if (typeof file.people !== "object" || Array.isArray(file.people)) err('"people" must be an object keyed by stakeholder.');
    else {
      for (const [key, list] of Object.entries(file.people)) {
        if (!Array.isArray(list)) {
          err(`people.${key} must be a list.`);
          continue;
        }
        list.forEach((p, i) => {
          const at = `people.${key}[${i}]`;
          if (!p || typeof p.name !== "string" || !p.name.trim()) return err(`${at} needs a "name".`);
          if (p.linkedin && !LINKEDIN.test(p.linkedin)) err(`${at}.linkedin must be a linkedin.com/in/ profile URL.`);
          if (p.email && !EMAIL.test(p.email)) err(`${at}.email is not a valid address.`);
          const found = p.found !== false;
          if (found && (!Array.isArray(p.sources) || !p.sources.some((u) => /^https?:\/\//.test(u)))) warn(`${at} (${p.name}) has no source URL. Researched people should always cite where they were found.`);
        });
        if (!known.has(key)) warn(`people.${key} does not match any stakeholder in this case.`);
      }
    }
  }
  if (file.deck != null) {
    if (!Array.isArray(file.deck)) err('"deck" must be a list of slides.');
    else {
      const styles = TEXT_STYLES.map(([k]) => k);
      file.deck.forEach((s, i) => {
        if (!s || !Array.isArray(s.blocks)) {
          if (s && s.type) return;
          return err(`deck[${i}] needs a "blocks" list.`);
        }
        s.blocks.forEach((b, j) => {
          if (!b || !BLOCK_TYPES.includes(b.type)) err(`deck[${i}].blocks[${j}] has an unknown type "${b?.type}". Use one of: ${BLOCK_TYPES.join(", ")}.`);
          else if (b.type === "text" && !styles.includes(b.style)) err(`deck[${i}].blocks[${j}].style "${b.style}" is not a text style. Use one of: ${styles.join(", ")}.`);
        });
      });
    }
  }
  return { errors, warnings };
}
function caseFileToProject(file, { id } = {}) {
  const { errors } = checkCaseFile(file);
  if (errors.length) {
    const e = new Error(`This case file has problems:
- ${errors.join("\n- ")}`);
    e.problems = errors;
    throw e;
  }
  const fields = defaultFields();
  const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
  for (const [key, v] of Object.entries(file.inputs || {})) {
    const f = byKey[key];
    if (OLD_INPUT_KEYS.has(key)) continue;
    if (f) {
      f.value = v.value;
      if ("confirmed" in v) f.confirmed = v.confirmed;
    } else {
      fields.push({
        key,
        label: v.label || key,
        type: ["number", "percent", "text"].includes(v.type) ? v.type : "number",
        unit: v.unit || "",
        group: "Custom",
        custom: true,
        value: v.value,
        confirmed: !!v.confirmed
      });
    }
  }
  const legacy = migrateOldInputs(file.inputs || {});
  for (const [key, v] of Object.entries(legacy)) {
    if (byKey[key] && !(file.inputs && key in file.inputs)) {
      byKey[key].value = v.value;
      byKey[key].confirmed = v.confirmed;
    }
  }
  const company = byKey.companyName;
  if (company && !(file.inputs && "companyName" in file.inputs)) company.value = file.company;
  const stakeholders = file.stakeholders ?? null ? file.stakeholders.map((s) => {
    if (typeof s === "string") return { key: s, builtin: true };
    if (BUILTIN_KEYS.includes(s.key)) return { ...s, builtin: true };
    return { tag: "", cares: "", objection: "-", counter: "-", needsToSee: [], ...s, key: s.key || `custom_${uid()}` };
  }) : defaultStakeholders();
  const people = {};
  for (const [key, list] of Object.entries(file.people || {})) {
    people[key] = list.map((p) => ({
      id: p.id || uid(),
      name: p.name.trim(),
      title: p.title || "",
      email: p.email || "",
      linkedin: p.linkedin || "",
      bio: p.bio || "",
      sources: Array.isArray(p.sources) ? p.sources : [],
      confidence: ["high", "medium", "low"].includes(p.confidence) ? p.confidence : "low",
      found: p.found !== false
    }));
  }
  const deck = file.deck ? migrateDeck(withIds(file.deck)) : defaultDeck();
  return { id: id || uid(), name: file.company.trim(), updatedAt: Date.now(), fields, stakeholders, deck, people };
}
function withIds(deck) {
  return deck.map(
    (s) => Array.isArray(s.blocks) ? { variant: "plain", ...s, id: s.id || uid(), blocks: s.blocks.map((b) => ({ ...b, id: b.id || uid() })) } : s
  );
}

// src/deck/stakeholders.js
var NO_ONE = {
  key: "none",
  role: "No stakeholder selected",
  tag: "Add a stakeholder above",
  cares: "Add the people this case has to convince",
  lead: [],
  headline: (m) => `${fmtMoney(m.figures.totalValue.value)} of annual value`,
  objection: "-",
  counter: "-",
  needsToSee: []
};
function resolveStakeholder(s) {
  const base = s.builtin ? STAKEHOLDERS.find((b) => b.key === s.key) : {
    lead: ["productivity", "tooling"],
    headline: (m) => `${fmtMoney(m.figures.totalValue.value)} of annual value`,
    needsToSee: [],
    cares: "",
    tag: "",
    objection: "-",
    counter: "-",
    ...s
  };
  return base && { ...base, ...s.edit || {} };
}

// src/export/siteClient.js
function siteMain(DATA, VM) {
  const $ = (s) => document.querySelector(s);
  const esc2 = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  if (DATA.company) {
    document.title = DATA.company + " \xB7 Business case";
    const co = document.querySelector(".co");
    if (co) co.textContent = DATA.company;
  }
  const inputs = Object.assign({}, DATA.inputs);
  let activeKey = DATA.activeKey;
  let current = 0;
  const NONE = {
    key: "none",
    role: "Everyone",
    tag: "",
    cares: "",
    objection: "-",
    counter: "-",
    needsToSee: [],
    lead: [],
    builtin: false
  };
  const stakeholder = () => DATA.stakeholders.find((s) => s.key === activeKey) || DATA.stakeholders[0] || NONE;
  const M = () => VM.computeModel(inputs);
  function headlineFor(st) {
    if (st.builtin) {
      const base = VM.STAKEHOLDERS.find((b) => b.key === st.key);
      if (base) return base.headline(M());
    }
    return VM.fmtMoney(M().figures.totalValue.value) + " of annual value";
  }
  function numbers() {
    const F = M().figures;
    return {
      total: F.totalValue.value,
      net: F.netValue.raw,
      roi: F.roiMultiple.value,
      months: F.paybackMonths.value,
      five: F.fiveYearValue.raw,
      F
    };
  }
  const monthsText = (m) => m > 0 ? VM.fmtMonths(m) : "n/a";
  function context(st) {
    const n = numbers();
    return {
      company: DATA.company,
      role: st.role,
      archetype: inputs.archetype,
      headline: headlineFor(st),
      cares: st.cares,
      tag: st.tag,
      annual: VM.fmtMoney(n.total),
      cost: VM.fmtMoney(inputs.portalCost),
      net: VM.fmtMoney(n.net),
      payback: monthsText(n.months),
      roi: n.roi.toFixed(1) + "x",
      five: VM.fmtMoney(n.five)
    };
  }
  const fill2 = (str, ctx) => String(str == null ? "" : str).replace(/\{(\w+)\}/g, (m, k) => k in ctx ? ctx[k] : m);
  function paras(str) {
    return String(str || "").split(/\n\s*\n/).map((b) => b.split("\n").filter((l) => l.trim())).filter((b) => b.length).map(
      (lines) => lines.every((l) => /^\s*[-•]\s+/.test(l)) ? { type: "ul", items: lines.map((l) => l.replace(/^\s*[-•]\s+/, "")) } : { type: "p", text: lines.join(" ") }
    );
  }
  const bodyHtml = (list) => '<div class="body">' + list.map((p) => p.type === "ul" ? "<ul>" + p.items.map((i) => "<li>" + esc2(i) + "</li>").join("") + "</ul>" : "<p>" + esc2(p.text) + "</p>").join("") + "</div>";
  const TAGS = {
    hero: ["h1", "hero"],
    headline: ["h2", "headline"],
    title: ["h2", ""],
    sub: ["p", "sub"],
    lede: ["p", "lede"],
    note: ["p", "note"],
    label: ["div", "label"],
    eyebrow: ["p", "eyebrow"],
    tag: ["p", "tag"],
    forwhom: ["p", "forwhom"],
    caption: ["p", "caption"]
  };
  function statItem(key) {
    const n = numbers();
    if (key === "annual") return { label: "Annual value", value: VM.fmtMoney(n.total), eq: n.F.totalValue.equation };
    if (key === "cost") return { label: "Portal cost", value: VM.fmtMoney(inputs.portalCost), eq: "" };
    if (key === "net") return { label: "Net, year one", value: VM.fmtMoney(n.net), tone: n.net > 0 ? "good" : "bad", eq: n.F.netValue.equation };
    if (key === "payback") return { label: "Payback", value: monthsText(n.months), eq: n.F.paybackMonths.equation };
    if (key === "roi") return { label: "Return", value: n.roi.toFixed(1) + "x", eq: n.F.roiMultiple.equation };
    if (key === "five") return { label: "Five-year net", value: VM.fmtMoney(n.five), eq: n.F.fiveYearValue.equation };
    return null;
  }
  function blockHtml(b, st, ctx) {
    switch (b.type) {
      case "text": {
        if (b.style === "body") return bodyHtml(paras(fill2(b.text, ctx)));
        const t = TAGS[b.style] || ["p", ""];
        return "<" + t[0] + ' class="' + t[1] + '">' + esc2(fill2(b.text, ctx)) + "</" + t[0] + ">";
      }
      case "quote":
        return "<blockquote>" + esc2(fill2(b.text, ctx)) + "</blockquote>";
      case "columns":
        return '<div class="cols">' + bodyHtml(paras(fill2(b.left, ctx))) + bodyHtml(paras(fill2(b.right, ctx))) + "</div>";
      case "image":
        return b.src ? '<figure><img src="' + esc2(b.src) + '" alt="">' + (b.caption ? "<figcaption>" + esc2(fill2(b.caption, ctx)) + "</figcaption>" : "") + "</figure>" : "";
      case "logo":
        return '<div class="logo">' + DATA.logo + "</div>";
      case "divider":
        return "<hr>";
      case "spacer":
        return '<div class="spacer"></div>';
      case "stats": {
        const keys = b.items || ["annual", "cost", "net", "payback", "roi", "five"];
        return '<div class="stats">' + keys.map(statItem).filter(Boolean).map((i) => '<div class="stat ' + (i.tone || "") + '"><span>' + esc2(i.label) + "</span><strong>" + esc2(i.value) + "</strong>" + (i.eq ? '<em class="eq">' + esc2(i.eq) + "</em>" : "") + "</div>").join("") + "</div>";
      }
      case "drivers": {
        const m = M();
        const groups = VM.driversByPillar(m, inputs.archetype);
        const max = Math.max.apply(null, [1].concat(groups.reduce((acc, g) => acc.concat(g.items.map((d) => d.value)), [])));
        return '<div class="chart">' + groups.map(
          (g) => '<section class="pillar' + (g.leads ? " pl" : "") + '"><h3>' + esc2(g.label) + "<span>" + esc2(VM.fmtMoney(g.total)) + "</span></h3>" + g.items.map((d) => {
            const lead = st.lead.indexOf(d.key) >= 0;
            return '<div class="bar-row' + (lead ? " lead" : "") + '"><div class="bar-label">' + esc2(d.label) + (lead ? "<i></i>" : "") + '</div><div class="track"><div class="fill" style="width:' + (d.value / max * 100).toFixed(1) + "%;background:" + d.color + ";opacity:" + (lead ? 1 : 0.45) + '"></div></div><div class="bar-value">' + esc2(VM.fmtMoney(d.value)) + '</div><div class="bar-detail eq">' + esc2(d.detail) + "</div></div>";
          }).join("") + "</section>"
        ).join("") + '</div><div class="total"><span>Total annual value</span><strong>' + esc2(VM.fmtMoneyFull(m.figures.totalValue.value)) + '</strong></div><p class="eq">' + esc2(m.figures.totalValue.equation) + "</p>";
      }
      case "pairs": {
        const m = M();
        const show = (p, n) => p.money ? VM.fmtMoney(n) : VM.fmtDec(n, 2) + (p.unit === "%" ? "%" : "");
        return '<div class="pairs"><div class="pr ph"><span></span><span>today</span><span>with Portal</span><span>difference</span></div>' + VM.PAIRS.map((p) => {
          const t = m.inputs[p.today];
          const q = m.inputs[p.portal];
          return '<div class="pr"><span class="pl2">' + esc2(p.label) + (p.money || p.unit === "%" ? "" : " <i>(" + esc2(p.unit) + ")</i>") + "</span><b>" + esc2(show(p, t)) + "</b><b>" + esc2(show(p, q)) + '</b><b class="pd">' + esc2(show(p, Math.max(0, t - q))) + '</b><em class="eq">' + esc2(p.saved) + ": worth " + esc2(VM.fmtMoney(m.figures[p.valueFigure].value)) + "</em></div>";
        }).join("") + "</div>";
      }
      case "versus": {
        const F = M().figures;
        const selfHost = F.selfHostCost.value;
        const portal = inputs.portalCost >= 0 ? Number(inputs.portalCost) || 0 : 0;
        const max = Math.max(selfHost, portal, 1);
        const delta = F.versusSelfHost.raw;
        const row = (name, val, tone, eq) => '<div class="v-row"><span>' + name + '</span><div class="track"><div class="fill ' + tone + '" style="width:' + (val / max * 100).toFixed(1) + '%"></div></div><b>' + esc2(VM.fmtMoney(val)) + "/yr</b>" + (eq ? '<em class="eq">' + esc2(eq) + "</em>" : "") + "</div>";
        return '<div class="versus">' + row("Self-host open source", selfHost, "bad", F.selfHostCost.equation) + row("Spotify Portal", portal, "good", "") + '</div><p class="v-note">' + esc2(VM.fmtDec(Number(inputs.selfHostEngineers) || 0, 1)) + " platform engineers at " + esc2(VM.fmtMoney(Number(inputs.selfHostSalary) || 0)) + " fully loaded, permanently, for upgrades, patches and infrastructure. <strong>" + esc2(delta > 0 ? "Portal is " + VM.fmtMoney(delta) + "/yr cheaper before any of the value above." : "On these figures self-hosting is cheaper. The case has to rest on the value drivers, not on cost avoidance.") + '</strong></p><p class="eq">' + esc2(F.versusSelfHost.equation) + "</p>";
      }
      case "assumptions": {
        const open = DATA.openFields;
        if (!open.length) return '<p class="allgood">Every material input is confirmed. This case is ready to go upward.</p>';
        return '<p class="still">' + open.length + " input" + (open.length === 1 ? "" : "s") + ' still assumed:</p><ul class="assume">' + open.map((f) => "<li><strong>" + esc2(f.label) + "</strong><span>" + esc2(f.assumed) + "</span></li>").join("") + "</ul>";
      }
      case "room":
        return '<div class="cols"><div><h3>What they need to see</h3><ul>' + (st.needsToSee || []).filter(Boolean).map((n) => "<li>" + esc2(n) + "</li>").join("") + "</ul></div><div><h3>The objection</h3><blockquote>" + esc2(st.objection) + "</blockquote><h3>The counter</h3><p>" + esc2(st.counter) + "</p></div></div>";
      default:
        return "";
    }
  }
  const EDITABLE = { text: 1, quote: 1, columns: 1, image: 1 };
  const SINGLE_LINE = { hero: 1, headline: 1, title: 1, label: 1, eyebrow: 1, tag: 1, forwhom: 1 };
  let editing = false;
  function render() {
    const st = stakeholder();
    const ctx = context(st);
    const main2 = $("main");
    const keep = main2.scrollTop;
    main2.innerHTML = DATA.slides.map(
      (s, i) => '<section class="slide ' + (s.variant === "hero" ? "hero-bg" : "") + '" data-i="' + i + '"><div class="inner">' + s.blocks.map(
        (b, j) => '<div class="blk" data-s="' + i + '" data-b="' + j + '"' + (EDITABLE[b.type] ? ' data-e="1"' : "") + ">" + blockHtml(b, st, ctx) + "</div>"
      ).join("") + "</div></section>"
    ).join("");
    main2.scrollTop = keep;
    $("#audience").innerHTML = DATA.stakeholders.map((s) => '<button class="' + (s.key === st.key ? "on" : "") + '" data-key="' + esc2(s.key) + '">' + esc2(s.role) + "</button>").join("");
    $("#dots").innerHTML = DATA.slides.map((s, i) => '<button class="dot ' + (i === current ? "on" : "") + '" data-go="' + i + '" aria-label="Go to page ' + (i + 1) + '"></button>').join("");
    $("#count").textContent = current + 1 + " / " + DATA.slides.length;
  }
  function go(i) {
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides[current].scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function buildSliders() {
    $("#sliders").innerHTML = DATA.sliders.map(
      (s) => "<label><span>" + esc2(s.label) + '<b id="v-' + s.key + '"></b></span><input type="range" data-key="' + s.key + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + inputs[s.key] + '"></label>'
    ).join("");
    const show = () => DATA.sliders.forEach((s) => {
      $("#v-" + s.key).textContent = " " + (s.unit === "%" ? inputs[s.key] + "%" : s.unit === "$" ? "$" + Number(inputs[s.key]).toLocaleString() : Number(inputs[s.key]).toLocaleString());
    });
    show();
    $("#sliders").addEventListener("input", (e) => {
      const k = e.target.getAttribute("data-key");
      if (!k) return;
      inputs[k] = Number(e.target.value);
      show();
      render();
    });
  }
  $("#audience").addEventListener("click", (e) => {
    const k = e.target.getAttribute && e.target.getAttribute("data-key");
    if (k) {
      activeKey = k;
      render();
    }
  });
  $("#dots").addEventListener("click", (e) => {
    const i = e.target.getAttribute && e.target.getAttribute("data-go");
    if (i != null) go(Number(i));
  });
  $("#whatif-toggle").addEventListener("click", () => $("#whatif").classList.toggle("open"));
  $("#whatif-reset").addEventListener("click", () => {
    Object.assign(inputs, DATA.inputs);
    buildSliders();
    render();
  });
  $("#prev").addEventListener("click", () => go(current - 1));
  $("#next").addEventListener("click", () => go(current + 1));
  document.addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      go(current + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      go(current - 1);
    }
  });
  $("main").addEventListener("scroll", () => {
    const slides = document.querySelectorAll(".slide");
    const top = $("main").getBoundingClientRect().top;
    let best = 0;
    let dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.getBoundingClientRect().top - top);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    if (best !== current) {
      current = best;
      document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("on", i === current));
      $("#count").textContent = current + 1 + " / " + slides.length;
    }
  });
  function startEdit(blk, target) {
    if (blk.querySelector("textarea")) return;
    const slide2 = DATA.slides[Number(blk.getAttribute("data-s"))];
    const block2 = slide2 && slide2.blocks[Number(blk.getAttribute("data-b"))];
    if (!block2) return;
    let field = null;
    let host = null;
    if (block2.type === "text" || block2.type === "quote") {
      field = "text";
      host = blk.firstElementChild;
    } else if (block2.type === "columns") {
      const bodies = Array.prototype.slice.call(blk.querySelectorAll(".cols > .body"));
      const k = bodies.indexOf(target.closest(".body"));
      if (k < 0) return;
      field = k === 0 ? "left" : "right";
      host = bodies[k];
    } else if (block2.type === "image") {
      host = target.closest("figcaption");
      if (!host) return;
      field = "caption";
    }
    if (!host || !field) return;
    const ta = document.createElement("textarea");
    ta.className = "edit-ta";
    ta.value = block2[field] || "";
    host.innerHTML = "";
    host.appendChild(ta);
    const fit = () => {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    };
    fit();
    ta.addEventListener("input", fit);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    const single = block2.type === "text" && SINGLE_LINE[block2.style];
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || single && e.key === "Enter") {
        e.preventDefault();
        ta.blur();
      }
    });
    ta.addEventListener("blur", () => {
      const value = ta.value;
      if (value !== (block2[field] || "")) {
        block2[field] = value;
        window.parent.postMessage({ cb: "edit", slideId: slide2.id, blockId: block2.id, field, value }, "*");
      }
      render();
    });
  }
  $("main").addEventListener("click", (e) => {
    if (!editing) return;
    const blk = e.target.closest(".blk");
    if (blk && blk.getAttribute("data-e")) startEdit(blk, e.target);
  });
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent || !e.data || e.data.cb !== "edit-mode") return;
    editing = !!e.data.on;
    document.body.classList.toggle("editing", editing);
  });
  if (DATA.sliders.length) buildSliders();
  else $("#whatif-toggle").style.display = "none";
  render();
}

// src/export/html.js
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var iconLink = (svg) => svg ? `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(svg)}">` : "";
var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif, BlinkMacSystemFont, Helvetica, Arial';
function buildOnePager({ facts: f, logoSvg, faviconSvg }) {
  const logo = (logoSvg || "").replace(/#7df3e1/gi, "#1f8a76");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(f.company)} - business case one-pager</title>
${iconLink(faviconSvg)}
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #e9eaec; }
  body { font-family: ${FONT}; color: #15171a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; margin: 0 auto; background: #fff; padding: 14mm 15mm 12mm; display: flex; flex-direction: column; gap: 5mm; position: relative; overflow: hidden; }
  @media print { html, body { background: #fff; } .page { margin: 0; } }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .top .logo svg { height: 22px; width: auto; display: block; }
  .top .meta { font-size: 8.5pt; color: #5b6168; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
  .bar { height: 3px; width: 46px; background: linear-gradient(90deg, #2fc7a8, rgba(155,240,225,0)); margin-top: 1mm; }
  .eyebrow { font-size: 8.5pt; letter-spacing: .06em; text-transform: uppercase; color: #1f8a76; font-weight: 700; margin: 0; }
  h1 { font-size: 27pt; line-height: 1.08; margin: 1mm 0 1.5mm; font-weight: 800; letter-spacing: -.01em; }
  .cares { margin: 0; font-size: 11pt; color: #4a5057; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.5mm; }
  .stat { border: 1px solid #dfe2e6; border-radius: 6px; padding: 2.6mm 2.8mm; background: #f6f8f9; }
  .stat span { display: block; font-size: 6.8pt; letter-spacing: .05em; text-transform: uppercase; color: #6a7078; font-weight: 600; }
  .stat strong { display: block; font-size: 15pt; margin-top: 1mm; font-weight: 800; }
  .stat.good strong { color: #1f8a76; } .stat.bad strong { color: #c8434a; }
  h2 { font-size: 8.5pt; letter-spacing: .06em; text-transform: uppercase; color: #1f8a76; margin: 0 0 2.2mm; font-weight: 700; }
  .row { display: grid; grid-template-columns: 52mm 1fr 20mm; align-items: center; gap: 1mm 3mm; margin-bottom: 1.6mm; font-size: 9pt; }
  .row .lbl { font-weight: 600; }
  .eqline { grid-column: 2 / 4; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 6.6pt; color: #7b838b; margin-top: -1.2mm; }
  .pgroup { font-size: 7.4pt; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; color: #15171a; margin: 1.5mm 0 1.2mm; }
  .row .lbl.dim { font-weight: 400; color: #5b6168; }
  .track { height: 3.2mm; background: #e8ebee; border-radius: 99px; overflow: hidden; }
  .fill { height: 100%; border-radius: 99px; }
  .val { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
  .total { display: flex; justify-content: space-between; border-top: 1px solid #dfe2e6; margin-top: 2mm; padding-top: 2mm; font-size: 9pt; color: #5b6168; }
  .total strong { font-size: 12pt; color: #15171a; }
  .vs { font-size: 9pt; line-height: 1.5; color: #3e444a; margin: 1.5mm 0 0; }
  .vs strong { color: #15171a; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
  ul { margin: 0; padding-left: 4.5mm; font-size: 9.3pt; line-height: 1.5; color: #2f343a; }
  li { margin-bottom: 1mm; }
  blockquote { margin: 0 0 2.5mm; padding: 2mm 3mm; border-left: 3px solid #2fc7a8; background: #f1f8f6; font-style: italic; font-size: 9.5pt; }
  p.small { margin: 0; font-size: 9.3pt; line-height: 1.5; color: #2f343a; }
  .assume { columns: 2; column-gap: 8mm; font-size: 8.6pt; list-style: none; padding: 0; }
  .assume li { display: flex; justify-content: space-between; gap: 3mm; border-bottom: 1px solid #eceff1; padding: .8mm 0; break-inside: avoid; margin: 0; }
  .assume span { color: #6a7078; white-space: nowrap; }
  .foot { margin-top: auto; display: flex; justify-content: space-between; font-size: 7.8pt; color: #7b838b; border-top: 1px solid #dfe2e6; padding-top: 2.5mm; }
  .toolbar { position: fixed; top: 12px; right: 16px; }
  .toolbar button { font: inherit; font-weight: 700; padding: 8px 14px; border-radius: 4px; border: 0; background: #2fc7a8; color: #111; cursor: pointer; }
  @media print { .toolbar { display: none; } }
</style></head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page">
  <div class="top"><div class="logo">${logo}</div><div class="meta">Business case \xB7 ${esc(f.date)}</div></div>
  <div>
    <div class="bar"></div>
    <p class="eyebrow">${esc(f.company)} \xB7 prepared for ${esc(f.role)}</p>
    <h1>${esc(f.headline)}</h1>
    <p class="cares">${esc(f.cares)}</p>
  </div>

  <div class="stats">${f.stats.map((s) => `<div class="stat ${s.tone || ""}"><span>${esc(s.label)}</span><strong>${esc(s.value)}</strong></div>`).join("")}</div>

  <section>
    <h2>Where the value comes from</h2>
    ${f.groups.map(
    (g) => `<div class="pgroup">${esc(g.label)}</div>` + g.rows.map(
      (d) => `<div class="row"><span class="lbl ${d.lead ? "" : "dim"}">${esc(d.label)}</span>
          <div class="track"><div class="fill" style="width:${d.pct.toFixed(1)}%;background:${esc(d.color)};opacity:${d.lead ? 1 : 0.5}"></div></div>
          <span class="val">${esc(d.valueStr)}</span><span class="eqline">${esc(d.detail)}</span></div>`
    ).join("")
  ).join("")}
    <div class="total"><span>Total annual value</span><strong>${esc(f.total)}</strong></div>
  </section>

  <section>
    <h2>Against self-hosting Backstage</h2>
    ${f.versus.rows.map(
    (r) => `<div class="row"><span class="lbl">${esc(r.name)}</span>
          <div class="track"><div class="fill" style="width:${r.pct.toFixed(1)}%;background:${r.tone === "bad" ? "#e0636a" : "#2fc7a8"}"></div></div>
          <span class="val">${esc(r.valueStr)}</span></div>`
  ).join("")}
    <p class="vs">${esc(f.versus.lead)} <strong>${esc(f.versus.verdict)}</strong></p>
  </section>

  <section class="cols">
    <div><h2>What ${esc(f.role)} needs to see</h2><ul>${f.needs.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>
    <div><h2>The objection, and the answer</h2><blockquote>${esc(f.objection)}</blockquote><p class="small">${esc(f.counter)}</p></div>
  </section>

  <section>
    <h2>${f.openCount ? `${f.openCount} input${f.openCount === 1 ? "" : "s"} still to confirm` : "Every input is confirmed"}</h2>
    ${f.openCount ? `<ul class="assume">${f.open.map((o) => `<li><span style="color:#15171a">${esc(o.label)}</span><span>${esc(o.assumed)}</span></li>`).join("")}</ul>` : '<p class="small">Every material input has been confirmed by the customer.</p>'}
  </section>

  <div class="foot"><span>${esc(f.company)} \xB7 Spotify Portal for Backstage</span><span>Figures come from the inputs above and the value model.</span></div>
</div>
</body></html>`;
}
function stripModules(src) {
  return String(src).replace(/^import [^\n]*$/gm, "").replace(/^export \{[^}]*\} from [^\n]*$/gm, "").replace(/^export /gm, "");
}
function buildWebsite({ company, slides, stakeholders, activeKey, inputs, openFields, sliders, logoSvg, faviconSvg, vmSource }) {
  const data = { company, slides, stakeholders, activeKey, inputs, openFields, sliders, logo: logoSvg };
  const safe = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const json = safe(data);
  const vm = `(function(){${stripModules(vmSource)}
return {computeModel:computeModel,STAKEHOLDERS:STAKEHOLDERS,PAIRS:PAIRS,driversByPillar:driversByPillar,fmtMoney:fmtMoney,fmtMoneyFull:fmtMoneyFull,fmtDec:fmtDec,fmtMonths:fmtMonths};})()`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${iconLink(faviconSvg)}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap">
<title>${esc(company)} \xB7 Business case</title>
<style>${SITE_CSS}</style></head>
<body>
<header class="top">
  <div class="brand">${logoSvg}</div>
  <div class="co">${esc(company)}</div>
  <div class="aud-wrap"><span>View as</span><div id="audience" class="audience"></div></div>
  <div class="pager"><button id="prev" aria-label="Previous page">\u2190</button><span id="count"></span><button id="next" aria-label="Next page">\u2192</button></div>
</header>
<nav class="dots" id="dots" aria-label="Pages"></nav>
<main></main>
<button id="whatif-toggle" class="whatif-btn">Adjust the numbers</button>
<aside id="whatif" class="whatif">
  <h3>Adjust the numbers</h3>
  <p>Move a slider and every figure on every page updates.</p>
  <div id="sliders"></div>
  <button id="whatif-reset">Reset to the original</button>
</aside>
<script id="data" type="application/json">${json}</script>
<script>
var DATA = JSON.parse(document.getElementById('data').textContent);
var VM = ${vm};
(${String(siteMain)})(DATA, VM);
</script>
</body></html>`;
}
var SITE_CSS = `
:root{--bg:#111111;--panel:#242526;--panel3:#303132;--line:#2e2f31;--line2:#46484b;--ink:#e3e3e3;--strong:#fff;--dim:#a9acb1;--faint:#797c82;--accent:#9bf0de;--mint:#9bf0de;--pink:#e5399a;--bad:#e5399a;--warn:#ffba00}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font-family:${FONT};font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.top{position:fixed;top:0;left:0;right:0;height:56px;display:flex;align-items:center;gap:18px;padding:0 24px;background:var(--bg);border-bottom:1px solid var(--line);z-index:20}
.brand svg{height:22px;width:auto;display:block}.co{font-weight:700;color:var(--strong);white-space:nowrap}
.aud-wrap{display:flex;align-items:center;gap:10px;margin-left:auto;min-width:0}.aud-wrap>span{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);font-weight:600}
.audience{display:flex;gap:6px;overflow-x:auto}.audience button{background:var(--panel);border:1px solid var(--line);color:var(--dim);padding:6px 13px;border-radius:4px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.audience button:hover{color:var(--strong)}.audience button.on{background:var(--accent);border-color:var(--accent);color:#111}
.pager{display:flex;align-items:center;gap:8px;color:var(--dim);font-size:13px}.pager button{width:30px;height:30px;border-radius:4px;border:1px solid var(--line2);background:none;color:var(--ink);cursor:pointer}
.pager button:hover{border-color:var(--ink)}
main{height:100vh;overflow-y:auto;padding-top:56px;scroll-snap-type:y proximity}
.slide{min-height:calc(100vh - 56px);scroll-snap-align:start;display:flex;align-items:center;padding:56px 72px 56px 32px;border-bottom:1px solid var(--line)}
.slide.hero-bg{background:linear-gradient(70.44deg,#111111 55%,#1f3a35)}
.inner{max-width:1000px;margin:0 auto;width:100%}
.label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mint);margin:0 0 16px}
.eyebrow,.forwhom{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--dim);margin:0 0 16px}.forwhom{color:var(--faint);margin-top:28px;border-top:1px solid var(--line2);padding-top:14px;display:inline-block}
h1.hero,h2,.stat strong,.pillar h3{font-family:Outfit,'Avenir Next','Century Gothic',system-ui,sans-serif}
h1.hero{font-size:clamp(44px,8vw,88px);line-height:1.05;margin:0;color:var(--strong);font-weight:800}
h2{font-size:clamp(28px,4vw,40px);line-height:1.12;margin:0 0 10px;color:var(--strong);font-weight:700}
h2.headline{font-size:clamp(34px,6vw,60px);line-height:1.08;font-weight:800;max-width:18ch}
h3{font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--dim);margin:0 0 10px;font-weight:600}
p{margin:0 0 14px}.sub{color:var(--dim);font-size:17px}.lede{font-size:19px;color:var(--dim);max-width:46ch}.note{color:var(--dim);max-width:62ch}.caption{color:var(--faint);font-size:13px}
.tag{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--warn);border:1px solid rgba(255,186,0,.35);border-radius:4px;padding:3px 10px}
.body p{font-size:17px;line-height:1.7;color:var(--dim)}.body ul,.cols ul{margin:0 0 14px;padding-left:22px}.body li,.cols li{font-size:16px;line-height:1.6;color:var(--dim);margin-bottom:8px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:10px}
blockquote{margin:0 0 20px;padding:14px 18px;background:var(--bg);border-left:3px solid var(--accent);border-radius:0 4px 4px 0;font-style:italic;color:var(--strong)}
figure{margin:0 0 16px}figure img{max-width:100%;max-height:60vh;border-radius:6px;display:block}figcaption{color:var(--faint);font-size:13px;margin-top:8px}
hr{border:0;border-top:1px solid var(--line2);margin:22px 0}.spacer{height:40px}.logo svg{height:26px;width:auto;display:block;margin-bottom:34px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 20px}.stat span{display:block;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);margin-bottom:8px}
.stat strong{font-size:32px;font-weight:700;color:var(--strong);font-variant-numeric:tabular-nums}.stat.good strong{color:var(--accent)}.stat.bad strong{color:var(--bad)}
.chart{display:flex;flex-direction:column;gap:18px;margin-top:22px}
.bar-row{display:grid;grid-template-columns:210px 1fr 80px;grid-template-areas:"l t v" "d d d";gap:4px 16px;align-items:center}
.bar-label{grid-area:l;color:var(--dim);font-size:14px;display:flex;align-items:center;gap:8px}.bar-row.lead .bar-label{color:var(--strong);font-weight:600}
.bar-label i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(155,240,222,.2);flex:none}
.track{grid-area:t;height:12px;background:var(--panel3);border-radius:99px;overflow:hidden}.fill{height:100%;border-radius:99px}.fill.bad{background:#e0636a}.fill.good{background:var(--accent)}
.bar-value{grid-area:v;text-align:right;font-variant-numeric:tabular-nums;color:var(--dim)}.bar-row.lead .bar-value{color:var(--strong);font-weight:700}
.bar-detail{grid-area:d;color:var(--faint);font-size:12px;padding-left:226px}
.eq{display:block;font-family:ui-monospace,Menlo,Consolas,monospace;font-style:normal;font-size:12px;color:var(--faint);margin-top:6px;overflow-wrap:anywhere}p.eq{margin:8px 0 0}
.stat .eq{font-size:11px}
.pillar{margin-bottom:6px}.pillar h3{display:flex;justify-content:space-between;color:var(--strong);border-bottom:1px solid var(--line2);padding-bottom:8px;margin-bottom:12px}.pillar.pl h3{color:var(--accent)}.pillar h3 span{font-variant-numeric:tabular-nums}
.pairs{display:flex;flex-direction:column;gap:10px;margin-top:20px}.pr{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:12px;align-items:baseline;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px 16px}.pr.ph{background:none;border:0;padding:0 16px;color:var(--faint);font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.pr b{font-variant-numeric:tabular-nums;color:var(--strong);text-align:right}.pr .pd{color:var(--accent)}.pr .eq{grid-column:1/-1;margin:0}.pr .pl2 i{color:var(--faint);font-style:normal;font-size:12px}
.total{display:flex;justify-content:space-between;align-items:baseline;margin-top:26px;padding-top:16px;border-top:1px solid var(--line);color:var(--dim);font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.v-row .track{grid-area:auto}.total strong{font-size:32px;text-transform:none;letter-spacing:0;color:var(--strong)}
.versus{display:flex;flex-direction:column;gap:16px;margin:22px 0}.v-row{display:grid;grid-template-columns:185px 1fr 120px;gap:16px;align-items:center}.v-row .track{height:18px}.v-row b{text-align:right}
.v-note{color:var(--dim);max-width:68ch}.v-note strong{color:var(--strong);display:block;margin-top:8px}
.still{color:var(--strong)}.allgood{color:var(--accent);background:rgba(155,240,222,.07);border:1px solid rgba(155,240,222,.25);padding:18px;border-radius:8px}
.assume{list-style:none;padding:0;margin:14px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px}
.assume li{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:11px 15px;display:flex;justify-content:space-between;gap:12px;font-size:13px}.assume span{color:var(--faint);font-size:12px}
.dots{position:fixed;right:20px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:15}
.dot{width:11px;height:11px;border-radius:50%;border:2px solid var(--line2);background:none;padding:0;cursor:pointer}.dot:hover{border-color:var(--ink)}.dot.on{background:var(--accent);border-color:var(--accent)}
.whatif-btn{position:fixed;left:24px;bottom:24px;z-index:25;background:var(--accent);color:#111;border:0;border-radius:4px;padding:11px 18px;font:inherit;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.03em;cursor:pointer}
.whatif{position:fixed;left:24px;bottom:76px;width:340px;max-height:70vh;overflow:auto;background:var(--panel);border:1px solid var(--line2);border-radius:10px;padding:18px 20px;z-index:25;display:none;box-shadow:0 12px 40px rgba(0,0,0,.5)}
.whatif.open{display:block}.whatif h3{color:var(--strong);font-size:15px;text-transform:none;letter-spacing:0;margin:0 0 4px}.whatif p{color:var(--dim);font-size:13px}
.whatif label{display:block;margin:14px 0}.whatif label span{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}.whatif label b{color:var(--accent)}
.whatif input[type=range]{width:100%;accent-color:var(--accent)}.whatif button{margin-top:6px;background:none;border:1px solid var(--line2);color:var(--ink);border-radius:4px;padding:7px 12px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.editing .blk[data-e]:hover{outline:1px dashed rgba(155,240,222,.6);outline-offset:6px;cursor:text;border-radius:4px}
.edit-ta{display:block;width:100%;resize:none;overflow:hidden;font:inherit;color:inherit;letter-spacing:inherit;line-height:inherit;text-transform:inherit;background:rgba(155,240,222,.1);border:1px dashed var(--accent);border-radius:4px;padding:2px 8px;margin:0}
.edit-ta:focus{outline:none;border-style:solid}
@media(max-width:780px){.top{gap:10px;padding:0 12px}.co{display:none}.aud-wrap>span{display:none}.slide{padding:40px 36px 40px 16px}.cols,.stats{grid-template-columns:1fr}.bar-row{grid-template-columns:1fr 70px;grid-template-areas:"l v" "t t" "d d"}.bar-detail{padding-left:0}.v-row{grid-template-columns:1fr 90px}.v-row .track{grid-column:1/-1;order:3}.whatif{left:12px;right:12px;width:auto}}
`;

// src/export/pptx.js
var W = 13.333;
var H = 7.5;
var MX = 0.7;
var CW = W - MX * 2;
var TOP = 0.6;
var BOTTOM = H - 0.55;
var FONT2 = "Arial";
var C = {
  bg: "111111",
  panel: "1E1E1E",
  track: "323335",
  line: "46484B",
  ink: "E3E3E3",
  strong: "FFFFFF",
  dim: "A9ACB1",
  faint: "797C82",
  accent: "9BF0DE",
  mint: "9BF0DE",
  bad: "E5399A",
  warn: "FFBA00"
};
var STYLE = {
  hero: { size: 50, bold: true, color: C.strong, gap: 0.22 },
  headline: { size: 38, bold: true, color: C.strong, gap: 0.18 },
  title: { size: 30, bold: true, color: C.strong, gap: 0.14 },
  sub: { size: 16, color: C.dim, gap: 0.24 },
  lede: { size: 19, color: C.dim, gap: 0.24 },
  body: { size: 16, color: C.ink, gap: 0.2 },
  note: { size: 14, color: C.dim, gap: 0.2 },
  label: { size: 11, bold: true, color: C.mint, gap: 0.2, caps: true, spacing: 1 },
  eyebrow: { size: 11, bold: true, color: C.dim, gap: 0.2, caps: true, spacing: 1 },
  tag: { size: 11, bold: true, color: C.warn, gap: 0.22, caps: true },
  forwhom: { size: 11, bold: true, color: C.faint, gap: 0.2, caps: true, spacing: 1 },
  caption: { size: 11, color: C.faint, gap: 0.15 }
};
var hex = (c) => String(c || "").replace("#", "").toUpperCase();
function textHeight(str, size, widthIn, bold) {
  const perLine = Math.max(8, Math.floor(widthIn * 72 / (size * (bold ? 0.56 : 0.5))));
  const lines = String(str).split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return lines * size * 1.22 / 72;
}
var parasHeight = (paras, size, widthIn) => paras.reduce((h, p) => {
  if (p.type === "ul") return h + p.items.reduce((s, i) => s + textHeight(i, size, widthIn - 0.3) + 0.06, 0) + 0.1;
  return h + textHeight(p.text, size, widthIn) + 0.12;
}, 0);
function paraRuns(paras, size, color) {
  const runs = [];
  paras.forEach((p) => {
    if (p.type === "ul") {
      p.items.forEach(
        (i) => runs.push({ text: i, options: { bullet: { indent: 18 }, breakLine: true, fontSize: size, color, paraSpaceAfter: 4 } })
      );
    } else {
      runs.push({ text: p.text, options: { breakLine: true, fontSize: size, color, paraSpaceAfter: 8 } });
    }
  });
  return runs;
}
async function layoutBlock(b, deps) {
  switch (b.kind) {
    case "text": {
      const st = STYLE[b.style] || STYLE.body;
      if (b.style === "body") {
        const paras = b.paras || [];
        const h2 = parasHeight(paras, st.size, CW) + st.gap;
        return {
          h: h2,
          draw: (s, y, k) => s.addText(paraRuns(paras, st.size * k, st.color), { x: MX, y, w: CW, h: h2 * k - st.gap * k, fontFace: FONT2, valign: "top", margin: 0 })
        };
      }
      const t = st.caps ? b.text.toUpperCase() : b.text;
      const h = textHeight(t, st.size, CW, st.bold) + st.gap;
      return {
        h,
        draw: (s, y, k) => s.addText(t, {
          x: MX,
          y,
          w: CW,
          h: h * k - st.gap * k,
          fontFace: FONT2,
          fontSize: st.size * k,
          bold: !!st.bold,
          color: st.color,
          valign: "top",
          margin: 0,
          charSpacing: st.spacing || 0,
          italic: false
        })
      };
    }
    case "quote": {
      const h = textHeight(b.text, 18, CW - 0.4) + 0.4;
      return {
        h,
        draw: (s, y, k) => {
          s.addShape("rect", { x: MX, y, w: 0.06, h: (h - 0.2) * k, fill: { color: C.accent }, line: { color: C.accent, width: 0 } });
          s.addText(b.text, { x: MX + 0.25, y, w: CW - 0.25, h: (h - 0.2) * k, fontFace: FONT2, fontSize: 18 * k, italic: true, color: C.strong, valign: "top", margin: 0 });
        }
      };
    }
    case "columns": {
      const colW = (CW - 0.5) / 2;
      const h = Math.max(parasHeight(b.left, 16, colW), parasHeight(b.right, 16, colW)) + 0.2;
      return {
        h,
        draw: (s, y, k) => {
          ;
          [b.left, b.right].forEach(
            (paras, i) => s.addText(paraRuns(paras, 16 * k, C.ink), { x: MX + i * (colW + 0.5), y, w: colW, h: (h - 0.2) * k, fontFace: FONT2, valign: "top", margin: 0 })
          );
        }
      };
    }
    case "image": {
      if (!b.src) return { h: 0, draw: () => {
      } };
      const dims = await deps.imageSize(b.src);
      const maxW = CW;
      const maxH = 3.7;
      const ratio = dims.w / dims.h;
      let w = maxW;
      let hh = w / ratio;
      if (hh > maxH) {
        hh = maxH;
        w = hh * ratio;
      }
      const capH = b.caption ? 0.35 : 0;
      return {
        h: hh + capH + 0.2,
        draw: (s, y, k) => {
          s.addImage({ data: b.src, x: MX, y, w: w * k, h: hh * k });
          if (b.caption) s.addText(b.caption, { x: MX, y: y + hh * k + 0.05, w: CW, h: 0.3, fontFace: FONT2, fontSize: 11, color: C.faint, margin: 0 });
        }
      };
    }
    case "logo": {
      const png = await deps.logoPng();
      if (!png) return { h: 0, draw: () => {
      } };
      return { h: 0.7, draw: (s, y, k) => s.addImage({ data: png.data, x: MX, y, w: 0.34 * png.ratio * k, h: 0.34 * k }) };
    }
    case "divider":
      return { h: 0.35, draw: (s, y) => s.addShape("line", { x: MX, y: y + 0.1, w: CW, h: 0, line: { color: C.line, width: 1 } }) };
    case "spacer":
      return { h: 0.45, draw: () => {
      } };
    case "stats": {
      const items = b.items;
      const per = items.length <= 3 ? items.length || 1 : 3;
      const rows = Math.ceil(items.length / per);
      const gap = 0.18;
      const tw = (CW - gap * (per - 1)) / per;
      const th = 1.12;
      return {
        h: rows * th + (rows - 1) * gap + 0.3,
        draw: (s, y, k) => items.forEach((it, i) => {
          const x = MX + i % per * (tw + gap);
          const yy = y + Math.floor(i / per) * (th + gap) * k;
          s.addShape("roundRect", { x, y: yy, w: tw, h: th * k, rectRadius: 0.06, fill: { color: C.panel }, line: { color: C.track, width: 1 } });
          s.addText(it.label.toUpperCase(), { x: x + 0.2, y: yy + 0.14 * k, w: tw - 0.3, h: 0.25, fontFace: FONT2, fontSize: 9 * k, bold: true, color: C.faint, charSpacing: 1, margin: 0 });
          s.addText(it.value, {
            x: x + 0.2,
            y: yy + 0.42 * k,
            w: tw - 0.3,
            h: 0.55 * k,
            fontFace: FONT2,
            fontSize: 28 * k,
            bold: true,
            margin: 0,
            color: it.tone === "good" ? C.accent : it.tone === "bad" ? C.bad : C.strong
          });
          if (it.eq) s.addText(it.eq, { x: x + 0.2, y: yy + 0.86 * k, w: tw - 0.3, h: 0.2 * k, fontFace: "Consolas", fontSize: 7 * k, color: C.faint, margin: 0, fit: "shrink" });
        })
      };
    }
    case "drivers": {
      const items = [];
      b.groups.forEach((g) => {
        items.push({ head: g });
        g.rows.forEach((d) => items.push({ row: d }));
      });
      const hh = 0.42;
      const rh = 0.62;
      const height = items.reduce((t, it) => t + (it.head ? hh : rh), 0);
      return {
        h: height + 0.95,
        draw: (s, y, k) => {
          let yy = y;
          items.forEach((it) => {
            if (it.head) {
              const g = it.head;
              s.addText(g.label.toUpperCase(), { x: MX, y: yy, w: 5, h: 0.3 * k, fontFace: FONT2, fontSize: 10 * k, bold: true, color: g.leads ? C.accent : C.strong, charSpacing: 1, margin: 0, valign: "middle" });
              s.addText(g.total, { x: W - MX - 1.6, y: yy, w: 1.6, h: 0.3 * k, fontFace: FONT2, fontSize: 11 * k, bold: true, color: C.dim, align: "right", margin: 0, valign: "middle" });
              yy += hh * k;
              return;
            }
            const d = it.row;
            const trackX = MX + 3.5;
            const trackW = CW - 3.5 - 1.7;
            s.addText(d.label, { x: MX, y: yy, w: 3.4, h: 0.3 * k, fontFace: FONT2, fontSize: 12 * k, bold: d.lead, color: d.lead ? C.strong : C.dim, margin: 0, valign: "middle" });
            s.addShape("roundRect", { x: trackX, y: yy + 0.07 * k, w: trackW, h: 0.16 * k, rectRadius: 0.08, fill: { color: C.track }, line: { color: C.track, width: 0 } });
            s.addShape("roundRect", {
              x: trackX,
              y: yy + 0.07 * k,
              w: Math.max(0.05, trackW * (d.pct / 100)),
              h: 0.16 * k,
              rectRadius: 0.08,
              fill: { color: hex(d.key === "platform" ? C.accent : d.color), transparency: d.lead ? 0 : 55 },
              line: { color: hex(d.color), width: 0 }
            });
            s.addText(d.valueStr, { x: W - MX - 1.6, y: yy, w: 1.6, h: 0.3 * k, fontFace: FONT2, fontSize: 12 * k, bold: d.lead, color: d.lead ? C.strong : C.dim, align: "right", margin: 0, valign: "middle" });
            s.addText(d.detail, { x: trackX, y: yy + 0.3 * k, w: CW - 3.5, h: 0.22 * k, fontFace: "Consolas", fontSize: 8 * k, color: C.faint, margin: 0, valign: "top", fit: "shrink" });
            yy += rh * k;
          });
          const ty = y + height * k + 0.08;
          s.addShape("line", { x: MX, y: ty, w: CW, h: 0, line: { color: C.track, width: 1 } });
          s.addText("TOTAL ANNUAL VALUE", { x: MX, y: ty + 0.1, w: 5, h: 0.4 * k, fontFace: FONT2, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0, valign: "middle" });
          s.addText(b.total, { x: W - MX - 4, y: ty + 0.06, w: 4, h: 0.5 * k, fontFace: FONT2, fontSize: 24 * k, bold: true, color: C.strong, align: "right", margin: 0, valign: "middle" });
          s.addText(b.totalEq, { x: MX, y: ty + 0.56 * k, w: CW, h: 0.22 * k, fontFace: "Consolas", fontSize: 8 * k, color: C.faint, margin: 0, fit: "shrink" });
        }
      };
    }
    case "pairs": {
      const rh = 0.72;
      return {
        h: b.rows.length * rh + 0.5,
        draw: (s, y, k) => {
          const cx = [MX + 4.2, MX + 6.2, MX + 8.3];
          ["TODAY", "WITH PORTAL", "DIFFERENCE"].forEach(
            (t, i) => s.addText(t, { x: cx[i], y, w: 1.9, h: 0.25 * k, fontFace: FONT2, fontSize: 9 * k, bold: true, color: C.faint, charSpacing: 1, align: "right", margin: 0 })
          );
          b.rows.forEach((p, i) => {
            const yy = y + (0.36 + i * rh) * k;
            s.addText(p.label + (p.unit ? " (" + p.unit + ")" : ""), { x: MX, y: yy, w: 4.1, h: 0.32 * k, fontFace: FONT2, fontSize: 12 * k, color: C.ink, margin: 0, valign: "middle", fit: "shrink" });
            [p.today, p.portal, p.diff].forEach(
              (v, j) => s.addText(v, { x: cx[j], y: yy, w: 1.9, h: 0.32 * k, fontFace: FONT2, fontSize: 14 * k, bold: j === 2, color: j === 2 ? C.accent : C.strong, align: "right", margin: 0, valign: "middle" })
            );
            s.addText(p.saved + ": worth " + p.value, { x: MX, y: yy + 0.33 * k, w: CW, h: 0.22 * k, fontFace: FONT2, fontSize: 9 * k, color: C.faint, margin: 0 });
          });
        }
      };
    }
    case "versus": {
      const note = `${b.lead} ${b.verdict}`;
      const nh = textHeight(note, 14, CW) + 0.1;
      return {
        h: 2 * 0.62 + nh + 0.4,
        draw: (s, y, k) => {
          b.rows.forEach((r, i) => {
            const yy = y + i * 0.62 * k;
            const trackX = MX + 3.2;
            const trackW = CW - 3.2 - 1.7;
            s.addText(r.name, { x: MX, y: yy, w: 3.1, h: 0.4 * k, fontFace: FONT2, fontSize: 14 * k, color: C.ink, margin: 0, valign: "middle" });
            s.addShape("roundRect", { x: trackX, y: yy + 0.05 * k, w: trackW, h: 0.3 * k, rectRadius: 0.15, fill: { color: C.track }, line: { color: C.track, width: 0 } });
            s.addShape("roundRect", {
              x: trackX,
              y: yy + 0.05 * k,
              w: Math.max(0.05, trackW * (r.pct / 100)),
              h: 0.3 * k,
              rectRadius: 0.15,
              fill: { color: r.tone === "bad" ? "E0636A" : C.accent },
              line: { color: C.accent, width: 0 }
            });
            s.addText(r.valueStr, { x: W - MX - 1.6, y: yy, w: 1.6, h: 0.4 * k, fontFace: FONT2, fontSize: 15 * k, bold: true, color: C.strong, align: "right", margin: 0, valign: "middle" });
            if (r.eq) s.addText(r.eq, { x: trackX, y: yy + 0.38 * k, w: trackW, h: 0.2 * k, fontFace: "Consolas", fontSize: 8 * k, color: C.faint, margin: 0, fit: "shrink" });
          });
          s.addText(
            [
              { text: b.lead + " ", options: { color: C.dim } },
              { text: b.verdict, options: { color: C.strong, bold: true } }
            ],
            { x: MX, y: y + 2 * 0.62 * k + 0.15, w: CW, h: nh * k, fontFace: FONT2, fontSize: 14 * k, valign: "top", margin: 0 }
          );
        }
      };
    }
    case "assumptions": {
      if (!b.count) {
        return {
          h: 0.7,
          draw: (s, y, k) => s.addText("Every material input is confirmed. This case is ready to go upward.", { x: MX, y, w: CW, h: 0.5 * k, fontFace: FONT2, fontSize: 16 * k, color: C.accent, margin: 0 })
        };
      }
      const per = Math.ceil(b.items.length / 2);
      return {
        h: 0.5 + per * 0.5 + 0.1,
        draw: (s, y, k) => {
          s.addText(`${b.count} input${b.count === 1 ? "" : "s"} still assumed:`, { x: MX, y, w: CW, h: 0.35 * k, fontFace: FONT2, fontSize: 14 * k, color: C.strong, margin: 0 });
          const cw = (CW - 0.3) / 2;
          b.items.forEach((it, i) => {
            const col = Math.floor(i / per);
            const row = i % per;
            const x = MX + col * (cw + 0.3);
            const yy = y + 0.5 * k + row * 0.5 * k;
            s.addShape("roundRect", { x, y: yy, w: cw, h: 0.42 * k, rectRadius: 0.05, fill: { color: C.panel }, line: { color: C.track, width: 1 } });
            s.addText(it.label, { x: x + 0.15, y: yy, w: cw * 0.62, h: 0.42 * k, fontFace: FONT2, fontSize: 11 * k, bold: true, color: C.ink, margin: 0, valign: "middle", fit: "shrink" });
            s.addText(it.assumed, { x: x + cw * 0.62, y: yy, w: cw * 0.38 - 0.15, h: 0.42 * k, fontFace: FONT2, fontSize: 10 * k, color: C.faint, align: "right", margin: 0, valign: "middle" });
          });
        }
      };
    }
    case "room": {
      const colW = (CW - 0.6) / 2;
      const left = b.needs.reduce((h, n) => h + textHeight(n, 15, colW - 0.3) + 0.08, 0) + 0.45;
      const right = 0.45 + textHeight(b.objection, 16, colW - 0.4) + 0.3 + 0.45 + textHeight(b.counter, 15, colW) + 0.1;
      return {
        h: Math.max(left, right) + 0.2,
        draw: (s, y, k) => {
          s.addText("WHAT THEY NEED TO SEE", { x: MX, y, w: colW, h: 0.3 * k, fontFace: FONT2, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0 });
          s.addText(
            b.needs.map((n) => ({ text: n, options: { bullet: { indent: 18 }, breakLine: true, fontSize: 15 * k, color: C.ink, paraSpaceAfter: 5 } })),
            { x: MX, y: y + 0.4 * k, w: colW, h: (left - 0.4) * k, fontFace: FONT2, valign: "top", margin: 0 }
          );
          const rx = MX + colW + 0.6;
          s.addText("THE OBJECTION", { x: rx, y, w: colW, h: 0.3 * k, fontFace: FONT2, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0 });
          const qh = textHeight(b.objection, 16, colW - 0.4) + 0.2;
          s.addShape("rect", { x: rx, y: y + 0.4 * k, w: 0.05, h: qh * k, fill: { color: C.accent }, line: { color: C.accent, width: 0 } });
          s.addText(b.objection, { x: rx + 0.2, y: y + 0.4 * k, w: colW - 0.2, h: qh * k, fontFace: FONT2, fontSize: 16 * k, italic: true, color: C.strong, valign: "middle", margin: 0 });
          const cy = y + (0.4 + qh + 0.3) * k;
          s.addText("THE COUNTER", { x: rx, y: cy, w: colW, h: 0.3 * k, fontFace: FONT2, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0 });
          s.addText(b.counter, { x: rx, y: cy + 0.4 * k, w: colW, h: textHeight(b.counter, 15, colW) * k, fontFace: FONT2, fontSize: 15 * k, color: C.ink, valign: "top", margin: 0 });
        }
      };
    }
    default:
      return { h: 0, draw: () => {
      } };
  }
}
async function buildPptx({ company, slides, deps }) {
  const pptx = new deps.PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `${company} - business case`;
  pptx.company = "Spotify";
  let n = 0;
  for (const sl of slides) {
    n += 1;
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    if (sl.variant === "hero") {
      s.addShape("ellipse", { x: W - 6.2, y: H - 5.2, w: 9, h: 9, fill: { color: "1F3A35", transparency: 40 }, line: { color: "1F3A35", width: 0, transparency: 100 } });
      s.addShape("ellipse", { x: W - 4.2, y: H - 3.8, w: 6, h: 6, fill: { color: C.accent, transparency: 86 }, line: { color: C.accent, width: 0, transparency: 100 } });
    }
    const laid = [];
    for (const b of sl.blocks) laid.push(await layoutBlock(b, deps));
    const total = laid.reduce((h, l) => h + l.h, 0);
    const avail = BOTTOM - TOP;
    const k = total > avail ? Math.max(0.5, avail / total) : 1;
    let y = sl.variant === "hero" && total * k < avail - 1 ? TOP + Math.min(1, (avail - total * k) / 3) : TOP;
    for (const l of laid) {
      l.draw(s, y, k);
      y += l.h * k;
    }
    s.addText(`${company}  \xB7  Business case`, { x: MX, y: H - 0.42, w: 6, h: 0.25, fontFace: FONT2, fontSize: 9, color: C.faint, margin: 0 });
    s.addText(String(n), { x: W - MX - 1, y: H - 0.42, w: 1, h: 0.25, fontFace: FONT2, fontSize: 9, color: C.faint, align: "right", margin: 0 });
  }
  return pptx;
}

// src/export/prepare.js
var pickAudience = (stakeholders, key) => stakeholders.find((s) => s.key === key) || stakeholders[0] || NO_ONE;
function prepareOnePager({ inputs, fields, who, date }) {
  const env = buildEnv(inputs, fields, who);
  const block2 = (type) => resolveBlock({ type }, env);
  const room = block2("room");
  const asm = block2("assumptions");
  const drivers = block2("drivers");
  return {
    company: env.ctx.company,
    role: who.role,
    headline: env.ctx.headline,
    cares: who.cares,
    stats: block2("stats").items,
    groups: drivers.groups,
    totalEq: drivers.totalEq,
    pairs: block2("pairs").rows,
    total: drivers.total,
    versus: block2("versus"),
    needs: room.needs,
    objection: room.objection,
    counter: room.counter,
    open: asm.items.slice(0, 8),
    openCount: asm.count,
    date: date || (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { year: "numeric", month: "long", day: "numeric" })
  };
}
var SLIDERS = [
  ["engineers", "Engineers", "", 1],
  ["hourlyCost", "Cost per engineer hour", "$", 5],
  ["searchHoursToday", "Search hours per engineer per week, today", "", 0.5],
  ["searchHoursPortal", "Search hours per engineer per week, with Portal", "", 0.5],
  ["portalCost", "Portal annual subscription", "$", 1e4]
];
function prepareWebsite({ company, deck, inputs, fields, stakeholders, who }) {
  const env = buildEnv(inputs, fields, who);
  const values = Object.fromEntries(fields.map((f) => [f.key, f.value]));
  return {
    company,
    slides: deck,
    stakeholders: stakeholders.map((s) => ({
      key: s.key,
      role: s.role,
      tag: s.tag || "",
      cares: s.cares || "",
      objection: s.objection || "",
      counter: s.counter || "",
      needsToSee: s.needsToSee || [],
      lead: s.lead || [],
      builtin: STAKEHOLDERS.some((b) => b.key === s.key)
    })),
    activeKey: who.key,
    inputs: values,
    openFields: resolveBlock({ type: "assumptions" }, env).items,
    sliders: SLIDERS.filter(([k]) => typeof values[k] === "number").map(([key, label, unit, step]) => ({
      key,
      label,
      unit,
      step,
      min: 0,
      max: unit === "%" ? 100 : Math.max(step * 10, Math.ceil(values[key] * 3 / step) * step)
    }))
  };
}

// src/export/imageSize.js
function toBytes(dataUrl) {
  const m = /^data:[^;,]+(;base64)?,(.*)$/s.exec(dataUrl || "");
  if (!m) return null;
  if (m[1]) {
    const bin = typeof atob === "function" ? atob(m[2]) : Buffer.from(m[2], "base64").toString("binary");
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  return null;
}
function dataUrlSize(src) {
  const b = toBytes(src);
  if (!b || b.length < 24) return { w: 4, h: 3 };
  const u32 = (i) => (b[i] << 24 | b[i + 1] << 16 | b[i + 2] << 8 | b[i + 3]) >>> 0;
  if (b[0] === 137 && b[1] === 80) return { w: u32(16), h: u32(20) };
  if (b[0] === 71 && b[1] === 73) return { w: b[6] | b[7] << 8, h: b[8] | b[9] << 8 };
  if (b[0] === 255 && b[1] === 216) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 255) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
        return { h: b[i + 5] << 8 | b[i + 6], w: b[i + 7] << 8 | b[i + 8] };
      }
      i += 2 + (b[i + 2] << 8 | b[i + 3]);
    }
  }
  return { w: 4, h: 3 };
}

// server/publish.js
var PublishError = class extends Error {
  constructor(message, code = "failed") {
    super(message);
    this.code = code;
  }
};
var apiBase = () => (process.env.VERCEL_API_URL || "https://api.vercel.com").replace(/\/+$/, "");
var b64 = (text2) => typeof Buffer !== "undefined" ? Buffer.from(text2, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(text2)));
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var slug = (s) => String(s || "case").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36).replace(/-+$/g, "") || "case";
function projectName(company, random = Math.random) {
  const tail = Array.from({ length: 6 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(random() * 36)]).join("");
  return `bc-${slug(company)}-${tail}`;
}
var SITE_CONFIG = {
  cleanUrls: true,
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" }
      ]
    }
  ]
};
function siteFiles(html) {
  return [
    { file: "index.html", data: b64(html), encoding: "base64" },
    { file: "vercel.json", data: b64(JSON.stringify(SITE_CONFIG, null, 2)), encoding: "base64" }
  ];
}
function explain(status, body) {
  const msg = body?.error?.message || body?.message || "";
  if (status === 401) return new PublishError("Vercel rejected the token (VERCEL_TOKEN). Create a new one at vercel.com/account/tokens.", "bad_token");
  if (status === 403) return new PublishError(`The token is not allowed to do that${msg ? `: ${msg}` : ""}. If the account uses a team, set VERCEL_TEAM_ID.`, "forbidden");
  if (status === 429) return new PublishError("Vercel is rate limiting new deployments (the free plan allows 100 a day). Try again later.", "rate_limited");
  if (status === 402) return new PublishError("Vercel says this needs a payment method or a higher plan.", "payment");
  return new PublishError(`Vercel returned ${status}${msg ? `: ${msg}` : ""}.`, "failed");
}
async function publishSite(opts) {
  const { html, company, token, teamId, fetchImpl = fetch, wait = sleep, log = () => {
  } } = opts;
  if (!token) throw new PublishError("No Vercel token. Set VERCEL_TOKEN.", "no_token");
  if (typeof html !== "string" || !html.trim()) throw new PublishError("There is no page to publish.", "bad_input");
  const name = opts.name || projectName(company);
  const base = apiBase();
  const q = (extra = "") => {
    const parts = [];
    if (teamId) parts.push(`teamId=${encodeURIComponent(teamId)}`);
    if (extra) parts.push(extra);
    return parts.length ? `?${parts.join("&")}` : "";
  };
  const call = async (method, path2, body) => {
    let res;
    try {
      res = await fetchImpl(`${base}${path2}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : void 0
      });
    } catch (e) {
      throw new PublishError(`Could not reach Vercel (${e.message}).`, "network");
    }
    let json = null;
    try {
      json = await res.json();
    } catch {
    }
    return { status: res.status, ok: res.ok, json };
  };
  log(`creating project ${name}`);
  let made = await call("POST", `/v10/projects${q()}`, { name, framework: null, ssoProtection: null });
  if (made.status === 400) made = await call("POST", `/v10/projects${q()}`, { name, framework: null });
  if (made.status === 401 || made.status === 403 || made.status === 429 || made.status === 402) throw explain(made.status, made.json);
  const projectOk = made.ok || made.status === 409;
  log("uploading the site");
  const dep = await call("POST", `/v13/deployments${q("skipAutoDetectionConfirmation=1")}`, {
    name,
    ...projectOk ? { project: name } : {},
    files: siteFiles(html),
    target: "production",
    projectSettings: { framework: null, buildCommand: null, outputDirectory: null, installCommand: null }
  });
  if (!dep.ok) throw explain(dep.status, dep.json);
  const id = dep.json?.id;
  let state = dep.json?.readyState || "QUEUED";
  let aliases = dep.json?.alias || [];
  for (let i = 0; i < 40 && state !== "READY"; i++) {
    if (state === "ERROR" || state === "CANCELED" || state === "BLOCKED") throw new PublishError(`The deployment ended as ${state}. Check the project in the Vercel dashboard.`, "deploy_failed");
    await wait(1e3);
    const poll = await call("GET", `/v13/deployments/${encodeURIComponent(id)}${q()}`);
    if (poll.ok) {
      state = poll.json?.readyState || state;
      aliases = poll.json?.alias || aliases;
    }
  }
  if (state !== "READY") throw new PublishError("The site was uploaded but is not ready yet. Give it a minute and open the address below.", "not_ready");
  const host = aliases.find((a) => a === `${name}.vercel.app`) || aliases.find((a) => a.startsWith(`${name}`) && a.endsWith(".vercel.app")) || `${name}.vercel.app`;
  const url = `https://${host}`;
  const publicAccess = opts.verify === false || process.env.VERCEL_API_URL ? null : await checkPublic(url, fetchImpl, wait);
  return {
    url,
    name,
    deploymentId: id,
    public: publicAccess,
    note: publicAccess === false ? AUTH_NOTE : void 0
  };
}
async function checkPublic(url, fetchImpl = fetch, wait = sleep) {
  let result = null;
  for (let i = 0; i < 4 && result === null; i++) {
    try {
      const probe = await fetchImpl(url, { method: "GET", redirect: "manual" });
      if (probe.status === 200) result = true;
      else if (probe.status === 401 || probe.status === 403) result = false;
    } catch {
    }
    if (result === null && i < 3) await wait(1500);
  }
  return result;
}
var AUTH_NOTE = "The site is deployed but Vercel is asking visitors to log in. Open the project in the Vercel dashboard, then Settings > Deployment Protection, and turn Vercel Authentication off.";

// plugin-src/cli.mjs
var LOGO_RATIO = 2079.95 / 456.05;
var BUILTIN_KEYS2 = STAKEHOLDERS.map((s) => s.key);
var LINKEDIN2 = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s?#]+/i;
var UserError = class extends Error {
};
var fail = (msg) => {
  throw new UserError(msg);
};
function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next === void 0 || next.startsWith("--")) flags[k] = [true];
      else {
        ;
        (flags[k] ||= []).push(next);
        i++;
      }
    } else pos.push(a);
  }
  return { pos, flags };
}
var one = (flags, k) => flags[k] ? flags[k][flags[k].length - 1] : void 0;
var many = (flags, k) => (flags[k] || []).filter((v) => v !== true);
var has = (flags, k) => k in flags;
var slug2 = (s) => String(s || "case").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "case";
var print = (obj) => console.log(JSON.stringify(obj, null, 2));
function readCase(file) {
  if (!file) fail("Which case file? Pass its path, e.g. northwind.case.json");
  if (!fs.existsSync(file)) fail(`No such file: ${file}`);
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`${file} is not valid JSON: ${e.message}`);
  }
  return raw;
}
function writeCase(file, data) {
  const { errors, warnings } = checkCaseFile(data);
  if (errors.length) fail(`Not saved. The change would leave the case file invalid:
- ${errors.join("\n- ")}`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  return warnings;
}
function loadProject(file) {
  const raw = readCase(file);
  try {
    return { raw, project: caseFileToProject(raw) };
  } catch (e) {
    fail(e.message);
  }
}
var inputsOf = (fields) => Object.fromEntries(fields.map((f) => [f.key, f.value]));
function audienceFor(project, key) {
  const list = project.stakeholders.map(resolveStakeholder).filter(Boolean);
  if (key && !list.some((s) => s.key === key)) {
    fail(`No stakeholder "${key}" in this case. Choices: ${list.map((s) => s.key).join(", ") || "(none)"}`);
  }
  return { list, who: pickAudience(list, key) };
}
function inlineImages(deck, baseDir) {
  const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp" };
  return deck.map((s) => ({
    ...s,
    blocks: s.blocks.map((b) => {
      if (b.type !== "image" || !b.src || b.src.startsWith("data:")) return b;
      const p = path.resolve(baseDir, b.src);
      if (!fs.existsSync(p)) fail(`Image not found: ${b.src}`);
      const type = mime[path.extname(p).toLowerCase()];
      if (!type) fail(`Unsupported image type: ${b.src}`);
      return { ...b, src: `data:${type};base64,${fs.readFileSync(p).toString("base64")}` };
    })
  }));
}
function cmdInit(pos, flags) {
  const company = pos[0];
  if (!company) fail('Usage: init "<company name>" [--archetype "Enterprise"] [--out file.case.json]');
  const out = one(flags, "out") || `${slug2(company)}.case.json`;
  if (fs.existsSync(out) && !has(flags, "force")) fail(`${out} already exists. Use --force to overwrite it.`);
  const data = projectToCaseFile(newProject(company));
  delete data.deck;
  delete data.exportedAt;
  for (const f of INPUT_FIELDS) {
    if (f.type === "number" || f.type === "percent") data.inputs[f.key].confirmed = false;
  }
  const arch = one(flags, "archetype");
  if (arch) {
    if (!ARCHETYPES[arch]) fail(`Unknown archetype "${arch}". Choices: ${Object.keys(ARCHETYPES).join(" | ")}`);
    data.inputs.archetype.value = arch;
    data.inputs.archetype.confirmed = true;
    data.stakeholders = [...ARCHETYPES[arch].stakeholders];
  }
  writeCase(out, data);
  print({ created: path.resolve(out), company, stakeholders: data.stakeholders, next: 'Run "info" to see every input, then "set" to fill them in.' });
}
function cmdInfo(pos, flags) {
  const inputs = INPUT_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    group: f.group,
    type: f.type,
    unit: f.unit || void 0,
    default: f.value,
    options: f.options,
    startsAs: f.confirmed ? "confirmed" : "assumption",
    help: f.help
  }));
  const info = {
    inputs,
    archetypes: Object.fromEntries(Object.entries(ARCHETYPES).map(([k, v]) => [k, { stakeholders: v.stakeholders, note: v.note, alternative: v.alternative }])),
    stakeholders: STAKEHOLDERS.map((s) => ({ key: s.key, role: s.role, tag: s.tag, cares: s.cares })),
    textStyles: TEXT_STYLES.map(([k]) => k)
  };
  if (!has(flags, "md")) return print(info);
  const lines = ["| key | label | type | default | starts as |", "|---|---|---|---|---|"];
  for (const i of inputs) lines.push(`| ${i.key} | ${i.label} | ${i.type}${i.unit ? ` (${i.unit})` : ""} | ${i.default} | ${i.startsAs} |`);
  console.log(lines.join("\n"));
}
function parseValue(field, raw) {
  if (field.type === "number" || field.type === "percent") {
    const n = Number(String(raw).replace(/[$,%\s]/g, ""));
    if (!Number.isFinite(n)) fail(`${field.key} needs a number, got "${raw}".`);
    return n;
  }
  if (field.type === "select" && !field.options.includes(raw)) fail(`${field.key} must be one of: ${field.options.join(" | ")}`);
  return String(raw);
}
function cmdSet(pos, flags) {
  const [file, ...pairs] = pos;
  const data = readCase(file);
  const confirmed = new Set(many(flags, "confirmed").flatMap((v) => String(v).split(",")).map((s) => s.trim()).filter(Boolean));
  const assumed = new Set(many(flags, "assumed").flatMap((v) => String(v).split(",")).map((s) => s.trim()).filter(Boolean));
  if (!pairs.length && !confirmed.size && !assumed.size) fail("Usage: set <file> key=value [key=value ...] [--confirmed key,key] [--assumed key,key]");
  data.inputs ||= {};
  const changed = [];
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq < 1) fail(`"${pair}" should look like key=value`);
    const key = pair.slice(0, eq);
    const f = INPUT_FIELDS.find((x) => x.key === key) || (data.inputs[key] && data.inputs[key].label ? { key, type: data.inputs[key].type } : null);
    if (!f) fail(`Unknown input "${key}". Run "info" for the list, or add your own with "custom".`);
    const value = parseValue(f, pair.slice(eq + 1));
    const prev = data.inputs[key] || {};
    data.inputs[key] = { ...prev, value, confirmed: confirmed.has(key) ? true : assumed.has(key) ? false : prev.confirmed ?? INPUT_FIELDS.find((x) => x.key === key)?.confirmed ?? false };
    changed.push({ key, value, confirmed: data.inputs[key].confirmed });
  }
  for (const key of confirmed) {
    if (changed.some((c) => c.key === key)) continue;
    const f = INPUT_FIELDS.find((x) => x.key === key);
    if (!f && !data.inputs[key]) fail(`Unknown input "${key}".`);
    data.inputs[key] = { ...data.inputs[key] || { value: f.value }, confirmed: true };
    changed.push({ key, value: data.inputs[key].value, confirmed: true });
  }
  for (const key of assumed) {
    if (changed.some((c) => c.key === key)) continue;
    const f = INPUT_FIELDS.find((x) => x.key === key);
    if (!f && !data.inputs[key]) fail(`Unknown input "${key}".`);
    data.inputs[key] = { ...data.inputs[key] || { value: f.value }, confirmed: false };
    changed.push({ key, value: data.inputs[key].value, confirmed: false });
  }
  const warnings = writeCase(file, data);
  print({ saved: path.resolve(file), changed, warnings });
}
function cmdCustom(pos, flags) {
  const file = pos[0];
  const data = readCase(file);
  const key = one(flags, "key");
  const label = one(flags, "label");
  const type = one(flags, "type") || "number";
  if (!key || !label || !has(flags, "value")) fail('Usage: custom <file> --key support_tickets --label "Support tickets / month" --value 1200 [--type number|percent|text] [--unit tickets] [--confirmed]');
  if (INPUT_FIELDS.some((f) => f.key === key)) fail(`"${key}" is a built-in input; use "set".`);
  const raw = one(flags, "value");
  data.inputs ||= {};
  data.inputs[key] = { label, type, unit: one(flags, "unit") || "", value: type === "text" ? String(raw) : Number(raw), confirmed: has(flags, "confirmed") };
  const warnings = writeCase(file, data);
  print({ saved: path.resolve(file), added: key, note: "Custom inputs appear in the case and the assumptions list but do not change the value model.", warnings });
}
function currentStakeholders(data) {
  return data.stakeholders ? [...data.stakeholders] : [...BUILTIN_KEYS2];
}
var keyOf = (s) => typeof s === "string" ? s : s.key;
function cmdStakeholder(pos, flags) {
  const [verb, file, arg] = pos;
  const data = readCase(file);
  const list = currentStakeholders(data);
  if (verb === "add") {
    const role = one(flags, "role");
    if (!role) fail('Usage: stakeholder add <file> --role "Head of Data" [--tag ...] [--cares ...] [--objection ...] [--counter ...] [--needs "a|b|c"]');
    const key = one(flags, "key") || `custom_${slug2(role).replace(/-/g, "_")}`;
    if (list.some((s) => keyOf(s) === key)) fail(`A stakeholder "${key}" already exists.`);
    list.push({
      key,
      role,
      tag: one(flags, "tag") || "",
      cares: one(flags, "cares") || "",
      objection: one(flags, "objection") || "-",
      counter: one(flags, "counter") || "-",
      needsToSee: (one(flags, "needs") || "").split("|").map((s) => s.trim()).filter(Boolean)
    });
  } else if (verb === "remove") {
    if (!arg) fail("Usage: stakeholder remove <file> <key>");
    const next = list.filter((s) => keyOf(s) !== arg);
    if (next.length === list.length) fail(`No stakeholder "${arg}". Present: ${list.map(keyOf).join(", ")}`);
    list.length = 0;
    list.push(...next);
    if (data.people) delete data.people[arg];
  } else if (verb === "restore") {
    if (!BUILTIN_KEYS2.includes(arg)) fail(`"${arg}" is not a built-in stakeholder (${BUILTIN_KEYS2.join(", ")}).`);
    if (!list.some((s) => keyOf(s) === arg)) list.push(arg);
  } else fail("Usage: stakeholder <add|remove|restore> <file> ...");
  data.stakeholders = list;
  writeCase(file, data);
  print({ saved: path.resolve(file), stakeholders: list.map(keyOf) });
}
function cmdPerson(pos, flags) {
  const [verb, file] = pos;
  const data = readCase(file);
  const list = currentStakeholders(data).map(keyOf);
  const sk = one(flags, "stakeholder");
  if (!sk || !list.includes(sk)) fail(`--stakeholder must be one of: ${list.join(", ")}`);
  const name = one(flags, "name");
  if (!name) fail("--name is required");
  data.people ||= {};
  data.people[sk] ||= [];
  if (verb === "remove") {
    const before = data.people[sk].length;
    data.people[sk] = data.people[sk].filter((p) => p.name.toLowerCase() !== name.toLowerCase());
    if (data.people[sk].length === before) fail(`No person named "${name}" under ${sk}.`);
  } else if (verb === "add") {
    const sources = many(flags, "source");
    const manual = has(flags, "manual");
    if (!sources.length && !manual) fail("A researched person needs at least one --source URL (the page you found them on). Use --manual for someone you were told about.");
    const linkedin = one(flags, "linkedin");
    if (linkedin && !LINKEDIN2.test(linkedin)) fail("--linkedin must be a linkedin.com/in/ profile URL.");
    const person = {
      name,
      title: one(flags, "title") || "",
      email: one(flags, "email") || "",
      linkedin: linkedin ? linkedin.split(/[?#]/)[0] : "",
      bio: (one(flags, "bio") || "").slice(0, 400),
      sources,
      confidence: one(flags, "confidence") || "low",
      ...manual ? { found: false } : {}
    };
    const i = data.people[sk].findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
    if (i >= 0) data.people[sk][i] = { ...data.people[sk][i], ...person };
    else data.people[sk].push(person);
  } else fail('Usage: person <add|remove> <file> --stakeholder <key> --name "..." ...');
  const warnings = writeCase(file, data);
  print({ saved: path.resolve(file), [sk]: data.people[sk].map((p) => p.name), warnings });
}
function cmdValidate(pos) {
  const raw = readCase(pos[0]);
  const { errors, warnings } = checkCaseFile(raw);
  print({ file: path.resolve(pos[0]), ok: errors.length === 0, errors, warnings });
  if (errors.length) process.exitCode = 1;
}
function calcAll(project) {
  const inputs = inputsOf(project.fields);
  const model = computeModel(inputs);
  const F = model.figures;
  const open = unconfirmed(project.fields);
  const stakeholders = project.stakeholders.map(resolveStakeholder).filter(Boolean);
  const totals = {
    annualValue: F.totalValue.value,
    portalCost: model.inputs.portalCost,
    netYearOne: F.netValue.raw,
    paybackMonths: Number(F.paybackMonths.value.toFixed(1)),
    returnMultiple: Number(F.roiMultiple.value.toFixed(2)),
    fiveYearNet: F.fiveYearValue.raw
  };
  return {
    company: project.name,
    confidence: confidence(project.fields),
    totals,
    formatted: {
      annualValue: fmtMoneyFull(totals.annualValue),
      portalCost: fmtMoney(totals.portalCost),
      netYearOne: fmtMoney(totals.netYearOne),
      payback: totals.paybackMonths > 0 ? `${totals.paybackMonths} months` : "n/a",
      return: `${totals.returnMultiple.toFixed(1)}x`,
      fiveYearNet: fmtMoney(totals.fiveYearNet)
    },
    figures: Object.fromEntries(model.order.map((k) => [k, { value: F[k].value, equation: F[k].equation, flag: F[k].flag }])),
    warnings: model.warnings.map((w) => w.message),
    drivers: allDrivers(model).map((d) => ({ key: d.key, label: d.label, value: Math.round(d.value), formatted: fmtMoney(d.value), working: d.detail })),
    versusSelfHost: { selfHost: F.selfHostCost.value, portal: model.inputs.portalCost, portalIsCheaperBy: Math.max(0, F.versusSelfHost.raw), cheaper: F.versusSelfHost.raw > 0 ? "portal" : "self-host" },
    stillAssumed: open.map((f) => ({ key: f.key, label: f.label, assumedAt: f.value, unit: f.unit || (f.type === "percent" ? "%" : ""), askThem: f.help })),
    stakeholders: stakeholders.map((s) => ({
      key: s.key,
      role: s.role,
      headline: s.headline(model),
      cares: s.cares,
      leadsWith: s.lead,
      people: (project.people[s.key] || []).map((p) => p.name)
    }))
  };
}
function cmdCalc(pos, flags) {
  const { project } = loadProject(pos[0]);
  const result = calcAll(project);
  const only = one(flags, "stakeholder");
  if (only) result.stakeholders = result.stakeholders.filter((s) => s.key === only);
  if (!has(flags, "md")) return print(result);
  const f = result.formatted;
  const lines = [
    `# ${result.company}: business case`,
    "",
    `Case confidence: **${result.confidence}%** of the numeric inputs are confirmed by the customer.`,
    "",
    "| | |",
    "|---|---|",
    `| Annual value | ${f.annualValue} |`,
    `| Portal cost | ${f.portalCost} |`,
    `| Net, year one | ${f.netYearOne} |`,
    `| Payback | ${f.payback} |`,
    `| Return | ${f.return} |`,
    `| Five-year net | ${f.fiveYearNet} |`,
    "",
    "## Where the value comes from",
    ...result.drivers.map((d) => `- **${d.label}**: ${d.formatted} (${d.working})`),
    "",
    `## Against self-hosting`,
    `Self-hosting costs about ${fmtMoney(result.versusSelfHost.selfHost)}/yr in platform engineers; Portal is ${fmtMoney(result.versusSelfHost.portal)}/yr.`,
    "",
    "## Stakeholders",
    ...result.stakeholders.map((s) => `- **${s.role}**: ${s.headline}`),
    "",
    `## Still assumed (${result.stillAssumed.length})`,
    ...result.stillAssumed.map((a) => `- ${a.label}: assumed at ${a.assumedAt}${a.unit ? " " + a.unit : ""}`)
  ];
  console.log(lines.join("\n"));
}
function findBrowser() {
  const c = [];
  if (process.platform === "win32") {
    const pf = [process.env["ProgramFiles"], process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA].filter(Boolean);
    for (const d of pf) {
      c.push(path.join(d, "Google/Chrome/Application/chrome.exe"), path.join(d, "Microsoft/Edge/Application/msedge.exe"));
    }
  } else if (process.platform === "darwin") {
    c.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Chromium.app/Contents/MacOS/Chromium");
  } else {
    for (const n of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"]) {
      const r = spawnSync("which", [n], { encoding: "utf8" });
      if (r.status === 0 && r.stdout.trim()) c.push(r.stdout.trim());
    }
  }
  return c.find((p) => fs.existsSync(p)) || null;
}
function printToPdf(htmlPath, pdfPath) {
  const browser = findBrowser();
  if (!browser) return { ok: false, reason: "No Chrome, Edge or Chromium found. Open the .html file and use Print > Save as PDF." };
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cb-pdf-"));
  const r = spawnSync(
    browser,
    ["--headless=new", "--disable-gpu", "--no-sandbox", `--user-data-dir=${profile}`, "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, "file:///" + htmlPath.replace(/\\/g, "/").replace(/^\//, "")],
    { timeout: 9e4, stdio: "ignore" }
  );
  fs.rmSync(profile, { recursive: true, force: true });
  return fs.existsSync(pdfPath) ? { ok: true } : { ok: false, reason: `The browser did not produce a PDF (exit ${r.status}). Open the .html and print it instead.` };
}
async function cmdBuild(pos, flags) {
  const file = pos[0];
  const { project } = loadProject(file);
  const wanted = one(flags, "format") || "all";
  const formats = wanted === "all" ? ["pptx", "onepager", "website"] : String(wanted).split(",").map((s) => s.trim());
  for (const f of formats) if (!["pptx", "onepager", "website"].includes(f)) fail(`Unknown format "${f}". Use pptx, onepager, website or all.`);
  const { list, who } = audienceFor(project, one(flags, "stakeholder"));
  const outDir = path.resolve(one(flags, "out") || path.dirname(path.resolve(file)));
  fs.mkdirSync(outDir, { recursive: true });
  const inputs = inputsOf(project.fields);
  const company = inputs.companyName || project.name;
  const deck = inlineImages(project.deck, path.dirname(path.resolve(file)));
  const name = slug2(company);
  const written = [];
  if (formats.includes("pptx")) {
    const env = buildEnv(inputs, project.fields, who);
    const pptx = await buildPptx({
      company,
      slides: resolveSlides(deck, env),
      deps: { PptxGenJS, logoPng: async () => ({ data: logo_teal_default, ratio: LOGO_RATIO }), imageSize: async (src) => dataUrlSize(src) }
    });
    const out = path.join(outDir, `${name}-business-case.pptx`);
    fs.writeFileSync(out, await pptx.write({ outputType: "nodebuffer" }));
    written.push({ format: "pptx", file: out, bytes: fs.statSync(out).size, audience: who.role });
  }
  if (formats.includes("onepager")) {
    const facts = prepareOnePager({ inputs, fields: project.fields, who });
    const out = path.join(outDir, `${name}-one-pager.html`);
    fs.writeFileSync(out, buildOnePager({ facts, logoSvg: backstage_logo_default, faviconSvg: favicon_default }));
    written.push({ format: "onepager", file: out, bytes: fs.statSync(out).size, audience: who.role });
    if (has(flags, "pdf")) {
      const pdf = out.replace(/\.html$/, ".pdf");
      const r = printToPdf(out, pdf);
      written.push(r.ok ? { format: "onepager-pdf", file: pdf, bytes: fs.statSync(pdf).size, audience: who.role } : { format: "onepager-pdf", skipped: r.reason });
    }
  }
  if (formats.includes("website")) {
    const out = path.join(outDir, `${name}-business-case.html`);
    fs.writeFileSync(out, websiteHtml({ company, deck, inputs, project, list, who }));
    written.push({ format: "website", file: out, bytes: fs.statSync(out).size, audience: "all stakeholders (switchable)" });
  }
  print({ built: written, note: "The PowerPoint and one-pager are for the selected stakeholder; the website lets the viewer switch." });
}
function websiteHtml({ company, deck, inputs, project, list, who }) {
  const args = prepareWebsite({ company, deck, inputs, fields: project.fields, stakeholders: list, who });
  return buildWebsite({ ...args, logoSvg: backstage_logo_default, faviconSvg: favicon_default, vmSource: valueModel_default });
}
async function cmdPublish(pos, flags) {
  const file = pos[0];
  const { project } = loadProject(file);
  const { list, who } = audienceFor(project, one(flags, "stakeholder"));
  const inputs = inputsOf(project.fields);
  const company = inputs.companyName || project.name;
  const deck = inlineImages(project.deck, path.dirname(path.resolve(file)));
  const name = one(flags, "name") || projectName(company);
  const via = process.env.VERCEL_TOKEN ? "api" : "cli";
  if (!has(flags, "yes")) {
    return print({
      published: false,
      wouldPublish: {
        company,
        project: name,
        address: `https://${name}.vercel.app`,
        via: via === "api" ? "Vercel API (VERCEL_TOKEN)" : "the Vercel CLI (vercel deploy)",
        audience: "all stakeholders (switchable)"
      },
      warning: "This puts the customer's numbers at a public address. Anyone with the link can read them. The address is long and unlisted, and the page asks search engines not to index it.",
      next: "Nothing was published. Ask the user to confirm, then run the same command again with --yes."
    });
  }
  const html = websiteHtml({ company, deck, inputs, project, list, who });
  if (process.env.VERCEL_TOKEN) {
    try {
      const r2 = await publishSite({ html, company, token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID || void 0, name });
      return print({ published: true, via: "api", url: r2.url, project: r2.name, public: r2.public, note: r2.note });
    } catch (e) {
      if (e instanceof PublishError) fail(e.message);
      throw e;
    }
  }
  const probe = spawnSync("vercel", ["--version"], { shell: true, encoding: "utf8" });
  if (probe.status !== 0) {
    fail('Cannot publish: set VERCEL_TOKEN (create one at vercel.com/account/tokens), or install the Vercel CLI (npm i -g vercel) and run "vercel login". The site is not published.');
  }
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cb-site-")), name);
  fs.mkdirSync(dir);
  for (const f of siteFiles(html)) fs.writeFileSync(path.join(dir, f.file), Buffer.from(f.data, "base64"));
  const args = ["deploy", "--prod", "--yes"];
  const scope = one(flags, "scope") || process.env.VERCEL_SCOPE;
  if (typeof scope === "string") args.push("--scope", scope);
  const r = spawnSync("vercel", args, { cwd: dir, shell: true, encoding: "utf8", timeout: 24e4 });
  fs.rmSync(path.dirname(dir), { recursive: true, force: true });
  const out = `${r.stdout || ""}
${r.stderr || ""}`;
  const urls = out.match(/https:\/\/[a-z0-9.-]+\.vercel\.app/g) || [];
  if (r.status !== 0 || !urls.length) {
    const hint = /missing_scope|--scope/.test(out) ? ' Pass --scope <team-slug> (run "vercel teams ls" to see yours).' : "";
    fail(`The Vercel CLI did not publish the site.${hint}
${out.trim().split("\n").slice(-6).join("\n")}`);
  }
  const url = urls.find((u) => u.startsWith(`https://${name}.`)) || urls[urls.length - 1];
  const open = await checkPublic(url);
  print({ published: true, via: "cli", url, project: name, public: open, note: open === false ? AUTH_NOTE : void 0 });
}
function cmdExport(pos, flags) {
  const { project } = loadProject(pos[0]);
  const out = one(flags, "out") || pos[0];
  const data = projectToCaseFile(project);
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
  print({ wrote: path.resolve(out), note: "Import this file in the CaseBuilder app (Projects > Import)." });
}
function help() {
  console.log(`casebuilder ${CASE_VERSION}: build a business case from a case file

  init "<company>" [--archetype A] [--out f]      create a case file
  info [--md]                                      list every input, archetype and stakeholder
  set <f> key=value ... [--confirmed k,k] [--assumed k,k]   change inputs (confirmed = the customer said it)
  custom <f> --key k --label L --value V           add an input of your own
  stakeholder <add|remove|restore> <f> ...         manage who is in the room
  person <add|remove> <f> --stakeholder k ...      record a researched person (with sources)
  validate <f>                                     check the file, in plain words
  calc <f> [--stakeholder k] [--md]                run the value model
  build <f> [--format pptx|onepager|website|all] [--stakeholder k] [--out dir] [--pdf]
  publish <f> [--stakeholder k] [--yes]            put the website on Vercel (needs --yes)
  export <f> [--out f]                             write the full case file for the app`);
}
async function main() {
  const { pos, flags } = parseArgs(process.argv.slice(2));
  const [cmd, ...rest] = pos;
  switch (cmd) {
    case "init":
      return cmdInit(rest, flags);
    case "info":
      return cmdInfo(rest, flags);
    case "set":
      return cmdSet(rest, flags);
    case "custom":
      return cmdCustom(rest, flags);
    case "stakeholder":
      return cmdStakeholder(rest, flags);
    case "person":
      return cmdPerson(rest, flags);
    case "validate":
      return cmdValidate(rest);
    case "calc":
      return cmdCalc(rest, flags);
    case "build":
      return cmdBuild(rest, flags);
    case "publish":
      return cmdPublish(rest, flags);
    case "export":
      return cmdExport(rest, flags);
    case void 0:
    case "help":
    case "--help":
      return help();
    default:
      fail(`Unknown command "${cmd}". Run with no arguments for the list.`);
  }
}
main().catch((err) => {
  if (err instanceof UserError) console.error(err.message);
  else console.error(`Unexpected error: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
