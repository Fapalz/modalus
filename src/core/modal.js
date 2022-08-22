import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import {
  whenTransitionEnds,
  nextFrame,
} from '@fapalz/utils/src/utils/transition'
import {
  setFocusToFirstNode,
  retainFocus,
} from '@fapalz/utils/src/utils/focus-catcher'
import { isDomElement } from '@fapalz/utils/src/utils/index'

import { DEFAULTS, NAMESPACE, LOOKUP, OPENS } from './defaults'

const STATES = {
  CLOSING: 'closing',
  CLOSED: 'closed',
  OPENING: 'opening',
  OPENED: 'opened',
}

/**
 * Generates a string separated by dashes and prefixed with NAMESPACE
 * @private
 * @param {...String}
 * @returns {String}
 */
function namespacify() {
  let result = NAMESPACE

  for (let i = 0; i < arguments.length; i += 1) {
    // eslint-disable-next-line prefer-rest-params
    result += `-${arguments[i]}`
  }

  return result
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
  const newState = namespacify('is', state)
  const allStates = [
    namespacify('is', STATES.CLOSING),
    namespacify('is', STATES.OPENING),
    namespacify('is', STATES.CLOSED),
    namespacify('is', STATES.OPENED),
  ]

  instance.element.classList.remove(...allStates)
  instance.element.classList.add(newState)

  // eslint-disable-next-line no-param-reassign
  instance.state = state
}

class Modalus {
  constructor(element, options) {
    // if (this.settings.appendTo !== null && this.settings.appendTo.length) {
    //   this.appendTo = this.settings.appendTo;
    // }

    // if(!Modal._overlay) {
    //   Modal._overlay = $('<div>').addClass(namespacify('overlay') + ' ' + namespacify('is', STATES.CLOSED)).hide();
    //   this.appendTo.appendChild(Modal._overlay);
    // }

    try {
      this.element = Modalus.getElement(element)
    } catch (err) {
      return
    }

    this.settings = { ...DEFAULTS, ...options }

    this.state = STATES.CLOSED
    this.index = LOOKUP.push(this) - 1
    this.isInit = false
    this.init()
  }

  static getInstance(element) {
    if (!element) return null

    const index = element.getAttribute(`data-${NAMESPACE}-index`)
    if (!index) return null

    return LOOKUP[index]
  }

  static getElement(element) {
    const el =
      typeof element === 'string' ? document.querySelector(element) : element

    if (!isDomElement(el)) {
      throw new Error('Element shold be is ELEMENT_NODE, check your parameter')
    }

    return el
  }

  static init(element, options = {}) {
    let el
    try {
      el = Modalus.getElement(element)
    } catch (err) {
      return null
    }

    let instance = Modalus.getInstance(el)
    if (!instance) {
      instance = new Modalus(el, options)
      if (
        instance.settings.hashTracking &&
        instance.hashID === window.location.hash.substr(1)
      ) {
        instance.open()
      }
    }

    return instance
  }

  /**
   * Handles the hashchange event
   * @private
   * @listens hashchange
   */
  static handleHashChangeEvent() {
    const id = window.location.hash.replace('#', '')
    let instance
    let elem
    const current = OPENS[OPENS.length - 1]

    if (!id) {
      // if (OPENS.length > 0 && current && current.settings.hashTracking) {
      //   current.setHash();
      // }

      // Check if we have currently opened modal and animation was completed
      if (current && current.settings.hashTracking) {
        current.close()
      }
    } else {
      // Catch syntax error if your hash is bad
      try {
        elem = document.querySelector(`[data-${NAMESPACE}-id="${id}"]`)
      } catch (err) {
        console.log(err)
      }

      if (elem) {
        instance = Modalus.getInstance(elem)

        if (instance && instance.settings.hashTracking) {
          instance.open()
        }
      }
    }
  }

  static handleClickEvent(e) {
    let instance = false
    const clickedlink = e.target.closest(`[data-${NAMESPACE}-trigger]`)
    if (clickedlink) {
      e.preventDefault()
      const targetSelector = clickedlink.getAttribute('data-modalus-trigger')
      const modal = document.querySelector(
        `[data-${NAMESPACE}-id=${targetSelector}]`
      )
      if (modal) {
        instance = Modalus.getInstance(modal)
        if (!instance) return
        instance.open()
      }
      // eslint-disable-next-line consistent-return
      return instance
    }
  }

  static handleKeydownEvent(e) {
    if (OPENS.length > 0) {
      const current = OPENS[OPENS.length - 1]

      if (current.settings.closeOnEscape && e.which === 27) {
        e.preventDefault()
        current.close()
        return
      }
      if (current.settings.catchFocus && e.which === 9) {
        retainFocus(e, current.element)
      }
    }
  }

  init() {
    if (this.isInit) return

    this.hashID = this.element.getAttribute(`data-${NAMESPACE}-id`)
    this.scrollPosition = 0
    this.element.classList.add(
      'is-initialized',
      namespacify('is', STATES.CLOSED)
    )
    this.element.setAttribute(`data-${NAMESPACE}-index`, this.index)
    ;['onClick', 'onMouseDown', 'onMouseUp'].forEach((method) => {
      this[method] = this[method].bind(this)
    })

    this.overlayChecker = false
    this.isInit = true
  }

  destroy() {
    this.close()
    this.element.removeAttribute(`data-${NAMESPACE}-index`)
    this.element.classList.remove('is-initialized')
    const index = LOOKUP.indexOf(this)
    LOOKUP.splice(index, 1)

    this.isInit = false
  }

  addListener() {
    this.element.addEventListener('click', this.onClick)
    this.element.addEventListener('mousedown', this.onMouseDown)
    this.element.addEventListener('mouseup', this.onMouseUp)
  }

  removeListener() {
    this.element.removeEventListener('click', this.onClick)
    this.element.removeEventListener('mousedown', this.onMouseDown)
    this.element.removeEventListener('mouseup', this.onMouseUp)
  }

  onClick(e) {
    if (
      this.settings.closeOnButton &&
      e.target.closest(`[${this.settings.closeTrigger}]`)
    ) {
      this.close(e)
    }
  }

  onMouseDown(e) {
    if (!this.settings.closeOnOutsideClick) return

    if (
      this.state !== STATES.OPENING &&
      this.state !== STATES.CLOSING &&
      e.target instanceof Element &&
      e.which === 1 &&
      e.target.hasAttribute('data-modalus-outside')
    ) {
      this.overlayChecker = true
    }
  }

  onMouseUp(e) {
    if (!this.settings.closeOnOutsideClick) return

    if (
      this.state !== STATES.OPENING &&
      this.state !== STATES.CLOSING &&
      e.target instanceof Element &&
      this.overlayChecker &&
      e.target.hasAttribute('data-modalus-outside')
    ) {
      e.preventDefault()

      this.close()
    }
    this.overlayChecker = false
  }

  open() {
    if (
      this.state === STATES.OPENED ||
      this.state === STATES.OPENING ||
      this.state === STATES.CLOSING
    )
      return

    this.settings.beforeOpen(this, OPENS)

    const current = OPENS[OPENS.length - 1]
    // eslint-disable-next-line no-unused-expressions
    current ? current.close() : ''

    if (this.hashID && this.settings.hashTracking) {
      this.setHash()
    }
    setState(this, STATES.OPENING)
    this.element.classList.add('is-enter')
    nextFrame(() => {
      this.addListener()
      this.element.setAttribute('aria-hidden', 'false')
      setState(this, STATES.OPENED)
      this.element.classList.add('is-enter-active')
      setFocusToFirstNode(this.element)
      OPENS.push(this)
      disableBodyScroll(this.element, {
        reserveScrollBarGap: true,
        // eslint-disable-next-line consistent-return
        allowTouchMove: (el) => {
          while (el && el !== document.body) {
            if (el.getAttribute('body-scroll-lock-ignore') !== null) {
              return true
            }
            // eslint-disable-next-line no-param-reassign
            el = el.parentElement
          }
        },
      })
      this.settings.afterOpen(this, OPENS)
    })
  }

  close() {
    if (
      this.state === STATES.CLOSED ||
      this.state === STATES.CLOSING ||
      this.state === STATES.OPENING
    )
      return

    this.settings.beforeClose(this, OPENS)
    if (
      this.settings.hashTracking &&
      this.hashID === window.location.hash.substr(1)
    ) {
      this.deleteHash()
    }

    const index = OPENS.indexOf(this)
    OPENS.splice(index, 1)

    this.removeListener()
    setState(this, STATES.CLOSING)
    this.element.classList.remove('is-enter-active')

    whenTransitionEnds(this.element, '', () => {
      this.element.setAttribute('aria-hidden', 'true')
      setState(this, STATES.CLOSED)
      this.element.classList.remove('is-enter')
      enableBodyScroll(this.element, {
        reserveScrollBarGap: true,
      })
      this.settings.afterClose(this, OPENS)
    })
  }

  setHash() {
    this.scrollPosition = window.pageYOffset
    window.location.hash = this.hashID
  }

  deleteHash() {
    window.location.hash = ''
    window.scrollTo(0, this.scrollPosition)
  }
}

document.addEventListener('click', Modalus.handleClickEvent)

window.addEventListener('keydown', Modalus.handleKeydownEvent)

window.addEventListener('hashchange', Modalus.handleHashChangeEvent)

export default Modalus
