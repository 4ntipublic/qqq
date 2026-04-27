import type { Beat, Category } from '@/lib/admin-data'
import { BeatsList } from './beats-list'
import { BeatsUploadForm } from './beats-upload-form'

interface BeatsSectionProps {
  initialBeats: Beat[]
  categories: Category[]
}

export function BeatsSection({ initialBeats, categories }: BeatsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[440px_1fr]">
      <BeatsUploadForm categories={categories} />
      <BeatsList beats={initialBeats} categories={categories} />
    </div>
  )
}
