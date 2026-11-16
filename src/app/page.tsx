import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Bot,
  Building2,
  Check,
  ChevronRight,
  FileSearch,
  Headphones,
  LifeBuoy,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';

const features = [
  {
    icon: <Bot className="h-5 w-5" />,
    title: 'AI healthcare support chatbot',
    description: 'Help patients find hospital services, visiting hours, appointment steps, and registration guidance.',
  },
  {
    icon: <Workflow className="h-5 w-5" />,
    title: 'Automatic ticket generation',
    description: 'When approved information is not enough, create a ticket with the patient question and chat context.',
  },
  {
    icon: <LockKeyhole className="h-5 w-5" />,
    title: 'Secure multi-tenant workspaces',
    description: "Keep each hospital's accounts, staff, conversations, tickets, and approved knowledge separate.",
  },
  {
    icon: <FileSearch className="h-5 w-5" />,
    title: 'Approved knowledge base',
    description: 'Manage support tickets, customer history, and your team’s reference material in one place.',
  },
];

const additionalFeatures = [
  {
    icon: <Activity className="h-5 w-5" />,
    title: 'Admin operations dashboard',
    description: 'Monitor users, conversations, ticket outcomes, response times, and support activity.',
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    title: 'Human support escalation',
    description: 'Agents work assigned tickets, respond to patients, set priorities, and escalate unresolved issues.',
  },
];

const steps = [
  ['Connect your knowledge', 'Add the policies and help content your support team trusts.'],
  ['Let AI handle the first response', 'Customers get a contextual answer with clear source references.'],
  ['Bring in a person when needed', 'Route unresolved requests to the right team with the conversation attached.'],
];

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    summary: 'A focused workspace for a small team getting started.',
    features: ['Customer support inbox', 'Knowledge-backed AI chat', 'Ticket tracking'],
  },
  {
    name: 'Team',
    price: 'Contact us',
    summary: 'More control and collaboration for growing support teams.',
    features: ['Everything in Starter', 'Team roles and analytics', 'Tenant knowledge management'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Let’s talk',
    summary: 'A tailored setup for complex support operations.',
    features: ['Tenant-specific configuration', 'Advanced access controls', 'Deployment planning'],
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white">
        <div className="absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(#c4b5fd_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100">
              <Sparkles className="h-3.5 w-3.5" />
              AI support, grounded in your knowledge
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Intelligent Support. <span className="bg-gradient-to-r from-violet-300 to-cyan-200 bg-clip-text text-transparent">Powered by AI.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Resolve everyday questions faster with helpful AI, trusted sources, and a seamless handoff to your support team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-50">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Log in <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Tenant-aware access</span>
              <span className="inline-flex items-center gap-1.5"><FileSearch className="h-4 w-4 text-cyan-200" /> Verifiable sources</span>
              <span className="inline-flex items-center gap-1.5"><Headphones className="h-4 w-4 text-violet-200" /> Human support</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <div className="relative mb-4 h-48 overflow-hidden rounded-3xl border border-white/15 shadow-2xl shadow-black/25 sm:h-56">
              <Image src="/images/care-team.svg" alt="Care professionals working together in a bright modern clinic" fill priority sizes="(max-width: 1024px) 90vw, 40vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                <div><p className="text-xs font-medium text-cyan-100">Care that keeps moving</p><p className="mt-1 text-lg font-semibold text-white">Your team, in sync.</p></div>
                <span className="rounded-full border border-white/20 bg-slate-950/35 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur">Human + AI support</span>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-slate-900/70 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-3 pb-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-400"><Bot className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold">Support assistant</p>
                    <p className="text-[11px] text-slate-400">Knowledge-backed responses</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Ready
                </span>
              </div>
              <div className="space-y-4 p-3 sm:p-5">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-sm text-white shadow-lg shadow-indigo-950/30">
                  Where can I find the information I need?
                </div>
                <div className="flex max-w-[92%] gap-3 rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200"><Sparkles className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm leading-6 text-slate-200">I found a relevant answer in your organization&apos;s approved support guide. Here&apos;s the summary and the source it came from.</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1.5 text-[10px] font-medium text-cyan-100">
                      <FileSearch className="h-3.5 w-3.5" /> Support guide · section 2
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                  <span className="flex-1 text-xs text-slate-500">Ask a question…</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"><ArrowUpRight className="h-4 w-4" /></span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 border-t border-white/10 px-3 py-3 text-[10px] text-slate-400">
                <LockKeyhole className="h-3.5 w-3.5" /> Your workspace stays private to your organization
              </div>
            </div>
          </div>
        </div>
        <a href="#features" aria-label="Scroll to features" className="mx-auto mb-7 hidden w-fit text-white/50 transition hover:text-white lg:block"><ArrowDown className="h-5 w-5" /></a>
      </section>

      <section id="features" className="scroll-mt-20 bg-slate-50 py-20 dark:bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-violet-300">Built for better support</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">One secure workspace for every step of support.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Bring automation and human expertise together without losing the trust and context customers need.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...features, ...additionalFeatures].map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-violet-200">{feature.icon}</div>
                <h3 className="mt-5 text-base font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-violet-300">How it works</p>
            <h2 className="mt-3 max-w-lg text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">From a customer question to a useful answer.</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">A practical workflow that keeps your knowledge, AI, and support team connected at every step.</p>
            <Link href="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 dark:text-violet-300">
              Explore your workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {steps.map(([title, description], index) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-700 text-sm font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 bg-slate-50 py-20 dark:bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-violet-300">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Start small. Scale with your team.</h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Choose a workspace that fits your support operation. Contact us for deployment and billing details.</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`rounded-2xl border p-6 shadow-sm ${plan.highlighted ? 'border-indigo-600 bg-white ring-4 ring-indigo-600/10 dark:bg-slate-900' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{plan.name}</h3>
                <p className="mt-3 text-2xl font-bold tracking-tight text-indigo-800 dark:text-violet-200">{plan.price}</p>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.summary}</p>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />{feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${plan.highlighted ? 'bg-indigo-700 text-white hover:bg-indigo-800' : 'border border-slate-300 text-slate-800 hover:border-indigo-400 hover:text-indigo-800 dark:border-slate-600 dark:text-slate-100'}`}>
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-gradient-to-br from-indigo-950 to-violet-900 p-8 text-white sm:p-12 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><LifeBuoy className="h-5 w-5 text-violet-200" /></div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight">Let’s make support feel effortless.</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100">Talk with us about your support workflows, tenant setup, or knowledge requirements.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col">
              <a href="mailto:support@healthsupport.io" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-violet-50">
                Contact support <MessageSquareText className="h-4 w-4" />
              </a>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-slate-400">
          <p>© 2026 MediCareRAG. AI-powered support for organizations.</p>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-indigo-700 dark:hover:text-violet-300">Log in</Link>
            <a href="mailto:support@healthsupport.io" className="hover:text-indigo-700 dark:hover:text-violet-300">Contact</a>
            <Link href="/register" className="hover:text-indigo-700 dark:hover:text-violet-300">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
