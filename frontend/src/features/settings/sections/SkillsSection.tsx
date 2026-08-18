import { useCallback, useEffect, useState } from "react"
import {
  BookOpen,
  ExternalLink,
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"
import type { SkillEntry } from "@/types/electron"

function getSkillsUnavailableMessage(): string {
  if (!window.electronAPI) {
    return "Skills are only available in the SonicThinking desktop app."
  }
  if (!window.skillsAPI) {
    return "Skills API is not loaded. Rebuild the preload (npm run build:interface) and restart the app."
  }
  return "Skills API is unavailable."
}

export function SkillsSection({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [skillsFolder, setSkillsFolder] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedContent, setSelectedContent] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState(
    "# My Skill\n\n## Steps\n1. Describe what this skill does\n2. Add the steps SonicThinking should follow\n"
  )

  const fetchSkills = useCallback(async () => {
    if (!window.skillsAPI) {
      setError(getSkillsUnavailableMessage())
      setSkills([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const [entries, paths] = await Promise.all([
        window.skillsAPI.list(),
        window.skillsAPI.getFolderPath(),
      ])
      setSkills(entries)
      setSkillsFolder(paths.skillsFolder)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load skills"
      setError(message)
      setSkills([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSkills()
  }, [fetchSkills])

  const handleOpenFolder = async () => {
    if (!window.skillsAPI) return
    await window.skillsAPI.openFolder()
  }

  const handleOpenSkill = async (idOrSlug: string) => {
    if (!window.skillsAPI) return
    await window.skillsAPI.openSkill(idOrSlug)
  }

  const handleSelectSkill = async (skill: SkillEntry) => {
    if (!window.skillsAPI) return

    setSelectedId(skill.id)
    try {
      const full = await window.skillsAPI.get(skill.id)
      setSelectedContent(full?.contentMd ?? "")
    } catch {
      setSelectedContent("")
    }
  }

  const handleSaveSkill = async () => {
    if (!window.skillsAPI) return
    const title = formTitle.trim()
    if (!title) {
      setError("Skill title is required.")
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setNotice(null)
      await window.skillsAPI.save({
        title,
        contentMd: formContent,
      })
      setFormTitle("")
      setNotice("Skill saved.")
      await fetchSkills()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save skill"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSkill = async (idOrSlug: string) => {
    if (!window.skillsAPI) return

    try {
      setError(null)
      setNotice(null)
      await window.skillsAPI.delete(idOrSlug)
      if (selectedId === idOrSlug) {
        setSelectedId(null)
        setSelectedContent("")
      }
      setNotice("Skill deleted.")
      await fetchSkills()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete skill"
      setError(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p
          className={getThemeUtils(isDarkTheme, {
            dark: "text-zinc-300",
            light: "text-zinc-700",
          }, "text-sm")}
        >
          Saved skills live in a local folder on your computer. Each skill is stored as{" "}
          <code className="text-xs">skill.md</code> with a fast SQLite index for lookup.
        </p>
        {skillsFolder && (
          <p
            className={getThemeUtils(isDarkTheme, {
              dark: "text-zinc-500",
              light: "text-zinc-500",
            }, "text-xs break-all font-mono")}
          >
            {skillsFolder}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void handleOpenFolder()}>
          <FolderOpen className="w-4 h-4 mr-2" />
          Open skills folder
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void fetchSkills()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          {notice}
        </div>
      )}

      <div
        className={getThemeUtils(isDarkTheme, {
          dark: "border-zinc-800 bg-zinc-900/40",
          light: "border-zinc-200 bg-zinc-50",
        }, "rounded-lg border p-4 space-y-3")}
      >
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Save a new skill
        </h3>
        <Input
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Skill title (e.g. Write professional email)"
        />
        <Textarea
          value={formContent}
          onChange={(e) => setFormContent(e.target.value)}
          rows={8}
          className="font-mono text-xs"
        />
        <Button type="button" size="sm" onClick={() => void handleSaveSkill()} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
          Save skill
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Saved skills</h3>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading skills...
          </div>
        ) : skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No skills yet. Save one above, or create a folder with <code>skill.md</code> inside the skills directory.
          </p>
        ) : (
          <div className="space-y-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className={cn(
                  getThemeUtils(isDarkTheme, {
                    dark: "border-zinc-800 bg-zinc-900/30",
                    light: "border-zinc-200 bg-white",
                  }, "rounded-lg border p-3"),
                  selectedId === skill.id && "ring-1 ring-primary/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="text-left min-w-0"
                    onClick={() => void handleSelectSkill(skill)}
                  >
                    <div className="font-medium text-sm truncate">{skill.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {skill.slug} · updated {new Date(skill.updatedAt).toLocaleString()}
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Show skill file in folder"
                      onClick={() => void handleOpenSkill(skill.id)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete skill"
                      onClick={() => void handleDeleteSkill(skill.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedContent && (
        <div
          className={getThemeUtils(isDarkTheme, {
            dark: "border-zinc-800 bg-zinc-950",
            light: "border-zinc-200 bg-zinc-50",
          }, "rounded-lg border p-4")}
        >
          <h3 className="text-sm font-medium mb-2">Preview</h3>
          <pre className="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-64">{selectedContent}</pre>
        </div>
      )}
    </div>
  )
}
