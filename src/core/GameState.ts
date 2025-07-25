// Game State Management System - State machine for different game screens

import { CanvasRenderer } from './CanvasRenderer.js';
import { ClickDetection } from './ClickDetection.js';
import { EntityManager } from '../entities/EntityManager.js';
import { Tower, TowerData } from '../entities/Tower.js';
import { Enemy, EnemyData } from '../entities/Enemy.js';
import { WaveManager } from '../systems/WaveManager.js';
import { CurrencySystem } from '../systems/CurrencySystem.js';
import { TowerWeaponSystem } from '../systems/TowerWeaponSystem.js';

export enum GameStateType {
  MAIN_MENU = 'main_menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  SKILL_TREE = 'skill_tree',
  SETTINGS = 'settings'
}

export interface GameStateData {
  [key: string]: any;
}

export abstract class GameState {
  protected type: GameStateType;
  protected data: GameStateData = {};
  
  constructor(type: GameStateType) {
    this.type = type;
  }
  
  /**
   * Called when entering this state
   */
  public abstract onEnter(data?: GameStateData): void;
  
  /**
   * Called when leaving this state
   */
  public abstract onExit(): GameStateData;
  
  /**
   * Update game logic for this state
   */
  public abstract update(deltaTime: number): void;
  
  /**
   * Render graphics for this state
   */
  public abstract render(renderer: CanvasRenderer): void;
  
  /**
   * Handle input events for this state
   */
  public abstract handleInput(event: InputEvent): void;
  
  /**
   * Get the state type
   */
  public getType(): GameStateType {
    return this.type;
  }
  
  /**
   * Get state data
   */
  public getData(): GameStateData {
    return this.data;
  }
  
  /**
   * Set state data
   */
  public setData(data: GameStateData): void {
    this.data = { ...this.data, ...data };
  }
}

export interface InputEvent {
  type: 'click' | 'keydown' | 'keyup' | 'mousemove';
  x?: number;
  y?: number;
  key?: string;
  button?: number;
}

export class GameStateManager {
  private currentState: GameState | null = null;
  private states: Map<GameStateType, GameState> = new Map();
  private stateHistory: GameStateType[] = [];
  private transitionData: GameStateData | null = null;
  
  constructor() {
    console.log('🎮 GameStateManager initialized');
  }
  
  /**
   * Register a state
   */
  public registerState(state: GameState): void {
    this.states.set(state.getType(), state);
    console.log(`📌 Registered state: ${state.getType()}`);
  }
  
  /**
   * Switch to a new state
   */
  public changeState(stateType: GameStateType, data?: GameStateData): void {
    const newState = this.states.get(stateType);
    
    if (!newState) {
      console.error(`❌ State not found: ${stateType}`);
      return;
    }
    
    // Exit current state and save data
    if (this.currentState) {
      console.log(`🚪 Exiting state: ${this.currentState.getType()}`);
      this.transitionData = this.currentState.onExit();
      this.stateHistory.push(this.currentState.getType());
      
      // Keep history limited
      if (this.stateHistory.length > 10) {
        this.stateHistory.shift();
      }
    }
    
    // Enter new state
    console.log(`🚪 Entering state: ${stateType}`);
    this.currentState = newState;
    
    // Merge transition data with provided data
    const enterData = data ? { ...this.transitionData, ...data } : this.transitionData;
    this.currentState.onEnter(enterData || undefined);
    
    this.transitionData = null;
  }
  
  /**
   * Go back to previous state
   */
  public goBack(data?: GameStateData): void {
    if (this.stateHistory.length === 0) {
      console.warn('⚠️ No previous state to go back to');
      return;
    }
    
    const previousState = this.stateHistory.pop()!;
    this.changeState(previousState, data);
  }
  
  /**
   * Update current state
   */
  public update(deltaTime: number): void {
    if (this.currentState) {
      this.currentState.update(deltaTime);
    }
  }
  
  /**
   * Render current state
   */
  public render(renderer: CanvasRenderer): void {
    if (this.currentState) {
      this.currentState.render(renderer);
    }
  }
  
  /**
   * Handle input for current state
   */
  public handleInput(event: InputEvent): void {
    if (this.currentState) {
      this.currentState.handleInput(event);
    }
  }
  
  /**
   * Get current state
   */
  public getCurrentState(): GameState | null {
    return this.currentState;
  }
  
  /**
   * Get current state type
   */
  public getCurrentStateType(): GameStateType | null {
    return this.currentState ? this.currentState.getType() : null;
  }
  
  /**
   * Check if a specific state is current
   */
  public isCurrentState(stateType: GameStateType): boolean {
    return this.getCurrentStateType() === stateType;
  }
  
  /**
   * Get state history
   */
  public getStateHistory(): GameStateType[] {
    return [...this.stateHistory];
  }
}

// Example state implementations

export class MainMenuState extends GameState {
  private menuOptions: string[] = ['Play', 'Skill Tree', 'Settings'];
  private selectedOption: number = 0;
  private stateManager: GameStateManager | null = null;
  
  constructor() {
    super(GameStateType.MAIN_MENU);
  }
  
  /**
   * Set state manager reference (called by Game class)
   */
  public setStateManager(stateManager: GameStateManager): void {
    this.stateManager = stateManager;
  }
  
  public onEnter(data?: GameStateData): void {
    console.log('📱 Entered Main Menu');
    this.selectedOption = 0;
    if (data) {
      this.setData(data);
    }
  }
  
  public onExit(): GameStateData {
    console.log('📱 Exited Main Menu');
    return this.getData();
  }
  
  public update(deltaTime: number): void {
    // Menu doesn't need updates, but we could add animations here
    if (deltaTime > 0) {
      // Simple animation placeholder
    }
  }
  
  public render(renderer: CanvasRenderer): void {
    const viewport = renderer.getViewport();
    
    // Background
    renderer.clear('#1a1a2e');
    
    // Title
    renderer.drawScreenText('🏰 Tower Guardian', viewport.width / 2, 100, {
      fillStyle: '#FFFFFF',
      font: 'bold 48px Arial',
      textAlign: 'center'
    });
    
    renderer.drawScreenText('Hybrid Roguelite Tower Defense', viewport.width / 2, 160, {
      fillStyle: '#CCCCCC',
      font: '20px Arial',
      textAlign: 'center'
    });
    
    // Menu options
    const menuStartY = 250;
    const menuSpacing = 60;
    
    this.menuOptions.forEach((option, index) => {
      const y = menuStartY + index * menuSpacing;
      const isSelected = index === this.selectedOption;
      
      renderer.drawScreenText(option, viewport.width / 2, y, {
        fillStyle: isSelected ? '#FFD700' : '#FFFFFF',
        font: isSelected ? 'bold 24px Arial' : '24px Arial',
        textAlign: 'center'
      });
      
      if (isSelected) {
        // Selection indicator
        renderer.drawScreenText('▶', viewport.width / 2 - 100, y, {
          fillStyle: '#FFD700',
          font: '24px Arial',
          textAlign: 'center'
        });
      }
    });
    
    // Instructions
    renderer.drawScreenText('Click or use arrow keys to navigate', viewport.width / 2, viewport.height - 50, {
      fillStyle: '#888888',
      font: '16px Arial',
      textAlign: 'center'
    });
  }
  
  public handleInput(event: InputEvent): void {
    if (event.type === 'click') {
      // Handle menu selection based on current selected option
      this.selectCurrentOption();
    } else if (event.type === 'keydown') {
      switch (event.key) {
        case 'ArrowUp':
          this.selectedOption = Math.max(0, this.selectedOption - 1);
          break;
        case 'ArrowDown':
          this.selectedOption = Math.min(this.menuOptions.length - 1, this.selectedOption + 1);
          break;
        case 'Enter':
          this.selectCurrentOption();
          break;
      }
    }
  }

  /**
   * Handle menu option selection
   */
  private selectCurrentOption(): void {
    const option = this.menuOptions[this.selectedOption];
    console.log(`Selected: ${option}`);
    
    // Handle menu selection with state manager integration
    if (option === 'Play') {
      console.log('🎮 Starting game');
      this.stateManager?.changeState(GameStateType.PLAYING);
    } else if (option === 'Skill Tree') {
      console.log('🌳 Opening skill tree');
      this.stateManager?.changeState(GameStateType.SKILL_TREE);
    } else if (option === 'Settings') {
      console.log('⚙️ Opening settings');
      this.stateManager?.changeState(GameStateType.SETTINGS);
    }
  }
}

export class PlayingState extends GameState {
  private gameTime: number = 0;
  private clickDetection: ClickDetection;
  private entityManager: EntityManager;
  private waveManager: WaveManager;
  private currencySystem: CurrencySystem;
  private towerWeaponSystem: TowerWeaponSystem;
  private tower: Tower | null = null;
  private score: number = 0;
  private stateManager: GameStateManager | null = null;
  
  constructor() {
    super(GameStateType.PLAYING);
    this.clickDetection = new ClickDetection();
    this.entityManager = new EntityManager();
    this.waveManager = new WaveManager(this.entityManager);
    this.currencySystem = new CurrencySystem();
    this.towerWeaponSystem = new TowerWeaponSystem();
    
    // Register Tower factory
    this.entityManager.registerFactory('tower', (data) => new Tower(data as TowerData), {
      initialSize: 1,
      maxSize: 1
    });
    
    // Register Enemy factory
    this.entityManager.registerFactory('enemy', (data) => new Enemy(data as EnemyData), {
      initialSize: 10,
      maxSize: 50
    });
    
    // Set up wave manager events
    this.setupWaveEvents();
  }
  
  public onEnter(data?: GameStateData): void {
    console.log('🎮 Entered Playing State');
    
    // Check if we're resuming from pause
    const isResuming = data && data.pausedFromState === GameStateType.PLAYING;
    
    if (isResuming) {
      // Restore game state from pause data
      this.gameTime = data.gameTime || 0;
      this.score = data.score || 0;
      console.log('▶️ Resuming game from pause');
      
      // Resume wave manager
      this.waveManager.resume();
    } else {
      // Fresh game start
      this.gameTime = 0;
      this.score = 0;
      
      // Reset currency run stats
      this.currencySystem.resetRunStats();
      
      // Reset tower weapon system
      this.towerWeaponSystem.reset();
      
      // Create the tower at center
      this.tower = this.entityManager.createEntity<Tower>('tower', {
        type: 'tower',
        x: 0,
        y: 0
      } as TowerData);
      
      // Set up tower event handlers
      if (this.tower) {
        this.tower.onDestroyed(() => {
          console.log('💀 TOWER DESTROYED! GAME OVER!');
          // Trigger game over state transition
          this.triggerGameOver();
        });
        
        // Connect tower to weapon system
        this.towerWeaponSystem.setTower(this.tower);
      }
      
      // Clear click detection and start wave system
      this.clickDetection.clearClickables();
      this.waveManager.startWaves();
      
      // Set up currency system event handlers
      this.setupCurrencyEvents();
      
      // Set up tower weapon system event handlers
      this.setupTowerWeaponEvents();
      
      // Activate basic weapons for testing (will be controlled by skill tree later)
      this.towerWeaponSystem.activateWeapon('basic_turret');
    }
    
    if (data) {
      this.setData(data);
    }
  }
  
  public onExit(): GameStateData {
    console.log('🎮 Exited Playing State');
    return { ...this.getData(), gameTime: this.gameTime, score: this.score };
  }
  
  public update(deltaTime: number): void {
    this.gameTime += deltaTime;
    
    // Update wave manager
    this.waveManager.update(deltaTime);
    
    // Update currency system
    this.currencySystem.update(deltaTime);
    
    // Update tower weapon system with current enemies (with additional validation)
    const allEnemies = this.entityManager.getEntitiesByType<Enemy>('enemy');
    const validEnemies = allEnemies.filter(enemy => enemy && enemy.active && enemy.health > 0);
    
    if (allEnemies.length !== validEnemies.length) {
      console.warn(`⚠️ PlayingState filtered ${allEnemies.length - validEnemies.length} invalid enemies from entity manager`);
    }
    
    this.towerWeaponSystem.update(deltaTime, validEnemies);
    
    // Update all entities through entity manager
    this.entityManager.update(deltaTime);
    
    // Synchronize clickable positions with entity positions
    this.synchronizeClickablePositions();
    
    // Update click detection system
    this.clickDetection.update(deltaTime);
  }
  
  public render(renderer: CanvasRenderer): void {
    const viewport = renderer.getViewport();
    
    // Background
    renderer.clear('#0f0f23');
    
    // Game UI
    const waveStats = this.waveManager.getWaveStats();
    
    renderer.drawScreenText(`🏰 WAVE ${waveStats.currentWave}`, viewport.width / 2, 30, {
      fillStyle: '#FFD700',
      font: 'bold 24px Arial',
      textAlign: 'center'
    });
    
    // Show wave progress or next wave countdown with currency
    const currencyStats = this.currencySystem.getStats();
    if (waveStats.waveInProgress) {
      renderer.drawScreenText(`Enemies: ${waveStats.enemiesRemaining} | Score: ${this.score} | Coins: ${currencyStats.totalCoins}`, viewport.width / 2, 60, {
        fillStyle: '#CCCCCC',
        font: '16px Arial',
        textAlign: 'center'
      });
    } else if (waveStats.timeUntilNextWave > 0) {
      renderer.drawScreenText(`Next wave in: ${waveStats.timeUntilNextWave.toFixed(1)}s | Score: ${this.score} | Coins: ${currencyStats.totalCoins}`, viewport.width / 2, 60, {
        fillStyle: '#FF9800',
        font: '16px Arial',
        textAlign: 'center'
      });
    }
    
    // Render all entities through entity manager
    this.entityManager.render(renderer);
    
    // Render tower weapon system (projectiles, beams, effects)
    this.towerWeaponSystem.render(renderer);
    
    // Render currency system (coins and effects)
    this.currencySystem.render(renderer);
    
    // Render click detection effects (hover indicators, click effects)
    this.clickDetection.render(renderer);
    
    // Tower health info in top-left
    if (this.tower) {
      const stats = this.tower.getStats();
      renderer.drawScreenText(`Tower HP: ${stats.currentHealth}/${stats.maxHealth}`, 10, viewport.height - 60, {
        fillStyle: stats.currentHealth <= 1 ? '#F44336' : '#4CAF50',
        font: 'bold 16px Arial',
        textAlign: 'left'
      });
      
      if (this.tower.isCriticallyDamaged()) {
        renderer.drawScreenText('⚠️ TOWER CRITICAL!', viewport.width / 2, 90, {
          fillStyle: '#F44336',
          font: 'bold 18px Arial',
          textAlign: 'center'
        });
      }
    }
    
    // Instructions
    renderer.drawScreenText('ESC: Menu | Click enemies to destroy them!', viewport.width / 2, viewport.height - 30, {
      fillStyle: '#888888',
      font: '14px Arial',
      textAlign: 'center'
    });
  }
  
  public handleInput(event: InputEvent): void {
    if (event.type === 'click' && event.x !== undefined && event.y !== undefined) {
      // Convert screen coordinates to world coordinates
      // Note: We need access to the renderer for this, so we'll handle this in the Game class
      // For now, we'll use a placeholder
      console.log(`🎯 Click at screen ${event.x}, ${event.y}`);
    } else if (event.type === 'mousemove' && event.x !== undefined && event.y !== undefined) {
      // Handle hover for click detection
      // This will also need world coordinates
    } else if (event.type === 'keydown') {
      if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
        console.log('⏸️ Pause requested');
        this.pauseGame();
      } else if (event.key === 'd' || event.key === 'D') {
        // Debug: Show all active enemies
        this.debugShowActiveEnemies();
      }
    }
  }
  
  /**
   * Debug method to show all active enemies
   */
  private debugShowActiveEnemies(): void {
    const allEnemies = this.entityManager.getEntitiesByType<Enemy>('enemy');
    const waveManagerEnemies = this.waveManager.getWaveStats().enemiesRemaining;
    
    console.log('🔍 DEBUG: Active Enemy Status');
    console.log(`📊 EntityManager reports ${allEnemies.length} enemies`);
    console.log(`📊 WaveManager reports ${waveManagerEnemies} enemies remaining`);
    
    allEnemies.forEach((enemy, index) => {
      const distance = Math.sqrt(enemy.x ** 2 + enemy.y ** 2);
      console.log(`  ${index + 1}. ${enemy.id} (${enemy.enemyType})`);
      console.log(`     Position: (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) distance: ${distance.toFixed(1)}`);
      console.log(`     State: active=${enemy.active}, health=${enemy.health}/${enemy.maxHealth}, visible=${enemy.visible}, alpha=${enemy.alpha}`);
      console.log(`     Clickable: ${enemy.isClickable}, hasOnClick: ${!!enemy.onClick}`);
    });
    
    if (allEnemies.length === 0) {
      console.log('   No enemies found!');
    }
  }

  /**
   * Handle click in world coordinates (called from Game class)
   */
  public handleWorldClick(worldX: number, worldY: number): void {
    // Try to collect coins first
    const collectedCoin = this.currencySystem.tryCollectCoin(worldX, worldY);
    
    if (!collectedCoin) {
      // If no coin collected, try clicking enemies
      const hitEnemy = this.clickDetection.handleClick({ x: worldX, y: worldY });
      if (hitEnemy) {
        console.log(`🎯 Hit enemy ${hitEnemy.id}!`);
      }
    }
  }
  
  /**
   * Handle hover in world coordinates (called from Game class)
   */
  public handleWorldHover(worldX: number, worldY: number): void {
    this.clickDetection.handleHover({ x: worldX, y: worldY });
  }
  
  
  
  
  
  /**
   * Synchronize clickable positions with entity positions  
   */
  private synchronizeClickablePositions(): void {
    // Get all enemy entities and update their clickable positions
    const enemies = this.entityManager.getEntitiesByType<Enemy>('enemy');
    for (const enemy of enemies) {
      if (enemy.active && enemy.isClickable) {
        this.clickDetection.updateClickable(enemy.id, enemy.x, enemy.y);
      }
    }
  }
  
  /**
   * Set up wave manager event handlers
   */
  private setupWaveEvents(): void {
    // Wave start event
    this.waveManager.onWaveStart((waveNumber) => {
      console.log(`🌊 Wave ${waveNumber} started!`);
    });
    
    // Wave complete event
    this.waveManager.onWaveComplete((waveNumber, enemiesKilled) => {
      console.log(`✅ Wave ${waveNumber} completed! Killed ${enemiesKilled} enemies`);
      // Add bonus points for wave completion
      this.score += waveNumber * 50;
    });
    
    // Enemy spawned event
    this.waveManager.onEnemySpawned((enemy, waveNumber) => {
      // Connect enemy to tower for attacking
      if (this.tower) {
        enemy.setTowerTarget(this.tower);
      }
      
      // Set up click handler for enemy destruction
      enemy.onClick = (_clickable, _clickPos) => {
        console.log(`💥 Player clicked enemy ${enemy.id}!`);
        this.score += enemy.reward;
        
        // Drop coins at enemy position
        this.currencySystem.dropCoins(enemy.reward, enemy.x, enemy.y);
        
        // Remove from click detection before destroying
        this.clickDetection.removeClickable(enemy.id);
        enemy.destroy();
      };
      
      // Register enemy with click detection system
      this.clickDetection.addClickable(enemy);
      
      console.log(`👹 Wave ${waveNumber} enemy spawned: ${enemy.enemyType}`);
    });
  }
  
  /**
   * Set up currency system event handlers
   */
  private setupCurrencyEvents(): void {
    this.currencySystem.onCoinCollected((amount, totalCoins) => {
      console.log(`💰 Collected ${amount} coins! Total: ${totalCoins}`);
      // Could add visual/audio feedback here
    });
    
    this.currencySystem.onCoinDropped((coinData) => {
      console.log(`💰 Coin dropped: ${coinData.amount} at (${coinData.x}, ${coinData.y})`);
      // Could add particle effects here
    });
  }
  
  /**
   * Set up tower weapon system event handlers
   */
  private setupTowerWeaponEvents(): void {
    this.towerWeaponSystem.onEnemyKilled((enemy, weapon) => {
      console.log(`🔫 Tower weapon ${weapon} killed enemy ${enemy.id}!`);
      this.score += enemy.reward;
      
      // Drop coins at enemy position (same as player kills)
      this.currencySystem.dropCoins(enemy.reward, enemy.x, enemy.y);
    });
    
    this.towerWeaponSystem.onProjectileHit((projectile, enemy) => {
      console.log(`🎯 Projectile ${projectile.type} hit enemy ${enemy.id}!`);
      // Could add impact effects here
    });
  }
  
  /**
   * Set state manager reference (called by Game class)
   */
  public setStateManager(stateManager: GameStateManager): void {
    this.stateManager = stateManager;
  }
  
  /**
   * Set viewport dimensions for proper enemy spawning
   */
  public setViewportDimensions(width: number, height: number): void {
    this.waveManager.setViewportDimensions(width, height);
  }
  
  /**
   * Pause the game
   */
  private pauseGame(): void {
    if (this.stateManager) {
      console.log('⏸️ Pausing game');
      const pauseData: GameStateData = {
        pausedFromState: GameStateType.PLAYING,
        gameTime: this.gameTime,
        score: this.score,
        waveStats: this.waveManager.getWaveStats(),
        currencyStats: this.currencySystem.getStats(),
        towerStats: this.tower ? this.tower.getStats() : null
      };
      
      // Pause the wave manager to freeze enemy spawning
      this.waveManager.pause();
      
      this.stateManager.changeState(GameStateType.PAUSED, pauseData);
    }
  }
  
  /**
   * Trigger game over transition
   */
  private triggerGameOver(): void {
    const waveStats = this.waveManager.getWaveStats();
    const currencyStats = this.currencySystem.getStats();
    const gameOverData: GameStateData = {
      finalScore: this.score,
      wavesReached: waveStats.currentWave,
      enemiesKilled: waveStats.enemiesKilled,
      gameTime: this.gameTime,
      coinsEarned: currencyStats.coinsThisRun,
      totalCoins: currencyStats.totalCoins,
      cause: 'tower_destroyed'
    };
    
    // Stop the wave system
    this.waveManager.stopWaves();
    
    // Clear click detection
    this.clickDetection.clearClickables();
    
    // Transition to game over state
    if (this.stateManager) {
      this.stateManager.changeState(GameStateType.GAME_OVER, gameOverData);
    } else {
      console.log('🎮 Game Over! Final stats:', gameOverData);
    }
  }
}

export class GameOverState extends GameState {
  private finalScore: number = 0;
  private wavesReached: number = 0;
  private enemiesKilled: number = 0;
  private gameTime: number = 0;
  private coinsEarned: number = 0;
  private totalCoins: number = 0;
  private cause: string = '';
  private animationPhase: number = 0;
  private showStats: boolean = false;
  private restartButton: boolean = false;
  private stateManager: GameStateManager | null = null;
  
  constructor() {
    super(GameStateType.GAME_OVER);
  }
  
  /**
   * Set state manager reference (called by Game class)
   */
  public setStateManager(stateManager: GameStateManager): void {
    this.stateManager = stateManager;
  }
  
  public onEnter(data?: GameStateData): void {
    console.log('💀 Entered Game Over State');
    
    if (data) {
      this.finalScore = data.finalScore || 0;
      this.wavesReached = data.wavesReached || 0;
      this.enemiesKilled = data.enemiesKilled || 0;
      this.gameTime = data.gameTime || 0;
      this.coinsEarned = data.coinsEarned || 0;
      this.totalCoins = data.totalCoins || 0;
      this.cause = data.cause || 'unknown';
      this.setData(data);
    }
    
    // Reset animation state
    this.animationPhase = 0;
    this.showStats = false;
    this.restartButton = false;
    
    // Show stats after a delay
    setTimeout(() => {
      this.showStats = true;
    }, 1000);
    
    // Show restart button after stats
    setTimeout(() => {
      this.restartButton = true;
    }, 3000);
  }
  
  public onExit(): GameStateData {
    console.log('💀 Exited Game Over State');
    return this.getData();
  }
  
  public update(deltaTime: number): void {
    this.animationPhase += deltaTime;
  }
  
  public render(renderer: CanvasRenderer): void {
    const viewport = renderer.getViewport();
    
    // Dark overlay background
    renderer.clear('#0a0a0a');
    
    // Game Over title with pulsing effect
    const pulseScale = 1 + Math.sin(this.animationPhase * 2) * 0.1;
    const titleY = 120;
    
    renderer.drawScreenText('💀 GAME OVER 💀', viewport.width / 2, titleY, {
      fillStyle: '#FF4444',
      font: `bold ${Math.floor(48 * pulseScale)}px Arial`,
      textAlign: 'center'
    });
    
    // Cause of death
    let causeText = 'Tower Destroyed';
    if (this.cause === 'tower_destroyed') causeText = '🏰 Tower Destroyed';
    
    renderer.drawScreenText(causeText, viewport.width / 2, titleY + 60, {
      fillStyle: '#CCCCCC',
      font: '24px Arial',
      textAlign: 'center'
    });
    
    // Show stats if animation phase allows
    if (this.showStats) {
      this.renderGameStats(renderer, viewport);
    }
    
    // Show restart button if ready
    if (this.restartButton) {
      this.renderRestartButton(renderer, viewport);
    }
    
    // Background particle effects for atmosphere
    this.renderBackgroundEffects(renderer, viewport);
  }
  
  public handleInput(event: InputEvent): void {
    if (event.type === 'click' && this.restartButton) {
      console.log('🔄 Restart game requested');
      this.restartGame();
    } else if (event.type === 'keydown') {
      if (event.key === 'Enter' || event.key === ' ') {
        if (this.restartButton) {
          console.log('🔄 Restart game requested (keyboard)');
          this.restartGame();
        }
      } else if (event.key === 'Escape') {
        console.log('🏠 Return to main menu requested');
        this.returnToMainMenu();
      }
    }
  }
  
  /**
   * Restart the game
   */
  private restartGame(): void {
    if (this.stateManager) {
      this.stateManager.changeState(GameStateType.PLAYING);
    }
  }
  
  /**
   * Return to main menu
   */
  private returnToMainMenu(): void {
    if (this.stateManager) {
      this.stateManager.changeState(GameStateType.MAIN_MENU);
    }
  }
  
  /**
   * Render game statistics
   */
  private renderGameStats(renderer: CanvasRenderer, viewport: any): void {
    const centerX = viewport.width / 2;
    const startY = 250;
    const lineHeight = 40;
    
    // Stats container background
    const containerWidth = 400;
    const containerHeight = 260;
    const containerX = centerX - containerWidth / 2;
    const containerY = startY - 20;
    
    // Draw container background using screen coordinates
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.fillRect(containerX, containerY, containerWidth, containerHeight);
    ctx.strokeRect(containerX, containerY, containerWidth, containerHeight);
    ctx.restore();
    
    // Final statistics
    const stats = [
      { label: '📊 Final Score', value: this.finalScore.toLocaleString() },
      { label: '🌊 Waves Reached', value: this.wavesReached.toString() },
      { label: '👹 Enemies Defeated', value: this.enemiesKilled.toString() },
      { label: '💰 Coins Earned', value: this.coinsEarned.toString() },
      { label: '🏦 Total Coins', value: this.totalCoins.toString() },
      { label: '⏰ Survival Time', value: this.formatTime(this.gameTime) }
    ];
    
    stats.forEach((stat, index) => {
      const y = startY + index * lineHeight;
      
      // Label
      renderer.drawScreenText(stat.label, centerX - 80, y, {
        fillStyle: '#CCCCCC',
        font: '18px Arial',
        textAlign: 'right'
      });
      
      // Value
      renderer.drawScreenText(stat.value, centerX + 80, y, {
        fillStyle: '#FFD700',
        font: 'bold 18px Arial',
        textAlign: 'left'
      });
    });
    
    // Calculate and show score rating
    const rating = this.calculateRating();
    renderer.drawScreenText(`Rating: ${rating}`, centerX, startY + stats.length * lineHeight + 20, {
      fillStyle: '#FF9800',
      font: 'bold 20px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render restart button
   */
  private renderRestartButton(renderer: CanvasRenderer, viewport: any): void {
    const centerX = viewport.width / 2;
    const buttonY = viewport.height - 120;
    const buttonWidth = 200;
    const buttonHeight = 50;
    
    // Button background with hover effect
    const buttonAlpha = 0.8 + Math.sin(this.animationPhase * 3) * 0.2;
    
    // Draw button background using screen coordinates
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = `rgba(76, 175, 80, ${buttonAlpha})`;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.fillRect(centerX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
    ctx.strokeRect(centerX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
    ctx.restore();
    
    // Button text
    renderer.drawScreenText('🔄 PLAY AGAIN', centerX, buttonY, {
      fillStyle: '#FFFFFF',
      font: 'bold 18px Arial',
      textAlign: 'center'
    });
    
    // Instructions
    renderer.drawScreenText('Press ENTER or SPACE to restart | ESC for main menu', centerX, buttonY + 60, {
      fillStyle: '#888888',
      font: '14px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render atmospheric background effects
   */
  private renderBackgroundEffects(renderer: CanvasRenderer, viewport: any): void {
    // Floating particles/sparks
    const numParticles = 20;
    for (let i = 0; i < numParticles; i++) {
      const x = (viewport.width / numParticles) * i + Math.sin(this.animationPhase + i) * 50;
      const y = 50 + Math.sin(this.animationPhase * 0.5 + i * 0.5) * 30;
      const alpha = (Math.sin(this.animationPhase * 2 + i) + 1) * 0.3;
      
      // Draw particle using screen coordinates
      const ctx = renderer.getContext();
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  /**
   * Format time in MM:SS format
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Calculate performance rating
   */
  private calculateRating(): string {
    let points = 0;
    points += this.finalScore / 100;
    points += this.wavesReached * 10;
    points += this.enemiesKilled * 2;
    points += this.coinsEarned / 5;
    points += this.gameTime / 10;
    
    if (points >= 120) return 'S+ Legendary';
    if (points >= 100) return 'S Excellent';
    if (points >= 80) return 'A Great';
    if (points >= 60) return 'B Good';
    if (points >= 40) return 'C Average';
    return 'D Try Again';
  }
  
  /**
   * Get final game statistics
   */
  public getFinalStats(): {
    score: number;
    waves: number;
    enemies: number;
    time: number;
    rating: string;
  } {
    return {
      score: this.finalScore,
      waves: this.wavesReached,
      enemies: this.enemiesKilled,
      time: this.gameTime,
      rating: this.calculateRating()
    };
  }
}