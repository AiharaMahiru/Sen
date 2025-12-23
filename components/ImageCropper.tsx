
import React, { useRef, useState, useEffect } from 'react';
import { Crop, Check, X } from 'lucide-react';
import { Button } from './Button';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!image || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas Sizing
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = Math.min(window.innerHeight * 0.6, containerRef.current.clientHeight || 500);
    
    // Calculate aspect ratio to fit image within container
    const scale = Math.min(containerWidth / image.width, containerHeight / image.height);
    
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    // Draw Function
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Draw Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (selection) {
        // Clear selection area (make it bright)
        ctx.clearRect(selection.x, selection.y, selection.w, selection.h);
        ctx.drawImage(image, 
          (selection.x / scale), (selection.y / scale), (selection.w / scale), (selection.h / scale),
          selection.x, selection.y, selection.w, selection.h
        );

        // Draw Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
        
        // Draw corners
        ctx.setLineDash([]);
        ctx.fillStyle = 'white';
        const cornerSize = 8;
        ctx.fillRect(selection.x - 4, selection.y - 4, cornerSize, cornerSize);
        ctx.fillRect(selection.x + selection.w - 4, selection.y + selection.h - 4, cornerSize, cornerSize);
        ctx.fillRect(selection.x + selection.w - 4, selection.y - 4, cornerSize, cornerSize);
        ctx.fillRect(selection.x - 4, selection.y + selection.h - 4, cornerSize, cornerSize);
      } else {
        // No selection hints
        ctx.fillStyle = 'white';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText("Click and drag to select text area", canvas.width / 2, canvas.height / 2);
      }
    };

    draw();

  }, [image, selection]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);
    setStartPos(pos);
    setSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !startPos) return;
    const pos = getMousePos(e);
    
    const x = Math.min(pos.x, startPos.x);
    const y = Math.min(pos.y, startPos.y);
    const w = Math.abs(pos.x - startPos.x);
    const h = Math.abs(pos.y - startPos.y);

    setSelection({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (!image || !canvasRef.current) return;
    
    // If no selection, use full image
    if (!selection || selection.w < 5 || selection.h < 5) {
       onConfirm(imageSrc);
       return;
    }

    const canvas = canvasRef.current;
    // Calculate scale factor again to map back to original image
    const scaleX = image.width / canvas.width;
    const scaleY = image.height / canvas.height;

    const sourceX = selection.x * scaleX;
    const sourceY = selection.y * scaleY;
    const sourceW = selection.w * scaleX;
    const sourceH = selection.h * scaleY;

    // Create temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceW;
    tempCanvas.height = sourceH;
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
      onConfirm(tempCanvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] border border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-white">
            <Crop className="w-5 h-5" />
            <span className="font-semibold">Crop Image for Better Accuracy</span>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="relative flex-1 bg-[#09090b] flex items-center justify-center overflow-hidden touch-none p-4"
        >
           <canvas
             ref={canvasRef}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             onTouchStart={handleMouseDown}
             onTouchMove={handleMouseMove}
             onTouchEnd={handleMouseUp}
             className="cursor-crosshair rounded-lg shadow-2xl border border-gray-800/50"
           />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#1C1C1E] flex justify-end gap-3">
           <Button variant="secondary" onClick={onCancel} className="!bg-transparent !text-gray-300 !border-gray-700 hover:!bg-gray-800">
             Cancel
           </Button>
           <Button onClick={handleConfirm} className="!bg-white !text-black hover:!bg-gray-200">
             <Check className="w-4 h-4 mr-2" />
             {selection && selection.w > 10 ? 'Crop & Attach' : 'Attach Full Image'}
           </Button>
        </div>

      </div>
    </div>
  );
};
