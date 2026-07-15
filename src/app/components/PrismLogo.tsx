"use client";

import React from "react";

export function PrismLogo({ className = "h-4 w-4 text-white" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Premium 3D Geometric Prism Logo */}
      <path 
        d="M16 4L28 25H4L16 4Z" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinejoin="round" 
      />
      <path 
        d="M16 4V25" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeDasharray="2 2" 
      />
      <path 
        d="M16 12L23 20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M16 12L9 20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
