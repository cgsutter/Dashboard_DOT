// ColorKey.js
import React from 'react';

const ColorKey = () => {
  return (
    <div className="color-key">
      <h5>Color Key</h5>
      <ul>
        <li>
          <span className="color-box" style={{ backgroundColor: '#ff0000' }} />
          <span>High</span>
        </li>
        <li>
          <span className="color-box" style={{ backgroundColor: '#ffff00' }} />
          <span>Medium</span>
        </li>
        <li>
          <span className="color-box" style={{ backgroundColor: '#00ff00' }} />
          <span>Low</span>
        </li>
      </ul>
    </div>
  );
};

export default ColorKey;