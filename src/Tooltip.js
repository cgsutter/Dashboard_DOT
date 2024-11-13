// Tooltip.js
import React, { useState } from 'react';

// Tooltip component to handle display and hiding of the tooltip
function Tooltip({ content }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // const handleTooltipToggle = () => {
  //   setShowTooltip(!showTooltip);
  // };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      {/* Information "i" in a superscript circle */}
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '10px',
          textAlign: 'center',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'lightgray', // Light gray inside
          color: 'black', // Black "i" text
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          top: '-8px', // Move it higher as superscript
          border: '1px solid black', // Black border around the circle
        }}
      >
        i
      </span>

      {/* Tooltip content */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'darkgray',
            color: 'black',
            padding: '5px 10px',
            borderRadius: '10px',
            marginTop: '10px',
            // maxWidth: '500px',
            width: '300px',
            maxHeight:'500px',
            zIndex: 1000,
            fontSize: '14px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
