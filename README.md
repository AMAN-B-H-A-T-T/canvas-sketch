# 🎨 WhiteboardCanvas - Real-time Collaborative Drawing Library

[![npm version](https://badge.fury.io/js/canvas-sketch.svg)](https://badge.fury.io/js/canvas-sketch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A powerful, lightweight, and feature-rich HTML5 Canvas drawing library with real-time collaboration support. Perfect for building interactive whiteboards, drawing applications, and collaborative sketching tools.

## ✨ Features

- 🎯 **Simple API** - Easy to integrate and use
- 🌐 **Real-time Collaboration** - Socket.IO integration for multi-user drawing
- 📱 **Touch Support** - Works seamlessly on mobile devices
- 🎨 **Multiple Tools** - Brush, eraser, and fill bucket
- 💾 **Data Export** - Save and load drawings
- ⚡ **High Performance** - Optimized for smooth drawing experience
- 🗜️ **Compact Data** - 90% smaller data size with binary encoding
- 🔧 **TypeScript** - Full TypeScript support with type definitions

## 🚀 Quick Start

### Installation

```bash
npm install canvas-sketch
# or
yarn add canvas-sketch
```

### Basic Usage

```typescript
import WhiteboardCanvas from "canvas-sketch";

// Create a whiteboard
const whiteboard = new WhiteboardCanvas({
  canvas: "#my-canvas",
  options: {
    width: 800,
    height: 600,
    backgroundColor: "#ffffff",
  },
});

// Enable drawing
whiteboard.setUpEvents();

// Set drawing properties
whiteboard.setTool("brush");
whiteboard.setColorPickerValue("#ff0000");
whiteboard.setBrushSize(5);
```

### HTML Setup

```html
<canvas id="my-canvas"></canvas>
<div>
  <button onclick="whiteboard.setTool('brush')">Brush</button>
  <button onclick="whiteboard.setTool('eraser')">Eraser</button>
  <button onclick="whiteboard.setTool('fill')">Fill</button>
  <input type="color" onchange="whiteboard.setColorPickerValue(this.value)" />
  <input
    type="range"
    min="1"
    max="20"
    onchange="whiteboard.setBrushSize(this.value)"
  />
  <button onclick="whiteboard.clearCanvas()">Clear</button>
</div>
```

## 🌐 Real-time Collaboration

Enable real-time collaborative drawing with Socket.IO:

```typescript
import io from "socket.io-client";

const socket = io("http://localhost:3000");
const whiteboard = new WhiteboardCanvas({
  canvas: "#canvas",
  options: { width: 800, height: 600 },
  socket: socket,
});

// Setup real-time events
whiteboard.setUpSocket({
  socket: socket,
  roomId: "room-123",
  id: "user-456",
});

// Handle real-time events
socket.on("stroke-batch", (data) => {
  whiteboard.syncStrokeBatchData(data.strokes);
});

socket.on("canvas-clear", () => {
  whiteboard.syncClearCanvas();
});
```

## 🎯 API Overview

### Core Methods

| Method                       | Description            | Example                                     |
| ---------------------------- | ---------------------- | ------------------------------------------- |
| `setTool(tool)`              | Set drawing tool       | `whiteboard.setTool('brush')`               |
| `setColorPickerValue(color)` | Set drawing color      | `whiteboard.setColorPickerValue('#ff0000')` |
| `setBrushSize(size)`         | Set brush size         | `whiteboard.setBrushSize(10)`               |
| `clearCanvas()`              | Clear the canvas       | `whiteboard.clearCanvas()`                  |
| `setUpEvents()`              | Enable drawing events  | `whiteboard.setUpEvents()`                  |
| `removeEvents()`             | Disable drawing events | `whiteboard.removeEvents()`                 |
| `exportData()`               | Export drawing data    | `whiteboard.exportData()`                   |

### Real-time Methods

| Method                         | Description          | Example                                        |
| ------------------------------ | -------------------- | ---------------------------------------------- |
| `setUpSocket(config)`          | Configure Socket.IO  | `whiteboard.setUpSocket({socket, roomId, id})` |
| `syncStrokeBatchData(strokes)` | Apply remote strokes | `whiteboard.syncStrokeBatchData(data.strokes)` |
| `sendCompleteDrawing()`        | Send current drawing | `whiteboard.sendCompleteDrawing()`             |

### Utility Functions

```typescript
import { CommonUtilities } from "canvas-sketch";

// Color conversion
const rgb = CommonUtilities.hexToRgb("#ff0000");
const hex = CommonUtilities.rgbToHex(255, 0, 0);

// Color palette management
const colorIndex = CommonUtilities.getColorIndex("#ff0000");
const color = CommonUtilities.indexToColor(2);

// Binary encoding for efficient storage
const binaryData = CommonUtilities.encodeDrawingBinary(strokes);
```

## 📊 Performance Features

### Optimized Real-time Transmission

- **120fps throttling** for smooth drawing
- **Batch processing** reduces network overhead
- **Binary encoding** - 90% smaller than JSON
- **Color palette system** reduces data size

### Memory Efficient

- **Delta encoding** for coordinates
- **Context caching** prevents redundant updates
- **Automatic buffer management**

## 🎨 Drawing Tools

### Brush Tool

```typescript
whiteboard.setTool("brush");
whiteboard.setColorPickerValue("#ff0000");
whiteboard.setBrushSize(5);
```

### Eraser Tool

```typescript
whiteboard.setTool("eraser");
whiteboard.setBrushSize(10);
```

### Fill Tool

```typescript
whiteboard.setTool("fill");
whiteboard.setColorPickerValue("#00ff00");
// Click to fill areas with color
```

## 📱 Mobile Support

Full touch support for mobile devices:

```typescript
// Works automatically with setUpEvents()
whiteboard.setUpEvents(); // Enables both mouse and touch

// Supports:
// - Multi-touch devices
// - iOS Safari
// - Android Chrome
// - Touch-enabled laptops
```

## 💾 Data Management

### Export Drawing

```typescript
// Download as file
whiteboard.exportData();

// Get as JSON string
const drawingData = whiteboard.getSkribblJSON();
console.log(drawingData);
```

### Import/Load Drawing

```typescript
// Apply drawing data
const strokes = JSON.parse(drawingData);
whiteboard.syncDrawing(strokes);
```

## 🔧 Configuration Options

```typescript
interface CanvasOptions {
  width?: number; // Canvas width (default: 800)
  height?: number; // Canvas height (default: 800)
  backgroundColor?: string; // Background color (optional)
}

type toolType = "brush" | "fill" | "eraser";
```

## 🎭 Complete Example

```typescript
import WhiteboardCanvas, { CommonUtilities } from "canvas-sketch";
import io from "socket.io-client";

class DrawingApp {
  private whiteboard: WhiteboardCanvas;
  private socket: any;

  constructor() {
    // Initialize canvas
    this.whiteboard = new WhiteboardCanvas({
      canvas: "#drawing-canvas",
      options: {
        width: 1200,
        height: 800,
        backgroundColor: "#f8f9fa",
      },
    });

    // Setup real-time collaboration
    this.socket = io("ws://localhost:3000");
    this.whiteboard.setUpSocket({
      socket: this.socket,
      roomId: "drawing-room-1",
      id: `user-${Date.now()}`,
    });

    this.setupEvents();
    this.setupUI();
  }

  private setupEvents() {
    this.whiteboard.setUpEvents();

    // Real-time event handlers
    this.socket.on("stroke-batch", (data: any) => {
      if (data.userId !== this.socket.id) {
        this.whiteboard.syncStrokeBatchData(data.strokes);
      }
    });

    this.socket.on("canvas-clear", (data: any) => {
      if (data.userId !== this.socket.id) {
        this.whiteboard.syncClearCanvas();
      }
    });

    this.socket.on("user-joined", () => {
      this.whiteboard.sendCompleteDrawing();
    });
  }

  private setupUI() {
    // Tool selection
    document.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tool = (e.target as HTMLElement).dataset.tool as any;
        this.whiteboard.setTool(tool);
      });
    });

    // Color picker
    const colorPicker = document.getElementById(
      "color-picker"
    ) as HTMLInputElement;
    colorPicker.addEventListener("change", (e) => {
      this.whiteboard.setColorPickerValue((e.target as HTMLInputElement).value);
    });

    // Size slider
    const sizeSlider = document.getElementById(
      "size-slider"
    ) as HTMLInputElement;
    sizeSlider.addEventListener("input", (e) => {
      this.whiteboard.setBrushSize(
        parseInt((e.target as HTMLInputElement).value)
      );
    });
  }
}

// Initialize the app
new DrawingApp();
```

## 🎨 Default Color Palette

The library includes a pre-defined color palette for efficient real-time transmission:

```typescript
const colors = [
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
```

## 🛠️ Server Setup (Socket.IO)

Basic server setup for real-time collaboration:

```javascript
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on("connection", (socket) => {
  socket.on("stroke-batch", (data) => {
    socket.to(data.roomId).emit("stroke-batch", data);
  });

  socket.on("canvas-clear", (data) => {
    socket.to(data.roomId).emit("canvas-clear", data);
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## 🔍 Troubleshooting

### Common Issues

**Canvas not responding to clicks:**

```typescript
// Make sure events are set up
whiteboard.setUpEvents();

// Check canvas element exists
const canvas = document.getElementById("canvas");
console.log(canvas); // Should not be null
```

**Real-time not working:**

```typescript
// Verify socket connection
socket.on("connect", () => {
  console.log("Connected to server");
  whiteboard.setUpSocket({ socket, roomId: "test", id: socket.id });
});
```

**Performance issues:**

```typescript
// Reduce brush size for better performance
whiteboard.setBrushSize(3); // Instead of 20

// Check canvas size isn't too large
// Recommended max: 1920x1080
```

## 📈 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ iOS Safari 12+
- ✅ Android Chrome 60+

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Canvas API for providing the drawing foundation
- Socket.IO for real-time communication
- TypeScript team for excellent type support

## 📞 Support

- 📧 Email: [your-email]
- 🐛 Issues: [GitHub Issues](your-issues-url)
- 💬 Discussions: [GitHub Discussions](your-discussions-url)
- 📖 Documentation: [Full API Docs](./API_DOCUMENTATION.md)
