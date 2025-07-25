// Wave Management System - Controls enemy wave spawning and difficulty progression
import { Enemy, EnemyData } from '../entities/Enemy.js';
import { EntityManager } from '../entities/EntityManager.js';

export interface WaveConfig {
  waveNumber: number;
  enemyCount: number;
  enemyTypes: Array<{
    type: string;
    count: number;
    health: number;
    speed: number;
    damage: number;
    reward: number;
  }>;
  spawnDelay: number; // Time between enemy spawns in seconds
  nextWaveDelay: number; // Time before next wave starts in seconds
}

export interface WaveStats {
  currentWave: number;
  enemiesRemaining: number;
  enemiesKilled: number;
  totalEnemiesInWave: number;
  timeUntilNextWave: number;
  waveInProgress: boolean;
}

export class WaveManager {
  private currentWave: number = 0;
  private enemiesInCurrentWave: number = 0;
  private enemiesKilledInWave: number = 0;
  private enemiesRemainingToSpawn: number = 0;
  private activeEnemies: Set<Enemy> = new Set();
  
  // Timing
  private timeSinceLastSpawn: number = 0;
  private timeUntilNextWave: number = 0;
  private waveInProgress: boolean = false;
  private spawningEnemies: boolean = false;
  private isPaused: boolean = false;
  
  // Wave configuration
  private baseEnemyCount: number = 4;
  private enemyCountIncrease: number = 2;
  private baseSpawnDelay: number = 1.5; // seconds
  private nextWaveDelay: number = 5.0; // seconds
  
  // Enemy spawn queue
  private spawnQueue: Array<{
    type: string;
    health: number;
    speed: number;
    damage: number;
    reward: number;
  }> = [];
  
  // Event callbacks
  private onWaveStartCallbacks: Array<(waveNumber: number) => void> = [];
  private onWaveCompleteCallbacks: Array<(waveNumber: number, enemiesKilled: number) => void> = [];
  private onEnemySpawnedCallbacks: Array<(enemy: Enemy, waveNumber: number) => void> = [];
  
  // Viewport information for enemy spawning
  private viewportWidth: number = 800;
  private viewportHeight: number = 600;
  
  constructor(private entityManager: EntityManager) {
    console.log('🌊 WaveManager initialized');
  }
  
  /**
   * Start the wave system
   */
  public startWaves(): void {
    this.currentWave = 0;
    this.startNextWave();
  }
  
  /**
   * Update wave logic
   */
  public update(deltaTime: number): void {
    // Don't update when paused
    if (this.isPaused) {
      return;
    }
    
    if (this.waveInProgress) {
      this.updateWaveSpawning(deltaTime);
      this.checkWaveCompletion();
    } else if (this.timeUntilNextWave > 0) {
      this.timeUntilNextWave -= deltaTime;
      if (this.timeUntilNextWave <= 0) {
        this.startNextWave();
      }
    }
  }
  
  /**
   * Start the next wave
   */
  private startNextWave(): void {
    this.currentWave++;
    const waveConfig = this.generateWaveConfig(this.currentWave);
    
    console.log(`🌊 Starting Wave ${this.currentWave} with ${waveConfig.enemyCount} enemies`);
    
    // Set up wave state
    this.enemiesInCurrentWave = waveConfig.enemyCount;
    this.enemiesKilledInWave = 0;
    this.enemiesRemainingToSpawn = waveConfig.enemyCount;
    this.waveInProgress = true;
    this.spawningEnemies = true;
    this.timeSinceLastSpawn = 0;
    this.timeUntilNextWave = 0;
    
    // Build spawn queue
    this.buildSpawnQueue(waveConfig);
    
    // Notify wave start
    for (const callback of this.onWaveStartCallbacks) {
      callback(this.currentWave);
    }
  }
  
  /**
   * Generate wave configuration based on wave number
   */
  private generateWaveConfig(waveNumber: number): WaveConfig {
    const enemyCount = this.baseEnemyCount + (waveNumber - 1) * this.enemyCountIncrease;
    const spawnDelay = Math.max(0.5, this.baseSpawnDelay - (waveNumber - 1) * 0.1);
    
    // Calculate enemy type distribution
    const enemyTypes = this.calculateEnemyDistribution(waveNumber, enemyCount);
    
    return {
      waveNumber,
      enemyCount,
      enemyTypes,
      spawnDelay,
      nextWaveDelay: this.nextWaveDelay
    };
  }
  
  /**
   * Calculate enemy type distribution for wave
   */
  private calculateEnemyDistribution(waveNumber: number, totalEnemies: number): Array<{
    type: string;
    count: number;
    health: number;
    speed: number;
    damage: number;
    reward: number;
  }> {
    const enemyTypes = [];
    
    // Base stats that scale with wave
    const healthMultiplier = 1 + (waveNumber - 1) * 0.2;
    const speedMultiplier = 1 + (waveNumber - 1) * 0.1;
    const damageMultiplier = 1 + (waveNumber - 1) * 0.15;
    const rewardMultiplier = 1 + (waveNumber - 1) * 0.3;
    
    if (waveNumber <= 2) {
      // Early waves: mostly basic enemies
      enemyTypes.push({
        type: 'basic',
        count: totalEnemies,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(100 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(10 * rewardMultiplier)
      });
    } else if (waveNumber <= 5) {
      // Mid waves: introduce fast enemies
      const fastCount = Math.ceil(totalEnemies * 0.3);
      const basicCount = totalEnemies - fastCount;
      
      enemyTypes.push({
        type: 'basic',
        count: basicCount,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(100 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(10 * rewardMultiplier)
      });
      
      enemyTypes.push({
        type: 'fast',
        count: fastCount,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(150 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(15 * rewardMultiplier)
      });
    } else if (waveNumber <= 10) {
      // Mid-late waves: introduce tank enemies and swarm
      let tankCount = Math.ceil(totalEnemies * 0.15);
      let fastCount = Math.ceil(totalEnemies * 0.25);
      let swarmCount = 0;
      let basicCount = totalEnemies - tankCount - fastCount;
      
      // Add swarm wave every 4 waves (4, 8, 12, etc)
      if (waveNumber % 4 === 0) {
        swarmCount = Math.ceil(totalEnemies * 0.2);
        basicCount = totalEnemies - tankCount - fastCount - swarmCount;
      }
      
      enemyTypes.push({
        type: 'basic',
        count: basicCount,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(100 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(10 * rewardMultiplier)
      });
      
      enemyTypes.push({
        type: 'fast',
        count: fastCount,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(150 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(15 * rewardMultiplier)
      });
      
      enemyTypes.push({
        type: 'tank',
        count: tankCount,
        health: Math.ceil(3 * healthMultiplier),
        speed: Math.ceil(60 * speedMultiplier),
        damage: Math.ceil(2 * damageMultiplier),
        reward: Math.ceil(25 * rewardMultiplier)
      });
      
      if (swarmCount > 0) {
        enemyTypes.push({
          type: 'swarm',
          count: swarmCount,
          health: Math.ceil(1 * healthMultiplier),
          speed: Math.ceil(120 * speedMultiplier),
          damage: Math.ceil(1 * damageMultiplier),
          reward: Math.ceil(8 * rewardMultiplier)
        });
      }
      
      // Boss every 10 waves
      if (waveNumber % 10 === 0) {
        enemyTypes.push({
          type: 'boss',
          count: 1,
          health: Math.ceil(10 * healthMultiplier),
          speed: Math.ceil(80 * speedMultiplier),
          damage: Math.ceil(3 * damageMultiplier),
          reward: Math.ceil(50 * rewardMultiplier)
        });
      }
    } else {
      // Late waves (15+): all enemy types including stealth
      let tankCount = Math.ceil(totalEnemies * 0.15);
      let fastCount = Math.ceil(totalEnemies * 0.2);
      let swarmCount = Math.ceil(totalEnemies * 0.15);
      let stealthCount = 0;
      let basicCount = totalEnemies - tankCount - fastCount - swarmCount;
      
      // Introduce stealth enemies at wave 15+
      if (waveNumber >= 15) {
        stealthCount = Math.ceil(totalEnemies * 0.1);
        basicCount = totalEnemies - tankCount - fastCount - swarmCount - stealthCount;
      }
      
      enemyTypes.push({
        type: 'basic',
        count: basicCount,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(100 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(10 * rewardMultiplier)
      });
      
      enemyTypes.push({
        type: 'fast',
        count: fastCount,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(150 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(15 * rewardMultiplier)
      });
      
      enemyTypes.push({
        type: 'tank',
        count: tankCount,
        health: Math.ceil(3 * healthMultiplier),
        speed: Math.ceil(60 * speedMultiplier),
        damage: Math.ceil(2 * damageMultiplier),
        reward: Math.ceil(25 * rewardMultiplier)
      });
      
      enemyTypes.push({
        type: 'swarm',
        count: swarmCount,
        health: Math.ceil(1 * healthMultiplier),
        speed: Math.ceil(120 * speedMultiplier),
        damage: Math.ceil(1 * damageMultiplier),
        reward: Math.ceil(8 * rewardMultiplier)
      });
      
      if (stealthCount > 0) {
        enemyTypes.push({
          type: 'stealth',
          count: stealthCount,
          health: Math.ceil(2 * healthMultiplier),
          speed: Math.ceil(130 * speedMultiplier),
          damage: Math.ceil(1 * damageMultiplier),
          reward: Math.ceil(20 * rewardMultiplier)
        });
      }
      
      // Boss every 10 waves
      if (waveNumber % 10 === 0) {
        enemyTypes.push({
          type: 'boss',
          count: 1,
          health: Math.ceil(10 * healthMultiplier),
          speed: Math.ceil(80 * speedMultiplier),
          damage: Math.ceil(3 * damageMultiplier),
          reward: Math.ceil(50 * rewardMultiplier)
        });
      }
      
      // Multiple bosses at very high waves
      if (waveNumber >= 20 && waveNumber % 5 === 0) {
        enemyTypes.push({
          type: 'boss',
          count: 1,
          health: Math.ceil(8 * healthMultiplier),
          speed: Math.ceil(90 * speedMultiplier),
          damage: Math.ceil(2 * damageMultiplier),
          reward: Math.ceil(40 * rewardMultiplier)
        });
      }
    }
    
    return enemyTypes;
  }
  
  /**
   * Build spawn queue from wave configuration
   */
  private buildSpawnQueue(waveConfig: WaveConfig): void {
    this.spawnQueue = [];
    
    // Add all enemies to queue
    for (const enemyType of waveConfig.enemyTypes) {
      for (let i = 0; i < enemyType.count; i++) {
        this.spawnQueue.push({
          type: enemyType.type,
          health: enemyType.health,
          speed: enemyType.speed,
          damage: enemyType.damage,
          reward: enemyType.reward
        });
      }
    }
    
    // Shuffle the queue for variety
    this.shuffleArray(this.spawnQueue);
    
    console.log(`🌊 Built spawn queue with ${this.spawnQueue.length} enemies`);
  }
  
  /**
   * Update wave spawning logic
   */
  private updateWaveSpawning(deltaTime: number): void {
    if (!this.spawningEnemies || this.spawnQueue.length === 0) {
      this.spawningEnemies = false;
      return;
    }
    
    this.timeSinceLastSpawn += deltaTime;
    const spawnDelay = Math.max(0.5, this.baseSpawnDelay - (this.currentWave - 1) * 0.05);
    
    if (this.timeSinceLastSpawn >= spawnDelay) {
      this.spawnNextEnemy();
      this.timeSinceLastSpawn = 0;
    }
  }
  
  /**
   * Spawn the next enemy from the queue
   */
  private spawnNextEnemy(): void {
    if (this.spawnQueue.length === 0) {
      this.spawningEnemies = false;
      return;
    }
    
    const enemyData = this.spawnQueue.shift()!;
    
    // Base enemy data
    const baseEnemyData: EnemyData = {
      type: 'enemy',
      enemyType: enemyData.type,
      x: 0, // Will be set by Enemy.spawnAtEdge()
      y: 0,
      health: enemyData.health,
      speed: enemyData.speed,
      damage: enemyData.damage,
      reward: enemyData.reward,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight
    };
    
    // Add type-specific properties
    if (enemyData.type === 'boss') {
      baseEnemyData.spawnRate = 5; // Spawn minion every 5 seconds
      baseEnemyData.spawnCooldown = 5;
    } else if (enemyData.type === 'swarm') {
      // Generate unique swarm ID for this spawn
      baseEnemyData.swarmId = `swarm_${this.currentWave}_${Date.now()}`;
      baseEnemyData.swarmCount = 4; // Group of 4 swarm enemies
    } else if (enemyData.type === 'stealth') {
      baseEnemyData.stealthCycle = 6; // 6 second cycle
      baseEnemyData.stealthDuration = 2; // 2 seconds invisible
    }
    
    const enemy = this.entityManager.createEntity<Enemy>('enemy', baseEnemyData);
    
    // Track this enemy
    this.activeEnemies.add(enemy);
    this.enemiesRemainingToSpawn--;
    
    // Set up enemy destruction callback
    enemy.onDestroyed(() => {
      this.onEnemyDestroyed(enemy);
    });
    
    // Notify enemy spawned
    for (const callback of this.onEnemySpawnedCallbacks) {
      callback(enemy, this.currentWave);
    }
    
    console.log(`👹 Spawned ${enemyData.type} enemy (${this.spawnQueue.length} remaining in queue)`);
  }
  
  /**
   * Handle enemy destruction
   */
  private onEnemyDestroyed(enemy: Enemy): void {
    if (this.activeEnemies.has(enemy)) {
      this.activeEnemies.delete(enemy);
      this.enemiesKilledInWave++;
      console.log(`💀 Enemy ${enemy.id} destroyed (${this.activeEnemies.size} active, ${this.enemiesKilledInWave}/${this.enemiesInCurrentWave} killed)`);
    } else {
      console.warn(`⚠️ Enemy ${enemy.id} destroyed but was not in activeEnemies tracking!`);
    }
  }
  
  /**
   * Check if current wave is complete
   */
  private checkWaveCompletion(): void {
    // Wave is complete when all enemies are spawned and all active enemies are destroyed
    const allEnemiesSpawned = this.spawnQueue.length === 0 && !this.spawningEnemies;
    const allEnemiesDestroyed = this.activeEnemies.size === 0;
    
    if (allEnemiesSpawned && allEnemiesDestroyed) {
      this.completeWave();
    }
  }
  
  /**
   * Complete the current wave
   */
  private completeWave(): void {
    console.log(`✅ Wave ${this.currentWave} completed! Killed ${this.enemiesKilledInWave}/${this.enemiesInCurrentWave} enemies`);
    
    this.waveInProgress = false;
    this.timeUntilNextWave = this.nextWaveDelay;
    
    // Notify wave complete
    for (const callback of this.onWaveCompleteCallbacks) {
      callback(this.currentWave, this.enemiesKilledInWave);
    }
  }
  
  /**
   * Get current wave statistics
   */
  public getWaveStats(): WaveStats {
    return {
      currentWave: this.currentWave,
      enemiesRemaining: this.activeEnemies.size,
      enemiesKilled: this.enemiesKilledInWave,
      totalEnemiesInWave: this.enemiesInCurrentWave,
      timeUntilNextWave: this.timeUntilNextWave,
      waveInProgress: this.waveInProgress
    };
  }
  
  /**
   * Force start next wave (for testing)
   */
  public forceNextWave(): void {
    if (!this.waveInProgress) {
      this.timeUntilNextWave = 0;
    }
  }
  
  /**
   * Stop all waves
   */
  public stopWaves(): void {
    this.waveInProgress = false;
    this.spawningEnemies = false;
    this.spawnQueue = [];
    this.activeEnemies.clear();
    this.timeUntilNextWave = 0;
    console.log('🛑 Wave system stopped');
  }
  
  /**
   * Event subscription methods
   */
  public onWaveStart(callback: (waveNumber: number) => void): void {
    this.onWaveStartCallbacks.push(callback);
  }
  
  public onWaveComplete(callback: (waveNumber: number, enemiesKilled: number) => void): void {
    this.onWaveCompleteCallbacks.push(callback);
  }
  
  public onEnemySpawned(callback: (enemy: Enemy, waveNumber: number) => void): void {
    this.onEnemySpawnedCallbacks.push(callback);
  }
  
  /**
   * Utility method to shuffle array
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * Pause wave system (for pause state)
   */
  public pause(): void {
    this.isPaused = true;
    console.log('⏸️ Wave system paused');
  }
  
  /**
   * Resume wave system (from pause state)
   */
  public resume(): void {
    this.isPaused = false;
    console.log('▶️ Wave system resumed');
  }
  
  /**
   * Check if wave system is paused
   */
  public isPausedState(): boolean {
    return this.isPaused;
  }
  
  /**
   * Set viewport dimensions for proper enemy spawning
   */
  public setViewportDimensions(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    console.log(`🌊 WaveManager viewport updated: ${width}x${height}`);
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): {
    currentWave: number;
    activeEnemies: number;
    queueLength: number;
    waveInProgress: boolean;
    spawningEnemies: boolean;
    timeUntilNextWave: number;
    isPaused: boolean;
  } {
    return {
      currentWave: this.currentWave,
      activeEnemies: this.activeEnemies.size,
      queueLength: this.spawnQueue.length,
      waveInProgress: this.waveInProgress,
      spawningEnemies: this.spawningEnemies,
      timeUntilNextWave: this.timeUntilNextWave,
      isPaused: this.isPaused
    };
  }
}