import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, hover = true }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, border: "1px solid rgba(255, 255, 255, 0.2)" } : {}}
      className={cn(
        "glass rounded-3xl p-6 transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
