import { useState, useEffect } from 'react';

interface AudioWaveAnimationProps {
  isActive: boolean;
}

const AudioWaveAnimation = ({ isActive }: AudioWaveAnimationProps) => {
  const [bars, setBars] = useState<number[]>([]);
  
  useEffect(() => {
    // Create random heights for bars
    const generateBars = () => {
      return Array.from({ length: 5 }, () => Math.floor(Math.random() * 20) + 10);
    };
    
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      // Set initial bars
      setBars(generateBars());
      
      // Update bars at regular intervals to create animation effect
      interval = setInterval(() => {
        setBars(generateBars());
      }, 200);
    } else {
      // Set flat bars when not active
      setBars(Array(5).fill(5));
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);
  
  return (
    <div className="flex items-center h-5 space-x-0.5">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-sm ${isActive ? 'bg-primary' : 'bg-gray-300'}`}
          style={{
            height: `${height}px`,
            transition: 'height 0.2s ease'
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveAnimation;