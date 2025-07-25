// Skill Tree State - Game state for skill tree interface
import { GameState, GameStateType, GameStateData, InputEvent } from '../core/GameState.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';
import { SkillTreeSystem } from '../systems/SkillTreeSystem.js';
import { SkillTreeRenderer } from '../systems/SkillTreeRenderer.js';
import { CurrencySystem } from '../systems/CurrencySystem.js';

export class SkillTreeState extends GameState {
  private skillTree: SkillTreeSystem;
  private skillTreeRenderer: SkillTreeRenderer;
  private currencySystem: CurrencySystem | null = null;
  
  // Input state
  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private scrollOffset: { x: number; y: number } = { x: 0, y: 0 };
  private scale: number = 1.0;
  
  // Animation state
  private transitionAnimation: number = 0;
  private isEntering: boolean = true;

  constructor(skillTree: SkillTreeSystem) {
    super(GameStateType.SKILL_TREE);
    this.skillTree = skillTree;
    this.skillTreeRenderer = new SkillTreeRenderer(skillTree);
    
    // Set up skill tree events
    this.setupSkillTreeEvents();
  }

  /**
   * Set currency system reference
   */
  public setCurrencySystem(currencySystem: CurrencySystem): void {
    this.currencySystem = currencySystem;
  }

  /**
   * Called when entering this state
   */
  public onEnter(data?: GameStateData): void {
    console.log('🌳 Entered Skill Tree State');
    
    // Load skill tree from storage
    this.skillTree.loadFromStorage();
    
    // Update available coins from currency system
    if (this.currencySystem) {
      const currencyStats = this.currencySystem.getStats();
      this.skillTree.setAvailableCoins(currencyStats.totalCoins);
    }
    
    // Reset visual state
    this.transitionAnimation = 0;
    this.isEntering = true;
    this.scrollOffset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.skillTreeRenderer.setScrollOffset(0, 0);
    this.skillTreeRenderer.setScale(1.0);
    
    if (data) {
      this.setData(data);
      
      // Restore any saved scroll/zoom state
      if (data.scrollOffset) {
        this.scrollOffset = data.scrollOffset;
        this.skillTreeRenderer.setScrollOffset(data.scrollOffset.x, data.scrollOffset.y);
      }
      if (data.scale) {
        this.scale = data.scale;
        this.skillTreeRenderer.setScale(data.scale);
      }
    }
  }

  /**
   * Called when leaving this state
   */
  public onExit(): GameStateData {
    console.log('🌳 Exited Skill Tree State');
    
    // Save skill tree state
    this.skillTree.saveToStorage();
    
    // Update currency system with remaining coins
    if (this.currencySystem) {
      const remainingCoins = this.skillTree.getAvailableCoins();
      // This would need a method to update total coins in currency system
      // For now, we'll just log it
      console.log(`💰 Remaining coins: ${remainingCoins}`);
    }
    
    return {
      ...this.getData(),
      scrollOffset: this.scrollOffset,
      scale: this.scale
    };
  }

  /**
   * Update skill tree state
   */
  public update(deltaTime: number): void {
    // Update transition animation
    if (this.isEntering) {
      this.transitionAnimation += deltaTime * 3;
      if (this.transitionAnimation >= 1) {
        this.transitionAnimation = 1;
        this.isEntering = false;
      }
    }
    
    // Update skill tree system
    this.skillTree.update(deltaTime);
  }

  /**
   * Render skill tree state
   */
  public render(renderer: CanvasRenderer): void {
    const viewport = renderer.getViewport();
    
    // Background
    renderer.clear('#0a0a0a');
    
    // Apply transition animation
    if (this.isEntering && this.transitionAnimation < 1) {
      const alpha = this.transitionAnimation;
      renderer.setAlpha(alpha);
    }
    
    // Render skill tree
    this.skillTreeRenderer.render(renderer);
    
    // Reset alpha
    if (this.isEntering && this.transitionAnimation < 1) {
      renderer.setAlpha(1.0);
    }
    
    // Render transition overlay
    if (this.isEntering) {
      const overlayAlpha = 1 - this.transitionAnimation;
      if (overlayAlpha > 0) {
        const ctx = renderer.getContext();
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        ctx.restore();
      }
    }
    
    // Title and navigation
    this.renderHeader(renderer, viewport);
  }

  /**
   * Render header with title and navigation
   */
  private renderHeader(renderer: CanvasRenderer, viewport: any): void {
    // Background bar
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, viewport.width, 80);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 79, viewport.width, 1);
    ctx.restore();
    
    // Title
    renderer.drawScreenText('🌳 SKILL TREE', viewport.width / 2, 30, {
      fillStyle: '#FFFFFF',
      font: 'bold 28px Arial',
      textAlign: 'center'
    });
    
    // Navigation hint
    renderer.drawScreenText('ESC: Return to Game | Mouse: Pan & Zoom | Click: Purchase', viewport.width / 2, 55, {
      fillStyle: '#CCCCCC',
      font: '14px Arial',
      textAlign: 'center'
    });
  }

  /**
   * Handle input events
   */
  public handleInput(event: InputEvent): void {
    if (event.type === 'keydown' && event.key === 'Escape') {
      // Return to previous state (usually main menu or playing)
      console.log('🚪 Returning from skill tree');
      // This would be handled by the GameStateManager
      return;
    }
    
    if (event.type === 'click' && event.x !== undefined && event.y !== undefined) {
      this.handleClick(event.x, event.y);
    } else if (event.type === 'mousemove' && event.x !== undefined && event.y !== undefined) {
      this.handleMouseMove(event.x, event.y);
    }
  }

  /**
   * Handle click input
   */
  private handleClick(screenX: number, screenY: number): void {
    // Convert screen coordinates to world coordinates
    const worldPos = this.screenToWorld(screenX, screenY);
    
    // Try to click on a skill node
    const handled = this.skillTree.handleClick(worldPos.x, worldPos.y);
    
    if (handled) {
      console.log('🎯 Skill tree click handled');
    } else {
      // Clear selection if clicking empty space
      this.skillTreeRenderer.setSelectedNode(null);
    }
  }

  /**
   * Handle mouse move input
   */
  private handleMouseMove(screenX: number, screenY: number): void {
    // Handle dragging for panning
    if (this.isDragging) {
      const deltaX = screenX - this.lastMousePos.x;
      const deltaY = screenY - this.lastMousePos.y;
      
      this.scrollOffset.x += deltaX;
      this.scrollOffset.y += deltaY;
      
      this.skillTreeRenderer.setScrollOffset(this.scrollOffset.x, this.scrollOffset.y);
    }
    
    // Update hover state
    const worldPos = this.screenToWorld(screenX, screenY);
    this.skillTree.handleHover(worldPos.x, worldPos.y);
    
    this.lastMousePos = { x: screenX, y: screenY };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const viewport = { width: 800, height: 600 }; // This should come from renderer
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    
    const worldX = (screenX - centerX - this.scrollOffset.x) / this.scale;
    const worldY = (screenY - centerY - this.scrollOffset.y) / this.scale;
    
    return { x: worldX, y: worldY };
  }

  /**
   * Set up skill tree event handlers
   */
  private setupSkillTreeEvents(): void {
    this.skillTree.onNodePurchased((node) => {
      console.log(`✅ Purchased skill: ${node.name}`);
      
      // Apply skill effects immediately
      this.applySkillEffects(node);
      
      // Visual feedback
      // Could add screen shake, particle effects, etc.
    });
    
    this.skillTree.onCoinsChanged((coins) => {
      console.log(`💰 Coins updated: ${coins}`);
      
      // Update currency system if available
      if (this.currencySystem) {
        // Would need a method to set total coins
        // this.currencySystem.setTotalCoins(coins);
      }
    });
  }

  /**
   * Apply skill effects to game systems
   */
  private applySkillEffects(node: any): void {
    // This is where we would apply the skill effects to various game systems
    // For now, just log what would be applied
    
    for (const effect of node.effects) {
      console.log(`🔧 Applying effect: ${effect.type} = ${effect.value}`);
      
      // Examples of what would happen:
      // - WEAPON_UNLOCK: Activate weapon in TowerWeaponSystem
      // - TOWER_MAX_HEALTH: Increase tower health in Tower entity
      // - COIN_MULTIPLIER: Update multiplier in CurrencySystem
      // - CLICK_DAMAGE: Update click damage in click detection
      // etc.
    }
  }

  /**
   * Get skill tree system reference
   */
  public getSkillTree(): SkillTreeSystem {
    return this.skillTree;
  }

  /**
   * Enable dragging (for mouse down events)
   */
  public startDragging(x: number, y: number): void {
    this.isDragging = true;
    this.lastMousePos = { x, y };
  }

  /**
   * Disable dragging (for mouse up events)
   */
  public stopDragging(): void {
    this.isDragging = false;
  }

  /**
   * Handle zoom (for mouse wheel events)
   */
  public handleZoom(delta: number, x: number, y: number): void {
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newScale = this.scale * zoomFactor;
    
    // Clamp scale
    this.scale = Math.max(0.5, Math.min(2.0, newScale));
    this.skillTreeRenderer.setScale(this.scale);
    
    // Zoom toward mouse position
    const zoomX = x - 400; // Assuming 800 width / 2
    const zoomY = y - 300; // Assuming 600 height / 2
    
    this.scrollOffset.x += zoomX * (1 - zoomFactor);
    this.scrollOffset.y += zoomY * (1 - zoomFactor);
    
    this.skillTreeRenderer.setScrollOffset(this.scrollOffset.x, this.scrollOffset.y);
  }

  /**
   * Reset view to center
   */
  public resetView(): void {
    this.scrollOffset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.skillTreeRenderer.setScrollOffset(0, 0);
    this.skillTreeRenderer.setScale(1.0);
  }

  /**
   * Get current stats for display
   */
  public getDisplayStats(): {
    totalNodes: number;
    purchasedNodes: number;
    availableCoins: number;
    spentCoins: number;
  } {
    const stats = this.skillTree.getStats();
    
    return {
      totalNodes: this.skillTree.getAllNodes().length,
      purchasedNodes: stats.totalNodesUnlocked,
      availableCoins: this.skillTree.getAvailableCoins(),
      spentCoins: stats.totalCoinsSpent
    };
  }
}