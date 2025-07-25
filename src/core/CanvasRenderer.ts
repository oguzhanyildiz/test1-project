// Canvas Rendering System - Drawing operations and viewport management

export interface Point2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderOptions {
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
  font?: string;
  textAlign?: CanvasTextAlign;
  alpha?: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Viewport and camera
  private viewportWidth: number;
  private viewportHeight: number;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private zoom: number = 1.0;
  
  // Rendering state (for future use with advanced state management)
  // private savedStates: ImageData[] = [];
  
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.viewportWidth = canvas.width;
    this.viewportHeight = canvas.height;
    
    // Set default rendering properties
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.textBaseline = 'top';
    
    console.log('🎨 CanvasRenderer initialized');
  }
  
  /**
   * Update viewport size (call when canvas is resized)
   */
  public updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    
    console.log(`🖼️ Viewport updated: ${width}x${height}`);
  }
  
  /**
   * Clear the entire canvas
   */
  public clear(color: string = '#0f0f23'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
  }
  
  /**
   * Save current rendering state
   */
  public save(): void {
    this.ctx.save();
  }
  
  /**
   * Restore previous rendering state
   */
  public restore(): void {
    this.ctx.restore();
  }
  
  /**
   * Apply rendering options
   */
  private applyOptions(options?: RenderOptions): void {
    if (!options) return;
    
    if (options.fillStyle) this.ctx.fillStyle = options.fillStyle;
    if (options.strokeStyle) this.ctx.strokeStyle = options.strokeStyle;
    if (options.lineWidth) this.ctx.lineWidth = options.lineWidth;
    if (options.font) this.ctx.font = options.font;
    if (options.textAlign) this.ctx.textAlign = options.textAlign;
    if (options.alpha !== undefined) this.ctx.globalAlpha = options.alpha;
  }
  
  /**
   * Transform world coordinates to screen coordinates
   */
  public worldToScreen(worldX: number, worldY: number): Point2D {
    return {
      x: (worldX - this.cameraX) * this.zoom + this.viewportWidth / 2,
      y: (worldY - this.cameraY) * this.zoom + this.viewportHeight / 2
    };
  }
  
  /**
   * Transform screen coordinates to world coordinates
   */
  public screenToWorld(screenX: number, screenY: number): Point2D {
    return {
      x: (screenX - this.viewportWidth / 2) / this.zoom + this.cameraX,
      y: (screenY - this.viewportHeight / 2) / this.zoom + this.cameraY
    };
  }
  
  /**
   * Draw a filled circle
   */
  public drawCircle(x: number, y: number, radius: number, options?: RenderOptions): void {
    this.save();
    this.applyOptions(options);
    
    const screenPos = this.worldToScreen(x, y);
    const screenRadius = radius * this.zoom;
    
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
    
    if (options?.fillStyle) {
      this.ctx.fill();
    }
    if (options?.strokeStyle) {
      this.ctx.stroke();
    }
    
    this.restore();
  }
  
  /**
   * Draw a filled rectangle
   */
  public drawRectangle(x: number, y: number, width: number, height: number, options?: RenderOptions): void {
    this.save();
    this.applyOptions(options);
    
    const screenPos = this.worldToScreen(x, y);
    const screenWidth = width * this.zoom;
    const screenHeight = height * this.zoom;
    
    if (options?.fillStyle) {
      this.ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
    }
    if (options?.strokeStyle) {
      this.ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
    }
    
    this.restore();
  }
  
  /**
   * Draw a line between two points
   */
  public drawLine(x1: number, y1: number, x2: number, y2: number, options?: RenderOptions): void {
    this.save();
    this.applyOptions(options);
    
    const screenPos1 = this.worldToScreen(x1, y1);
    const screenPos2 = this.worldToScreen(x2, y2);
    
    this.ctx.beginPath();
    this.ctx.moveTo(screenPos1.x, screenPos1.y);
    this.ctx.lineTo(screenPos2.x, screenPos2.y);
    this.ctx.stroke();
    
    this.restore();
  }
  
  /**
   * Draw text at specified position
   */
  public drawText(text: string, x: number, y: number, options?: RenderOptions): void {
    this.save();
    this.applyOptions(options);
    
    const screenPos = this.worldToScreen(x, y);
    
    if (options?.fillStyle) {
      this.ctx.fillText(text, screenPos.x, screenPos.y);
    }
    if (options?.strokeStyle) {
      this.ctx.strokeText(text, screenPos.x, screenPos.y);
    }
    
    this.restore();
  }
  
  /**
   * Draw text using screen coordinates (for UI elements)
   */
  public drawScreenText(text: string, x: number, y: number, options?: RenderOptions): void {
    this.save();
    this.applyOptions(options);
    
    if (options?.fillStyle) {
      this.ctx.fillText(text, x, y);
    }
    if (options?.strokeStyle) {
      this.ctx.strokeText(text, x, y);
    }
    
    this.restore();
  }
  
  /**
   * Draw a simple beam/laser effect
   */
  public drawBeam(x1: number, y1: number, x2: number, y2: number, width: number = 2, color: string = '#FF0000', alpha: number = 1): void {
    this.save();
    
    const screenPos1 = this.worldToScreen(x1, y1);
    const screenPos2 = this.worldToScreen(x2, y2);
    
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width * this.zoom;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(screenPos1.x, screenPos1.y);
    this.ctx.lineTo(screenPos2.x, screenPos2.y);
    this.ctx.stroke();
    
    this.restore();
  }
  
  /**
   * Draw a simple particle effect (for explosions, impacts, etc.)
   */
  public drawParticle(x: number, y: number, size: number, color: string, alpha: number = 1): void {
    this.drawCircle(x, y, size, {
      fillStyle: color,
      alpha: alpha
    });
  }
  
  /**
   * Set camera position
   */
  public setCameraPosition(x: number, y: number): void {
    this.cameraX = x;
    this.cameraY = y;
  }
  
  /**
   * Set zoom level
   */
  public setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(5.0, zoom)); // Clamp between 0.1x and 5x
  }
  
  /**
   * Get current camera position
   */
  public getCameraPosition(): Point2D {
    return { x: this.cameraX, y: this.cameraY };
  }
  
  /**
   * Get current zoom level
   */
  public getZoom(): number {
    return this.zoom;
  }
  
  /**
   * Get viewport dimensions
   */
  public getViewport(): Size2D {
    return {
      width: this.viewportWidth,
      height: this.viewportHeight
    };
  }
  
  /**
   * Check if a point is visible in the current viewport
   */
  public isPointVisible(worldX: number, worldY: number, margin: number = 50): boolean {
    const screenPos = this.worldToScreen(worldX, worldY);
    
    return screenPos.x >= -margin &&
           screenPos.x <= this.viewportWidth + margin &&
           screenPos.y >= -margin &&
           screenPos.y <= this.viewportHeight + margin;
  }
  
  /**
   * Get the canvas context for advanced operations
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
  
  /**
   * Get the canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * State management methods for Entity rendering
   */
  public translate(x: number, y: number): void {
    this.ctx.translate(x, y);
  }
  
  public rotate(angle: number): void {
    this.ctx.rotate(angle);
  }
  
  public setAlpha(alpha: number): void {
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  }
  
  public getAlpha(): number {
    return this.ctx.globalAlpha;
  }
  
  public setScale(scale: number): void {
    this.ctx.scale(scale, scale);
  }
  
  public getScale(): number {
    // Get scale from transform matrix
    const transform = this.ctx.getTransform();
    return Math.sqrt(transform.a * transform.a + transform.b * transform.b);
  }
}