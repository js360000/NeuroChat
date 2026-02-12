import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  from?: 'bottom' | 'left' | 'right' | 'scale';
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  duration = 600,
  from = 'bottom',
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const fromStyles = {
    bottom: 'translate-y-8',
    left: '-translate-x-8',
    right: 'translate-x-8',
    scale: 'scale-95',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${fromStyles[from]}`,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
