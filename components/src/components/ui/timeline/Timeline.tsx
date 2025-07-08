'use client';

import React, { useState } from 'react';
import './timeline.css';

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  content: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  style?: React.CSSProperties;
  enableWidthControl?: boolean;
}

export function Timeline({
  items,
  className = '',
  style,
  enableWidthControl = false,
}: TimelineProps) {
  const [width, setWidth] = useState(900);
  const timelineStyle = enableWidthControl ? { ...style, maxWidth: width } : style;

  return (
    <div>
      {enableWidthControl && (
        <div className="flex justify-end items-center gap-2 mb-2" style={{ minHeight: 0 }}>
          <label htmlFor="timeline-width" className="text-xs font-medium">Width</label>
          <input
            id="timeline-width"
            type="range"
            min={400}
            max={1400}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{ width: 100, height: 18 }}
          />
          <span className="text-xs text-gray-400 w-10 text-right">{width}px</span>
        </div>
      )}
      <div className={`timeline-container ${className}`} style={timelineStyle}>
        {items.map((item, index) => {
          const isLeft = index % 2 === 0;
          return (
            <div
              key={item.id}
              className={`timeline-item ${isLeft ? 'left' : 'right'}`}
            >
              <div className="timeline-content">
                {isLeft ? (
                  <>
                    <div className="timeline-date">{item.date}</div>
                    <div className="timeline-marker"></div>
                    <div className="timeline-card">
                      <h3 className="timeline-title">{item.title}</h3>
                      <p className="timeline-text">{item.content}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="timeline-marker"></div>
                    <div className="timeline-card">
                      <h3 className="timeline-title">{item.title}</h3>
                      <p className="timeline-text">{item.content}</p>
                    </div>
                    <div className="timeline-date">{item.date}</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
