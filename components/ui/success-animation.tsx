'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  className?: string;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  className,
  message = 'Success!',
  onComplete,
  duration = 2000,
}) => {
  const [visible, setVisible] = useState(true);
  const [animation, setAnimation] = useState('scale-in');

  useEffect(() => {
    // Start with scale-in animation
    const animationTimer = setTimeout(() => {
      // After a delay, start the scale-out animation
      setAnimation('scale-out');
      
      // After animation completes, hide the component
      const hideTimer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 500);
      
      return () => clearTimeout(hideTimer);
    }, duration);
    
    return () => clearTimeout(animationTimer);
  }, [duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={cn(
      'fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50',
      animation === 'scale-in' ? 'animate-in zoom-in duration-300' : 'animate-out zoom-out duration-300',
      className
    )}>
      <div className="flex flex-col items-center space-y-4 text-center">
        <CheckCircle 
          className={cn(
            'w-20 h-20 text-primary',
            animation === 'scale-in' ? 'animate-bounce' : ''
          )} 
        />
        <p className="text-xl font-medium">{message}</p>
      </div>
    </div>
  );
};

export { SuccessAnimation };