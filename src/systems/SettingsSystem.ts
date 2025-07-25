// Settings System - Manages game configuration and user preferences
export interface GameSettings {
  audio: {
    masterVolume: number;      // 0.0 - 1.0
    musicVolume: number;       // 0.0 - 1.0
    sfxVolume: number;         // 0.0 - 1.0
    muteAll: boolean;
  };
  graphics: {
    quality: 'low' | 'medium' | 'high';
    particleEffects: boolean;
    screenShake: boolean;
    showFPS: boolean;
    fullscreen: boolean;
  };
  gameplay: {
    autoCollectCoins: boolean;
    pauseOnFocusLoss: boolean;
    confirmExit: boolean;
    showDamageNumbers: boolean;
    enemyHealthBars: boolean;
  };
  controls: {
    pauseKey: string;
    skillTreeKey: string;
    quickRestartKey: string;
    mouseClickMode: 'single' | 'hold' | 'auto';
    keyboardShortcuts: boolean;
  };
}

export class SettingsSystem {
  private settings: GameSettings;
  private readonly STORAGE_KEY = 'towerGuardianSettings';
  
  // Default settings
  private readonly DEFAULT_SETTINGS: GameSettings = {
    audio: {
      masterVolume: 0.8,
      musicVolume: 0.6,
      sfxVolume: 0.8,
      muteAll: false
    },
    graphics: {
      quality: 'medium',
      particleEffects: true,
      screenShake: true,
      showFPS: false,
      fullscreen: false
    },
    gameplay: {
      autoCollectCoins: false,
      pauseOnFocusLoss: true,
      confirmExit: true,
      showDamageNumbers: true,
      enemyHealthBars: true
    },
    controls: {
      pauseKey: 'Escape',
      skillTreeKey: 'F1',
      quickRestartKey: 'R',
      mouseClickMode: 'single',
      keyboardShortcuts: true
    }
  };
  
  // Event callbacks
  private onSettingsChangedCallbacks: Array<(settings: GameSettings) => void> = [];
  
  constructor() {
    this.settings = { ...this.DEFAULT_SETTINGS };
    this.loadFromStorage();
    console.log('⚙️ SettingsSystem initialized');
  }
  
  /**
   * Get current settings
   */
  public getSettings(): GameSettings {
    return { ...this.settings };
  }
  
  /**
   * Get a specific setting value
   */
  public getSetting<T extends keyof GameSettings>(
    category: T,
    key: keyof GameSettings[T]
  ): GameSettings[T][keyof GameSettings[T]] {
    return this.settings[category][key];
  }
  
  /**
   * Update a specific setting
   */
  public updateSetting<T extends keyof GameSettings>(
    category: T,
    key: keyof GameSettings[T],
    value: GameSettings[T][keyof GameSettings[T]]
  ): void {
    // @ts-ignore - TypeScript limitation with dynamic key access
    this.settings[category][key] = value;
    
    // Apply settings immediately
    this.applySettings();
    
    // Save to storage
    this.saveToStorage();
    
    // Notify callbacks
    this.notifySettingsChanged();
    
    console.log(`⚙️ Setting updated: ${String(category)}.${String(key)} = ${value}`);
  }
  
  /**
   * Update multiple settings at once
   */
  public updateSettings(newSettings: Partial<GameSettings>): void {
    // Deep merge settings
    this.settings = this.deepMerge(this.settings, newSettings);
    
    // Apply settings
    this.applySettings();
    
    // Save and notify
    this.saveToStorage();
    this.notifySettingsChanged();
    
    console.log('⚙️ Multiple settings updated');
  }
  
  /**
   * Reset all settings to defaults
   */
  public resetToDefaults(): void {
    this.settings = { ...this.DEFAULT_SETTINGS };
    this.applySettings();
    this.saveToStorage();
    this.notifySettingsChanged();
    console.log('⚙️ Settings reset to defaults');
  }
  
  /**
   * Reset specific category to defaults
   */
  public resetCategoryToDefaults<T extends keyof GameSettings>(category: T): void {
    this.settings[category] = { ...this.DEFAULT_SETTINGS[category] };
    this.applySettings();
    this.saveToStorage();
    this.notifySettingsChanged();
    console.log(`⚙️ ${String(category)} settings reset to defaults`);
  }
  
  /**
   * Apply settings to the game systems
   */
  private applySettings(): void {
    // Apply audio settings
    this.applyAudioSettings();
    
    // Apply graphics settings
    this.applyGraphicsSettings();
    
    // Apply gameplay settings
    this.applyGameplaySettings();
    
    // Apply control settings
    this.applyControlSettings();
  }
  
  /**
   * Apply audio settings
   */
  private applyAudioSettings(): void {
    const audio = this.settings.audio;
    
    // In a full implementation, this would interact with an AudioManager
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      // Set global volume levels
      // This is a placeholder - in a real game you'd have an AudioManager
      console.log(`🔊 Audio: Master=${audio.masterVolume}, Music=${audio.musicVolume}, SFX=${audio.sfxVolume}, Muted=${audio.muteAll}`);
    }
  }
  
  /**
   * Apply graphics settings
   */
  private applyGraphicsSettings(): void {
    const graphics = this.settings.graphics;
    
    // Apply quality settings (would affect renderer settings)
    console.log(`🎨 Graphics: Quality=${graphics.quality}, Particles=${graphics.particleEffects}, Shake=${graphics.screenShake}`);
    
    // Handle fullscreen
    if (graphics.fullscreen && document.fullscreenEnabled) {
      // Request fullscreen in a real implementation
      console.log('🖥️ Fullscreen mode requested');
    }
  }
  
  /**
   * Apply gameplay settings
   */
  private applyGameplaySettings(): void {
    const gameplay = this.settings.gameplay;
    console.log(`🎮 Gameplay: AutoCollect=${gameplay.autoCollectCoins}, PauseOnFocus=${gameplay.pauseOnFocusLoss}`);
    
    // Set up focus loss handling
    if (gameplay.pauseOnFocusLoss) {
      this.setupFocusLossHandling();
    }
  }
  
  /**
   * Apply control settings
   */
  private applyControlSettings(): void {
    const controls = this.settings.controls;
    console.log(`🎯 Controls: Pause=${controls.pauseKey}, SkillTree=${controls.skillTreeKey}, Mode=${controls.mouseClickMode}`);
  }
  
  /**
   * Set up focus loss handling
   */
  private setupFocusLossHandling(): void {
    if (typeof window !== 'undefined') {
      // Remove existing listeners to avoid duplicates
      window.removeEventListener('blur', this.handleFocusLoss);
      window.removeEventListener('focus', this.handleFocusGain);
      
      if (this.settings.gameplay.pauseOnFocusLoss) {
        window.addEventListener('blur', this.handleFocusLoss);
        window.addEventListener('focus', this.handleFocusGain);
      }
    }
  }
  
  /**
   * Handle window focus loss
   */
  private handleFocusLoss = (): void => {
    console.log('👁️ Window focus lost - auto-pausing game');
    // In a full implementation, this would trigger a pause
    // You'd emit an event or call a game pause method
  };
  
  /**
   * Handle window focus gain
   */
  private handleFocusGain = (): void => {
    console.log('👁️ Window focus regained');
  };
  
  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // @ts-ignore - TypeScript limitation with deep merging
        result[key] = this.deepMerge(result[key], source[key]);
      } else if (source[key] !== undefined) {
        // @ts-ignore
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  /**
   * Save settings to localStorage
   */
  public saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
      console.log('💾 Settings saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
    }
  }
  
  /**
   * Load settings from localStorage
   */
  public loadFromStorage(): void {
    try {
      const savedSettings = localStorage.getItem(this.STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = this.deepMerge(this.DEFAULT_SETTINGS, parsed);
        this.applySettings();
        console.log('💾 Settings loaded from localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      this.settings = { ...this.DEFAULT_SETTINGS };
    }
  }
  
  /**
   * Export settings as JSON string
   */
  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }
  
  /**
   * Import settings from JSON string
   */
  public importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // Validate the imported settings structure
      if (this.validateSettings(importedSettings)) {
        this.settings = this.deepMerge(this.DEFAULT_SETTINGS, importedSettings);
        this.applySettings();
        this.saveToStorage();
        this.notifySettingsChanged();
        console.log('📥 Settings imported successfully');
        return true;
      } else {
        console.error('❌ Invalid settings format');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      return false;
    }
  }
  
  /**
   * Validate settings structure
   */
  private validateSettings(settings: any): boolean {
    if (!settings || typeof settings !== 'object') return false;
    
    // Check for required categories
    const requiredCategories = ['audio', 'graphics', 'gameplay', 'controls'];
    for (const category of requiredCategories) {
      if (!settings[category] || typeof settings[category] !== 'object') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get settings summary for display
   */
  public getSettingsSummary(): {
    audioEnabled: boolean;
    graphicsQuality: string;
    keyboardShortcuts: boolean;
    totalSettings: number;
  } {
    return {
      audioEnabled: !this.settings.audio.muteAll,
      graphicsQuality: this.settings.graphics.quality,
      keyboardShortcuts: this.settings.controls.keyboardShortcuts,
      totalSettings: this.countTotalSettings()
    };
  }
  
  /**
   * Count total number of settings
   */
  private countTotalSettings(): number {
    let count = 0;
    for (const category of Object.values(this.settings)) {
      count += Object.keys(category).length;
    }
    return count;
  }
  
  /**
   * Subscribe to settings changes
   */
  public onSettingsChanged(callback: (settings: GameSettings) => void): void {
    this.onSettingsChangedCallbacks.push(callback);
  }
  
  /**
   * Unsubscribe from settings changes
   */
  public offSettingsChanged(callback: (settings: GameSettings) => void): void {
    const index = this.onSettingsChangedCallbacks.indexOf(callback);
    if (index > -1) {
      this.onSettingsChangedCallbacks.splice(index, 1);
    }
  }
  
  /**
   * Notify all callbacks of settings changes
   */
  private notifySettingsChanged(): void {
    for (const callback of this.onSettingsChangedCallbacks) {
      callback(this.getSettings());
    }
  }
  
  /**
   * Get default settings (for reset functionality)
   */
  public getDefaultSettings(): GameSettings {
    return { ...this.DEFAULT_SETTINGS };
  }

  /**
   * Load from SaveManager data
   */
  public loadFromSaveData(data: any): void {
    if (data && typeof data === 'object') {
      this.settings = this.deepMerge(this.DEFAULT_SETTINGS, data);
      this.applySettings();
      console.log('💾 Settings loaded from SaveManager data');
    }
  }
}