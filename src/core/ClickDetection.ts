// Click Detection System - Handle clicking on game objects with visual feedback

import { Point2D, CanvasRenderer } from './CanvasRenderer.js';
import { CollisionDetection, Circle } from './CollisionDetection.js';

export interface Clickable {
  id: string;
  x: number;
  y: number;
  radius: number;
  isClickable?: boolean;
  onClick?: (clickable: Clickable, clickPosition: Point2D) => void;
  onHover?: (clickable: Clickable, hoverPosition: Point2D) => void;
  onHoverEnd?: (clickable: Clickable) => void;
}

export interface ClickEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  type: 'hit' | 'miss' | 'critical';
  color: string;
  radius: number;
}

export interface HoverEffect {
  target: Clickable;
  alpha: number;
  pulseSpeed: number;
}

export class ClickDetection {
  private clickables: Map<string, Clickable> = new Map();
  private clickEffects: ClickEffect[] = [];
  private hoverEffects: Map<string, HoverEffect> = new Map();
  private lastHoveredId: string | null = null;
  
  // Configuration
  private clickTolerance: number = 5; // Extra pixels for easier clicking
  private effectDuration: number = 500; // ms
  private hoverPulseSpeed: number = 2; // cycles per second
  
  constructor() {
    console.log('🎯 ClickDetection system initialized');
  }
  
  /**
   * Register a clickable object
   */
  public addClickable(clickable: Clickable): void {
    this.clickables.set(clickable.id, { ...clickable, isClickable: true });
  }
  
  /**
   * Remove a clickable object
   */
  public removeClickable(id: string): void {
    this.clickables.delete(id);
    this.hoverEffects.delete(id);
    
    if (this.lastHoveredId === id) {
      this.lastHoveredId = null;
    }
  }
  
  /**
   * Update a clickable object's position
   */
  public updateClickable(id: string, x: number, y: number): void {
    const clickable = this.clickables.get(id);
    if (clickable) {
      clickable.x = x;
      clickable.y = y;
    }
  }
  
  /**
   * Clear all clickables
   */
  public clearClickables(): void {
    this.clickables.clear();
    this.hoverEffects.clear();
    this.lastHoveredId = null;
  }
  
  /**
   * Handle click at position (in world coordinates)
   */
  public handleClick(worldPosition: Point2D): Clickable | null {
    // Find all clickables at this position
    const hitClickables: Array<{ clickable: Clickable; distance: number }> = [];
    
    for (const clickable of this.clickables.values()) {
      if (!clickable.isClickable) continue;
      
      const circle: Circle = {
        x: clickable.x,
        y: clickable.y,
        radius: clickable.radius + this.clickTolerance
      };
      
      const collision = CollisionDetection.pointInCircle(worldPosition, circle);
      
      if (collision.hit) {
        hitClickables.push({
          clickable,
          distance: collision.distance || 0
        });
      }
    }
    
    // Sort by distance (closest first) and get the closest one
    hitClickables.sort((a, b) => a.distance - b.distance);
    
    if (hitClickables.length > 0) {
      const closest = hitClickables[0].clickable;
      
      // Call the click handler if it exists
      if (closest.onClick) {
        console.log(`🎯 Clicked enemy ${closest.id}`);
        closest.onClick(closest, worldPosition);
      } else {
        console.warn(`⚠️ No onClick handler found for ${closest.id}`);
      }
      
      // Create hit effect
      this.createClickEffect(worldPosition, 'hit');
      
      return closest;
    } else {
      // Create miss effect
      this.createClickEffect(worldPosition, 'miss');
      console.log(`🎯 Click missed at (${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)})`);
      return null;
    }
  }
  
  /**
   * Handle hover at position (in world coordinates)
   */
  public handleHover(worldPosition: Point2D): void {
    let hoveredClickable: Clickable | null = null;
    let closestDistance = Number.MAX_VALUE;
    
    // Find the closest clickable under the cursor
    for (const clickable of this.clickables.values()) {
      if (!clickable.isClickable) continue;
      
      const circle: Circle = {
        x: clickable.x,
        y: clickable.y,
        radius: clickable.radius + this.clickTolerance
      };
      
      const collision = CollisionDetection.pointInCircle(worldPosition, circle);
      
      if (collision.hit && (collision.distance || 0) < closestDistance) {
        hoveredClickable = clickable;
        closestDistance = collision.distance || 0;
      }
    }
    
    // Handle hover state changes
    const newHoveredId = hoveredClickable?.id || null;
    
    if (newHoveredId !== this.lastHoveredId) {
      // End hover on previous object
      if (this.lastHoveredId) {
        const prevClickable = this.clickables.get(this.lastHoveredId);
        if (prevClickable && prevClickable.onHoverEnd) {
          prevClickable.onHoverEnd(prevClickable);
        }
        this.hoverEffects.delete(this.lastHoveredId);
      }
      
      // Start hover on new object
      if (hoveredClickable) {
        if (hoveredClickable.onHover) {
          hoveredClickable.onHover(hoveredClickable, worldPosition);
        }
        
        this.hoverEffects.set(hoveredClickable.id, {
          target: hoveredClickable,
          alpha: 0.5,
          pulseSpeed: this.hoverPulseSpeed
        });
      }
      
      this.lastHoveredId = newHoveredId;
    }
  }
  
  /**
   * Create a visual click effect
   */
  private createClickEffect(position: Point2D, type: 'hit' | 'miss' | 'critical'): void {
    const colors = {
      hit: '#00FF00',
      miss: '#FF4444',
      critical: '#FFD700'
    };
    
    const effect: ClickEffect = {
      x: position.x,
      y: position.y,
      startTime: performance.now(),
      duration: this.effectDuration,
      type,
      color: colors[type],
      radius: type === 'critical' ? 25 : 15
    };
    
    this.clickEffects.push(effect);
  }
  
  /**
   * Update click effects and hover effects
   */
  public update(deltaTime: number): void {
    const currentTime = performance.now();
    
    // Update click effects (deltaTime not needed for time-based effects)
    this.clickEffects = this.clickEffects.filter(effect => {
      const elapsed = currentTime - effect.startTime;
      return elapsed < effect.duration;
    });
    
    // Update hover effects
    for (const hoverEffect of this.hoverEffects.values()) {
      const time = currentTime / 1000;
      hoverEffect.alpha = 0.3 + 0.3 * Math.sin(time * hoverEffect.pulseSpeed * Math.PI * 2);
    }
    
    // Use deltaTime to avoid unused parameter warning
    if (deltaTime > 0) {
      // Could be used for frame-based animations in the future
    }
  }
  
  /**
   * Render click effects and hover indicators
   */
  public render(renderer: CanvasRenderer): void {
    const currentTime = performance.now();
    
    // Render click effects
    for (const effect of this.clickEffects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (progress <= 1) {
        const alpha = 1 - progress;
        const radius = effect.radius * (1 + progress * 0.5);
        
        renderer.drawCircle(effect.x, effect.y, radius, {
          strokeStyle: effect.color,
          lineWidth: 3,
          alpha: alpha
        });
        
        // Inner fill for hit effects
        if (effect.type === 'hit' || effect.type === 'critical') {
          renderer.drawCircle(effect.x, effect.y, radius * 0.6, {
            fillStyle: effect.color,
            alpha: alpha * 0.3
          });
        }
        
        // Extra sparkle for critical hits
        if (effect.type === 'critical') {
          const sparkleRadius = radius * 1.5;
          const sparkleAlpha = alpha * 0.5;
          
          renderer.drawCircle(effect.x, effect.y, sparkleRadius, {
            strokeStyle: effect.color,
            lineWidth: 1,
            alpha: sparkleAlpha
          });
        }
      }
    }
    
    // Render hover effects
    for (const hoverEffect of this.hoverEffects.values()) {
      const target = hoverEffect.target;
      
      renderer.drawCircle(target.x, target.y, target.radius + 5, {
        strokeStyle: '#FFFFFF',
        lineWidth: 2,
        alpha: hoverEffect.alpha
      });
      
      // Crosshair for targeting
      const crosshairSize = target.radius + 10;
      renderer.drawLine(
        target.x - crosshairSize, target.y,
        target.x + crosshairSize, target.y,
        {
          strokeStyle: '#FFFFFF',
          lineWidth: 1,
          alpha: hoverEffect.alpha
        }
      );
      renderer.drawLine(
        target.x, target.y - crosshairSize,
        target.x, target.y + crosshairSize,
        {
          strokeStyle: '#FFFFFF',
          lineWidth: 1,
          alpha: hoverEffect.alpha
        }
      );
    }
  }
  
  /**
   * Get all registered clickables
   */
  public getClickables(): Clickable[] {
    return Array.from(this.clickables.values());
  }
  
  /**
   * Get clickable by ID
   */
  public getClickable(id: string): Clickable | undefined {
    return this.clickables.get(id);
  }
  
  /**
   * Check if a position would hit any clickable
   */
  public wouldHit(worldPosition: Point2D): boolean {
    for (const clickable of this.clickables.values()) {
      if (!clickable.isClickable) continue;
      
      const circle: Circle = {
        x: clickable.x,
        y: clickable.y,
        radius: clickable.radius + this.clickTolerance
      };
      
      const collision = CollisionDetection.pointInCircle(worldPosition, circle);
      if (collision.hit) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Configuration methods
   */
  public setClickTolerance(pixels: number): void {
    this.clickTolerance = pixels;
  }
  
  public setEffectDuration(ms: number): void {
    this.effectDuration = ms;
  }
  
  public setHoverPulseSpeed(cyclesPerSecond: number): void {
    this.hoverPulseSpeed = cyclesPerSecond;
  }
  
  /**
   * Debug information
   */
  public getDebugInfo(): {
    clickableCount: number;
    effectCount: number;
    hoverCount: number;
    lastHovered: string | null;
  } {
    return {
      clickableCount: this.clickables.size,
      effectCount: this.clickEffects.length,
      hoverCount: this.hoverEffects.size,
      lastHovered: this.lastHoveredId
    };
  }
}