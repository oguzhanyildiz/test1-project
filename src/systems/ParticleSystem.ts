// Particle System - High-performance visual effects system with object pooling
import { CanvasRenderer } from '../core/CanvasRenderer.js';

export interface ParticleConfig {
  type: ParticleType;
  position: { x: number; y: number };
  velocity?: { x: number; y: number };
  acceleration?: { x: number; y: number };
  lifetime?: number;
  size?: number;
  color?: string;
  alpha?: number;
  rotation?: number;
  rotationSpeed?: number;
  gravity?: number;
  drag?: number;
  bounce?: number;
  scale?: number;
  scaleSpeed?: number;
  fadeSpeed?: number;
  pulseSpeed?: number;
  pulseAmount?: number;
}

export enum ParticleType {
  EXPLOSION = 'explosion',
  COIN_SPARKLE = 'coin_sparkle',
  ENEMY_DEATH = 'enemy_death',
  CLICK_RIPPLE = 'click_ripple',
  TOWER_DAMAGE = 'tower_damage',
  HEAL_EFFECT = 'heal_effect',
  UPGRADE_CELEBRATION = 'upgrade_celebration',
  SCREEN_SHAKE_DUST = 'screen_shake_dust',
  BULLET_TRAIL = 'bullet_trail',
  LASER_BEAM = 'laser_beam',
  LIGHTNING_SPARK = 'lightning_spark',
  SMOKE_PUFF = 'smoke_puff',
  BLOOD_SPLATTER = 'blood_splatter',
  MAGIC_SPARKLE = 'magic_sparkle',
  ENERGY_BURST = 'energy_burst'
}

export interface Particle {
  id: string;
  type: ParticleType;
  active: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  accelerationX: number;
  accelerationY: number;
  age: number;
  lifetime: number;
  size: number;
  initialSize: number;
  color: string;
  alpha: number;
  initialAlpha: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  drag: number;
  bounce: number;
  scale: number;
  scaleSpeed: number;
  fadeSpeed: number;
  pulseSpeed: number;
  pulseAmount: number;
  pulsePhase: number;
}

export interface ParticleStats {
  activeParticles: number;
  totalParticlesCreated: number;
  poolSize: number;
  maxPoolSize: number;
  averageLifetime: number;
  particlesByType: Map<ParticleType, number>;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private readonly maxParticles: number = 1000;
  private readonly initialPoolSize: number = 100;
  
  // Statistics
  private totalParticlesCreated: number = 0;
  private frameParticleCount: number = 0;
  
  // Performance settings
  private performanceMode: 'high' | 'medium' | 'low' = 'high';
  private cullDistance: number = 50; // Distance outside viewport to cull particles
  private maxParticlesPerFrame: number = 50;
  
  // Visual settings
  private globalAlpha: number = 1.0;
  // private useSubPixelRendering: boolean = true;
  private useBlending: boolean = true;
  
  constructor() {
    this.initializePool();
    console.log(`✨ ParticleSystem initialized with pool size ${this.initialPoolSize}`);
  }
  
  /**
   * Initialize particle object pool
   */
  private initializePool(): void {
    for (let i = 0; i < this.initialPoolSize; i++) {
      this.particlePool.push(this.createParticleObject());
    }
  }
  
  /**
   * Create a new particle object
   */
  private createParticleObject(): Particle {
    return {
      id: '',
      type: ParticleType.EXPLOSION,
      active: false,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      accelerationX: 0,
      accelerationY: 0,
      age: 0,
      lifetime: 1,
      size: 1,
      initialSize: 1,
      color: '#FFFFFF',
      alpha: 1,
      initialAlpha: 1,
      rotation: 0,
      rotationSpeed: 0,
      gravity: 0,
      drag: 0.98,
      bounce: 0,
      scale: 1,
      scaleSpeed: 0,
      fadeSpeed: 1,
      pulseSpeed: 0,
      pulseAmount: 0,
      pulsePhase: 0
    };
  }
  
  /**
   * Get particle from pool or create new one
   */
  private getParticleFromPool(): Particle | null {
    if (this.particles.length >= this.maxParticles) {
      return null; // At max capacity
    }
    
    // Try to get from pool
    let particle = this.particlePool.pop();
    
    if (!particle) {
      // Create new particle if pool is empty
      particle = this.createParticleObject();
    }
    
    // Reset particle
    particle.active = true;
    particle.age = 0;
    particle.pulsePhase = 0;
    
    return particle;
  }
  
  /**
   * Return particle to pool
   */
  private returnParticleToPool(particle: Particle): void {
    particle.active = false;
    
    // Add back to pool if not at capacity
    if (this.particlePool.length < this.maxParticles / 2) {
      this.particlePool.push(particle);
    }
  }
  
  /**
   * Create particle effect
   */
  public createEffect(config: ParticleConfig, count: number = 1): string[] {
    const particleIds: string[] = [];
    const actualCount = Math.min(count, this.maxParticlesPerFrame);
    
    for (let i = 0; i < actualCount; i++) {
      const particle = this.createParticle(config, i, actualCount);
      if (particle) {
        particleIds.push(particle.id);
      }
    }
    
    return particleIds;
  }
  
  /**
   * Create a single particle
   */
  private createParticle(config: ParticleConfig, index: number, totalCount: number): Particle | null {
    const particle = this.getParticleFromPool();
    if (!particle) return null;
    
    // Generate unique ID
    particle.id = `${config.type}_${Date.now()}_${Math.random()}`;
    particle.type = config.type;
    
    // Apply configuration with type-specific defaults
    const defaults = this.getParticleDefaults(config.type, index, totalCount);
    
    particle.x = config.position.x + (defaults.positionSpread?.x || 0) * (Math.random() - 0.5);
    particle.y = config.position.y + (defaults.positionSpread?.y || 0) * (Math.random() - 0.5);
    
    particle.velocityX = (config.velocity?.x ?? defaults.velocity.x) + ((defaults.velocitySpread?.x || 0) * (Math.random() - 0.5));
    particle.velocityY = (config.velocity?.y ?? defaults.velocity.y) + ((defaults.velocitySpread?.y || 0) * (Math.random() - 0.5));
    
    particle.accelerationX = config.acceleration?.x ?? (defaults.acceleration?.x || 0);
    particle.accelerationY = config.acceleration?.y ?? (defaults.acceleration?.y || 0);
    
    particle.lifetime = config.lifetime ?? defaults.lifetime;
    particle.size = config.size ?? defaults.size;
    particle.initialSize = particle.size;
    particle.color = config.color ?? defaults.color;
    particle.alpha = config.alpha ?? defaults.alpha;
    particle.initialAlpha = particle.alpha;
    particle.rotation = config.rotation ?? (defaults.rotation || 0);
    particle.rotationSpeed = config.rotationSpeed ?? (defaults.rotationSpeed || 0);
    particle.gravity = config.gravity ?? (defaults.gravity || 0);
    particle.drag = config.drag ?? (defaults.drag || 0.98);
    particle.bounce = config.bounce ?? (defaults.bounce || 0);
    particle.scale = config.scale ?? (defaults.scale || 1);
    particle.scaleSpeed = config.scaleSpeed ?? (defaults.scaleSpeed || 0);
    particle.fadeSpeed = config.fadeSpeed ?? (defaults.fadeSpeed || 1);
    particle.pulseSpeed = config.pulseSpeed ?? (defaults.pulseSpeed || 0);
    particle.pulseAmount = config.pulseAmount ?? (defaults.pulseAmount || 0);
    
    this.particles.push(particle);
    this.totalParticlesCreated++;
    
    return particle;
  }
  
  /**
   * Get default particle properties based on type
   */
  private getParticleDefaults(type: ParticleType, index: number, total: number): any {
    const angle = (index / total) * Math.PI * 2;
    
    switch (type) {
      case ParticleType.EXPLOSION:
        return {
          velocity: { x: Math.cos(angle) * 100, y: Math.sin(angle) * 100 },
          velocitySpread: { x: 50, y: 50 },
          positionSpread: { x: 5, y: 5 },
          lifetime: 0.8 + Math.random() * 0.4,
          size: 3 + Math.random() * 3,
          color: `hsl(${Math.random() * 60}, 100%, ${50 + Math.random() * 30}%)`,
          alpha: 1,
          gravity: 50,
          drag: 0.95,
          fadeSpeed: 2,
          scaleSpeed: -1
        };
        
      case ParticleType.COIN_SPARKLE:
        return {
          velocity: { x: (Math.random() - 0.5) * 40, y: -20 - Math.random() * 30 },
          velocitySpread: { x: 20, y: 10 },
          positionSpread: { x: 8, y: 8 },
          lifetime: 1.2,
          size: 2 + Math.random() * 2,
          color: '#FFD700',
          alpha: 1,
          gravity: 30,
          drag: 0.98,
          fadeSpeed: 1.5,
          pulseSpeed: 8,
          pulseAmount: 0.3
        };
        
      case ParticleType.ENEMY_DEATH:
        return {
          velocity: { x: (Math.random() - 0.5) * 80, y: -Math.random() * 60 },
          velocitySpread: { x: 40, y: 20 },
          positionSpread: { x: 10, y: 10 },
          lifetime: 1.0,
          size: 2 + Math.random() * 3,
          color: '#FF4444',
          alpha: 1,
          gravity: 80,
          drag: 0.96,
          fadeSpeed: 2,
          scaleSpeed: -0.5
        };
        
      case ParticleType.CLICK_RIPPLE:
        return {
          velocity: { x: Math.cos(angle) * 80, y: Math.sin(angle) * 80 },
          velocitySpread: { x: 0, y: 0 },
          positionSpread: { x: 0, y: 0 },
          lifetime: 0.5,
          size: 1,
          color: '#FFFFFF',
          alpha: 0.8,
          gravity: 0,
          drag: 1.02, // Expand outward
          fadeSpeed: 3,
          scaleSpeed: 2
        };
        
      case ParticleType.TOWER_DAMAGE:
        return {
          velocity: { x: (Math.random() - 0.5) * 120, y: -Math.random() * 80 },
          velocitySpread: { x: 60, y: 40 },
          positionSpread: { x: 15, y: 15 },
          lifetime: 1.5,
          size: 4 + Math.random() * 4,
          color: '#8B0000',
          alpha: 1,
          gravity: 100,
          drag: 0.94,
          fadeSpeed: 1.2,
          rotationSpeed: (Math.random() - 0.5) * 10
        };
        
      case ParticleType.HEAL_EFFECT:
        return {
          velocity: { x: (Math.random() - 0.5) * 20, y: -40 - Math.random() * 20 },
          velocitySpread: { x: 10, y: 10 },
          positionSpread: { x: 12, y: 12 },
          lifetime: 2.0,
          size: 3 + Math.random() * 2,
          color: '#00FF7F',
          alpha: 0.8,
          gravity: -10, // Float upward
          drag: 0.99,
          fadeSpeed: 0.8,
          pulseSpeed: 6,
          pulseAmount: 0.4
        };
        
      case ParticleType.UPGRADE_CELEBRATION:
        return {
          velocity: { x: Math.cos(angle) * 60, y: Math.sin(angle) * 60 - 40 },
          velocitySpread: { x: 30, y: 20 },
          positionSpread: { x: 0, y: 0 },
          lifetime: 2.5,
          size: 4 + Math.random() * 3,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          alpha: 1,
          gravity: 20,
          drag: 0.98,
          fadeSpeed: 0.6,
          rotationSpeed: (Math.random() - 0.5) * 8,
          pulseSpeed: 4,
          pulseAmount: 0.2
        };
        
      case ParticleType.BULLET_TRAIL:
        return {
          velocity: { x: 0, y: 0 },
          velocitySpread: { x: 5, y: 5 },
          positionSpread: { x: 2, y: 2 },
          lifetime: 0.3,
          size: 1 + Math.random(),
          color: '#FFFF99',
          alpha: 0.6,
          gravity: 0,
          drag: 0.95,
          fadeSpeed: 4,
          scaleSpeed: -2
        };
        
      case ParticleType.LIGHTNING_SPARK:
        return {
          velocity: { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 },
          velocitySpread: { x: 100, y: 100 },
          positionSpread: { x: 3, y: 3 },
          lifetime: 0.2,
          size: 1 + Math.random() * 2,
          color: '#00FFFF',
          alpha: 1,
          gravity: 0,
          drag: 0.90,
          fadeSpeed: 8,
          pulseSpeed: 20,
          pulseAmount: 0.5
        };
        
      default:
        return {
          velocity: { x: 0, y: 0 },
          velocitySpread: { x: 0, y: 0 },
          positionSpread: { x: 0, y: 0 },
          lifetime: 1,
          size: 2,
          color: '#FFFFFF',
          alpha: 1,
          gravity: 0,
          drag: 0.98,
          fadeSpeed: 1
        };
    }
  }
  
  /**
   * Update all particles
   */
  public update(deltaTime: number): void {
    this.frameParticleCount = 0;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (!particle.active) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update age
      particle.age += deltaTime;
      
      // Check lifetime
      if (particle.age >= particle.lifetime) {
        this.particles.splice(i, 1);
        this.returnParticleToPool(particle);
        continue;
      }
      
      // Update physics
      this.updateParticlePhysics(particle, deltaTime);
      
      // Update visual properties
      this.updateParticleVisuals(particle, deltaTime);
      
      this.frameParticleCount++;
    }
  }
  
  /**
   * Update particle physics
   */
  private updateParticlePhysics(particle: Particle, deltaTime: number): void {
    // Apply acceleration
    particle.velocityX += particle.accelerationX * deltaTime;
    particle.velocityY += particle.accelerationY * deltaTime;
    
    // Apply gravity
    particle.velocityY += particle.gravity * deltaTime;
    
    // Apply drag
    particle.velocityX *= particle.drag;
    particle.velocityY *= particle.drag;
    
    // Update position
    particle.x += particle.velocityX * deltaTime;
    particle.y += particle.velocityY * deltaTime;
    
    // Update rotation
    particle.rotation += particle.rotationSpeed * deltaTime;
    
    // Handle bouncing (basic implementation)
    if (particle.bounce > 0) {
      // This would need screen bounds to work properly
      // For now, just a placeholder
    }
  }
  
  /**
   * Update particle visual properties
   */
  private updateParticleVisuals(particle: Particle, deltaTime: number): void {
    const lifePercent = particle.age / particle.lifetime;
    
    // Update alpha based on fade speed
    particle.alpha = particle.initialAlpha * (1 - lifePercent * particle.fadeSpeed);
    particle.alpha = Math.max(0, particle.alpha);
    
    // Update size based on scale speed
    particle.size = particle.initialSize * (particle.scale + particle.scaleSpeed * lifePercent);
    particle.size = Math.max(0, particle.size);
    
    // Update pulse effect
    if (particle.pulseSpeed > 0) {
      particle.pulsePhase += particle.pulseSpeed * deltaTime;
      const pulseMultiplier = 1 + Math.sin(particle.pulsePhase) * particle.pulseAmount;
      particle.size *= pulseMultiplier;
      particle.alpha *= pulseMultiplier;
    }
  }
  
  /**
   * Render all particles
   */
  public render(renderer: CanvasRenderer): void {
    if (this.particles.length === 0) return;
    
    const ctx = renderer.getContext();
    const viewport = renderer.getViewport();
    
    ctx.save();
    
    // Set global alpha for performance mode
    if (this.performanceMode === 'low') {
      ctx.globalAlpha = this.globalAlpha * 0.7;
    } else {
      ctx.globalAlpha = this.globalAlpha;
    }
    
    // Enable blending for better visual effects
    if (this.useBlending) {
      ctx.globalCompositeOperation = 'lighter';
    }
    
    for (const particle of this.particles) {
      if (!particle.active || particle.alpha <= 0.01) continue;
      
      // Cull particles outside viewport (with margin)
      if (this.shouldCullParticle(particle, viewport)) continue;
      
      this.renderParticle(ctx, particle);
    }
    
    ctx.restore();
  }
  
  /**
   * Check if particle should be culled
   */
  private shouldCullParticle(particle: Particle, viewport: any): boolean {
    const margin = this.cullDistance;
    return (
      particle.x < -margin ||
      particle.x > viewport.width + margin ||
      particle.y < -margin ||
      particle.y > viewport.height + margin
    );
  }
  
  /**
   * Render a single particle
   */
  private renderParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
    ctx.save();
    
    // Set alpha
    ctx.globalAlpha = particle.alpha;
    
    // Translate to particle position
    ctx.translate(particle.x, particle.y);
    
    // Apply rotation
    if (particle.rotation !== 0) {
      ctx.rotate(particle.rotation);
    }
    
    // Set color
    ctx.fillStyle = particle.color;
    
    // Render based on particle type
    switch (particle.type) {
      case ParticleType.EXPLOSION:
      case ParticleType.ENEMY_DEATH:
      case ParticleType.TOWER_DAMAGE:
        // Render as filled circle
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case ParticleType.COIN_SPARKLE:
      case ParticleType.HEAL_EFFECT:
      case ParticleType.UPGRADE_CELEBRATION:
        // Render as star shape
        this.renderStar(ctx, particle.size, 5);
        break;
        
      case ParticleType.CLICK_RIPPLE:
        // Render as circle outline
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case ParticleType.LIGHTNING_SPARK:
        // Render as plus shape
        ctx.lineWidth = particle.size;
        ctx.strokeStyle = particle.color;
        ctx.beginPath();
        ctx.moveTo(-particle.size, 0);
        ctx.lineTo(particle.size, 0);
        ctx.moveTo(0, -particle.size);
        ctx.lineTo(0, particle.size);
        ctx.stroke();
        break;
        
      case ParticleType.BULLET_TRAIL:
        // Render as small rectangle
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 2);
        break;
        
      default:
        // Default: render as circle
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * Render a star shape
   */
  private renderStar(ctx: CanvasRenderingContext2D, radius: number, points: number): void {
    const outerRadius = radius;
    const innerRadius = radius * 0.4;
    
    ctx.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Clear all particles
   */
  public clear(): void {
    for (const particle of this.particles) {
      this.returnParticleToPool(particle);
    }
    this.particles = [];
  }
  
  /**
   * Set performance mode
   */
  public setPerformanceMode(mode: 'high' | 'medium' | 'low'): void {
    this.performanceMode = mode;
    
    switch (mode) {
      case 'high':
        this.maxParticlesPerFrame = 50;
        this.globalAlpha = 1.0;
        this.useBlending = true;
        break;
      case 'medium':
        this.maxParticlesPerFrame = 30;
        this.globalAlpha = 0.8;
        this.useBlending = true;
        break;
      case 'low':
        this.maxParticlesPerFrame = 15;
        this.globalAlpha = 0.6;
        this.useBlending = false;
        break;
    }
    
    console.log(`✨ ParticleSystem performance mode set to: ${mode}`);
  }
  
  /**
   * Get particle system statistics
   */
  public getStats(): ParticleStats {
    const particlesByType = new Map<ParticleType, number>();
    
    for (const particle of this.particles) {
      const count = particlesByType.get(particle.type) || 0;
      particlesByType.set(particle.type, count + 1);
    }
    
    const totalLifetime = this.particles.reduce((sum, p) => sum + p.lifetime, 0);
    const averageLifetime = this.particles.length > 0 ? totalLifetime / this.particles.length : 0;
    
    return {
      activeParticles: this.particles.length,
      totalParticlesCreated: this.totalParticlesCreated,
      poolSize: this.particlePool.length,
      maxPoolSize: this.maxParticles,
      averageLifetime,
      particlesByType
    };
  }
  
  /**
   * Create common particle effects
   */
  public static createExplosion(x: number, y: number, intensity: number = 1): ParticleConfig {
    return {
      type: ParticleType.EXPLOSION,
      position: { x, y },
      lifetime: 0.8 * intensity,
      size: 3 * intensity
    };
  }
  
  public static createCoinSparkle(x: number, y: number): ParticleConfig {
    return {
      type: ParticleType.COIN_SPARKLE,
      position: { x, y }
    };
  }
  
  public static createEnemyDeath(x: number, y: number, enemyType: string): ParticleConfig {
    const color = enemyType === 'boss' ? '#8B0000' : '#FF4444';
    const intensity = enemyType === 'boss' ? 2 : 1;
    
    return {
      type: ParticleType.ENEMY_DEATH,
      position: { x, y },
      color,
      size: 3 * intensity
    };
  }
  
  public static createClickRipple(x: number, y: number): ParticleConfig {
    return {
      type: ParticleType.CLICK_RIPPLE,
      position: { x, y }
    };
  }
  
  public static createTowerDamage(x: number, y: number): ParticleConfig {
    return {
      type: ParticleType.TOWER_DAMAGE,
      position: { x, y }
    };
  }
  
  public static createHealEffect(x: number, y: number): ParticleConfig {
    return {
      type: ParticleType.HEAL_EFFECT,
      position: { x, y }
    };
  }
  
  public static createUpgradeCelebration(x: number, y: number): ParticleConfig {
    return {
      type: ParticleType.UPGRADE_CELEBRATION,
      position: { x, y }
    };
  }
}