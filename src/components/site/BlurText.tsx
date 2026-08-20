import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import './blur-text.css'

/**
 * Text that blurs into focus a word (or letter) at a time.
 *
 * By default it fires when it scrolls into view. Pass `start` to drive it from
 * outside instead - the scroll-choreographed bridge on the About page holds
 * each block until its beat in the sequence arrives.
 *
 * The entry itself is three CSS keyframes on a per-segment delay: the same
 * blur/opacity/rise the animation library used to run, without shipping it.
 */
export function BlurText({
  text = '',
  delay = 200,
  className = '',
  as: Tag = 'p',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px 0px -5% 0px',
  start,
  onAnimationComplete,
  stepDuration = 0.35,
}: {
  text?: string
  delay?: number
  className?: string
  as?: 'p' | 'span' | 'div'
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
  rootMargin?: string
  /** when supplied, the animation runs on this flag instead of on scroll */
  start?: boolean
  onAnimationComplete?: () => void
  stepDuration?: number
}) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const driven = start !== undefined

  // held in a ref so a caller passing a fresh closure every render does not
  // re-arm the observer below
  const done = useRef(onAnimationComplete)
  done.current = onAnimationComplete

  useEffect(() => {
    if (driven) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        observer.unobserve(el)
      },
      { threshold, rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, driven])

  const playing = driven ? start : inView

  // the whole run: the two keyframe steps, plus the wait for the last
  // segment's turn to come round
  const totalDuration = stepDuration * 2

  // reduced motion skips the animation entirely, so `animationend` never
  // fires and a sequence waiting on it would stall - report in on a timer
  // that matches when the run would have finished
  useEffect(() => {
    if (!playing || !done.current) return
    const el = ref.current
    if (!el) return

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const wait = window.setTimeout(
      () => done.current?.(),
      (elements.length - 1) * delay + totalDuration * 1000,
    )
    return () => window.clearTimeout(wait)
  }, [playing, delay, elements.length, totalDuration])

  const Tagged = Tag

  return (
    <Tagged
      ref={ref as never}
      className={`blur-text ${direction === 'bottom' ? 'blur-text--bottom' : ''} ${className}`}
      data-play={playing ? 'true' : 'false'}
      style={{ '--blur-text-duration': `${totalDuration}s` } as CSSProperties}
    >
      {elements.map((segment, index) => (
        <Fragment key={index}>
          <span
            className="blur-text__seg"
            style={{ animationDelay: `${(index * delay) / 1000}s` }}
            onAnimationEnd={
              index === elements.length - 1 ? () => done.current?.() : undefined
            }
          >
            {segment === ' ' ? ' ' : segment}
          </span>
          {/* the gap between words sits outside the span on purpose: the
              segment is an inline-block, and a space at the end of one is
              trailing whitespace the browser drops - which ran the words
              together. Out here it also stays a line-break opportunity. */}
          {animateBy === 'words' && index < elements.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tagged>
  )
}

export default BlurText
