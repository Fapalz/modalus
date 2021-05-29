/**
 * Modalus  1.0.2
 * GitHub template for starting new projects
 * https://github.com/Fapalz/@fapalz/modal#readme
 *
 * Copyright 2020-2021 Gladikov Kirill - Fapalz <blacesmot@gmail.com>
 *
 * Released under the MIT License
 *
 * Released on: May 29, 2021
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Modalus = factory());
}(this, (function () { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  } // Older browsers don't support event options, feature detect it.
  // Adopted and modified solution from Bohdan Didukh (2017)
  // https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi


  var hasPassiveEvents = false;

  if (typeof window !== 'undefined') {
    var passiveTestOptions = {
      get passive() {
        hasPassiveEvents = true;
        return undefined;
      }

    };
    window.addEventListener('testPassive', null, passiveTestOptions);
    window.removeEventListener('testPassive', null, passiveTestOptions);
  }

  var isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  var locks = [];
  var documentListenerAdded = false;
  var initialClientY = -1;
  var previousBodyOverflowSetting = void 0;
  var previousBodyPaddingRight = void 0; // returns true if `el` should be allowed to receive touchmove events.

  var allowTouchMove = function allowTouchMove(el) {
    return locks.some(function (lock) {
      if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
        return true;
      }

      return false;
    });
  };

  var preventDefault = function preventDefault(rawEvent) {
    var e = rawEvent || window.event; // For the case whereby consumers adds a touchmove event listener to document.
    // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
    // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
    // the touchmove event on document will break.

    if (allowTouchMove(e.target)) {
      return true;
    } // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).


    if (e.touches.length > 1) return true;
    if (e.preventDefault) e.preventDefault();
    return false;
  };

  var setOverflowHidden = function setOverflowHidden(options) {
    // If previousBodyPaddingRight is already set, don't set it again.
    if (previousBodyPaddingRight === undefined) {
      var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;

      var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

      if (_reserveScrollBarGap && scrollBarGap > 0) {
        previousBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.paddingRight = scrollBarGap + 'px';
      }
    } // If previousBodyOverflowSetting is already set, don't set it again.


    if (previousBodyOverflowSetting === undefined) {
      previousBodyOverflowSetting = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  };

  var restoreOverflowSetting = function restoreOverflowSetting() {
    if (previousBodyPaddingRight !== undefined) {
      document.body.style.paddingRight = previousBodyPaddingRight; // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
      // can be set again.

      previousBodyPaddingRight = undefined;
    }

    if (previousBodyOverflowSetting !== undefined) {
      document.body.style.overflow = previousBodyOverflowSetting; // Restore previousBodyOverflowSetting to undefined
      // so setOverflowHidden knows it can be set again.

      previousBodyOverflowSetting = undefined;
    }
  }; // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions


  var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled(targetElement) {
    return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
  };

  var handleScroll = function handleScroll(event, targetElement) {
    var clientY = event.targetTouches[0].clientY - initialClientY;

    if (allowTouchMove(event.target)) {
      return false;
    }

    if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
      // element is at the top of its scroll.
      return preventDefault(event);
    }

    if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
      // element is at the bottom of its scroll.
      return preventDefault(event);
    }

    event.stopPropagation();
    return true;
  };

  var disableBodyScroll = function disableBodyScroll(targetElement, options) {
    // targetElement must be provided
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
      return;
    } // disableBodyScroll must not have been called on this targetElement before


    if (locks.some(function (lock) {
      return lock.targetElement === targetElement;
    })) {
      return;
    }

    var lock = {
      targetElement: targetElement,
      options: options || {}
    };
    locks = [].concat(_toConsumableArray(locks), [lock]);

    if (isIosDevice) {
      targetElement.ontouchstart = function (event) {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          initialClientY = event.targetTouches[0].clientY;
        }
      };

      targetElement.ontouchmove = function (event) {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          handleScroll(event, targetElement);
        }
      };

      if (!documentListenerAdded) {
        document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? {
          passive: false
        } : undefined);
        documentListenerAdded = true;
      }
    } else {
      setOverflowHidden(options);
    }
  };
  var enableBodyScroll = function enableBodyScroll(targetElement) {
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
      return;
    }

    locks = locks.filter(function (lock) {
      return lock.targetElement !== targetElement;
    });

    if (isIosDevice) {
      targetElement.ontouchstart = null;
      targetElement.ontouchmove = null;

      if (documentListenerAdded && locks.length === 0) {
        document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? {
          passive: false
        } : undefined);
        documentListenerAdded = false;
      }
    } else if (!locks.length) {
      restoreOverflowSetting();
    }
  };

  var inBrowser = typeof window !== 'undefined';
  var inWeex = // eslint-disable-next-line no-undef
  typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform; // eslint-disable-next-line no-undef

  var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
  var UA = inBrowser && window.navigator.userAgent.toLowerCase();
  UA && /msie|trident/.test(UA);
  var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
  var isEdge = UA && UA.indexOf('edge/') > 0;
  UA && UA.indexOf('android') > 0 || weexPlatform === 'android';
  UA && /iphone|ipad|ipod|ios/.test(UA) || weexPlatform === 'ios';
  UA && /chrome\/\d+/.test(UA) && !isEdge;
  UA && /phantomjs/.test(UA);
  UA && UA.match(/firefox\/(\d+)/);

  /* eslint-disable import/no-mutable-exports */
  var hasTransition = inBrowser && !isIE9;
  var TRANSITION = 'transition';
  var ANIMATION = 'animation'; // Transition property/event sniffing

  var transitionProp = 'transition';
  var transitionEndEvent = 'transitionend';
  var animationProp = 'animation';
  var animationEndEvent = 'animationend';

  if (hasTransition) {
    /* istanbul ignore if */
    if (window.ontransitionend === undefined && window.onwebkittransitionend !== undefined) {
      transitionProp = 'WebkitTransition';
      transitionEndEvent = 'webkitTransitionEnd';
    }

    if (window.onanimationend === undefined && window.onwebkitanimationend !== undefined) {
      animationProp = 'WebkitAnimation';
      animationEndEvent = 'webkitAnimationEnd';
    }
  } // binding to window is necessary to make hot reload work in IE in strict mode


  var raf = inBrowser ? window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : setTimeout : function (fn) {
    return fn();
  }; // Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
  // in a locale-dependent way, using a comma instead of a dot.
  // If comma is not replaced with a dot, the input will be rounded down (i.e. acting
  // as a floor function) causing unexpected behaviors

  function toMs(s) {
    return Number(s.slice(0, -1).replace(',', '.')) * 1000;
  }

  function getTimeout(delays, durations) {
    while (delays.length < durations.length) {
      // eslint-disable-next-line no-param-reassign
      delays = delays.concat(delays);
    }

    return Math.max.apply(null, durations.map(function (d, i) {
      return toMs(d) + toMs(delays[i]);
    }));
  }

  var transformRE = /\b(transform|all)(,|$)/;
  function getTransitionInfo(el, expectedType) {
    var styles = window.getComputedStyle(el); // JSDOM may return undefined for transition properties

    var transitionDelays = (styles[transitionProp + "Delay"] || '').split(', ');
    var transitionDurations = (styles[transitionProp + "Duration"] || '').split(', ');
    var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
    var animationDelays = (styles[animationProp + "Delay"] || '').split(', ');
    var animationDurations = (styles[animationProp + "Duration"] || '').split(', ');
    var animationTimeout = getTimeout(animationDelays, animationDurations);
    var type;
    var timeout = 0;
    var propCount = 0;
    /* istanbul ignore if */

    if (expectedType === TRANSITION) {
      if (transitionTimeout > 0) {
        type = TRANSITION;
        timeout = transitionTimeout;
        propCount = transitionDurations.length;
      }
    } else if (expectedType === ANIMATION) {
      if (animationTimeout > 0) {
        type = ANIMATION;
        timeout = animationTimeout;
        propCount = animationDurations.length;
      }
    } else {
      timeout = Math.max(transitionTimeout, animationTimeout);
      type = timeout > 0 ? transitionTimeout > animationTimeout ? TRANSITION : ANIMATION : null;
      propCount = type ? type === TRANSITION ? transitionDurations.length : animationDurations.length : 0;
    }

    var hasTransform = type === TRANSITION && transformRE.test(styles[transitionProp + "Property"]);
    return {
      type: type,
      timeout: timeout,
      propCount: propCount,
      hasTransform: hasTransform
    };
  }
  function whenTransitionEnds(el, expectedType, cb) {
    var _getTransitionInfo = getTransitionInfo(el, expectedType),
        type = _getTransitionInfo.type,
        timeout = _getTransitionInfo.timeout,
        propCount = _getTransitionInfo.propCount;

    if (!type) return cb();
    var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
    var ended = 0;

    var end = function end() {
      // eslint-disable-next-line no-use-before-define
      el.removeEventListener(event, onEnd);
      cb();
    };

    var onEnd = function onEnd(e) {
      if (e.target === el) {
        ended += 1;

        if (ended >= propCount) {
          end();
        }
      }
    };

    setTimeout(function () {
      if (ended < propCount) {
        end();
      }
    }, timeout + 1);
    el.addEventListener(event, onEnd);
    return el;
  }
  function nextFrame(fn) {
    raf(function () {
      raf(fn);
    });
  }

  var FOCUSABLE_ELEMENTS = ['a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"]):not([aria-hidden])', 'select:not([disabled]):not([aria-hidden])', 'textarea:not([disabled]):not([aria-hidden])', 'button:not([disabled]):not([aria-hidden])', 'iframe', 'object', 'embed', '[contenteditable]', '[tabindex]:not([tabindex^="-"])'];
  function getFocusableNodes(container) {
    if (!container) return false;
    var nodes = container.querySelectorAll(FOCUSABLE_ELEMENTS);
    return Array.apply(void 0, nodes);
  }
  /**
   * Tries to set focus on a node which is not a close trigger
   * if no other nodes exist then focuses on first close trigger
   */

  function setFocusToFirstNode(container) {
    if (!container) return;
    var focusableNodes = getFocusableNodes(container); // no focusable nodes

    if (focusableNodes.length === 0) return;
    focusableNodes[0].focus();
  }
  function retainFocus(event, container) {
    var focusableNodes = getFocusableNodes(container); // no focusable nodes

    if (focusableNodes.length === 0) return;
    /**
     * Filters nodes which are hidden to prevent
     * focus leak outside modal
     */

    focusableNodes = focusableNodes.filter(function (node) {
      return node.offsetParent !== null;
    }); // if disableFocus is true

    if (!container.contains(document.activeElement)) {
      focusableNodes[0].focus();
      event.preventDefault();
    } else {
      var focusedItemIndex = focusableNodes.indexOf(document.activeElement);

      if (event.shiftKey && focusedItemIndex === 0) {
        focusableNodes[focusableNodes.length - 1].focus();
        event.preventDefault();
      }

      if (!event.shiftKey && focusableNodes.length > 0 && focusedItemIndex === focusableNodes.length - 1) {
        focusableNodes[0].focus();
        event.preventDefault();
      }
    }
  }

  var isDomElement = function isDomElement(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  var PLUGIN_NAME = 'modalus';
  var NAMESPACE = window.MODALUS_GLOBALS && window.MODALUS_GLOBALS.NAMESPACE || PLUGIN_NAME;
  var LOOKUP = [];
  var OPENS = [];
  var DEFAULTS = {
    hashTracking: true,
    closeOnButton: true,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    appendTo: null,
    catchFocus: true,
    closeTrigger: "data-" + NAMESPACE + "-close",
    beforeOpen: function beforeOpen() {},
    afterOpen: function afterOpen() {},
    beforeClose: function beforeClose() {},
    afterClose: function afterClose() {}
  };

  var STATES = {
    CLOSING: 'closing',
    CLOSED: 'closed',
    OPENING: 'opening',
    OPENED: 'opened'
  };
  /**
   * Generates a string separated by dashes and prefixed with NAMESPACE
   * @private
   * @param {...String}
   * @returns {String}
   */

  function namespacify() {
    var result = NAMESPACE;

    for (var i = 0; i < arguments.length; i += 1) {
      // eslint-disable-next-line prefer-rest-params
      result += "-" + arguments[i];
    }

    return result;
  }
  /**
   * Sets a state for an instance
   * @private
   * @param {Modalus} instance
   * @param {STATES} state
   * @param {Boolean} isSilent If true, Remodal does not trigger events
   * @param {String} Reason of a state change.
   */


  function setState(instance, state) {
    var _instance$element$cla;

    var newState = namespacify('is', state);
    var allStates = [namespacify('is', STATES.CLOSING), namespacify('is', STATES.OPENING), namespacify('is', STATES.CLOSED), namespacify('is', STATES.OPENED)];

    (_instance$element$cla = instance.element.classList).remove.apply(_instance$element$cla, allStates);

    instance.element.classList.add(newState); // eslint-disable-next-line no-param-reassign

    instance.state = state;
  }

  var Modalus = /*#__PURE__*/function () {
    function Modalus(element, options) {
      // if (this.settings.appendTo !== null && this.settings.appendTo.length) {
      //   this.appendTo = this.settings.appendTo;
      // }
      // if(!Modal._overlay) {
      //   Modal._overlay = $('<div>').addClass(namespacify('overlay') + ' ' + namespacify('is', STATES.CLOSED)).hide();
      //   this.appendTo.appendChild(Modal._overlay);
      // }
      try {
        this.element = Modalus.getElement(element);
      } catch (err) {
        return;
      }

      this.settings = _extends({}, DEFAULTS, options);
      this.state = STATES.CLOSED;
      this.index = LOOKUP.push(this) - 1;
      this.isInit = false;
      this.init();
    }

    Modalus.getInstance = function getInstance(element) {
      if (!element) return null;
      var index = element.getAttribute("data-" + NAMESPACE + "-index");
      if (!index) return null;
      return LOOKUP[index];
    };

    Modalus.getElement = function getElement(element) {
      var el = typeof element === 'string' ? document.querySelector(element) : element;

      if (!isDomElement(el)) {
        throw new Error('Element shold be is ELEMENT_NODE, check your parameter');
      }

      return el;
    };

    Modalus.init = function init(element, options) {
      if (options === void 0) {
        options = {};
      }

      var el;

      try {
        el = Modalus.getElement(element);
      } catch (err) {
        return null;
      }

      var instance = Modalus.getInstance(el);

      if (!instance) {
        instance = new Modalus(el, options);

        if (instance.settings.hashTracking && instance.hashID === window.location.hash.substr(1)) {
          instance.open();
        }
      }

      return instance;
    }
    /**
     * Handles the hashchange event
     * @private
     * @listens hashchange
     */
    ;

    Modalus.handleHashChangeEvent = function handleHashChangeEvent() {
      var id = window.location.hash.replace('#', '');
      var instance;
      var elem;
      var current = OPENS[OPENS.length - 1];

      if (!id) {
        // if (OPENS.length > 0 && current && current.settings.hashTracking) {
        //   current.setHash();
        // }
        // Check if we have currently opened modal and animation was completed
        if (current && current.settings.hashTracking) {
          current.close();
        }
      } else {
        // Catch syntax error if your hash is bad
        try {
          elem = document.querySelector("[data-" + NAMESPACE + "-id=\"" + id + "\"]");
        } catch (err) {
          console.log(err);
        }

        if (elem) {
          instance = Modalus.getInstance(elem);

          if (instance && instance.settings.hashTracking) {
            instance.open();
          }
        }
      }
    };

    Modalus.handleClickEvent = function handleClickEvent(e) {
      var instance = false;
      var clickedlink = e.target.closest("[data-" + NAMESPACE + "-trigger]");

      if (clickedlink) {
        e.preventDefault();
        var targetSelector = clickedlink.getAttribute('data-modalus-trigger');
        var modal = document.querySelector("[data-" + NAMESPACE + "-id=" + targetSelector + "]");

        if (modal) {
          instance = Modalus.getInstance(modal);
          if (!instance) return;
          instance.open();
        } // eslint-disable-next-line consistent-return


        return instance;
      }
    };

    Modalus.handleKeydownEvent = function handleKeydownEvent(e) {
      if (OPENS.length > 0) {
        var current = OPENS[OPENS.length - 1];

        if (current.settings.closeOnEscape && e.which === 27) {
          e.preventDefault();
          current.close();
          return;
        }

        if (current.settings.catchFocus && e.which === 9) {
          retainFocus(e, current.element);
        }
      }
    };

    var _proto = Modalus.prototype;

    _proto.init = function init() {
      var _this = this;

      if (this.isInit) return;
      this.hashID = this.element.getAttribute("data-" + NAMESPACE + "-id");
      this.scrollPosition = 0;
      this.element.classList.add('is-initialized', namespacify('is', STATES.CLOSED));
      this.element.setAttribute("data-" + NAMESPACE + "-index", this.index);
      ['onClick', 'onMouseDown', 'onMouseUp'].forEach(function (method) {
        _this[method] = _this[method].bind(_this);
      });
      this.overlayChecker = false;
      this.isInit = true;
    };

    _proto.destroy = function destroy() {
      this.close();
      this.element.removeAttribute("data-" + NAMESPACE + "-index");
      this.element.classList.remove('is-initialized');
      var index = LOOKUP.indexOf(this);
      LOOKUP.splice(index, 1);
      this.isInit = false;
    };

    _proto.addListener = function addListener() {
      this.element.addEventListener('click', this.onClick);
      this.element.addEventListener('mousedown', this.onMouseDown);
      this.element.addEventListener('mouseup', this.onMouseUp);
    };

    _proto.removeListener = function removeListener() {
      this.element.removeEventListener('click', this.onClick);
      this.element.removeEventListener('mousedown', this.onMouseDown);
      this.element.removeEventListener('mouseup', this.onMouseUp);
    };

    _proto.onClick = function onClick(e) {
      if (this.settings.closeOnButton && e.target.closest("[" + this.settings.closeTrigger + "]")) {
        this.close(e);
      } // if (e.target.hasAttribute(this.settings.closeTrigger)) {
      //   this.close(e)
      // }

    };

    _proto.onMouseDown = function onMouseDown(e) {
      if (!this.settings.closeOnOutsideClick) return;

      if (this.state !== STATES.OPENING && this.state !== STATES.CLOSING && e.target instanceof Element && e.which === 1 && e.target.hasAttribute('data-modalus-outside')) {
        this.overlayChecker = true;
      }
    };

    _proto.onMouseUp = function onMouseUp(e) {
      if (!this.settings.closeOnOutsideClick) return;

      if (this.state !== STATES.OPENING && this.state !== STATES.CLOSING && e.target instanceof Element && this.overlayChecker && e.target.hasAttribute('data-modalus-outside')) {
        e.preventDefault();
        this.close();
      }

      this.overlayChecker = false;
    };

    _proto.open = function open() {
      var _this2 = this;

      if (this.state === STATES.OPENED || this.state === STATES.OPENING || this.state === STATES.CLOSING) return;
      this.settings.beforeOpen(this, OPENS);
      var current = OPENS[OPENS.length - 1]; // eslint-disable-next-line no-unused-expressions

      current ? current.close() : '';

      if (this.hashID && this.settings.hashTracking) {
        this.setHash();
      }

      setState(this, STATES.OPENING);
      this.element.classList.add('is-enter');
      nextFrame(function () {
        _this2.addListener();

        _this2.element.setAttribute('aria-hidden', 'false');

        setState(_this2, STATES.OPENED);

        _this2.element.classList.add('is-enter-active');

        setFocusToFirstNode(_this2.element);
        OPENS.push(_this2);
        disableBodyScroll(_this2.element, {
          reserveScrollBarGap: true
        });

        _this2.settings.afterOpen(_this2, OPENS);
      });
    };

    _proto.close = function close() {
      var _this3 = this;

      if (this.state === STATES.CLOSED || this.state === STATES.CLOSING || this.state === STATES.OPENING) return;
      this.settings.beforeClose(this, OPENS);

      if (this.settings.hashTracking && this.hashID === window.location.hash.substr(1)) {
        this.deleteHash();
      }

      var index = OPENS.indexOf(this);
      OPENS.splice(index, 1);
      this.removeListener();
      setState(this, STATES.CLOSING);
      this.element.classList.remove('is-enter-active');
      whenTransitionEnds(this.element, '', function () {
        _this3.element.setAttribute('aria-hidden', 'true');

        setState(_this3, STATES.CLOSED);

        _this3.element.classList.remove('is-enter');

        enableBodyScroll(_this3.element);

        _this3.settings.afterClose(_this3, OPENS);
      });
    };

    _proto.setHash = function setHash() {
      this.scrollPosition = window.pageYOffset;
      window.location.hash = this.hashID;
    };

    _proto.deleteHash = function deleteHash() {
      window.location.hash = '';
      window.scrollTo(0, this.scrollPosition);
    };

    return Modalus;
  }();

  document.addEventListener('click', Modalus.handleClickEvent);
  window.addEventListener('keydown', Modalus.handleKeydownEvent);
  window.addEventListener('hashchange', Modalus.handleHashChangeEvent);

  return Modalus;

})));
