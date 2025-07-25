// Entity Base Class - Foundation for all game objects with lifecycle management
import { Point2D, CanvasRenderer } from '../core/CanvasRenderer.js';

export type EntityType = 'tower' | 'enemy' | 'projectile' | 'pickup' | 'effect';

export interface EntityData {
  type: EntityType;
  x: number;
  y: number;
  health?: number;
  maxHealth?: number;
  radius?: number;
  [key: string]: any;
}

export abstract class Entity {
  public id: string;
  public type: EntityType;
  public x: number;
  public y: number;
  public health: number;
  public maxHealth: number;
  public radius: number;
  public active: boolean = true;
  public pooled: boolean = false;
  
  // Lifecycle tracking
  public createdTime: number;
  public lastUpdateTime: number;
  public age: number = 0;
  
  // Movement and physics
  public velocityX: number = 0;
  public velocityY: number = 0;
  public rotation: number = 0;
  public rotationSpeed: number = 0;
  
  // Rendering properties
  public visible: boolean = true;
  public alpha: number = 1;
  public scale: number = 1;
  
  // Events
  protected onDestroyCallbacks: Array<(entity: Entity) => void> = [];
  protected onDamageCallbacks:
    Array<(entity: Entity, damage: number, source?: Entity) => void> = [];
  
  constructor(data: EntityData) {
    this.id = this.generateId();
    this.type = data.type;
    this.x = data.x;
    this.y = data.y;
    this.health = data.health || 1;
    this.maxHealth = data.maxHealth || this.health;
    this.radius = data.radius || 10;
    
    this.createdTime = performance.now();
    this.lastUpdateTime = this.createdTime;
    
    console.log(`🎯 Created ${this.type} entity ${this.id} at (${this.x}, ${this.y})`);
  }
  
  /**
   * Generate unique entity ID
   */
  private generateId(): string {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Update entity logic - called every frame
   */
  public update(deltaTime: number): void {
    if (!this.active) return;
    
    const currentTime = performance.now();
    this.age = (currentTime - this.createdTime) / 1000;
    this.lastUpdateTime = currentTime;
    
    // Apply movement
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    
    // Apply rotation
    this.rotation += this.rotationSpeed * deltaTime;
    
    // Call derived class update
    this.onUpdate(deltaTime);
    
    // Check if entity should be destroyed
    if (this.health <= 0 && this.active) {
      this.destroy();
    }
  }
  
  /**
   * Render entity - called every frame
   */
  public render(renderer: CanvasRenderer): void {
    if (!this.visible || !this.active) return;
    
    // Save renderer state
    const originalAlpha = renderer.getAlpha();
    const originalScale = renderer.getScale();
    
    // Apply entity properties
    renderer.setAlpha(this.alpha);
    renderer.setScale(this.scale);
    
    // Render with rotation if needed
    if (this.rotation !== 0) {
      renderer.save();
      renderer.translate(this.x, this.y);
      renderer.rotate(this.rotation);
      this.onRender(renderer, -this.x, -this.y); // Render at (0,0) in rotated space
      renderer.restore();
    } else {
      this.onRender(renderer, this.x, this.y);
    }
    
    // Restore renderer state
    renderer.setAlpha(originalAlpha);
    renderer.setScale(originalScale);
  }
  
  /**
   * Take damage and handle death
   */
  public takeDamage(damage: number, source?: Entity): boolean {
    if (!this.active || this.health <= 0) return false;
    
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - damage);
    
    console.log(`💥 ${this.id} took ${damage} damage (${previousHealth} → ${this.health})`);
    
    // Trigger damage callbacks
    for (const callback of this.onDamageCallbacks) {
      callback(this, damage, source);
    }
    
    // Check for death
    if (this.health <= 0) {
      this.destroy();
      return true; // Entity died
    }
    
    return false; // Entity survived
  }
  
  /**
   * Heal the entity
   */
  public heal(amount: number): void {
    if (!this.active) return;
    
    const previousHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    
    if (amount > 0 && this.health > previousHealth) {
      console.log(`💚 ${this.id} healed ${amount} HP (${previousHealth} → ${this.health})`);
    }
  }
  
  /**
   * Move entity to a new position
   */
  public moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Move entity by an offset
   */
  public moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }
  
  /**
   * Set velocity
   */
  public setVelocity(vx: number, vy: number): void {
    this.velocityX = vx;
    this.velocityY = vy;
  }
  
  /**
   * Get distance to another entity or point
   */
  public distanceTo(target: Entity | Point2D): number {
    const dx = this.x - target.x;
    const dy = this.y - target.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Get direction vector to another entity or point
   */
  public directionTo(target: Entity | Point2D): Point2D {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: dx / distance,
      y: dy / distance
    };
  }
  
  /**
   * Check if entity overlaps with another entity
   */
  public overlaps(other: Entity): boolean {
    const distance = this.distanceTo(other);
    return distance <= (this.radius + other.radius);
  }
  
  /**
   * Check if entity contains a point
   */
  public contains(point: Point2D): boolean {
    const distance = this.distanceTo(point);
    return distance <= this.radius;
  }
  
  /**
   * Destroy this entity
   */
  public destroy(): void {
    if (!this.active) {
      console.warn(`⚠️ Attempted to destroy already inactive ${this.type} entity ${this.id}`);
      return;
    }
    
    console.log(`💀 Destroying ${this.type} entity ${this.id}`);
    
    // Mark as inactive first to prevent re-entry
    this.active = false;
    
    // Trigger destroy callbacks
    for (const callback of this.onDestroyCallbacks) {
      try {
        callback(this);
      } catch (error) {
        console.error(`Error in destroy callback for ${this.id}:`, error);
      }
    }
    
    this.onDestroy();
  }
  
  /**
   * Reset entity for object pooling
   */
  public reset(data: EntityData): void {
    this.x = data.x;
    this.y = data.y;
    this.health = data.health || 1;
    this.maxHealth = data.maxHealth || this.health;
    this.radius = data.radius || 10;
    this.active = true;
    this.visible = true;
    this.alpha = 1;
    this.scale = 1;
    this.velocityX = 0;
    this.velocityY = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.age = 0;
    
    this.createdTime = performance.now();
    this.lastUpdateTime = this.createdTime;
    
    // Clear callbacks
    this.onDestroyCallbacks = [];
    this.onDamageCallbacks = [];
    
    this.onReset(data);
    console.log(`♻️ Reset ${this.type} entity ${this.id} for reuse`);
  }
  
  /**
   * Event handlers (to be overridden by derived classes)
   */
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onRender(renderer: CanvasRenderer, x: number, y: number): void;
  protected abstract onDestroy(): void;
  protected abstract onReset(data: EntityData): void;
  
  /**
   * Event subscription methods
   */
  public onDestroyed(callback: (entity: Entity) => void): void {
    this.onDestroyCallbacks.push(callback);
  }
  
  public onDamaged(callback: (entity: Entity, damage: number, source?: Entity) => void): void {
    this.onDamageCallbacks.push(callback);
  }
  
  /**
   * Health utilities
   */
  public isAlive(): boolean {
    return this.active && this.health > 0;
  }
  
  public isDead(): boolean {
    return !this.active || this.health <= 0;
  }
  
  public getHealthPercent(): number {
    return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
  }
  
  /**
   * Get entity bounds
   */
  public getBounds(): { x: number; y: number; width: number; height: number } {
    const size = this.radius * 2 * this.scale;
    return {
      x: this.x - this.radius * this.scale,
      y: this.y - this.radius * this.scale,
      width: size,
      height: size
    };
  }
  
  /**
   * Debug information
   */
  public getDebugInfo(): {
    id: string;
    type: EntityType;
    position: Point2D;
    health: string;
    age: number;
    active: boolean;
  } {
    return {
      id: this.id,
      type: this.type,
      position: { x: this.x, y: this.y },
      health: `${this.health}/${this.maxHealth}`,
      age: this.age,
      active: this.active
    };
  }
}