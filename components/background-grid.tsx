"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function BackgroundGrid() {
  const [gridItems, setGridItems] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    
    setMounted(true);
    
    const calculateGridItems = () => {
      const width = window.innerWidth;
      const height = window.innerHeight * 10;
      const cellSize = 50;
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 100;
      const totalCells = cols * rows;

      setGridItems(Array.from({ length: totalCells }, (_, i) => i));
    };

    const handleMouseMove = (e: MouseEvent) => {
      const scrollY = window.scrollY;
      setMousePosition({
        x: Math.floor(e.clientX / 51),
        y: Math.floor((e.clientY + scrollY) / 51)
      });
    };

    calculateGridItems();
    window.addEventListener("resize", calculateGridItems);
    window.addEventListener("scroll", calculateGridItems);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", calculateGridItems);
      window.removeEventListener("scroll", calculateGridItems);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const isItemActive = (index: number) => {
    const cols = Math.ceil(window.innerWidth / 51);
    const itemX = index % cols;
    const itemY = Math.floor(index / cols);
    return itemX === mousePosition.x && itemY === mousePosition.y;
  };

  // Only add dark overlay in dark mode
  const isDarkMode = theme === 'dark';

  return (
    <div className="fixed inset-0 w-full h-full min-h-screen" style={{ zIndex: 0 }}>
      {/* Dark overlay only in dark mode */}
      {isDarkMode && (
        <div 
          className="fixed inset-0 bg-black pointer-events-none" 
          style={{ 
            zIndex: 0,
            opacity: 0.99 // Increased from 0.98 to 0.99 for even darker overlay
          }}
        ></div>
      )}
      <div className="bg-grid w-full h-[1000vh]" style={{ zIndex: 1, position: "relative" }}>
        {mounted && gridItems.map(i => (
          <div 
            key={i} 
            className={`grid-item ${isItemActive(i) ? 'active' : ''}`}
            data-active={isItemActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
