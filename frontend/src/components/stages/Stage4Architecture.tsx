'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, GitBranch, Send, CheckCircle, ArrowRight, Server, Database, Globe, Terminal } from 'lucide-react'
import toast from 'react-hot-toast'
import { stage4Api } from '@/lib/api'
import { Project } from '@/store/projectStore'
import { cn, getErrorMessage } from '@/lib/utils'

interface Props {
  project: Project
  onUpdate: (project: Project) => void
}

type Tab = 'tech_stack' | 'api_endpoints' | 'database' | 'diagrams'

export function Stage4Architecture({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [modifyPrompt, setModifyPrompt] = useState('')
  const [modifying, setModifying] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('tech_stack')

  const stage = project.stage4
  const isCompleted = stage?.status === 'completed'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await stage4Api.generate(project.id)
      onUpdate(res.data)
      toast.success('Architecture designed!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleModify = async () => {
    if (!modifyPrompt.trim()) return
    setModifying(true)
    try {
      const res = await stage4Api.modify(project.id, modifyPrompt)
      onUpdate(res.data)
      setModifyPrompt('')
      toast.success('Architecture updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setModifying(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await stage4Api.confirm(project.id)
      onUpdate(res.data)
      toast.success('Architecture confirmed! Moving to UI Prototyping.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl bg-forge-500/10 border border-forge-500/20 flex items-center justify-center">
          <GitBranch className="w-8 h-8 text-forge-500" />
        </div>
        <h2 className="font-display font-bold text-2xl">Architecture Design</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          AI will design your complete system architecture — tech stack, API endpoints, database schema, and ERD.
        </p>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
          {generating ? 'Designing Architecture...' : 'Generate Architecture'}
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'tech_stack', label: 'Tech Stack', icon: Server },
    { id: 'api_endpoints', label: 'API Endpoints', icon: Globe },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'diagrams', label: 'Diagrams', icon: Terminal },
  ] as const

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-display font-bold text-xl">Architecture Design</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isCompleted ? '✅ Architecture locked' : 'Review and refine via prompts only'}
          </p>
        </div>
        {!isCompleted && (
          <button onClick={handleConfirm} disabled={confirming} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-all">
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Confirm Architecture
          </button>
        )}
        {isCompleted && (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Locked
          </div>
        )}
      </div>

      {/* Prompt-only modification */}
      {!isCompleted && (
        <div className="card-glass rounded-xl p-4 flex gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-forge-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Terminal className="w-4 h-4 text-forge-500" />
          </div>
          <div className="flex-1 flex gap-3">
            <input
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleModify()}
              placeholder="Describe modifications (e.g. 'Add Redis for caching', 'Use PostgreSQL instead')..."
              className="flex-1 px-4 py-2 rounded-xl bg-secondary border border-border focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 outline-none text-sm"
            />
            <button onClick={handleModify} disabled={modifying || !modifyPrompt.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-500/80 text-white text-sm font-medium disabled:opacity-50 transition-all">
              {modifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Modify
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
              activeTab === tab.id
                ? 'border-forge-500 text-forge-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'tech_stack' && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stage.tech_stack || {}).map(([category, items]: [string, any]) => (
              <div key={category} className="card-glass rounded-xl p-4">
                <h3 className="text-sm font-semibold capitalize mb-3 text-forge-500">{category.replace('_', ' ')}</h3>
                <div className="flex flex-wrap gap-2">
                  {(items as string[]).map((item: string, i: number) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-secondary border border-border">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api_endpoints' && (
          <div className="space-y-2">
            {(stage.api_endpoints || []).map((ep: any, i: number) => (
              <div key={i} className="card-glass rounded-xl p-4 flex items-start gap-4">
                <span className={cn(
                  'text-xs font-mono font-bold px-2.5 py-1 rounded-lg flex-shrink-0 mt-0.5',
                  ep.method === 'GET' ? 'bg-green-400/10 text-green-400' :
                  ep.method === 'POST' ? 'bg-forge-500/10 text-forge-500' :
                  ep.method === 'PUT' || ep.method === 'PATCH' ? 'bg-yellow-400/10 text-yellow-400' :
                  'bg-red-400/10 text-red-400'
                )}>
                  {ep.method}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-foreground">{ep.path}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ep.description}</p>
                </div>
                {ep.auth_required && (
                  <span className="text-xs bg-forge-400/10 text-forge-400 px-2 py-0.5 rounded-md flex-shrink-0">🔒 Auth</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-4">
            {(stage.database_schema?.entities || []).map((entity: any, i: number) => (
              <div key={i} className="card-glass rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-secondary/60 border-b border-border/40">
                  <h3 className="font-semibold text-forge-500">{entity.name}</h3>
                  <p className="text-xs text-muted-foreground">{entity.collection}</p>
                </div>
                <div className="divide-y divide-border/30">
                  {entity.fields?.map((field: any, j: number) => (
                    <div key={j} className="px-5 py-2.5 flex items-center gap-4">
                      <span className="text-sm font-mono w-40 flex-shrink-0">{field.name}</span>
                      <span className="text-xs text-forge-500 font-mono flex-shrink-0">{field.type}</span>
                      <div className="flex gap-1.5">
                        {field.constraints?.map((c: string, k: number) => (
                          <span key={k} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{c}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'diagrams' && (
          <div className="space-y-4">
            {stage.erd_mermaid && (
              <div className="card-glass rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Entity Relationship Diagram (Mermaid)</h3>
                <pre className="code-block text-xs text-foreground overflow-x-auto">{stage.erd_mermaid}</pre>
              </div>
            )}
            {stage.system_diagram && (
              <div className="card-glass rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">System Architecture Diagram</h3>
                <pre className="code-block text-xs text-foreground overflow-x-auto">{stage.system_diagram}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
