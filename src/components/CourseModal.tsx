import { useState, FormEvent } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Course } from '../lib/types'
import type { NewCourseInput } from '../hooks/useCourses'
import { extractYouTubeId } from '../lib/youtube'

interface CourseModalProps {
  course?: Course | null
  onClose: () => void
  onSubmit: (input: NewCourseInput) => Promise<{ error: { message: string } | null }>
}

export default function CourseModal({ course, onClose, onSubmit }: CourseModalProps) {
  const isEdit = Boolean(course)
  const [title, setTitle] = useState(course?.title ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(course?.youtube_url ?? '')
  const [category, setCategory] = useState(course?.category ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validVideoId = youtubeUrl.trim() ? extractYouTubeId(youtubeUrl.trim()) : null
  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && Boolean(validVideoId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)

    const result = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      youtube_url: youtubeUrl.trim(),
      category: category.trim()
    })

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message || 'Something went wrong saving this course.')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin bg-surface-lightcard dark:bg-surface-darkcard border border-surface-lightborder dark:border-surface-darkborder rounded-xl2 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display font-semibold text-lg">{isEdit ? 'Edit Course' : 'Add Course'}</p>
            <p className="text-xs text-black/45 dark:text-white/40">Visible to every employee in the Learning library</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-rose/10 text-rose text-sm">{error}</div>}

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              Title <span className="text-rose">*</span>
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Intro to System Design"
              className="input mt-1.5"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              Description <span className="text-rose">*</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this course covers and who it's for…"
              rows={3}
              className="input mt-1.5 resize-none"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              YouTube URL <span className="text-rose">*</span>
            </span>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input mt-1.5"
              required
            />
            {youtubeUrl.trim() && !validVideoId && (
              <p className="text-xs text-rose mt-1">Doesn't look like a valid YouTube URL.</p>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-medium text-black/50 dark:text-white/40">Category (optional)</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Engineering, Leadership, Design…"
              className="input mt-1.5"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Course'}
        </button>
      </form>
    </div>
  )
}
