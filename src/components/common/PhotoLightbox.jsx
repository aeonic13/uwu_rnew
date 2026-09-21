import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Full-screen photo gallery. Click/tap the arrows (or use the keyboard) to
 * browse; Escape or the backdrop closes it.
 */
export default function PhotoLightbox({
  images,
  startIndex = 0,
  alt,
  onClose,
}) {
  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), images.length - 1)
  )

  const prev = useCallback(
    () => setIndex(i => (i === 0 ? images.length - 1 : i - 1)),
    [images.length]
  )
  const next = useCallback(
    () => setIndex(i => (i === images.length - 1 ? 0 : i + 1)),
    [images.length]
  )

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, prev, next])

  if (!images.length) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Photo gallery'}
      onClick={onClose}
    >
      {/* Counter */}
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium">
        {index + 1} / {images.length}
      </span>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Close gallery"
      >
        <X size={26} />
      </button>

      {/* Image */}
      <img
        src={images[index]}
        alt={alt ? `${alt} — photo ${index + 1}` : `Photo ${index + 1}`}
        className="max-h-[85vh] max-w-[92vw] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={e => {
              e.stopPropagation()
              prev()
            }}
            className="absolute left-2 sm:left-4 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              next()
            }}
            className="absolute right-2 sm:right-4 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}
    </div>
  )
}

PhotoLightbox.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  startIndex: PropTypes.number,
  alt: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}
