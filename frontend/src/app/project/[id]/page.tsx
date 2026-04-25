'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useAuth'
import { useProjectStore } from '@/store/projectStore'
import { Navbar } from '@/components/layout/Navbar'
import { StageSidebar } from '@/components/layout/StageSidebar'
import { Stage1Discovery } from '@/components/stages/Stage1Discovery'
import { Stage2Features } from '@/components/stages/Stage2Features'
import { Stage3Backlog } from '@/components/stages/Stage3Backlog'
import { Stage4Architecture } from '@/components/stages/Stage4Architecture'
import { Stage5UIPrototyping } from '@/components/stages/Stage5UIPrototyping'
import { Stage6MasterPlan } from '@/components/stages/Stage6MasterPlan'
import { Stage7Forge } from '@/components/stages/Stage7Forge'
import { Loader2, ArrowLeft } from 'lucide-react'
import { getStageLabel } from '@/lib/utils'
import Link from 'next/link'

export default function ProjectPage() {
  const { isAuthenticated } = useRequireAuth()
  const params = useParams()
  const projectId = params.id as string
  const { currentProject, fetchProject, updateCurrentProject, isLoading } = useProjectStore()
  const [activeStage, setActiveStage] = useState(1)

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject(projectId)
    }
  }, [isAuthenticated, projectId, fetchProject])

  useEffect(() => {
    if (currentProject) {
      setActiveStage(currentProject.current_stage)
    }
  }, [currentProject?.id]) // only on initial load

  if (!isAuthenticated) return null

  if (isLoading && !currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forge-400" />
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Link href="/dashboard" className="text-forge-400 hover:underline">Back to dashboard</Link>
        </div>
      </div>
    )
  }

  const renderStage = () => {
    const props = { project: currentProject, onUpdate: updateCurrentProject }
    switch (activeStage) {
      case 1: return <Stage1Discovery {...props} />
      case 2: return <Stage2Features {...props} />
      case 3: return <Stage3Backlog {...props} />
      case 4: return <Stage4Architecture {...props} />
      case 5: return <Stage5UIPrototyping {...props} />
      case 6: return <Stage6MasterPlan {...props} />
      case 7: return <Stage7Forge {...props} />
      default: return <Stage1Discovery {...props} />
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1 min-h-0 pt-16">
        <StageSidebar
          project={currentProject}
          currentStage={activeStage}
          onStageClick={setActiveStage}
        />
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Breadcrumb */}
          <div className="px-6 py-3 border-b border-border/40 flex items-center gap-3 flex-shrink-0 bg-background/50">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground truncate max-w-xs">{currentProject.name}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{getStageLabel(activeStage)}</span>
          </div>

          {/* Stage content */}
          <div className="flex-1 min-h-0 p-6">
            {renderStage()}
          </div>
        </main>
      </div>
    </div>
  )
}
