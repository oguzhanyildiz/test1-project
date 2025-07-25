// Tower Weapon System - Automated tower attacks with different weapon types
import { Enemy } from '../entities/Enemy.js';
import { Tower } from '../entities/Tower.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';

export interface WeaponConfig {
  type: 'ballistic' | 'energy';
  name: string;
  damage: number;
  range: number;
  fireRate: number; // attacks per second
  projectileSpeed?: number; // for ballistic weapons
  areaOfEffect?: number; // explosion/beam radius
  piercing?: boolean; // can hit multiple enemies
  homing?: boolean; // projectiles track targets
  continuous?: boolean; // energy beams
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  range: number;
  type: 'bullet' | 'shell' | 'laser' | 'plasma' | 'lightning';
  createdTime: number;
  lifetime: number;
  target?: Enemy;
  homing: boolean;
  piercing: boolean;
  areaOfEffect: number;
  active: boolean;
}

export interface TowerWeaponStats {
  activeWeapons: string[];
  totalDamageDealt: number;
  enemiesKilled: number;
  projectilesFired: number;
  accuracy: number;
}

export enum TargetingMode {
  NEAREST = 'nearest',
  FURTHEST = 'furthest', 
  WEAKEST = 'weakest',
  STRONGEST = 'strongest',
  FASTEST = 'fastest',
  SLOWEST = 'slowest'
}

export class TowerWeaponSystem {
  private tower: Tower | null = null;
  private activeWeapons: Map<string, WeaponConfig> = new Map();
  private projectiles: Map<string, Projectile> = new Map();
  private lastFireTimes: Map<string, number> = new Map();
  private targetingMode: TargetingMode = TargetingMode.NEAREST;
  
  // Statistics
  private totalDamageDealt: number = 0;
  private enemiesKilled: number = 0;
  private projectilesFired: number = 0;
  private shotsHit: number = 0;
  
  // Visual effects
  private muzzleFlashes: Array<{x: number, y: number, type: string, intensity: number, duration: number}> = [];
  private beamEffects: Array<{fromX: number, fromY: number, toX: number, toY: number, type: string, duration: number}> = [];
  
  // Available weapons catalog
  private weaponCatalog: Map<string, WeaponConfig> = new Map();
  
  // Events
  private onEnemyKilledCallbacks: Array<(enemy: Enemy, weapon: string) => void> = [];
  private onProjectileHitCallbacks: Array<(projectile: Projectile, enemy: Enemy) => void> = [];
  
  constructor() {
    this.initializeWeaponCatalog();
    console.log('🔫 TowerWeaponSystem initialized with', this.weaponCatalog.size, 'weapon types');
  }
  
  /**
   * Initialize all available weapon types
   */
  private initializeWeaponCatalog(): void {
    // Ballistic Weapons Branch
    this.weaponCatalog.set('basic_turret', {
      type: 'ballistic',
      name: 'Basic Turret',
      damage: 1,
      range: 150,
      fireRate: 0.5, // every 2 seconds
      projectileSpeed: 200,
      areaOfEffect: 0,
      piercing: false,
      homing: false
    });
    
    this.weaponCatalog.set('rapid_fire', {
      type: 'ballistic',
      name: 'Rapid Fire',
      damage: 1,
      range: 150,
      fireRate: 1.0, // every 1 second
      projectileSpeed: 250,
      areaOfEffect: 0,
      piercing: false,
      homing: false
    });
    
    this.weaponCatalog.set('piercing_rounds', {
      type: 'ballistic',
      name: 'Piercing Rounds',
      damage: 1,
      range: 150,
      fireRate: 1.0,
      projectileSpeed: 250,
      areaOfEffect: 0,
      piercing: true,
      homing: false
    });
    
    this.weaponCatalog.set('explosive_shells', {
      type: 'ballistic',
      name: 'Explosive Shells',
      damage: 2,
      range: 150,
      fireRate: 0.5,
      projectileSpeed: 200,
      areaOfEffect: 30,
      piercing: false,
      homing: false
    });
    
    this.weaponCatalog.set('artillery_mode', {
      type: 'ballistic',
      name: 'Artillery Mode',
      damage: 5,
      range: 200,
      fireRate: 0.2, // every 5 seconds
      projectileSpeed: 150,
      areaOfEffect: 50,
      piercing: false,
      homing: false
    });
    
    // Energy Weapons Branch
    this.weaponCatalog.set('laser_beam', {
      type: 'energy',
      name: 'Laser Beam',
      damage: 0.5, // damage per tick
      range: 180,
      fireRate: 10, // continuous
      areaOfEffect: 0,
      piercing: true,
      continuous: true
    });
    
    this.weaponCatalog.set('chain_lightning', {
      type: 'energy',
      name: 'Chain Lightning',
      damage: 2,
      range: 160,
      fireRate: 0.33, // every 3 seconds
      areaOfEffect: 80, // chain range
      piercing: false,
      homing: true
    });
    
    this.weaponCatalog.set('energy_burst', {
      type: 'energy',
      name: 'Energy Burst',
      damage: 1,
      range: 120,
      fireRate: 0.2, // every 5 seconds
      areaOfEffect: 120, // full range AoE
      piercing: false
    });
    
    this.weaponCatalog.set('plasma_cannon', {
      type: 'energy',
      name: 'Plasma Cannon',
      damage: 4,
      range: 170,
      fireRate: 0.25, // every 4 seconds
      projectileSpeed: 100,
      areaOfEffect: 20,
      piercing: true
    });
    
    this.weaponCatalog.set('tesla_coil', {
      type: 'energy',
      name: 'Tesla Coil',
      damage: 1, // damage per tick
      range: 100,
      fireRate: 5, // continuous area damage
      areaOfEffect: 100,
      continuous: true
    });
  }
  
  /**
   * Set the tower reference
   */
  public setTower(tower: Tower): void {
    this.tower = tower;
  }
  
  /**
   * Activate a weapon for the tower
   */
  public activateWeapon(weaponId: string): boolean {
    const weaponConfig = this.weaponCatalog.get(weaponId);
    if (!weaponConfig) {
      console.warn(`❌ Unknown weapon: ${weaponId}`);
      return false;
    }
    
    this.activeWeapons.set(weaponId, weaponConfig);
    this.lastFireTimes.set(weaponId, 0);
    
    console.log(`🔫 Activated weapon: ${weaponConfig.name}`);
    return true;
  }
  
  /**
   * Deactivate a weapon
   */
  public deactivateWeapon(weaponId: string): boolean {
    if (this.activeWeapons.has(weaponId)) {
      this.activeWeapons.delete(weaponId);
      this.lastFireTimes.delete(weaponId);
      console.log(`🔫 Deactivated weapon: ${weaponId}`);
      return true;
    }
    return false;
  }
  
  /**
   * Update weapon system
   */
  public update(deltaTime: number, enemies: Enemy[]): void {
    const currentTime = performance.now();
    
    // Log enemy count for debugging phantom fires
    const activeEnemyCount = enemies.filter(e => e && e.active && e.health > 0).length;
    if (activeEnemyCount !== enemies.length) {
      console.warn(`⚠️ TowerWeaponSystem received ${enemies.length} enemies but only ${activeEnemyCount} are valid!`);
    }
    
    // Update all active weapons
    for (const [weaponId, weapon] of this.activeWeapons) {
      this.updateWeapon(weaponId, weapon, currentTime, deltaTime, enemies);
    }
    
    // Update projectiles
    this.updateProjectiles(deltaTime, enemies);
    
    // Update visual effects
    this.updateVisualEffects(deltaTime);
  }
  
  /**
   * Update individual weapon
   */
  private updateWeapon(weaponId: string, weapon: WeaponConfig, currentTime: number, deltaTime: number, enemies: Enemy[]): void {
    if (!this.tower) return;
    
    const lastFireTime = this.lastFireTimes.get(weaponId) || 0;
    const fireInterval = 1000 / weapon.fireRate; // convert to milliseconds
    
    if (currentTime - lastFireTime >= fireInterval) {
      // Find target
      const target = this.findTarget(enemies, weapon);
      if (target) {
        this.fireWeapon(weaponId, weapon, target, enemies);
        this.lastFireTimes.set(weaponId, currentTime);
      }
    }
    
    // Handle continuous weapons
    if (weapon.continuous) {
      this.handleContinuousWeapon(weapon, deltaTime, enemies);
    }
  }
  
  /**
   * Find target based on targeting mode and weapon range
   */
  private findTarget(enemies: Enemy[], weapon: WeaponConfig): Enemy | null {
    if (!this.tower) return null;
    
    const validTargets = enemies.filter(enemy => {
      // More thorough validation
      if (!enemy || !enemy.active || enemy.health <= 0) {
        return false;
      }
      
      const distance = Math.sqrt(
        (enemy.x - this.tower!.x) ** 2 + (enemy.y - this.tower!.y) ** 2
      );
      return distance <= weapon.range;
    });
    
    // Debug log when finding targets
    if (validTargets.length > 0) {
      const targetInfo = validTargets.map(e => `${e.id}(${e.enemyType}@${e.x.toFixed(0)},${e.y.toFixed(0)})`).join(', ');
      console.log(`🎯 Found ${validTargets.length} valid targets for ${weapon.name}: ${targetInfo}`);
    } else if (enemies.length > 0) {
      console.log(`🎯 No valid targets for ${weapon.name} among ${enemies.length} enemies`);
    }
    
    if (validTargets.length === 0) return null;
    
    switch (this.targetingMode) {
      case TargetingMode.NEAREST:
        return validTargets.reduce((closest, enemy) => {
          const closestDist = Math.sqrt((closest.x - this.tower!.x) ** 2 + (closest.y - this.tower!.y) ** 2);
          const enemyDist = Math.sqrt((enemy.x - this.tower!.x) ** 2 + (enemy.y - this.tower!.y) ** 2);
          return enemyDist < closestDist ? enemy : closest;
        });
        
      case TargetingMode.FURTHEST:
        return validTargets.reduce((furthest, enemy) => {
          const furthestDist = Math.sqrt((furthest.x - this.tower!.x) ** 2 + (furthest.y - this.tower!.y) ** 2);
          const enemyDist = Math.sqrt((enemy.x - this.tower!.x) ** 2 + (enemy.y - this.tower!.y) ** 2);
          return enemyDist > furthestDist ? enemy : furthest;
        });
        
      case TargetingMode.WEAKEST:
        return validTargets.reduce((weakest, enemy) => 
          enemy.health < weakest.health ? enemy : weakest
        );
        
      case TargetingMode.STRONGEST:
        return validTargets.reduce((strongest, enemy) => 
          enemy.health > strongest.health ? enemy : strongest
        );
        
      case TargetingMode.FASTEST:
        return validTargets.reduce((fastest, enemy) => 
          enemy.speed > fastest.speed ? enemy : fastest
        );
        
      case TargetingMode.SLOWEST:
        return validTargets.reduce((slowest, enemy) => 
          enemy.speed < slowest.speed ? enemy : slowest
        );
        
      default:
        return validTargets[0];
    }
  }
  
  /**
   * Fire a weapon at target
   */
  private fireWeapon(_weaponId: string, weapon: WeaponConfig, target: Enemy, allEnemies: Enemy[]): void {
    if (!this.tower) return;
    
    // Validate target is still valid before firing
    if (!target || !target.active || target.health <= 0) {
      console.warn(`⚠️ Tried to fire at invalid target: ${target?.id || 'null'}`);
      return;
    }
    
    if (weapon.type === 'ballistic') {
      this.createProjectile(weapon, target);
    } else if (weapon.type === 'energy') {
      this.fireEnergyWeapon(weapon, target, allEnemies);
    }
    
    // Create muzzle flash effect
    this.createMuzzleFlash(this.tower.x, this.tower.y, weapon.type);
    
    this.projectilesFired++;
    console.log(`🔫 Tower fired ${weapon.name} at enemy ${target.id} at (${target.x.toFixed(1)}, ${target.y.toFixed(1)})`);
  }
  
  /**
   * Create ballistic projectile
   */
  private createProjectile(weapon: WeaponConfig, target: Enemy): void {
    if (!this.tower || !weapon.projectileSpeed) return;
    
    // Calculate trajectory
    const dx = target.x - this.tower.x;
    const dy = target.y - this.tower.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Lead target for moving enemies
    const timeToTarget = distance / weapon.projectileSpeed;
    const predictedX = target.x + target.velocityX * timeToTarget;
    const predictedY = target.y + target.velocityY * timeToTarget;
    
    const finalDx = predictedX - this.tower.x;
    const finalDy = predictedY - this.tower.y;
    const finalDistance = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
    
    const projectile: Projectile = {
      id: this.generateProjectileId(),
      x: this.tower.x,
      y: this.tower.y,
      targetX: predictedX,
      targetY: predictedY,
      velocityX: (finalDx / finalDistance) * weapon.projectileSpeed,
      velocityY: (finalDy / finalDistance) * weapon.projectileSpeed,
      damage: weapon.damage,
      range: weapon.range,
      type: this.getProjectileType(weapon.name),
      createdTime: performance.now(),
      lifetime: (weapon.range / weapon.projectileSpeed) * 1000, // in milliseconds
      target: weapon.homing ? target : undefined,
      homing: weapon.homing || false,
      piercing: weapon.piercing || false,
      areaOfEffect: weapon.areaOfEffect || 0,
      active: true
    };
    
    this.projectiles.set(projectile.id, projectile);
  }
  
  /**
   * Fire energy weapon (instant hit)
   */
  private fireEnergyWeapon(weapon: WeaponConfig, target: Enemy, allEnemies: Enemy[]): void {
    if (!this.tower) return;
    
    switch (weapon.name) {
      case 'Chain Lightning':
        this.handleChainLightning(weapon, target, allEnemies);
        break;
        
      case 'Energy Burst':
        this.handleEnergyBurst(weapon, allEnemies);
        break;
        
      case 'Plasma Cannon':
        this.createProjectile(weapon, target); // Plasma acts like slow projectile
        break;
        
      default:
        // Direct hit energy weapons
        this.damageEnemy(target, weapon.damage, weapon.name);
        this.createBeamEffect(this.tower.x, this.tower.y, target.x, target.y, weapon.type);
    }
  }
  
  /**
   * Handle chain lightning effect
   */
  private handleChainLightning(weapon: WeaponConfig, target: Enemy, allEnemies: Enemy[]): void {
    if (!this.tower) return;
    
    let currentTarget: Enemy | null = target;
    const hitTargets = new Set<Enemy>();
    const maxChains = 5;
    let chains = 0;
    
    while (currentTarget && chains < maxChains) {
      if (hitTargets.has(currentTarget)) break;
      
      hitTargets.add(currentTarget);
      this.damageEnemy(currentTarget, weapon.damage, weapon.name);
      
      // Create lightning effect
      const fromX = chains === 0 ? this.tower.x : currentTarget.x;
      const fromY = chains === 0 ? this.tower.y : currentTarget.y;
      
      // Find next target in chain
      let nextTarget: Enemy | null = null;
      let closestDistance = weapon.areaOfEffect || 80;
      
      for (const enemy of allEnemies) {
        if (!hitTargets.has(enemy) && enemy.active) {
          const distance = Math.sqrt(
            (enemy.x - currentTarget.x) ** 2 + (enemy.y - currentTarget.y) ** 2
          );
          if (distance <= closestDistance) {
            nextTarget = enemy;
            closestDistance = distance;
          }
        }
      }
      
      if (nextTarget) {
        this.createBeamEffect(fromX, fromY, nextTarget.x, nextTarget.y, 'lightning');
      }
      
      currentTarget = nextTarget;
      chains++;
    }
  }
  
  /**
   * Handle energy burst (AoE)
   */
  private handleEnergyBurst(weapon: WeaponConfig, allEnemies: Enemy[]): void {
    if (!this.tower) return;
    
    const range = weapon.areaOfEffect || weapon.range;
    
    for (const enemy of allEnemies) {
      const distance = Math.sqrt(
        (enemy.x - this.tower.x) ** 2 + (enemy.y - this.tower.y) ** 2
      );
      
      if (distance <= range && enemy.active) {
        this.damageEnemy(enemy, weapon.damage, weapon.name);
      }
    }
    
    // Create burst visual effect
    this.createMuzzleFlash(this.tower.x, this.tower.y, 'energy_burst');
  }
  
  /**
   * Handle continuous weapons like laser beam and tesla coil
   */
  private handleContinuousWeapon(weapon: WeaponConfig, deltaTime: number, enemies: Enemy[]): void {
    if (!this.tower) return;
    
    if (weapon.name === 'Laser Beam') {
      // Find target and deal continuous damage
      const target = this.findTarget(enemies, weapon);
      if (target) {
        this.damageEnemy(target, weapon.damage * deltaTime, weapon.name);
        this.createBeamEffect(this.tower.x, this.tower.y, target.x, target.y, 'laser');
      }
    } else if (weapon.name === 'Tesla Coil') {
      // Damage all enemies in range
      const range = weapon.areaOfEffect || weapon.range;
      for (const enemy of enemies) {
        const distance = Math.sqrt(
          (enemy.x - this.tower.x) ** 2 + (enemy.y - this.tower.y) ** 2
        );
        
        if (distance <= range && enemy.active) {
          this.damageEnemy(enemy, weapon.damage * deltaTime, weapon.name);
          this.createBeamEffect(this.tower.x, this.tower.y, enemy.x, enemy.y, 'electricity');
        }
      }
    }
  }
  
  /**
   * Update projectile movement and collision
   */
  private updateProjectiles(deltaTime: number, enemies: Enemy[]): void {
    for (const [projectileId, projectile] of this.projectiles) {
      if (!projectile.active) continue;
      
      // Update homing projectiles
      if (projectile.homing && projectile.target && projectile.target.active) {
        const dx = projectile.target.x - projectile.x;
        const dy = projectile.target.y - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const speed = Math.sqrt(projectile.velocityX ** 2 + projectile.velocityY ** 2);
          projectile.velocityX = (dx / distance) * speed;
          projectile.velocityY = (dy / distance) * speed;
        }
      }
      
      // Move projectile
      projectile.x += projectile.velocityX * deltaTime;
      projectile.y += projectile.velocityY * deltaTime;
      
      // Check lifetime
      const age = performance.now() - projectile.createdTime;
      if (age > projectile.lifetime) {
        this.projectiles.delete(projectileId);
        continue;
      }
      
      // Check collision with enemies
      this.checkProjectileCollisions(projectile, enemies);
    }
  }
  
  /**
   * Check projectile collisions with enemies
   */
  private checkProjectileCollisions(projectile: Projectile, enemies: Enemy[]): void {
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const distance = Math.sqrt(
        (projectile.x - enemy.x) ** 2 + (projectile.y - enemy.y) ** 2
      );
      
      if (distance <= enemy.radius + 5) { // Small collision tolerance
        // Hit!
        this.handleProjectileHit(projectile, enemy, enemies);
        
        if (!projectile.piercing) {
          projectile.active = false;
          this.projectiles.delete(projectile.id);
          break;
        }
      }
    }
  }
  
  /**
   * Handle projectile hit
   */
  private handleProjectileHit(projectile: Projectile, hitEnemy: Enemy, allEnemies: Enemy[]): void {
    this.shotsHit++;
    
    // Apply damage to hit enemy
    this.damageEnemy(hitEnemy, projectile.damage, projectile.type);
    
    // Handle area of effect
    if (projectile.areaOfEffect > 0) {
      for (const enemy of allEnemies) {
        if (enemy === hitEnemy || !enemy.active) continue;
        
        const distance = Math.sqrt(
          (projectile.x - enemy.x) ** 2 + (projectile.y - enemy.y) ** 2
        );
        
        if (distance <= projectile.areaOfEffect) {
          this.damageEnemy(enemy, projectile.damage, projectile.type);
        }
      }
      
      // Create explosion effect
      this.createMuzzleFlash(projectile.x, projectile.y, 'explosion');
    }
    
    // Trigger hit callbacks
    for (const callback of this.onProjectileHitCallbacks) {
      callback(projectile, hitEnemy);
    }
  }
  
  /**
   * Damage an enemy and track statistics
   */
  private damageEnemy(enemy: Enemy, damage: number, weaponType: string): void {
    const died = enemy.takeDamage(damage);
    this.totalDamageDealt += damage;
    
    if (died) {
      this.enemiesKilled++;
      
      // Trigger enemy killed callbacks
      for (const callback of this.onEnemyKilledCallbacks) {
        callback(enemy, weaponType);
      }
    }
  }
  
  /**
   * Create visual effects
   */
  private createMuzzleFlash(x: number, y: number, type: string): void {
    this.muzzleFlashes.push({
      x, y, type,
      intensity: 1.0,
      duration: 0.2
    });
  }
  
  private createBeamEffect(fromX: number, fromY: number, toX: number, toY: number, type: string): void {
    this.beamEffects.push({
      fromX, fromY, toX, toY, type,
      duration: 0.1
    });
  }
  
  /**
   * Update visual effects
   */
  private updateVisualEffects(deltaTime: number): void {
    // Update muzzle flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const flash = this.muzzleFlashes[i];
      flash.duration -= deltaTime;
      flash.intensity = Math.max(0, flash.duration / 0.2);
      
      if (flash.duration <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }
    
    // Update beam effects
    for (let i = this.beamEffects.length - 1; i >= 0; i--) {
      const beam = this.beamEffects[i];
      beam.duration -= deltaTime;
      
      if (beam.duration <= 0) {
        this.beamEffects.splice(i, 1);
      }
    }
  }
  
  /**
   * Render weapon system visuals
   */
  public render(renderer: CanvasRenderer): void {
    // Render projectiles
    for (const projectile of this.projectiles.values()) {
      if (projectile.active) {
        this.renderProjectile(renderer, projectile);
      }
    }
    
    // Render beam effects
    for (const beam of this.beamEffects) {
      this.renderBeamEffect(renderer, beam);
    }
    
    // Render muzzle flashes
    for (const flash of this.muzzleFlashes) {
      this.renderMuzzleFlash(renderer, flash);
    }
    
    // Render weapon range indicators (when hovering/selecting)
    if (this.tower) {
      this.renderWeaponRanges(renderer);
    }
  }
  
  /**
   * Render individual projectile
   */
  private renderProjectile(renderer: CanvasRenderer, projectile: Projectile): void {
    let color = '#FFD700'; // Default bullet color
    let size = 3;
    
    switch (projectile.type) {
      case 'bullet':
        color = '#FFD700';
        size = 3;
        break;
      case 'shell':
        color = '#FF6600';
        size = 5;
        break;
      case 'plasma':
        color = '#9C27B0';
        size = 6;
        break;
    }
    
    renderer.drawCircle(projectile.x, projectile.y, size, {
      fillStyle: color,
      strokeStyle: '#FFFFFF',
      lineWidth: 1
    });
    
    // Trail effect for fast projectiles
    if (projectile.type === 'bullet' || projectile.type === 'plasma') {
      const trailLength = 10;
      const trailX = projectile.x - (projectile.velocityX / Math.abs(projectile.velocityX + projectile.velocityY)) * trailLength;
      const trailY = projectile.y - (projectile.velocityY / Math.abs(projectile.velocityX + projectile.velocityY)) * trailLength;
      
      renderer.drawLine(projectile.x, projectile.y, trailX, trailY, {
        strokeStyle: color,
        lineWidth: 2,
        alpha: 0.5
      });
    }
  }
  
  /**
   * Render beam effects
   */
  private renderBeamEffect(renderer: CanvasRenderer, beam: any): void {
    let color = '#00FFFF';
    let width = 2;
    
    switch (beam.type) {
      case 'laser':
        color = '#FF0000';
        width = 3;
        break;
      case 'lightning':
        color = '#FFFF00';
        width = 4;
        break;
      case 'electricity':
        color = '#00FFFF';
        width = 2;
        break;
    }
    
    const alpha = beam.duration / 0.1;
    
    renderer.drawLine(beam.fromX, beam.fromY, beam.toX, beam.toY, {
      strokeStyle: color,
      lineWidth: width,
      alpha: alpha
    });
    
    // Add glow effect
    renderer.drawLine(beam.fromX, beam.fromY, beam.toX, beam.toY, {
      strokeStyle: color,
      lineWidth: width * 2,
      alpha: alpha * 0.3
    });
  }
  
  /**
   * Render muzzle flash effects
   */
  private renderMuzzleFlash(renderer: CanvasRenderer, flash: any): void {
    let color = '#FFFF00';
    let size = 15;
    
    switch (flash.type) {
      case 'ballistic':
        color = '#FFFF00';
        size = 10;
        break;
      case 'energy':
        color = '#00FFFF';
        size = 12;
        break;
      case 'explosion':
        color = '#FF4444';
        size = 20;
        break;
      case 'energy_burst':
        color = '#9C27B0';
        size = 25;
        break;
    }
    
    const alpha = flash.intensity;
    const currentSize = size * flash.intensity;
    
    renderer.drawCircle(flash.x, flash.y, currentSize, {
      fillStyle: color,
      alpha: alpha * 0.7
    });
    
    // Outer glow
    renderer.drawCircle(flash.x, flash.y, currentSize * 1.5, {
      strokeStyle: color,
      lineWidth: 2,
      alpha: alpha * 0.3
    });
  }
  
  /**
   * Render weapon range indicators
   */
  private renderWeaponRanges(renderer: CanvasRenderer): void {
    if (!this.tower) return;
    
    for (const weapon of this.activeWeapons.values()) {
      renderer.drawCircle(this.tower.x, this.tower.y, weapon.range, {
        strokeStyle: weapon.type === 'ballistic' ? '#FFD700' : '#00FFFF',
        lineWidth: 1,
        alpha: 0.2
      });
    }
  }
  
  /**
   * Get weapon system statistics
   */
  public getStats(): TowerWeaponStats {
    return {
      activeWeapons: Array.from(this.activeWeapons.keys()),
      totalDamageDealt: this.totalDamageDealt,
      enemiesKilled: this.enemiesKilled,
      projectilesFired: this.projectilesFired,
      accuracy: this.projectilesFired > 0 ? (this.shotsHit / this.projectilesFired) * 100 : 0
    };
  }
  
  /**
   * Get available weapons
   */
  public getAvailableWeapons(): Map<string, WeaponConfig> {
    return new Map(this.weaponCatalog);
  }
  
  /**
   * Set targeting mode
   */
  public setTargetingMode(mode: TargetingMode): void {
    this.targetingMode = mode;
    console.log(`🎯 Targeting mode set to: ${mode}`);
  }
  
  /**
   * Reset system for new run
   */
  public reset(): void {
    this.projectiles.clear();
    this.muzzleFlashes = [];
    this.beamEffects = [];
    this.totalDamageDealt = 0;
    this.enemiesKilled = 0;
    this.projectilesFired = 0;
    this.shotsHit = 0;
    this.lastFireTimes.clear();
    
    console.log('🔫 Tower weapon system reset');
  }
  
  /**
   * Event subscription methods
   */
  public onEnemyKilled(callback: (enemy: Enemy, weapon: string) => void): void {
    this.onEnemyKilledCallbacks.push(callback);
  }
  
  public onProjectileHit(callback: (projectile: Projectile, enemy: Enemy) => void): void {
    this.onProjectileHitCallbacks.push(callback);
  }
  
  /**
   * Utility methods
   */
  private generateProjectileId(): string {
    return `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getProjectileType(weaponName: string): 'bullet' | 'shell' | 'laser' | 'plasma' | 'lightning' {
    if (weaponName.includes('Shell') || weaponName.includes('Artillery')) return 'shell';
    if (weaponName.includes('Plasma')) return 'plasma';
    if (weaponName.includes('Lightning')) return 'lightning';
    if (weaponName.includes('Laser')) return 'laser';
    return 'bullet';
  }
  
  /**
   * Debug information
   */
  public getDebugInfo(): {
    activeWeapons: number;
    projectiles: number;
    muzzleFlashes: number;
    beamEffects: number;
    targeting: string;
  } {
    return {
      activeWeapons: this.activeWeapons.size,
      projectiles: this.projectiles.size,
      muzzleFlashes: this.muzzleFlashes.length,
      beamEffects: this.beamEffects.length,
      targeting: this.targetingMode
    };
  }
}