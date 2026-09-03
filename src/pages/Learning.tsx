import { useState } from 'react'
import { GraduationCap, Plus, Pencil, Trash2, PlayCircle } from 'lucide-react'
import Topbar from '../components/Topbar'
import CourseModal from '../components/CourseModal'
import VideoPlayerModal from '../components/VideoPlayerModal'
import { Badge, LoadingState, EmptyState } from '../components/Primitives'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../context/AuthContext'
import { youtubeThumbnail } from '../lib/youtube'
import type { Course } from '../lib/types'

export default function Learning() {
  const { role } = useAuth()
  const isAdmin = role !== 'employee'
  const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [playingCourse, setPlayingCourse] = useState<Course | null>(null)

  return (
    <div>
      <Topbar
        title="Learning"
        subtitle={isAdmin ? 'Manage the upskilling library everyone sees' : 'Grow your skills — pick a course to start watching'}
      />
      <div className="p-4 md:p-8">
        {isAdmin && (
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-signal text-white text-sm font-semibold hover:bg-signal/90 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Course
            </button>
          </div>
        )}

        {loading && <LoadingState label="Loading courses…" />}

        {!loading && courses.length === 0 && (
          <EmptyState
            title="No courses yet"
            description={isAdmin ? 'Add a course with a YouTube link to start building the library.' : 'Nothing has been added to the learning library yet — check back soon.'}
          />
        )}

        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => {
              const thumb = youtubeThumbnail(c.youtube_url)
              return (
                <div key={c.id} className="card overflow-hidden group">
                  <button onClick={() => setPlayingCourse(c)} className="relative w-full aspect-video bg-black/10 dark:bg-white/5 block">
                    {thumb ? (
                      <img src={thumb} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-black/20 dark:text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <PlayCircle className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </button>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold leading-snug">{c.title}</p>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingCourse(c)}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-signal hover:bg-signal/10 focus-ring"
                            title="Edit course"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove "${c.title}" from the learning library?`)) deleteCourse(c.id, c.title)
                            }}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 focus-ring"
                            title="Remove course"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {c.category && <Badge className="bg-signal/10 text-signal mb-2">{c.category}</Badge>}
                    <p className="text-xs text-black/55 dark:text-white/45 line-clamp-2">{c.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddModal && <CourseModal onClose={() => setShowAddModal(false)} onSubmit={addCourse} />}
      {editingCourse && (
        <CourseModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSubmit={(input) => updateCourse(editingCourse.id, input)}
        />
      )}
      {playingCourse && <VideoPlayerModal course={playingCourse} onClose={() => setPlayingCourse(null)} />}
    </div>
  )
}
