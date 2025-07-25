// Enemy Entity - Base class for all enemy types that attack the tower
import { Entity, EntityData } from './Entity.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';
import { Clickable } from '../core/ClickDetection.js';

export interface EnemyData extends EntityData {
  type: 'enemy';
  enemyType?: string;
  speed?: number;
  damage?: number;
  reward?: number;
  spawnDistance?: number;
  // Viewport dimensions for spawning
  viewportWidth?: number;
  viewportHeight?: number;
  // Boss specific
  spawnRate?: number;
  spawnCooldown?: number;
  // Swarm specific
  swarmId?: string;
  swarmCount?: number;
  // Stealth specific
  stealthCycle?: number;
  stealthDuration?: number;
}

export interface EnemyStats {
  enemyType: string;
  maxHealth: number;
  currentHealth: number;
  speed: number;
  damage: number;
  reward: number;
  distanceFromTower: number;
}

export class Enemy extends Entity implements Clickable {
  public enemyType: string;
  public speed: number;
  public damage: number;
  public reward: number;
  public spawnDistance: number;
  
  // Movement and AI
  private targetX: number = 0;
  private targetY: number = 0;
  private towerTarget: Entity | null = null;
  private distanceToTarget: number = 0;
  private attackCooldown: number = 0;
  private attackRange: number = 35; // Must be close to tower to attack
  
  // Visual effects
  private takeDamageFlash: number = 0;
  private isAttacking: boolean = false;
  private attackAnimationTime: number = 0;
  
  // Special enemy behaviors
  // Boss properties
  private spawnCooldown: number = 0;
  private lastSpawnTime: number = 0;
  private spawnedMinions: Entity[] = [];
  
  // Swarm properties
  private swarmId: string = '';
  private swarmCount: number = 1;
  private swarmFormation: {offsetX: number, offsetY: number} = {offsetX: 0, offsetY: 0};
  
  // Stealth properties
  private stealthCycle: number = 0;
  private stealthDuration: number = 0;
  private stealthTimer: number = 0;
  private isStealthed: boolean = false;
  private stealthPhase: 'visible' | 'fading' | 'invisible' | 'appearing' = 'visible';
  
  // Clickable interface
  public isClickable: boolean = true;
  
  // Viewport dimensions for spawning
  private viewportWidth?: number;
  private viewportHeight?: number;
  
  constructor(data: EnemyData) {
    super({
      ...data,
      health: data.health || 1,
      radius: data.radius || 15
    });
    
    this.enemyType = data.enemyType || 'basic';
    this.speed = data.speed || 100; // pixels per second
    this.damage = data.damage || 1;
    this.reward = data.reward || 10;
    this.spawnDistance = data.spawnDistance || 200;
    
    // Store viewport dimensions for spawning
    this.viewportWidth = data.viewportWidth;
    this.viewportHeight = data.viewportHeight;
    
    // Initialize special enemy behaviors
    this.initializeSpecialBehaviors(data);
    
    // Spawn at edge of screen moving toward tower
    this.spawnAtEdge();
    
    console.log(`👹 ${this.enemyType} enemy spawned at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
  }
  
  protected onUpdate(deltaTime: number): void {
    // Early exit if entity is not active or dead to prevent phantom attacks
    if (!this.active || this.health <= 0) {
      return;
    }
    
    // Update visual effects
    this.updateVisualEffects(deltaTime);
    
    // Update special enemy behaviors
    this.updateSpecialBehaviors(deltaTime);
    
    // Update movement toward tower
    this.updateMovement(deltaTime);
    
    // Update attack behavior
    this.updateAttackBehavior(deltaTime);
    
    // Check if enemy reached the tower (only if still alive and active after all updates)
    if (this.active && this.health > 0 && this.distanceToTarget <= this.attackRange && !this.isStealthed) {
      this.attackTowerAndDestroy();
    }
    
    // Remove enemy if it somehow gets too far away (much larger distance now)
    if (this.active && this.distanceToTarget > 1000) {
      console.log(`👹 ${this.id} wandered too far, removing`);
      this.destroy();
    }
  }
  
  protected onRender(renderer: CanvasRenderer, x: number, y: number): void {
    this.renderEnemyBody(renderer, x, y);
    this.renderHealthBar(renderer, x, y);
    this.renderStatusEffects(renderer, x, y);
    this.renderAttackAnimation(renderer, x, y);
  }
  
  protected onDestroy(): void {
    console.log(`💀 ${this.enemyType} enemy ${this.id} destroyed`);
    // Award points to player when destroyed by clicking
  }
  
  protected onReset(data: EntityData): void {
    const enemyData = data as EnemyData;
    
    this.enemyType = enemyData.enemyType || 'basic';
    this.speed = enemyData.speed || 30;
    this.damage = enemyData.damage || 1;
    this.reward = enemyData.reward || 10;
    this.spawnDistance = enemyData.spawnDistance || 200;
    
    // Reset state
    this.attackCooldown = 0;
    this.takeDamageFlash = 0;
    this.isAttacking = false;
    this.attackAnimationTime = 0;
    this.isClickable = true;
    this.towerTarget = null;
    
    // Respawn at edge
    this.spawnAtEdge();
    
    console.log(`♻️ ${this.enemyType} enemy reset and respawned`);
  }
  
  /**
   * Initialize special enemy behaviors based on type
   */
  private initializeSpecialBehaviors(data: EnemyData): void {
    switch (this.enemyType) {
      case 'boss':
        this.spawnCooldown = data.spawnCooldown || 5;
        this.lastSpawnTime = 0;
        break;
        
      case 'swarm':
        this.swarmId = data.swarmId || '';
        this.swarmCount = data.swarmCount || 4;
        // Reduce size for swarm enemies
        this.radius = Math.max(8, this.radius * 0.6);
        this.setupSwarmFormation();
        break;
        
      case 'stealth':
        this.stealthCycle = data.stealthCycle || 6; // 6 second cycle
        this.stealthDuration = data.stealthDuration || 2; // 2 seconds invisible
        this.stealthTimer = 0;
        break;
    }
  }
  
  /**
   * Update special enemy behaviors
   */
  private updateSpecialBehaviors(deltaTime: number): void {
    switch (this.enemyType) {
      case 'boss':
        this.updateBossBehavior(deltaTime);
        break;
        
      case 'swarm':
        this.updateSwarmBehavior(deltaTime);
        break;
        
      case 'stealth':
        this.updateStealthBehavior(deltaTime);
        break;
    }
  }
  
  /**
   * Update boss enemy behavior (spawning minions)
   */
  private updateBossBehavior(_deltaTime: number): void {
    const currentTime = this.age;
    
    if (currentTime - this.lastSpawnTime >= this.spawnCooldown) {
      this.spawnMinion();
      this.lastSpawnTime = currentTime;
    }
    
    // Clean up destroyed minions
    this.spawnedMinions = this.spawnedMinions.filter(minion => minion.active);
  }
  
  /**
   * Update swarm enemy behavior (formation movement)
   */
  private updateSwarmBehavior(_deltaTime: number): void {
    // Swarm enemies move directly toward tower like other enemies
    // No formation wobble - all enemies move in straight lines
    // Slight speed variation based on formation position only
    const baseSpeed = this.speed / (1 + (this.swarmFormation.offsetY * 0.1)); // Reverse previous multiplier
    const speedMultiplier = 1 + (this.swarmFormation.offsetY * 0.05); // Reduced variation
    this.speed = baseSpeed * speedMultiplier;
  }
  
  /**
   * Update stealth enemy behavior (visibility cycling)
   */
  private updateStealthBehavior(deltaTime: number): void {
    this.stealthTimer += deltaTime;
    
    const cycleProgress = (this.stealthTimer % this.stealthCycle) / this.stealthCycle;
    const stealthStart = 0.3; // Start stealth at 30% of cycle
    const stealthEnd = stealthStart + (this.stealthDuration / this.stealthCycle);
    
    if (cycleProgress >= stealthStart && cycleProgress <= stealthEnd) {
      // In stealth phase
      const stealthProgress = (cycleProgress - stealthStart) / (this.stealthDuration / this.stealthCycle);
      
      if (stealthProgress < 0.2) {
        this.stealthPhase = 'fading';
        this.alpha = 1 - (stealthProgress / 0.2);
      } else if (stealthProgress > 0.8) {
        this.stealthPhase = 'appearing';
        this.alpha = (stealthProgress - 0.8) / 0.2;
      } else {
        this.stealthPhase = 'invisible';
        this.alpha = 0.5; // Even more visible to prevent invisible enemies
        this.isStealthed = true;
        this.isClickable = true; // Allow clicking stealth enemies for easier testing
      }
    } else {
      // Visible phase
      this.stealthPhase = 'visible';
      this.alpha = 1;
      this.isStealthed = false;
      this.isClickable = true;
    }
  }
  
  /**
   * Set up swarm formation offset
   */
  private setupSwarmFormation(): void {
    // Create formation based on swarm ID (hash for consistency)
    const hash = this.hashString(this.swarmId + this.id);
    this.swarmFormation = {
      offsetX: (hash % 100) - 50, // -50 to 50 offset
      offsetY: ((hash >> 8) % 100) - 50
    };
  }
  
  /**
   * Spawn a minion (for boss enemies)
   */
  private spawnMinion(): void {
    // This would need access to entity manager to actually spawn
    // For now, just create a placeholder for the boss behavior
    console.log(`👑 Boss ${this.id} would spawn minion`);
    
    // TODO: Implement actual minion spawning when entity manager is accessible
    // This requires the entity manager reference or event system
  }
  
  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Spawn enemy at a random position outside the screen boundaries
   */
  private spawnAtEdge(): void {
    // Get screen boundaries - use viewport size if available
    const screenWidth = this.viewportWidth || 800; 
    const screenHeight = this.viewportHeight || 600;
    const margin = 100; // Spawn distance outside screen
    
    // Choose random edge: 0=top, 1=right, 2=bottom, 3=left
    const edge = Math.floor(Math.random() * 4);
    
    switch (edge) {
      case 0: // Top edge
        this.x = (Math.random() - 0.5) * (screenWidth + margin * 2);
        this.y = -screenHeight / 2 - margin;
        break;
      case 1: // Right edge
        this.x = screenWidth / 2 + margin;
        this.y = (Math.random() - 0.5) * (screenHeight + margin * 2);
        break;
      case 2: // Bottom edge
        this.x = (Math.random() - 0.5) * (screenWidth + margin * 2);
        this.y = screenHeight / 2 + margin;
        break;
      case 3: // Left edge
        this.x = -screenWidth / 2 - margin;
        this.y = (Math.random() - 0.5) * (screenHeight + margin * 2);
        break;
    }
    
    // Always point toward the tower at center (0, 0)
    this.targetX = 0;
    this.targetY = 0;
  }
  
  /**
   * Update movement toward the tower
   */
  private updateMovement(_deltaTime: number): void {
    // Calculate direction to tower
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    this.distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    
    if (this.distanceToTarget > this.attackRange) {
      // Move directly toward tower with no wobble
      const directionX = dx / this.distanceToTarget;
      const directionY = dy / this.distanceToTarget;
      
      this.velocityX = directionX * this.speed;
      this.velocityY = directionY * this.speed;
      
      // Update rotation to face movement direction
      this.rotation = Math.atan2(this.velocityY, this.velocityX);
    } else {
      // Stop moving when in attack range
      this.velocityX = 0;
      this.velocityY = 0;
    }
  }
  
  /**
   * Update attack behavior and cooldowns
   */
  private updateAttackBehavior(deltaTime: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    if (this.isAttacking) {
      this.attackAnimationTime += deltaTime;
      if (this.attackAnimationTime >= 0.5) { // Attack animation lasts 0.5 seconds
        this.isAttacking = false;
        this.attackAnimationTime = 0;
      }
    }
  }
  
  /**
   * Attack the tower and immediately destroy this enemy
   */
  private attackTowerAndDestroy(): void {
    // Safety check: only attack if alive and active
    if (!this.active || this.health <= 0) {
      console.warn(`⚠️ Dead enemy ${this.id} tried to attack tower!`);
      return;
    }
    
    console.log(`⚔️ ${this.enemyType} enemy ${this.id} attacks tower and disappears!`);
    
    // Deal damage to tower if we have a reference
    if (this.towerTarget && this.towerTarget.takeDamage && this.towerTarget.active) {
      const damageDealt = this.towerTarget.takeDamage(this.damage, this);
      if (damageDealt) {
        console.log(`💥 Enemy ${this.id} dealt ${this.damage} damage to tower!`);
      }
    } else {
      console.warn(`⚠️ Enemy ${this.id} tried to attack but no valid tower reference!`);
    }
    
    // Remove enemy immediately after attacking
    this.destroy();
  }
  
  /**
   * Update visual effects
   */
  private updateVisualEffects(deltaTime: number): void {
    // Fade damage flash
    if (this.takeDamageFlash > 0) {
      this.takeDamageFlash -= deltaTime * 3;
      this.takeDamageFlash = Math.max(0, this.takeDamageFlash);
    }
  }
  
  /**
   * Override takeDamage to add visual feedback
   */
  public takeDamage(damage: number, source?: Entity): boolean {
    const died = super.takeDamage(damage, source);
    
    // Add visual feedback
    this.takeDamageFlash = 1.0;
    
    return died;
  }
  
  /**
   * Render the main enemy body
   */
  private renderEnemyBody(renderer: CanvasRenderer, x: number, y: number): void {
    // Enemy color based on type
    let enemyColor = '#FF4444';
    let outlineColor = '#AA0000';
    let renderRadius = this.radius;
    
    // Color and size variations based on enemy type
    switch (this.enemyType) {
      case 'fast':
        enemyColor = '#44FF44';
        outlineColor = '#00AA00';
        break;
      case 'tank':
        enemyColor = '#4444FF';
        outlineColor = '#0000AA';
        break;
      case 'stealth':
        enemyColor = '#FF44FF';
        outlineColor = '#AA00AA';
        break;
      case 'boss':
        enemyColor = '#880000';
        outlineColor = '#440000';
        renderRadius = this.radius * 1.5; // Bosses are larger
        break;
      case 'swarm':
        enemyColor = '#FFAA00';
        outlineColor = '#AA6600';
        renderRadius = this.radius * 0.6; // Swarm enemies are smaller
        break;
    }
    
    // Apply stealth transparency effect with minimum visibility
    let alpha = Math.max(this.alpha, 0.3); // Ensure minimum 30% visibility for all enemies
    if (this.enemyType === 'stealth') {
      // Apply stealth transparency but never fully invisible
      renderer.setAlpha(alpha);
    } else {
      // Ensure normal enemies are fully visible
      renderer.setAlpha(1.0);
    }
    
    // Apply damage flash effect
    if (this.takeDamageFlash > 0) {
      const flashIntensity = this.takeDamageFlash;
      enemyColor = `rgba(255, 255, 255, ${flashIntensity})`;
    }
    
    // Scale based on health for visual feedback
    const healthScale = 0.8 + (this.getHealthPercent() * 0.2);
    renderRadius = renderRadius * healthScale;
    
    // Main enemy body
    renderer.drawCircle(x, y, renderRadius, {
      fillStyle: enemyColor,
      strokeStyle: outlineColor,
      lineWidth: 2
    });
    
    // Inner core with type-specific details
    if (this.enemyType === 'boss') {
      // Boss enemies have multiple inner rings
      renderer.drawCircle(x, y, renderRadius * 0.7, {
        fillStyle: outlineColor
      });
      renderer.drawCircle(x, y, renderRadius * 0.4, {
        fillStyle: enemyColor
      });
      renderer.drawCircle(x, y, renderRadius * 0.2, {
        fillStyle: '#FFFFFF'
      });
    } else if (this.enemyType === 'swarm') {
      // Swarm enemies have simple design
      renderer.drawCircle(x, y, renderRadius * 0.5, {
        fillStyle: outlineColor
      });
    } else {
      // Standard inner core for basic enemies
      renderer.drawCircle(x, y, renderRadius * 0.6, {
        fillStyle: outlineColor
      });
    }
    
    // Special visual effects for boss enemies
    if (this.enemyType === 'boss') {
      // Pulsing outer glow effect
      const pulseIntensity = 0.5 + Math.sin(this.age * 4) * 0.3;
      renderer.drawCircle(x, y, renderRadius * 1.2, {
        strokeStyle: '#FF0000',
        lineWidth: 3,
        alpha: pulseIntensity * 0.6
      });
    }
    
    // Formation indicators for swarm enemies
    if (this.enemyType === 'swarm') {
      // Small dots around swarm enemy to show formation
      const numDots = 4;
      for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2 + this.age;
        const dotX = x + Math.cos(angle) * (renderRadius + 5);
        const dotY = y + Math.sin(angle) * (renderRadius + 5);
        
        renderer.drawCircle(dotX, dotY, 2, {
          fillStyle: outlineColor,
          alpha: 0.7
        });
      }
    }
    
    // Stealth shimmer effect
    if (this.enemyType === 'stealth' && this.stealthPhase !== 'visible') {
      // Create shimmer effect with multiple overlapping circles
      const shimmerIntensity = Math.sin(this.age * 8) * 0.5 + 0.5;
      renderer.drawCircle(x, y, renderRadius * 1.1, {
        strokeStyle: '#FFFFFF',
        lineWidth: 1,
        alpha: shimmerIntensity * 0.3
      });
    }
    
    // Direction indicator (small triangle pointing toward tower)
    if (this.distanceToTarget > this.attackRange && this.enemyType !== 'stealth' || !this.isStealthed) {
      const directionSize = renderRadius * 0.3;
      const dx = this.targetX - x;
      const dy = this.targetY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const dirX = (dx / distance) * directionSize;
        const dirY = (dy / distance) * directionSize;
        
        renderer.drawCircle(x + dirX, y + dirY, 3, {
          fillStyle: '#FFFFFF'
        });
      }
    }
    
    // Reset alpha for stealth enemies
    if (this.enemyType === 'stealth') {
      renderer.setAlpha(1.0);
    }
  }
  
  /**
   * Render health bar above enemy
   */
  private renderHealthBar(renderer: CanvasRenderer, x: number, y: number): void {
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 1.5;
      const barHeight = 4;
      const barY = y - this.radius - 8;
      
      // Background
      renderer.drawRectangle(x - barWidth/2, barY, barWidth, barHeight, {
        fillStyle: '#333333'
      });
      
      // Health
      const healthPercent = this.getHealthPercent();
      const healthWidth = barWidth * healthPercent;
      
      if (healthWidth > 0) {
        const healthColor = healthPercent > 0.5 ? '#4CAF50' : 
                          healthPercent > 0.25 ? '#FF9800' : '#F44336';
        
        renderer.drawRectangle(x - barWidth/2, barY, healthWidth, barHeight, {
          fillStyle: healthColor
        });
      }
    }
  }
  
  /**
   * Render status effects and indicators
   */
  private renderStatusEffects(renderer: CanvasRenderer, x: number, y: number): void {
    // Attack range indicator when close to tower
    if (this.distanceToTarget <= this.attackRange * 1.5) {
      const alpha = 1 - (this.distanceToTarget / (this.attackRange * 1.5));
      renderer.drawCircle(x, y, this.attackRange, {
        strokeStyle: '#FF0000',
        lineWidth: 1,
        alpha: alpha * 0.3
      });
    }
    
    // Enemy type indicator with enhanced visibility for special types
    let typeIcon = '👹';
    switch (this.enemyType) {
      case 'fast': typeIcon = '💨'; break;
      case 'tank': typeIcon = '🛡️'; break;
      case 'stealth': 
        // Show different icons based on stealth phase
        if (this.stealthPhase === 'invisible') {
          typeIcon = '🫥'; // Invisible face
        } else if (this.stealthPhase === 'fading' || this.stealthPhase === 'appearing') {
          typeIcon = '👻'; // Ghost during transition
        } else {
          typeIcon = '🔍'; // Visible stealth enemy
        }
        break;
      case 'boss': typeIcon = '👑'; break;
      case 'swarm': typeIcon = '🐛'; break;
    }
    
    // Only show icon if enemy is visible (not fully stealthed)
    if (this.enemyType !== 'stealth' || this.alpha > 0.2) {
      renderer.drawText(typeIcon, x, y - this.radius - 20, {
        font: this.enemyType === 'boss' ? '16px Arial' : '12px Arial',
        textAlign: 'center',
        alpha: this.enemyType === 'stealth' ? this.alpha : 1.0
      });
    }
    
    // Special status indicators
    if (this.enemyType === 'boss') {
      // Boss spawn countdown indicator
      const spawnProgress = (this.age - this.lastSpawnTime) / this.spawnCooldown;
      if (spawnProgress > 0.7) { // Show warning when spawn is imminent
        const warningAlpha = Math.sin(this.age * 10) * 0.5 + 0.5;
        renderer.drawText('⚠️', x + this.radius + 10, y - this.radius, {
          font: '14px Arial',
          textAlign: 'center',
          alpha: warningAlpha
        });
      }
    }
    
    if (this.enemyType === 'swarm') {
      // Show swarm formation connection lines to nearby swarm members
      // This would require access to other entities, so for now just show swarm count
      renderer.drawText(`${this.swarmCount}`, x, y + this.radius + 15, {
        font: '10px Arial',
        textAlign: 'center',
        fillStyle: '#FFAA00'
      });
    }
    
    if (this.enemyType === 'stealth') {
      // Stealth phase indicator
      if (this.stealthPhase === 'fading') {
        renderer.drawText('→', x - this.radius - 10, y, {
          font: '12px Arial',
          textAlign: 'center',
          fillStyle: '#FF44FF',
          alpha: 0.7
        });
      } else if (this.stealthPhase === 'appearing') {
        renderer.drawText('←', x + this.radius + 10, y, {
          font: '12px Arial',
          textAlign: 'center',
          fillStyle: '#FF44FF',
          alpha: 0.7
        });
      }
    }
  }
  
  /**
   * Render attack animation
   */
  private renderAttackAnimation(renderer: CanvasRenderer, x: number, y: number): void {
    if (this.isAttacking) {
      const progress = this.attackAnimationTime / 0.5;
      const attackRadius = this.radius + progress * 10;
      const alpha = 1 - progress;
      
      renderer.drawCircle(x, y, attackRadius, {
        strokeStyle: '#FF0000',
        lineWidth: 3,
        alpha: alpha
      });
    }
  }
  
  /**
   * Clickable interface implementation
   */
  public onClick?: (clickable: Clickable, clickPosition: { x: number; y: number }) => void;
  public onHover?: (clickable: Clickable, hoverPosition: { x: number; y: number }) => void;
  public onHoverEnd?: (clickable: Clickable) => void;
  
  /**
   * Get enemy statistics
   */
  public getStats(): EnemyStats {
    return {
      enemyType: this.enemyType,
      maxHealth: this.maxHealth,
      currentHealth: this.health,
      speed: this.speed,
      damage: this.damage,
      reward: this.reward,
      distanceFromTower: this.distanceToTarget
    };
  }
  
  /**
   * Get distance to tower
   */
  public getDistanceToTower(): number {
    return this.distanceToTarget;
  }
  
  /**
   * Check if enemy is in attack range
   */
  public isInAttackRange(): boolean {
    return this.distanceToTarget <= this.attackRange;
  }
  
  /**
   * Check if enemy is attacking
   */
  public isCurrentlyAttacking(): boolean {
    return this.isAttacking;
  }
  
  /**
   * Get attack cooldown remaining
   */
  public getAttackCooldown(): number {
    return this.attackCooldown;
  }
  
  /**
   * Force enemy to attack (for testing)
   */
  public forceAttack(): void {
    this.attackTowerAndDestroy();
  }
  
  /**
   * Set tower position (for dynamic targeting)
   */
  public setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }
  
  /**
   * Set tower entity reference for attacking
   */
  public setTowerTarget(tower: Entity): void {
    this.towerTarget = tower;
    this.targetX = tower.x;
    this.targetY = tower.y;
  }
  
  /**
   * Get movement direction
   */
  public getMovementDirection(): { x: number; y: number } {
    if (this.distanceToTarget === 0) return { x: 0, y: 0 };
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    return {
      x: dx / this.distanceToTarget,
      y: dy / this.distanceToTarget
    };
  }
  
  /**
   * Set viewport dimensions for spawning calculations
   */
  public setViewportDimensions(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }
}