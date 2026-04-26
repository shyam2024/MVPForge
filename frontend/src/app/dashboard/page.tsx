'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderOpen, Trash2, Loader2, Code2, ArrowRight, Calendar, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRequireAuth } from '@/hooks/useAuth'
import { useProjectStore } from '@/store/projectStore'
import { Navbar } from '@/components/layout/Navbar'
import { cn, formatRelative, getStageLabel } from '@/lib/utils'
import { getErrorMessage } from '@/lib/utils'

export default function DashboardPage() {
  const { isAuthenticated, user } = useRequireAuth()
  const router = useRouter()
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) fetchProjects()
  }, [isAuthenticated, fetchProjects])

  const handleCreate = async () => {
    if (!projectName.trim()) return toast.error('Project name is required')
    setCreating(true)
    try {
      const project = await createProject({ name: projectName.trim(), description: projectDesc.trim() || undefined })
      toast.success('Project created!')
      setShowCreateModal(false)
      setProjectName('')
      setProjectDesc('')
      router.push(`/project/${project.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteProject(id)
      toast.success('Project deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
              <span className="text-gradient">{user?.full_name?.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {projects.length === 0
                ? 'Create your first project to get started'
                : `${projects.length} project${projects.length !== 1 ? 's' : ''} in progress`}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forge-600 hover:bg-forge-500 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-forge-500/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-forge-400" />
          </div>
        ) : !Array.isArray(projects) || projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 rounded-2xl bg-forge-500/10 border border-forge-500/20 flex items-center justify-center mx-auto mb-6">
              <Code2 className="w-10 h-10 text-forge-400" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">No projects yet</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Create your first project and let AI guide you from idea to production-ready code.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forge-600 hover:bg-forge-500 text-white font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Create Project
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="card-glass rounded-2xl p-6 cursor-pointer hover:border-foreground/20 transition-all duration-300 group relative"
                >
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    disabled={deletingId === project.id}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all"
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-forge-500/10 border border-forge-500/20 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-6 h-6 text-forge-400" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-display font-bold text-lg truncate group-hover:text-forge-300 transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{project.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Current stage:</span>
                    <span className="text-xs font-medium text-forge-400">{getStageLabel(project.current_stage)}</span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex gap-1">
                      {Array.from({ length: 7 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 h-1 rounded-full transition-all duration-300',
                            i + 1 < project.current_stage ? 'bg-green-500' :
                              i + 1 === project.current_stage ? 'bg-forge-500' : 'bg-border'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatRelative(project.updated_at)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-forge-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md card-glass rounded-2xl p-8"
            >
              <h2 className="text-2xl font-display font-bold mb-1">New Project</h2>
              <p className="text-sm text-muted-foreground mb-6">Give your project a name to get started</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="e.g. E-commerce Platform"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Brief description of what you're building..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border hover:bg-accent transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !projectName.trim()}
                  className="flex-1 py-3 rounded-xl bg-forge-600 hover:bg-forge-500 disabled:opacity-60 text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Project'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
