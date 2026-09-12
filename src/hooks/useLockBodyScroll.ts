import { useEffect } from 'react'

let lockCount = 0
let previous = { htmlOverflow: '', bodyOverflow: '', paddingRight: '', htmlOverscroll: '' }

function isInsideScrollable(target: EventTarget | null, deltaY: number) {
  let element = target instanceof Element ? target : null
  while (element && element !== document.body && element !== document.documentElement) {
    const style = getComputedStyle(element)
    const canScrollY = /(auto|scroll)/.test(style.overflowY)
    if (canScrollY && element.scrollHeight > element.clientHeight) {
      const atTop = element.scrollTop <= 0 && deltaY < 0
      const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1 && deltaY > 0
      return !(atTop || atBottom)
    }
    element = element.parentElement
  }
  return false
}

function onWheel(event: WheelEvent) {
  if (!isInsideScrollable(event.target, event.deltaY)) {
    event.preventDefault()
  }
}

function onTouchMove(event: TouchEvent) {
  if (!isInsideScrollable(event.target, 0)) {
    event.preventDefault()
  }
}

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

function onKeyDown(event: KeyboardEvent) {
  if (!SCROLL_KEYS.has(event.key)) return
  const target = event.target instanceof HTMLElement ? event.target : null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
    return
  }
  const deltaY = event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home' ? -1 : 1
  if (!isInsideScrollable(event.target, deltaY)) {
    event.preventDefault()
  }
}

function lockScroll() {
  if (lockCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    previous = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      htmlOverscroll: document.documentElement.style.overscrollBehavior,
    }
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('keydown', onKeyDown)
  }
  lockCount += 1
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.documentElement.style.overflow = previous.htmlOverflow
    document.documentElement.style.overscrollBehavior = previous.htmlOverscroll
    document.body.style.overflow = previous.bodyOverflow
    document.body.style.paddingRight = previous.paddingRight
    document.removeEventListener('wheel', onWheel)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('keydown', onKeyDown)
  }
}

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    lockScroll()
    return unlockScroll
  }, [locked])
}
