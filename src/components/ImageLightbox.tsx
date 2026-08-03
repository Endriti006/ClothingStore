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
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-medium z-10">
        Close ✕
      </button>
      <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10">
        <ChevronLeft size={32} />
      </button>
      <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10">
        <ChevronRight size={32} />
      </button>
      <img
        src={images[activeIndex]?.url}
        alt={images[activeIndex]?.url ? 'Product image' : ''}
        className="max-h-[90vh] max-w-[90vw] object-contain cursor-zoom-in"
        onClick={onNext}
      />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}