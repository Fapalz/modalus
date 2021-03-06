export const PLUGIN_NAME = 'modalus'

export const NAMESPACE =
  (window.MODALUS_GLOBALS && window.MODALUS_GLOBALS.NAMESPACE) || PLUGIN_NAME

export const LOOKUP = []
export const OPENS = []

export const DEFAULTS = {
  hashTracking: true,
  closeOnButton: true,
  closeOnEscape: true,
  closeOnOutsideClick: true,
  appendTo: null,
  catchFocus: true,
  closeTrigger: `data-${NAMESPACE}-close`,
  beforeOpen: () => {},
  afterOpen: () => {},
  beforeClose: () => {},
  afterClose: () => {},
}
