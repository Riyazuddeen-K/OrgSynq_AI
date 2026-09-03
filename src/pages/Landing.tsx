import { useState } from 'react'
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
  Zap,
  ArrowRight,
  CheckCircle2,
  Activity,
  Sparkles,
  Layers,
  HeartPulse,
  Flame,
  PlaneTakeoff,
  Award
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Logo from '../components/Logo'

const FEATURES = [
  {
    icon: Users,
    title: 'Workforce Directory & Telemetry',
    description: 'A searchable, multidimensional directory tracking skills, experience, performance, and real-time burnout trends.'
  },
  {
    icon: Fingerprint,
    title: 'Cognitive Digital Twins',
    description: 'A 9-metric holistic intelligence profile per employee — leadership, collaboration, learning agility, and contribution.'
  },
  {
    icon: ShieldCheck,
    title: 'Explainable Attrition Intelligence',
    description: 'No black-box risk numbers. Every flight risk score breaks down specific causal factors and retention levers.'
  },
  {
    icon: FlaskConical,
    title: 'Scenario Simulation Engine',
    description: 'Simulate layoffs, departmental hiring surges, and structural reorganizations with projected cost and productivity impact.'
  },
  {
    icon: Wand2,
    title: 'Predictive Team Assembly',
    description: 'Describe a project or mission in natural language; get an optimized, skill-balanced cross-functional squad recommendation.'
  },
  {
    icon: UserSquare2,
    title: 'Candidate Placement Scoring',
    description: 'Rank external job applicants objectively against required skill profiles and existing team culture fit.'
  },
  {
    icon: BarChart3,
    title: 'Holistic Analytics Hub',
    description: 'Workforce health distribution, department comparison matrices, skill radars, and remote worker trends.'
  },
  {
    icon: Share2,
    title: 'Dynamic Org Network Visualizer',
    description: 'Interactive reporting hierarchy and network graph mapping cross-departmental collaboration channels.'
  },
  {
    icon: Award,
    title: 'Peer Kudos & Recognition',
    description: 'Build a continuous culture of appreciation with peer awards, badges, and recognition leaderboards.'
  }
]

const STATS = [
  { label: 'Digital Twin Metrics', value: '9D' },
  { label: 'Explainability Guarantee', value: '100%' },
  { label: 'Simulation Accuracy', value: '94%' },
  { label: 'Time to First Insight', value: '< 2m' }
]

export default function Landing() {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'kpi' | 'twins' | 'risk'>('kpi')

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-[#EDEFF7] transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-signal/15 dark:bg-signal/10 blur-[130px]" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-teal/15 dark:bg-teal/10 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-surface-darkcard/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-gradient-to-tr from-signal/20 to-teal/20 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
              <Logo size={28} className="rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display font-bold text-base text-slate-900 dark:text-white">OrgSynq</span>
                <span className="px-1.5 py-0.2 rounded-md bg-signal/15 text-signal text-[10px] font-bold tracking-wider">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Workforce Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus-ring"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus-ring"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-signal to-indigo-600 hover:from-signal-hover hover:to-indigo-700 text-white shadow-lg shadow-signal/25 hover:shadow-signal/40 transition-all focus-ring"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 md:pt-24 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-signal/10 via-indigo-500/10 to-teal/10 border border-signal/20 text-signal text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Workforce Telemetry & Digital Twins</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-[1.1]">
              Understand your workforce.{' '}
              <span className="bg-gradient-to-r from-signal via-indigo-500 to-teal bg-clip-text text-transparent">
                Explain every decision.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              OrgSynq AI transforms organizational data into continuous 9-metric cognitive digital twins, explainable attrition forecasting, and simulated organizational design.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/signup"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-signal to-indigo-600 hover:from-signal-hover hover:to-indigo-700 text-white font-semibold shadow-xl shadow-signal/25 hover:shadow-signal/40 hover:-translate-y-0.5 transition-all focus-ring"
              >
                Launch Workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl font-semibold bg-white/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:-translate-y-0.5 transition-all focus-ring shadow-sm"
              >
                Sign In to Demo
              </Link>
            </div>

            {/* Quick trust strip */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal" />
                <span>Zero configuration needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal" />
                <span>Live Firestore integration</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal" />
                <span>100% Explainable reasoning</span>
              </div>
            </div>
          </div>

          {/* High-Fidelity Interactive Dashboard Preview Mockup */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-signal/30 via-indigo-500/20 to-teal/30 blur-xl opacity-50 dark:opacity-30" />
            <div className="relative card-glass p-4 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-white/[0.1]">
              {/* Window Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/[0.06] mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose/70" />
                  <span className="h-3 w-3 rounded-full bg-amber/70" />
                  <span className="h-3 w-3 rounded-full bg-teal/70" />
                  <span className="ml-2 text-xs font-mono text-slate-400">app.orgsynq.ai/command-center</span>
                </div>
                {/* Simulated Tab Pill Switch */}
                <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('kpi')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'kpi'
                        ? 'bg-white dark:bg-white/15 text-signal font-semibold shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Telemetry Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('twins')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'twins'
                        ? 'bg-white dark:bg-white/15 text-signal font-semibold shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Digital Twin Matrix
                  </button>
                  <button
                    onClick={() => setActiveTab('risk')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeTab === 'risk'
                        ? 'bg-white dark:bg-white/15 text-signal font-semibold shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Attrition Forecasting
                  </button>
                </div>
              </div>

              {/* Mock Dashboard Body */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <div className="p-4 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Health Index</span>
                    <HeartPulse className="h-4 w-4 text-teal" />
                  </div>
                  <p className="text-2xl font-display font-bold text-teal">92.4%</p>
                  <p className="text-[11px] text-teal mt-1 font-medium">↑ +3.1% this cycle</p>
                </div>
                <div className="p-4 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Burnout Index</span>
                    <Flame className="h-4 w-4 text-amber" />
                  </div>
                  <p className="text-2xl font-display font-bold text-amber">42%</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Within safe boundary</p>
                </div>
                <div className="p-4 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Flight Risks</span>
                    <PlaneTakeoff className="h-4 w-4 text-rose" />
                  </div>
                  <p className="text-2xl font-display font-bold text-rose">2</p>
                  <p className="text-[11px] text-rose mt-1 font-medium">Retention playbooks ready</p>
                </div>
                <div className="p-4 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Twin Readiness</span>
                    <Zap className="h-4 w-4 text-signal" />
                  </div>
                  <p className="text-2xl font-display font-bold text-signal">52 Profiles</p>
                  <p className="text-[11px] text-teal mt-1 font-medium">100% telemetry synced</p>
                </div>
              </div>

              {/* Mock Chart Visualization */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Department Performance & Retention Telemetry</span>
                  <span className="px-2 py-0.5 rounded bg-teal/10 text-teal text-[10px] font-bold">LIVE TELEMETRY</span>
                </div>
                <div className="grid grid-cols-8 gap-2 items-end h-28 pt-2">
                  {[
                    { dept: 'Eng', val: 78, color: 'from-signal to-indigo-500' },
                    { dept: 'Prod', val: 84, color: 'from-indigo-500 to-purple-500' },
                    { dept: 'Des', val: 68, color: 'from-pink-500 to-rose' },
                    { dept: 'Mktg', val: 74, color: 'from-amber to-orange-400' },
                    { dept: 'Sales', val: 89, color: 'from-teal to-emerald-400' },
                    { dept: 'HR', val: 81, color: 'from-cyan to-blue-400' },
                    { dept: 'Fin', val: 76, color: 'from-rose to-red-500' },
                    { dept: 'Ops', val: 86, color: 'from-emerald-400 to-teal' }
                  ].map((item) => (
                    <div key={item.dept} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div
                        className={`w-full rounded-t-lg bg-gradient-to-t ${item.color} transition-all duration-300 group-hover:brightness-110 shadow-sm`}
                        style={{ height: `${item.val}%` }}
                      />
                      <span className="text-[10px] font-medium text-slate-400">{item.dept}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="relative z-10 border-y border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-display font-extrabold text-signal tracking-tight">{stat.value}</p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Complete Platform for Intelligent Workforce Decisions
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Say goodbye to guesswork and static spreadsheets. Every recommendation is backed by real metrics and clear reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group card p-6 hover:shadow-card-hover hover:border-signal/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-signal/10 dark:bg-signal/20 text-signal flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-signal group-hover:text-white transition-all duration-300 shadow-sm">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Architecture Banner */}
      <section className="relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-glass p-8 md:p-12 border border-slate-200 dark:border-white/[0.08] bg-gradient-to-r from-signal/5 via-transparent to-teal/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-signal/15 text-signal">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
                  Enterprise-Grade Security on Your Own Firebase
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Your organizational records remain solely in your own cloud infrastructure
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Zero Third-Party Data Sharing — Runs directly on your Firebase Firestore instance.',
                'Role-Based Granular Access Control — Separate admin workspace vs employee view.',
                'Session-Scoped Security — Browser tab termination automatically invalidates auth state.',
                'Explainable AI Reasoning — Every prediction provides transparency into causal factors.'
              ].map((pt, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/[0.02]">
                  <CheckCircle2 className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">{pt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative z-10 py-16 md:py-24 border-t border-slate-200/80 dark:border-white/[0.08] text-center bg-slate-50/50 dark:bg-black/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
            Ready to experience explainable workforce intelligence?
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Test the live platform with instant demo credentials or configure your own workspace in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-signal to-indigo-600 hover:from-signal-hover hover:to-indigo-700 text-white font-semibold shadow-xl shadow-signal/25 hover:shadow-signal/40 hover:-translate-y-0.5 transition-all focus-ring"
            >
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl font-semibold bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all focus-ring"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.08] py-8 relative z-10 bg-white dark:bg-surface-darkcard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size={24} className="rounded-md" />
            <span className="font-display font-bold text-sm text-slate-900 dark:text-white">OrgSynq AI</span>
            <span className="text-xs text-slate-400">· Workforce Intelligence Platform</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} OrgSynq AI. Built with precision.</p>
        </div>
      </footer>
    </div>
  )
}
