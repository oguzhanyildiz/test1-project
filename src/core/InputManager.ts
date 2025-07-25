// Input Manager - Centralized input handling with advanced features

import { CanvasRenderer, Point2D } from './CanvasRenderer.js';

export interface InputState {
  mouse: {
    position: Point2D;
    worldPosition: Point2D;
    isDown: boolean;
    button: number;
    lastClickTime: number;
    dragStart: Point2D | null;
    isDragging: boolean;
  };
  touch: {
    touches: TouchInfo[];
    lastTouchTime: number;
    gestureStart: Point2D | null;
  };
  keyboard: {
    pressedKeys: Set<string>;
    justPressed: Set<string>;
    justReleased: Set<string>;
  };
}

export interface TouchInfo {
  id: number;
  position: Point2D;
  worldPosition: Point2D;
  startPosition: Point2D;
  startTime: number;
}

export interface InputEvent {
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'keydown' | 'keyup' | 'touchstart' | 'touchmove' | 'touchend';
  screenPosition?: Point2D;
  worldPosition?: Point2D;
  key?: string;
  button?: number;
  touches?: TouchInfo[];
  deltaTime?: number;
}

export type InputCallback = (event: InputEvent) => void;

export class InputManager {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private state: InputState;
  private callbacks: Map<string, InputCallback[]> = new Map();
  
  // Configuration
  private doubleClickThreshold: number = 300; // ms
  private dragThreshold: number = 5; // pixels
  private touchHoldThreshold: number = 500; // ms
  
  // Prevent context menu and text selection
  private preventDefaults: boolean = true;
  
  constructor(canvas: HTMLCanvasElement, renderer: CanvasRenderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    
    // Initialize input state
    this.state = {
      mouse: {
        position: { x: 0, y: 0 },
        worldPosition: { x: 0, y: 0 },
        isDown: false,
        button: -1,
        lastClickTime: 0,
        dragStart: null,
        isDragging: false
      },
      touch: {
        touches: [],
        lastTouchTime: 0,
        gestureStart: null
      },
      keyboard: {
        pressedKeys: new Set(),
        justPressed: new Set(),
        justReleased: new Set()
      }
    };
    
    this.setupEventListeners();
    console.log('🎯 InputManager initialized');
  }
  
  /**
   * Set up all event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Touch events (with passive: false to allow preventDefault)
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    
    // Keyboard events (document level)
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent context menu and text selection
    if (this.preventDefaults) {
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      this.canvas.addEventListener('selectstart', (e) => e.preventDefault());
      this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    console.log('🎯 Input event listeners set up');
  }
  
  /**
   * Convert screen coordinates to canvas coordinates
   */
  private screenToCanvas(clientX: number, clientY: number): Point2D {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
  
  /**
   * Update keyboard state (call this each frame)
   */
  public update(): void {
    // Clear just pressed/released keys
    this.state.keyboard.justPressed.clear();
    this.state.keyboard.justReleased.clear();
  }
  
  /**
   * Mouse event handlers
   */
  private handleMouseDown(event: MouseEvent): void {
    if (this.preventDefaults) {
      event.preventDefault();
    }
    
    const screenPos = this.screenToCanvas(event.clientX, event.clientY);
    const worldPos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
    
    this.state.mouse.position = screenPos;
    this.state.mouse.worldPosition = worldPos;
    this.state.mouse.isDown = true;
    this.state.mouse.button = event.button;
    this.state.mouse.dragStart = screenPos;
    this.state.mouse.isDragging = false;
    
    this.emit('mousedown', {
      type: 'mousedown',
      screenPosition: screenPos,
      worldPosition: worldPos,
      button: event.button
    });
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (this.preventDefaults) {
      event.preventDefault();
    }
    
    const screenPos = this.screenToCanvas(event.clientX, event.clientY);
    const worldPos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
    
    this.state.mouse.position = screenPos;
    this.state.mouse.worldPosition = worldPos;
    this.state.mouse.isDown = false;
    this.state.mouse.button = -1;
    this.state.mouse.dragStart = null;
    this.state.mouse.isDragging = false;
    
    this.emit('mouseup', {
      type: 'mouseup',
      screenPosition: screenPos,
      worldPosition: worldPos,
      button: event.button
    });
  }
  
  private handleMouseMove(event: MouseEvent): void {
    const screenPos = this.screenToCanvas(event.clientX, event.clientY);
    const worldPos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
    
    this.state.mouse.position = screenPos;
    this.state.mouse.worldPosition = worldPos;
    
    // Check for drag start
    if (this.state.mouse.isDown && this.state.mouse.dragStart && !this.state.mouse.isDragging) {
      const dragDistance = Math.sqrt(
        Math.pow(screenPos.x - this.state.mouse.dragStart.x, 2) +
        Math.pow(screenPos.y - this.state.mouse.dragStart.y, 2)
      );
      
      if (dragDistance > this.dragThreshold) {
        this.state.mouse.isDragging = true;
      }
    }
    
    this.emit('mousemove', {
      type: 'mousemove',
      screenPosition: screenPos,
      worldPosition: worldPos
    });
  }
  
  private handleClick(event: MouseEvent): void {
    if (this.preventDefaults) {
      event.preventDefault();
    }
    
    const screenPos = this.screenToCanvas(event.clientX, event.clientY);
    const worldPos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
    const currentTime = performance.now();
    
    // Check for double click
    const isDoubleClick = (currentTime - this.state.mouse.lastClickTime) < this.doubleClickThreshold;
    this.state.mouse.lastClickTime = currentTime;
    
    this.emit('click', {
      type: 'click',
      screenPosition: screenPos,
      worldPosition: worldPos,
      button: event.button
    });
    
    if (isDoubleClick) {
      this.emit('doubleclick', {
        type: 'click',
        screenPosition: screenPos,
        worldPosition: worldPos,
        button: event.button
      });
    }
  }
  
  /**
   * Touch event handlers
   */
  private handleTouchStart(event: TouchEvent): void {
    if (this.preventDefaults) {
      event.preventDefault();
    }
    
    const touches: TouchInfo[] = [];
    const currentTime = performance.now();
    
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const screenPos = this.screenToCanvas(touch.clientX, touch.clientY);
      const worldPos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
      
      touches.push({
        id: touch.identifier,
        position: screenPos,
        worldPosition: worldPos,
        startPosition: screenPos,
        startTime: currentTime
      });
    }
    
    this.state.touch.touches = touches;
    this.state.touch.lastTouchTime = currentTime;
    
    // Single touch acts like mouse
    if (touches.length === 1) {
      const touch = touches[0];
      this.state.mouse.position = touch.position;
      this.state.mouse.worldPosition = touch.worldPosition;
      this.state.mouse.isDown = true;
      this.state.mouse.dragStart = touch.position;
    }
    
    this.emit('touchstart', {
      type: 'touchstart',
      touches: touches
    });
  }
  
  private handleTouchMove(event: TouchEvent): void {
    if (this.preventDefaults) {
      event.preventDefault();
    }
    
    const touches: TouchInfo[] = [];
    
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const screenPos = this.screenToCanvas(touch.clientX, touch.clientY);
      const worldPos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
      
      // Find existing touch info
      const existingTouch = this.state.touch.touches.find(t => t.id === touch.identifier);
      
      touches.push({
        id: touch.identifier,
        position: screenPos,
        worldPosition: worldPos,
        startPosition: existingTouch ? existingTouch.startPosition : screenPos,
        startTime: existingTouch ? existingTouch.startTime : performance.now()
      });
    }
    
    this.state.touch.touches = touches;
    
    // Single touch acts like mouse
    if (touches.length === 1) {
      const touch = touches[0];
      this.state.mouse.position = touch.position;
      this.state.mouse.worldPosition = touch.worldPosition;
      
      // Check for drag
      if (this.state.mouse.dragStart && !this.state.mouse.isDragging) {
        const dragDistance = Math.sqrt(
          Math.pow(touch.position.x - this.state.mouse.dragStart.x, 2) +
          Math.pow(touch.position.y - this.state.mouse.dragStart.y, 2)
        );
        
        if (dragDistance > this.dragThreshold) {
          this.state.mouse.isDragging = true;
        }
      }
    }
    
    this.emit('touchmove', {
      type: 'touchmove',
      touches: touches
    });
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    if (this.preventDefaults) {
      event.preventDefault();
    }
    
    const touches: TouchInfo[] = [];
    
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const screenPos = this.screenToCanvas(touch.clientX, touch.clientY);
      const worldPos = this.renderer.screenToWorld(screenPos.x, screenPos.y);
      
      const existingTouch = this.state.touch.touches.find(t => t.id === touch.identifier);
      
      touches.push({
        id: touch.identifier,
        position: screenPos,
        worldPosition: worldPos,
        startPosition: existingTouch ? existingTouch.startPosition : screenPos,
        startTime: existingTouch ? existingTouch.startTime : performance.now()
      });
    }
    
    // Handle tap (touch equivalent of click)
    if (this.state.touch.touches.length === 1 && touches.length === 0) {
      const touch = this.state.touch.touches[0];
      const touchDuration = performance.now() - touch.startTime;
      const touchDistance = Math.sqrt(
        Math.pow(touch.position.x - touch.startPosition.x, 2) +
        Math.pow(touch.position.y - touch.startPosition.y, 2)
      );
      
      // If it's a short touch without much movement, treat as tap
      if (touchDuration < this.touchHoldThreshold && touchDistance < this.dragThreshold) {
        this.emit('click', {
          type: 'click',
          screenPosition: touch.position,
          worldPosition: touch.worldPosition,
          button: 0
        });
      }
    }
    
    this.state.touch.touches = touches;
    
    // Clear mouse state when no touches
    if (touches.length === 0) {
      this.state.mouse.isDown = false;
      this.state.mouse.dragStart = null;
      this.state.mouse.isDragging = false;
    }
    
    this.emit('touchend', {
      type: 'touchend',
      touches: touches
    });
  }
  
  /**
   * Keyboard event handlers
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    
    if (!this.state.keyboard.pressedKeys.has(key)) {
      this.state.keyboard.justPressed.add(key);
    }
    
    this.state.keyboard.pressedKeys.add(key);
    
    this.emit('keydown', {
      type: 'keydown',
      key: key
    });
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key;
    
    this.state.keyboard.pressedKeys.delete(key);
    this.state.keyboard.justReleased.add(key);
    
    this.emit('keyup', {
      type: 'keyup',
      key: key
    });
  }
  
  /**
   * Event system
   */
  public on(eventType: string, callback: InputCallback): void {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);
  }
  
  public off(eventType: string, callback: InputCallback): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  private emit(eventType: string, event: InputEvent): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }
  
  /**
   * Input state queries
   */
  public isKeyPressed(key: string): boolean {
    return this.state.keyboard.pressedKeys.has(key);
  }
  
  public isKeyJustPressed(key: string): boolean {
    return this.state.keyboard.justPressed.has(key);
  }
  
  public isKeyJustReleased(key: string): boolean {
    return this.state.keyboard.justReleased.has(key);
  }
  
  public isMouseDown(): boolean {
    return this.state.mouse.isDown;
  }
  
  public isMouseDragging(): boolean {
    return this.state.mouse.isDragging;
  }
  
  public getMousePosition(): Point2D {
    return this.state.mouse.position;
  }
  
  public getMouseWorldPosition(): Point2D {
    return this.state.mouse.worldPosition;
  }
  
  public getTouches(): TouchInfo[] {
    return [...this.state.touch.touches];
  }
  
  public getTouchCount(): number {
    return this.state.touch.touches.length;
  }
  
  /**
   * Utility methods
   */
  public isPointInCircle(point: Point2D, center: Point2D, radius: number): boolean {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return (dx * dx + dy * dy) <= (radius * radius);
  }
  
  public isPointInRectangle(point: Point2D, x: number, y: number, width: number, height: number): boolean {
    return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
  }
  
  /**
   * Configuration
   */
  public setDoubleClickThreshold(ms: number): void {
    this.doubleClickThreshold = ms;
  }
  
  public setDragThreshold(pixels: number): void {
    this.dragThreshold = pixels;
  }
  
  public setTouchHoldThreshold(ms: number): void {
    this.touchHoldThreshold = ms;
  }
  
  /**
   * Cleanup
   */
  public destroy(): void {
    // Remove all event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
    
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Clear callbacks
    this.callbacks.clear();
    
    console.log('🎯 InputManager destroyed');
  }
}