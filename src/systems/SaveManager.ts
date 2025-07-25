// Save Manager - Centralized save system with validation and corruption recovery
export interface GameSaveData {
  version: string;
  timestamp: number;
  checksum: string;
  skillTree: {
    unlockedSkills: string[];
    totalCoinsSpent: number;
  };
  currency: {
    totalCoins: number;
    lifetimeCoinsEarned: number;
  };
  statistics: {
    gamesPlayed: number;
    highestWave: number;
    totalEnemiesKilled: number;
    totalPlayTime: number;
    averageWavesSurvived: number;
  };
  settings: {
    audio: any;
    graphics: any;
    gameplay: any;
    controls: any;
  };
}

export interface SaveSlot {
  id: string;
  name: string;
  data: GameSaveData;
  isBackup: boolean;
  lastModified: number;
}

export class SaveManager {
  private readonly SAVE_VERSION = '1.0.0';
  private readonly PRIMARY_SAVE_KEY = 'towerGuardian_save_primary';
  private readonly BACKUP_SAVE_KEY = 'towerGuardian_save_backup';
  private readonly SETTINGS_SAVE_KEY = 'towerGuardian_settings';
  private readonly MAX_SAVE_ATTEMPTS = 3;
  
  // Statistics tracking
  private sessionStartTime: number = 0;
  private currentSessionStats = {
    wavesSurvived: 0,
    enemiesKilled: 0,
    coinsEarned: 0
  };
  
  // Auto-save settings
  private autoSaveEnabled: boolean = true;
  private autoSaveInterval: number = 30000; // 30 seconds
  private lastAutoSave: number = 0;
  
  constructor() {
    this.sessionStartTime = Date.now();
    console.log('💾 SaveManager initialized');
    
    // Set up auto-save if enabled
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }
  }
  
  /**
   * Save complete game data to primary and backup slots
   */
  public saveGame(data: Partial<GameSaveData>): boolean {
    try {
      const saveData = this.buildSaveData(data);
      
      // Validate data before saving
      if (!this.validateSaveData(saveData)) {
        console.error('💾 Save validation failed');
        return false;
      }
      
      // Generate checksum
      saveData.checksum = this.generateChecksum(saveData);
      
      // Save to primary slot
      const primarySuccess = this.saveToSlot(this.PRIMARY_SAVE_KEY, saveData);
      
      // Save to backup slot
      const backupSuccess = this.saveToSlot(this.BACKUP_SAVE_KEY, saveData);
      
      if (primarySuccess || backupSuccess) {
        console.log('💾 Game saved successfully');
        return true;
      } else {
        console.error('💾 Failed to save to both primary and backup slots');
        return false;
      }
    } catch (error) {
      console.error('💾 Save error:', error);
      return false;
    }
  }
  
  /**
   * Load game data with corruption recovery
   */
  public loadGame(): GameSaveData | null {
    try {
      // Try primary save first
      let saveData = this.loadFromSlot(this.PRIMARY_SAVE_KEY);
      
      if (!saveData || !this.validateSaveData(saveData) || !this.verifyChecksum(saveData)) {
        console.warn('💾 Primary save corrupted or invalid, trying backup...');
        
        // Try backup save
        saveData = this.loadFromSlot(this.BACKUP_SAVE_KEY);
        
        if (!saveData || !this.validateSaveData(saveData) || !this.verifyChecksum(saveData)) {
          console.warn('💾 Backup save also corrupted, creating fresh save');
          return this.createFreshSave();
        } else {
          // Backup is good, restore it to primary
          this.saveToSlot(this.PRIMARY_SAVE_KEY, saveData);
          console.log('💾 Restored from backup save');
        }
      }
      
      console.log('💾 Game loaded successfully');
      return saveData;
    } catch (error) {
      console.error('💾 Load error:', error);
      return this.createFreshSave();
    }
  }
  
  /**
   * Update session statistics
   */
  public updateSessionStats(stats: Partial<typeof this.currentSessionStats>): void {
    Object.assign(this.currentSessionStats, stats);
  }
  
  /**
   * Get current session statistics
   */
  public getSessionStats(): typeof this.currentSessionStats {
    return { ...this.currentSessionStats };
  }
  
  /**
   * Export save data for backup/sharing
   */
  public exportSave(): string | null {
    try {
      const saveData = this.loadGame();
      if (!saveData) return null;
      
      return btoa(JSON.stringify(saveData));
    } catch (error) {
      console.error('💾 Export error:', error);
      return null;
    }
  }
  
  /**
   * Import save data from backup/sharing
   */
  public importSave(encodedData: string): boolean {
    try {
      const saveData = JSON.parse(atob(encodedData)) as GameSaveData;
      
      if (!this.validateSaveData(saveData)) {
        console.error('💾 Import validation failed');
        return false;
      }
      
      return this.saveGame(saveData);
    } catch (error) {
      console.error('💾 Import error:', error);
      return false;
    }
  }
  
  /**
   * Delete all save data
   */
  public deleteSave(): boolean {
    try {
      localStorage.removeItem(this.PRIMARY_SAVE_KEY);
      localStorage.removeItem(this.BACKUP_SAVE_KEY);
      localStorage.removeItem(this.SETTINGS_SAVE_KEY);
      
      console.log('💾 All save data deleted');
      return true;
    } catch (error) {
      console.error('💾 Delete error:', error);
      return false;
    }
  }
  
  /**
   * Check if save data exists
   */
  public hasSaveData(): boolean {
    return localStorage.getItem(this.PRIMARY_SAVE_KEY) !== null ||
           localStorage.getItem(this.BACKUP_SAVE_KEY) !== null;
  }
  
  /**
   * Get save data size in bytes
   */
  public getSaveDataSize(): number {
    const primary = localStorage.getItem(this.PRIMARY_SAVE_KEY) || '';
    const backup = localStorage.getItem(this.BACKUP_SAVE_KEY) || '';
    const settings = localStorage.getItem(this.SETTINGS_SAVE_KEY) || '';
    
    return new Blob([primary + backup + settings]).size;
  }
  
  /**
   * Build complete save data structure
   */
  private buildSaveData(partialData: Partial<GameSaveData>): GameSaveData {
    const sessionTime = (Date.now() - this.sessionStartTime) / 1000;
    
    return {
      version: this.SAVE_VERSION,
      timestamp: Date.now(),
      checksum: '', // Will be generated later
      skillTree: {
        unlockedSkills: [],
        totalCoinsSpent: 0,
        ...partialData.skillTree
      },
      currency: {
        totalCoins: 0,
        lifetimeCoinsEarned: 0,
        ...partialData.currency
      },
      statistics: {
        gamesPlayed: 0,
        highestWave: 0,
        totalEnemiesKilled: 0,
        averageWavesSurvived: 0,
        ...partialData.statistics,
        totalPlayTime: (partialData.statistics?.totalPlayTime || 0) + sessionTime
      },
      settings: {
        audio: {},
        graphics: {},
        gameplay: {},
        controls: {},
        ...partialData.settings
      }
    };
  }
  
  /**
   * Validate save data structure and content
   */
  private validateSaveData(data: any): data is GameSaveData {
    if (!data || typeof data !== 'object') return false;
    
    // Check required fields
    const requiredFields = ['version', 'timestamp', 'skillTree', 'currency', 'statistics', 'settings'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`💾 Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate skill tree data
    if (!data.skillTree.unlockedSkills || !Array.isArray(data.skillTree.unlockedSkills)) {
      console.error('💾 Invalid skill tree data');
      return false;
    }
    
    // Validate currency data
    if (typeof data.currency.totalCoins !== 'number' || data.currency.totalCoins < 0) {
      console.error('💾 Invalid currency data');
      return false;
    }
    
    // Validate statistics data
    if (typeof data.statistics.gamesPlayed !== 'number' || data.statistics.gamesPlayed < 0) {
      console.error('💾 Invalid statistics data');
      return false;
    }
    
    return true;
  }
  
  /**
   * Generate checksum for save data integrity
   */
  private generateChecksum(data: GameSaveData): string {
    const dataString = JSON.stringify({
      version: data.version,
      skillTree: data.skillTree,
      currency: data.currency,
      statistics: data.statistics,
      settings: data.settings
    });
    
    // Simple hash function (in a real game, use a proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }
  
  /**
   * Verify checksum of loaded data
   */
  private verifyChecksum(data: GameSaveData): boolean {
    const savedChecksum = data.checksum;
    const calculatedChecksum = this.generateChecksum(data);
    
    const isValid = savedChecksum === calculatedChecksum;
    if (!isValid) {
      console.error('💾 Checksum verification failed');
    }
    
    return isValid;
  }
  
  /**
   * Save data to a specific slot
   */
  private saveToSlot(key: string, data: GameSaveData): boolean {
    for (let attempt = 0; attempt < this.MAX_SAVE_ATTEMPTS; attempt++) {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
        
        // Verify the save by reading it back
        const verification = localStorage.getItem(key);
        if (verification === serialized) {
          return true;
        }
      } catch (error) {
        console.warn(`💾 Save attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.MAX_SAVE_ATTEMPTS - 1) {
          console.error(`💾 Failed to save to ${key} after ${this.MAX_SAVE_ATTEMPTS} attempts`);
        }
      }
    }
    
    return false;
  }
  
  /**
   * Load data from a specific slot
   */
  private loadFromSlot(key: string): GameSaveData | null {
    try {
      const serialized = localStorage.getItem(key);
      if (!serialized) return null;
      
      return JSON.parse(serialized) as GameSaveData;
    } catch (error) {
      console.error(`💾 Failed to load from ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Create fresh save data when no valid save exists
   */
  private createFreshSave(): GameSaveData {
    return this.buildSaveData({});
  }
  
  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    setInterval(() => {
      if (Date.now() - this.lastAutoSave >= this.autoSaveInterval) {
        this.performAutoSave();
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Perform auto-save (to be called by game systems)
   */
  private performAutoSave(): void {
    // This will be called by the main game to trigger auto-saves
    // The actual save data will be provided by the game systems
    this.lastAutoSave = Date.now();
    console.log('💾 Auto-save triggered');
  }
  
  /**
   * Enable/disable auto-save
   */
  public setAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
    console.log(`💾 Auto-save ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Manually trigger auto-save
   */
  public triggerAutoSave(data: Partial<GameSaveData>): void {
    if (this.autoSaveEnabled) {
      this.saveGame(data);
      this.lastAutoSave = Date.now();
    }
  }
  
  /**
   * Get save manager statistics
   */
  public getStats(): {
    hasValidSave: boolean;
    saveDataSize: number;
    lastAutoSave: number;
    autoSaveEnabled: boolean;
    sessionStartTime: number;
  } {
    return {
      hasValidSave: this.hasSaveData(),
      saveDataSize: this.getSaveDataSize(),
      lastAutoSave: this.lastAutoSave,
      autoSaveEnabled: this.autoSaveEnabled,
      sessionStartTime: this.sessionStartTime
    };
  }
}