// Paused State - Game pause functionality with menu overlay
import { GameState, GameStateType, GameStateData, InputEvent } from '../core/GameState.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';
import { GameStateManager } from '../core/GameState.js';

export class PausedState extends GameState {
  private stateManager: GameStateManager | null = null;
  private pausedFromState: GameStateType | null = null;
  private gameTime: number = 0;
  private animationTime: number = 0;
  
  // Menu options
  private menuOptions: string[] = ['Resume', 'Skill Tree', 'Settings', 'Main Menu'];
  private selectedOption: number = 0;
  
  // Visual effects
  private overlayAlpha: number = 0;
  private menuScale: number = 0;
  private targetOverlayAlpha: number = 0.8;
  private targetMenuScale: number = 1.0;
  
  constructor() {
    super(GameStateType.PAUSED);
  }
  
  /**
   * Set state manager reference (called by Game class)
   */
  public setStateManager(stateManager: GameStateManager): void {
    this.stateManager = stateManager;
  }
  
  public onEnter(data?: GameStateData): void {
    console.log('⏸️ Entered Pause State');
    
    if (data) {
      this.pausedFromState = data.pausedFromState as GameStateType || GameStateType.PLAYING;
      this.gameTime = data.gameTime || 0;
      this.setData(data);
    } else {
      this.pausedFromState = GameStateType.PLAYING;
    }
    
    // Reset animation state
    this.animationTime = 0;
    this.overlayAlpha = 0;
    this.menuScale = 0;
    this.selectedOption = 0;
    
    console.log(`⏸️ Game paused from: ${this.pausedFromState}`);
  }
  
  public onExit(): GameStateData {
    console.log('⏸️ Exited Pause State');
    return { ...this.getData(), resumeToState: this.pausedFromState };
  }
  
  public update(deltaTime: number): void {
    this.animationTime += deltaTime;
    
    // Animate overlay fade-in
    const fadeSpeed = 3.0;
    this.overlayAlpha = Math.min(this.targetOverlayAlpha, this.overlayAlpha + deltaTime * fadeSpeed);
    
    // Animate menu scale-in with ease-out
    const scaleSpeed = 4.0;
    const scaleDiff = this.targetMenuScale - this.menuScale;
    this.menuScale += scaleDiff * deltaTime * scaleSpeed;
    
    // Clamp values
    this.menuScale = Math.max(0, Math.min(this.targetMenuScale, this.menuScale));
  }
  
  public render(renderer: CanvasRenderer): void {
    const viewport = renderer.getViewport();
    const ctx = renderer.getContext();
    
    // Render the game state underneath (frozen)
    // Note: In a full implementation, we'd render the paused game state here
    // For now, we'll just show a dark background
    renderer.clear('#0a0a0a');
    
    // Semi-transparent overlay
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${this.overlayAlpha})`;
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    ctx.restore();
    
    // Only show menu if animation has progressed
    if (this.menuScale > 0.1) {
      this.renderPauseMenu(renderer, viewport);
    }
    
    // Render pause indicator
    this.renderPauseIndicator(renderer, viewport);
  }
  
  /**
   * Render the pause menu
   */
  private renderPauseMenu(renderer: CanvasRenderer, viewport: any): void {
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    
    // Apply scale transform for menu animation
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.menuScale, this.menuScale);
    ctx.translate(-centerX, -centerY);
    
    // Menu background panel
    const panelWidth = 400;
    const panelHeight = 350;
    const panelX = centerX - panelWidth / 2;
    const panelY = centerY - panelHeight / 2;
    
    // Panel background with border
    ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 3;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Pause title
    renderer.drawScreenText('⏸️ GAME PAUSED', centerX, panelY + 50, {
      fillStyle: '#4A90E2',
      font: 'bold 32px Arial',
      textAlign: 'center'
    });
    
    // Game time display
    const timeText = `Game Time: ${this.formatTime(this.gameTime)}`;
    renderer.drawScreenText(timeText, centerX, panelY + 90, {
      fillStyle: '#CCCCCC',
      font: '16px Arial',
      textAlign: 'center'
    });
    
    // Menu options
    const menuStartY = panelY + 140;
    const menuSpacing = 45;
    
    this.menuOptions.forEach((option, index) => {
      const y = menuStartY + index * menuSpacing;
      const isSelected = index === this.selectedOption;
      
      // Option background for selected item
      if (isSelected) {
        const optionWidth = 200;
        const optionHeight = 35;
        ctx.fillStyle = 'rgba(74, 144, 226, 0.3)';
        ctx.fillRect(centerX - optionWidth / 2, y - optionHeight / 2, optionWidth, optionHeight);
      }
      
      // Option text
      renderer.drawScreenText(option, centerX, y, {
        fillStyle: isSelected ? '#FFD700' : '#FFFFFF',
        font: isSelected ? 'bold 22px Arial' : '20px Arial',
        textAlign: 'center'
      });
      
      // Selection indicator
      if (isSelected) {
        const pulse = 1 + Math.sin(this.animationTime * 4) * 0.3;
        renderer.drawScreenText('▶', centerX - 120, y, {
          fillStyle: '#FFD700',
          font: `${Math.floor(20 * pulse)}px Arial`,
          textAlign: 'center'
        });
      }
    });
    
    ctx.restore();
    
    // Instructions at bottom
    renderer.drawScreenText('Use arrow keys or click to navigate • Enter to select • ESC to resume', 
      centerX, viewport.height - 40, {
      fillStyle: '#888888',
      font: '14px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render pause indicator in corner
   */
  private renderPauseIndicator(renderer: CanvasRenderer, _viewport: any): void {
    const pulseIntensity = (Math.sin(this.animationTime * 3) + 1) * 0.5;
    const alpha = 0.6 + pulseIntensity * 0.4;
    
    renderer.drawScreenText('⏸️', 30, 30, {
      fillStyle: '#4A90E2',
      font: '24px Arial',
      textAlign: 'left',
      alpha: alpha
    });
    
    renderer.drawScreenText('PAUSED', 60, 30, {
      fillStyle: '#4A90E2',
      font: 'bold 18px Arial',
      textAlign: 'left',
      alpha: alpha
    });
  }
  
  public handleInput(event: InputEvent): void {
    // Only handle input after menu has animated in
    if (this.menuScale < 0.8) return;
    
    if (event.type === 'click') {
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
        case ' ':
          this.selectCurrentOption();
          break;
        case 'Escape':
          this.resumeGame();
          break;
        case 'p':
        case 'P':
          this.resumeGame();
          break;
      }
    }
  }
  
  /**
   * Handle menu option selection
   */
  private selectCurrentOption(): void {
    const option = this.menuOptions[this.selectedOption];
    console.log(`🎯 Pause menu option selected: ${option}`);
    
    switch (option) {
      case 'Resume':
        this.resumeGame();
        break;
      case 'Skill Tree':
        this.openSkillTree();
        break;
      case 'Settings':
        this.openSettings();
        break;
      case 'Main Menu':
        this.returnToMainMenu();
        break;
    }
  }
  
  /**
   * Resume the game
   */
  private resumeGame(): void {
    if (this.stateManager && this.pausedFromState) {
      console.log(`▶️ Resuming game to: ${this.pausedFromState}`);
      this.stateManager.changeState(this.pausedFromState, this.getData());
    }
  }
  
  /**
   * Open skill tree from pause menu
   */
  private openSkillTree(): void {
    if (this.stateManager) {
      console.log('🌳 Opening skill tree from pause menu');
      this.stateManager.changeState(GameStateType.SKILL_TREE, {
        ...this.getData(),
        returnToState: GameStateType.PAUSED
      });
    }
  }
  
  /**
   * Open settings from pause menu
   */
  private openSettings(): void {
    if (this.stateManager) {
      console.log('⚙️ Opening settings from pause menu');
      this.stateManager.changeState(GameStateType.SETTINGS, {
        ...this.getData(),
        returnToState: GameStateType.PAUSED
      });
    }
  }
  
  /**
   * Return to main menu (end current game)
   */
  private returnToMainMenu(): void {
    if (this.stateManager) {
      console.log('🏠 Returning to main menu from pause');
      // Show confirmation or just go directly to main menu
      this.stateManager.changeState(GameStateType.MAIN_MENU);
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
   * Get the state we paused from
   */
  public getPausedFromState(): GameStateType | null {
    return this.pausedFromState;
  }
  
  /**
   * Check if game is paused from a specific state
   */
  public isPausedFrom(state: GameStateType): boolean {
    return this.pausedFromState === state;
  }
}