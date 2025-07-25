// Entity Object Pool - Efficient memory management for game entities
import { Entity, EntityData, EntityType } from './Entity.js';

export interface PoolConfig {
  initialSize: number;
  maxSize: number;
  growthFactor: number;
}

export class EntityPool<T extends Entity> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: (data: EntityData) => T;
  private config: PoolConfig;
  private totalCreated: number = 0;
  private totalReused: number = 0;
  
  constructor(
    factory: (data: EntityData) => T,
    config: Partial<PoolConfig> = {}
  ) {
    this.factory = factory;
    this.config = {
      initialSize: config.initialSize || 10,
      maxSize: config.maxSize || 100,
      growthFactor: config.growthFactor || 1.5
    };
    
    // Pre-populate pool
    this.preallocate();
    
    console.log(`🏊 EntityPool created with ${this.pool.length} pre-allocated entities`);
  }
  
  /**
   * Pre-allocate entities for the pool
   */
  private preallocate(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const entity = this.createNewEntity();
      entity.pooled = true;
      entity.active = false;
      this.pool.push(entity);
    }
  }
  
  /**
   * Create a new entity instance
   */
  private createNewEntity(): T {
    // Use dummy data for pool creation
    const dummyData: EntityData = {
      type: 'enemy' as EntityType,
      x: 0,
      y: 0,
      health: 1
    };
    
    const entity = this.factory(dummyData);
    this.totalCreated++;
    return entity;
  }
  
  /**
   * Get an entity from the pool or create a new one
   */
  public acquire(data: EntityData): T {
    let entity: T;
    
    if (this.pool.length > 0) {
      // Reuse existing entity from pool
      entity = this.pool.pop()!;
      entity.reset(data);
      this.totalReused++;
      console.log(`♻️ Reused entity from pool (${this.pool.length} remaining)`);
    } else {
      // Create new entity if pool is empty and we haven't hit max size
      if (this.active.size < this.config.maxSize) {
        entity = this.createNewEntity();
        entity.reset(data);
        console.log(`🆕 Created new entity (active: ${this.active.size}/${this.config.maxSize})`);
      } else {
        // Force reuse oldest active entity if at max capacity
        entity = this.forceReuse(data);
        console.log(`⚠️ Forced reuse due to max capacity (${this.config.maxSize})`);
      }
    }
    
    entity.pooled = true;
    this.active.add(entity);
    
    // Set up auto-return to pool on destroy
    entity.onDestroyed((destroyedEntity: Entity) => {
      this.release(destroyedEntity as T);
    });
    
    return entity;
  }
  
  /**
   * Force reuse of the oldest active entity when at capacity
   */
  private forceReuse(data: EntityData): T {
    // Get the oldest active entity (first in set)
    const oldestEntity = this.active.values().next().value;
    if (oldestEntity) {
      oldestEntity.destroy(); // This will trigger release
      oldestEntity.reset(data);
      return oldestEntity;
    }
    
    // Fallback: just create a new one (shouldn't happen)
    return this.createNewEntity();
  }
  
  /**
   * Return an entity to the pool
   */
  public release(entity: T): void {
    if (!entity.pooled || !this.active.has(entity)) {
      console.warn(`⚠️ Attempted to release entity ${entity.id} that wasn't acquired from this pool`);
      return;
    }
    
    this.active.delete(entity);
    entity.active = false;
    
    // Only return to pool if we haven't exceeded pool size limits
    if (this.pool.length < this.config.maxSize) {
      this.pool.push(entity);
      console.log(`🔄 Returned entity to pool (${this.pool.length} available)`);
    } else {
      // Pool is full, just let it be garbage collected
      console.log(`🗑️ Pool full, entity will be garbage collected`);
    }
  }
  
  /**
   * Release all active entities
   */
  public releaseAll(): void {
    const activeEntities = Array.from(this.active);
    for (const entity of activeEntities) {
      entity.destroy();
    }
    console.log(`🧹 Released ${activeEntities.length} active entities`);
  }
  
  /**
   * Clear the entire pool
   */
  public clear(): void {
    this.releaseAll();
    this.pool = [];
    this.active.clear();
    console.log('🗑️ Cleared entire entity pool');
  }
  
  /**
   * Grow the pool by the growth factor
   */
  public grow(): void {
    const currentSize = this.pool.length;
    const targetSize = Math.min(
      Math.floor(currentSize * this.config.growthFactor),
      this.config.maxSize - this.active.size
    );
    
    const growthAmount = targetSize - currentSize;
    
    if (growthAmount > 0) {
      for (let i = 0; i < growthAmount; i++) {
        const entity = this.createNewEntity();
        entity.pooled = true;
        entity.active = false;
        this.pool.push(entity);
      }
      
      console.log(`📈 Grew pool by ${growthAmount} entities (${this.pool.length} total)`);
    }
  }
  
  /**
   * Shrink the pool to minimum size
   */
  public shrink(): void {
    const targetSize = this.config.initialSize;
    const currentSize = this.pool.length;
    
    if (currentSize > targetSize) {
      const removeCount = currentSize - targetSize;
      this.pool.splice(targetSize, removeCount);
      console.log(`📉 Shrunk pool by ${removeCount} entities (${this.pool.length} remaining)`);
    }
  }
  
  /**
   * Update all active entities
   */
  public updateAll(deltaTime: number): void {
    for (const entity of this.active) {
      if (entity.active) {
        entity.update(deltaTime);
      }
    }
  }
  
  /**
   * Render all active entities
   */
  public renderAll(renderer: any): void {
    for (const entity of this.active) {
      if (entity.active && entity.visible) {
        entity.render(renderer);
      }
    }
  }
  
  /**
   * Get all active entities
   */
  public getActive(): T[] {
    return Array.from(this.active).filter(entity => entity.active);
  }
  
  /**
   * Get active entities by filter function
   */
  public getActiveFiltered(predicate: (entity: T) => boolean): T[] {
    return Array.from(this.active).filter(entity => entity.active && predicate(entity));
  }
  
  /**
   * Find active entity by id
   */
  public findById(id: string): T | undefined {
    for (const entity of this.active) {
      if (entity.active && entity.id === id) {
        return entity;
      }
    }
    return undefined;
  }
  
  /**
   * Count active entities
   */
  public getActiveCount(): number {
    return Array.from(this.active).filter(entity => entity.active).length;
  }
  
  /**
   * Get pool statistics
   */
  public getStats(): {
    poolSize: number;
    activeCount: number;
    totalCreated: number;
    totalReused: number;
    reuseRatio: number;
    efficiency: number;
  } {
    const reuseRatio = this.totalCreated > 0 ? this.totalReused / this.totalCreated : 0;
    const efficiency = this.totalCreated > 0 ? 
      (this.totalReused / (this.totalCreated + this.totalReused)) * 100 : 0;
    
    return {
      poolSize: this.pool.length,
      activeCount: this.getActiveCount(),
      totalCreated: this.totalCreated,
      totalReused: this.totalReused,
      reuseRatio,
      efficiency
    };
  }
  
  /**
   * Debug information
   */
  public getDebugInfo(): {
    config: PoolConfig;
    stats: {
      poolSize: number;
      activeCount: number;
      totalCreated: number;
      totalReused: number;
      reuseRatio: number;
      efficiency: number;
    };
    activeEntities: Array<{ id: string; type: EntityType; age: number }>;
  } {
    return {
      config: this.config,
      stats: this.getStats(),
      activeEntities: Array.from(this.active)
        .filter(entity => entity.active)
        .map(entity => ({
          id: entity.id,
          type: entity.type,
          age: entity.age
        }))
    };
  }
}