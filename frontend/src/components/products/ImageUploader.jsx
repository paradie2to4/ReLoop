import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'

export default function ImageUploader({ files, onChange }) {
  const inputRef = useRef(null)

  function handleSelect(e) {
    const selected = Array.from(e.target.files || [])
    onChange([...files, ...selected])
    e.target.value = ''
  }

  function removeAt(index) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {files.map((file, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-sand-200">
            <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-navy-950/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={12} />
            </button>
            {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] text-white">Primary</span>}
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-sand-300 text-navy-500 hover:border-teal-400 hover:text-teal-600"
        >
          <ImagePlus size={20} />
          <span className="text-xs">Add photo</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleSelect} />
      <p className="mt-2 text-xs text-navy-500">JPEG, PNG or WEBP. Max 5MB each. The first photo is used as the cover image.</p>
    </div>
  )
}
