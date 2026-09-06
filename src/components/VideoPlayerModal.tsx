import { X } from 'lucide-react'
import { youtubeEmbedUrl } from '../lib/youtube'
import type { Course } from '../lib/types'

export default function VideoPlayerModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const embedUrl = youtubeEmbedUrl(course.youtube_url)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-surface-lightcard dark:bg-surface-darkcard border border-surface-lightborder dark:border-surface-darkborder rounded-xl2 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-lightborder dark:border-surface-darkborder">
          <div className="min-w-0">
            <p className="font-display font-semibold truncate">{course.title}</p>
            {course.category && <p className="text-xs text-black/45 dark:text-white/40">{course.category}</p>}
          </div>
          <button onClick={onClose} className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus-ring">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={course.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
              This video link couldn't be played here.
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-black/60 dark:text-white/50">{course.description}</p>
        </div>
      </div>
    </div>
  )
}
