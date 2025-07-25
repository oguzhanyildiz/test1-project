// Entity Manager - Central system for managing all game entities and object pools
import { Entity, EntityData, EntityType } from './Entity.js';
import { EntityPool } from './EntityPool.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';

export interface EntityFactoryMap {
  [key: string]: (data: EntityData) => Entity;
}

export class EntityManager {
  private pools: Map<string, EntityPool<any>> = new Map();
  private factories: EntityFactoryMap = {};
  private allEntities: Set<Entity> = new Set();
  private entitiesByType: Map<EntityType, Set<Entity>> = new Map();
  
  // Performance tracking
  private updateTime: number = 0;
  private renderTime: number = 0;
  private lastFrameEntityCount: number = 0;
  
  constructor() {
    // Initialize type maps
    for (const type of ['tower', 'enemy', 'projectile', 'pickup', 'effect'] as EntityType[]) {
      this.entitiesByType.set(type, new Set());
    }
    
    console.log('🎯 EntityManager initialized');
  }
  
  /**
   * Register an entity factory for a specific type
   */
  public registerFactory<T extends Entity>(
    entityType: string,
    factory: (data: EntityData) => T,
    poolConfig?: {
      initialSize?: number;
      maxSize?: number;
      growthFactor?: number;
    }
  ): void {
    this.factories[entityType] = factory;
    
    // Create object pool for this entity type
    const pool = new EntityPool(factory, poolConfig);
    this.pools.set(entityType, pool);
    
    console.log(`🏭 Registered factory for ${entityType} with object pool`);
  }
  
  /**
   * Create a new entity (using object pool if available)
   */
  public createEntity<T extends Entity>(entityType: string, data: EntityData): T {
    const pool = this.pools.get(entityType);
    let entity: T;
    
    if (pool) {
      // Use object pool
      entity = pool.acquire(data) as T;
    } else {
      // Create directly using factory
      const factory = this.factories[entityType];
      if (!factory) {
        throw new Error(`No factory registered for entity type: ${entityType}`);
      }
      entity = factory(data) as T;
    }
    
    // Track entity
    this.allEntities.add(entity);
    const typeSet = this.entitiesByType.get(data.type);
    if (typeSet) {
      typeSet.add(entity);
    }
    
    // Set up cleanup when entity is destroyed
    entity.onDestroyed((destroyedEntity: Entity) => {
      this.removeEntity(destroyedEntity);
    });
    
    console.log(`✨ Created ${entityType} entity ${entity.id}`);
    return entity;
  }
  
  /**
   * Remove an entity from tracking
   */
  private removeEntity(entity: Entity): void {
    this.allEntities.delete(entity);
    
    const typeSet = this.entitiesByType.get(entity.type);
    if (typeSet) {
      typeSet.delete(entity);
    }
    
    console.log(`🗑️ Removed ${entity.type} entity ${entity.id} from tracking`);
  }
  
  /**
   * Update all entities
   */
  public update(deltaTime: number): void {
    const startTime = performance.now();
    
    // Update entities by pool for better cache locality
    for (const pool of this.pools.values()) {
      pool.updateAll(deltaTime);
    }
    
    // Update non-pooled entities
    for (const entity of this.allEntities) {
      if (entity.active && !entity.pooled) {
        entity.update(deltaTime);
      }
    }
    
    this.updateTime = performance.now() - startTime;
    this.lastFrameEntityCount = this.getActiveEntityCount();
  }
  
  /**
   * Render all entities
   */
  public render(renderer: CanvasRenderer): void {
    const startTime = performance.now();
    
    // Sort entities by type for consistent rendering order
    const entityTypes: EntityType[] = ['effect', 'pickup', 'projectile', 'enemy', 'tower'];
    
    for (const entityType of entityTypes) {
      const entities = this.entitiesByType.get(entityType);
      if (entities) {
        for (const entity of entities) {
          if (entity.active && entity.visible) {
            entity.render(renderer);
          }
        }
      }
    }
    
    this.renderTime = performance.now() - startTime;
  }
  
  /**
   * Get all active entities
   */
  public getAllEntities(): Entity[] {
    return Array.from(this.allEntities).filter(entity => entity.active);
  }
  
  /**
   * Get entities by type
   */
  public getEntitiesByType<T extends Entity>(type: EntityType): T[] {
    const entities = this.entitiesByType.get(type);
    if (!entities) return [];
    
    return Array.from(entities)
      .filter(entity => entity.active) as T[];
  }
  
  /**
   * Find entity by ID
   */
  public findEntityById(id: string): Entity | undefined {
    for (const entity of this.allEntities) {
      if (entity.active && entity.id === id) {
        return entity;
      }
    }
    return undefined;
  }
  
  /**
   * Get entities within radius of a point
   */
  public getEntitiesInRadius(
    x: number,
    y: number,
    radius: number,
    entityType?: EntityType
  ): Entity[] {
    const entities = entityType ? 
      this.getEntitiesByType(entityType) : 
      this.getAllEntities();
    
    return entities.filter(entity => {
      const dx = entity.x - x;
      const dy = entity.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius + entity.radius;
    });
  }
  
  /**
   * Get closest entity to a point
   */
  public getClosestEntity(
    x: number,
    y: number,
    entityType?: EntityType
  ): { entity: Entity; distance: number } | null {
    const entities = entityType ? 
      this.getEntitiesByType(entityType) : 
      this.getAllEntities();
    
    if (entities.length === 0) return null;
    
    let closest = entities[0];
    let closestDistance = closest.distanceTo({ x, y });
    
    for (let i = 1; i < entities.length; i++) {
      const entity = entities[i];
      const distance = entity.distanceTo({ x, y });
      
      if (distance < closestDistance) {
        closest = entity;
        closestDistance = distance;
      }
    }
    
    return { entity: closest, distance: closestDistance };
  }
  
  /**
   * Destroy all entities of a specific type
   */
  public destroyEntitiesByType(type: EntityType): void {
    const entities = this.getEntitiesByType(type);
    for (const entity of entities) {
      entity.destroy();
    }
    console.log(`💥 Destroyed ${entities.length} entities of type ${type}`);
  }
  
  /**
   * Destroy all entities
   */
  public destroyAllEntities(): void {
    const entities = this.getAllEntities();
    for (const entity of entities) {
      entity.destroy();
    }
    console.log(`💥 Destroyed all ${entities.length} entities`);
  }
  
  /**
   * Get entity count by type
   */
  public getEntityCount(type?: EntityType): number {
    if (type) {
      return this.getEntitiesByType(type).length;
    }
    return this.getActiveEntityCount();
  }
  
  /**
   * Get total active entity count
   */
  public getActiveEntityCount(): number {
    return Array.from(this.allEntities).filter(entity => entity.active).length;
  }
  
  /**
   * Clean up pools (remove inactive entities)
   */
  public cleanupPools(): void {
    for (const [type, pool] of this.pools) {
      pool.shrink();
      console.log(`🧹 Cleaned up ${type} pool`);
    }
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): {
    updateTime: number;
    renderTime: number;
    entityCount: number;
    poolStats: { [type: string]: any };
  } {
    const poolStats: { [type: string]: any } = {};
    
    for (const [type, pool] of this.pools) {
      poolStats[type] = pool.getStats();
    }
    
    return {
      updateTime: this.updateTime,
      renderTime: this.renderTime,
      entityCount: this.lastFrameEntityCount,
      poolStats
    };
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): {
    totalEntities: number;
    entitiesByType: { [type: string]: number };
    pools: { [type: string]: any };
    performance: {
      updateTime: number;
      renderTime: number;
      entityCount: number;
      poolStats: { [type: string]: any };
    };
  } {
    const entitiesByType: { [type: string]: number } = {};
    for (const [type, entities] of this.entitiesByType) {
      entitiesByType[type] = Array.from(entities).filter(e => e.active).length;
    }
    
    const pools: { [type: string]: any } = {};
    for (const [type, pool] of this.pools) {
      pools[type] = pool.getDebugInfo();
    }
    
    return {
      totalEntities: this.getActiveEntityCount(),
      entitiesByType,
      pools,
      performance: this.getPerformanceMetrics()
    };
  }
  
  /**
   * Dispose of the entity manager
   */
  public dispose(): void {
    this.destroyAllEntities();
    
    for (const pool of this.pools.values()) {
      pool.clear();
    }
    
    this.pools.clear();
    this.factories = {};
    this.allEntities.clear();
    this.entitiesByType.clear();
    
    console.log('🗑️ EntityManager disposed');
  }
}