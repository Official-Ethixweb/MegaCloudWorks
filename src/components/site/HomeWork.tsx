import { Link } from '@tanstack/react-router'
import { CONCEPTS } from '#/lib/concepts'
import type { Concept } from '#/lib/concepts'
import { CONCEPT_SCREENS } from '#/lib/conceptScreens'
import { PhoneNavProvider } from '#/lib/phoneUI'
import { Counter } from './Counter'

import './home-work.css'

/* ------------------------------------------------------------------ *
 * marks
 * ------------------------------------------------------------------ */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function ArrowOut({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

function BarsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M5 20V11M12 20V4M19 20v-6" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  )
}

function TrendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="m4 16.5 5-5 3.5 3.5L20 8" />
      <path d="M15 8h5v5" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function BoxIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="m12 3.2 8 4.3-8 4.3-8-4.3z" />
      <path d="M4 7.5v9l8 4.3 8-4.3v-9M12 11.8v9" />
    </svg>
  )
}

function UsersIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="9" cy="9.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 7.2a3 3 0 0 1 0 5.6M17.5 19a5.3 5.3 0 0 0-2-4.1" />
    </svg>
  )
}

function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.8l5.9-.8z" />
    </svg>
  )
}

function DeviceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 5.5h2" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="9" cy="9.5" r="2.6" />
      <path d="M4 19a5 5 0 0 1 10 0M16 7.4a2.6 2.6 0 0 1 0 5.2M17.5 19a4.8 4.8 0 0 0-1.8-3.7" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M6.5 21V3.5" />
      <path
        d="M6.5 4.5h11l-2.2 3.6 2.2 3.6h-11z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * the shelf
 * ------------------------------------------------------------------ */

/**
 * The two the studio leads with.
 *
 * Everything factual - name, sector, platform, team, the case-study route
 * - comes off the concept itself; only the three selling points and the
 * one-line summary are written for this shelf.
 */
const SHOWN = [
  {
    slug: 'fieldly',
    tag: 'Field service',
    blurb:
      'A daylight dispatch console that runs a working day - board, quote and proof in one app.',
    team: 'Team of 6',
    points: [
      {
        icon: <BarsIcon />,
        title: 'Live dispatch board',
        body: 'Every job and crew, colour-coded by state.',
      },
      {
        icon: <TargetIcon />,
        title: 'Quote to invoice in one tap',
        body: 'Agreed on site, billed before the van moves.',
      },
      {
        icon: <TrendIcon />,
        title: 'Proof that ends arguments',
        body: 'Before-and-after photos, signed off on the spot.',
      },
    ],
    tone: 'light' as const,
  },
  {
    slug: 'stamp',
    tag: 'E-commerce',
    blurb:
      'A modern e-commerce experience with seamless shopping and smart analytics.',
    team: 'Team of 7',
    points: [
      {
        icon: <BagIcon />,
        title: 'Seamless shopping experience',
        body: 'Fast, intuitive, and built for conversions.',
      },
      {
        icon: <BarsIcon />,
        title: 'Smart inventory',
        body: 'Real-time stock updates and alerts.',
      },
      {
        icon: <TrendIcon />,
        title: 'Advanced analytics',
        body: 'Understand customers and grow faster.',
      },
    ],
    tone: 'light' as const,
  },
] as const

const TALLY = [
  { icon: <BoxIcon />, to: 40, suffix: '+', label: 'Products built' },
  { icon: <UsersIcon />, to: 25, suffix: '+', label: 'Happy clients' },
  { icon: <StarIcon />, to: 9, suffix: '+', label: 'Industries served' },
  {
    icon: <TrendIcon size={22} />,
    to: 98,
    suffix: '%',
    label: 'Client satisfaction',
  },
] as const

const noop = () => {}

/**
 * A device on a card's stage, running one of the product's real screens.
 *
 * Built at the 300px width the screens were designed for and scaled into
 * place, so type and spacing inside stay exactly as drawn rather than
 * re-wrapping at whatever the card happens to be.
 */
function Device({
  concept,
  screen,
  left,
  top,
  scale,
  rotate = 0,
  z = 1,
  variant,
}: {
  concept: Concept
  screen: number
  left: string
  top: string
  scale: number
  /** degrees off upright - the pair are turned towards each other */
  rotate?: number
  z?: number
  variant: 'front' | 'back'
}) {
  const screens = CONCEPT_SCREENS[concept.slug] ?? []
  const Screen = screens[screen]
  if (!Screen) return null

  return (
    <div
      className={`work-device work-device--${variant}`}
      style={{
        left,
        top,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        zIndex: z,
      }}
    >
      <div className="wk-device__frame">
        <div className="wk-device__glass">
          <PhoneNavProvider
            index={screen}
            count={screens.length}
            onGo={noop}
            inert
          >
            <Screen c={concept} />
          </PhoneNavProvider>
        </div>
      </div>
    </div>
  )
}

export function HomeWork() {
  return (
    <section id="work" className="home-work">
      <div className="home-work__peak" aria-hidden="true" />
      <div className="home-work__flag" aria-hidden="true">
        <FlagIcon />
      </div>

      <div className="relative z-[2] mx-auto max-w-[1360px] px-6 py-14 sm:px-10 lg:px-28 lg:py-12">
        {/* ---------- the claim ---------- */}
        <span className="work-tick" aria-hidden="true" />
        <p className="work-eyebrow">Selected work</p>

        <h2 className="mt-5 text-center font-display text-[clamp(2rem,3.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--ink)]">
          Real products.
          <br />
          Real <span className="text-[var(--brand)]">impact.</span>
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-center text-[1.0625rem] leading-[1.6] text-[var(--ink-soft)]">
          We build digital products that solve real problems, drive growth, and
          make a difference.
        </p>

        <div className="mt-7 flex justify-center">
          <Link to="/work" className="work-all">
            View all projects
            <ArrowOut size={17} />
          </Link>
        </div>

        {/* ---------- the two ---------- */}
        <ul className="mt-12 space-y-8">
          {SHOWN.map((project, i) => {
            const concept = CONCEPTS.find((c) => c.slug === project.slug)!

            return (
              <li
                key={project.slug}
                /* the second card puts its screens first, so the two
                   read as a spread rather than a repeat */
                className={`work-card ${i % 2 ? 'work-card--flip' : ''}`}
              >
                <div className="work-card__case">
                  <p className="work-tag">{project.tag}</p>

                  <h3 className="work-name">
                    {concept.name}
                    <span>.</span>
                  </h3>

                  <p className="mt-4 max-w-sm text-[0.9375rem] leading-[1.6] text-[var(--ink-soft)]">
                    {project.blurb}
                  </p>

                  <div className="mt-5">
                    {project.points.map((point) => (
                      <div key={point.title} className="work-point">
                        <span className="work-point__icon">{point.icon}</span>
                        <span>
                          <span className="block text-[0.9375rem] font-bold tracking-[-0.01em] text-[var(--ink)]">
                            {point.title}
                          </span>
                          <span className="block text-[0.875rem] leading-[1.45] text-[var(--ink-soft)]">
                            {point.body}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="work-meta">
                    <span className="work-meta__cell">
                      <DeviceIcon />
                      Web &amp; Mobile
                    </span>
                    <span className="work-meta__cell">
                      <TeamIcon />
                      {project.team}
                    </span>
                    <Link
                      to="/work/$slug"
                      params={{ slug: concept.slug }}
                      className="work-case-link"
                    >
                      View case study
                      <ArrowOut />
                    </Link>
                  </div>
                </div>

                {/* the product itself, two screens deep */}
                <div
                  className={`home-work__stage home-work__stage--${project.tone}`}
                  aria-hidden="true"
                >
                  {/* the light the pair stand in */}
                  <span className="home-work__stage-glow" />

                  {/* Turned towards each other rather than parked side by
                      side: the near one leans out of the card, the far one
                      sits back and away, and the overlap is what gives the
                      pair depth instead of two flat rectangles. */}
                  <Device
                    concept={concept}
                    screen={2}
                    variant="back"
                    left="70%"
                    top="20%"
                    scale={0.4}
                    rotate={13}
                  />
                  <Device
                    concept={concept}
                    screen={1}
                    variant="back"
                    left="40%"
                    top="4%"
                    scale={0.46}
                    rotate={6}
                    z={1}
                  />
                  <Device
                    concept={concept}
                    screen={0}
                    variant="front"
                    left="7%"
                    top="15%"
                    scale={0.56}
                    rotate={-7}
                    z={2}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        {/* ---------- the tally ---------- */}
        <dl className="home-work__tally mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {TALLY.map((item) => (
            <div key={item.label} className="home-work__tally-cell">
              <span className="home-work__tally-icon">{item.icon}</span>
              <div>
                <dt className="text-[1.6rem] font-extrabold leading-none tracking-[-0.03em] text-[var(--ink)]">
                  <Counter to={item.to} suffix={item.suffix} />
                </dt>
                <dd className="mt-1.5 text-[0.875rem] text-[var(--ink-soft)]">
                  {item.label}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default HomeWork
