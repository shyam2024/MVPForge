'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, FileCode, CheckCircle, ArrowRight, AlertTriangle, FolderTree, List, Edit3, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { stage6Api } from '@/lib/api'
import { Project } from '@/store/projectStore'
import { cn, getErrorMessage } from '@/lib/utils'

interface Props {
  project: Project
  onUpdate: (project: Project) => void
}

type Tab = 'tasks' | 'directory' | 'validation'

function DirectoryNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [open, setOpen] = useState(depth < 2)
  if (!node) return null
  const isDir = node.type === 'dir' || node.children
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        onClick={() => isDir && setOpen(!open)}
        className={cn('flex items-center gap-2 py-1 text-sm cursor-pointer hover:text-foreground transition-colors', isDir ? 'text-foreground font-medium' : 'text-muted-foreground')}
      >
        <span>{isDir ? (open ? '📂' : '📁') : '📄'}</span>
        <span className="font-mono text-xs">{node.name}</span>
        {node.purpose && <span className="text-xs text-muted-foreground truncate">— {node.purpose}</span>}
      </div>
      {isDir && open && node.children?.map((child: any, i: number) => (
        <DirectoryNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export function Stage6MasterPlan({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false)
  const [validating, setValidating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const stage = project.stage6
  const isCompleted = stage?.status === 'completed'
  const validation = stage?.validation

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await stage6Api.generate(project.id)
      onUpdate(res.data)
      toast.success('Master plan generated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const res = await stage6Api.validate(project.id)
      onUpdate(res.data)
      const v = res.data.stage6?.validation
      if (v?.is_valid) toast.success('Validation passed!')
      else toast.error(`${v?.errors?.length} validation errors found`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setValidating(false)
    }
  }

  const handleSaveTask = async (taskId: string) => {
    try {
      const res = await stage6Api.editTask(project.id, taskId, editValues)
      onUpdate(res.data)
      setEditingTask(null)
      setEditValues({})
      toast.success('Task updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await stage6Api.confirm(project.id)
      onUpdate(res.data)
      toast.success('Master plan confirmed! Ready for The Forge.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <FileCode className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="font-display font-bold text-2xl">Implementation Strategy</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          AI will map every user story to technical tasks, file paths, and create a full directory structure.
        </p>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium transition-all">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
          {generating ? 'Generating Plan...' : 'Generate Master Plan'}
        </button>
      </div>
    )
  }

  const tasks: any[] = stage.tasks || []
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const sortedTasks = [...tasks].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4))

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: List },
    { id: 'directory', label: 'Directory', icon: FolderTree },
    { id: 'validation', label: 'Validation', icon: AlertTriangle },
  ] as const

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-display font-bold text-xl">Master Build Manifest</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.length} tasks • Full editing allowed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isCompleted && (
            <button onClick={handleValidate} disabled={validating} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-accent text-sm font-medium transition-all">
              {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Validate
            </button>
          )}
          {!isCompleted && validation?.is_valid && (
            <button onClick={handleConfirm} disabled={confirming} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all">
              {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              Confirm & Proceed
            </button>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle className="w-4 h-4" />Locked</div>
          )}
        </div>
      </div>

      {/* Validation banner */}
      {validation && !validation.is_valid && (
        <div className="flex-shrink-0 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Validation Errors ({validation.errors?.length})</p>
            {validation.errors?.slice(0, 3).map((e: string, i: number) => (
              <p key={i} className="text-xs text-muted-foreground mt-1">{e}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40 flex-shrink-0">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all', activeTab === tab.id ? 'border-orange-400 text-orange-400' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'validation' && validation?.errors?.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{validation.errors.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {sortedTasks.map((task: any) => {
              const isEditing = editingTask === task.id
              return (
                <div key={task.id} className="card-glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0 mt-0.5',
                      task.priority === 'critical' ? 'bg-red-400/10 text-red-400' :
                      task.priority === 'high' ? 'bg-orange-400/10 text-orange-400' :
                      task.priority === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {task.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            defaultValue={task.title}
                            onChange={(e) => setEditValues(p => ({ ...p, title: e.target.value }))}
                            className="w-full px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-orange-400"
                          />
                          <input
                            defaultValue={task.file_path}
                            onChange={(e) => setEditValues(p => ({ ...p, file_path: e.target.value }))}
                            placeholder="File path"
                            className="w-full px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-mono outline-none focus:border-orange-400"
                          />
                          <textarea
                            defaultValue={task.description}
                            onChange={(e) => setEditValues(p => ({ ...p, description: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs outline-none focus:border-orange-400 resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveTask(task.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-medium">
                              <Save className="w-3 h-3" /> Save
                            </button>
                            <button onClick={() => setEditingTask(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium">
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold">{task.title}</p>
                          <p className="text-xs font-mono text-orange-400/80 mt-0.5">{task.file_path}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>⏱ {task.estimated_hours}h</span>
                            <span className="capitalize">{task.component_type}</span>
                            {task.api_mapping?.length > 0 && <span>🔗 {task.api_mapping[0]}</span>}
                          </div>
                        </>
                      )}
                    </div>
                    {!isCompleted && !isEditing && (
                      <button onClick={() => { setEditingTask(task.id); setEditValues({}) }} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="card-glass rounded-xl p-5">
            <DirectoryNode node={stage.directory_structure} />
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="space-y-3">
            {validation?.errors?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">Errors</h3>
                {validation.errors.map((e: string, i: number) => (
                  <div key={i} className="flex gap-2 p-3 rounded-xl bg-red-400/5 border border-red-400/20 mb-2">
                    <span className="text-red-400 flex-shrink-0">✗</span>
                    <p className="text-sm text-muted-foreground">{e}</p>
                  </div>
                ))}
              </div>
            )}
            {validation?.warnings?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Warnings</h3>
                {validation.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex gap-2 p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20 mb-2">
                    <span className="text-yellow-400 flex-shrink-0">⚠</span>
                    <p className="text-sm text-muted-foreground">{w}</p>
                  </div>
                ))}
              </div>
            )}
            {validation?.is_valid && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-400/5 border border-green-400/30">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-400 font-medium">All validation checks passed!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
