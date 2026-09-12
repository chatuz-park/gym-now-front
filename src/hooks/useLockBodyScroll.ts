import { useEffect } from 'react'

let lockCount = 0
let previous = { htmlOverflow: '', bodyOverflow: '', paddingRight: '', htmlOverscroll: '' }

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
  }
}

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    lockScroll()
    return unlockScroll
  }, [locked])
}
