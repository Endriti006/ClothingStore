import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useEffect, useCallback } from 'react';

interface Props {
  images: { id: string; url: string }[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ImageLightbox({ images, activeIndex, onClose, onPrev, onNext }: Props) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-3 sm:p-6 md:p-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white/90 transition hover:bg-white/20 hover:text-white sm:right-4 sm:top-4"
        aria-label="Close image viewer"
      >
        <X size={20} />
      </button>

      <button
        type="button"
        onClick={onPrev}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/90 transition hover:bg-white/20 hover:text-white sm:left-4 sm:p-3"
        aria-label="Previous image"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        type="button"
        onClick={onNext}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/90 transition hover:bg-white/20 hover:text-white sm:right-4 sm:p-3"
        aria-label="Next image"
      >
        <ChevronRight size={24} />
      </button>

      <img
        src={images[activeIndex]?.url}
        alt={images[activeIndex]?.url ? 'Product image' : ''}
        className="h-[85dvh] w-auto max-w-[95vw] rounded-lg object-contain shadow-2xl sm:h-[88dvh] sm:max-w-[90vw]"
      />

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-6">
        {images.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}