class CommonUtilities {
  // Helper function to convert RGB to hex

  static readonly colorPalette = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#808000",
    "#008080",
    "#b71515",
    "#FFD700",
    "#FF6347",
    "#4169E1",
    "#32CD32",
  ];

  static rgbToHex(r: number, g: number, b: number) {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
        .toUpperCase()
    );
  }

  static hexToRgb(hex: any) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  // Get or create color palette index
  static getColorIndex(color: string) {
    let idx = this.colorPalette.indexOf(color);
    if (idx === -1) {
      if (this.colorPalette.length < 256) {
        idx = this.colorPalette.length;
        this.colorPalette.push(color);
      } else {
        idx = 0; // Default to black if palette is full
      }
    }
    return idx;
  }
  // Convert color index back to hex
  static indexToColor(idx: number) {
    return this.colorPalette[idx] || "#000000";
  }

  /**
   * Ultra-compact binary format for real-time sharing
   * Format: [version(1)] [numStrokes(1)] [stroke...]
   * Each stroke type:
   *   - Type 0 (brush): [type(1)] [colorIdx(1)] [width(1)] [numPoints(2)] [x1(2)] [y1(2)] [dx1(1)] [dy1(1)]...
   *   - Type 1 (eraser): [type(1)] [colorIdx(1)] [width(1)] [numPoints(2)] [x1(2)] [y1(2)] [dx1(1)] [dy1(1)]...
   *   - Type 2 (fill): [type(1)] [colorIdx(1)] [x(2)] [y(2)] [origColorIdx(1)]
   * Uses delta encoding for coordinates (only store differences)
   * Reduces file size by ~90% compared to JSON!
   */
  static encodeDrawingBinary = (strokes: Array<any>) => {
    const buffer = [];

    // Version
    buffer.push(1);

    // Number of strokes
    buffer.push(strokes.length & 0xff);

    strokes.forEach((stroke) => {
      const typeCode = stroke[0];

      if (typeCode === 2) {
        // Fill stroke: [2, fillColor, x, y, originalColor]
        buffer.push(2); // type
        const fillColorIdx = CommonUtilities.getColorIndex(stroke[1]);
        buffer.push(fillColorIdx & 0xff);

        const x = Math.round(stroke[2]);
        const y = Math.round(stroke[3]);
        buffer.push((x >> 8) & 0xff);
        buffer.push(x & 0xff);
        buffer.push((y >> 8) & 0xff);
        buffer.push(y & 0xff);

        const origColorIdx = CommonUtilities.getColorIndex(stroke[4]);
        buffer.push(origColorIdx & 0xff);
      } else {
        // Brush or eraser stroke
        const [, color, width, ...points] = stroke;

        // Type (0 = stroke, 1 = erase)
        buffer.push(typeCode);

        // Color index
        const colorIdx = CommonUtilities.getColorIndex(color);
        buffer.push(colorIdx & 0xff);

        // Width (clamped to 0-255)
        buffer.push(Math.min(255, Math.max(0, Math.round(width))));

        // Number of points (each point is 2 coords, so divide by 2)
        const numPoints = points.length / 2;
        buffer.push((numPoints >> 8) & 0xff);
        buffer.push(numPoints & 0xff);

        if (numPoints === 0) return;

        // First point (absolute coordinates, quantized to integers)
        let prevX = Math.round(points[0]);
        let prevY = Math.round(points[1]);
        buffer.push((prevX >> 8) & 0xff);
        buffer.push(prevX & 0xff);
        buffer.push((prevY >> 8) & 0xff);
        buffer.push(prevY & 0xff);

        // Remaining points (delta encoded)
        for (let i = 2; i < points.length; i += 2) {
          const x = Math.round(points[i]);
          const y = Math.round(points[i + 1]);
          const dx = x - prevX;
          const dy = y - prevY;

          // Delta values as signed 8-bit integers (-128 to 127)
          buffer.push((dx + 256) & 0xff);
          buffer.push((dy + 256) & 0xff);

          prevX = x;
          prevY = y;
        }
      }
    });

    return new Uint8Array(buffer);
  };
}
export default CommonUtilities;
