# 🔍 WhiteboardCanvas - Function Reference

## 📝 Quick Function Lookup

### 🏗️ Constructor

```typescript
new WhiteboardCanvas({ canvas, options, socket });
```

- **Purpose**: Initialize drawing canvas with configuration
- **Parameters**: Canvas element/selector, options object, optional socket
- **Example**: `new WhiteboardCanvas({ canvas: '#canvas', options: {width: 800, height: 600} })`

---

## 🎨 Drawing Control Functions

### `setTool(tool: toolType)`

- **Purpose**: Switch between drawing tools
- **Parameters**: `"brush"` | `"eraser"` | `"fill"`
- **Use Case**: Tool switching in UI
- **Example**: `whiteboard.setTool('brush')`

### `setColorPickerValue(color: string)`

- **Purpose**: Set drawing/fill color
- **Parameters**: Hex color string (e.g., "#ff0000")
- **Use Case**: Color picker integration
- **Example**: `whiteboard.setColorPickerValue('#ff0000')`
- **Note**: Updates current stroke color in real-time

### `setBrushSize(size: number)`

- **Purpose**: Set brush/eraser thickness
- **Parameters**: Size in pixels (recommended 1-50)
- **Use Case**: Size slider integration
- **Example**: `whiteboard.setBrushSize(10)`
- **Note**: Updates current stroke size in real-time

---

## 🎛️ Event Management Functions

### `setUpEvents()`

- **Purpose**: Enable mouse and touch drawing interactions
- **Parameters**: None
- **Use Case**: Initialize drawing functionality
- **Example**: `whiteboard.setUpEvents()`
- **Note**: Must call this to enable drawing

### `removeEvents()`

- **Purpose**: Disable all drawing interactions
- **Parameters**: None
- **Use Case**: Read-only mode, cleanup
- **Example**: `whiteboard.removeEvents()`
- **Note**: Stops any active drawing

---

## 🧹 Canvas Management Functions

### `clearCanvas()`

- **Purpose**: Clear entire canvas and reset drawing history
- **Parameters**: None
- **Use Case**: Clear button functionality
- **Example**: `whiteboard.clearCanvas()`
- **Note**: Syncs to all users in real-time mode

---

## 💾 Data Export Functions

### `exportData()`

- **Purpose**: Download drawing as .drawing.json file
- **Parameters**: None
- **Returns**: Triggers file download
- **Use Case**: Save drawing functionality
- **Example**: `whiteboard.exportData()`
- **Note**: Includes binary data + metadata for efficiency

### `getSkribblJSON()`

- **Purpose**: Get drawing data as compact JSON string
- **Parameters**: None
- **Returns**: `string` - Micro-stroke format JSON
- **Use Case**: Save to database, API transmission
- **Example**:

```typescript
const data = whiteboard.getSkribblJSON();
localStorage.setItem("drawing", data);
```

---

## 🌐 Real-time Collaboration Functions

### `setUpSocket({ socket, roomId?, id? })`

- **Purpose**: Configure Socket.IO for real-time collaboration
- **Parameters**: Socket instance, optional room ID, optional user ID
- **Use Case**: Enable multi-user drawing
- **Example**:

```typescript
whiteboard.setUpSocket({
  socket: io("http://localhost:3000"),
  roomId: "room-123",
  id: "user-456",
});
```

### `sendCompleteDrawing()`

- **Purpose**: Send entire current drawing to all connected users
- **Parameters**: None
- **Use Case**: Sync new users joining room
- **Example**: `whiteboard.sendCompleteDrawing()`
- **Note**: Use when new user joins room

### `syncColorPalette()`

- **Purpose**: Sync custom color palette with other users
- **Parameters**: None
- **Use Case**: Share custom colors across users
- **Example**: `whiteboard.syncColorPalette()`

---

## 📡 Real-time Sync Functions (Event Handlers)

### `syncStrokeBatchData(strokes: Array<any>)`

- **Purpose**: Apply batched stroke data from other users
- **Parameters**: Array of micro-stroke data
- **Use Case**: Handle incoming drawing data
- **Example**:

```typescript
socket.on("stroke-batch", (data) => {
  whiteboard.syncStrokeBatchData(data.strokes);
});
```

### `syncSingleStorkes(stroke: Array<any>, type: toolType)`

- **Purpose**: Apply single stroke operations (fills, special actions)
- **Parameters**: Single stroke array, operation type
- **Use Case**: Handle fill operations, special strokes
- **Example**:

```typescript
socket.on("single-stroke", (data) => {
  whiteboard.syncSingleStorkes(data.stroke, data.type);
});
```

### `syncClearCanvas()`

- **Purpose**: Apply canvas clear from other users
- **Parameters**: None
- **Use Case**: Handle remote clear operations
- **Example**:

```typescript
socket.on("canvas-clear", () => {
  whiteboard.syncClearCanvas();
});
```

### `syncDrawing(strokes: Array<any>)`

- **Purpose**: Replace entire canvas with new drawing
- **Parameters**: Complete drawing as micro-stroke array
- **Use Case**: Load saved drawing, full sync
- **Example**:

```typescript
socket.on("drawing-sync", (data) => {
  whiteboard.syncDrawing(data.strokes);
});
```

---

## 🛠️ CommonUtilities Static Functions

### Color Conversion Functions

#### `CommonUtilities.rgbToHex(r: number, g: number, b: number): string`

- **Purpose**: Convert RGB values to hex color
- **Parameters**: Red (0-255), Green (0-255), Blue (0-255)
- **Returns**: Hex color string
- **Example**: `CommonUtilities.rgbToHex(255, 0, 0)` → `"#FF0000"`

#### `CommonUtilities.hexToRgb(hex: string): {r, g, b}`

- **Purpose**: Convert hex color to RGB object
- **Parameters**: Hex color string
- **Returns**: Object with r, g, b properties
- **Example**: `CommonUtilities.hexToRgb('#FF0000')` → `{r: 255, g: 0, b: 0}`

### Color Palette Functions

#### `CommonUtilities.getColorIndex(color: string): number`

- **Purpose**: Get palette index for color (creates if new)
- **Parameters**: Hex color string
- **Returns**: Palette index number
- **Use Case**: Optimize real-time transmission
- **Example**: `CommonUtilities.getColorIndex('#FF0000')` → `2`

#### `CommonUtilities.indexToColor(idx: number): string`

- **Purpose**: Convert palette index back to hex color
- **Parameters**: Palette index
- **Returns**: Hex color string
- **Example**: `CommonUtilities.indexToColor(2)` → `"#FF0000"`

#### `CommonUtilities.colorPalette: string[]`

- **Purpose**: Access default color palette array
- **Type**: Static readonly array of 20 colors
- **Use Case**: Display available colors, palette management
- **Example**:

```typescript
CommonUtilities.colorPalette.forEach((color) => {
  // Create color swatches
});
```

### Binary Encoding Functions

#### `CommonUtilities.encodeDrawingBinary(strokes: Array<any>): Uint8Array`

- **Purpose**: Encode drawing to ultra-compact binary format
- **Parameters**: Array of stroke data
- **Returns**: Binary data as Uint8Array
- **Use Case**: Efficient storage, fast transmission
- **Benefit**: 90% smaller than JSON
- **Example**:

```typescript
const binary = CommonUtilities.encodeDrawingBinary(strokes);
console.log(`Size: ${binary.length} bytes`);
```

---

## 📊 Data Structures

### Stroke Data Format

```typescript
// Brush/Eraser stroke
[type, color, width, x1, y1, x2, y2, ..., xN, yN]
// type: 0=brush, 1=eraser
// color: hex string ("#ff0000")
// width: number (pixels)
// coordinates: alternating x,y pairs

// Fill operation
[2, fillColor, x, y, originalColor]
// type: 2=fill
// fillColor: hex string of new color
// x,y: click coordinates
// originalColor: hex string of replaced color
```

### Micro-stroke Format (Real-time)

```typescript
[type, colorIndex, width, x1, y1, x2, y2, hexColor?, strokeId?, sequence?]
// Compact format for network transmission
// Uses color indices instead of full hex codes
```

---

## 🎯 Common Usage Patterns

### Basic Setup

```typescript
const whiteboard = new WhiteboardCanvas({
  canvas: "#canvas",
  options: { width: 800, height: 600 },
});
whiteboard.setUpEvents();
```

### Tool Switching

```typescript
// Brush with red color
whiteboard.setTool("brush");
whiteboard.setColorPickerValue("#ff0000");
whiteboard.setBrushSize(5);

// Eraser
whiteboard.setTool("eraser");
whiteboard.setBrushSize(10);

// Fill tool
whiteboard.setTool("fill");
whiteboard.setColorPickerValue("#00ff00");
```

### Real-time Setup

```typescript
const socket = io("http://localhost:3000");
whiteboard.setUpSocket({ socket, roomId: "room1", id: "user1" });

socket.on("stroke-batch", (data) =>
  whiteboard.syncStrokeBatchData(data.strokes)
);
socket.on("canvas-clear", () => whiteboard.syncClearCanvas());
```

### Save & Load

```typescript
// Save
const drawingData = whiteboard.getSkribblJSON();
localStorage.setItem("drawing", drawingData);

// Load
const saved = localStorage.getItem("drawing");
if (saved) {
  whiteboard.syncDrawing(JSON.parse(saved));
}
```

---

## ⚡ Performance Tips

1. **Brush Size**: Keep under 20px for smooth performance
2. **Canvas Size**: Recommended max 1920x1080
3. **Real-time**: Use batch events, not individual stroke events
4. **Colors**: Use palette colors for better compression
5. **Cleanup**: Call `removeEvents()` when component unmounts

---

## 🔧 Integration Examples

### React Hook

```typescript
const useWhiteboard = (canvasRef, options) => {
  const [whiteboard, setWhiteboard] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      const wb = new WhiteboardCanvas({
        canvas: canvasRef.current,
        options,
      });
      wb.setUpEvents();
      setWhiteboard(wb);

      return () => wb.removeEvents();
    }
  }, []);

  return whiteboard;
};
```

### Vue Composition API

```typescript
export const useWhiteboard = (canvasEl, options) => {
  const whiteboard = ref(null);

  onMounted(() => {
    if (canvasEl.value) {
      whiteboard.value = new WhiteboardCanvas({
        canvas: canvasEl.value,
        options,
      });
      whiteboard.value.setUpEvents();
    }
  });

  onUnmounted(() => {
    whiteboard.value?.removeEvents();
  });

  return { whiteboard };
};
```
