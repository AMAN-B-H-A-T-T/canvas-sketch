import {
  BATCH_DELAY,
  BATCH_SIZE,
  STROKE_THROTTLE,
} from "./constants/index.constants";
import { CanvasOptions, toolType } from "./types";
import CommonUtilities from "./utilities/commonUtilities";

interface IWthieboardCanvas {
  canvas: HTMLCanvasElement | string;
  options: CanvasOptions;
  socket?: any | null;
}

interface ISocketSetup {
  socket: any;
  roomId?: string | null;
  id?: string | null;
}
class WhiteboardCanvas {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private isDrawing: boolean;
  private tool: toolType;
  private currentStroke: any = null;
  private strokes: Array<any> = [];
  private currentStrokeId: number;
  private microStrokeSequence: number;
  private colorPickerValue: string;
  private brushSize: number;
  private socket: any = null;
  private strokeBuffer: Array<any> = [];
  private batchTimer: number | null = null;
  private lastStrokeSent = 0;
  private socketRoomId: string | null = null;
  private socketUserId: string | null = null;
  private lastContextColor: string = "";
  private lastContextWidth: number = 0;
  private lastContextMode: string = "";

  constructor({ canvas, options, socket }: IWthieboardCanvas) {
    // Handle canvas element or selector
    if (typeof canvas === "string") {
      const element = document.querySelector(canvas) as HTMLCanvasElement;
      if (!element) {
        throw new Error(`Canvas element not found: ${canvas}`);
      }
      this.canvas = element;
    } else {
      this.canvas = canvas;
    }

    // Get 2D context
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to get 2D context from canvas");
    }
    this.context = context;

    // Set canvas dimensions and background
    this.canvas.width = options.width || 800;
    this.canvas.height = options.height || 800;
    if (options.backgroundColor) {
      this.context.fillStyle = options.backgroundColor;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // set isDrawing to false
    this.isDrawing = false;

    // set tool brush by-defalut
    this.tool = "brush";

    // set current stroke id and micro strock squence
    this.currentStrokeId = Date.now();
    this.microStrokeSequence = 0;

    // set colorpicker value to defalut black "#000000"
    this.colorPickerValue = "#000000";
    this.brushSize = 5;

    // this.setUpEvents();
    if (socket) {
      this.socket = socket;
    }
  }
  private setIsDrawing = (val: boolean) => {
    this.isDrawing = val;
  };

  public setTool = (tool: toolType) => {
    const wasDrawing = this.isDrawing;

    // If drawing and tool changes, end current stroke
    if (wasDrawing && this.tool !== tool) {
      this.endDraw();
    }

    this.tool = tool;
  };

  private setCurrentStrokeId = (id: number) => {
    this.currentStroke = id;
  };

  private setCurrentStoke = (val: Array<any> | null) => {
    this.currentStroke = val;
  };

  private setMicroStrokeSequence = (sequence: number) => {
    this.microStrokeSequence = sequence;
  };

  private getPosition = (e: any) => {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX || e.touches[0].clientX) - rect.left,
      y: (e.clientY || e.touches[0].clientY) - rect.top,
    };
  };

  private pushStrokesData = (val: Array<any>) => {
    this.strokes.push(val);
  };

  private setStorkesLength = (val: any) => {
    this.strokes.length = val;
  };

  private pushCurrentStorkeData = (val: any) => {
    this.currentStroke.push(...val);
  };
  // Flood fill algorithm
  private floodFill = (x: number, y: number, fillColor: any) => {
    const imageData = this.context.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const data = imageData.data;
    const width = this.canvas.width;

    // Get the color at the starting position
    const startIndex = (Math.floor(y) * width + Math.floor(x)) * 4;
    const startR = data[startIndex];
    const startG = data[startIndex + 1];
    const startB = data[startIndex + 2];
    const startA = data[startIndex + 3];

    // Convert fill color to RGB
    const fillRGB = CommonUtilities.hexToRgb(fillColor);
    const fillR = fillRGB.r;
    const fillG = fillRGB.g;
    const fillB = fillRGB.b;

    // If the color is the same, no need to fill
    if (
      startR === fillR &&
      startG === fillG &&
      startB === fillB &&
      startA === 255
    ) {
      return;
    }

    // BFS flood fill
    const queue = [[Math.floor(x), Math.floor(y)]];
    const visited = new Set();

    while (queue.length > 0) {
      const [cx, cy]: any = queue.shift();
      const key = `${cx},${cy}`;

      if (
        visited.has(key) ||
        cx < 0 ||
        cx >= width ||
        cy < 0 ||
        cy >= this.canvas.height
      ) {
        continue;
      }

      visited.add(key);

      const index = (cy * width + cx) * 4;

      // Check if the pixel color matches the starting color
      if (
        data[index] === startR &&
        data[index + 1] === startG &&
        data[index + 2] === startB &&
        data[index + 3] === startA
      ) {
        // Paint the pixel
        data[index] = fillR;
        data[index + 1] = fillG;
        data[index + 2] = fillB;
        data[index + 3] = 255;

        // Add neighbors to queue
        queue.push([cx + 1, cy]);
        queue.push([cx - 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx, cy - 1]);
      }
    }

    this.context.putImageData(imageData, 0, 0);
  };

  private startDraw = (e: any) => {
    this.setIsDrawing(true);

    // Generate new stroke ID for this drawing session
    this.setCurrentStrokeId(Date.now() + Math.random());
    this.setMicroStrokeSequence(0);

    const { x, y } = this.getPosition(e);

    if (this.tool === "fill") {
      // For fill tool, execute flood fill immediately
      const fillColor = this.colorPickerValue;
      this.floodFill(x, y, fillColor);

      // Store fill operation as a special stroke (type 2 = fill)
      // Format: [2, color, x, y, originalColor]
      const imageData = this.context.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      const data = imageData.data;
      const startIndex =
        (Math.floor(y) * this.canvas.width + Math.floor(x)) * 4;

      // Get the color that was under the click (before fill)
      // We need to capture what color was there to store it

      const originalR = data[startIndex];
      const originalG = data[startIndex + 1];
      const originalB = data[startIndex + 2];
      const originalColor = CommonUtilities.rgbToHex(
        originalR,
        originalG,
        originalB
      );

      this.setCurrentStoke([2, fillColor, x, y, originalColor]);
      this.pushStrokesData(this.currentStroke);

      this.sendRealtimeFill(x, y, fillColor, originalColor);

      this.setIsDrawing(false);
      return;
    }

    const typeCode = this.tool === "eraser" ? 1 : 0;
    this.setCurrentStoke([
      typeCode,
      this.colorPickerValue,
      this.brushSize,
      x,
      y,
    ]);

    // Initialize context for this stroke
    this.initializeStrokeContext();

    // Start the path for continuous drawing
    this.context.beginPath();
    this.context.moveTo(x, y);
  };

  /**
   * Send fill operation
   */
  private sendRealtimeFill = (
    x: number,
    y: number,
    fillColor: string,
    originalColor: string
  ) => {
    if (!this.socket) return;

    const fillColorIdx = CommonUtilities.getColorIndex(fillColor);
    const origColorIdx = CommonUtilities.getColorIndex(originalColor);

    const fillData = [
      2,
      fillColorIdx,
      Math.round(x),
      Math.round(y),
      origColorIdx,
      fillColor, // Include actual hex color
      originalColor, // Include original hex color
    ];

    this.sendSingleStroke(fillData, "fill");
  };

  private draw = (e: any) => {
    if (!this.isDrawing) return;

    const { x, y } = this.getPosition(e);

    // Get previous point for real-time sending
    const prevX =
      this.currentStroke[this.currentStroke.length - 2] ||
      this.currentStroke[3];
    const prevY =
      this.currentStroke[this.currentStroke.length - 1] ||
      this.currentStroke[4];

    // Check distance to prevent excessive point density
    const distance = Math.sqrt((prevX - x) ** 2 + (prevY - y) ** 2);
    if (distance < 1) return; // Skip too close points

    // Always add to current stroke first (for persistence)
    this.pushCurrentStorkeData([x, y]);

    // Update context only if needed (performance optimization)
    this.updateContextIfNeeded();

    // Continue the path for smooth stroke (no beginPath here!)
    this.context.lineTo(x, y);
    this.context.stroke();

    // Send real-time micro-stroke with enhanced frequency for fast drawing
    this.sendRealtimeStroke(prevX, prevY, x, y);

    // For very fast movements, send additional interpolated points
    if (distance > 20) {
      const steps = Math.floor(distance / 10);
      for (let i = 1; i < steps; i++) {
        const ratio = i / steps;
        const interpX = prevX + (x - prevX) * ratio;
        const interpY = prevY + (y - prevY) * ratio;
        const nextRatio = (i + 1) / steps;
        const nextX = prevX + (x - prevX) * nextRatio;
        const nextY = prevY + (y - prevY) * nextRatio;

        // Send interpolated micro-stroke
        setTimeout(() => {
          this.sendRealtimeStroke(interpX, interpY, nextX, nextY);
        }, i * 2); // Small delay to spread out transmission
      }
    }
  };

  /**
   * Optimized real-time stroke sender 
   * Uses minimal throttling and batching for performance
   */
  private sendRealtimeStroke = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    if (!this.socket) {
      return null; // No connection, skip
    }

    // Minimal throttling for fast drawing (120fps)
    const now = Date.now();
    if (now - this.lastStrokeSent < STROKE_THROTTLE) {
      // Store for later sending instead of dropping
      setTimeout(() => {
        this.sendRealtimeStroke(x1, y1, x2, y2);
      }, STROKE_THROTTLE);
      return null;
    }
    this.setLastStrokeSent(now);

    const colorHex = this.colorPickerValue;
    const colorIdx = CommonUtilities.getColorIndex(colorHex);
    const width = Math.round(this.brushSize);
    const typeCode = this.tool === "eraser" ? 1 : 0;

    const microStroke = [
      typeCode,
      colorIdx,
      width,
      Math.round(x1),
      Math.round(y1),
      Math.round(x2),
      Math.round(y2),
      colorHex, // Include actual hex color as backup
      this.currentStrokeId, // Stroke ID for grouping
      this.microStrokeSequence++, // Sequence number within stroke
    ];

    // Add to batch buffer
    this.pushToStrokeBuffer(microStroke);

    // Send more aggressively for fast drawing
    if (
      this.strokeBuffer.length >= BATCH_SIZE ||
      now - this.lastStrokeSent > 50
    ) {
      this.sendStrokeBatch();
    } else {
      // Set/reset batch timer with shorter delay
      if (this.batchTimer) clearTimeout(this.batchTimer);
      this.batchTimer = setTimeout(this.sendStrokeBatch, BATCH_DELAY);
    }

    return microStroke;
  };

  private endDraw = () => {
    if (!this.isDrawing) return;
    this.setIsDrawing(false);

    // Ensure we have a valid stroke to save
    if (this.currentStroke && this.currentStroke.length >= 5) {
      this.pushStrokesData(this.currentStroke);
      console.log(
        `✓ Saved stroke with ${(this.currentStroke.length - 3) / 2} points`
      );
    }

    // Send any remaining buffered micro-strokes
    if (this.strokeBuffer.length > 0) {
      console.log(this.strokeBuffer);
      this.sendStrokeBatch();
    }

    //todo: Notify others that this stroke is complete
    // if (socket && isConnected) {
    //   socket.emit("stroke-complete", {
    //     roomId: currentRoom,
    //     userId: userId,
    //     timestamp: Date.now(),
    //   });
    // }

    this.setCurrentStoke(null);
  };

  // events
  public setUpEvents = () => {
    this.canvas.addEventListener("mousedown", this.startDraw);
    this.canvas.addEventListener("mousemove", this.draw);
    this.canvas.addEventListener("mouseup", this.endDraw);

    this.canvas.addEventListener("touchstart", this.startDraw);
    this.canvas.addEventListener("touchmove", this.draw);
    this.canvas.addEventListener("touchend", this.endDraw);
  };

  public removeEvents = () => {
    this.setIsDrawing(false);
    this.canvas.removeEventListener("mousedown", this.startDraw);
    this.canvas.removeEventListener("mousemove", this.draw);
    this.canvas.removeEventListener("mouseup", this.endDraw);

    this.canvas.removeEventListener("touchstart", this.startDraw);
    this.canvas.removeEventListener("touchmove", this.draw);
    this.canvas.removeEventListener("touchend", this.endDraw);
  };

  /**
   * Apply single micro-stroke to canvas
   */
  private applyMicroStroke = (microStroke: Array<any>) => {
    if (microStroke.length >= 7) {
      // Line segment: [type, colorIdx, width, x1, y1, x2, y2, hexColor?, strokeId?, sequence?]
      const [
        type,
        colorIdx,
        width,
        x1,
        y1,
        x2,
        y2,
        hexColor,
        strokeId,
        sequence,
      ] = microStroke;

      this.context.lineJoin = "round";
      this.context.lineCap = "round";
      this.context.lineWidth = width;

      if (type === 1) {
        this.context.globalCompositeOperation = "destination-out";
      } else {
        this.context.globalCompositeOperation = "source-over";
        // Use hex color if available, otherwise fall back to palette
        const strokeColor = hexColor || CommonUtilities.indexToColor(colorIdx);
        this.context.strokeStyle = strokeColor;
      }

      // Draw the line segment
      this.context.beginPath();
      this.context.moveTo(x1, y1);
      this.context.lineTo(x2, y2);
      this.context.stroke();

      this.context.globalCompositeOperation = "source-over";
    }
  };

  // Export drawing data with compact format
  public exportData = () => {
    const binaryData = CommonUtilities.encodeDrawingBinary(this.strokes);

    // Also create a metadata file for reference
    const metaData = {
      format: "binary-v1",
      version: 1,
      timestamp: new Date().toISOString(),
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      numStrokes: this.strokes.length,
      sizeBytes: binaryData.byteLength,
      colorPalette: CommonUtilities.colorPalette,
      note: "Use binary format for real-time sync (90% smaller than JSON)",
    };

    // Create a combined export (binary + metadata)
    const combinedData = {
      meta: metaData,
      binaryDataBase64: Array.from(binaryData)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    };

    const combinedStr = JSON.stringify(combinedData);
    const combinedBlob = new Blob([combinedStr], { type: "application/json" });

    // Download combined file
    const url = URL.createObjectURL(combinedBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing_" + new Date().getTime() + ".drawing.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============================================
  // MICRO-STROKE STYLE FORMAT
  // ============================================

  /**
   * Convert current drawing to  micro-strokes
   * Format: [type, colorIdx, width, x1, y1, x2, y2] per segment
   * Each stroke becomes multiple 7-element arrays (one per line segment)
   */
  private getMicroStrokesStyleData = () => {
    const microStrokes: Array<any> = [];

    this.strokes.forEach((stroke) => {
      const typeCode = stroke[0];

      if (typeCode === 2) {
        // Fill stroke: [2, colorIdx, x, y] (simplified)
        const colorIdx = CommonUtilities.getColorIndex(stroke[1]);
        microStrokes.push([
          2,
          colorIdx,
          Math.round(stroke[2]),
          Math.round(stroke[3]),
        ]);
      } else {
        // Brush/eraser stroke: break into segments
        const [, color, width, ...points] = stroke;
        const colorIdx = CommonUtilities.getColorIndex(color);
        const w = Math.round(width);

        // Create micro-stroke for each line segment
        for (let i = 0; i < points.length - 2; i += 2) {
          const x1 = Math.round(points[i]);
          const y1 = Math.round(points[i + 1]);
          const x2 = Math.round(points[i + 2]);
          const y2 = Math.round(points[i + 3]);

          microStrokes.push([typeCode, colorIdx, w, x1, y1, x2, y2]);
        }
      }
    });

    return microStrokes;
  };

  /**
   * Get JSON string of micro-strokes style data (ultra-compact for real-time)
   */
  public getMicroStrokesJSON = () => {
    return JSON.stringify(this.getMicroStrokesStyleData());
  };

  /**
   * Apply  micro-strokes to canvas
   */
  private applyStrokesData = (microStrokes: Array<any>) => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    microStrokes.forEach((micro) => {
      if (micro.length === 4) {
        // Fill: [2, colorIdx, x, y]
        const [type, colorIdx, x, y] = micro;
        this.floodFill(x, y, CommonUtilities.indexToColor(colorIdx));
      } else if (micro.length === 7) {
        // Line segment: [type, colorIdx, width, x1, y1, x2, y2]
        const [type, colorIdx, width, x1, y1, x2, y2] = micro;

        this.context.lineJoin = "round";
        this.context.lineCap = "round";
        this.context.lineWidth = width;

        if (type === 1) {
          this.context.globalCompositeOperation = "destination-out";
        } else {
          this.context.globalCompositeOperation = "source-over";
          this.context.strokeStyle = CommonUtilities.indexToColor(colorIdx);
        }

        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
      }
    });

    this.context.globalCompositeOperation = "source-over";
  };

  public clearCanvas = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setStorkesLength(0);

    // Send real-time clear
    this.sendCanvasClear();
  };

  private initializeStrokeContext = () => {
    const width = this.brushSize;
    const color = this.colorPickerValue;
    const mode = this.tool === "eraser" ? "destination-out" : "source-over";

    // Set all context properties at once
    this.context.lineJoin = "round";
    this.context.lineCap = "round";
    this.context.lineWidth = width;
    this.context.globalCompositeOperation = mode;

    if (this.tool !== "eraser") {
      this.context.strokeStyle = color;
    }

    // Track current state to avoid redundant updates
    this.lastContextColor = color;
    this.lastContextWidth = width;
    this.lastContextMode = mode;
  };

  private updateContextIfNeeded = () => {
    const currentColor = this.currentStroke[1];
    const currentWidth = this.currentStroke[2];
    const currentMode =
      this.currentStroke[0] === 1 ? "destination-out" : "source-over";

    // Only update if values have changed
    if (
      this.lastContextColor !== currentColor ||
      this.lastContextWidth !== currentWidth ||
      this.lastContextMode !== currentMode
    ) {
      this.context.lineWidth = currentWidth;
      this.context.globalCompositeOperation = currentMode;

      if (currentMode === "source-over") {
        this.context.strokeStyle = currentColor;
      }

      // Update tracking variables
      this.lastContextColor = currentColor;
      this.lastContextWidth = currentWidth;
      this.lastContextMode = currentMode;
    }
  };

  public setColorPickerValue = (val: string) => {
    this.colorPickerValue = val;

    // If currently drawing, update current stroke color for smooth transition
    if (
      this.isDrawing &&
      this.currentStroke &&
      this.tool !== "eraser" &&
      this.tool !== "fill"
    ) {
      this.currentStroke[1] = val;
    }
  };

  public setBrushSize = (size: number) => {
    this.brushSize = size;

    // If currently drawing, update current stroke size
    if (this.isDrawing && this.currentStroke && this.tool !== "fill") {
      this.currentStroke[2] = size;
    }
  };

  public setLastStrokeSent = (val: number) => {
    this.lastStrokeSent = val;
  };

  public pushToStrokeBuffer = (val: any) => {
    this.strokeBuffer.push(val);
  };

  /**
   * ==================================================
   * SOCKET.IO EVENTS FOR REAL-TIME CANVAS DATA SHARING
   * ==================================================
   */
  /**
   * Send batched strokes for optimal performance
   */

  setUpSocket = ({ socket, roomId, id }: ISocketSetup) => {
    this.socket = socket;
    this.socketRoomId = roomId ? roomId : null;
    this.socketUserId = id ? id : null;
  };

  private sendStrokeBatch = () => {
    if (!this.socket || this.strokeBuffer.length === 0) return;

    // Send batch of micro-strokes
    this.socket.emit("stroke-batch", {
      roomId: this.socketRoomId,
      userId: this.socketUserId,
      strokes: [...this.strokeBuffer], // Copy array
      timestamp: Date.now(),
    });

    console.log(`📦 Sent batch: ${this.strokeBuffer.length} micro-strokes`);

    // Clear buffer
    this.strokeBuffer.length = 0;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  };

  /**
   * Send single stroke for critical actions (fills, clears)
   */
  private sendSingleStroke = (microStroke: Array<any>, type = "stroke") => {
    if (!this.socket) return;

    this.socket.emit("single-stroke", {
      roomId: this.socketRoomId,
      userId: this.socketUserId,
      stroke: microStroke,
      type: type, // 'stroke', 'fill', 'clear'
      timestamp: Date.now(),
    });

    console.log(`🎯 Sent ${type}:`, microStroke);
  };

  /**
   * Send canvas clear
   */
  private sendCanvasClear = () => {
    if (!this.socket) return;

    this.socket.emit("canvas-clear", {
      roomId: this.socketRoomId,
      userId: this.socketUserId,
      timestamp: Date.now(),
    });

    console.log("🧹 Sent canvas clear");
  };

  public sendCompleteDrawing = () => {
    if (!this.socket) return;

    const microStrokes = this.getMicroStrokesStyleData();

    this.socket.emit("drawing-sync", {
      roomId: this.socketRoomId,
      userId: this.socketUserId,
      strokes: microStrokes,
      colorPalette: CommonUtilities.colorPalette,
      timestamp: Date.now(),
    });

    console.log(
      `📋 Sent complete drawing: ${microStrokes.length} micro-strokes`
    );
  };

  public syncColorPalette() {
    if (!this.socket) return null;

    this.socket.emit("color-palette-sync", {
      roomId: this.socketRoomId,
      userId: this.socketUserId,
      colorPalette: CommonUtilities.colorPalette,
      timestamp: Date.now(),
    });
  }

  /**
   * ===================================================
   * SOCKET.IO LISTING EVENTS
   * ===================================================
   */

  /** sync stroke-batch */
  public syncStrokeBatchData = (stroeks: Array<any>) => {
    // Sort strokes by sequence if available for proper ordering
    const sortedStrokes = stroeks.sort((a, b) => {
      if (a.length >= 10 && b.length >= 10) {
        // Compare by strokeId first, then sequence
        if (a[8] !== b[8]) return a[8] - b[8];
        return (a[9] || 0) - (b[9] || 0);
      }
      return 0;
    });

    // Apply each micro-stroke immediately and store for persistence
    sortedStrokes.forEach((microStroke) => {
      this.applyMicroStroke(microStroke);
      // addMicroStrokeToHistory(microStroke, data.userId);
    });
  };

  /**
   * apply single-storkes
   */
  public syncSingleStorkes = (stroke: Array<any>, type: toolType) => {
    if (type === "fill") {
      const [
        type,
        fillColorIdx,
        x,
        y,
        origColorIdx,
        fillColorHex,
        origColorHex,
      ] = stroke;

      // Use hex color if available, otherwise fall back to palette
      const actualFillColor =
        fillColorHex || CommonUtilities.indexToColor(fillColorIdx);
      const actualOrigColor =
        origColorHex || CommonUtilities.indexToColor(origColorIdx);

      console.log(`🪣 Filling with color: ${actualFillColor}`);
      this.floodFill(x, y, actualFillColor);

      // Add to strokes array for persistence
      this.pushStrokesData([2, actualFillColor, x, y, actualOrigColor]);
    } else {
      this.applyMicroStroke(stroke);
    }
  };

  /**
   * clear canvas event
   */
  public syncClearCanvas = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setStorkesLength(0);
  };

  /** storke complete  */
  public syncStrokeComplete = () => {};

  /**
   * drawing sync
   */
  public syncDrawing = (strokes: Array<any>) => {
    // Clear and apply new drawing
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setStorkesLength(0);

    this.applyStrokesData(strokes);
  };
}

export default WhiteboardCanvas;
