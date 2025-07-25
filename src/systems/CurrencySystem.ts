// Currency System - Manages coins, rewards, and persistent currency between runs
export interface CoinData {
  amount: number;
  x: number;
  y: number;
  id: string;
  createdTime: number;
}

export interface CurrencyStats {
  totalCoins: number;
  coinsThisRun: number;
  coinsSpentThisRun: number;
  coinCollectionEffects: CoinCollectionEffect[];
}

export interface CoinCollectionEffect {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  amount: number;
  progress: number;
  alpha: number;
  scale: number;
}

export class CurrencySystem {
  private totalCoins: number = 0;
  private coinsThisRun: number = 0;
  private coinsSpentThisRun: number = 0;
  private droppedCoins: Map<string, CoinData> = new Map();
  private coinCollectionEffects: CoinCollectionEffect[] = [];
  
  // Visual settings
  private coinRadius: number = 8;
  private coinPickupRadius: number = 25;
  private coinLifetime: number = 30; // seconds before coins disappear
  private magnetRange: number = 60; // range for auto-pickup
  private collectionAnimationDuration: number = 0.8; // seconds
  
  // Events
  private onCoinCollectedCallbacks: Array<(amount: number, totalCoins: number) => void> = [];
  private onCoinDroppedCallbacks: Array<(coinData: CoinData) => void> = [];
  
  constructor() {
    this.loadPersistentData();
    console.log('💰 CurrencySystem initialized with', this.totalCoins, 'total coins');
  }
  
  /**
   * Update currency system logic
   */
  public update(deltaTime: number): void {
    this.updateDroppedCoins(deltaTime);
    this.updateCollectionEffects(deltaTime);
  }
  
  /**
   * Drop coins at a specific location
   */
  public dropCoins(amount: number, x: number, y: number): void {
    // Create multiple coin drops for larger amounts
    const numCoins = Math.min(amount, 10); // Cap visual coins at 10
    const coinValue = Math.ceil(amount / numCoins);
    
    for (let i = 0; i < numCoins; i++) {
      const coinId = this.generateCoinId();
      
      // Spread coins in a small circle
      const angle = (i / numCoins) * Math.PI * 2;
      const spread = 20;
      const coinX = x + Math.cos(angle) * spread;
      const coinY = y + Math.sin(angle) * spread;
      
      const coinData: CoinData = {
        amount: coinValue,
        x: coinX,
        y: coinY,
        id: coinId,
        createdTime: performance.now()
      };
      
      this.droppedCoins.set(coinId, coinData);
      
      // Notify coin dropped
      for (const callback of this.onCoinDroppedCallbacks) {
        callback(coinData);
      }
    }
    
    console.log(`💰 Dropped ${amount} coins (${numCoins} coin entities) at (${x}, ${y})`);
  }
  
  /**
   * Try to collect coin at position
   */
  public tryCollectCoin(x: number, y: number): boolean {
    let collected = false;
    
    for (const [coinId, coinData] of this.droppedCoins) {
      const distance = Math.sqrt((x - coinData.x) ** 2 + (y - coinData.y) ** 2);
      
      if (distance <= this.coinPickupRadius) {
        this.collectCoin(coinId, coinData);
        collected = true;
      }
    }
    
    return collected;
  }
  
  /**
   * Auto-collect coins near a position (magnetic effect)
   */
  public magnetCoins(x: number, y: number): void {
    for (const [coinId, coinData] of this.droppedCoins) {
      const distance = Math.sqrt((x - coinData.x) ** 2 + (y - coinData.y) ** 2);
      
      if (distance <= this.magnetRange) {
        this.collectCoin(coinId, coinData);
      }
    }
  }
  
  /**
   * Collect a specific coin
   */
  private collectCoin(coinId: string, coinData: CoinData): void {
    // Add to currency
    this.totalCoins += coinData.amount;
    this.coinsThisRun += coinData.amount;
    
    // Create collection effect
    this.createCollectionEffect(coinData);
    
    // Remove from dropped coins
    this.droppedCoins.delete(coinId);
    
    // Save persistent data
    this.savePersistentData();
    
    // Notify coin collected
    for (const callback of this.onCoinCollectedCallbacks) {
      callback(coinData.amount, this.totalCoins);
    }
    
    console.log(`💰 Collected ${coinData.amount} coins! Total: ${this.totalCoins}`);
  }
  
  /**
   * Spend coins
   */
  public spendCoins(amount: number): boolean {
    if (this.totalCoins >= amount) {
      this.totalCoins -= amount;
      this.coinsSpentThisRun += amount;
      this.savePersistentData();
      console.log(`💸 Spent ${amount} coins! Remaining: ${this.totalCoins}`);
      return true;
    }
    
    console.log(`❌ Not enough coins to spend ${amount}! Have: ${this.totalCoins}`);
    return false;
  }
  
  /**
   * Create visual collection effect
   */
  private createCollectionEffect(coinData: CoinData): void {
    const effect: CoinCollectionEffect = {
      id: this.generateEffectId(),
      x: coinData.x,
      y: coinData.y,
      targetX: coinData.x,
      targetY: coinData.y - 50, // Float upward
      amount: coinData.amount,
      progress: 0,
      alpha: 1,
      scale: 1
    };
    
    this.coinCollectionEffects.push(effect);
  }
  
  /**
   * Update dropped coins
   */
  private updateDroppedCoins(_deltaTime: number): void {
    const currentTime = performance.now();
    const coinsToRemove: string[] = [];
    
    for (const [coinId, coinData] of this.droppedCoins) {
      const age = (currentTime - coinData.createdTime) / 1000;
      
      // Remove expired coins
      if (age > this.coinLifetime) {
        coinsToRemove.push(coinId);
      }
    }
    
    // Remove expired coins
    for (const coinId of coinsToRemove) {
      this.droppedCoins.delete(coinId);
    }
  }
  
  /**
   * Update collection effects
   */
  private updateCollectionEffects(deltaTime: number): void {
    for (let i = this.coinCollectionEffects.length - 1; i >= 0; i--) {
      const effect = this.coinCollectionEffects[i];
      effect.progress += deltaTime / this.collectionAnimationDuration;
      
      if (effect.progress >= 1) {
        // Remove completed effect
        this.coinCollectionEffects.splice(i, 1);
      } else {
        // Update effect properties
        const easeOut = 1 - Math.pow(1 - effect.progress, 3);
        effect.y = effect.y + (effect.targetY - effect.y) * easeOut * deltaTime * 2;
        effect.alpha = 1 - effect.progress;
        effect.scale = 1 + effect.progress * 0.5;
      }
    }
  }
  
  /**
   * Render currency system visuals
   */
  public render(renderer: any): void {
    // Render dropped coins
    for (const coinData of this.droppedCoins.values()) {
      this.renderCoin(renderer, coinData);
    }
    
    // Render collection effects
    for (const effect of this.coinCollectionEffects) {
      this.renderCollectionEffect(renderer, effect);
    }
  }
  
  /**
   * Render a single coin
   */
  private renderCoin(renderer: any, coinData: CoinData): void {
    const currentTime = performance.now();
    const age = (currentTime - coinData.createdTime) / 1000;
    
    // Pulsing animation
    const pulse = 1 + Math.sin(age * 4) * 0.1;
    const radius = this.coinRadius * pulse;
    
    // Fading out near end of lifetime
    let alpha = 1;
    if (age > this.coinLifetime - 3) {
      alpha = (this.coinLifetime - age) / 3;
    }
    
    // Coin body (golden)
    renderer.drawCircle(coinData.x, coinData.y, radius, {
      fillStyle: '#FFD700',
      strokeStyle: '#FFA000',
      lineWidth: 2,
      alpha: alpha
    });
    
    // Inner shine
    renderer.drawCircle(coinData.x, coinData.y, radius * 0.6, {
      fillStyle: '#FFECB3',
      alpha: alpha * 0.8
    });
    
    // Coin symbol
    renderer.drawText('💰', coinData.x, coinData.y + 2, {
      font: '12px Arial',
      textAlign: 'center',
      alpha: alpha
    });
    
    // Amount text for valuable coins
    if (coinData.amount > 1) {
      renderer.drawText(coinData.amount.toString(), coinData.x, coinData.y - radius - 8, {
        fillStyle: '#FFD700',
        font: 'bold 10px Arial',
        textAlign: 'center',
        alpha: alpha
      });
    }
    
    // Pickup radius indicator (faint)
    if (age < 1) { // Only show for first second
      renderer.drawCircle(coinData.x, coinData.y, this.coinPickupRadius, {
        strokeStyle: '#FFD700',
        lineWidth: 1,
        alpha: alpha * 0.2 * (1 - age)
      });
    }
  }
  
  /**
   * Render collection effect
   */
  private renderCollectionEffect(renderer: any, effect: CoinCollectionEffect): void {
    const scale = effect.scale;
    const alpha = effect.alpha;
    
    // Floating "+X" text
    renderer.drawText(`+${effect.amount}`, effect.x, effect.y, {
      fillStyle: '#FFD700',
      font: `bold ${Math.floor(14 * scale)}px Arial`,
      textAlign: 'center',
      alpha: alpha
    });
    
    // Small coin icon
    renderer.drawText('💰', effect.x - 15, effect.y, {
      font: `${Math.floor(12 * scale)}px Arial`,
      textAlign: 'center',
      alpha: alpha
    });
  }
  
  /**
   * Get current currency statistics
   */
  public getStats(): CurrencyStats {
    return {
      totalCoins: this.totalCoins,
      coinsThisRun: this.coinsThisRun,
      coinsSpentThisRun: this.coinsSpentThisRun,
      coinCollectionEffects: [...this.coinCollectionEffects]
    };
  }
  
  /**
   * Get total coin count
   */
  public getTotalCoins(): number {
    return this.totalCoins;
  }
  
  /**
   * Get coins earned this run
   */
  public getCoinsThisRun(): number {
    return this.coinsThisRun;
  }
  
  /**
   * Get dropped coins for collision detection
   */
  public getDroppedCoins(): CoinData[] {
    return Array.from(this.droppedCoins.values());
  }
  
  /**
   * Reset run statistics
   */
  public resetRunStats(): void {
    this.coinsThisRun = 0;
    this.coinsSpentThisRun = 0;
    this.droppedCoins.clear();
    this.coinCollectionEffects = [];
    console.log('💰 Reset currency run statistics');
  }
  
  /**
   * Save persistent currency data
   */
  private savePersistentData(): void {
    try {
      const data = {
        totalCoins: this.totalCoins,
        lastSaved: Date.now()
      };
      localStorage.setItem('tower-guardian-currency', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save currency data:', error);
    }
  }
  
  /**
   * Load persistent currency data
   */
  private loadPersistentData(): void {
    try {
      const saved = localStorage.getItem('tower-guardian-currency');
      if (saved) {
        const data = JSON.parse(saved);
        this.totalCoins = data.totalCoins || 0;
        console.log('💰 Loaded persistent currency:', this.totalCoins, 'coins');
      }
    } catch (error) {
      console.warn('Failed to load currency data:', error);
      this.totalCoins = 0;
    }
  }
  
  /**
   * Event subscription methods
   */
  public onCoinCollected(callback: (amount: number, totalCoins: number) => void): void {
    this.onCoinCollectedCallbacks.push(callback);
  }
  
  public onCoinDropped(callback: (coinData: CoinData) => void): void {
    this.onCoinDroppedCallbacks.push(callback);
  }
  
  /**
   * Utility methods
   */
  private generateCoinId(): string {
    return `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateEffectId(): string {
    return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Debug methods
   */
  public getDebugInfo(): {
    totalCoins: number;
    coinsThisRun: number;
    droppedCoins: number;
    collectionEffects: number;
  } {
    return {
      totalCoins: this.totalCoins,
      coinsThisRun: this.coinsThisRun,
      droppedCoins: this.droppedCoins.size,
      collectionEffects: this.coinCollectionEffects.length
    };
  }
  
  /**
   * Add coins directly (for testing/rewards)
   */
  public addCoins(amount: number): void {
    this.totalCoins += amount;
    this.coinsThisRun += amount;
    this.savePersistentData();
    
    // Notify coin collected
    for (const callback of this.onCoinCollectedCallbacks) {
      callback(amount, this.totalCoins);
    }
    
    console.log(`💰 Added ${amount} coins directly! Total: ${this.totalCoins}`);
  }

  /**
   * Get save data for SaveManager
   */
  public getSaveData(): { totalCoins: number; lifetimeCoinsEarned: number } {
    return {
      totalCoins: this.totalCoins,
      lifetimeCoinsEarned: this.totalCoins + this.coinsSpentThisRun // Approximate lifetime
    };
  }

  /**
   * Load from SaveManager data
   */
  public loadFromSaveData(data: { totalCoins: number; lifetimeCoinsEarned: number }): void {
    this.totalCoins = data.totalCoins || 0;
    console.log('💾 Currency system loaded from SaveManager data');
  }
}