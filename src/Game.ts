// Main Game Class - Orchestrates all game systems and states
import { CanvasRenderer } from './core/CanvasRenderer.js';
import { InputManager } from './core/InputManager.js';
import { GameStateManager, GameStateType, MainMenuState, PlayingState, GameOverState } from './core/GameState.js';
import { SkillTreeState } from './states/SkillTreeState.js';
import { PausedState } from './states/PausedState.js';
import { SettingsState } from './states/SettingsState.js';
import { SkillTreeSystem } from './systems/SkillTreeSystem.js';
import { CurrencySystem } from './systems/CurrencySystem.js';
import { SettingsSystem } from './systems/SettingsSystem.js';
import { SaveManager } from './systems/SaveManager.js';
import { AudioManager } from './systems/AudioManager.js';
import { ParticleSystem } from './systems/ParticleSystem.js';

export class Game {
  private renderer: CanvasRenderer;
  private inputManager: InputManager;
  private gameStateManager: GameStateManager;
  
  // Global systems
  private skillTreeSystem: SkillTreeSystem;
  private currencySystem: CurrencySystem;
  private settingsSystem: SettingsSystem;
  private saveManager: SaveManager;
  private audioManager: AudioManager;
  private particleSystem: ParticleSystem;
  
  // Game states
  private mainMenuState: MainMenuState;
  private playingState: PlayingState;
  private gameOverState: GameOverState;
  private skillTreeState: SkillTreeState;
  private pausedState: PausedState;
  private settingsState: SettingsState;
  
  // Game loop
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D rendering context');
    }
    this.renderer = new CanvasRenderer(canvas, ctx);
    this.inputManager = new InputManager(canvas, this.renderer);
    this.gameStateManager = new GameStateManager();
    
    // Initialize global systems
    this.saveManager = new SaveManager();
    this.audioManager = new AudioManager();
    this.particleSystem = new ParticleSystem();
    this.skillTreeSystem = new SkillTreeSystem();
    this.currencySystem = new CurrencySystem();
    this.settingsSystem = new SettingsSystem();
    
    // Create game states
    this.mainMenuState = new MainMenuState();
    this.playingState = new PlayingState();
    this.gameOverState = new GameOverState();
    this.skillTreeState = new SkillTreeState(this.skillTreeSystem);
    this.pausedState = new PausedState();
    this.settingsState = new SettingsState(this.settingsSystem);
    
    // Set up cross-references
    this.setupStateReferences();
    
    // Register states
    this.registerStates();
    
    // Set up input handling
    this.setupInputHandling();
    
    // Set up audio and settings integration
    this.setupAudioIntegration();
    
    console.log('🎮 Game initialized');
  }

  /**
   * Set up cross-references between systems and states
   */
  private setupStateReferences(): void {
    // Give skill tree state access to currency system
    this.skillTreeState.setCurrencySystem(this.currencySystem);
    
    // Give playing state access to skill tree system (for applying effects)
    // this.playingState.setSkillTreeSystem(this.skillTreeSystem);
    
    // Give states access to state manager
    this.mainMenuState.setStateManager(this.gameStateManager);
    this.gameOverState.setStateManager(this.gameStateManager);
    this.playingState.setStateManager(this.gameStateManager);
    this.pausedState.setStateManager(this.gameStateManager);
    this.settingsState.setStateManager(this.gameStateManager);
    
    // Set viewport dimensions for enemy spawning
    const viewport = this.renderer.getViewport();
    this.playingState.setViewportDimensions(viewport.width, viewport.height);
  }

  /**
   * Register all game states with the state manager
   */
  private registerStates(): void {
    this.gameStateManager.registerState(this.mainMenuState);
    this.gameStateManager.registerState(this.playingState);
    this.gameStateManager.registerState(this.gameOverState);
    this.gameStateManager.registerState(this.skillTreeState);
    this.gameStateManager.registerState(this.pausedState);
    this.gameStateManager.registerState(this.settingsState);
  }

  /**
   * Set up input event handling
   */
  private setupInputHandling(): void {
    // Mouse click events
    this.inputManager.on('click', (event) => {
      const currentState = this.gameStateManager.getCurrentState();
      
      if (currentState && event.screenPosition) {
        // Convert to appropriate coordinate system based on state
        if (this.gameStateManager.isCurrentState(GameStateType.PLAYING)) {
          // Playing state needs world coordinates
          const worldPos = this.renderer.screenToWorld(event.screenPosition.x, event.screenPosition.y);
          this.playingState.handleWorldClick(worldPos.x, worldPos.y);
        } else {
          // Other states use screen coordinates
          currentState.handleInput({
            type: 'click',
            x: event.screenPosition.x,
            y: event.screenPosition.y,
            button: event.button
          });
        }
      }
    });

    // Mouse move events
    this.inputManager.on('mousemove', (event) => {
      const currentState = this.gameStateManager.getCurrentState();
      
      if (currentState && event.screenPosition) {
        if (this.gameStateManager.isCurrentState(GameStateType.PLAYING)) {
          // Playing state needs world coordinates for hover
          const worldPos = this.renderer.screenToWorld(event.screenPosition.x, event.screenPosition.y);
          this.playingState.handleWorldHover(worldPos.x, worldPos.y);
        } else if (this.gameStateManager.isCurrentState(GameStateType.SKILL_TREE)) {
          // Skill tree handles its own coordinate conversion
          currentState.handleInput({
            type: 'mousemove',
            x: event.screenPosition.x,
            y: event.screenPosition.y
          });
        }
      }
    });

    // Keyboard events
    this.inputManager.on('keydown', (event) => {
      const currentState = this.gameStateManager.getCurrentState();
      
      if (currentState && event.key) {
        currentState.handleInput({
          type: 'keydown',
          key: event.key
        });
      }
      
      // Global shortcuts
      if (event.key === 'F1') {
        this.toggleState(GameStateType.SKILL_TREE);
      } else if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
        // Only pause from playing state, otherwise let the current state handle it
        if (this.gameStateManager.isCurrentState(GameStateType.PLAYING)) {
          this.toggleState(GameStateType.PAUSED);
        }
      }
    });

    this.inputManager.on('keyup', (event) => {
      const currentState = this.gameStateManager.getCurrentState();
      
      if (currentState && event.key) {
        currentState.handleInput({
          type: 'keyup',
          key: event.key
        });
      }
    });
  }

  /**
   * Set up audio system integration with settings
   */
  private setupAudioIntegration(): void {
    // Connect settings changes to audio system and particle system
    this.settingsSystem.onSettingsChanged((settings) => {
      this.audioManager.updateSettings({
        masterVolume: settings.audio.masterVolume,
        musicVolume: settings.audio.musicVolume,
        sfxVolume: settings.audio.sfxVolume,
        muteAll: settings.audio.muteAll
      });
      
      // Update particle system performance based on graphics settings
      const particleMode = settings.graphics.particleEffects ? 
        (settings.graphics.quality === 'high' ? 'high' : 
         settings.graphics.quality === 'medium' ? 'medium' : 'low') : 'low';
      this.particleSystem.setPerformanceMode(particleMode);
    });
    
    // Apply initial settings
    const currentSettings = this.settingsSystem.getSettings();
    this.audioManager.updateSettings({
      masterVolume: currentSettings.audio.masterVolume,
      musicVolume: currentSettings.audio.musicVolume,
      sfxVolume: currentSettings.audio.sfxVolume,
      muteAll: currentSettings.audio.muteAll
    });
    
    // Apply initial particle system settings
    const initialParticleMode = currentSettings.graphics.particleEffects ? 
      (currentSettings.graphics.quality === 'high' ? 'high' : 
       currentSettings.graphics.quality === 'medium' ? 'medium' : 'low') : 'low';
    this.particleSystem.setPerformanceMode(initialParticleMode);
    
    console.log('🔊 Audio integration set up');
  }

  /**
   * Toggle between current state and specified state
   */
  private toggleState(targetState: GameStateType): void {
    const currentStateType = this.gameStateManager.getCurrentStateType();
    
    if (currentStateType === targetState) {
      // Return to appropriate state based on context
      if (targetState === GameStateType.PAUSED) {
        // Resume the game by returning to playing state
        this.gameStateManager.changeState(GameStateType.PLAYING);
      } else {
        // Return to main menu
        this.gameStateManager.changeState(GameStateType.MAIN_MENU);
      }
    } else {
      // Go to target state with appropriate data
      if (targetState === GameStateType.PAUSED && currentStateType === GameStateType.PLAYING) {
        // Get current playing state data
        const playingState = this.gameStateManager.getCurrentState();
        const pauseData = playingState ? playingState.getData() : {};
        pauseData.pausedFromState = GameStateType.PLAYING;
        this.gameStateManager.changeState(targetState, pauseData);
      } else {
        this.gameStateManager.changeState(targetState);
      }
    }
  }

  /**
   * Start the game
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('⚠️ Game is already running');
      return;
    }
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    // Load persistent data
    this.loadGameData();
    
    // Preload audio resources
    this.audioManager.preloadGameSounds();
    
    // Start with main menu
    this.gameStateManager.changeState(GameStateType.MAIN_MENU);
    
    // Start game loop
    this.gameLoop();
    
    console.log('🚀 Game started');
  }

  /**
   * Stop the game
   */
  public stop(): void {
    this.isRunning = false;
    
    // Save persistent data
    this.saveGameData();
    
    // Cleanup audio resources
    this.audioManager.cleanup();
    
    // Clear particle system
    this.particleSystem.clear();
    
    console.log('🛑 Game stopped');
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 1/30); // Max 30 FPS
    
    // Update current state
    this.gameStateManager.update(cappedDeltaTime);
    
    // Update global systems
    this.skillTreeSystem.update(cappedDeltaTime);
    this.currencySystem.update(cappedDeltaTime);
    this.particleSystem.update(cappedDeltaTime);
    
    // Render
    this.gameStateManager.render(this.renderer);
    
    // Render particle effects on top
    this.particleSystem.render(this.renderer);
    
    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Load persistent game data
   */
  private loadGameData(): void {
    const saveData = this.saveManager.loadGame();
    
    if (saveData) {
      // Load skill tree from save data
      this.skillTreeSystem.loadFromSaveData(saveData.skillTree);
      
      // Load currency from save data
      this.currencySystem.loadFromSaveData(saveData.currency);
      
      // Load settings from save data
      this.settingsSystem.loadFromSaveData(saveData.settings);
      
      console.log('💾 Game data loaded from SaveManager');
    } else {
      // Fallback to individual system loading
      this.skillTreeSystem.loadFromStorage();
      console.log('💾 Fallback: loaded individual system data');
    }
  }

  /**
   * Save persistent game data
   */
  private saveGameData(): void {
    const saveData = {
      skillTree: this.skillTreeSystem.getSaveData(),
      currency: this.currencySystem.getSaveData(),
      statistics: this.getGameStatistics(),
      settings: this.settingsSystem.getSettings()
    };
    
    this.saveManager.saveGame(saveData);
    console.log('💾 Game data saved via SaveManager');
  }

  /**
   * Get game statistics for saving
   */
  private getGameStatistics() {
    const playingState = this.playingState.getData();
    return {
      gamesPlayed: 1, // This would be tracked properly
      highestWave: playingState.highestWave || 0,
      totalEnemiesKilled: playingState.totalEnemiesKilled || 0,
      totalPlayTime: 0, // Tracked by SaveManager
      averageWavesSurvived: 0 // Calculated from multiple runs
    };
  }

  /**
   * Handle window resize
   */
  public handleResize(): void {
    // Update renderer viewport
    this.renderer.updateViewport(this.renderer.getCanvas().width, this.renderer.getCanvas().height);
    
    // Update playing state viewport dimensions for enemy spawning
    const viewport = this.renderer.getViewport();
    this.playingState.setViewportDimensions(viewport.width, viewport.height);
    
    console.log(`🔄 Game resized to ${viewport.width}x${viewport.height}`);
  }

  /**
   * Get current FPS (for debugging)
   */
  public getFPS(): number {
    return Math.round(1000 / (performance.now() - this.lastFrameTime));
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      fps: this.getFPS(),
      currentState: this.gameStateManager.getCurrentStateType(),
      skillTreeStats: this.skillTreeSystem.getStats(),
      currencyStats: this.currencySystem.getStats(),
      audioStats: this.audioManager.getStats(),
      particleStats: this.particleSystem.getStats(),
      saveStats: this.saveManager.getStats(),
      viewport: this.renderer.getViewport()
    };
  }

  /**
   * Force state change (for debugging/testing)
   */
  public changeState(stateType: GameStateType): void {
    this.gameStateManager.changeState(stateType);
  }

  /**
   * Get skill tree system (for external access)
   */
  public getSkillTreeSystem(): SkillTreeSystem {
    return this.skillTreeSystem;
  }

  /**
   * Get currency system (for external access)
   */
  public getCurrencySystem(): CurrencySystem {
    return this.currencySystem;
  }

  /**
   * Get audio manager (for external access)
   */
  public getAudioManager(): AudioManager {
    return this.audioManager;
  }

  /**
   * Get particle system (for external access)
   */
  public getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }
}