// Settings State - User interface for game configuration
import { GameState, GameStateType, GameStateData, InputEvent } from '../core/GameState.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';
import { GameStateManager } from '../core/GameState.js';
import { SettingsSystem, GameSettings } from '../systems/SettingsSystem.js';

interface SettingsMenuItem {
  id: string;
  label: string;
  type: 'category' | 'slider' | 'toggle' | 'select' | 'button' | 'key';
  category?: keyof GameSettings;
  key?: string;
  value?: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export class SettingsState extends GameState {
  private stateManager: GameStateManager | null = null;
  private settingsSystem: SettingsSystem;
  private returnToState: GameStateType = GameStateType.MAIN_MENU;
  
  // UI state
  private currentCategory: 'audio' | 'graphics' | 'gameplay' | 'controls' = 'audio';
  private selectedItemIndex: number = 0;
  private animationTime: number = 0;
  private pendingKeyCapture: string | null = null;
  
  // Visual effects
  private backgroundAlpha: number = 0;
  private menuScale: number = 0;
  private targetBackgroundAlpha: number = 0.9;
  private targetMenuScale: number = 1.0;
  
  // Categories
  private categories = [
    { id: 'audio', name: 'Audio', icon: '🔊' },
    { id: 'graphics', name: 'Graphics', icon: '🎨' },
    { id: 'gameplay', name: 'Gameplay', icon: '🎮' },
    { id: 'controls', name: 'Controls', icon: '🎯' }
  ];
  
  constructor(settingsSystem: SettingsSystem) {
    super(GameStateType.SETTINGS);
    this.settingsSystem = settingsSystem;
  }
  
  /**
   * Set state manager reference
   */
  public setStateManager(stateManager: GameStateManager): void {
    this.stateManager = stateManager;
  }
  
  public onEnter(data?: GameStateData): void {
    console.log('⚙️ Entered Settings State');
    
    if (data) {
      this.returnToState = data.returnToState as GameStateType || GameStateType.MAIN_MENU;
      this.setData(data);
    }
    
    // Reset UI state
    this.animationTime = 0;
    this.backgroundAlpha = 0;
    this.menuScale = 0;
    this.selectedItemIndex = 0;
    this.pendingKeyCapture = null;
    this.currentCategory = 'audio';
    
    console.log(`⚙️ Settings opened from: ${this.returnToState}`);
  }
  
  public onExit(): GameStateData {
    console.log('⚙️ Exited Settings State');
    
    // Save settings before exit
    this.settingsSystem.saveToStorage();
    
    return { ...this.getData(), returnToState: this.returnToState };
  }
  
  public update(deltaTime: number): void {
    this.animationTime += deltaTime;
    
    // Animate background fade-in
    const fadeSpeed = 3.0;
    this.backgroundAlpha = Math.min(this.targetBackgroundAlpha, this.backgroundAlpha + deltaTime * fadeSpeed);
    
    // Animate menu scale-in
    const scaleSpeed = 4.0;
    const scaleDiff = this.targetMenuScale - this.menuScale;
    this.menuScale += scaleDiff * deltaTime * scaleSpeed;
    this.menuScale = Math.max(0, Math.min(this.targetMenuScale, this.menuScale));
  }
  
  public render(renderer: CanvasRenderer): void {
    const viewport = renderer.getViewport();
    const ctx = renderer.getContext();
    
    // Background overlay
    renderer.clear('#0a0a0a');
    ctx.save();
    ctx.fillStyle = `rgba(20, 20, 40, ${this.backgroundAlpha})`;
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    ctx.restore();
    
    // Only show content if animation has progressed
    if (this.menuScale > 0.1) {
      this.renderSettingsInterface(renderer, viewport);
    }
    
    // Render key capture overlay if needed
    if (this.pendingKeyCapture) {
      this.renderKeyCaptureOverlay(renderer, viewport);
    }
  }
  
  /**
   * Render the main settings interface
   */
  private renderSettingsInterface(renderer: CanvasRenderer, viewport: any): void {
    const ctx = renderer.getContext();
    
    // Apply scale transform
    ctx.save();
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(this.menuScale, this.menuScale);
    ctx.translate(-centerX, -centerY);
    
    // Settings title
    renderer.drawScreenText('⚙️ SETTINGS', centerX, 60, {
      fillStyle: '#4A90E2',
      font: 'bold 36px Arial',
      textAlign: 'center'
    });
    
    // Category tabs
    this.renderCategoryTabs(renderer, viewport);
    
    // Settings content
    this.renderSettingsContent(renderer, viewport);
    
    // Action buttons
    this.renderActionButtons(renderer, viewport);
    
    ctx.restore();
    
    // Instructions
    renderer.drawScreenText('Arrow keys to navigate • Enter to edit • ESC to go back', 
      centerX, viewport.height - 30, {
      fillStyle: '#888888',
      font: '14px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render category tabs
   */
  private renderCategoryTabs(renderer: CanvasRenderer, viewport: any): void {
    const tabY = 120;
    const tabWidth = 150;
    const tabSpacing = 160;
    const startX = viewport.width / 2 - (this.categories.length * tabSpacing) / 2;
    
    this.categories.forEach((category, index) => {
      const x = startX + index * tabSpacing;
      const isSelected = category.id === this.currentCategory;
      
      // Tab background
      const ctx = renderer.getContext();
      ctx.save();
      ctx.fillStyle = isSelected ? 'rgba(74, 144, 226, 0.3)' : 'rgba(0, 0, 0, 0.2)';
      ctx.strokeStyle = isSelected ? '#4A90E2' : '#666666';
      ctx.lineWidth = 2;
      ctx.fillRect(x - tabWidth / 2, tabY - 20, tabWidth, 40);
      ctx.strokeRect(x - tabWidth / 2, tabY - 20, tabWidth, 40);
      ctx.restore();
      
      // Tab icon and text
      renderer.drawScreenText(category.icon, x - 20, tabY, {
        fillStyle: isSelected ? '#FFD700' : '#CCCCCC',
        font: '20px Arial',
        textAlign: 'center'
      });
      
      renderer.drawScreenText(category.name, x + 20, tabY, {
        fillStyle: isSelected ? '#FFD700' : '#CCCCCC',
        font: isSelected ? 'bold 16px Arial' : '14px Arial',
        textAlign: 'center'
      });
    });
  }
  
  /**
   * Render settings content for current category
   */
  private renderSettingsContent(renderer: CanvasRenderer, viewport: any): void {
    const contentY = 200;
    const lineHeight = 50;
    const menuItems = this.getMenuItemsForCategory(this.currentCategory);
    
    // Content panel background
    const panelWidth = 600;
    const panelHeight = Math.min(400, menuItems.length * lineHeight + 40);
    const panelX = viewport.width / 2 - panelWidth / 2;
    const panelY = contentY - 20;
    
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    ctx.restore();
    
    // Render menu items
    menuItems.forEach((item, index) => {
      const y = contentY + index * lineHeight;
      const isSelected = index === this.selectedItemIndex;
      
      this.renderMenuItem(renderer, item, panelX + 20, y, panelWidth - 40, isSelected);
    });
  }
  
  /**
   * Render individual menu item
   */
  private renderMenuItem(renderer: CanvasRenderer, item: SettingsMenuItem, x: number, y: number, width: number, isSelected: boolean): void {
    
    // Selection highlight
    if (isSelected) {
      const ctx = renderer.getContext();
      ctx.save();
      ctx.fillStyle = 'rgba(74, 144, 226, 0.2)';
      ctx.fillRect(x - 10, y - 20, width + 20, 35);
      ctx.restore();
    }
    
    // Item label
    renderer.drawScreenText(item.label, x, y, {
      fillStyle: isSelected ? '#FFD700' : '#CCCCCC',
      font: isSelected ? 'bold 16px Arial' : '14px Arial',
      textAlign: 'left'
    });
    
    // Item value/control
    const controlX = x + width - 200;
    
    switch (item.type) {
      case 'slider':
        this.renderSlider(renderer, item, controlX, y, 150, isSelected);
        break;
      case 'toggle':
        this.renderToggle(renderer, item, controlX + 75, y, isSelected);
        break;
      case 'select':
        this.renderSelect(renderer, item, controlX, y, 150, isSelected);
        break;
      case 'key':
        this.renderKeyBinding(renderer, item, controlX, y, 150, isSelected);
        break;
      case 'button':
        this.renderButton(renderer, item, controlX, y, 150, isSelected);
        break;
    }
  }
  
  /**
   * Render slider control
   */
  private renderSlider(renderer: CanvasRenderer, item: SettingsMenuItem, x: number, y: number, width: number, isSelected: boolean): void {
    if (!item.category || !item.key) return;
    
    const value = this.settingsSystem.getSetting(item.category as any, item.key as any) as number;
    const min = item.min || 0;
    const max = item.max || 1;
    const percentage = (value - min) / (max - min);
    
    const ctx = renderer.getContext();
    ctx.save();
    
    // Slider track
    ctx.strokeStyle = isSelected ? '#4A90E2' : '#666666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    
    // Slider fill
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * percentage, y);
    ctx.stroke();
    
    // Slider handle
    const handleX = x + width * percentage;
    ctx.fillStyle = isSelected ? '#FFD700' : '#CCCCCC';
    ctx.beginPath();
    ctx.arc(handleX, y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Value text
    renderer.drawScreenText(`${Math.round(value * 100)}%`, x + width + 10, y + 5, {
      fillStyle: '#CCCCCC',
      font: '12px Arial',
      textAlign: 'left'
    });
  }
  
  /**
   * Render toggle control
   */
  private renderToggle(renderer: CanvasRenderer, item: SettingsMenuItem, x: number, y: number, isSelected: boolean): void {
    if (!item.category || !item.key) return;
    
    const value = this.settingsSystem.getSetting(item.category as any, item.key as any) as boolean;
    
    const ctx = renderer.getContext();
    ctx.save();
    
    // Toggle background
    ctx.fillStyle = value ? '#4CAF50' : '#666666';
    ctx.strokeStyle = isSelected ? '#FFD700' : '#AAAAAA';
    ctx.lineWidth = 2;
    const toggleWidth = 40;
    const toggleHeight = 20;
    ctx.fillRect(x - toggleWidth / 2, y - toggleHeight / 2, toggleWidth, toggleHeight);
    ctx.strokeRect(x - toggleWidth / 2, y - toggleHeight / 2, toggleWidth, toggleHeight);
    
    // Toggle handle
    const handleX = value ? x + toggleWidth / 2 - 6 : x - toggleWidth / 2 + 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(handleX, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Status text
    renderer.drawScreenText(value ? 'ON' : 'OFF', x + 30, y + 3, {
      fillStyle: value ? '#4CAF50' : '#888888',
      font: 'bold 12px Arial',
      textAlign: 'left'
    });
  }
  
  /**
   * Render select control
   */
  private renderSelect(renderer: CanvasRenderer, item: SettingsMenuItem, x: number, y: number, width: number, isSelected: boolean): void {
    if (!item.category || !item.key || !item.options) return;
    
    const value = this.settingsSystem.getSetting(item.category as any, item.key as any) as string;
    
    // Select box
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = isSelected ? '#FFD700' : '#666666';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y - 15, width, 25);
    ctx.strokeRect(x, y - 15, width, 25);
    ctx.restore();
    
    // Current value
    renderer.drawScreenText(value.toUpperCase(), x + 10, y + 3, {
      fillStyle: '#CCCCCC',
      font: '14px Arial',
      textAlign: 'left'
    });
    
    // Dropdown arrow
    renderer.drawScreenText('▼', x + width - 20, y + 3, {
      fillStyle: isSelected ? '#FFD700' : '#888888',
      font: '12px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render key binding control
   */
  private renderKeyBinding(renderer: CanvasRenderer, item: SettingsMenuItem, x: number, y: number, width: number, isSelected: boolean): void {
    if (!item.category || !item.key) return;
    
    const value = this.settingsSystem.getSetting(item.category as any, item.key as any) as string;
    const isCapturing = this.pendingKeyCapture === item.id;
    
    // Key box
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = isCapturing ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = isSelected ? '#FFD700' : (isCapturing ? '#FF6B6B' : '#666666');
    ctx.lineWidth = 2;
    ctx.fillRect(x, y - 15, width, 25);
    ctx.strokeRect(x, y - 15, width, 25);
    ctx.restore();
    
    // Key text
    const displayText = isCapturing ? 'Press key...' : value;
    renderer.drawScreenText(displayText, x + width / 2, y + 3, {
      fillStyle: isCapturing ? '#FFD700' : '#CCCCCC',
      font: isCapturing ? 'bold 14px Arial' : '14px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render button control
   */
  private renderButton(renderer: CanvasRenderer, item: SettingsMenuItem, x: number, y: number, width: number, isSelected: boolean): void {
    // Button background
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = isSelected ? 'rgba(74, 144, 226, 0.3)' : 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = isSelected ? '#FFD700' : '#666666';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y - 15, width, 25);
    ctx.strokeRect(x, y - 15, width, 25);
    ctx.restore();
    
    // Button text
    renderer.drawScreenText(item.label, x + width / 2, y + 3, {
      fillStyle: isSelected ? '#FFD700' : '#CCCCCC',
      font: isSelected ? 'bold 14px Arial' : '14px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Render action buttons
   */
  private renderActionButtons(renderer: CanvasRenderer, viewport: any): void {
    const buttonsY = viewport.height - 120;
    const buttonWidth = 120;
    const buttonSpacing = 140;
    const centerX = viewport.width / 2;
    
    const buttons = [
      { label: 'Reset All', action: 'reset' },
      { label: 'Export', action: 'export' },
      { label: 'Import', action: 'import' },
      { label: 'Back', action: 'back' }
    ];
    
    const startX = centerX - (buttons.length * buttonSpacing) / 2;
    
    buttons.forEach((button, index) => {
      const x = startX + index * buttonSpacing;
      const isBack = button.action === 'back';
      
      // Button background
      const ctx = renderer.getContext();
      ctx.save();
      ctx.fillStyle = isBack ? 'rgba(76, 175, 80, 0.3)' : 'rgba(74, 144, 226, 0.3)';
      ctx.strokeStyle = isBack ? '#4CAF50' : '#4A90E2';
      ctx.lineWidth = 2;
      ctx.fillRect(x - buttonWidth / 2, buttonsY - 15, buttonWidth, 30);
      ctx.strokeRect(x - buttonWidth / 2, buttonsY - 15, buttonWidth, 30);
      ctx.restore();
      
      // Button text
      renderer.drawScreenText(button.label, x, buttonsY + 3, {
        fillStyle: '#FFFFFF',
        font: 'bold 14px Arial',
        textAlign: 'center'
      });
    });
  }
  
  /**
   * Render key capture overlay
   */
  private renderKeyCaptureOverlay(renderer: CanvasRenderer, viewport: any): void {
    // Dark overlay
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    ctx.restore();
    
    // Capture dialog
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    
    renderer.drawScreenText('Press any key to bind...', centerX, centerY - 20, {
      fillStyle: '#FFD700',
      font: 'bold 24px Arial',
      textAlign: 'center'
    });
    
    renderer.drawScreenText('ESC to cancel', centerX, centerY + 20, {
      fillStyle: '#CCCCCC',
      font: '16px Arial',
      textAlign: 'center'
    });
  }
  
  /**
   * Get menu items for current category
   */
  private getMenuItemsForCategory(category: string): SettingsMenuItem[] {
    switch (category) {
      case 'audio':
        return [
          { id: 'master_volume', label: 'Master Volume', type: 'slider', category: 'audio', key: 'masterVolume', min: 0, max: 1, step: 0.1 },
          { id: 'music_volume', label: 'Music Volume', type: 'slider', category: 'audio', key: 'musicVolume', min: 0, max: 1, step: 0.1 },
          { id: 'sfx_volume', label: 'SFX Volume', type: 'slider', category: 'audio', key: 'sfxVolume', min: 0, max: 1, step: 0.1 },
          { id: 'mute_all', label: 'Mute All Audio', type: 'toggle', category: 'audio', key: 'muteAll' }
        ];
      case 'graphics':
        return [
          { id: 'quality', label: 'Graphics Quality', type: 'select', category: 'graphics', key: 'quality', options: ['low', 'medium', 'high'] },
          { id: 'particles', label: 'Particle Effects', type: 'toggle', category: 'graphics', key: 'particleEffects' },
          { id: 'screen_shake', label: 'Screen Shake', type: 'toggle', category: 'graphics', key: 'screenShake' },
          { id: 'show_fps', label: 'Show FPS', type: 'toggle', category: 'graphics', key: 'showFPS' },
          { id: 'fullscreen', label: 'Fullscreen', type: 'toggle', category: 'graphics', key: 'fullscreen' }
        ];
      case 'gameplay':
        return [
          { id: 'auto_collect', label: 'Auto-Collect Coins', type: 'toggle', category: 'gameplay', key: 'autoCollectCoins' },
          { id: 'pause_focus', label: 'Pause on Focus Loss', type: 'toggle', category: 'gameplay', key: 'pauseOnFocusLoss' },
          { id: 'confirm_exit', label: 'Confirm Exit', type: 'toggle', category: 'gameplay', key: 'confirmExit' },
          { id: 'damage_numbers', label: 'Show Damage Numbers', type: 'toggle', category: 'gameplay', key: 'showDamageNumbers' },
          { id: 'health_bars', label: 'Enemy Health Bars', type: 'toggle', category: 'gameplay', key: 'enemyHealthBars' }
        ];
      case 'controls':
        return [
          { id: 'pause_key', label: 'Pause Key', type: 'key', category: 'controls', key: 'pauseKey' },
          { id: 'skill_tree_key', label: 'Skill Tree Key', type: 'key', category: 'controls', key: 'skillTreeKey' },
          { id: 'restart_key', label: 'Quick Restart Key', type: 'key', category: 'controls', key: 'quickRestartKey' },
          { id: 'click_mode', label: 'Mouse Click Mode', type: 'select', category: 'controls', key: 'mouseClickMode', options: ['single', 'hold', 'auto'] },
          { id: 'shortcuts', label: 'Keyboard Shortcuts', type: 'toggle', category: 'controls', key: 'keyboardShortcuts' }
        ];
      default:
        return [];
    }
  }
  
  public handleInput(event: InputEvent): void {
    // Handle key capture mode
    if (this.pendingKeyCapture && event.type === 'keydown' && event.key) {
      if (event.key === 'Escape') {
        this.pendingKeyCapture = null;
      } else {
        // Bind the key
        const menuItems = this.getMenuItemsForCategory(this.currentCategory);
        const item = menuItems.find(item => item.id === this.pendingKeyCapture);
        if (item && item.category && item.key) {
          // @ts-ignore - TypeScript limitation with generic dynamic key access
          this.settingsSystem.updateSetting(item.category, item.key, event.key);
        }
        this.pendingKeyCapture = null;
      }
      return;
    }
    
    // Regular input handling
    if (event.type === 'keydown' && event.key) {
      switch (event.key) {
        case 'ArrowLeft':
          this.switchCategory(-1);
          break;
        case 'ArrowRight':
          this.switchCategory(1);
          break;
        case 'ArrowUp':
          this.changeSelection(-1);
          break;
        case 'ArrowDown':  
          this.changeSelection(1);
          break;
        case 'Enter':
        case ' ':
          this.activateCurrentItem();
          break;
        case 'Escape':
          this.goBack();
          break;
      }
    } else if (event.type === 'click') {
      // Handle click events (simplified for now)
      this.activateCurrentItem();
    }
  }
  
  /**
   * Switch category
   */
  private switchCategory(direction: number): void {
    const currentIndex = this.categories.findIndex(cat => cat.id === this.currentCategory);
    const newIndex = Math.max(0, Math.min(this.categories.length - 1, currentIndex + direction));
    this.currentCategory = this.categories[newIndex].id as any;
    this.selectedItemIndex = 0;
  }
  
  /**
   * Change selected item
   */
  private changeSelection(direction: number): void {
    const menuItems = this.getMenuItemsForCategory(this.currentCategory);
    this.selectedItemIndex = Math.max(0, Math.min(menuItems.length - 1, this.selectedItemIndex + direction));
  }
  
  /**
   * Activate current item
   */
  private activateCurrentItem(): void {
    const menuItems = this.getMenuItemsForCategory(this.currentCategory);
    const currentItem = menuItems[this.selectedItemIndex];
    
    if (!currentItem) return;
    
    switch (currentItem.type) {
      case 'toggle':
        if (currentItem.category && currentItem.key) {
          // @ts-ignore - TypeScript limitation with generic dynamic key access
          const currentValue = this.settingsSystem.getSetting(currentItem.category, currentItem.key) as boolean;
          // @ts-ignore - TypeScript limitation with generic dynamic key access
          this.settingsSystem.updateSetting(currentItem.category, currentItem.key, !currentValue);
        }
        break;
      case 'select':
        if (currentItem.category && currentItem.key && currentItem.options) {
          // @ts-ignore - TypeScript limitation with generic dynamic key access
          const currentValue = this.settingsSystem.getSetting(currentItem.category, currentItem.key) as string;
          const currentIndex = currentItem.options.indexOf(currentValue);
          const nextIndex = (currentIndex + 1) % currentItem.options.length;
          // @ts-ignore - TypeScript limitation with generic dynamic key access
          this.settingsSystem.updateSetting(currentItem.category, currentItem.key, currentItem.options[nextIndex]);
        }
        break;
      case 'key':
        this.pendingKeyCapture = currentItem.id;
        break;
      case 'slider':
        // For now, just increment by step amount
        if (currentItem.category && currentItem.key) {
          // @ts-ignore - TypeScript limitation with generic dynamic key access
          const currentValue = this.settingsSystem.getSetting(currentItem.category, currentItem.key) as number;
          const step = currentItem.step || 0.1;
          const max = currentItem.max || 1;
          const newValue = Math.min(max, currentValue + step);
          // @ts-ignore - TypeScript limitation with generic dynamic key access
          this.settingsSystem.updateSetting(currentItem.category, currentItem.key, newValue);
        }
        break;
    }
  }
  
  /**
   * Go back to previous state
   */
  private goBack(): void {
    if (this.stateManager) {
      this.stateManager.changeState(this.returnToState);
    }
  }
}