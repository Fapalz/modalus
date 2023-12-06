/**
 * Modalus  1.0.4
 * GitHub template for starting new projects
 * https://github.com/Fapalz/@fapalz/modal#readme
 *
 * Copyright 2020-2023 Gladikov Kirill - Fapalz <blacesmot@gmail.com>
 *
 * Released under the MIT License
 *
 * Released on: December 6, 2023
 */

import { nextFrame, whenTransitionEnds } from '@fapalz/utils/src/utils/transition';
import { setFocusToFirstNode, retainFocus } from '@fapalz/utils/src/utils/focus-catcher';
import { isDomElement } from '@fapalz/utils/src/utils/index';

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
  fixedSelector: "[data-" + NAMESPACE + "-fixed]",
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
    /* if (this.settings.appendTo !== null && this.settings.appendTo.length) {
      this.appendTo = this.settings.appendTo;
    }
     if(!Modal._overlay) {
      Modal._overlay = $('<div>').addClass(namespacify('overlay') + ' ' + namespacify('is', STATES.CLOSED)).hide();
      this.appendTo.appendChild(Modal._overlay);
    } */
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
      /* if (OPENS.length > 0 && current && current.settings.hashTracking) {
        current.setHash();
      } */
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
    this.isOpened = false;
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
    }
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

      _this2.bodyScrollControl();

      _this2.isOpened = true;

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

      _this3.bodyScrollControl();

      _this3.isOpened = false;

      _this3.settings.afterClose(_this3, OPENS);
    });
  };

  _proto.bodyScrollControl = function bodyScrollControl() {
    var fixedSelectorsElements = document.querySelectorAll(this.settings.fixedSelector);
    var fixedSelectors = Array.from(fixedSelectorsElements);
    var html = document.documentElement;
    var body = document.querySelector('body');

    if (this.isOpened === true) {
      html.classList.remove(NAMESPACE + "-opened");
      body.style.paddingRight = '';
      fixedSelectors.forEach(function (elements) {
        // eslint-disable-next-line no-param-reassign
        elements.style.paddingRight = '';
      });
      window.scrollTo(0, this.scrollPosition);
      html.style.top = '';
      return;
    }

    this.scrollPosition = window.scrollY;
    var paddingSize = window.innerWidth - html.clientWidth;
    html.style.top = -this.scrollPosition + "px";

    if (paddingSize) {
      body.style.paddingRight = paddingSize + "px";
      fixedSelectors.forEach(function (el) {
        // eslint-disable-next-line no-param-reassign
        el.style.paddingRight = parseInt(getComputedStyle(el).paddingRight, 10) + paddingSize + "px";
      });
    }

    html.classList.add(NAMESPACE + "-opened");
  };

  _proto.setHash = function setHash() {
    this.scrollPosition = window.scrollY;
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

export default Modalus;
