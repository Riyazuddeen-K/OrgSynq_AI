import { Link } from 'react-router-dom'
import {
  Moon,
  Sun,
  Users,
  Fingerprint,
  FlaskConical,
  Wand2,
  UserSquare2,
  BarChart3,
  Share2,
  ShieldCheck,
  MessageCircle,
  Zap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Logo from '../components/Logo'

const FEATURES: Array<{ icon: typeof Users; title: string; description: string }> = [
  {
    icon: Users,
    title: 'Employee Directory',
    description: 'A searchable, filterable directory with skills, experience, performance, and risk on every profile.'
  },
  {
    icon: Fingerprint,
    title: 'Digital Twins',
    description: 'A 9-metric cognitive profile per employee — performance, leadership, learning, collaboration, and more.'
  },
  {
    icon: ShieldCheck,
    title: 'Explainable Attrition Risk',
    description: 'Every risk score comes with a plain-language breakdown of why — not a black-box number.'
  },
  {
    icon: FlaskConical,
    title: 'Simulation Engine',
    description: 'Model layoffs, hiring, restructuring, and more before you commit — see the projected impact first.'
  },
  {
    icon: Wand2,
    title: 'Prediction',
    description: 'Describe a project or policy in plain English and get an AI-recommended team, matched by skill and fit.'
  },
  {
    icon: UserSquare2,
    title: 'Placement',
    description: 'Rank external candidates against an open role using skills, experience, and assessment scores.'
  },
  {
    icon: MessageCircle,
    title: '1:1 Meeting Assistant',
    description: "AI-generated talking points for a manager's next 1:1, pulled from real trends — not generic advice."
  },
  {
    icon: BarChart3,
    title: 'Analytics Hub',
    description: 'Workforce composition, department health, performance leaderboards, and a skills radar, at a glance.'
  },
  {
    icon: Share2,
    title: 'Org Network',
    description: 'An interactive org chart built from your real reporting lines, colored by department.'
  }
]

const STEPS = [
  {
    title: 'Add your team',
    description: 'Import or add employees with their skills, experience, and performance data.'
  },
  {
    title: 'Let the AI analyze',
    description: 'Digital twins, attrition risk, and workforce health are computed automatically and update live.'
  },
  {
    title: 'Act with confidence',
    description: 'Get explainable recommendations for teams, hires, retention, and 1:1s — every score comes with reasoning.'
  }
]

export default function Landing() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-[#12131A] dark:text-[#EDEFF7]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-surface-lightborder dark:border-surface-darkborder bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} className="rounded-lg shrink-0" />
            <div>
              <p className="font-display font-semibold leading-tight">OrgSynq AI</p>
              <p className="text-[11px] text-black/45 dark:text-white/40 leading-tight hidden sm:block">Workforce Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-black/70 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-3.5 py-2 rounded-lg text-sm font-semibold bg-signal text-white hover:bg-signal/90 shadow-lg shadow-signal/25 transition-all focus-ring"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-signal/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal/10 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal/10 text-signal text-xs font-medium mb-5">
              <Zap className="h-3 w-3" /> AI-powered workforce intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight">
              Understand your workforce.
              <br />
              <span className="text-signal">Explain every decision.</span>
            </h1>
            <p className="mt-5 text-lg text-black/60 dark:text-white/50 leading-relaxed">
              OrgSynq AI turns raw HR data into live digital twins, explainable attrition risk, and AI-recommended
              team formations — so every workforce decision comes with a reason, not just a score.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-signal text-white font-semibold hover:bg-signal/90 shadow-lg shadow-signal/25 transition-all focus-ring"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="px-5 py-3 rounded-lg font-semibold border border-surface-lightborder dark:border-surface-darkborder hover:bg-black/5 dark:hover:bg-white/5 transition-all focus-ring"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-xs text-black/40 dark:text-white/30">
              No credit card required — sign up and connect your own Firebase project in minutes.
            </p>
          </div>

          {/* Simple stylized dashboard preview */}
          <div className="mt-14 card p-4 md:p-6 max-w-4xl">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-rose/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-teal/60" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Organization Health', value: '91%', color: 'text-teal' },
                { label: 'Burnout Index', value: '44%', color: 'text-amber' },
                { label: 'Flight Risks', value: '3', color: 'text-rose' },
                { label: 'Promotion Ready', value: '13', color: 'text-signal' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-black/[0.03] dark:bg-white/[0.04] p-3">
                  <p className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[11px] text-black/45 dark:text-white/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2 h-28">
              {[60, 75, 45, 88, 52, 70, 40, 65].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-signal/25" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20 border-t border-surface-lightborder dark:border-surface-darkborder">
        <div className="max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold">What is OrgSynq AI?</h2>
          <p className="mt-4 text-black/60 dark:text-white/50 leading-relaxed">
            OrgSynq AI is a workforce intelligence platform for HR teams and people managers. Instead of static
            spreadsheets and once-a-quarter reviews, it keeps a live, explainable picture of your organization —
            who's thriving, who's at risk, who's ready for what's next, and why — updated in real time as your
            data changes.
          </p>
          <p className="mt-3 text-black/60 dark:text-white/50 leading-relaxed">
            Every AI-generated score or recommendation in OrgSynq AI is built to be explained, not just trusted.
            Attrition risk comes with the specific factors behind it. Team recommendations come with reasoning per
            person. Nothing is a black box you have to take on faith.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20 border-t border-surface-lightborder dark:border-surface-darkborder">
        <h2 className="text-2xl md:text-3xl font-display font-bold">Everything you need to run workforce decisions</h2>
        <p className="mt-3 text-black/55 dark:text-white/45 max-w-2xl">
          One platform for the people data, the analysis, and the AI reasoning behind it.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="h-10 w-10 rounded-lg bg-signal/10 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-signal" />
              </div>
              <p className="font-display font-semibold">{f.title}</p>
              <p className="text-sm text-black/55 dark:text-white/45 mt-1.5 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20 border-t border-surface-lightborder dark:border-surface-darkborder">
        <h2 className="text-2xl md:text-3xl font-display font-bold">How it works</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="h-10 w-10 rounded-full bg-signal text-white flex items-center justify-center font-display font-bold mb-4">
                {i + 1}
              </div>
              <p className="font-display font-semibold">{step.title}</p>
              <p className="text-sm text-black/55 dark:text-white/45 mt-1.5 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / security */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20 border-t border-surface-lightborder dark:border-surface-darkborder">
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-signal" />
            <h2 className="text-xl font-display font-bold">Built on your own Firebase project</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Your workforce data lives in your own Firebase project — never a shared third-party database',
              'Role-based access: admins see everything, employees see only their own profile',
              'Sessions are tab-scoped — closing every browser tab signs you out automatically',
              'Every AI-generated score or recommendation is explainable, not a black box'
            ].map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                <p className="text-sm text-black/60 dark:text-white/50">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-24 border-t border-surface-lightborder dark:border-surface-darkborder text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold">Ready to see your workforce clearly?</h2>
        <p className="mt-3 text-black/55 dark:text-white/45">Create an account and connect your Firebase project in minutes.</p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            to="/signup"
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-signal text-white font-semibold hover:bg-signal/90 shadow-lg shadow-signal/25 transition-all focus-ring"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="px-5 py-3 rounded-lg font-semibold border border-surface-lightborder dark:border-surface-darkborder hover:bg-black/5 dark:hover:bg-white/5 transition-all focus-ring"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-lightborder dark:border-surface-darkborder">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} className="rounded-md shrink-0" />
            <span className="text-sm font-display font-semibold">OrgSynq AI</span>
          </div>
          <p className="text-xs text-black/40 dark:text-white/30">Workforce Intelligence Platform</p>
          <div className="flex items-center gap-4 text-xs text-black/45 dark:text-white/40">
            <Link to="/login" className="hover:text-signal">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-signal">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
