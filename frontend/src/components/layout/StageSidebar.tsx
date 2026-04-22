'use client'
import { cn, getStageLabel } from '@/lib/utils'
import {
  MessageSquare, LayoutGrid, CheckSquare, GitBranch,
  Monitor, FileCode, FlaskConical, ChevronRight
} from 'lucide-react'
import { Project } from '@/store/projectStore'

const stageIcons = [MessageSquare, LayoutGrid, CheckSquare, GitBranch, Monitor, FileCode, FlaskConical]
const stageColors = [
  'text-violet-400 bg-violet-400/10',
  'text-blue-400 bg-blue-400/10',
  'text-cyan-400 bg-cyan-400/10',
  'text-emerald-400 bg-emerald-400/10',
  'text-yellow-400 bg-yellow-400/10',
  'text-orange-400 bg-orange-400/10',
  'text-red-400 bg-red-400/10',
]

interface Props {
  project: Project
  currentStage: number
  onStageClick: (stage: number) => void
}

function getStageStatus(project: Project, stageNum: number): 'completed' | 'active' | 'locked' {
  const stageKey = `stage${stageNum}` as keyof Project
  const stageData = project[stageKey] as any
  if (stageData?.status === 'completed') return 'completed'
  if (stageNum <= project.current_stage) return 'active'
  return 'locked'
}

export function StageSidebar({ project, currentStage, onStageClick }: Props) {
  return (
    <aside className="w-64 border-r border-border/40 bg-card/30 flex flex-col h-full">
      <div className="p-4 border-b border-border/40">
        <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider">
          Pipeline Stages
        </h2>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((num) => {
          const Icon = stageIcons[num - 1]
          const colorClass = stageColors[num - 1]
          const status = getStageStatus(project, num)
          const isActive = num === currentStage
          const isLocked = status === 'locked'

          return (
            <button
              key={num}
              onClick={() => !isLocked && onStageClick(num)}
              disabled={isLocked}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group',
                isActive && 'bg-forge-500/10 border border-forge-500/20',
                !isActive && !isLocked && 'hover:bg-accent',
                isLocked && 'opacity-40 cursor-not-allowed',
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">S{num}</span>
                  {status === 'completed' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  )}
                  {isActive && status !== 'completed' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-forge-400 animate-pulse flex-shrink-0" />
                  )}
                </div>
                <p className={cn('text-sm font-medium truncate', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
                  {getStageLabel(num)}
                </p>
              </div>

              {isActive && <ChevronRight className="w-4 h-4 text-forge-400 flex-shrink-0" />}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border/40">
        <div className="bg-secondary rounded-xl p-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round((project.current_stage / 7) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forge-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(project.current_stage / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
