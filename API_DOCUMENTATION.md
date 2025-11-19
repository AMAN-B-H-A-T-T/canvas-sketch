# WhiteboardCanvas Package - Complete API Documentation

A powerful, real-time collaborative drawing library for HTML5 Canvas with Socket.IO integration. Perfect for building drawing applications, digital whiteboards, and collaborative sketching tools.

## 📦 Installation

```bash
npm install @collab/canvas-sketch
# or
yarn add @collab/canvas-sketch
```

## 🚀 Quick Start

```typescript
import WhiteboardCanvas from "@collab/canvas-sketch";

// Basic setup
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const whiteboard = new WhiteboardCanvas({
  canvas: canvas,
  options: {
    width: 800,
    height: 600,
    backgroundColor: "#ffffff",
  },
});

// Set up event listeners
whiteboard.setUpEvents();

// Start drawing!
whiteboard.setTool("brush");
whiteboard.setColorPickerValue("#ff0000");
whiteboard.setBrushSize(5);
```

---

## 🎨 WhiteboardCanvas Class

### Constructor

#### `new WhiteboardCanvas(config)`

Creates a new WhiteboardCanvas instance.

**Parameters:**

- `canvas` (HTMLCanvasElement | string): Canvas element or CSS selector
- `options` (CanvasOptions): Configuration options
- `socket` (optional): Socket.IO instance for real-time collaboration

**Example:**

```typescript
const whiteboard = new WhiteboardCanvas({
  canvas: "#drawing-canvas",
  options: {
    width: 1200,
    height: 800,
    backgroundColor: "#f0f0f0",
  },
  socket: io("http://localhost:3000"), // optional
});
```

---

### 🖌️ Drawing Tools & Controls

#### `setTool(tool: toolType)`

Sets the active drawing tool.

**Parameters:**

- `tool` ("brush" | "eraser" | "fill"): The tool to activate

**Example:**

```typescript
// Switch to brush tool
whiteboard.setTool("brush");

// Switch to eraser
whiteboard.setTool("eraser");

// Switch to fill/bucket tool
whiteboard.setTool("fill");
```

#### `setColorPickerValue(color: string)`

Sets the drawing color for brush and fill tools.

**Parameters:**

- `color` (string): Hex color code (e.g., "#ff0000")

**Example:**

```typescript
// Set red color
whiteboard.setColorPickerValue("#ff0000");

// Set blue color
whiteboard.setColorPickerValue("#0000ff");

// Colors update immediately, even while drawing
```

#### `setBrushSize(size: number)`

Sets the brush/eraser size.

**Parameters:**

- `size` (number): Size in pixels (1-100 recommended)

**Example:**

```typescript
// Thin brush
whiteboard.setBrushSize(2);

// Medium brush
whiteboard.setBrushSize(10);

// Thick brush
whiteboard.setBrushSize(20);
```

---

### 🎛️ Event Management

#### `setUpEvents()`

Enables mouse and touch event listeners for drawing functionality.

**Example:**

```typescript
// Enable drawing interactions
whiteboard.setUpEvents();

// Now users can draw with mouse or touch
```

#### `removeEvents()`

Removes all event listeners and stops any active drawing.

**Example:**

```typescript
// Disable drawing (useful for read-only mode)
whiteboard.removeEvents();

// Re-enable later
whiteboard.setUpEvents();
```

---

### 🧹 Canvas Management

#### `clearCanvas()`

Clears the entire canvas and resets drawing history.

**Example:**

```typescript
// Clear everything
whiteboard.clearCanvas();

// In real-time mode, this syncs to all connected users
```

---

### 💾 Data Export & Import

#### `exportData()`

Exports the drawing data as a downloadable file with metadata.

**Returns:** Triggers download of `.drawing.json` file

**Example:**

```typescript
// Export current drawing
whiteboard.exportData();

// Creates file: "drawing_1637234567890.drawing.json"
// Contains binary data + metadata for efficient storage
```

#### `getMicroStrokesJSON()`

Gets drawing data in compact micro-stroke format.

**Returns:** `string` - JSON string of micro-strokes

**Example:**

```typescript
const drawingData = whiteboard.getMicroStrokesJSON();
console.log("Drawing data:", drawingData);

// Sample output:
// [[0,1,5,100,150,105,155],[0,1,5,105,155,110,160]]
// Format: [type, colorIndex, width, x1, y1, x2, y2]
```

---

### 🌐 Real-Time Collaboration (Socket.IO)

#### `setUpSocket(config)`

Configures Socket.IO connection for real-time collaboration.

**Parameters:**

- `socket`: Socket.IO instance
- `roomId` (optional): Room identifier for multi-room support
- `id` (optional): User identifier

**Example:**

```typescript
import io from "socket.io-client";

const socket = io("http://localhost:3000");
whiteboard.setUpSocket({
  socket: socket,
  roomId: "room-123",
  id: "user-456",
});
```

#### `sendCompleteDrawing()`

Sends the entire current drawing to all connected users.

**Example:**

```typescript
// Send current state to new users joining the room
whiteboard.sendCompleteDrawing();
```

#### `syncColorPalette()`

Synchronizes the color palette with other users.

**Example:**

```typescript
// Sync custom colors with other users
whiteboard.syncColorPalette();
```

---

### 📡 Real-Time Event Handlers

#### `syncStrokeBatchData(strokes: Array<any>)`

Applies batched stroke data from other users.

**Parameters:**

- `strokes`: Array of micro-stroke data

**Example:**

```typescript
// Typically called automatically by socket events
socket.on("stroke-batch", (data) => {
  whiteboard.syncStrokeBatchData(data.strokes);
});
```

#### `syncSingleStorkes(stroke: Array<any>, type: toolType)`

Applies single stroke operations (fills, special strokes).

**Parameters:**

- `stroke`: Single stroke data array
- `type`: Type of operation ("brush" | "eraser" | "fill")

**Example:**

```typescript
socket.on("single-stroke", (data) => {
  whiteboard.syncSingleStorkes(data.stroke, data.type);
});
```

#### `syncClearCanvas()`

Applies canvas clear operation from other users.

**Example:**

```typescript
socket.on("canvas-clear", (data) => {
  whiteboard.syncClearCanvas();
});
```

#### `syncDrawing(strokes: Array<any>)`

Replaces entire canvas with new drawing data.

**Parameters:**

- `strokes`: Complete drawing as micro-stroke array

**Example:**

```typescript
socket.on("drawing-sync", (data) => {
  whiteboard.syncDrawing(data.strokes);
});
```

---

## 🛠️ CommonUtilities Class

Utility functions for color management and data encoding.

### Color Management

#### `static rgbToHex(r: number, g: number, b: number): string`

Converts RGB values to hex color.

**Parameters:**

- `r` (number): Red value (0-255)
- `g` (number): Green value (0-255)
- `b` (number): Blue value (0-255)

**Returns:** `string` - Hex color code

**Example:**

```typescript
import { CommonUtilities } from "@collab/canvas-sketch";

const hex = CommonUtilities.rgbToHex(255, 0, 0);
console.log(hex); // "#FF0000"
```

#### `static hexToRgb(hex: string): {r: number, g: number, b: number}`

Converts hex color to RGB object.

**Parameters:**

- `hex` (string): Hex color code (e.g., "#ff0000")

**Returns:** Object with r, g, b properties

**Example:**

```typescript
const rgb = CommonUtilities.hexToRgb("#FF0000");
console.log(rgb); // {r: 255, g: 0, b: 0}
```

#### `static getColorIndex(color: string): number`

Gets or creates palette index for color (optimizes real-time transmission).

**Parameters:**

- `color` (string): Hex color code

**Returns:** `number` - Color palette index

**Example:**

```typescript
const index = CommonUtilities.getColorIndex("#FF0000");
console.log(index); // 2 (red is at index 2 in default palette)
```

#### `static indexToColor(idx: number): string`

Converts palette index back to hex color.

**Parameters:**

- `idx` (number): Palette index

**Returns:** `string` - Hex color code

**Example:**

```typescript
const color = CommonUtilities.indexToColor(2);
console.log(color); // "#FF0000"
```

#### `static colorPalette: string[]`

Default color palette (20 common colors).

**Example:**

```typescript
console.log(CommonUtilities.colorPalette);
// ["#000000", "#FFFFFF", "#FF0000", "#00FF00", ...]
```

### Binary Encoding

#### `static encodeDrawingBinary(strokes: Array<any>): Uint8Array`

Encodes drawing data to ultra-compact binary format (90% smaller than JSON).

**Parameters:**

- `strokes`: Array of stroke data

**Returns:** `Uint8Array` - Binary encoded data

**Example:**

```typescript
const strokes = [[0, "#FF0000", 5, 100, 150, 110, 160]];
const binary = CommonUtilities.encodeDrawingBinary(strokes);
console.log(
  "Size reduction:",
  binary.length,
  "bytes vs",
  JSON.stringify(strokes).length,
  "bytes"
);
```

---

## 📊 Data Formats

### Stroke Format

Each stroke is stored as an array with the following format:

```typescript
// Brush/Eraser stroke
[type, color, width, x1, y1, x2, y2, ..., xN, yN]
// type: 0 = brush, 1 = eraser
// color: hex string
// width: number
// coordinates: alternating x,y pairs

// Fill operation
[2, fillColor, x, y, originalColor]
// type: 2 = fill
// fillColor: hex string of fill color
// x, y: click coordinates
// originalColor: hex string of original color
```

### Micro-Stroke Format (Real-time)

For real-time transmission, strokes are broken into micro-segments:

```typescript
[type, colorIndex, width, x1, y1, x2, y2, hexColor?, strokeId?, sequence?]
// More compact for network transmission
// Uses color palette indices instead of full hex codes
```

---

## 🎯 Complete Usage Examples

### Basic Drawing App

```typescript
import WhiteboardCanvas from "@collab/canvas-sketch";

class DrawingApp {
  private whiteboard: WhiteboardCanvas;

  constructor() {
    this.whiteboard = new WhiteboardCanvas({
      canvas: "#canvas",
      options: { width: 800, height: 600, backgroundColor: "#fff" },
    });

    this.whiteboard.setUpEvents();
    this.setupUI();
  }

  private setupUI() {
    // Tool buttons
    document.getElementById("brush")?.addEventListener("click", () => {
      this.whiteboard.setTool("brush");
    });

    document.getElementById("eraser")?.addEventListener("click", () => {
      this.whiteboard.setTool("eraser");
    });

    document.getElementById("fill")?.addEventListener("click", () => {
      this.whiteboard.setTool("fill");
    });

    // Color picker
    const colorPicker = document.getElementById("color") as HTMLInputElement;
    colorPicker?.addEventListener("change", (e) => {
      this.whiteboard.setColorPickerValue((e.target as HTMLInputElement).value);
    });

    // Size slider
    const sizeSlider = document.getElementById("size") as HTMLInputElement;
    sizeSlider?.addEventListener("input", (e) => {
      this.whiteboard.setBrushSize(
        parseInt((e.target as HTMLInputElement).value)
      );
    });

    // Clear button
    document.getElementById("clear")?.addEventListener("click", () => {
      this.whiteboard.clearCanvas();
    });

    // Export button
    document.getElementById("export")?.addEventListener("click", () => {
      this.whiteboard.exportData();
    });
  }
}

new DrawingApp();
```

### Real-time Collaborative Drawing

```typescript
import WhiteboardCanvas from "@collab/canvas-sketch";
import io from "socket.io-client";

class CollaborativeDrawing {
  private whiteboard: WhiteboardCanvas;
  private socket: any;

  constructor(roomId: string, userId: string) {
    // Initialize canvas
    this.whiteboard = new WhiteboardCanvas({
      canvas: "#canvas",
      options: { width: 1200, height: 800 },
    });

    // Setup socket connection
    this.socket = io("http://localhost:3000");
    this.whiteboard.setUpSocket({
      socket: this.socket,
      roomId: roomId,
      id: userId,
    });

    this.setupSocketEvents();
    this.whiteboard.setUpEvents();
  }

  private setupSocketEvents() {
    // Handle incoming real-time strokes
    this.socket.on("stroke-batch", (data: any) => {
      if (data.userId !== this.socket.id) {
        this.whiteboard.syncStrokeBatchData(data.strokes);
      }
    });

    // Handle single operations (fills, etc.)
    this.socket.on("single-stroke", (data: any) => {
      if (data.userId !== this.socket.id) {
        this.whiteboard.syncSingleStorkes(data.stroke, data.type);
      }
    });

    // Handle canvas clear
    this.socket.on("canvas-clear", (data: any) => {
      if (data.userId !== this.socket.id) {
        this.whiteboard.syncClearCanvas();
      }
    });

    // Handle complete drawing sync (for new users)
    this.socket.on("drawing-sync", (data: any) => {
      if (data.userId !== this.socket.id) {
        this.whiteboard.syncDrawing(data.strokes);
      }
    });

    // Send complete drawing to new users
    this.socket.on("user-joined", () => {
      this.whiteboard.sendCompleteDrawing();
    });
  }
}

// Usage
const app = new CollaborativeDrawing("room-123", "user-456");
```

---

## ⚙️ Configuration Options

### CanvasOptions Interface

```typescript
interface CanvasOptions {
  width?: number; // Canvas width (default: 800)
  height?: number; // Canvas height (default: 800)
  backgroundColor?: string; // Background color (optional)
}
```

### Tool Types

```typescript
type toolType = "brush" | "fill" | "eraser";
```

---

## 🔧 Performance Features

### Real-time Optimization

- **Stroke Throttling**: Limits transmission to 120fps (8ms intervals)
- **Batch Processing**: Groups strokes for efficient network usage
- **Binary Encoding**: 90% smaller data size compared to JSON
- **Color Palette**: Reduces color data from 7 bytes to 1 byte per stroke

### Memory Management

- **Delta Encoding**: Stores coordinate differences instead of absolute positions
- **Context Caching**: Avoids redundant canvas context updates
- **Buffer Management**: Automatically manages stroke buffers to prevent memory leaks

---

## 📱 Mobile Support

The library fully supports touch events:

```typescript
// Touch events are automatically handled
whiteboard.setUpEvents(); // Enables both mouse and touch

// Works on:
// - iOS Safari
// - Android Chrome
// - Mobile Firefox
// - Touch-enabled desktops
```

---

## 🐛 Error Handling

```typescript
try {
  const whiteboard = new WhiteboardCanvas({
    canvas: "#nonexistent-canvas",
    options: { width: 800, height: 600 },
  });
} catch (error) {
  console.error("Canvas initialization failed:", error.message);
  // Handle error appropriately
}
```

---

## 📈 Best Practices

### Performance

```typescript
// ✅ Good: Set up events once
whiteboard.setUpEvents();

// ✅ Good: Use appropriate brush sizes
whiteboard.setBrushSize(5); // Not too large for performance

// ✅ Good: Clean up when done
whiteboard.removeEvents();
```

### Real-time Collaboration

```typescript
// ✅ Good: Check socket connection before setup
if (socket && socket.connected) {
  whiteboard.setUpSocket({ socket, roomId, id });
}

// ✅ Good: Handle disconnections gracefully
socket.on("disconnect", () => {
  // Show offline indicator
  console.log("Disconnected from server");
});
```

---

## 🤝 Contributing

When extending the library:

1. Follow the existing code patterns
2. Add JSDoc comments for all public methods
3. Include usage examples in documentation
4. Test with both mouse and touch inputs
5. Verify real-time functionality with multiple users

---

## 📄 License

[Your license here]

---

## 🔗 Links

- GitHub: [your-repo-url]
- NPM: [your-npm-url]
- Issues: [your-issues-url]
- Documentation: [your-docs-url]
