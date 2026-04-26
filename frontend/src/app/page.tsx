'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight, Zap, GitBranch, Code2, Layers,
  CheckCircle, BarChart3, Bot, FlaskConical
} from 'lucide-react'

const stages = [
  { num: 1, label: 'Discovery Gate', desc: 'AI-driven chat to clarify your vision', icon: Bot, color: 'from-forge-500 to-forge-700' },
  { num: 2, label: 'Feature Mapping', desc: 'Extract and toggle epics & features', icon: Layers, color: 'from-zinc-500 to-zinc-700' },
  { num: 3, label: 'Backlog', desc: 'Kanban-based user story management', icon: CheckCircle, color: 'from-neutral-500 to-neutral-700' },
  { num: 4, label: 'Architecture', desc: 'AI-generated system design & ERD', icon: GitBranch, color: 'from-stone-500 to-stone-700' },
  { num: 5, label: 'UI Prototyping', desc: 'Generate and preview HTML screens', icon: BarChart3, color: 'from-forge-400 to-forge-600' },
  { num: 6, label: 'Master Plan', desc: 'Full directory structure & task mapping', icon: Zap, color: 'from-zinc-400 to-zinc-600' },
  { num: 7, label: 'The Forge', desc: 'Generate complete, GitHub-ready code', icon: FlaskConical, color: 'from-neutral-400 to-neutral-600' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forge-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">GenAI Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm px-4 py-2 rounded-lg bg-forge-600 hover:bg-forge-500 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-forge-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-secondary/40 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-tight mb-6">
            Turn your idea into{' '}
            <span className="text-gradient">production code</span>
            {' '}in 7 stages
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            GenAI Assistant transforms a rough idea into a fully-architected, backlog-driven,
            code-generated software project — with human validation at every step.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-forge-600 hover:bg-forge-500 text-white font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:shadow-forge-500/25 hover:-translate-y-0.5"
            >
              Start Building <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border hover:border-forge-500/50 text-foreground font-semibold text-lg transition-all duration-200 hover:bg-accent"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Pipeline stages */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              The 7-Stage Pipeline
            </h2>
            <p className="text-muted-foreground text-lg">
              Each stage builds on the last, creating a coherent, validated project document.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`card-glass rounded-2xl p-6 hover:border-foreground/20 transition-all duration-300 group lg:col-span-2 ${
                  stage.num === 5 ? 'lg:col-start-2' : ''
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stage.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">Stage {stage.num}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{stage.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{stage.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Human-in-the-Loop', desc: 'Every stage requires your approval before progressing. You stay in control.', icon: CheckCircle },
              { title: 'JSON State Machine', desc: 'All project data stored as structured JSON — consistent, auditable, version-safe.', icon: GitBranch },
              { title: 'Production Code', desc: 'Stage 7 generates real, runnable, test-covered code — not pseudocode.', icon: Code2 },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-forge-500/10 border border-forge-500/20 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-forge-400" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card-glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-secondary/30 pointer-events-none" />
            <h2 className="text-4xl font-display font-bold mb-4 relative">
              Ready to build?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 relative">
              Start your first project in minutes. No credit card required.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-forge-600 hover:bg-forge-500 text-white font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-forge-500/30 hover:-translate-y-1 relative"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GenAI Assistant. Built with FastAPI, Next.js & LangChain.
      </footer>
    </div>
  )
}
