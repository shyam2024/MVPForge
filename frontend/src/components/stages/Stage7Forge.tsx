'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, FlaskConical, FileText, TestTube2, Download, ChevronRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { stage7Api } from '@/lib/api'
import { Project } from '@/store/projectStore'
import { cn, getErrorMessage } from '@/lib/utils'

interface Props {
  project: Project
  onUpdate: (project: Project) => void
}

type Tab = 'files' | 'tests' | 'report'

const languageColors: Record<string, string> = {
  typescript: 'text-blue-400', javascript: 'text-yellow-400',
  python: 'text-green-400', json: 'text-orange-400',
  yaml: 'text-red-400', markdown: 'text-gray-400',
  css: 'text-pink-400', html: 'text-orange-300', default: 'text-muted-foreground',
}

export function Stage7Forge({ project, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('files')
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [loadingFile, setLoadingFile] = useState(false)

  const stage = project.stage7
  const isCompleted = stage?.status === 'completed'
  const isGenerating = stage?.status === 'in_progress'

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await stage7Api.generate(project.id)
      onUpdate(res.data)
      toast.success('🎉 Code generation complete!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleLoadFile = async (index: number) => {
    setLoadingFile(true)
    try {
      const res = await stage7Api.getFile(project.id, index)
      setSelectedFile(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoadingFile(false)
    }
  }

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center"
        >
          <FlaskConical className="w-10 h-10 text-red-400" />
        </motion.div>
        <div className="text-center">
          <h2 className="font-display font-bold text-3xl mb-2">The Forge</h2>
          <p className="text-muted-foreground max-w-md">
            This is it. The Forge will generate complete, production-ready code based on your entire validated pipeline.
          </p>
        </div>
        <div className="card-glass rounded-2xl p-6 max-w-sm w-full text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">This will generate:</p>
          {['Complete folder structure', 'Frontend & Backend code', 'Database models & API routes', 'UI components', 'Automated test cases', 'Config & setup files'].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-lg transition-all hover:shadow-2xl hover:shadow-red-500/30 hover:-translate-y-1"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FlaskConical className="w-5 h-5" />}
          {generating ? 'Forging... This takes a few minutes' : 'Ignite The Forge'}
        </button>
      </div>
    )
  }

  const generatedFiles = stage.generated_files || []
  const testCases = stage.test_cases || []
  const report = stage.test_report || {}

  const tabs = [
    { id: 'files', label: 'Generated Files', icon: FileText, count: generatedFiles.length },
    { id: 'tests', label: 'Test Cases', icon: TestTube2, count: testCases.length },
    { id: 'report', label: 'Test Report', icon: CheckCircle, count: null },
  ] as const

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-display font-bold text-xl">The Forge — Output</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {generatedFiles.length} files generated • {testCases.length} test cases
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Generation Complete!
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forge-600 hover:bg-forge-500 text-white text-sm font-medium transition-all">
              <Download className="w-3.5 h-3.5" /> Download ZIP
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-border/40 flex-shrink-0">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all', activeTab === tab.id ? 'border-red-400 text-red-400' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== null && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'files' && (
          <div className="flex h-full gap-4">
            {/* File list */}
            <div className="w-72 flex-shrink-0 overflow-y-auto scrollbar-thin space-y-1">
              {generatedFiles.map((file: any, i: number) => {
                const ext = file.path?.split('.').pop() || ''
                const colorClass = languageColors[file.language] || languageColors.default
                return (
                  <button
                    key={i}
                    onClick={() => handleLoadFile(i)}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center gap-2',
                      selectedFile?.path === file.path ? 'bg-red-400/10 border border-red-400/20' : 'hover:bg-accent'
                    )}
                  >
                    <span className={cn('text-xs font-mono font-bold flex-shrink-0', colorClass)}>{ext || 'txt'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">{file.path}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </button>
                )
              })}
            </div>

            {/* Code viewer */}
            <div className="flex-1 min-w-0">
              {loadingFile ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                </div>
              ) : selectedFile ? (
                <div className="card-glass rounded-2xl h-full flex flex-col overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between flex-shrink-0">
                    <p className="text-sm font-mono text-muted-foreground">{selectedFile.path}</p>
                    <span className={cn('text-xs font-medium', languageColors[selectedFile.language] || languageColors.default)}>
                      {selectedFile.language}
                    </span>
                  </div>
                  <pre className="flex-1 overflow-auto p-5 text-xs font-mono text-green-300 leading-relaxed scrollbar-thin">
                    {selectedFile.content}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Select a file to view its content
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="overflow-y-auto scrollbar-thin h-full space-y-3">
            {testCases.map((test: any, i: number) => (
              <div key={i} className="card-glass rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <TestTube2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{test.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{test.failure_criterion}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-400/10 text-cyan-400">{test.test_type}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{test.language}</span>
                  </div>
                </div>
                {test.test_code && (
                  <pre className="code-block text-xs text-green-300 max-h-40 overflow-y-auto">{test.test_code}</pre>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'report' && report && (
          <div className="grid grid-cols-2 gap-4 content-start overflow-y-auto scrollbar-thin h-full">
            {[
              { label: 'Total Tests', value: report.total, color: 'text-foreground' },
              { label: 'Passed', value: report.passed, color: 'text-green-400' },
              { label: 'Failed', value: report.failed, color: 'text-red-400' },
              { label: 'Coverage', value: report.coverage, color: 'text-blue-400' },
            ].map((stat, i) => (
              <div key={i} className="card-glass rounded-2xl p-6 text-center">
                <p className={cn('text-4xl font-display font-bold', stat.color)}>{stat.value ?? '-'}</p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
            <div className="col-span-2 card-glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${report.passed && report.total ? (report.passed / report.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-green-400 font-semibold flex-shrink-0">
                  {report.total ? ((report.passed / report.total) * 100).toFixed(0) : 0}% pass rate
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
