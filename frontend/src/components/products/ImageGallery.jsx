import { useState } from 'react'

export default function ImageGallery({ images = [] }) {
  const [active, setActive] = useState(0)

  if (!images.length) {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-sand-100 text-navy-500/50">No images available</div>
  }

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-sand-100">
        <img src={images[active].url} alt="" className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                i === active ? 'border-teal-500' : 'border-transparent'
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
