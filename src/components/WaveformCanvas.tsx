import { useEffect } from 'react';
import { useWaveform } from '@/hooks/useWaveform';

interface WaveformCanvasProps {
  mode: string;
  volume: number;
  onClick?: () => void;
}

export function WaveformCanvas({ mode, volume, onClick }: WaveformCanvasProps) {
  const { canvasRef, modeRef, volumeRef } = useWaveform();

  // Sync mode and volume via refs (avoid re-renders)
  useEffect(() => {
    modeRef.current = mode;
  }, [mode, modeRef]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume, volumeRef]);

  return (
    <div
      className="w-full flex items-center justify-center cursor-pointer"
      style={{ maxWidth: 600, height: 300 }}
      onClick={onClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
