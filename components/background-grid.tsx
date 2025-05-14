"use client";

import { useEffect, useState, useRef, CSSProperties } from "react";
import { useTheme } from "next-themes";

// Define constant for cell size to ensure consistency
const CELL_SIZE = 50;

interface GridDimensions {
  cols: number;
  rows: number;
  totalCells: number;
}

export function BackgroundGrid() {
  const [gridDimensions, setGridDimensions] = useState<GridDimensions | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Track recently active cells for trailing effect
  const [recentCells, setRecentCells] = useState<Array<{ index: number; time: number }>>([]);
  const [recentCells, setRecentCells] = useState<Array<{ index: number; time: number }>>([]);
  const { theme } = useTheme();


  useEffect(() => {
    setMounted(true);

    const calculateGridItems = () => {
      const width = window.innerWidth;
      const height = window.innerHeight * 10;
      const cols = Math.ceil(width / CELL_SIZE) + 1;
      const rows = Math.ceil(height / CELL_SIZE) + 100;
      const totalCells = cols * rows;
      setGridDimensions({ cols, rows, totalCells });
    };

    calculateGridDimensions();
    window.addEventListener("resize", calculateGridDimensions);
    window.addEventListener("scroll", calculateGridDimensions);

    return () => {
      window.removeEventListener("resize", calculateGridDimensions);
      window.removeEventListener("scroll", calculateGridDimensions);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !gridDimensions) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Get cursor position
      const mouseX = e.clientX;
      const mouseY = e.clientY + window.scrollY;


      // Calculate grid position
      const cellX = Math.floor(mouseX / CELL_SIZE);
      const cellY = Math.floor(mouseY / CELL_SIZE);


      // Only update if the position has changed
      if (cellX !== mousePosition.x || cellY !== mousePosition.y) {
        setMousePosition({ x: cellX, y: cellY });


        // Calculate the index of the current cell
        const cols = Math.ceil(window.innerWidth / CELL_SIZE);
        const currentIndex = cellY * cols + cellX;

        // Add current cell to recent cells with timestamp
        setRecentCells(prev => {
          // Add new cell
          const updated = [...prev, { index: currentIndex, time: Date.now() }];
          // Remove cells older than 800ms
          return updated.filter(cell => Date.now() - cell.time < 800);
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Cleanup trailing effect every 100ms to update fade effect
    const trailInterval = setInterval(() => {
      setRecentCells(prev => prev.filter(cell => Date.now() - cell.time < 800));
    }, 100);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(trailInterval);
    };
  }, [mounted, gridDimensions, mousePosition.x, mousePosition.y]);

  const isItemActive = (index: number) => {
    const cols = Math.ceil(window.innerWidth / CELL_SIZE);
    const itemX = index % cols;
    const itemY = Math.floor(index / cols);

    // Current cell under cursor
    const isCurrentCell = itemX === mousePosition.x && itemY === mousePosition.y;


    // Check if this cell is in the recent cells list (trailing effect)
    const isInTrail = recentCells.some(cell => cell.index === index);


    // If it's not active at all, return false
    if (!isCurrentCell && !isInTrail) {
      return { active: false, intensity: 0 };
    }


    // Calculate intensity based on how recent the cell was activated
    const cellData = recentCells.find(cell => cell.index === index);
    const timeAgo = cellData ? Date.now() - cellData.time : 800;
    const intensity = isCurrentCell ? 1 : Math.max(0, 1 - timeAgo / 800);


    return { active: true, intensity };
  };

  // Only add dark overlay in dark mode
  const isDarkMode = theme === "dark";
  const isDarkMode = theme === "dark";

  // Get the position for each grid item
  const getGridItemStyle = (index: number) => {
    const cols = Math.ceil(window.innerWidth / CELL_SIZE);
    const x = (index % cols) * CELL_SIZE;
    const y = Math.floor(index / cols) * CELL_SIZE;

    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${CELL_SIZE}px`,
      height: `${CELL_SIZE}px`,
      position: "absolute" as const,
      position: "absolute" as const,
    };
  };

  // Render the grid only if mounted and dimensions are calculated
  if (!mounted || !gridDimensions) {
    return null; // Or a minimal placeholder if you prefer, to avoid layout shift
  }

  return (
    <div className="fixed inset-0 w-full h-full min-h-screen" style={{ zIndex: 0 }}>
      {/* Dark overlay only in dark mode */}
      {isDarkMode && (
        <div
          className="fixed inset-0 bg-black pointer-events-none backdrop-blur-sm"
          style={{
        <div
          className="fixed inset-0 bg-black pointer-events-none backdrop-blur-sm"
          style={{
            zIndex: 0,
            opacity: 0.8, // Reduced opacity to allow some of the blurred background to show through
            opacity: 0.8, // Reduced opacity to allow some of the blurred background to show through
          }}
        ></div>
      )}
      <div className="w-full h-[1000vh] relative" style={{ zIndex: 1 }}>
        {mounted &&
          gridItems.map(i => {
            const itemState = isItemActive(i);
            return (
              <div
                key={i}
                className={`grid-item ${itemState.active ? "active" : ""}`}
                data-active={itemState.active}
                data-intensity={itemState.intensity.toFixed(2)}
                style={
                  {
                    ...getGridItemStyle(i),
                    /* Apply intensity as a CSS variable for animation */
                    "--intensity": itemState.intensity,
                  } as React.CSSProperties
                }
              />
            );
          })}
      </div>
    </div>
  );
}
