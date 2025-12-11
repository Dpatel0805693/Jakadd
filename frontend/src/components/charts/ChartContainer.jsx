// ChartContainer.jsx
// ----------------------------------------------------------------------------
// Wrapper that provides a consistent layout for all chart components.
// Adds title header, info tooltip, and PNG export button.
import { useRef } from 'react';
import './charts.css';

export default function ChartContainer({ title, children, info }) {
  const chartRef = useRef(null);

  const handleExportPNG = () => {
    // Use html2canvas or recharts built-in export
    // For now, we'll use a simple approach - right-click save image
    // For production, you'd use recharts' downloadChart functionality
    
    const chartElement = chartRef.current;
    if (!chartElement) return;

    // Find the SVG element (Recharts renders as SVG)
    const svg = chartElement.querySelector('svg');
    if (!svg) {
      alert('Chart not found. Please try again.');
      return;
    }

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Get SVG dimensions
    const svgRect = svg.getBoundingClientRect();
    canvas.width = svgRect.width * 2; // 2x for better quality
    canvas.height = svgRect.height * 2;
    
    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // Create image from SVG
    const img = new Image();
    img.onload = () => {
      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw SVG
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to PNG and download
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = url;
  };

  return (
    <div className="chart-container" ref={chartRef}>
      <div className="chart-header">
        <h3>{title}</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {info && (
            <button className="info-button" title={info} aria-label="Chart info">
              ℹ️
            </button>
          )}
          <button 
            onClick={handleExportPNG}
            style={{
              padding: '6px 12px',
              backgroundColor: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
            title="Download chart as PNG"
          >
            📥 PNG
          </button>
        </div>
      </div>
      <div className="chart-content">{children}</div>
    </div>
  );
}