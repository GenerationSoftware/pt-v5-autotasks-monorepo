"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

var ethers = require("ethers");

function _regeneratorRuntime() {
  _regeneratorRuntime = function() {
    return exports;
  };
  var exports = {},
    Op = Object.prototype,
    hasOwn = Op.hasOwnProperty,
    defineProperty =
      Object.defineProperty ||
      function(obj, key, desc) {
        obj[key] = desc.value;
      },
    $Symbol = "function" == typeof Symbol ? Symbol : {},
    iteratorSymbol = $Symbol.iterator || "@@iterator",
    asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator",
    toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  function define(obj, key, value) {
    return (
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }),
      obj[key]
    );
  }
  try {
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return (obj[key] = value);
    };
  }
  function wrap(innerFn, outerFn, self, tryLocsList) {
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator,
      generator = Object.create(protoGenerator.prototype),
      context = new Context(tryLocsList || []);
    return (
      defineProperty(generator, "_invoke", {
        value: makeInvokeMethod(innerFn, self, context)
      }),
      generator
    );
  }
  function tryCatch(fn, obj, arg) {
    try {
      return {
        type: "normal",
        arg: fn.call(obj, arg)
      };
    } catch (err) {
      return {
        type: "throw",
        arg: err
      };
    }
  }
  exports.wrap = wrap;
  var ContinueSentinel = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function() {
    return this;
  });
  var getProto = Object.getPrototypeOf,
    NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  NativeIteratorPrototype &&
    NativeIteratorPrototype !== Op &&
    hasOwn.call(NativeIteratorPrototype, iteratorSymbol) &&
    (IteratorPrototype = NativeIteratorPrototype);
  var Gp = (GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(
    IteratorPrototype
  ));
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }
  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if ("throw" !== record.type) {
        var result = record.arg,
          value = result.value;
        return value && "object" == typeof value && hasOwn.call(value, "__await")
          ? PromiseImpl.resolve(value.__await).then(
              function(value) {
                invoke("next", value, resolve, reject);
              },
              function(err) {
                invoke("throw", err, resolve, reject);
              }
            )
          : PromiseImpl.resolve(value).then(
              function(unwrapped) {
                (result.value = unwrapped), resolve(result);
              },
              function(error) {
                return invoke("throw", error, resolve, reject);
              }
            );
      }
      reject(record.arg);
    }
    var previousPromise;
    defineProperty(this, "_invoke", {
      value: function(method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function(resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }
        return (previousPromise = previousPromise
          ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg)
          : callInvokeWithMethodAndArg());
      }
    });
  }
  function makeInvokeMethod(innerFn, self, context) {
    var state = "suspendedStart";
    return function(method, arg) {
      if ("executing" === state) throw new Error("Generator is already running");
      if ("completed" === state) {
        if ("throw" === method) throw arg;
        return doneResult();
      }
      for (context.method = method, context.arg = arg; ; ) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }
        if ("next" === context.method) context.sent = context._sent = context.arg;
        else if ("throw" === context.method) {
          if ("suspendedStart" === state) throw ((state = "completed"), context.arg);
          context.dispatchException(context.arg);
        } else "return" === context.method && context.abrupt("return", context.arg);
        state = "executing";
        var record = tryCatch(innerFn, self, context);
        if ("normal" === record.type) {
          if (
            ((state = context.done ? "completed" : "suspendedYield"),
            record.arg === ContinueSentinel)
          )
            continue;
          return {
            value: record.arg,
            done: context.done
          };
        }
        "throw" === record.type &&
          ((state = "completed"), (context.method = "throw"), (context.arg = record.arg));
      }
    };
  }
  function maybeInvokeDelegate(delegate, context) {
    var methodName = context.method,
      method = delegate.iterator[methodName];
    if (undefined === method)
      return (
        (context.delegate = null),
        ("throw" === methodName &&
          delegate.iterator.return &&
          ((context.method = "return"),
          (context.arg = undefined),
          maybeInvokeDelegate(delegate, context),
          "throw" === context.method)) ||
          ("return" !== methodName &&
            ((context.method = "throw"),
            (context.arg = new TypeError(
              "The iterator does not provide a '" + methodName + "' method"
            )))),
        ContinueSentinel
      );
    var record = tryCatch(method, delegate.iterator, context.arg);
    if ("throw" === record.type)
      return (
        (context.method = "throw"),
        (context.arg = record.arg),
        (context.delegate = null),
        ContinueSentinel
      );
    var info = record.arg;
    return info
      ? info.done
        ? ((context[delegate.resultName] = info.value),
          (context.next = delegate.nextLoc),
          "return" !== context.method && ((context.method = "next"), (context.arg = undefined)),
          (context.delegate = null),
          ContinueSentinel)
        : info
      : ((context.method = "throw"),
        (context.arg = new TypeError("iterator result is not an object")),
        (context.delegate = null),
        ContinueSentinel);
  }
  function pushTryEntry(locs) {
    var entry = {
      tryLoc: locs[0]
    };
    1 in locs && (entry.catchLoc = locs[1]),
      2 in locs && ((entry.finallyLoc = locs[2]), (entry.afterLoc = locs[3])),
      this.tryEntries.push(entry);
  }
  function resetTryEntry(entry) {
    var record = entry.completion || {};
    (record.type = "normal"), delete record.arg, (entry.completion = record);
  }
  function Context(tryLocsList) {
    (this.tryEntries = [
      {
        tryLoc: "root"
      }
    ]),
      tryLocsList.forEach(pushTryEntry, this),
      this.reset(!0);
  }
  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) return iteratorMethod.call(iterable);
      if ("function" == typeof iterable.next) return iterable;
      if (!isNaN(iterable.length)) {
        var i = -1,
          next = function next() {
            for (; ++i < iterable.length; )
              if (hasOwn.call(iterable, i))
                return (next.value = iterable[i]), (next.done = !1), next;
            return (next.value = undefined), (next.done = !0), next;
          };
        return (next.next = next);
      }
    }
    return {
      next: doneResult
    };
  }
  function doneResult() {
    return {
      value: undefined,
      done: !0
    };
  }
  return (
    (GeneratorFunction.prototype = GeneratorFunctionPrototype),
    defineProperty(Gp, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }),
    defineProperty(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }),
    (GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction")),
    (exports.isGeneratorFunction = function(genFun) {
      var ctor = "function" == typeof genFun && genFun.constructor;
      return (
        !!ctor &&
        (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name))
      );
    }),
    (exports.mark = function(genFun) {
      return (
        Object.setPrototypeOf
          ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype)
          : ((genFun.__proto__ = GeneratorFunctionPrototype),
            define(genFun, toStringTagSymbol, "GeneratorFunction")),
        (genFun.prototype = Object.create(Gp)),
        genFun
      );
    }),
    (exports.awrap = function(arg) {
      return {
        __await: arg
      };
    }),
    defineIteratorMethods(AsyncIterator.prototype),
    define(AsyncIterator.prototype, asyncIteratorSymbol, function() {
      return this;
    }),
    (exports.AsyncIterator = AsyncIterator),
    (exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      void 0 === PromiseImpl && (PromiseImpl = Promise);
      var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
      return exports.isGeneratorFunction(outerFn)
        ? iter
        : iter.next().then(function(result) {
            return result.done ? result.value : iter.next();
          });
    }),
    defineIteratorMethods(Gp),
    define(Gp, toStringTagSymbol, "Generator"),
    define(Gp, iteratorSymbol, function() {
      return this;
    }),
    define(Gp, "toString", function() {
      return "[object Generator]";
    }),
    (exports.keys = function(val) {
      var object = Object(val),
        keys = [];
      for (var key in object) keys.push(key);
      return (
        keys.reverse(),
        function next() {
          for (; keys.length; ) {
            var key = keys.pop();
            if (key in object) return (next.value = key), (next.done = !1), next;
          }
          return (next.done = !0), next;
        }
      );
    }),
    (exports.values = values),
    (Context.prototype = {
      constructor: Context,
      reset: function(skipTempReset) {
        if (
          ((this.prev = 0),
          (this.next = 0),
          (this.sent = this._sent = undefined),
          (this.done = !1),
          (this.delegate = null),
          (this.method = "next"),
          (this.arg = undefined),
          this.tryEntries.forEach(resetTryEntry),
          !skipTempReset)
        )
          for (var name in this)
            "t" === name.charAt(0) &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1)) &&
              (this[name] = undefined);
      },
      stop: function() {
        this.done = !0;
        var rootRecord = this.tryEntries[0].completion;
        if ("throw" === rootRecord.type) throw rootRecord.arg;
        return this.rval;
      },
      dispatchException: function(exception) {
        if (this.done) throw exception;
        var context = this;
        function handle(loc, caught) {
          return (
            (record.type = "throw"),
            (record.arg = exception),
            (context.next = loc),
            caught && ((context.method = "next"), (context.arg = undefined)),
            !!caught
          );
        }
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i],
            record = entry.completion;
          if ("root" === entry.tryLoc) return handle("end");
          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc"),
              hasFinally = hasOwn.call(entry, "finallyLoc");
            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
              if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
            } else {
              if (!hasFinally) throw new Error("try statement without catch or finally");
              if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
            }
          }
        }
      },
      abrupt: function(type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (
            entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc
          ) {
            var finallyEntry = entry;
            break;
          }
        }
        finallyEntry &&
          ("break" === type || "continue" === type) &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc &&
          (finallyEntry = null);
        var record = finallyEntry ? finallyEntry.completion : {};
        return (
          (record.type = type),
          (record.arg = arg),
          finallyEntry
            ? ((this.method = "next"), (this.next = finallyEntry.finallyLoc), ContinueSentinel)
            : this.complete(record)
        );
      },
      complete: function(record, afterLoc) {
        if ("throw" === record.type) throw record.arg;
        return (
          "break" === record.type || "continue" === record.type
            ? (this.next = record.arg)
            : "return" === record.type
            ? ((this.rval = this.arg = record.arg), (this.method = "return"), (this.next = "end"))
            : "normal" === record.type && afterLoc && (this.next = afterLoc),
          ContinueSentinel
        );
      },
      finish: function(finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.finallyLoc === finallyLoc)
            return (
              this.complete(entry.completion, entry.afterLoc),
              resetTryEntry(entry),
              ContinueSentinel
            );
        }
      },
      catch: function(tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;
            if ("throw" === record.type) {
              var thrown = record.arg;
              resetTryEntry(entry);
            }
            return thrown;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function(iterable, resultName, nextLoc) {
        return (
          (this.delegate = {
            iterator: values(iterable),
            resultName: resultName,
            nextLoc: nextLoc
          }),
          "next" === this.method && (this.arg = undefined),
          ContinueSentinel
        );
      }
    }),
    exports
  );
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function() {
    var self = this,
      args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}

var debug = /*#__PURE__*/ require("debug")("pt-autotask-lib");
function getContracts(name, chainId, providerOrSigner, contractsBlob, version) {
  if (version === void 0) {
    version = {
      major: 1,
      minor: 0,
      patch: 0
    };
  }
  debug("name:", name);
  debug("chainId:", chainId);
  if (!name || !chainId) throw new Error("Invalid Contract Parameters");
  var contracts = contractsBlob.contracts
    .filter(function(cont) {
      return cont.type === name && cont.chainId === chainId;
    })
    .filter(function(contract) {
      return JSON.stringify(contract.version) === JSON.stringify(version);
    });
  var contractsArray = [];
  for (var i = 0; i < contracts.length; i++) {
    var contract = contracts[i];
    if (contract) {
      contractsArray.push(
        new ethers.ethers.Contract(contract.address, contract.abi, providerOrSigner)
      );
    }
  }
  if (contractsArray.length === 0) {
    throw new Error("Multiple Contracts Unavailable: " + name + " on chainId: " + chainId + " ");
  } else {
    return contractsArray;
  }
}

function getContract(name, chainId, providerOrSigner, contractsBlob, version) {
  if (version === void 0) {
    version = {
      major: 1,
      minor: 0,
      patch: 0
    };
  }
  return getContracts(name, chainId, providerOrSigner, contractsBlob, version)[0];
}

function claimerHandleClaimPrize(_x, _x2, _x3) {
  return _claimerHandleClaimPrize.apply(this, arguments);
}
function _claimerHandleClaimPrize() {
  _claimerHandleClaimPrize = _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee3(contracts, config, feeRecipient) {
      var chainId,
        provider,
        claimer,
        vaults,
        transactionsPopulated,
        i,
        vault,
        winners,
        tiers,
        minFees,
        params,
        feeData,
        earnedFees,
        gasEstimate,
        prizesToClaim;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1)
          switch ((_context3.prev = _context3.next)) {
            case 0:
              (chainId = config.chainId), (provider = config.provider);
              claimer = getContract("Claimer", chainId, provider, contracts);
              vaults = getContracts("Vault", chainId, provider, contracts);
              console.log(vaults);
              if (claimer) {
                _context3.next = 6;
                break;
              }
              throw new Error("Claimer: Contract Unavailable");
            case 6:
              if (!(vaults.length === 0)) {
                _context3.next = 8;
                break;
              }
              throw new Error("Claimer: No Vault contracts found");
            case 8:
              transactionsPopulated = [];
              i = 0;
            case 10:
              if (!(i < vaults.length)) {
                _context3.next = 42;
                break;
              }
              vault = vaults[i];
              winners = [];
              tiers = [];
              minFees = "asdf";
              params = {
                vaultAddress: vault.address,
                winners: winners,
                tiers: tiers,
                minFees: minFees,
                feeRecipient: feeRecipient
              };
              _context3.next = 18;
              return getFeeData(provider);
            case 18:
              feeData = _context3.sent;
              console.log("feeData ? ", feeData);
              _context3.next = 22;
              return claimer.callStatic.claimPrize(params);
            case 22:
              earnedFees = _context3.sent;
              console.log("earnedFees ? ", earnedFees);
              _context3.next = 26;
              return getGasEstimate(claimer, params);
            case 26:
              gasEstimate = _context3.sent;
              console.log("gasEstimate ? ", gasEstimate);
              prizesToClaim = 0;
              if (!(prizesToClaim > 0)) {
                _context3.next = 38;
                break;
              }
              console.log("Claimer: Start Claim Prizes");
              _context3.t0 = transactionsPopulated;
              _context3.next = 34;
              return claimer.populateTransaction.claimPrize(
                vault.address,
                winners,
                tiers,
                minFees,
                feeRecipient
              );
            case 34:
              _context3.t1 = _context3.sent;
              _context3.t0.push.call(_context3.t0, _context3.t1);
              _context3.next = 39;
              break;
            case 38:
              console.log("Claimer: No Prizes found to claim for Vault: " + vault.address + ".");
            case 39:
              i++;
              _context3.next = 10;
              break;
            case 42:
              return _context3.abrupt("return", transactionsPopulated);
            case 43:
            case "end":
              return _context3.stop();
          }
      }, _callee3);
    })
  );
  return _claimerHandleClaimPrize.apply(this, arguments);
}
var getGasEstimate = /*#__PURE__*/ (function() {
  var _ref = /*#__PURE__*/ _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee(claimer, params) {
      var gasEstimate;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1)
          switch ((_context.prev = _context.next)) {
            case 0:
              _context.next = 2;
              return claimer.estimateGas.claimPrize(params);
            case 2:
              gasEstimate = _context.sent;
              return _context.abrupt("return", gasEstimate);
            case 4:
            case "end":
              return _context.stop();
          }
      }, _callee);
    })
  );
  return function getGasEstimate(_x4, _x5) {
    return _ref.apply(this, arguments);
  };
})();
var getFeeData = /*#__PURE__*/ (function() {
  var _ref2 = /*#__PURE__*/ _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee2(provider) {
      var feeData;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1)
          switch ((_context2.prev = _context2.next)) {
            case 0:
              _context2.next = 2;
              return provider.getFeeData();
            case 2:
              feeData = _context2.sent;
              return _context2.abrupt(
                "return",
                ethers.ethers.utils.formatUnits(feeData.maxFeePerGas, "gwei")
              );
            case 4:
            case "end":
              return _context2.stop();
          }
      }, _callee2);
    })
  );
  return function getFeeData(_x6) {
    return _ref2.apply(this, arguments);
  };
})();

var debug$1 = /*#__PURE__*/ require("debug")("pt-autotask-lib");
function drawBeaconHandleDrawStartAndComplete(_x, _x2) {
  return _drawBeaconHandleDrawStartAndComplete.apply(this, arguments);
}
function _drawBeaconHandleDrawStartAndComplete() {
  _drawBeaconHandleDrawStartAndComplete = _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee(contracts, config) {
      var chainId,
        provider,
        drawBeacon,
        nextDrawId,
        beaconPeriodEndAt,
        beaconPeriodStartedAt,
        isRngRequested,
        isRngCompleted,
        isBeaconPeriodOver,
        beaconPeriodSeconds,
        canStartDraw,
        canCompleteDraw,
        transactionPopulated;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1)
          switch ((_context.prev = _context.next)) {
            case 0:
              (chainId = config.chainId), (provider = config.provider);
              drawBeacon = getContract("DrawBeacon", chainId, provider, contracts);
              if (drawBeacon) {
                _context.next = 4;
                break;
              }
              throw new Error("DrawBeacon: Contract Unavailable");
            case 4:
              _context.next = 6;
              return drawBeacon.getNextDrawId();
            case 6:
              nextDrawId = _context.sent;
              _context.next = 9;
              return drawBeacon.beaconPeriodEndAt();
            case 9:
              beaconPeriodEndAt = _context.sent;
              _context.next = 12;
              return drawBeacon.getBeaconPeriodStartedAt();
            case 12:
              beaconPeriodStartedAt = _context.sent;
              _context.next = 15;
              return drawBeacon.isRngRequested();
            case 15:
              isRngRequested = _context.sent;
              _context.next = 18;
              return drawBeacon.isRngCompleted();
            case 18:
              isRngCompleted = _context.sent;
              _context.next = 21;
              return drawBeacon.isRngRequested();
            case 21:
              isBeaconPeriodOver = _context.sent;
              _context.next = 24;
              return drawBeacon.getBeaconPeriodSeconds();
            case 24:
              beaconPeriodSeconds = _context.sent;
              _context.next = 27;
              return drawBeacon.canStartDraw();
            case 27:
              canStartDraw = _context.sent;
              _context.next = 30;
              return drawBeacon.canCompleteDraw();
            case 30:
              canCompleteDraw = _context.sent;
              debug$1("DrawBeacon next Draw.drawId:", nextDrawId);
              debug$1("DrawBeacon Beacon PeriodStartedAt:", beaconPeriodStartedAt.toString());
              debug$1("DrawBeacon Beacon PeriodSeconds:", beaconPeriodSeconds.toString());
              debug$1("DrawBeacon Beacon PeriodOver:", isBeaconPeriodOver);
              debug$1("Is RNG Requested:", isRngRequested);
              debug$1("Can Start Draw:", canStartDraw);
              debug$1("Can Complete Draw:", canCompleteDraw);
              if (!canStartDraw) {
                _context.next = 45;
                break;
              }
              console.log("DrawBeacon: Starting Draw");
              _context.next = 42;
              return drawBeacon.populateTransaction.startDraw();
            case 42:
              transactionPopulated = _context.sent;
              _context.next = 46;
              break;
            case 45:
              if (!canCompleteDraw) {
                console.log(
                  "DrawBeacon: Draw " +
                    nextDrawId +
                    " not ready to start.\nBeaconPeriodEndAt: " +
                    beaconPeriodEndAt
                );
              }
            case 46:
              if (!canCompleteDraw) {
                _context.next = 53;
                break;
              }
              console.log("DrawBeacon: Completing Draw");
              _context.next = 50;
              return drawBeacon.populateTransaction.completeDraw();
            case 50:
              transactionPopulated = _context.sent;
              _context.next = 54;
              break;
            case 53:
              if (!canStartDraw) {
                console.log(
                  "DrawBeacon: Draw " +
                    nextDrawId +
                    " not ready to complete.\nIsRngRequested: " +
                    isRngRequested +
                    "\nIsRngCompleted: " +
                    isRngCompleted
                );
              }
            case 54:
              return _context.abrupt("return", transactionPopulated);
            case 55:
            case "end":
              return _context.stop();
          }
      }, _callee);
    })
  );
  return _drawBeaconHandleDrawStartAndComplete.apply(this, arguments);
}

var debug$2 = /*#__PURE__*/ require("debug")("pt-autotask-lib");
var MIN_PROFIT = 1;
var PRIZE_TOKEN_PRICE_USD = 1.02;
function liquidatorHandleArbSwap(_x, _x2, _x3, _x4) {
  return _liquidatorHandleArbSwap.apply(this, arguments);
}
function _liquidatorHandleArbSwap() {
  _liquidatorHandleArbSwap = _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee(
      contracts,
      config,
      swapRecipient,
      hello
    ) {
      var chainId,
        provider,
        liquidationPairs,
        liquidationPair,
        maxAmountOut,
        swapExactAmountInComputed,
        relayerYieldTokenBalance,
        maxAmountOutWrite,
        amountOut,
        amountOutMax,
        amountIn,
        amountInUsd,
        transactionPopulated,
        gasCosts,
        profit,
        profitable;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1)
          switch ((_context.prev = _context.next)) {
            case 0:
              (chainId = config.chainId), (provider = config.provider);
              liquidationPairs = getContracts("LiquidationPair", chainId, provider, contracts);
              if (!(liquidationPairs.length === 0)) {
                _context.next = 4;
                break;
              }
              throw new Error("LiquidationPairs: Contracts Unavailable");
            case 4:
              liquidationPair = liquidationPairs[0];
              _context.next = 7;
              return liquidationPair.callStatic.maxAmountOut();
            case 7:
              maxAmountOut = _context.sent;
              console.log("maxAmountOut ", maxAmountOut);
              console.log(swapRecipient);
              _context.next = 12;
              return liquidationPair.callStatic.swapExactAmountIn(
                swapRecipient,
                ethers.BigNumber.from(10),
                maxAmountOut
              );
            case 12:
              swapExactAmountInComputed = _context.sent;
              console.log("swapExactAmountInComputed ", swapExactAmountInComputed);
              relayerYieldTokenBalance = "MOCK";
              _context.next = 18;
              return liquidationPair.maxAmountOut();
            case 18:
              maxAmountOutWrite = _context.sent;
              console.log(maxAmountOutWrite);
              amountOut =
                relayerYieldTokenBalance < maxAmountOut ? relayerYieldTokenBalance : maxAmountOut;
              amountOutMax = maxAmountOut;
              _context.next = 24;
              return liquidationPair.computeExactAmountIn(amountOut);
            case 24:
              amountIn = _context.sent;
              amountInUsd = amountIn * PRIZE_TOKEN_PRICE_USD;
              debug$2("LiquidationPair computed amount out:", amountOut);
              gasCosts = 0.1;
              profit = amountInUsd - gasCosts;
              profitable = profit > MIN_PROFIT;
              if (!profitable) {
                _context.next = 37;
                break;
              }
              _context.next = 33;
              return liquidationPair.populateTransaction.swapExactAmountIn(
                provider,
                amountIn,
                amountOutMax
              );
            case 33:
              transactionPopulated = _context.sent;
              console.log("LiquidationPair: Swapping");
              _context.next = 38;
              break;
            case 37:
              console.log("LiquidationPair: Could not find a profitable trade.");
            case 38:
              return _context.abrupt("return", transactionPopulated);
            case 39:
            case "end":
              return _context.stop();
          }
      }, _callee);
    })
  );
  return _liquidatorHandleArbSwap.apply(this, arguments);
}

function yieldVaultHandleMintRate(_x, _x2) {
  return _yieldVaultHandleMintRate.apply(this, arguments);
}
function _yieldVaultHandleMintRate() {
  _yieldVaultHandleMintRate = _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee(contracts, config) {
      var chainId, provider, yieldVaults, transactionsPopulated, i, yieldVault;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1)
          switch ((_context.prev = _context.next)) {
            case 0:
              (chainId = config.chainId), (provider = config.provider);
              yieldVaults = getContracts("YieldVault", chainId, provider, contracts);
              transactionsPopulated = [];
              i = 0;
            case 4:
              if (!(i < yieldVaults.length)) {
                _context.next = 17;
                break;
              }
              yieldVault = yieldVaults[i];
              if (yieldVault) {
                _context.next = 8;
                break;
              }
              throw new Error("YieldVault: Contract Unavailable");
            case 8:
              console.log("YieldVault: mintRate()");
              _context.t0 = transactionsPopulated;
              _context.next = 12;
              return yieldVault.populateTransaction.mintRate();
            case 12:
              _context.t1 = _context.sent;
              _context.t0.push.call(_context.t0, _context.t1);
            case 14:
              i++;
              _context.next = 4;
              break;
            case 17:
              return _context.abrupt("return", transactionsPopulated);
            case 18:
            case "end":
              return _context.stop();
          }
      }, _callee);
    })
  );
  return _yieldVaultHandleMintRate.apply(this, arguments);
}

function testnetPrizePoolHandleCompletePrize(_x, _x2) {
  return _testnetPrizePoolHandleCompletePrize.apply(this, arguments);
}
function _testnetPrizePoolHandleCompletePrize() {
  _testnetPrizePoolHandleCompletePrize = _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee(contracts, config) {
      var chainId,
        provider,
        prizePool,
        nextDrawEndsAt,
        canCompleteDraw,
        transactionPopulated,
        randNum;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1)
          switch ((_context.prev = _context.next)) {
            case 0:
              (chainId = config.chainId), (provider = config.provider);
              prizePool = getContract("PrizePool", chainId, provider, contracts);
              if (prizePool) {
                _context.next = 4;
                break;
              }
              throw new Error("TestNet PrizePool: Contract Unavailable");
            case 4:
              _context.next = 6;
              return prizePool.nextDrawEndsAt();
            case 6:
              nextDrawEndsAt = _context.sent;
              canCompleteDraw = Date.now() / 1000 > nextDrawEndsAt;
              console.log("Next draw ends at:", nextDrawEndsAt);
              console.log("Date.now():", Date.now());
              console.log("Can Complete Draw:", canCompleteDraw);
              if (!canCompleteDraw) {
                _context.next = 19;
                break;
              }
              console.log("TestNet PrizePool: Completing Draw");
              randNum = Math.floor(Math.random() * Math.pow(10, 10));
              _context.next = 16;
              return prizePool.populateTransaction.completeAndStartNextDraw(randNum);
            case 16:
              transactionPopulated = _context.sent;
              _context.next = 20;
              break;
            case 19:
              console.log(
                "TestNet PrizePool: Draw not ready to start.\nReady in " +
                  (nextDrawEndsAt - Date.now() / 1000) +
                  " seconds"
              );
            case 20:
              return _context.abrupt("return", transactionPopulated);
            case 21:
            case "end":
              return _context.stop();
          }
      }, _callee);
    })
  );
  return _testnetPrizePoolHandleCompletePrize.apply(this, arguments);
}

var testnetContractsBlob = {
  name: "Hyperstructure Testnet",
  version: { major: 1, minor: 0, patch: 0 },
  timestamp: "2023-03-28T19:45:43.156Z",
  contracts: [
    {
      chainId: 5,
      address: "0xac3731a597764Fb2F94e960b2F045Dfa67Cba71D",
      version: { major: 1, minor: 0, patch: 0 },
      type: "MarketRate",
      abi: [
        {
          inputs: [
            { internalType: "uint8", name: "decimals_", type: "uint8" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_token", type: "address" },
            { internalType: "string", name: "_denominator", type: "string" }
          ],
          name: "getPrice",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "", type: "address" },
            { internalType: "string", name: "", type: "string" }
          ],
          name: "priceFeed",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_token", type: "address" },
            { internalType: "string", name: "_denominator", type: "string" },
            { internalType: "uint256", name: "_price", type: "uint256" }
          ],
          name: "setPrice",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address[]", name: "_tokens", type: "address[]" },
            { internalType: "string", name: "_denominator", type: "string" },
            { internalType: "uint256[]", name: "_prices", type: "uint256[]" }
          ],
          name: "setPriceBatch",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x66766583a0F91d6F1D46dAdE9DC733a5Da180BE9",
      version: { major: 1, minor: 0, patch: 0 },
      type: "TokenFaucet",
      abi: [
        {
          inputs: [{ internalType: "contract IERC20", name: "_token", type: "address" }],
          name: "drip",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xB49F1BBD905A7a869DD50c1DF7D42E7907bcE7b4",
      version: { major: 1, minor: 0, patch: 0 },
      type: "ERC20Mintable",
      abi: [
        {
          inputs: [
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "uint8", name: "decimals_", type: "uint8" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "burn",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "masterTransfer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xA07af90b215b4EDccABC99Dd45cCa6D1127790eC",
      version: { major: 1, minor: 0, patch: 0 },
      type: "ERC20Mintable",
      abi: [
        {
          inputs: [
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "uint8", name: "decimals_", type: "uint8" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "burn",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "masterTransfer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x0ea26B1023aCe3dcBbc2a11343b7a188bC4b5B9c",
      version: { major: 1, minor: 0, patch: 0 },
      type: "ERC20Mintable",
      abi: [
        {
          inputs: [
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "uint8", name: "decimals_", type: "uint8" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "burn",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "masterTransfer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x50f7638aaE955EC17d1173D8AAcA69923923AfC6",
      version: { major: 1, minor: 0, patch: 0 },
      type: "ERC20Mintable",
      abi: [
        {
          inputs: [
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "uint8", name: "decimals_", type: "uint8" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "burn",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "masterTransfer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xE322f82175964b8dFAEbac6C448442A176EEf492",
      version: { major: 1, minor: 0, patch: 0 },
      type: "ERC20Mintable",
      abi: [
        {
          inputs: [
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "uint8", name: "decimals_", type: "uint8" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "burn",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "masterTransfer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xc26EF73D0cdF27D5F184DF3e05ac6e2f490ccEDf",
      version: { major: 1, minor: 0, patch: 0 },
      type: "ERC20Mintable",
      abi: [
        {
          inputs: [
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "uint8", name: "decimals_", type: "uint8" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "burn",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "masterTransfer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x72c7C914b7B9d1aF9EeE7E2b533A3a263210390C",
      version: { major: 1, minor: 0, patch: 0 },
      type: "TwabController",
      abi: [
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "vault", type: "address" },
            { indexed: true, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "uint112", name: "amount", type: "uint112" },
            { indexed: false, internalType: "uint112", name: "delegateAmount", type: "uint112" },
            { indexed: false, internalType: "bool", name: "isNew", type: "bool" },
            {
              components: [
                { internalType: "uint224", name: "amount", type: "uint224" },
                { internalType: "uint32", name: "timestamp", type: "uint32" }
              ],
              indexed: false,
              internalType: "struct ObservationLib.Observation",
              name: "twab",
              type: "tuple"
            }
          ],
          name: "DecreasedBalance",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "vault", type: "address" },
            { indexed: false, internalType: "uint112", name: "amount", type: "uint112" },
            { indexed: false, internalType: "uint112", name: "delegateAmount", type: "uint112" },
            { indexed: false, internalType: "bool", name: "isNew", type: "bool" },
            {
              components: [
                { internalType: "uint224", name: "amount", type: "uint224" },
                { internalType: "uint32", name: "timestamp", type: "uint32" }
              ],
              indexed: false,
              internalType: "struct ObservationLib.Observation",
              name: "twab",
              type: "tuple"
            }
          ],
          name: "DecreasedTotalSupply",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "vault", type: "address" },
            { indexed: true, internalType: "address", name: "delegator", type: "address" },
            { indexed: true, internalType: "address", name: "delegate", type: "address" }
          ],
          name: "Delegated",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "vault", type: "address" },
            { indexed: true, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "uint112", name: "amount", type: "uint112" },
            { indexed: false, internalType: "uint112", name: "delegateAmount", type: "uint112" },
            { indexed: false, internalType: "bool", name: "isNew", type: "bool" },
            {
              components: [
                { internalType: "uint224", name: "amount", type: "uint224" },
                { internalType: "uint32", name: "timestamp", type: "uint32" }
              ],
              indexed: false,
              internalType: "struct ObservationLib.Observation",
              name: "twab",
              type: "tuple"
            }
          ],
          name: "IncreasedBalance",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "vault", type: "address" },
            { indexed: false, internalType: "uint112", name: "amount", type: "uint112" },
            { indexed: false, internalType: "uint112", name: "delegateAmount", type: "uint112" },
            { indexed: false, internalType: "bool", name: "isNew", type: "bool" },
            {
              components: [
                { internalType: "uint224", name: "amount", type: "uint224" },
                { internalType: "uint32", name: "timestamp", type: "uint32" }
              ],
              indexed: false,
              internalType: "struct ObservationLib.Observation",
              name: "twab",
              type: "tuple"
            }
          ],
          name: "IncreasedTotalSupply",
          type: "event"
        },
        {
          inputs: [],
          name: "SPONSORSHIP_ADDRESS",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "vault", type: "address" },
            { internalType: "address", name: "user", type: "address" }
          ],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_to", type: "address" }
          ],
          name: "delegate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "vault", type: "address" },
            { internalType: "address", name: "user", type: "address" }
          ],
          name: "delegateBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" }
          ],
          name: "delegateOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" }
          ],
          name: "getAccount",
          outputs: [
            {
              components: [
                {
                  components: [
                    { internalType: "uint112", name: "balance", type: "uint112" },
                    { internalType: "uint112", name: "delegateBalance", type: "uint112" },
                    { internalType: "uint16", name: "nextTwabIndex", type: "uint16" },
                    { internalType: "uint16", name: "cardinality", type: "uint16" }
                  ],
                  internalType: "struct TwabLib.AccountDetails",
                  name: "details",
                  type: "tuple"
                },
                {
                  components: [
                    { internalType: "uint224", name: "amount", type: "uint224" },
                    { internalType: "uint32", name: "timestamp", type: "uint32" }
                  ],
                  internalType: "struct ObservationLib.Observation[365]",
                  name: "twabs",
                  type: "tuple[365]"
                }
              ],
              internalType: "struct TwabLib.Account",
              name: "",
              type: "tuple"
            }
          ],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" },
            { internalType: "uint32", name: "_startTime", type: "uint32" },
            { internalType: "uint32", name: "_endTime", type: "uint32" }
          ],
          name: "getAverageBalanceBetween",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "uint32", name: "_startTime", type: "uint32" },
            { internalType: "uint32", name: "_endTime", type: "uint32" }
          ],
          name: "getAverageTotalSupplyBetween",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" },
            { internalType: "uint32", name: "_targetTime", type: "uint32" }
          ],
          name: "getBalanceAt",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" }
          ],
          name: "getNewestTwab",
          outputs: [
            { internalType: "uint16", name: "index", type: "uint16" },
            {
              components: [
                { internalType: "uint224", name: "amount", type: "uint224" },
                { internalType: "uint32", name: "timestamp", type: "uint32" }
              ],
              internalType: "struct ObservationLib.Observation",
              name: "twab",
              type: "tuple"
            }
          ],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" }
          ],
          name: "getOldestTwab",
          outputs: [
            { internalType: "uint16", name: "index", type: "uint16" },
            {
              components: [
                { internalType: "uint224", name: "amount", type: "uint224" },
                { internalType: "uint32", name: "timestamp", type: "uint32" }
              ],
              internalType: "struct ObservationLib.Observation",
              name: "twab",
              type: "tuple"
            }
          ],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "uint32", name: "_targetTime", type: "uint32" }
          ],
          name: "getTotalSupplyAt",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_from", type: "address" }],
          name: "sponsor",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "vault", type: "address" }],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "vault", type: "address" }],
          name: "totalSupplyDelegateBalance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_from", type: "address" },
            { internalType: "uint112", name: "_amount", type: "uint112" }
          ],
          name: "twabBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint112", name: "_amount", type: "uint112" }
          ],
          name: "twabMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_from", type: "address" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint112", name: "_amount", type: "uint112" }
          ],
          name: "twabTransfer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x13231cAe073c27F9274c15c883c51E257F5B10a2",
      version: { major: 1, minor: 0, patch: 0 },
      type: "PrizePool",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_prizeToken", type: "address" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "uint32", name: "_grandPrizePeriodDraws", type: "uint32" },
            { internalType: "uint32", name: "_drawPeriodSeconds", type: "uint32" },
            { internalType: "uint64", name: "nextDrawStartsAt_", type: "uint64" },
            { internalType: "uint8", name: "_numberOfTiers", type: "uint8" },
            { internalType: "uint96", name: "_tierShares", type: "uint96" },
            { internalType: "uint96", name: "_canaryShares", type: "uint96" },
            { internalType: "uint96", name: "_reserveShares", type: "uint96" },
            { internalType: "UD2x18", name: "_claimExpansionThreshold", type: "uint64" },
            { internalType: "SD1x18", name: "_alpha", type: "int64" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          inputs: [
            { internalType: "uint256", name: "x", type: "uint256" },
            { internalType: "uint256", name: "y", type: "uint256" }
          ],
          name: "PRBMath_MulDiv18_Overflow",
          type: "error"
        },
        {
          inputs: [
            { internalType: "uint256", name: "x", type: "uint256" },
            { internalType: "uint256", name: "y", type: "uint256" },
            { internalType: "uint256", name: "denominator", type: "uint256" }
          ],
          name: "PRBMath_MulDiv_Overflow",
          type: "error"
        },
        {
          inputs: [{ internalType: "SD59x18", name: "x", type: "int256" }],
          name: "PRBMath_SD59x18_Ceil_Overflow",
          type: "error"
        },
        {
          inputs: [{ internalType: "int256", name: "x", type: "int256" }],
          name: "PRBMath_SD59x18_Convert_Overflow",
          type: "error"
        },
        {
          inputs: [{ internalType: "int256", name: "x", type: "int256" }],
          name: "PRBMath_SD59x18_Convert_Underflow",
          type: "error"
        },
        { inputs: [], name: "PRBMath_SD59x18_Div_InputTooSmall", type: "error" },
        {
          inputs: [
            { internalType: "SD59x18", name: "x", type: "int256" },
            { internalType: "SD59x18", name: "y", type: "int256" }
          ],
          name: "PRBMath_SD59x18_Div_Overflow",
          type: "error"
        },
        {
          inputs: [{ internalType: "SD59x18", name: "x", type: "int256" }],
          name: "PRBMath_SD59x18_Exp2_InputTooBig",
          type: "error"
        },
        {
          inputs: [{ internalType: "SD59x18", name: "x", type: "int256" }],
          name: "PRBMath_SD59x18_Log_InputTooSmall",
          type: "error"
        },
        { inputs: [], name: "PRBMath_SD59x18_Mul_InputTooSmall", type: "error" },
        {
          inputs: [
            { internalType: "SD59x18", name: "x", type: "int256" },
            { internalType: "SD59x18", name: "y", type: "int256" }
          ],
          name: "PRBMath_SD59x18_Mul_Overflow",
          type: "error"
        },
        {
          inputs: [{ internalType: "uint256", name: "x", type: "uint256" }],
          name: "PRBMath_UD60x18_Convert_Overflow",
          type: "error"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "uint32", name: "drawId", type: "uint32" },
            { indexed: true, internalType: "address", name: "vault", type: "address" },
            { indexed: true, internalType: "address", name: "winner", type: "address" },
            { indexed: false, internalType: "uint8", name: "tier", type: "uint8" },
            { indexed: false, internalType: "uint152", name: "payout", type: "uint152" },
            { indexed: false, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint96", name: "fee", type: "uint96" },
            { indexed: false, internalType: "address", name: "feeRecipient", type: "address" }
          ],
          name: "ClaimedPrize",
          type: "event"
        },
        {
          inputs: [],
          name: "_reserve",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "_winningRandomNumber",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "alpha",
          outputs: [{ internalType: "SD1x18", name: "", type: "int64" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "_tier", type: "uint8" }],
          name: "calculatePrizeSize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "_tier", type: "uint8" }],
          name: "calculateTierTwabTimestamps",
          outputs: [
            { internalType: "uint64", name: "startTimestamp", type: "uint64" },
            { internalType: "uint64", name: "endTimestamp", type: "uint64" }
          ],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "canaryClaimCount",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "_numTiers", type: "uint8" }],
          name: "canaryPrizeCount",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "canaryPrizeCount",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "numTiers", type: "uint8" }],
          name: "canaryPrizeCountMultiplier",
          outputs: [{ internalType: "UD60x18", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "canaryShares",
          outputs: [{ internalType: "uint96", name: "", type: "uint96" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimCount",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimExpansionThreshold",
          outputs: [{ internalType: "UD2x18", name: "", type: "uint64" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "winningRandomNumber_", type: "uint256" }],
          name: "completeAndStartNextDraw",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_prizeVault", type: "address" },
            { internalType: "uint256", name: "_amount", type: "uint256" }
          ],
          name: "contributePrizeTokens",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "drawPeriodSeconds",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "numTiers", type: "uint8" }],
          name: "estimatedPrizeCount",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "estimatedPrizeCount",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "uint32", name: "_startDrawIdInclusive", type: "uint32" },
            { internalType: "uint32", name: "_endDrawIdInclusive", type: "uint32" }
          ],
          name: "getContributedBetween",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "getLastCompletedDrawId",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "getNextDrawId",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "_tier", type: "uint8" }],
          name: "getTierAccrualDurationInDraws",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "_tier", type: "uint8" }],
          name: "getTierLiquidity",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint8", name: "_tier", type: "uint8" }],
          name: "getTierPrizeCount",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "pure",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint32", name: "_startDrawIdInclusive", type: "uint32" },
            { internalType: "uint32", name: "_endDrawIdInclusive", type: "uint32" }
          ],
          name: "getTotalContributedBetween",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "getTotalShares",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "uint32", name: "startDrawId", type: "uint32" },
            { internalType: "uint32", name: "endDrawId", type: "uint32" }
          ],
          name: "getVaultPortion",
          outputs: [{ internalType: "SD59x18", name: "", type: "int256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" },
            { internalType: "uint256", name: "_drawDuration", type: "uint256" }
          ],
          name: "getVaultUserBalanceAndTotalSupplyTwab",
          outputs: [
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "uint256", name: "", type: "uint256" }
          ],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "getWinningRandomNumber",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "grandPrizePeriodDraws",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_vault", type: "address" },
            { internalType: "address", name: "_user", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" }
          ],
          name: "isWinner",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "largestTierClaimed",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "lastCompletedDrawId",
          outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "lastCompletedDrawStartedAt",
          outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "nextDrawEndsAt",
          outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "nextDrawStartsAt",
          outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "numberOfTiers",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizeToken",
          outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizeTokenPerShare",
          outputs: [{ internalType: "UD60x18", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "reserve",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "reserveShares",
          outputs: [{ internalType: "uint96", name: "", type: "uint96" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tierShares",
          outputs: [{ internalType: "uint96", name: "", type: "uint96" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalDrawLiquidity",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "contract TwabController", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint256", name: "_amount", type: "uint256" }
          ],
          name: "withdrawReserve",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x9a87Faa8C8BC9Ec3218AF2396e748AF862FA286f",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Claimer",
      abi: [
        {
          inputs: [
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "UD2x18", name: "_priceDeltaScale", type: "uint64" },
            { internalType: "uint256", name: "_targetPrice", type: "uint256" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          inputs: [
            { internalType: "uint256", name: "x", type: "uint256" },
            { internalType: "uint256", name: "y", type: "uint256" },
            { internalType: "uint256", name: "denominator", type: "uint256" }
          ],
          name: "PRBMath_MulDiv_Overflow",
          type: "error"
        },
        {
          inputs: [{ internalType: "int256", name: "x", type: "int256" }],
          name: "PRBMath_SD59x18_Convert_Overflow",
          type: "error"
        },
        {
          inputs: [{ internalType: "int256", name: "x", type: "int256" }],
          name: "PRBMath_SD59x18_Convert_Underflow",
          type: "error"
        },
        { inputs: [], name: "PRBMath_SD59x18_Div_InputTooSmall", type: "error" },
        {
          inputs: [
            { internalType: "SD59x18", name: "x", type: "int256" },
            { internalType: "SD59x18", name: "y", type: "int256" }
          ],
          name: "PRBMath_SD59x18_Div_Overflow",
          type: "error"
        },
        {
          inputs: [
            { internalType: "contract IVault", name: "_vault", type: "address" },
            { internalType: "address[]", name: "_winners", type: "address[]" },
            { internalType: "uint8[]", name: "_tiers", type: "uint8[]" },
            { internalType: "uint256", name: "_minFees", type: "uint256" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrizes",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "decayConstant",
          outputs: [{ internalType: "SD59x18", name: "", type: "int256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_claimCount", type: "uint256" }],
          name: "estimateFees",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "contract PrizePool", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "targetPrice",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x2BDA2CeDd6b2a6c848bCAe4124B08742D9108e46",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPairFactory",
      abi: [
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "contract LiquidationPair",
              name: "liquidator",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract ILiquidationSource",
              name: "source",
              type: "address"
            },
            { indexed: true, internalType: "address", name: "tokenIn", type: "address" },
            { indexed: false, internalType: "address", name: "tokenOut", type: "address" },
            { indexed: false, internalType: "UFixed32x9", name: "swapMultiplier", type: "uint32" },
            {
              indexed: false,
              internalType: "UFixed32x9",
              name: "liquidityFraction",
              type: "uint32"
            },
            { indexed: false, internalType: "uint128", name: "virtualReserveIn", type: "uint128" },
            { indexed: false, internalType: "uint128", name: "virtualReserveOut", type: "uint128" }
          ],
          name: "PairCreated",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          name: "allPairs",
          outputs: [{ internalType: "contract LiquidationPair", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          name: "createPair",
          outputs: [{ internalType: "contract LiquidationPair", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract LiquidationPair", name: "", type: "address" }],
          name: "deployedPairs",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalPairs",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x70Cbb85E6cd78d38d973302bF41814088316103a",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationRouter",
      abi: [
        {
          inputs: [
            {
              internalType: "contract LiquidationPairFactory",
              name: "liquidationPairFactory_",
              type: "address"
            }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "contract LiquidationPairFactory",
              name: "liquidationPairFactory",
              type: "address"
            }
          ],
          name: "LiquidationRouterCreated",
          type: "event"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "_liquidationPair", type: "address" },
            { internalType: "address", name: "_receiver", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "_liquidationPair", type: "address" },
            { internalType: "address", name: "_receiver", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xd9369A1c840dfF3e798965E2795619DC52374627",
      version: { major: 1, minor: 0, patch: 0 },
      type: "YieldVault",
      abi: [
        {
          inputs: [
            { internalType: "contract ERC20Mintable", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "lastYieldTimestamp",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "mintRate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "ratePerSecond",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_ratePerSecond", type: "uint256" }],
          name: "setRatePerSecond",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
          name: "yield",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x7C25dc10826c522a0599ab7f0f4e89d7d479B9DA",
      version: { major: 1, minor: 0, patch: 0 },
      type: "YieldVault",
      abi: [
        {
          inputs: [
            { internalType: "contract ERC20Mintable", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "lastYieldTimestamp",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "mintRate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "ratePerSecond",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_ratePerSecond", type: "uint256" }],
          name: "setRatePerSecond",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
          name: "yield",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xdd051b6df493656A139B087986870e949e89D478",
      version: { major: 1, minor: 0, patch: 0 },
      type: "YieldVault",
      abi: [
        {
          inputs: [
            { internalType: "contract ERC20Mintable", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "lastYieldTimestamp",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "mintRate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "ratePerSecond",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_ratePerSecond", type: "uint256" }],
          name: "setRatePerSecond",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
          name: "yield",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xa089106Fb2f7677962A2339969743F0833881660",
      version: { major: 1, minor: 0, patch: 0 },
      type: "YieldVault",
      abi: [
        {
          inputs: [
            { internalType: "contract ERC20Mintable", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "lastYieldTimestamp",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "mintRate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "ratePerSecond",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_ratePerSecond", type: "uint256" }],
          name: "setRatePerSecond",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
          name: "yield",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x0Eb8B2f4C48352716C7fa70B1B874674D82C22aF",
      version: { major: 1, minor: 0, patch: 0 },
      type: "YieldVault",
      abi: [
        {
          inputs: [
            { internalType: "contract ERC20Mintable", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "lastYieldTimestamp",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "mintRate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "ratePerSecond",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_ratePerSecond", type: "uint256" }],
          name: "setRatePerSecond",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
          name: "yield",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x343bBa9f8680a50D9b7BEED558F45627583C64f5",
      version: { major: 1, minor: 0, patch: 0 },
      type: "YieldVault",
      abi: [
        {
          inputs: [
            { internalType: "contract ERC20Mintable", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "lastYieldTimestamp",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "mintRate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "ratePerSecond",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_ratePerSecond", type: "uint256" }],
          name: "setRatePerSecond",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
          name: "yield",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x149Afc8087144E2DFc186721168E2485533A411b",
      version: { major: 1, minor: 0, patch: 0 },
      type: "YieldVault",
      abi: [
        {
          inputs: [
            { internalType: "contract ERC20Mintable", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
            { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" }
          ],
          name: "RoleAdminChanged",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleGranted",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: true, internalType: "address", name: "sender", type: "address" }
          ],
          name: "RoleRevoked",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [],
          name: "DEFAULT_ADMIN_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "MINTER_ROLE",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
          name: "getRoleAdmin",
          outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "grantRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "hasRole",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "lastYieldTimestamp",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "mintRate",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockBurn",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "account", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "mockMint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "ratePerSecond",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "renounceRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" }
          ],
          name: "revokeRole",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_ratePerSecond", type: "uint256" }],
          name: "setRatePerSecond",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
          name: "supportsInterface",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
          name: "yield",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x84F2aCCe713207B6F3B6bdAd67A122D225279A9a",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Vault",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "contract IERC4626", name: "_yieldVault", type: "address" },
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "contract Claimer", name: "_claimer", type: "address" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "status", type: "bool" }
          ],
          name: "AutoClaimDisabled",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "previousClaimer",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "newClaimer",
              type: "address"
            }
          ],
          name: "ClaimerSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "previousLiquidationPair",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "newLiquidationPair",
              type: "address"
            }
          ],
          name: "LiquidationPairSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "contract IERC20", name: "asset", type: "address" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: false, internalType: "string", name: "symbol", type: "string" },
            {
              indexed: false,
              internalType: "contract TwabController",
              name: "twabController",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract IERC4626",
              name: "yieldVault",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract PrizePool",
              name: "prizePool",
              type: "address"
            },
            { indexed: false, internalType: "contract Claimer", name: "claimer", type: "address" },
            { indexed: false, internalType: "address", name: "owner", type: "address" }
          ],
          name: "NewVault",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "pendingOwner", type: "address" }
          ],
          name: "OwnershipOffered",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
          ],
          name: "OwnershipTransferred",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "caller", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Sponsor",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "autoClaimDisabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "availableBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "claimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bool", name: "_disable", type: "bool" }],
          name: "disableAutoClaim",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" }
          ],
          name: "liquidate",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "pendingOwner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract Claimer", name: "claimer_", type: "address" }],
          name: "setClaimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "liquidationPair_", type: "address" }
          ],
          name: "setLiquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "_assets", type: "uint256" },
            { internalType: "address", name: "_receiver", type: "address" }
          ],
          name: "sponsor",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "targetOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "yieldVault",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      tokens: [
        {
          chainId: 5,
          address: "0x84F2aCCe713207B6F3B6bdAd67A122D225279A9a",
          name: "PoolTogether Dai Stablecoin Low Yield Prize Token",
          decimals: 18,
          symbol: "PTDAILYT",
          extensions: {
            underlyingAsset: {
              address: "0xB49F1BBD905A7a869DD50c1DF7D42E7907bcE7b4",
              symbol: "DAI",
              name: "Dai Stablecoin"
            }
          }
        }
      ]
    },
    {
      chainId: 5,
      address: "0x282A55Ac4ce5bdCA24c9a83a8f86444697a3E23c",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPair",
      abi: [
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" }
          ],
          name: "Swapped",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountOut", type: "uint256" }],
          name: "computeExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountIn", type: "uint256" }],
          name: "computeExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidityFraction",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "maxAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "nextLiquidationState",
          outputs: [
            { internalType: "uint128", name: "", type: "uint128" },
            { internalType: "uint128", name: "", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "source",
          outputs: [{ internalType: "contract ILiquidationSource", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "swapMultiplier",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "target",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenIn",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenOut",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveIn",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveOut",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x61e0A5e77db8e659C8753630046025876414715d",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Vault",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "contract IERC4626", name: "_yieldVault", type: "address" },
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "contract Claimer", name: "_claimer", type: "address" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "status", type: "bool" }
          ],
          name: "AutoClaimDisabled",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "previousClaimer",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "newClaimer",
              type: "address"
            }
          ],
          name: "ClaimerSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "previousLiquidationPair",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "newLiquidationPair",
              type: "address"
            }
          ],
          name: "LiquidationPairSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "contract IERC20", name: "asset", type: "address" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: false, internalType: "string", name: "symbol", type: "string" },
            {
              indexed: false,
              internalType: "contract TwabController",
              name: "twabController",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract IERC4626",
              name: "yieldVault",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract PrizePool",
              name: "prizePool",
              type: "address"
            },
            { indexed: false, internalType: "contract Claimer", name: "claimer", type: "address" },
            { indexed: false, internalType: "address", name: "owner", type: "address" }
          ],
          name: "NewVault",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "pendingOwner", type: "address" }
          ],
          name: "OwnershipOffered",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
          ],
          name: "OwnershipTransferred",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "caller", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Sponsor",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "autoClaimDisabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "availableBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "claimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bool", name: "_disable", type: "bool" }],
          name: "disableAutoClaim",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" }
          ],
          name: "liquidate",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "pendingOwner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract Claimer", name: "claimer_", type: "address" }],
          name: "setClaimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "liquidationPair_", type: "address" }
          ],
          name: "setLiquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "_assets", type: "uint256" },
            { internalType: "address", name: "_receiver", type: "address" }
          ],
          name: "sponsor",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "targetOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "yieldVault",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      tokens: [
        {
          chainId: 5,
          address: "0x61e0A5e77db8e659C8753630046025876414715d",
          name: "PoolTogether Dai Stablecoin High Yield Prize Token",
          decimals: 18,
          symbol: "PTDAIHYT",
          extensions: {
            underlyingAsset: {
              address: "0xB49F1BBD905A7a869DD50c1DF7D42E7907bcE7b4",
              symbol: "DAI",
              name: "Dai Stablecoin"
            }
          }
        }
      ]
    },
    {
      chainId: 5,
      address: "0x136c9ccc76eeBaa55695e31452Eac5D6379034fa",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPair",
      abi: [
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" }
          ],
          name: "Swapped",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountOut", type: "uint256" }],
          name: "computeExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountIn", type: "uint256" }],
          name: "computeExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidityFraction",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "maxAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "nextLiquidationState",
          outputs: [
            { internalType: "uint128", name: "", type: "uint128" },
            { internalType: "uint128", name: "", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "source",
          outputs: [{ internalType: "contract ILiquidationSource", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "swapMultiplier",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "target",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenIn",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenOut",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveIn",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveOut",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xC6db350c20FB957C30C9D9661E33686be38ad3fb",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Vault",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "contract IERC4626", name: "_yieldVault", type: "address" },
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "contract Claimer", name: "_claimer", type: "address" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "status", type: "bool" }
          ],
          name: "AutoClaimDisabled",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "previousClaimer",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "newClaimer",
              type: "address"
            }
          ],
          name: "ClaimerSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "previousLiquidationPair",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "newLiquidationPair",
              type: "address"
            }
          ],
          name: "LiquidationPairSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "contract IERC20", name: "asset", type: "address" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: false, internalType: "string", name: "symbol", type: "string" },
            {
              indexed: false,
              internalType: "contract TwabController",
              name: "twabController",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract IERC4626",
              name: "yieldVault",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract PrizePool",
              name: "prizePool",
              type: "address"
            },
            { indexed: false, internalType: "contract Claimer", name: "claimer", type: "address" },
            { indexed: false, internalType: "address", name: "owner", type: "address" }
          ],
          name: "NewVault",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "pendingOwner", type: "address" }
          ],
          name: "OwnershipOffered",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
          ],
          name: "OwnershipTransferred",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "caller", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Sponsor",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "autoClaimDisabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "availableBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "claimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bool", name: "_disable", type: "bool" }],
          name: "disableAutoClaim",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" }
          ],
          name: "liquidate",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "pendingOwner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract Claimer", name: "claimer_", type: "address" }],
          name: "setClaimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "liquidationPair_", type: "address" }
          ],
          name: "setLiquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "_assets", type: "uint256" },
            { internalType: "address", name: "_receiver", type: "address" }
          ],
          name: "sponsor",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "targetOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "yieldVault",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      tokens: [
        {
          chainId: 5,
          address: "0xC6db350c20FB957C30C9D9661E33686be38ad3fb",
          name: "PoolTogether USD Coin Low Yield Prize Token",
          decimals: 6,
          symbol: "PTUSDCLYT",
          extensions: {
            underlyingAsset: {
              address: "0xA07af90b215b4EDccABC99Dd45cCa6D1127790eC",
              symbol: "USDC",
              name: "USD Coin"
            }
          }
        }
      ]
    },
    {
      chainId: 5,
      address: "0x70adAeb98Da4dE8386fcA3F7A1b58E214758617C",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPair",
      abi: [
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" }
          ],
          name: "Swapped",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountOut", type: "uint256" }],
          name: "computeExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountIn", type: "uint256" }],
          name: "computeExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidityFraction",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "maxAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "nextLiquidationState",
          outputs: [
            { internalType: "uint128", name: "", type: "uint128" },
            { internalType: "uint128", name: "", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "source",
          outputs: [{ internalType: "contract ILiquidationSource", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "swapMultiplier",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "target",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenIn",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenOut",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveIn",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveOut",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x8B6d7FccE0455872631E5fE1B793a1ce154556A0",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Vault",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "contract IERC4626", name: "_yieldVault", type: "address" },
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "contract Claimer", name: "_claimer", type: "address" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "status", type: "bool" }
          ],
          name: "AutoClaimDisabled",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "previousClaimer",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "newClaimer",
              type: "address"
            }
          ],
          name: "ClaimerSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "previousLiquidationPair",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "newLiquidationPair",
              type: "address"
            }
          ],
          name: "LiquidationPairSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "contract IERC20", name: "asset", type: "address" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: false, internalType: "string", name: "symbol", type: "string" },
            {
              indexed: false,
              internalType: "contract TwabController",
              name: "twabController",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract IERC4626",
              name: "yieldVault",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract PrizePool",
              name: "prizePool",
              type: "address"
            },
            { indexed: false, internalType: "contract Claimer", name: "claimer", type: "address" },
            { indexed: false, internalType: "address", name: "owner", type: "address" }
          ],
          name: "NewVault",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "pendingOwner", type: "address" }
          ],
          name: "OwnershipOffered",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
          ],
          name: "OwnershipTransferred",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "caller", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Sponsor",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "autoClaimDisabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "availableBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "claimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bool", name: "_disable", type: "bool" }],
          name: "disableAutoClaim",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" }
          ],
          name: "liquidate",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "pendingOwner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract Claimer", name: "claimer_", type: "address" }],
          name: "setClaimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "liquidationPair_", type: "address" }
          ],
          name: "setLiquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "_assets", type: "uint256" },
            { internalType: "address", name: "_receiver", type: "address" }
          ],
          name: "sponsor",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "targetOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "yieldVault",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      tokens: [
        {
          chainId: 5,
          address: "0x8B6d7FccE0455872631E5fE1B793a1ce154556A0",
          name: "PoolTogether USD Coin High Yield Prize Token",
          decimals: 6,
          symbol: "PTUSDCHYT",
          extensions: {
            underlyingAsset: {
              address: "0xA07af90b215b4EDccABC99Dd45cCa6D1127790eC",
              symbol: "USDC",
              name: "USD Coin"
            }
          }
        }
      ]
    },
    {
      chainId: 5,
      address: "0x6E5DfEA44afb6c07E980e52a72A96d5A18e42160",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPair",
      abi: [
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" }
          ],
          name: "Swapped",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountOut", type: "uint256" }],
          name: "computeExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountIn", type: "uint256" }],
          name: "computeExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidityFraction",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "maxAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "nextLiquidationState",
          outputs: [
            { internalType: "uint128", name: "", type: "uint128" },
            { internalType: "uint128", name: "", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "source",
          outputs: [{ internalType: "contract ILiquidationSource", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "swapMultiplier",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "target",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenIn",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenOut",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveIn",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveOut",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0xAd1D0f9964dBf3596bd93d3f8b630ae813B7A8f6",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Vault",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "contract IERC4626", name: "_yieldVault", type: "address" },
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "contract Claimer", name: "_claimer", type: "address" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "status", type: "bool" }
          ],
          name: "AutoClaimDisabled",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "previousClaimer",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "newClaimer",
              type: "address"
            }
          ],
          name: "ClaimerSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "previousLiquidationPair",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "newLiquidationPair",
              type: "address"
            }
          ],
          name: "LiquidationPairSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "contract IERC20", name: "asset", type: "address" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: false, internalType: "string", name: "symbol", type: "string" },
            {
              indexed: false,
              internalType: "contract TwabController",
              name: "twabController",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract IERC4626",
              name: "yieldVault",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract PrizePool",
              name: "prizePool",
              type: "address"
            },
            { indexed: false, internalType: "contract Claimer", name: "claimer", type: "address" },
            { indexed: false, internalType: "address", name: "owner", type: "address" }
          ],
          name: "NewVault",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "pendingOwner", type: "address" }
          ],
          name: "OwnershipOffered",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
          ],
          name: "OwnershipTransferred",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "caller", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Sponsor",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "autoClaimDisabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "availableBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "claimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bool", name: "_disable", type: "bool" }],
          name: "disableAutoClaim",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" }
          ],
          name: "liquidate",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "pendingOwner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract Claimer", name: "claimer_", type: "address" }],
          name: "setClaimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "liquidationPair_", type: "address" }
          ],
          name: "setLiquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "_assets", type: "uint256" },
            { internalType: "address", name: "_receiver", type: "address" }
          ],
          name: "sponsor",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "targetOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "yieldVault",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      tokens: [
        {
          chainId: 5,
          address: "0xAd1D0f9964dBf3596bd93d3f8b630ae813B7A8f6",
          name: "PoolTogether Gemini dollar Prize Token",
          decimals: 2,
          symbol: "PTGUSDT",
          extensions: {
            underlyingAsset: {
              address: "0x0ea26B1023aCe3dcBbc2a11343b7a188bC4b5B9c",
              symbol: "GUSD",
              name: "Gemini dollar"
            }
          }
        }
      ]
    },
    {
      chainId: 5,
      address: "0xdd8F31e37ceBdb35d290a75bf209CCbF74Ab2e96",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPair",
      abi: [
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" }
          ],
          name: "Swapped",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountOut", type: "uint256" }],
          name: "computeExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountIn", type: "uint256" }],
          name: "computeExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidityFraction",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "maxAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "nextLiquidationState",
          outputs: [
            { internalType: "uint128", name: "", type: "uint128" },
            { internalType: "uint128", name: "", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "source",
          outputs: [{ internalType: "contract ILiquidationSource", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "swapMultiplier",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "target",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenIn",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenOut",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveIn",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveOut",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x46D2DF182FE9d47D4705aB5CE117FE4f871df0e6",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Vault",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "contract IERC4626", name: "_yieldVault", type: "address" },
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "contract Claimer", name: "_claimer", type: "address" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "status", type: "bool" }
          ],
          name: "AutoClaimDisabled",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "previousClaimer",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "newClaimer",
              type: "address"
            }
          ],
          name: "ClaimerSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "previousLiquidationPair",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "newLiquidationPair",
              type: "address"
            }
          ],
          name: "LiquidationPairSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "contract IERC20", name: "asset", type: "address" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: false, internalType: "string", name: "symbol", type: "string" },
            {
              indexed: false,
              internalType: "contract TwabController",
              name: "twabController",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract IERC4626",
              name: "yieldVault",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract PrizePool",
              name: "prizePool",
              type: "address"
            },
            { indexed: false, internalType: "contract Claimer", name: "claimer", type: "address" },
            { indexed: false, internalType: "address", name: "owner", type: "address" }
          ],
          name: "NewVault",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "pendingOwner", type: "address" }
          ],
          name: "OwnershipOffered",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
          ],
          name: "OwnershipTransferred",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "caller", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Sponsor",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "autoClaimDisabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "availableBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "claimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bool", name: "_disable", type: "bool" }],
          name: "disableAutoClaim",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" }
          ],
          name: "liquidate",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "pendingOwner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract Claimer", name: "claimer_", type: "address" }],
          name: "setClaimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "liquidationPair_", type: "address" }
          ],
          name: "setLiquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "_assets", type: "uint256" },
            { internalType: "address", name: "_receiver", type: "address" }
          ],
          name: "sponsor",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "targetOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "yieldVault",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      tokens: [
        {
          chainId: 5,
          address: "0x46D2DF182FE9d47D4705aB5CE117FE4f871df0e6",
          name: "PoolTogether Wrapped BTC Prize Token",
          decimals: 8,
          symbol: "PTWBTCT",
          extensions: {
            underlyingAsset: {
              address: "0x50f7638aaE955EC17d1173D8AAcA69923923AfC6",
              symbol: "WBTC",
              name: "Wrapped BTC"
            }
          }
        }
      ]
    },
    {
      chainId: 5,
      address: "0x4275F231BC714dc219c967c26d12b6262AE1Aff3",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPair",
      abi: [
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" }
          ],
          name: "Swapped",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountOut", type: "uint256" }],
          name: "computeExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountIn", type: "uint256" }],
          name: "computeExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidityFraction",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "maxAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "nextLiquidationState",
          outputs: [
            { internalType: "uint128", name: "", type: "uint128" },
            { internalType: "uint128", name: "", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "source",
          outputs: [{ internalType: "contract ILiquidationSource", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "swapMultiplier",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "target",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenIn",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenOut",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveIn",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveOut",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    },
    {
      chainId: 5,
      address: "0x1d2C74dec8E8D2C9673dcDa26b2890f434E46780",
      version: { major: 1, minor: 0, patch: 0 },
      type: "Vault",
      abi: [
        {
          inputs: [
            { internalType: "contract IERC20", name: "_asset", type: "address" },
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_symbol", type: "string" },
            { internalType: "contract TwabController", name: "_twabController", type: "address" },
            { internalType: "contract IERC4626", name: "_yieldVault", type: "address" },
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "contract Claimer", name: "_claimer", type: "address" },
            { internalType: "address", name: "_owner", type: "address" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: true, internalType: "address", name: "spender", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Approval",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "status", type: "bool" }
          ],
          name: "AutoClaimDisabled",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "previousClaimer",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract Claimer",
              name: "newClaimer",
              type: "address"
            }
          ],
          name: "ClaimerSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Deposit",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "previousLiquidationPair",
              type: "address"
            },
            {
              indexed: false,
              internalType: "contract LiquidationPair",
              name: "newLiquidationPair",
              type: "address"
            }
          ],
          name: "LiquidationPairSet",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "contract IERC20", name: "asset", type: "address" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: false, internalType: "string", name: "symbol", type: "string" },
            {
              indexed: false,
              internalType: "contract TwabController",
              name: "twabController",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract IERC4626",
              name: "yieldVault",
              type: "address"
            },
            {
              indexed: true,
              internalType: "contract PrizePool",
              name: "prizePool",
              type: "address"
            },
            { indexed: false, internalType: "contract Claimer", name: "claimer", type: "address" },
            { indexed: false, internalType: "address", name: "owner", type: "address" }
          ],
          name: "NewVault",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "pendingOwner", type: "address" }
          ],
          name: "OwnershipOffered",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
          ],
          name: "OwnershipTransferred",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "caller", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Sponsor",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
          ],
          name: "Transfer",
          type: "event"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "sender", type: "address" },
            { indexed: true, internalType: "address", name: "receiver", type: "address" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "assets", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "shares", type: "uint256" }
          ],
          name: "Withdraw",
          type: "event"
        },
        {
          inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" }
          ],
          name: "allowance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "approve",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "asset",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "autoClaimDisabled",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "availableBalanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "claimOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_winner", type: "address" },
            { internalType: "uint8", name: "_tier", type: "uint8" },
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint96", name: "_fee", type: "uint96" },
            { internalType: "address", name: "_feeRecipient", type: "address" }
          ],
          name: "claimPrize",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "claimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "convertToAssets",
          outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "convertToShares",
          outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "subtractedValue", type: "uint256" }
          ],
          name: "decreaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "deposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "bool", name: "_disable", type: "bool" }],
          name: "disableAutoClaim",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "addedValue", type: "uint256" }
          ],
          name: "increaseAllowance",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" }
          ],
          name: "liquidate",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "maxMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "maxWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" }
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "name",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "pendingOwner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewDeposit",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewMint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
          name: "previewRedeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
          name: "previewWithdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "shares", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "redeem",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "renounceOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "contract Claimer", name: "claimer_", type: "address" }],
          name: "setClaimer",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "contract LiquidationPair", name: "liquidationPair_", type: "address" }
          ],
          name: "setLiquidationPair",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "_assets", type: "uint256" },
            { internalType: "address", name: "_receiver", type: "address" }
          ],
          name: "sponsor",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "symbol",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_token", type: "address" }],
          name: "targetOf",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalAssets",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "totalSupply",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transferFrom",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
          name: "transferOwnership",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "twabController",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "uint256", name: "assets", type: "uint256" },
            { internalType: "address", name: "receiver", type: "address" },
            { internalType: "address", name: "owner", type: "address" }
          ],
          name: "withdraw",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "yieldVault",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      tokens: [
        {
          chainId: 5,
          address: "0x1d2C74dec8E8D2C9673dcDa26b2890f434E46780",
          name: "PoolTogether Wrapped Ether Prize Token",
          decimals: 18,
          symbol: "PTWETHT",
          extensions: {
            underlyingAsset: {
              address: "0xE322f82175964b8dFAEbac6C448442A176EEf492",
              symbol: "WETH",
              name: "Wrapped Ether"
            }
          }
        }
      ]
    },
    {
      chainId: 5,
      address: "0xf424271D6DD87fE9320304cff84de9f789B74822",
      version: { major: 1, minor: 0, patch: 0 },
      type: "LiquidationPair",
      abi: [
        {
          inputs: [
            { internalType: "contract ILiquidationSource", name: "_source", type: "address" },
            { internalType: "address", name: "_tokenIn", type: "address" },
            { internalType: "address", name: "_tokenOut", type: "address" },
            { internalType: "UFixed32x9", name: "_swapMultiplier", type: "uint32" },
            { internalType: "UFixed32x9", name: "_liquidityFraction", type: "uint32" },
            { internalType: "uint128", name: "_virtualReserveIn", type: "uint128" },
            { internalType: "uint128", name: "_virtualReserveOut", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "constructor"
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "account", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" }
          ],
          name: "Swapped",
          type: "event"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountOut", type: "uint256" }],
          name: "computeExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [{ internalType: "uint256", name: "_amountIn", type: "uint256" }],
          name: "computeExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "liquidityFraction",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "maxAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "nextLiquidationState",
          outputs: [
            { internalType: "uint128", name: "", type: "uint128" },
            { internalType: "uint128", name: "", type: "uint128" }
          ],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "source",
          outputs: [{ internalType: "contract ILiquidationSource", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountIn", type: "uint256" },
            { internalType: "uint256", name: "_amountOutMin", type: "uint256" }
          ],
          name: "swapExactAmountIn",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [
            { internalType: "address", name: "_account", type: "address" },
            { internalType: "uint256", name: "_amountOut", type: "uint256" },
            { internalType: "uint256", name: "_amountInMax", type: "uint256" }
          ],
          name: "swapExactAmountOut",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "swapMultiplier",
          outputs: [{ internalType: "UFixed32x9", name: "", type: "uint32" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "target",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenIn",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "tokenOut",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveIn",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        },
        {
          inputs: [],
          name: "virtualReserveOut",
          outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
          stateMutability: "view",
          type: "function"
        }
      ]
    }
  ]
};

exports.claimerHandleClaimPrize = claimerHandleClaimPrize;
exports.drawBeaconHandleDrawStartAndComplete = drawBeaconHandleDrawStartAndComplete;
exports.getContract = getContract;
exports.getContracts = getContracts;
exports.liquidatorHandleArbSwap = liquidatorHandleArbSwap;
exports.testnetContractsBlob = testnetContractsBlob;
exports.testnetPrizePoolHandleCompletePrize = testnetPrizePoolHandleCompletePrize;
exports.yieldVaultHandleMintRate = yieldVaultHandleMintRate;
//# sourceMappingURL=v5-autotasks-library.cjs.development.js.map
