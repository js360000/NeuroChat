import { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safetyApi } from '@/lib/api/safety';
import { toast } from 'sonner';

interface DoodleCanvasProps {
  conversationId: string;
  onClose: () => void;
  onSent?: () => void;
}

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function DoodleCanvas({ conversationId, onClose, onSent }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth] = useState(3);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSend = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSending(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await safetyApi.sendDoodle(conversationId, dataUrl);
      toast.success('Doodle sent!');
      onSent?.();
      onClose();
    } catch {
      toast.error('Failed to send doodle');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-white p-3 space-y-2 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-600 flex items-center gap-1">
          <Pencil className="w-3 h-3" /> Doodle mode
        </p>
        <button onClick={onClose} className="p-0.5 text-neutral-400 hover:text-neutral-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={280}
        height={180}
        className="w-full rounded-lg border border-neutral-200 cursor-crosshair touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? 'border-neutral-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleClear}>
          <Eraser className="w-3 h-3 mr-1" /> Clear
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSend} disabled={isSending}>
          <Send className="w-3 h-3 mr-1" /> {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
