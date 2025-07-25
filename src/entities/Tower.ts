// Tower Entity - Central defensive structure that players must protect
import { Entity, EntityData } from './Entity.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';

export interface TowerData extends EntityData {
  type: 'tower';
}

export interface TowerStats {
  maxHealth: number;
  currentHealth: number;
  damageStages: number;
  radius: number;
  repairCost: number;
}

export class Tower extends Entity {
  private damageStage: number = 0;
  private lastDamageTime: number = 0;
  private repairCost: number = 50;
  
  // Visual effects
  private damageFlashIntensity: number = 0;
  private pulsePhase: number = 0;
  private shieldRadius: number = 0;
  private shieldActive: boolean = false;
  
  // Tower abilities (for future expansion)
  private abilities: string[] = [];
  private experience: number = 0;
  private level: number = 1;
  
  constructor(data: TowerData) {
    // Tower is always at center (0, 0) with 3 HP and radius 30
    super({
      ...data,
      type: 'tower', // Ensure type is explicitly set
      x: 0,
      y: 0,
      health: 3,
      maxHealth: 3,
      radius: 30
    });
    
    this.updateDamageStage();
    console.log(`🏰 Tower created at center with 3 HP - Type: ${this.type}, Health: ${this.health}/${this.maxHealth}`);
  }
  
  protected onUpdate(deltaTime: number): void {
    // Debug health check - log if health is unexpectedly low
    if (this.health < this.maxHealth && this.age < 5) {
      console.warn(`⚠️ Tower health is ${this.health}/${this.maxHealth} but tower is only ${this.age.toFixed(1)}s old!`);
    }
    
    // Update visual effects
    this.updateVisualEffects(deltaTime);
    
    // Update damage stage based on health
    this.updateDamageStage();
    
    // Update shield effects if active
    if (this.shieldActive) {
      this.updateShieldEffect(deltaTime);
    }
    
    // Heal over time if not at full health (very slow regeneration)
    if (this.health < this.maxHealth && this.age > 10) { // Only after 10 seconds
      const healInterval = 30; // Heal every 30 seconds
      const timeSinceLastDamage = (performance.now() - this.lastDamageTime) / 1000;
      
      if (timeSinceLastDamage > healInterval) {
        this.heal(1);
        this.lastDamageTime = performance.now(); // Reset timer
        console.log('🏰 Tower regenerated 1 HP');
      }
    }
  }
  
  protected onRender(renderer: CanvasRenderer, x: number, y: number): void {
    this.renderTowerBase(renderer, x, y);
    this.renderHealthIndicator(renderer, x, y);
    this.renderDamageEffects(renderer, x, y);
    this.renderShield(renderer, x, y);
    this.renderTowerDetails(renderer, x, y);
  }
  
  protected onDestroy(): void {
    console.log('💀 Tower destroyed! Game Over!');
    // Tower destruction triggers game over
  }
  
  protected onReset(_data: EntityData): void {
    // Reset tower to initial state
    this.damageStage = 0;
    this.lastDamageTime = 0;
    this.damageFlashIntensity = 0;
    this.pulsePhase = 0;
    this.shieldRadius = 0;
    this.shieldActive = false;
    this.abilities = [];
    this.experience = 0;
    this.level = 1;
    
    this.updateDamageStage();
    console.log('🏰 Tower reset to initial state');
  }
  
  /**
   * Override takeDamage to add tower-specific behavior
   */
  public takeDamage(damage: number, source?: Entity): boolean {
    if (!this.active || this.health <= 0) {
      console.warn(`⚠️ Tower takeDamage called but tower is inactive or dead! active: ${this.active}, health: ${this.health}`);
      return false;
    }
    
    // Log detailed damage information
    const sourceInfo = source ? `${source.constructor.name} ${source.id} (active: ${source.active}, health: ${source.health})` : 'unknown';
    console.log(`🏰 Tower taking ${damage} damage from ${sourceInfo}. Current health: ${this.health}/${this.maxHealth}`);
    
    // Add damage flash effect
    this.damageFlashIntensity = 1.0;
    this.lastDamageTime = performance.now();
    
    const died = super.takeDamage(damage, source);
    
    if (died) {
      console.error('💀 TOWER DESTROYED! GAME OVER!');
    } else {
      console.log(`🏰 Tower health after damage: ${this.health}/${this.maxHealth}`);
    }
    
    return died;
  }
  
  /**
   * Repair the tower (costs resources)
   */
  public repair(amount: number = 1): { success: boolean; cost: number } {
    if (this.health >= this.maxHealth) {
      return { success: false, cost: 0 };
    }
    
    const actualRepairAmount = Math.min(amount, this.maxHealth - this.health);
    const totalCost = actualRepairAmount * this.repairCost;
    
    this.heal(actualRepairAmount);
    
    // Add repair visual effect
    this.shieldActive = true;
    this.shieldRadius = this.radius + 10;
    
    console.log(`🔧 Tower repaired ${actualRepairAmount} HP for ${totalCost} coins`);
    
    return { success: true, cost: totalCost };
  }
  
  /**
   * Upgrade tower (increases max health or adds abilities)
   */
  public upgrade(upgradeType: 'health' | 'ability', abilityName?: string): boolean {
    if (upgradeType === 'health') {
      this.maxHealth += 1;
      this.heal(1); // Also heal to the new max
      console.log(`⬆️ Tower max health increased to ${this.maxHealth}`);
      return true;
    } else if (upgradeType === 'ability' && abilityName) {
      if (!this.abilities.includes(abilityName)) {
        this.abilities.push(abilityName);
        console.log(`⚡ Tower gained ability: ${abilityName}`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Add experience and level up
   */
  public addExperience(exp: number): boolean {
    this.experience += exp;
    const expNeededForNextLevel = this.level * 100;
    
    if (this.experience >= expNeededForNextLevel) {
      this.level++;
      this.experience = 0;
      console.log(`🌟 Tower leveled up to ${this.level}!`);
      return true; // Leveled up
    }
    
    return false; // No level up
  }
  
  /**
   * Update damage stage based on health percentage
   */
  private updateDamageStage(): void {
    const healthPercent = this.getHealthPercent();
    
    if (healthPercent > 0.66) {
      this.damageStage = 0; // Pristine condition
    } else if (healthPercent > 0.33) {
      this.damageStage = 1; // Light damage
    } else if (healthPercent > 0) {
      this.damageStage = 2; // Heavy damage
    } else {
      this.damageStage = 3; // Destroyed
    }
  }
  
  /**
   * Update visual effects over time
   */
  private updateVisualEffects(deltaTime: number): void {
    // Update damage flash
    if (this.damageFlashIntensity > 0) {
      const flashDecay = 3.0; // Flash fades over time
      this.damageFlashIntensity = Math.max(0, this.damageFlashIntensity - flashDecay * deltaTime);
    }
    
    // Update pulse animation for low health
    if (this.getHealthPercent() <= 0.33) {
      this.pulsePhase += deltaTime * 4; // Pulse faster when damaged
    } else {
      this.pulsePhase += deltaTime * 2; // Normal pulse
    }
  }
  
  /**
   * Update shield visual effect
   */
  private updateShieldEffect(deltaTime: number): void {
    if (this.shieldActive) {
      this.shieldRadius += 50 * deltaTime; // Expand shield
      
      if (this.shieldRadius > this.radius + 30) {
        this.shieldActive = false;
        this.shieldRadius = 0;
      }
    }
  }
  
  /**
   * Render the main tower structure
   */
  private renderTowerBase(renderer: CanvasRenderer, x: number, y: number): void {
    const healthPercent = this.getHealthPercent();
    
    // Base tower color changes with damage
    let towerColor = '#4CAF50'; // Green when healthy
    if (healthPercent <= 0.66) towerColor = '#FF9800'; // Orange when damaged
    if (healthPercent <= 0.33) towerColor = '#F44336'; // Red when heavily damaged
    
    // Add damage flash effect
    if (this.damageFlashIntensity > 0) {
      const flashColor = `rgba(255, 255, 255, ${this.damageFlashIntensity * 0.7})`;
      renderer.drawCircle(x, y, this.radius + 5, {
        fillStyle: flashColor
      });
    }
    
    // Main tower body
    renderer.drawCircle(x, y, this.radius, {
      fillStyle: towerColor,
      strokeStyle: '#2E7D32',
      lineWidth: 3
    });
    
    // Tower center core
    const coreRadius = this.radius * 0.4;
    renderer.drawCircle(x, y, coreRadius, {
      fillStyle: '#1B5E20',
      strokeStyle: '#388E3C',
      lineWidth: 2
    });
    
    // Damage cracks based on damage stage
    if (this.damageStage >= 1) {
      this.renderDamageCracks(renderer, x, y);
    }
    
    // Pulse effect for low health
    if (healthPercent <= 0.33) {
      const pulseAlpha = (Math.sin(this.pulsePhase) + 1) * 0.3;
      const pulseRadius = this.radius + Math.sin(this.pulsePhase) * 5;
      
      renderer.drawCircle(x, y, pulseRadius, {
        strokeStyle: '#F44336',
        lineWidth: 2,
        alpha: pulseAlpha
      });
    }
  }
  
  /**
   * Render health indicator above tower
   */
  private renderHealthIndicator(renderer: CanvasRenderer, x: number, y: number): void {
    const barWidth = 60;
    const barHeight = 8;
    const barY = y - this.radius - 20;
    
    // Background bar
    renderer.drawRectangle(x - barWidth/2, barY, barWidth, barHeight, {
      fillStyle: '#333333',
      strokeStyle: '#000000',
      lineWidth: 1
    });
    
    // Health bar
    const healthPercent = this.getHealthPercent();
    const healthWidth = barWidth * healthPercent;
    
    let healthColor = '#4CAF50';
    if (healthPercent <= 0.66) healthColor = '#FF9800';
    if (healthPercent <= 0.33) healthColor = '#F44336';
    
    if (healthWidth > 0) {
      renderer.drawRectangle(x - barWidth/2, barY, healthWidth, barHeight, {
        fillStyle: healthColor
      });
    }
    
    // Health text
    renderer.drawText(`${this.health}/${this.maxHealth}`, x, barY - 5, {
      fillStyle: '#FFFFFF',
      font: '12px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render damage effects and cracks
   */
  private renderDamageCracks(renderer: CanvasRenderer, x: number, y: number): void {
    const ctx = renderer.getContext();
    ctx.save();
    
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    
    if (this.damageStage >= 1) {
      // Light damage - few cracks
      ctx.beginPath();
      ctx.moveTo(x - 15, y - 10);
      ctx.lineTo(x - 5, y + 5);
      ctx.moveTo(x + 10, y - 15);
      ctx.lineTo(x + 5, y - 5);
      ctx.stroke();
    }
    
    if (this.damageStage >= 2) {
      // Heavy damage - more cracks
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x - 10, y + 10);
      ctx.moveTo(x + 15, y + 10);
      ctx.lineTo(x + 8, y + 18);
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x - 5, y - 10);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Render damage flash and other effects
   */
  private renderDamageEffects(_renderer: CanvasRenderer, _x: number, _y: number): void {
    // This is handled in renderTowerBase with the flash effect
  }
  
  /**
   * Render shield effect when active
   */
  private renderShield(renderer: CanvasRenderer, x: number, y: number): void {
    if (this.shieldActive && this.shieldRadius > 0) {
      const alpha = 1 - (this.shieldRadius - this.radius) / 30;
      
      renderer.drawCircle(x, y, this.shieldRadius, {
        strokeStyle: '#00BCD4',
        lineWidth: 3,
        alpha: alpha * 0.8
      });
      
      // Inner shield glow
      renderer.drawCircle(x, y, this.shieldRadius * 0.9, {
        strokeStyle: '#4DD0E1',
        lineWidth: 1,
        alpha: alpha * 0.5
      });
    }
  }
  
  /**
   * Render tower level and other details
   */
  private renderTowerDetails(renderer: CanvasRenderer, x: number, y: number): void {
    // Tower level indicator
    if (this.level > 1) {
      renderer.drawText(`LV ${this.level}`, x, y + this.radius + 15, {
        fillStyle: '#FFD700',
        font: 'bold 10px Arial',
        textAlign: 'center'
      });
    }
    
    // Ability indicators
    if (this.abilities.length > 0) {
      const abilityY = y + this.radius + (this.level > 1 ? 30 : 20);
      renderer.drawText(`⚡${this.abilities.length}`, x, abilityY, {
        fillStyle: '#9C27B0',
        font: '10px Arial',
        textAlign: 'center'
      });
    }
    
    // Center label
    renderer.drawText('TOWER', x, y + 5, {
      fillStyle: '#FFFFFF',
      font: 'bold 8px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Get tower statistics
   */
  public getStats(): TowerStats {
    return {
      maxHealth: this.maxHealth,
      currentHealth: this.health,
      damageStages: this.damageStage,
      radius: this.radius,
      repairCost: this.repairCost
    };
  }
  
  /**
   * Get tower abilities
   */
  public getAbilities(): string[] {
    return [...this.abilities];
  }
  
  /**
   * Check if tower has specific ability
   */
  public hasAbility(abilityName: string): boolean {
    return this.abilities.includes(abilityName);
  }
  
  /**
   * Get tower level and experience
   */
  public getLevelInfo(): { level: number; experience: number; expToNext: number } {
    return {
      level: this.level,
      experience: this.experience,
      expToNext: this.level * 100 - this.experience
    };
  }
  
  /**
   * Get current damage stage
   */
  public getDamageStage(): number {
    return this.damageStage;
  }
  
  /**
   * Check if tower is critically damaged
   */
  public isCriticallyDamaged(): boolean {
    return this.getHealthPercent() <= 0.33;
  }
  
  /**
   * Check if tower needs repair
   */
  public needsRepair(): boolean {
    return this.health < this.maxHealth;
  }
}