import type { ReactNode } from 'react'
import {
  ArrowUpRight,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Gift,
  MapPin,
  Navigation,
  Phone,
  Plus,
  QrCode,
  Signature,
  Sparkles,
  UserPlus,
  Zap,
} from 'lucide-react'
import { appOf } from '#/lib/concepts'
import type { Concept, ConceptIconName } from '#/lib/concepts'
import { Tap, useChoice, usePhoneNav, useScreenState } from '#/lib/phoneUI'
import {
  AppCanvas,
  Avatar,
  Card,
  Glyph,
  GhostButton,
  LargeTitle,
  ListGroup,
  NavBar,
  Pill,
  PrimaryButton,
  Row,
  SearchField,
  Segmented,
  Sheet,
  Stat,
  StatusBar,
  TabBar,
  Track,
} from '#/lib/iosKit'

/**
 * The five concepts' app screens.
 *
 * Every screen is assembled from the shared iOS kit - status bar, large title,
 * grouped lists, sheets, and the glass tab bar - so the family resemblance is
 * deliberate and the differences are too. What separates one concept from the
 * next is its *flow*, not its furniture:
 *
 *   Fieldly  · ops console    - dark board, floating bar, list runs under it
 *   Stamp    · wallet-first   - a deck of cards that lifts when picked
 *   Slate    · calendar-first - the week never leaves; confirmation is a sheet
 *   Prophy   · chart-first    - search, cards, and exactly one alarm colour
 *   Leadr    · pipeline board - stages scroll sideways under a fixed header
 *
 * The tab bar is wired to the same router the arrows and the swipe use, so the
 * whole case study can be driven from inside the glass.
 */

type ScreenProps = { c: Concept }

/**
 * The one screen-level action each app lifts out of its tab capsule.
 *
 * Current iOS keeps destinations and actions in separate controls - the tab
 * bar is a capsule of places you can go, and the single most-used *verb* gets
 * its own circle beside it. Which verb that is says a lot about the product,
 * so each concept picks its own.
 */
const TAB_ACTION: Record<string, { icon: ConceptIconName; label: string }> = {
  fieldly: { icon: 'Plus', label: 'Add a job' },
  stamp: { icon: 'QrCode', label: 'Scan at the till' },
  slate: { icon: 'Plus', label: 'New booking' },
  prophy: { icon: 'Search', label: 'Search patients' },
  leadr: { icon: 'Plus', label: 'Add a lead' },
}

/* ------------------------------------------------------------------ *
 * Shared bits that are not chrome
 * ------------------------------------------------------------------ */

/** A horizontally scrolling rail with the scrollbar taken away. */
function Rail({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-[1.05rem] pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollSnapType: 'x proximity' }}
    >
      {children}
    </div>
  )
}

/** The soft plate a map sits on when there is no map. */
function MapPlate({ c, height = 78 }: { c: Concept; height?: number }) {
  return (
    <span
      className="relative block overflow-hidden rounded-xl"
      style={{
        height,
        background: `linear-gradient(150deg, color-mix(in srgb, ${c.accent} 26%, transparent), color-mix(in srgb, ${c.accent2} 12%, transparent))`,
      }}
    >
      {/* roads, abstracted to the two or three lines a glance actually reads */}
      <svg
        viewBox="0 0 120 60"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          d="M-4 44 Q 30 38 52 24 T 124 14"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="2.5"
          className="text-white"
        />
        <path
          d="M18 64 L 34 26 L 60 -4"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.6"
          className="text-white"
        />
        <path
          d="M74 64 L 86 30 L 124 34"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.6"
          className="text-white"
        />
      </svg>
      <span
        className="absolute left-[46%] top-[38%] flex size-4 items-center justify-center rounded-full shadow-lg"
        /* on the accent, so the app's ink rather than white */
        style={{ background: c.accent, color: 'var(--on-a)' }}
      >
        <Navigation className="size-2" strokeWidth={3} fill="currentColor" />
      </span>
      {/* the pulse that says this is live rather than a screenshot */}
      <span
        className="absolute left-[46%] top-[38%] size-4 rounded-full"
        style={{
          background: c.accent,
          animation: 'phone-ripple 2.4s ease-out infinite',
          opacity: 0.22,
        }}
      />
    </span>
  )
}

/* ============================= FIELDLY ============================= *
 * Ops console. Dark by default, floating tab bar, and a board that stays
 * readable in a van at dusk.
 * =================================================================== */

const FIELDLY_JOBS = [
  {
    name: '14 Oak Street',
    trade: 'HVAC · Marcus D.',
    status: 'En route',
    tone: '#FF6B2C',
    time: '08:00',
  },
  {
    name: '82 Birch Avenue',
    trade: 'Plumbing · Ellie R.',
    status: 'On site',
    tone: '#FFC24B',
    time: '10:30',
  },
  {
    name: '3 Elm Road',
    trade: 'Electrical · Sam O.',
    status: 'Queued',
    tone: '#8C8F9B',
    time: '14:00',
  },
]

/** Who is out, what they can sign off, and when they are free again. */
const FIELDLY_CREWS = [
  {
    name: 'Marcus D.',
    trade: 'HVAC · Gas Safe',
    until: 'Free 12:30',
    free: true,
  },
  { name: 'Ellie R.', trade: 'Plumbing · L2', until: 'On site', free: false },
  {
    name: 'Sam O.',
    trade: 'Electrical · 18th',
    until: 'Free 15:00',
    free: true,
  },
]

/**
 * The one number the screen is about, set the way money is set.
 *
 * Whole pounds at display size, the pence dropped a step and greyed - which is
 * the trick that lets a figure be enormous without being shouted - and the
 * movement since yesterday in a tinted chip beside it.
 */
function HeroValue({
  label,
  whole,
  frac,
  delta,
  up = true,
}: {
  label: string
  whole: string
  frac: string
  delta: string
  up?: boolean
}) {
  return (
    <div className="mb-3 px-[1.05rem]" data-phone-reveal>
      <p className="fl-hero__label">{label}</p>
      <p className="fl-hero">
        <span className="fl-hero__n">{whole}</span>
        <span className="fl-hero__f">{frac}</span>
        <span className="fl-hero__delta" data-up={up ? '' : undefined}>
          {up ? '\u2191' : '\u2193'} {delta}
        </span>
      </p>
    </div>
  )
}

/**
 * Two actions, and the knob that says they are two ends of one thing.
 *
 * The reference does this with Transfer and Receive: a pill each way, and a
 * disc sitting over the seam between them. It is worth stealing because the
 * disc turns two buttons into one control - and a dispatcher's two buttons
 * always *are* one control, because doing either one ends the same job.
 */
function TwinPills({
  c,
  left,
  right,
  leftIcon,
  rightIcon,
  onLeft,
  onRight,
}: {
  c: Concept
  left: string
  right: string
  leftIcon: ReactNode
  rightIcon: ReactNode
  onLeft?: () => void
  onRight?: () => void
}) {
  return (
    <div className="fl-twin px-[1.05rem]" data-phone-reveal>
      <Tap ripple={c.accent} label={left} onTap={onLeft} className="fl-twin__t">
        <span className="fl-twin__pill">
          <span className="fl-twin__ring">{leftIcon}</span>
          {left}
        </span>
      </Tap>

      <span aria-hidden="true" className="fl-twin__knob">
        <ArrowUpRight className="size-3" strokeWidth={2.8} />
      </span>

      <Tap
        ripple={c.accent}
        label={right}
        onTap={onRight}
        className="fl-twin__t"
      >
        <span className="fl-twin__pill" data-alt>
          {right}
          <span className="fl-twin__ring">{rightIcon}</span>
        </span>
      </Tap>
    </div>
  )
}

/**
 * The black card the day's work lives on.
 *
 * Everything quiet on this app is paper; the things actually happening are cut
 * out of it in black. One slab, a row per job, a disc of colour for the state
 * and the figure hard right.
 */
function Slab({ header, children }: { header?: string; children: ReactNode }) {
  return (
    <section className="mb-3 px-[1.05rem]" data-phone-reveal>
      {header ? <p className="fl-slab__h">{header}</p> : null}
      <div className="fl-slab">{children}</div>
    </section>
  )
}

function SlabRow({
  c,
  tone,
  title,
  value,
  glyph,
  onTap,
  label,
}: {
  c: Concept
  tone?: string
  title: string
  value: string
  glyph: ReactNode
  onTap?: () => void
  label?: string
}) {
  return (
    <Tap ripple={tone ?? c.accent} label={label} onTap={onTap}>
      <span className="fl-slab__row">
        <span className="fl-slab__glyph" style={{ background: tone }}>
          {glyph}
        </span>
        <span className="fl-slab__title">{title}</span>
        <span className="fl-slab__v">{value}</span>
      </span>
    </Tap>
  )
}

/**
 * A proportion drawn as two tinted lengths rather than a bar and a number.
 *
 * The reference uses it for how far a savings goal has got. It is the right
 * shape for utilisation too: the share that is sold and the share that is
 * still going spare, each carrying its own figure, so the gap is a thing you
 * see rather than a sum you do.
 */
function SplitBar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <span className="fl-split" data-phone-reveal>
      <span
        className="fl-split__a"
        style={{ width: `${pct}%`, background: tone }}
      >
        {pct}%
      </span>
      <span aria-hidden="true" className="fl-split__chev">
        &rsaquo;&rsaquo;
      </span>
      <span className="fl-split__b">{100 - pct}%</span>
    </span>
  )
}

/**
 * The greeting header: who you are, and the two controls that are always there.
 *
 * Taken off the reference almost literally, because the shape is the point - a
 * two-line stack hard left, a ringed circle and a rounded-square portrait hard
 * right, all sitting on the same baseline. It is what makes the screen read as
 * *aligned to a grid* rather than as a stack of cards that happen to be the
 * same width.
 */
function FieldHeader({
  eyebrow,
  title,
  initials,
}: {
  eyebrow: string
  title: string
  initials: string
}) {
  return (
    <header className="fl-head" data-phone-reveal>
      <div className="min-w-0">
        <p className="fl-head__e">{eyebrow}</p>
        <p className="fl-head__t">{title}</p>
      </div>
      <span aria-hidden="true" className="fl-head__ring">
        <Bell className="size-3" strokeWidth={2.4} />
      </span>
      <span aria-hidden="true" className="fl-head__av">
        {initials}
      </span>
    </header>
  )
}

/**
 * The chart, as the reference draws it.
 *
 * A pastel card, a range switcher along its top edge, the scale printed down
 * the left, a dashed line at the number that matters, and bars that carry
 * their own figure above them. The ghost behind each bar is last week, so the
 * comparison is a thing you see rather than a second chart to look at.
 */
function WeekChart({
  c,
  bars,
  ranges,
  range,
  onRange,
}: {
  c: Concept
  bars: Array<{
    d: string
    now: number
    then: number
    up: boolean
    pct: string
  }>
  ranges: Array<string>
  range: number
  onRange: (i: number) => void
}) {
  return (
    <section className="mb-3 px-[1.05rem]" data-phone-reveal>
      <div className="fl-chart">
        <div className="fl-chart__bar">
          <span className="fl-chart__sym">
            <Zap className="size-2.5" strokeWidth={3} />
            Hours
          </span>
          {ranges.map((r, i) => (
            <Tap
              key={r}
              press={false}
              ripple={c.accent}
              label={`Show ${r}`}
              onTap={() => onRange(i)}
              className="fl-chart__rt"
            >
              <span
                className="fl-chart__r"
                data-on={range === i ? '' : undefined}
              >
                {r}
              </span>
            </Tap>
          ))}
        </div>

        <div className="fl-chart__plot">
          {/* the number the week is being judged against */}
          <span aria-hidden="true" className="fl-chart__rule" />

          {/* keyed by position: the weekday initials repeat (M T W T F S S),
              so the letter is not unique */}
          {bars.map((b, i) => (
            <span key={i} className="fl-chart__col">
              <span className="fl-chart__pct" data-up={b.up ? '' : undefined}>
                {b.up ? '\u2191' : '\u2193'} {b.pct}
              </span>
              <span className="fl-chart__stack">
                <span
                  className="fl-chart__ghost"
                  style={{ height: `${b.then}%` }}
                />
                <span
                  className="fl-chart__now"
                  data-phone-bar
                  style={{ height: `${b.now}%` }}
                />
              </span>
              <span className="fl-chart__d">{b.d}</span>
            </span>
          ))}
        </div>

        <div className="fl-chart__key">
          <span className="fl-chart__k">
            <i className="fl-chart__ks" />
            this week
          </span>
          <span className="fl-chart__k">
            <i className="fl-chart__ks" data-ghost />
            last week
          </span>
        </div>
      </div>
    </section>
  )
}

/**
 * Two panels and the knob between them.
 *
 * The reference stacks a pastel panel on a black one and drops a ringed disc
 * over the seam, so the pair reads as one exchange rather than two boxes. Here
 * it is what a job costs and what it is worth - the same relationship, and the
 * same reason to draw it as one object.
 */
function SwapPanels({
  topLabel,
  topValue,
  topUnit,
  topFoot,
  botLabel,
  botValue,
  botUnit,
  botFoot,
  chips,
}: {
  topLabel: string
  topValue: string
  topUnit: string
  topFoot: string
  botLabel: string
  botValue: string
  botUnit: string
  botFoot: string
  chips?: Array<string>
}) {
  return (
    <div className="fl-swap px-[1.05rem]" data-phone-reveal>
      <div className="fl-swap__p" data-tint>
        <span className="fl-swap__h">
          <span className="fl-swap__l">{topLabel}</span>
          {chips?.map((ch) => (
            <span key={ch} className="fl-swap__chip">
              {ch}
            </span>
          ))}
        </span>
        <span className="fl-swap__v">
          {topValue}
          <span className="fl-swap__u">{topUnit}</span>
        </span>
        <span className="fl-swap__f">{topFoot}</span>
      </div>

      <span aria-hidden="true" className="fl-swap__knob">
        <ArrowUpRight className="size-3.5" strokeWidth={2.8} />
      </span>

      <div className="fl-swap__p" data-slab>
        <span className="fl-swap__h">
          <span className="fl-swap__l">{botLabel}</span>
        </span>
        <span className="fl-swap__v">
          {botValue}
          <span className="fl-swap__u">{botUnit}</span>
        </span>
        <span className="fl-swap__f">{botFoot}</span>
      </div>
    </div>
  )
}

/** A label on the left, a figure on the right - the reference's quiet rows. */
function KeyRow({
  k,
  v,
  strong = false,
}: {
  k: string
  v: string
  strong?: boolean
}) {
  return (
    <div className="fl-kv" data-strong={strong ? '' : undefined}>
      <span className="fl-kv__k">{k}</span>
      <span className="fl-kv__v">{v}</span>
    </div>
  )
}

/**
 * The bar with a disc at each end.
 *
 * The reference's Swap control: a circle, a word with chevrons, a circle. It
 * is a button that says which way the thing it does runs.
 */
function EndBar({
  c,
  label,
  left,
  right,
  onTap,
}: {
  c: Concept
  label: string
  left: ReactNode
  right: ReactNode
  onTap?: () => void
}) {
  return (
    <div className="px-[1.05rem]" data-phone-reveal>
      <Tap ripple={c.accent} label={label} onTap={onTap}>
        <span className="fl-end">
          <span className="fl-end__c">{left}</span>
          <span className="fl-end__l">
            {label}
            <span aria-hidden="true" className="fl-end__ch">
              &rsaquo;&rsaquo;
            </span>
          </span>
          <span className="fl-end__c" data-alt>
            {right}
          </span>
        </span>
      </Tap>
    </div>
  )
}

function FieldlyBoard({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [open, setOpen] = useChoice('fieldly.job', 0)

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <FieldHeader eyebrow="Tuesday 18 Nov" title="Dispatch" initials="MD" />

      <HeroValue
        label="Booked today"
        whole="£2,410"
        frac=".00"
        delta="2 rolling"
      />

      <TwinPills
        c={c}
        left="Assign"
        right="Route"
        leftIcon={<UserPlus className="size-3" strokeWidth={2.6} />}
        rightIcon={<Navigation className="size-3" strokeWidth={2.6} />}
        onLeft={() => go(1)}
        onRight={() => go(3)}
      />

      <Slab header="The board">
        {FIELDLY_JOBS.map((j, i) => (
          <SlabRow
            key={j.name}
            c={c}
            tone={j.tone}
            title={j.name}
            value={j.time}
            label={`Open ${j.name}`}
            onTap={() => {
              setOpen(i)
              go(1)
            }}
            glyph={
              open === i ? (
                <Navigation className="size-3" strokeWidth={2.8} />
              ) : (
                <Clock className="size-3" strokeWidth={2.8} />
              )
            }
          />
        ))}
        <div className="fl-slab__foot">
          <span aria-hidden="true" className="fl-slab__dots">
            <i data-on="" />
            <i />
          </span>
          <Tap
            press={false}
            ripple={c.accent}
            label="See the whole board"
            onTap={() => go(3)}
            className="fl-slab__all"
          >
            <span>
              View all
              <ChevronRight className="size-2.5" strokeWidth={3} />
            </span>
          </Tap>
        </div>
      </Slab>

      {/* The half of the board that is actually the dispatcher's job.
          A day with nothing unassigned on it is a day that does not need a
          dispatch app, so the screen has to show the state it exists for. */}
      <ListGroup header="Waiting on a crew">
        <Row
          onTap={() => go(1)}
          label="Assign 9 Quarry Lane"
          chevron
          leading={
            <Glyph tone="#F0463C" soft>
              <Zap className="size-3" strokeWidth={2.6} />
            </Glyph>
          }
          title="9 Quarry Lane"
          trailing={
            <Pill tone="#F0463C" solid>
              Urgent
            </Pill>
          }
        />
      </ListGroup>

      {/* who is actually free, which is the question the board never answers */}
      <p
        className="mb-1.5 px-[1.05rem] text-[8px] font-extrabold uppercase tracking-[0.14em]"
        style={{ color: 'var(--ink2)' }}
      >
        Crews out
      </p>
      <Rail>
        {FIELDLY_CREWS.map((crew) => (
          <span
            key={crew.name}
            className="flex w-[104px] shrink-0 flex-col gap-1.5 rounded-xl p-2"
            style={{
              background: 'var(--card)',
              boxShadow: 'inset 0 0 0 0.5px var(--hair)',
            }}
          >
            <span className="flex items-center gap-1.5">
              <Avatar
                name={crew.name}
                size={18}
                tone={crew.free ? c.accent : undefined}
              />
              <span
                className="truncate text-[9.5px] font-extrabold"
                style={{ color: 'var(--ink)' }}
              >
                {crew.name}
              </span>
            </span>
            <span className="text-[8px]" style={{ color: 'var(--ink2)' }}>
              {crew.trade}
            </span>
            <span
              className="rounded-md px-1.5 py-0.5 text-center text-[8px] font-extrabold"
              style={{
                background: crew.free ? `${c.accent}1f` : 'var(--fill)',
                color: crew.free ? c.accent : 'var(--ink2)',
              }}
            >
              {crew.until}
            </span>
          </span>
        ))}
      </Rail>

      <div className="mt-3 px-[1.05rem]">
        <PrimaryButton label="Add a job" onTap={() => go(1)}>
          <Plus className="size-3" strokeWidth={3} />
          New job
        </PrimaryButton>
      </div>
    </AppCanvas>
  )
}

function FieldlyJob({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [state, setState] = useScreenState<'none' | 'signed' | 'invoiced'>(
    'fieldly.quote',
    'none',
  )
  const lines = [
    { l: 'Labour · 4h at £85', v: '£340.00' },
    { l: 'Pipe fittings & parts', v: '£120.00' },
    { l: 'Emergency call-out', v: '£75.00' },
  ]

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <NavBar back="Board" title="Job 1047" onBack={() => go(1)} right="Edit" />

      <div className="mb-3 px-[1.05rem]">
        <MapPlate c={c} />
      </div>

      <SwapPanels
        topLabel="Quoted"
        topValue="535.00"
        topUnit="GBP"
        topFoot="14 Oak Street"
        botLabel="Invoiced"
        botValue="642.00"
        botUnit="GBP"
        botFoot="Inc. VAT"
        chips={['Fixed', 'Day rate']}
      />

      <div className="mb-3 px-[1.05rem]">
        {lines.map((row) => (
          <KeyRow key={row.l} k={row.l} v={row.v} />
        ))}
        <KeyRow k="Total inc. VAT" v="£642.00" strong />
      </div>

      {/* The part of a job card that keeps an engineer out of a phone call:
          what was agreed, what is on the van, and what has to be signed off
          before the invoice is allowed to exist. */}
      <ListGroup header="Before you leave site">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Check className="size-3" strokeWidth={2.8} />
            </Glyph>
          }
          title="Parts on the van"
          trailing={<Pill tone="#1F9D55">In stock</Pill>}
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Flame className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Gas safety check"
          trailing={<Pill tone={c.accent2}>Due</Pill>}
        />
      </ListGroup>

      <div className="space-y-2 px-[1.05rem]">
        <PrimaryButton
          label={state === 'none' ? 'Take signature' : 'Convert to invoice'}
          tone={state === 'invoiced' ? '#1F9D55' : undefined}
          onTap={() => {
            if (state === 'invoiced') return
            if (state === 'none') setState('signed')
            else {
              setState('invoiced')
              window.setTimeout(() => go(2), 700)
            }
          }}
        >
          {state === 'none' ? (
            <>
              <Signature className="size-3" strokeWidth={2.6} />
              Get signature
            </>
          ) : state === 'signed' ? (
            <>
              <Zap className="size-3" strokeWidth={2.8} />
              Convert to invoice
            </>
          ) : (
            <>
              <Check className="size-3" strokeWidth={3} />
              Invoice sent
            </>
          )}
        </PrimaryButton>
        <GhostButton label="Call the customer">
          <Phone className="size-2.5" strokeWidth={2.6} />
          Call Sarah
        </GhostButton>
      </div>
    </AppCanvas>
  )
}

function FieldlyProof({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [shot, setShot] = useScreenState('fieldly.before', false)
  const [done, setDone] = useScreenState('fieldly.done', false)

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <NavBar back="Job" title="Proof" onBack={() => go(1)} />

      <div className="mb-3 grid grid-cols-2 gap-2 px-[1.05rem]">
        <div>
          <p
            className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: 'var(--ink2)' }}
          >
            Before
          </p>
          <Tap
            ripple={c.accent}
            label="Take the before photo"
            onTap={() => setShot(true)}
          >
            <span
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl transition-all"
              style={
                shot
                  ? {
                      background: `linear-gradient(150deg, ${c.accent}, ${c.accent2})`,
                      color: 'var(--on-a)',
                    }
                  : {
                      background: 'var(--fill)',
                      border: '1px dashed var(--hair)',
                      color: 'var(--ink2)',
                    }
              }
            >
              {shot ? (
                <Check className="size-5" strokeWidth={3} />
              ) : (
                <Camera className="size-4" strokeWidth={1.9} />
              )}
              <span className="text-[8px] font-bold">
                {shot ? '09:12' : 'Tap to shoot'}
              </span>
            </span>
          </Tap>
        </div>

        <div>
          <p
            className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: c.accent }}
          >
            After
          </p>
          <span
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl"
            style={{
              background: `linear-gradient(150deg, ${c.accent2}, ${c.accent})`,
              color: 'var(--on-a)',
            }}
          >
            <Check className="size-5" strokeWidth={3} />
            <span className="text-[8px] font-bold">11:48</span>
          </span>
        </div>
      </div>

      <ListGroup header="Attached to job 1047">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Flame className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Flue gas reading logged"
          trailing={
            <Check
              className="size-3"
              style={{ color: '#1F9D55' }}
              strokeWidth={3}
            />
          }
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Signature className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Signed by S. Johnson"
          trailing={
            <Check
              className="size-3"
              style={{ color: '#1F9D55' }}
              strokeWidth={3}
            />
          }
        />
      </ListGroup>

      {/* the note is what ends the dispute the photographs started */}
      <div className="mb-3 px-[1.05rem]">
        <Card className="p-2.5">
          <p
            className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: 'var(--ink2)' }}
          >
            Engineer’s note
          </p>
          <p
            className="mt-1.5 text-[10px] leading-[1.5]"
            style={{ color: 'var(--ink)' }}
          >
            Expansion vessel failed - replaced under warranty, reset to 1.2 bar.
          </p>
        </Card>
      </div>

      <EndBar
        c={c}
        label={done ? 'Job closed' : 'Mark complete'}
        left={<Check className="size-3.5" strokeWidth={3} />}
        right={<ArrowUpRight className="size-3.5" strokeWidth={3} />}
        onTap={() => {
          setDone(true)
          window.setTimeout(() => go(3), 700)
        }}
      />
    </AppCanvas>
  )
}

function FieldlyWeek({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [range, setRange] = useChoice('fieldly.range', 1)

  /* hours sold per day, against the same day last week. The pair is the whole
     point of the card: a week that looks busy and a week that *is* busier are
     different weeks. */
  const bars = [
    { d: 'M', now: 58, then: 44, up: true, pct: '23%' },
    { d: 'T', now: 72, then: 61, up: true, pct: '35%' },
    { d: 'W', now: 46, then: 63, up: false, pct: '42%' },
    { d: 'T', now: 84, then: 70, up: true, pct: '20%' },
    { d: 'F', now: 66, then: 66, up: true, pct: '15%' },
    { d: 'S', now: 38, then: 52, up: false, pct: '60%' },
    { d: 'S', now: 22, then: 18, up: true, pct: '82%' },
  ]

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <FieldHeader eyebrow="Week 47" title="The Week" initials="MD" />

      <WeekChart
        c={c}
        bars={bars}
        ranges={['1d', '7 days', '1m', '6m']}
        range={range}
        onRange={setRange}
      />

      {/* What a week view is actually for. A row of coloured bars says how the
          day is arranged; only the numbers say whether the week is any good,
          and only the gap list says what to do about it. */}
      <div className="mt-3 mb-3 px-[1.05rem]">
        <Card className="flex items-center justify-around p-2.5">
          <Stat n="18" label="Jobs" />
          <span className="h-6 w-px" style={{ background: 'var(--hair)' }} />
          <Stat n="£9.4k" label="Booked" />
        </Card>
      </div>

      {/* sold against spare, drawn rather than summed */}
      <div className="mb-3 px-[1.05rem]">
        <SplitBar pct={62} tone={c.accent2} />
      </div>

      <ListGroup header="Gaps worth filling">
        <Row
          onTap={() => go(0)}
          label="Fill Wednesday morning"
          chevron
          leading={
            <Glyph tone={c.accent2} soft>
              <Clock className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Wed 09:00 – 12:00"
          trailing={<Pill tone={c.accent2}>3h</Pill>}
        />
        <Row
          onTap={() => go(0)}
          label="Fill Friday afternoon"
          chevron
          leading={
            <Glyph tone={c.accent2} soft>
              <Clock className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Fri 13:00 – 17:00"
          trailing={<Pill tone={c.accent2}>4h</Pill>}
        />
      </ListGroup>
    </AppCanvas>
  )
}

/* ============================== STAMP ============================== *
 * Wallet-first. A warm, paper-feeling deck of cards that lifts when picked,
 * behind a cream frosted bar.
 * =================================================================== */

const STAMP_SHOPS = [
  {
    name: 'Brew & Co',
    kind: 'Coffee',
    tone: '#F5333B',
    note: '9 of 10 stamps',
  },
  { name: 'Corner Mart', kind: 'Grocery', tone: '#FF9563', note: '340 points' },
  {
    name: 'Sunny Bakes',
    kind: 'Bakery',
    tone: '#C2410C',
    note: '5 of 8 stamps',
  },
]

function StampWallet({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [picked, setPicked] = useChoice('stamp.card', 0)

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="Good morning" title="Jamie" />

      {/* the balance card is the one big object in the app */}
      <div className="mb-4 px-[1.05rem]" data-phone-reveal>
        <Tap ripple="#ffffff" label="See rewards" onTap={() => go(2)}>
          <span
            className="relative block overflow-hidden rounded-2xl p-3.5 text-left"
            style={{
              color: 'var(--on-a)',
              background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accent2} 100%)`,
              boxShadow: `0 14px 30px -14px ${c.accent}`,
            }}
          >
            <span
              aria-hidden="true"
              className="absolute -right-6 -top-8 size-24 rounded-full"
              style={{ background: 'rgba(255,255,255,0.14)' }}
            />
            <span className="relative block text-[9px] font-bold uppercase tracking-[0.16em] opacity-70">
              Points balance
            </span>
            <span className="relative mt-1 block text-[28.5px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
              1,240
            </span>
            <span className="relative mt-2 flex items-center gap-1 text-[9.5px] font-semibold opacity-80">
              <Sparkles className="size-2.5" strokeWidth={2.6} />2 rewards ready
              to claim
            </span>
          </span>
        </Tap>
      </div>

      {/* the deck - cards overlap the way they would in a wallet, and the
          chosen one lifts clear of the ones below it */}
      <p
        className="mb-2 px-[1.05rem] text-[8px] font-extrabold uppercase tracking-[0.14em]"
        style={{ color: 'var(--ink2)' }}
      >
        Your cards
      </p>
      <div className="px-[1.05rem]">
        {STAMP_SHOPS.map((s, i) => (
          <Tap
            key={s.name}
            ripple="#ffffff"
            label={`Open the ${s.name} card`}
            onTap={() => {
              setPicked(i)
              go(1)
            }}
          >
            <span
              className="relative block rounded-xl p-2.5 text-left transition-all duration-300"
              style={{
                background: `linear-gradient(120deg, ${s.tone} 0%, color-mix(in srgb, ${s.tone} 62%, #120E0C) 100%)`,
                color: '#fff',
                marginTop: i === 0 ? 0 : -10,
                zIndex: i,
                transform: picked === i ? 'translateY(-6px)' : undefined,
                boxShadow:
                  picked === i
                    ? `0 14px 26px -12px ${s.tone}`
                    : '0 6px 14px -10px rgba(42,30,26,0.7)',
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-extrabold">
                    {s.name}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-bold">
                  {s.note}
                </span>
              </span>
            </span>
          </Tap>
        ))}
      </div>

      {/* The thing a paper card cannot do, said out loud: a wallet that
          remembers. Without this the screen is a stack of cards and nothing
          else, which is exactly what the shop already had. */}
      <ListGroup header="This week">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Sparkles className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Double stamps at Brew & Co"
          trailing={
            <Pill tone={c.accent} solid>
              2×
            </Pill>
          }
          onTap={() => go(1)}
          label="Open the Brew & Co card"
          chevron
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Gift className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="One stamp from a free coffee"
          trailing={<span className="tabular-nums">9/10</span>}
        />
      </ListGroup>
    </AppCanvas>
  )
}

function StampCard({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [stamps, setStamps] = useScreenState('stamp.stamps', 9)
  const full = stamps >= 10

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <NavBar back="Wallet" title="Brew & Co" onBack={() => go(0)} />

      <div className="mb-3 px-[1.05rem]">
        <Card className="p-3.5">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className="flex aspect-square items-center justify-center rounded-full transition-all duration-500"
                style={
                  i < stamps
                    ? {
                        background: `linear-gradient(140deg, ${c.accent}, ${c.accent2})`,
                        color: 'var(--on-a)',
                        transform: i === stamps - 1 ? 'scale(1.08)' : undefined,
                      }
                    : {
                        border:
                          '1.5px dashed color-mix(in srgb, var(--ink2) 45%, transparent)',
                        color: 'transparent',
                      }
                }
              >
                {i < stamps ? (
                  <Check className="size-3" strokeWidth={3.4} />
                ) : null}
              </span>
            ))}
          </div>

          <p
            className="mt-3 text-center text-[10.5px] font-bold"
            style={{ color: full ? c.accent : 'var(--ink)' }}
          >
            {full
              ? 'Card full - the next one is on the house'
              : `${10 - stamps} more and the next one is free`}
          </p>
        </Card>
      </div>

      <ListGroup header="This card">
        <Row title="Earned since March" trailing="47 stamps" />
        <Row title="Free coffees claimed" trailing="4" />
        <Row title="Last visit" trailing="Yesterday" />
      </ListGroup>

      {/* the shop side of the card - the half a rubber stamp never had */}
      <ListGroup header="From the shop">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Sparkles className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Double stamps until 4pm"
          trailing={
            <Pill tone={c.accent} solid>
              Live
            </Pill>
          }
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <MapPin className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="17 Grove Street"
          trailing={<Pill tone="#1F9D55">Open</Pill>}
        />
      </ListGroup>

      <div className="px-[1.05rem]">
        <PrimaryButton
          label={full ? 'Claim the free coffee' : 'Scan at the till'}
          tone={full ? '#1F9D55' : undefined}
          onTap={() => (full ? go(2) : setStamps((n) => n + 1))}
        >
          {full ? (
            <>
              <Gift className="size-3" strokeWidth={2.6} />
              Claim free coffee
            </>
          ) : (
            <>
              <QrCode className="size-3" strokeWidth={2.6} />
              Scan to stamp
            </>
          )}
        </PrimaryButton>
      </div>
    </AppCanvas>
  )
}

function StampRewards({ c }: ScreenProps) {
  const [tab, setTab] = useChoice('stamp.tab', 0)
  const [points, setPoints] = useScreenState('stamp.points', 1240)
  const [taken, setTaken] = useScreenState<Array<string>>('stamp.taken', [])

  const rewards = [
    { name: 'Free filter coffee', price: 500, shop: 'Brew & Co' },
    { name: '10% off the whole order', price: 300, shop: 'Corner Mart' },
    { name: 'Any pastry, free', price: 400, shop: 'Sunny Bakes' },
    { name: 'Bag of house beans', price: 1200, shop: 'Brew & Co' },
  ]
  const shown = rewards.filter((r) =>
    tab === 0 ? !taken.includes(r.name) : taken.includes(r.name),
  )

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle
        title="Rewards"
        right={
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-extrabold tabular-nums"
            style={{
              background: `linear-gradient(130deg, ${c.accent}, ${c.accent2})`,
              color: 'var(--on-a)',
            }}
          >
            {points.toLocaleString()}
          </span>
        }
      />

      <Segmented
        items={['Available', 'Claimed']}
        value={tab}
        onChange={setTab}
      />

      <ListGroup>
        {shown.map((r) => {
          const claimed = taken.includes(r.name)
          const afford = points >= r.price
          return (
            <Row
              key={r.name}
              onTap={
                claimed || !afford
                  ? undefined
                  : () => {
                      setTaken((cur) => [...cur, r.name])
                      setPoints((p) => p - r.price)
                    }
              }
              label={`Claim ${r.name}`}
              leading={
                <Glyph tone={c.accent} soft={!afford || claimed}>
                  <Gift className="size-3" strokeWidth={2.4} />
                </Glyph>
              }
              title={r.name}
              trailing={
                <Pill
                  tone={claimed ? '#1F9D55' : afford ? c.accent : undefined}
                  solid={!claimed && afford}
                >
                  {claimed ? 'Claimed' : afford ? 'Claim' : 'Short'}
                </Pill>
              }
            />
          )
        })}
        {shown.length === 0 ? (
          <div
            className="px-3 py-6 text-center text-[10px]"
            style={{ color: 'var(--ink2)' }}
          >
            {tab === 0
              ? 'Everything claimed. Go get a coffee.'
              : 'Nothing claimed yet.'}
          </div>
        ) : null}
      </ListGroup>

      {/* the next one up, with the gap made visible - a points balance on its
          own is a number, and a number does not get anybody through a door */}
      <div className="mb-3 px-[1.05rem]">
        <Card className="p-3">
          <div className="flex items-baseline justify-between">
            <p
              className="text-[10.5px] font-extrabold"
              style={{ color: 'var(--ink)' }}
            >
              Bag of house beans
            </p>
            <p
              className="text-[9px] font-bold tabular-nums"
              style={{ color: 'var(--ink2)' }}
            >
              {points.toLocaleString()} / 1,200
            </p>
          </div>
          <div className="mt-2">
            <Track pct={Math.min(100, (points / 1200) * 100)} tone={c.accent} />
          </div>
          <p className="mt-2 text-[9px]" style={{ color: 'var(--ink2)' }}>
            ~4 more visits
          </p>
        </Card>
      </div>

      <ListGroup header="Ending soon">
        <Row
          leading={
            <Glyph tone={c.accent2} soft>
              <Clock className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Sunny Bakes · free cookie"
          trailing={<Pill tone={c.accent2}>3 days</Pill>}
        />
        <Row
          leading={
            <Glyph tone={c.accent2} soft>
              <Clock className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Corner Mart · bonus points"
          trailing={
            <Pill tone="#F0463C" solid>
              Today
            </Pill>
          }
        />
      </ListGroup>
    </AppCanvas>
  )
}

function StampNearby({ c }: ScreenProps) {
  const { go } = usePhoneNav()

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle title="Nearby" />

      <div className="mb-3 px-[1.05rem]">
        <MapPlate c={c} height={94} />
      </div>

      <ListGroup header="On your way home">
        {[
          {
            name: 'Brew & Co',
            offer: 'Double stamps until 4pm',
            dist: '0.2 km',
          },
          {
            name: 'Corner Mart',
            offer: 'Bonus 200 points today',
            dist: '0.4 km',
          },
          {
            name: 'Sunny Bakes',
            offer: 'Free cookie with any drink',
            dist: '0.6 km',
          },
        ].map((o, i) => (
          <Row
            key={o.name}
            onTap={() => go(1)}
            label={`Open ${o.name}`}
            chevron
            leading={
              <Avatar name={o.name} tone={STAMP_SHOPS[i]?.tone} size={24} />
            }
            title={o.name}
            trailing={<span className="tabular-nums">{o.dist}</span>}
          />
        ))}
      </ListGroup>

      <ListGroup header="New round here">
        <Row
          onTap={() => go(1)}
          label="Open Alder & Rye"
          chevron
          leading={<Avatar name="Alder Rye" tone={c.accent2} size={24} />}
          title="Alder & Rye"
          trailing={
            <Pill tone={c.accent} solid>
              New
            </Pill>
          }
        />
      </ListGroup>

      <div className="px-[1.05rem]">
        <GhostButton label="See every shop on the map">
          <MapPin className="size-2.5" strokeWidth={2.6} />
          All 24 shops nearby
        </GhostButton>
      </div>
    </AppCanvas>
  )
}

/* ============================== SLATE ============================== *
 * Calendar-first. The week never leaves the screen, and confirmation arrives
 * as a sheet over the booking rather than as another page.
 * =================================================================== */

const SLATE_SLOTS = ['9:00', '9:30', '10:00', '11:00', '14:00', '15:30']
const SLATE_TAKEN = [2, 4]

/**
 * The week, as a row you thumb along.
 *
 * A calendar app's first question is always "which day", so the answer lives
 * above everything else and is answered by one tap. The live day is lifted
 * into a filled pill with a mark under it - the same grammar as the tab bar,
 * one level up.
 */
function DateStrip({
  c,
  days,
  labels,
  value,
  onPick,
}: {
  c: Concept
  days: Array<number>
  labels: Array<string>
  value: number
  onPick: (i: number) => void
}) {
  return (
    <div className="mb-4 flex justify-between px-[1.05rem]" data-phone-reveal>
      {days.map((d, i) => {
        const on = value === i
        return (
          <Tap
            key={d}
            press={false}
            ripple={c.accent}
            label={`Choose ${d} November`}
            onTap={() => onPick(i)}
            className="slate-day"
          >
            <span className="slate-day__inner" data-on={on ? '' : undefined}>
              <span className="slate-day__n">{d}</span>
              <span className="slate-day__d">{labels[i]}</span>
              <span aria-hidden="true" className="slate-day__dot" />
            </span>
          </Tap>
        )
      })}
    </div>
  )
}

/**
 * The day itself: a rail, a dot per entry, and one entry raised into a card.
 *
 * Only the live entry is a card - everything else is a title and a time
 * against the rail, because a list where every row is a filled box is a list
 * with no shape to it. The card is where the faces and the tick live, and it
 * is the only place on the screen carrying more than two lines.
 */
function Timeline({
  c,
  items,
  live,
  onPick,
}: {
  c: Concept
  items: Array<{ t: string; title: string; who?: Array<string> }>
  live: number
  onPick: (i: number) => void
}) {
  return (
    <div className="slate-time px-[1.05rem]" data-phone-reveal>
      {items.map((it, i) => {
        const on = live === i
        return (
          <Tap
            key={it.title}
            ripple={c.accent}
            label={`Open ${it.title}`}
            onTap={() => onPick(i)}
            className="slate-time__row"
          >
            <span className="slate-time__line">
              <span
                aria-hidden="true"
                className="slate-time__dot"
                data-on={on ? '' : undefined}
              />

              <span className="slate-time__body" data-on={on ? '' : undefined}>
                <span className="slate-time__head">
                  <span className="slate-time__title">{it.title}</span>
                  <span className="slate-time__t">{it.t}</span>
                </span>

                {on && it.who ? (
                  <span className="slate-time__foot">
                    <span className="slate-time__faces">
                      {it.who.map((w) => (
                        <Avatar key={w} name={w} size={22} tone={c.accent} />
                      ))}
                    </span>
                    <span aria-hidden="true" className="slate-time__tick">
                      <Check className="size-3" strokeWidth={3.2} />
                    </span>
                  </span>
                ) : null}
              </span>
            </span>
          </Tap>
        )
      })}
    </div>
  )
}

function SlateBook({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [day, setDay] = useChoice('slate.day', 1)
  const [slot, setSlot] = useChoice('slate.slot', 0)
  const [sheet, setSheet] = useScreenState('slate.sheet', false)
  const days = [17, 18, 19, 20, 21, 22, 23]
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <AppCanvas
      c={c}
      chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}
      sheetOpen={sheet}
      sheet={
        <Sheet open={sheet} onDismiss={() => setSheet(false)}>
          <p
            className="text-[13px] font-extrabold"
            style={{ color: 'var(--ink)' }}
          >
            Confirm this booking
          </p>
          <div className="my-2.5 flex items-center gap-2">
            <span
              className="flex-1 rounded-lg px-2.5 py-2 text-center"
              style={{ background: 'var(--fill)' }}
            >
              <span
                className="block text-[9px]"
                style={{ color: 'var(--ink2)' }}
              >
                Date
              </span>
              <span
                className="mt-0.5 block text-[11px] font-extrabold"
                style={{ color: 'var(--ink)' }}
              >
                {days[day]} Nov
              </span>
            </span>
            <span
              className="flex-1 rounded-lg px-2.5 py-2 text-center"
              style={{ background: 'var(--fill)' }}
            >
              <span
                className="block text-[9px]"
                style={{ color: 'var(--ink2)' }}
              >
                Time
              </span>
              <span
                className="mt-0.5 block text-[11px] font-extrabold"
                style={{ color: 'var(--ink)' }}
              >
                {SLATE_SLOTS[slot]}
              </span>
            </span>
          </div>
          <PrimaryButton
            label="Confirm the booking"
            onTap={() => {
              setSheet(false)
              window.setTimeout(() => go(1), 260)
            }}
          >
            Confirm booking
          </PrimaryButton>
        </Sheet>
      }
    >
      <StatusBar />
      <LargeTitle eyebrow="Ana's Studio" title="Pick a time" />

      <div className="mb-3 px-[1.05rem]">
        <span
          className="flex items-center gap-2 rounded-xl px-2.5 py-2"
          style={{
            background: `color-mix(in srgb, ${c.accent} 12%, transparent)`,
          }}
        >
          <Check
            className="size-3"
            style={{ color: c.accent }}
            strokeWidth={3}
          />
          <span
            className="text-[10.5px] font-bold"
            style={{ color: 'var(--ink)' }}
          >
            Cut &amp; style · 45 min · £38
          </span>
        </span>
      </div>

      <DateStrip
        c={c}
        days={days}
        labels={labels}
        value={day}
        onPick={setDay}
      />

      <div className="mb-3 grid grid-cols-3 gap-1.5 px-[1.05rem]">
        {SLATE_SLOTS.map((s, i) => {
          const gone = SLATE_TAKEN.includes(i)
          return (
            <Tap
              key={s}
              press={false}
              ripple={c.accent}
              disabled={gone}
              label={gone ? `${s} is taken` : `Choose ${s}`}
              onTap={() => setSlot(i)}
            >
              <span
                className="block rounded-lg py-2 text-center text-[10px] font-extrabold tabular-nums transition-all"
                style={
                  gone
                    ? {
                        background: 'var(--fill)',
                        color: 'var(--ink2)',
                        opacity: 0.45,
                        textDecoration: 'line-through',
                      }
                    : slot === i
                      ? { background: c.accent, color: 'var(--on-a)' }
                      : {
                          background: `color-mix(in srgb, ${c.accent2} 26%, transparent)`,
                          color: 'var(--ink)',
                        }
                }
              >
                {s}
              </span>
            </Tap>
          )
        })}
      </div>

      <div className="px-[1.05rem]">
        <PrimaryButton label="Review the booking" onTap={() => setSheet(true)}>
          Book {days[day]} Nov at {SLATE_SLOTS[slot]}
        </PrimaryButton>
      </div>

      {/* Everything a one-chair salon would otherwise have to say on the
          phone: what it is, how long it takes, and who you are seeing. The
          grid of times alone makes a booking screen; this makes it a shop. */}
      <ListGroup header="What you’re booking">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Sparkles className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Cut & finish"
          trailing={
            <Pill tone={c.accent} solid>
              Chosen
            </Pill>
          }
        />
        <Row
          leading={<Avatar name="Nadia K" size={22} tone={c.accent} />}
          title="Nadia K."
          trailing={<Pill tone={c.accent2}>Same as last</Pill>}
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <MapPin className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="8 Fellgate Row"
          trailing={<ChevronRight className="size-3" strokeWidth={2.6} />}
        />
      </ListGroup>

      <div className="mb-1 px-[1.05rem]">
        <Card className="p-2.5">
          <p
            className="text-[9.5px] leading-[1.5]"
            style={{ color: 'var(--ink2)' }}
          >
            <span className="font-extrabold" style={{ color: 'var(--ink)' }}>
              No deposit.
            </span>{' '}
            Free to move up to two hours before.
          </p>
        </Card>
      </div>
    </AppCanvas>
  )
}

function SlateConfirmed({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [added, setAdded] = useScreenState('slate.calendar', false)

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />

      <div
        className="flex flex-col items-center px-[1.05rem] pt-2"
        data-phone-reveal
      >
        <span
          className="flex size-14 items-center justify-center rounded-full"
          style={{
            color: 'var(--on-a)',
            background: `linear-gradient(140deg, ${c.accent}, ${c.accent2})`,
            boxShadow: `0 12px 26px -12px ${c.accent}`,
          }}
        >
          <Check className="size-7" strokeWidth={3} />
        </span>
        <p
          className="mt-3 text-[19px] font-extrabold tracking-[-0.02em]"
          style={{ color: 'var(--ink)' }}
        >
          You&rsquo;re booked
        </p>
      </div>

      {/* a ticket stub rather than a table - the notch is what makes it read
          as something torn off and kept */}
      <div className="mt-4 px-[1.05rem]">
        <Card className="overflow-hidden p-0">
          <div
            className="px-3 py-2.5"
            style={{
              color: 'var(--on-a)',
              background: `linear-gradient(120deg, ${c.accent2}, ${c.accent})`,
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-70">
              Ana&rsquo;s Studio
            </p>
            <p className="mt-0.5 text-[14.5px] font-extrabold">
              Cut &amp; style
            </p>
          </div>

          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-1.5 top-0 size-3 -translate-y-1/2 rounded-full"
              style={{ background: c.appBg[0] }}
            />
            <span
              aria-hidden="true"
              className="absolute -right-1.5 top-0 size-3 -translate-y-1/2 rounded-full"
              style={{ background: c.appBg[0] }}
            />
            <div
              className="border-t border-dashed"
              style={{ borderColor: 'var(--hair)' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 p-3">
            <Stat n="18" label="Nov" />
            <Stat n="9:00" label="Start" tone={c.accent} />
            <Stat n="45m" label="Length" />
          </div>
        </Card>
      </div>

      <div className="mt-3 space-y-2 px-[1.05rem]">
        <PrimaryButton
          label="Add to the phone calendar"
          tone={added ? '#1F9D55' : undefined}
          onTap={() => {
            setAdded(true)
            window.setTimeout(() => go(2), 700)
          }}
        >
          {added ? (
            <>
              <Check className="size-3" strokeWidth={3} /> In your calendar
            </>
          ) : (
            'Add to calendar'
          )}
        </PrimaryButton>
        <GhostButton label="Book another time" onTap={() => go(0)}>
          Book another
        </GhostButton>
      </div>

      {/* The half of "confirmed" that stops a no-show: when they will be
          reminded, and how they get out of it without ringing anybody. */}
      <ListGroup header="What happens next">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Clock className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Reminder, morning of"
          trailing={<Pill tone={c.accent2}>Tue</Pill>}
        />
        <Row
          onTap={() => go(0)}
          label="Move or cancel this visit"
          chevron
          leading={
            <Glyph tone={c.accent} soft>
              <Navigation className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Move or cancel"
        />
      </ListGroup>
    </AppCanvas>
  )
}

function SlateVisits({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [tab, setTab] = useChoice('slate.tab', 0)
  const [live, setLive] = useChoice('slate.live', 0)

  /* A visit is a time and a service. Everything else about it - who, where,
     how long - belongs on the one entry the reader is actually looking at,
     which is what the card is for. */
  const upcoming = [
    { t: '9:00', title: 'Cut & style', who: ['Ana R', 'Nadia K'] },
    { t: '14:30', title: 'Deep conditioning' },
    { t: '17:15', title: 'Fringe trim' },
  ]
  const past = [
    { t: '9:00', title: 'Cut & style', who: ['Ana R'] },
    { t: '17:15', title: 'Fringe trim' },
    { t: '11:00', title: 'Colour top-up' },
  ]
  const shown = tab === 0 ? upcoming : past

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="November 2025" title="My visits" />
      <Segmented items={['Upcoming', 'Past']} value={tab} onChange={setTab} />

      <Timeline
        c={c}
        items={shown}
        live={Math.min(live, shown.length - 1)}
        onPick={setLive}
      />

      <div className="mt-3 px-[1.05rem]">
        <PrimaryButton label="Book the same again" onTap={() => go(0)}>
          Book the same again
        </PrimaryButton>
      </div>
    </AppCanvas>
  )
}

function SlateDesk({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [picked, setPicked] = useChoice('slate.picked', 0)
  const day = [
    { t: '9:00', title: 'Sarah M.', who: ['Sarah M', 'Ana R'] },
    { t: '10:15', title: 'Priya K.' },
    { t: '11:30', title: 'Open chair' },
    { t: '13:00', title: 'Tom R.' },
  ]

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="Mon 18 Nov" title="Front desk" />

      <Timeline c={c} items={day} live={picked} onPick={setPicked} />

      {/* the day in numbers, which is the only thing on this screen the
          person at the counter reads without being asked a question */}
      <div className="mb-3 mt-4 px-[1.05rem]">
        <Card className="flex items-center justify-around p-2.5">
          <Stat n="3" label="Booked" />
          <span className="h-6 w-px" style={{ background: 'var(--hair)' }} />
          <Stat n="2" label="Gaps" tone={c.accent} />
          <span className="h-6 w-px" style={{ background: 'var(--hair)' }} />
          <Stat n="£114" label="On the day" />
        </Card>
      </div>

      <ListGroup header="Waiting for a cancellation">
        <Row
          onTap={() => go(0)}
          label="Offer the 11:30 to Dee W."
          chevron
          leading={<Avatar name="Dee W" size={22} tone={c.accent} />}
          title="Dee W."
          trailing={
            <Pill tone={c.accent} solid>
              Offer 11:30
            </Pill>
          }
        />
        <Row
          onTap={() => go(0)}
          label="Offer the 15:30 to Marcus L."
          chevron
          leading={<Avatar name="Marcus L" size={22} tone={c.accent2} />}
          title="Marcus L."
          trailing={<Pill tone={c.accent2}>Offer 15:30</Pill>}
        />
      </ListGroup>
    </AppCanvas>
  )
}

/* ============================== PROPHY ============================= *
 * Chart-first. Everything is a card with one job, and red appears exactly
 * once in the whole app.
 * =================================================================== */

const PROPHY_PATIENTS = [
  {
    name: 'Sarah Malik',
    due: 'Overdue 12 days',
    overdue: true,
    last: 'Mar 24',
  },
  { name: 'Tom Reilly', due: 'Due in 3 days', overdue: false, last: 'May 12' },
  { name: 'Priya Kaur', due: 'Due in 9 days', overdue: false, last: 'May 18' },
  { name: 'Alex Nunez', due: 'Due in 3 weeks', overdue: false, last: 'Jun 02' },
]

function ProphyRecall({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [tab, setTab] = useChoice('prophy.tab', 0)
  const [booked, setBooked] = useScreenState<Array<string>>('prophy.booked', [])
  const shown = PROPHY_PATIENTS.filter((p) =>
    tab === 0 ? p.overdue : !p.overdue,
  )

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="November" title="Recall" />
      <SearchField placeholder="Search patients" />
      <Segmented
        items={['Overdue', 'Due soon']}
        value={tab}
        onChange={setTab}
      />

      <ListGroup>
        {shown.map((p) => {
          const done = booked.includes(p.name)
          return (
            <Row
              key={p.name}
              onTap={() => {
                setBooked((cur) =>
                  cur.includes(p.name) ? cur : [...cur, p.name],
                )
                window.setTimeout(() => go(1), 500)
              }}
              label={`Open ${p.name}`}
              leading={
                <Avatar
                  name={p.name}
                  tone={p.overdue ? '#F5333B' : c.accent}
                  size={26}
                />
              }
              title={p.name}
              trailing={
                <Pill
                  tone={done ? c.accent : p.overdue ? '#F5333B' : undefined}
                  solid={done || p.overdue}
                >
                  {done ? 'Booked' : p.due}
                </Pill>
              }
            />
          )
        })}
      </ListGroup>

      <div className="px-[1.05rem]">
        <Card className="p-3">
          <p
            className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: 'var(--ink2)' }}
          >
            Recall rate, last 6 months
          </p>
          <div className="mt-2.5 flex h-12 items-end gap-1.5">
            {[42, 58, 46, 68, 55, 79].map((h, i) => (
              <span
                key={i}
                data-phone-bar
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  background:
                    i === 5
                      ? `linear-gradient(to top, ${c.accent}, ${c.accent2})`
                      : 'var(--fill)',
                }}
              />
            ))}
          </div>
          <div
            className="mt-1.5 flex justify-between text-[7.5px] font-bold"
            style={{ color: 'var(--ink2)' }}
          >
            {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((m) => (
              <span key={m} className="flex-1 text-center">
                {m}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Recall is a chase, not a report. The list says who is overdue; this
          says what has already been done about it and what has not - which is
          the only part that stops the same patient being rung twice. */}
      <ListGroup header="Chased this week">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Check className="size-3" strokeWidth={2.8} />
            </Glyph>
          }
          title="14 reminders sent"
          trailing={<Pill tone="#1F9D55">Done</Pill>}
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Phone className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="3 need a call"
          trailing={
            <Pill tone={c.accent} solid>
              Today
            </Pill>
          }
          onTap={() => go(2)}
          label="See who needs a call"
          chevron
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Sparkles className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="9 rebooked"
          trailing={<span className="tabular-nums">64%</span>}
        />
      </ListGroup>
    </AppCanvas>
  )
}

function ProphyChart({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [tooth, setTooth] = useChoice('prophy.tooth', 12)
  // a chart where nothing can be marked is a picture of a chart
  const [flagged, setFlagged] = useScreenState<Array<number>>(
    'prophy.flagged',
    [3, 12],
  )

  const upper = [18, 17, 16, 15, 14, 13, 12, 11]
  const lower = [48, 47, 46, 45, 44, 43, 42, 41]

  const ToothRow = ({ teeth, offset }: { teeth: number[]; offset: number }) => (
    <div className="grid grid-cols-8 gap-1">
      {teeth.map((t, i) => {
        const idx = offset + i
        const on = flagged.includes(idx)
        const sel = tooth === idx
        return (
          <Tap
            key={t}
            press={false}
            ripple={c.accent}
            label={`Tooth ${t}`}
            onTap={() => {
              setTooth(idx)
              setFlagged((cur) =>
                cur.includes(idx)
                  ? cur.filter((n) => n !== idx)
                  : [...cur, idx],
              )
            }}
          >
            <span
              className="flex aspect-[3/4] flex-col items-center justify-center rounded-[5px] text-[7.5px] font-extrabold transition-all"
              style={{
                background: on
                  ? '#F5333B'
                  : sel
                    ? c.accent
                    : `color-mix(in srgb, ${c.accent2} 30%, transparent)`,
                color: on || sel ? '#fff' : 'var(--ink)',
                boxShadow: sel ? `0 0 0 1.5px ${c.accent}` : undefined,
              }}
            >
              {t}
            </span>
          </Tap>
        )
      })}
    </div>
  )

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <NavBar
        back="Recall"
        title="Sarah Malik"
        onBack={() => go(0)}
        right="Save"
      />

      <div className="mb-3 px-[1.05rem]">
        <Card className="space-y-1.5 p-3">
          <p
            className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: 'var(--ink2)' }}
          >
            Upper right &rarr; left
          </p>
          <ToothRow teeth={upper} offset={0} />
          <div className="py-0.5">
            <span
              className="block h-px"
              style={{ background: 'var(--hair)' }}
            />
          </div>
          <ToothRow teeth={lower} offset={8} />
          <p className="pt-1 text-[8px]" style={{ color: 'var(--ink2)' }}>
            Tap a tooth to flag it. {flagged.length} flagged.
          </p>
        </Card>
      </div>

      <ListGroup header="Notes on this visit">
        <Row
          leading={
            <Glyph tone="#F5333B" soft>
              !
            </Glyph>
          }
          title="Distal caries suspected"
          trailing={<Pill tone="#F5333B">Flag</Pill>}
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Check className="size-3" strokeWidth={3} />
            </Glyph>
          }
          title="Scale & polish completed"
        />
      </ListGroup>
    </AppCanvas>
  )
}

function ProphyDay({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [chair, setChair] = useChoice('prophy.chair', 0)
  const chairs = [
    {
      name: 'Surgery 1',
      who: 'Dr Ahmed',
      slots: [
        { t: '09:00', p: 'Sarah Malik', kind: 'Exam' },
        { t: '10:00', p: 'Tom Reilly', kind: 'Scale' },
        { t: '11:15', p: 'Open', kind: '' },
      ],
    },
    {
      name: 'Surgery 2',
      who: 'Nadia (hyg.)',
      slots: [
        { t: '09:30', p: 'Priya Kaur', kind: 'Hygiene' },
        { t: '10:45', p: 'Open', kind: '' },
        { t: '12:00', p: 'Alex Nunez', kind: 'Review' },
      ],
    },
  ]
  const active = chairs[chair]

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="Tue 18 Nov" title="Chair day" />
      <Segmented
        items={chairs.map((ch) => ch.name)}
        value={chair}
        onChange={setChair}
      />

      <div className="mb-2 px-[1.05rem]">
        <span className="flex items-center gap-2">
          <Avatar name={active.who} size={22} />
          <span
            className="text-[10px] font-bold"
            style={{ color: 'var(--ink)' }}
          >
            {active.who}
          </span>
        </span>
      </div>

      <div className="space-y-1.5 px-[1.05rem]">
        {active.slots.map((s) => {
          const free = s.p === 'Open'
          return (
            <Tap
              key={s.t}
              ripple={c.accent}
              label={free ? `Fill the ${s.t} gap` : `Open ${s.p}`}
              onTap={() => go(free ? 0 : 1)}
            >
              <span
                className="flex items-center gap-2.5 rounded-xl p-2.5"
                style={{
                  background: free ? 'var(--fill)' : 'var(--card)',
                  boxShadow: free ? undefined : 'var(--shadow)',
                  border: free ? '1px dashed var(--hair)' : undefined,
                }}
              >
                <span
                  className="shrink-0 text-[10px] font-extrabold tabular-nums"
                  style={{ color: free ? 'var(--ink2)' : c.accent }}
                >
                  {s.t}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span
                    className="block truncate text-[11px] font-bold"
                    style={{ color: free ? 'var(--ink2)' : 'var(--ink)' }}
                  >
                    {free ? 'Gap - 45 min' : s.p}
                  </span>
                </span>
                {free ? (
                  <Plus
                    className="size-3.5 shrink-0"
                    style={{ color: c.accent }}
                    strokeWidth={2.8}
                  />
                ) : (
                  <ChevronRight
                    className="size-3 shrink-0 opacity-50"
                    style={{ color: 'var(--ink2)' }}
                    strokeWidth={2.6}
                  />
                )}
              </span>
            </Tap>
          )
        })}
      </div>

      {/* A chair day is measured in chairs, not appointments - so the day
          closes on how full each surgery is and what would fill the rest. */}
      <div className="mt-3 mb-3 px-[1.05rem]">
        <Card className="p-3">
          <p
            className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: 'var(--ink2)' }}
          >
            Chairs today
          </p>
          <div className="mt-2 space-y-2">
            {[
              { room: 'Surgery 1 · Dr Amin', pct: 88 },
              { room: 'Surgery 2 · Hygiene', pct: 64 },
            ].map((r) => (
              <div key={r.room}>
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-[9.5px] font-bold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {r.room}
                  </span>
                  <span
                    className="text-[9px] font-extrabold tabular-nums"
                    style={{ color: c.accent }}
                  >
                    {r.pct}%
                  </span>
                </div>
                <div className="mt-1">
                  <Track pct={r.pct} tone={c.accent} height={4} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ListGroup header="Would fill the 14:15">
        <Row
          leading={<Avatar name="Sarah Malik" size={22} tone="#F0463C" />}
          title="Sarah Malik"
          trailing={
            <Pill tone="#F0463C" solid>
              Overdue
            </Pill>
          }
        />
        <Row
          leading={<Avatar name="Alex Nunez" size={22} tone={c.accent} />}
          title="Alex Nunez"
          trailing={<Pill tone={c.accent}>Offer</Pill>}
        />
      </ListGroup>
    </AppCanvas>
  )
}

function ProphyPlan({ c }: ScreenProps) {
  const [accepted, setAccepted] = useScreenState<Array<string>>('prophy.plan', [
    'Scale & polish',
  ])
  const items = [
    { name: 'Scale & polish', tooth: 'Full arch', price: 65 },
    { name: 'Composite filling', tooth: 'UR6 distal', price: 145 },
    { name: 'Radiograph', tooth: 'UR6', price: 30 },
    { name: 'Fluoride varnish', tooth: 'Full arch', price: 25 },
  ]
  const total = items.reduce((t, i) => t + i.price, 0)
  const done = items
    .filter((i) => accepted.includes(i.name))
    .reduce((t, i) => t + i.price, 0)

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="Sarah Malik" title="Treatment plan" />

      <div className="mb-3 px-[1.05rem]">
        <Card className="p-3">
          <div className="flex items-baseline justify-between">
            <span
              className="text-[10px] font-bold"
              style={{ color: 'var(--ink2)' }}
            >
              Accepted
            </span>
            <span
              className="text-[16.5px] font-extrabold tabular-nums"
              style={{ color: c.accent }}
            >
              £{done} <span style={{ color: 'var(--ink2)' }}>/ £{total}</span>
            </span>
          </div>
          <div className="mt-2">
            <Track pct={(done / total) * 100} height={6} />
          </div>
        </Card>
      </div>

      <ListGroup header="Tap to accept">
        {items.map((i) => {
          const on = accepted.includes(i.name)
          return (
            <Row
              key={i.name}
              active={on}
              onTap={() =>
                setAccepted((cur) =>
                  cur.includes(i.name)
                    ? cur.filter((n) => n !== i.name)
                    : [...cur, i.name],
                )
              }
              label={`${on ? 'Remove' : 'Accept'} ${i.name}`}
              leading={
                <span
                  className="flex size-4 items-center justify-center rounded-full transition-all"
                  style={
                    on
                      ? { background: c.accent, color: 'var(--on-a)' }
                      : { boxShadow: 'inset 0 0 0 1.5px var(--hair)' }
                  }
                >
                  {on ? <Check className="size-2.5" strokeWidth={3.6} /> : null}
                </span>
              }
              title={i.name}
              trailing={<span className="tabular-nums">£{i.price}</span>}
            />
          )
        })}
      </ListGroup>

      {/* A treatment plan is a conversation about money, so the total and the
          way of paying it belong on the plan, not in a letter a week later. */}
      <div className="mb-3 px-[1.05rem]">
        <Card className="p-3">
          <div className="flex items-baseline justify-between">
            <span
              className="text-[9.5px] font-extrabold"
              style={{ color: 'var(--ink)' }}
            >
              Accepted so far
            </span>
            <span
              className="text-[16.5px] font-extrabold tabular-nums"
              style={{ color: c.accent }}
            >
              £
              {accepted.reduce(
                (t, name) =>
                  t + (items.find((i) => i.name === name)?.price ?? 0),
                0,
              )}
            </span>
          </div>
        </Card>
      </div>

      <ListGroup header="Where this plan is">
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Check className="size-3" strokeWidth={2.8} />
            </Glyph>
          }
          title="Discussed chairside"
          trailing={<Pill tone="#1F9D55">Done</Pill>}
        />
        <Row
          leading={
            <Glyph tone={c.accent} soft>
              <Clock className="size-3" strokeWidth={2.4} />
            </Glyph>
          }
          title="Awaiting the filling slot"
          trailing={
            <Pill tone={c.accent} solid>
              Book
            </Pill>
          }
        />
      </ListGroup>
    </AppCanvas>
  )
}

/* ============================== LEADR ============================== *
 * Pipeline board. Stages scroll sideways under a header that does not move,
 * so the stage being read never leaves the deals inside it.
 * =================================================================== */

/**
 * The board.
 *
 * `total` is written rather than summed off the deals: the values are display
 * strings with a currency and a k in them, and parsing money back out of its
 * own formatting to add it up is how a board ends up saying £0.
 */
const LEADR_STAGES = [
  {
    name: 'New',
    total: '£16.5k',
    deals: [
      { co: 'Northwind Ltd', v: '£12k', who: 'Dana P.', age: 1 },
      { co: 'Halcyon Foods', v: '£4.5k', who: 'Ravi S.', age: 2 },
    ],
  },
  {
    name: 'Contacted',
    total: '£34k',
    deals: [
      { co: 'Corley & Sons', v: '£26k', who: 'Dana P.', age: 9 },
      { co: 'Bright Metals', v: '£8k', who: 'Ravi S.', age: 3 },
    ],
  },
  {
    name: 'Proposal',
    total: '£41k',
    deals: [{ co: 'Pearcefield', v: '£41k', who: 'Dana P.', age: 4 }],
  },
]

function LeadrPipeline({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [open, setOpen] = useChoice('leadr.deal', 0)

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="Q4 · 5 people" title="Pipeline" />

      {/*
        The board scrolls sideways; the header above it does not.

        The columns used to be 125px, which was fine when the kit was drawn a
        third smaller. At the current type scale a company name and a value no
        longer fit side by side in one, so every third card clipped mid-word
        and the stage after it was a sliver. They are wide enough to hold their
        own contents now, and the rail still shows a slice of the next stage,
        which is the only thing that says the board goes on.
      */}
      <Rail>
        {LEADR_STAGES.map((stage, si) => (
          <div
            key={stage.name}
            className="w-[158px] shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* A stage header is worth more than a count. Five deals in
                Proposal and five in New are not the same pipeline, and the
                only number that tells them apart is the money. */}
            <div className="mb-2 px-0.5">
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className="text-[9px] font-extrabold uppercase tracking-[0.1em]"
                  style={{ color: si === 0 ? c.accent : 'var(--ink2)' }}
                >
                  {stage.name}
                </span>
                <span
                  className="text-[9px] font-extrabold tabular-nums"
                  style={{ color: 'var(--ink)' }}
                >
                  {stage.total}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className="h-[3px] flex-1 rounded-full"
                  style={{
                    background:
                      si === 0
                        ? `linear-gradient(90deg, ${c.accent}, ${c.accent2})`
                        : 'var(--fill)',
                  }}
                />
                <span
                  className="text-[8px] font-bold tabular-nums"
                  style={{ color: 'var(--ink2)' }}
                >
                  {stage.deals.length}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {stage.deals.map((d, di) => {
                const key = si * 10 + di
                const cold = d.age >= 7
                return (
                  <Tap
                    key={d.co}
                    ripple={c.accent}
                    label={`Open ${d.co}`}
                    onTap={() => {
                      setOpen(key)
                      go(1)
                    }}
                  >
                    <span
                      className="relative block overflow-hidden rounded-xl p-2.5 text-left transition-all"
                      style={{
                        background: 'var(--card)',
                        boxShadow:
                          open === key
                            ? `inset 0 0 0 1px ${c.accent}, var(--shadow)`
                            : 'inset 0 0 0 0.5px var(--hair)',
                      }}
                    >
                      {/* the one deal that is dying wears the studio red down
                          its edge; everything healthy wears the stage colour */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full"
                        style={{ background: cold ? '#F5333B' : c.accent }}
                      />

                      <span className="block pl-2">
                        <span
                          className="block truncate text-[10px] font-extrabold"
                          style={{ color: 'var(--ink)' }}
                        >
                          {d.co}
                        </span>

                        <span
                          className="mt-0.5 block text-[15px] font-extrabold leading-none tabular-nums"
                          style={{ color: cold ? '#F5333B' : c.accent }}
                        >
                          {d.v}
                        </span>

                        <span className="mt-2 flex items-center gap-1.5">
                          <Avatar name={d.who} size={15} tone={c.accent2} />
                          <span
                            className="truncate text-[8.5px] font-semibold"
                            style={{ color: cold ? '#F5333B' : 'var(--ink2)' }}
                          >
                            {cold ? `quiet ${d.age}d` : `${d.age}d ago`}
                          </span>
                        </span>
                      </span>
                    </span>
                  </Tap>
                )
              })}
            </div>
          </div>
        ))}
      </Rail>

      {/* The board says where every deal is. Only this says which of them is
          dying - which is the entire reason this product exists, and it was
          the one thing the screen did not show. */}
      <ListGroup header="Gone quiet">
        <Row
          onTap={() => {
            setOpen(10)
            go(1)
          }}
          label="Open Corley & Sons"
          chevron
          leading={
            <Glyph tone="#F5333B" soft>
              <Clock className="size-3" strokeWidth={2.6} />
            </Glyph>
          }
          title="Corley & Sons"
          trailing={
            <Pill tone="#F5333B" solid>
              £26k
            </Pill>
          }
        />
        <Row
          onTap={() => go(2)}
          label="Open the Northwind nudge"
          chevron
          leading={
            <Glyph tone={c.accent} soft>
              <Clock className="size-3" strokeWidth={2.6} />
            </Glyph>
          }
          title="Northwind Ltd"
          trailing={<span className="tabular-nums">£12k</span>}
        />
      </ListGroup>

      <div className="mb-3 px-[1.05rem]">
        <Card className="flex items-center justify-around p-3">
          <Stat n="£91.5k" label="Open" />
          <span className="h-7 w-px" style={{ background: 'var(--hair)' }} />
          <Stat n="9" label="Avg days" tone={c.accent} />
          <span className="h-7 w-px" style={{ background: 'var(--hair)' }} />
          <Stat n="3" label="Won" tone={c.accent2} />
        </Card>
      </div>

      <div className="px-[1.05rem]">
        <PrimaryButton label="Add a lead" onTap={() => go(1)}>
          <Plus className="size-3" strokeWidth={3} />
          Add a lead
        </PrimaryButton>
      </div>
    </AppCanvas>
  )
}

function LeadrDeal({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [stage, setStage] = useChoice('leadr.stage', 1)
  const stages = ['New', 'Contacted', 'Proposal', 'Won']
  /*
    A deal record is a thread, and a thread with three entries in it is a
    screenshot. Nine is what nine days of a real deal actually looks like -
    and the reason the "gone quiet" gap in the middle is legible at all.
  */
  const timeline = [
    { t: 'Today · 09:14', what: 'Proposal opened 3 times', kind: 'hot' },
    {
      t: 'Today · 08:02',
      what: 'Forwarded to their finance lead',
      kind: 'mail',
    },
    { t: '2d ago', what: 'Sent pricing PDF', kind: 'mail' },
    { t: '4d ago', what: 'Left a voicemail', kind: 'call' },
    { t: '6d ago', what: 'Nudge fired - no reply', kind: 'call' },
    { t: '9d ago', what: 'Discovery call · 34 min', kind: 'call' },
  ]

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <NavBar
        back="Pipeline"
        title="Corley & Sons"
        onBack={() => go(0)}
        right="Edit"
      />

      <div className="mb-3 px-[1.05rem]">
        <Card className="p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name="Corley Sons" size={32} />
            <div className="min-w-0 flex-1">
              <p
                className="text-[12.5px] font-extrabold"
                style={{ color: 'var(--ink)' }}
              >
                Corley &amp; Sons
              </p>
              <p className="text-[9px]" style={{ color: 'var(--ink2)' }}>
                Dana P.
              </p>
            </div>
            <span
              className="text-[19px] font-extrabold tabular-nums"
              style={{ color: c.accent }}
            >
              £26k
            </span>
          </div>

          {/* the stage stepper: the one control that moves the deal */}
          <div className="mt-3 flex gap-1">
            {stages.map((s, i) => (
              <Tap
                key={s}
                press={false}
                ripple={c.accent}
                label={`Move to ${s}`}
                onTap={() => setStage(i)}
                className="flex-1"
              >
                <span className="block">
                  <span
                    className="block h-1 rounded-full transition-colors"
                    style={{
                      background:
                        i <= stage
                          ? i === 3
                            ? c.accent2
                            : c.accent
                          : 'var(--fill)',
                    }}
                  />
                  <span
                    className="mt-1 block text-center text-[7.5px] font-bold"
                    style={{ color: i === stage ? c.accent : 'var(--ink2)' }}
                  >
                    {s}
                  </span>
                </span>
              </Tap>
            ))}
          </div>
        </Card>
      </div>

      {/* the thread, on a real vertical rail */}
      <div className="relative px-[1.05rem]">
        <p
          className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: 'var(--ink2)' }}
        >
          Activity
        </p>
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-[1.42rem] top-7 w-px"
          style={{ background: 'var(--hair)' }}
        />
        <div className="space-y-2.5">
          {timeline.map((e) => (
            <div key={e.what} className="flex items-start gap-2.5">
              <span
                className="relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: e.kind === 'hot' ? c.accent : 'var(--card)',
                  boxShadow:
                    e.kind === 'hot'
                      ? undefined
                      : 'inset 0 0 0 1px var(--hair)',
                  color: e.kind === 'hot' ? '#fff' : 'var(--ink2)',
                }}
              >
                {e.kind === 'hot' ? (
                  <Flame className="size-2" strokeWidth={2.8} />
                ) : e.kind === 'mail' ? (
                  <ArrowUpRight className="size-2" strokeWidth={3} />
                ) : (
                  <Phone className="size-2" strokeWidth={3} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[10.5px] font-bold"
                  style={{ color: 'var(--ink)' }}
                >
                  {e.what}
                </span>
                <span
                  className="block text-[8px]"
                  style={{ color: 'var(--ink2)' }}
                >
                  {e.t}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 px-[1.05rem]">
        <PrimaryButton label="Log the next follow-up" onTap={() => go(2)}>
          Set a nudge
        </PrimaryButton>
      </div>

      {/* The rest of what a five-person team keeps in its head: who is
          actually deciding, what has been promised, and the one date that
          makes the whole deal urgent or not. */}
      <ListGroup header="Who’s in it">
        <Row
          leading={<Avatar name="Helen Corley" size={26} tone={c.accent} />}
          title="Helen Corley"
          trailing={
            <Pill tone={c.accent} solid>
              Champion
            </Pill>
          }
        />
        <Row
          leading={<Avatar name="Raj Menon" size={26} tone={c.accent2} />}
          title="Raj Menon"
          trailing={<Pill tone={c.accent2}>New</Pill>}
        />
      </ListGroup>

      <ListGroup header="The shape of it">
        <Row title="Value" trailing="£26,000" />
        <Row title="Expected close" trailing="12 Dec" />
        <Row title="Source" trailing="Inbound · site form" />
        <Row title="Last touched" trailing="9 days ago" />
      </ListGroup>
    </AppCanvas>
  )
}

function LeadrNudges({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [cleared, setCleared] = useScreenState<Array<string>>(
    'leadr.cleared',
    [],
  )
  const nudges = [
    {
      co: 'Corley & Sons',
      why: 'No contact for 9 days',
      due: 'Now',
      hot: true,
    },
    {
      co: 'Halcyon Foods',
      why: 'Proposal expires Friday',
      due: 'Today',
      hot: true,
    },
    {
      co: 'Bright Metals',
      why: 'Follow up after the demo',
      due: 'Tomorrow',
      hot: false,
    },
    {
      co: 'Northwind Ltd',
      why: 'Check the budget cycle',
      due: 'Thu',
      hot: false,
    },
  ]
  const shown = nudges.filter((n) => !cleared.includes(n.co))

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle
        title="Nudges"
        right={
          shown.length ? (
            <Pill tone="#F5333B" solid>
              {shown.filter((n) => n.hot).length} hot
            </Pill>
          ) : undefined
        }
      />

      <ListGroup>
        {shown.map((n) => (
          <Row
            key={n.co}
            onTap={() => go(1)}
            label={`Open ${n.co}`}
            leading={
              <Glyph tone={n.hot ? '#F5333B' : c.accent} soft={!n.hot}>
                <MapPin className="size-3" strokeWidth={2.4} />
              </Glyph>
            }
            title={n.co}
            trailing={
              <Tap
                press={false}
                ripple={c.accent}
                label={`Clear the ${n.co} nudge`}
                onTap={() => setCleared((cur) => [...cur, n.co])}
                className="!w-auto"
              >
                <span
                  className="flex size-5 items-center justify-center rounded-full"
                  style={{ background: 'var(--fill)', color: 'var(--ink2)' }}
                >
                  <Check className="size-2.5" strokeWidth={3.4} />
                </span>
              </Tap>
            }
          />
        ))}
        {shown.length === 0 ? (
          <div className="px-3 py-7 text-center">
            <p className="text-[11px] font-bold" style={{ color: c.accent }}>
              Nothing is going cold.
            </p>
          </div>
        ) : null}
      </ListGroup>

      {/* A nudge that fires once and gives up is a reminder. The escalation is
          the product, so the screen has to show it. */}
      <div className="mb-3 px-[1.05rem]">
        <Card className="p-3">
          <p
            className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: 'var(--ink2)' }}
          >
            How a nudge escalates
          </p>
          <div className="mt-2.5 space-y-2">
            {[
              { n: 'Day 3', what: 'A quiet badge', on: true },
              { n: 'Day 5', what: 'Push to the owner', on: true },
              { n: 'Day 7', what: 'Top of the list, red', on: true },
              { n: 'Day 10', what: 'Escalates to the team', on: false },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-2.5">
                <span
                  className="w-[38px] shrink-0 text-[8px] font-extrabold tabular-nums"
                  style={{ color: s.on ? c.accent : 'var(--ink2)' }}
                >
                  {s.n}
                </span>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: s.on ? c.accent : 'var(--fill)' }}
                />
                <span className="text-[9.5px]" style={{ color: 'var(--ink)' }}>
                  {s.what}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ListGroup header="Cleared this week">
        <Row
          leading={
            <Glyph tone="#1F9D55" soft>
              <Check className="size-3" strokeWidth={3} />
            </Glyph>
          }
          title="Pearcefield"
          trailing={<Pill tone="#1F9D55">Done</Pill>}
        />
        <Row
          leading={
            <Glyph tone="#1F9D55" soft>
              <Check className="size-3" strokeWidth={3} />
            </Glyph>
          }
          title="Halcyon Foods"
          trailing={<Pill tone="#1F9D55">Done</Pill>}
        />
      </ListGroup>
    </AppCanvas>
  )
}

function LeadrWeek({ c }: ScreenProps) {
  const { go } = usePhoneNav()
  const [day, setDay] = useChoice('leadr.day', 4)
  const bars = [38, 52, 44, 70, 88, 34, 20]
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <AppCanvas c={c} chrome={<TabBar c={c} action={TAB_ACTION[c.slug]} />}>
      <StatusBar />
      <LargeTitle eyebrow="Week 47" title="The week" />

      <div className="mb-3 px-[1.05rem]">
        <Card className="flex items-center justify-around p-3">
          <Stat n="12" label="New" />
          <span className="h-7 w-px" style={{ background: 'var(--hair)' }} />
          <Stat n="9" label="Moved" tone={c.accent} />
          <span className="h-7 w-px" style={{ background: 'var(--hair)' }} />
          <Stat n="3" label="Won" tone={c.accent2} />
        </Card>
      </div>

      <div className="mb-3 px-[1.05rem]">
        <Card className="p-3">
          <p
            className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: 'var(--ink2)' }}
          >
            Touches per day
          </p>
          <div className="mt-2.5 flex h-14 items-end gap-1.5">
            {bars.map((h, i) => (
              <Tap
                key={i}
                press={false}
                ripple={c.accent}
                label={`Show ${labels[i]}`}
                onTap={() => setDay(i)}
                className="flex h-full flex-1 items-end"
              >
                <span
                  data-phone-bar
                  className="block w-full rounded-t transition-colors"
                  style={{
                    height: `${h}%`,
                    background:
                      day === i
                        ? `linear-gradient(to top, ${c.accent}, ${c.accent2})`
                        : 'var(--fill)',
                  }}
                />
              </Tap>
            ))}
          </div>
          <div
            className="mt-1.5 flex justify-between text-[7.5px] font-bold"
            style={{ color: 'var(--ink2)' }}
          >
            {labels.map((l, i) => (
              <span key={i} className="flex-1 text-center">
                {l}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <ListGroup header="Closed this week">
        {[
          { co: 'Pearcefield', v: '£41k' },
          { co: 'Halcyon Foods', v: '£4.5k' },
          { co: 'Bright Metals', v: '£8k' },
        ].map((w) => (
          <Row
            key={w.co}
            onTap={() => go(1)}
            label={`Open ${w.co}`}
            chevron
            leading={
              <Glyph tone={c.accent2}>
                <Check className="size-3" strokeWidth={3.2} />
              </Glyph>
            }
            title={w.co}
            trailing={
              <span className="tabular-nums" style={{ color: c.accent2 }}>
                {w.v}
              </span>
            }
          />
        ))}
      </ListGroup>

      {/* The week is not only what closed. What went quiet in the same seven
          days is the number this product exists to make impossible to miss. */}
      <ListGroup header="Went quiet this week">
        <Row
          onTap={() => go(2)}
          label="Open the Corley & Sons nudge"
          chevron
          leading={
            <Glyph tone="#F5333B" soft>
              <Clock className="size-3" strokeWidth={2.6} />
            </Glyph>
          }
          title="Corley & Sons"
          trailing={
            <Pill tone="#F5333B" solid>
              £26k
            </Pill>
          }
        />
        <Row
          onTap={() => go(2)}
          label="Open the Northwind nudge"
          chevron
          leading={
            <Glyph tone={c.accent} soft>
              <Clock className="size-3" strokeWidth={2.6} />
            </Glyph>
          }
          title="Northwind Ltd"
          trailing={<span className="tabular-nums">£12k</span>}
        />
      </ListGroup>

      <div className="px-[1.05rem]">
        <GhostButton label="See the whole pipeline" onTap={() => go(0)}>
          <ArrowUpRight className="size-2.5" strokeWidth={2.6} />
          Open the pipeline
        </GhostButton>
      </div>
    </AppCanvas>
  )
}

/* ============================= REGISTRY ============================= */

export type ConceptScreen = (props: ScreenProps) => ReactNode

/**
 * Hand the screen the concept as the *app* sees it.
 *
 * The screens reach for `c.accent` two hundred times over - for gradients,
 * filled glyphs, chart bars, ripples. Inside the glass every one of those has
 * to be the app's bright accent on its own ink, while the case-study page
 * around the device keeps the deep accent it needs to set type in on white.
 * One swap here, at the door, rather than a second field threaded through
 * every screen in the file.
 */
const inApp = (S: ConceptScreen): ConceptScreen =>
  function AppScreen({ c }: ScreenProps) {
    return S({ c: appOf(c) })
  }

export const CONCEPT_SCREENS: Record<string, ConceptScreen[]> =
  Object.fromEntries(
    Object.entries({
      fieldly: [FieldlyJob, FieldlyBoard, FieldlyProof, FieldlyWeek],
      stamp: [StampWallet, StampCard, StampRewards, StampNearby],
      slate: [SlateBook, SlateConfirmed, SlateVisits, SlateDesk],
      prophy: [ProphyRecall, ProphyChart, ProphyDay, ProphyPlan],
      leadr: [LeadrPipeline, LeadrDeal, LeadrNudges, LeadrWeek],
    }).map(([slug, screens]) => [slug, screens.map(inApp)]),
  )
