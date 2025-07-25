// Skill Tree System - 6-branch skill tree with persistent upgrades

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  branch: SkillBranch;
  cost: number;
  tier: number; // 1-5, representing the depth in the tree
  position: { x: number; y: number }; // Position in the tree layout
  prerequisites: string[]; // IDs of required nodes
  purchased: boolean;
  maxLevel: number;
  currentLevel: number;
  icon: string; // Emoji or icon identifier
  effects: SkillEffect[];
}

export interface SkillEffect {
  type: SkillEffectType;
  value: number;
  target?: string; // Specific target for the effect
}

export enum SkillEffectType {
  // Click Enhancement Effects
  CLICK_DAMAGE = 'click_damage',
  MULTI_CLICK_RADIUS = 'multi_click_radius',
  CRITICAL_CHANCE = 'critical_chance',
  CHAIN_RANGE = 'chain_range',
  EXPLOSION_RADIUS = 'explosion_radius',
  
  // Tower Defense Effects
  TOWER_MAX_HEALTH = 'tower_max_health',
  HEALTH_REGENERATION = 'health_regeneration',
  DAMAGE_RESISTANCE = 'damage_resistance',
  EMERGENCY_SHIELD = 'emergency_shield',
  
  // Economic Effects
  COIN_MULTIPLIER = 'coin_multiplier',
  AUTO_COLLECT_RANGE = 'auto_collect_range',
  WAVE_BONUS = 'wave_bonus',
  TREASURE_SPAWN_CHANCE = 'treasure_spawn_chance',
  
  // Utility Effects
  ENEMY_SLOW_FACTOR = 'enemy_slow_factor',
  SLOW_FIELD_RADIUS = 'slow_field_radius',
  TIME_DILATION_DURATION = 'time_dilation_duration',
  AUTO_CLICK_RATE = 'auto_click_rate',
  
  // Tower Weapon Effects
  WEAPON_UNLOCK = 'weapon_unlock',
  WEAPON_DAMAGE_MULTIPLIER = 'weapon_damage_multiplier',
  WEAPON_FIRE_RATE = 'weapon_fire_rate',
  WEAPON_RANGE = 'weapon_range',
  TARGETING_MODE_UNLOCK = 'targeting_mode_unlock'
}

export enum SkillBranch {
  OFFENSIVE = 'offensive',     // Red - Click enhancements
  DEFENSIVE = 'defensive',     // Blue - Tower health & protection
  ECONOMIC = 'economic',       // Gold - Coin generation
  UTILITY = 'utility',         // Green - Special abilities
  BALLISTIC = 'ballistic',     // Orange - Physical projectile attacks
  ENERGY = 'energy'           // Purple - Beam and electric attacks
}

export interface SkillTreeStats {
  totalNodesUnlocked: number;
  totalCoinsSpent: number;
  nodesByBranch: Record<SkillBranch, number>;
  completedBranches: SkillBranch[];
}

export class SkillTreeSystem {
  private nodes: Map<string, SkillNode> = new Map();
  private availableCoins: number = 0;
  private totalCoinsSpent: number = 0;
  
  // Visual state (managed by renderer)
  // private _selectedNode: SkillNode | null = null;
  // private _hoveredNode: SkillNode | null = null;
  private scrollOffset: { x: number; y: number } = { x: 0, y: 0 };
  private scale: number = 1.0;
  
  // Animation state
  private purchaseAnimations: Array<{
    nodeId: string;
    intensity: number;
    duration: number;
  }> = [];
  
  // Events
  private onNodePurchasedCallbacks: Array<(node: SkillNode) => void> = [];
  private onCoinsChangedCallbacks: Array<(coins: number) => void> = [];

  constructor() {
    this.initializeSkillTree();
    console.log('🌳 SkillTreeSystem initialized with', this.nodes.size, 'nodes');
  }

  /**
   * Initialize the complete skill tree with all 6 branches
   */
  private initializeSkillTree(): void {
    // Offensive Branch (Red) - Click Enhancements
    this.addOffensiveBranch();
    
    // Defensive Branch (Blue) - Tower Health & Protection  
    this.addDefensiveBranch();
    
    // Economic Branch (Gold) - Coin Generation
    this.addEconomicBranch();
    
    // Utility Branch (Green) - Special Abilities
    this.addUtilityBranch();
    
    // Ballistic Weapons Branch (Orange) - Physical Projectile Attacks
    this.addBallisticBranch();
    
    // Energy Weapons Branch (Purple) - Beam and Electric Attacks
    this.addEnergyBranch();
  }

  /**
   * Add Offensive Branch nodes
   */
  private addOffensiveBranch(): void {
    this.addNode({
      id: 'offensive_basic_damage',
      name: 'Basic Damage',
      description: 'Enemies require one less click to kill',
      branch: SkillBranch.OFFENSIVE,
      cost: 5,
      tier: 1,
      position: { x: -300, y: -150 },
      prerequisites: [],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💥',
      effects: [{ type: SkillEffectType.CLICK_DAMAGE, value: 1 }]
    });

    this.addNode({
      id: 'offensive_multi_click',
      name: 'Multi-Click',
      description: 'Single click can hit multiple enemies in small area',
      branch: SkillBranch.OFFENSIVE,
      cost: 15,
      tier: 2,
      position: { x: -300, y: -100 },
      prerequisites: ['offensive_basic_damage'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🎯',
      effects: [{ type: SkillEffectType.MULTI_CLICK_RADIUS, value: 40 }]
    });

    this.addNode({
      id: 'offensive_critical_strikes',
      name: 'Critical Strikes',
      description: '20% chance to instantly kill any enemy',
      branch: SkillBranch.OFFENSIVE,
      cost: 25,
      tier: 3,
      position: { x: -300, y: -50 },
      prerequisites: ['offensive_multi_click'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '⚡',
      effects: [{ type: SkillEffectType.CRITICAL_CHANCE, value: 0.2 }]
    });

    this.addNode({
      id: 'offensive_chain_lightning',
      name: 'Chain Lightning',
      description: 'Kills can chain to nearby enemies',
      branch: SkillBranch.OFFENSIVE,
      cost: 50,
      tier: 4,
      position: { x: -300, y: 0 },
      prerequisites: ['offensive_critical_strikes'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🌩️',
      effects: [{ type: SkillEffectType.CHAIN_RANGE, value: 60 }]
    });

    this.addNode({
      id: 'offensive_explosive_clicks',
      name: 'Explosive Clicks',
      description: 'Clicks create small explosion area',
      branch: SkillBranch.OFFENSIVE,
      cost: 100,
      tier: 5,
      position: { x: -300, y: 50 },
      prerequisites: ['offensive_chain_lightning'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💣',
      effects: [{ type: SkillEffectType.EXPLOSION_RADIUS, value: 30 }]
    });
  }

  /**
   * Add Defensive Branch nodes
   */
  private addDefensiveBranch(): void {
    this.addNode({
      id: 'defensive_reinforced_tower',
      name: 'Reinforced Tower',
      description: 'Tower HP increases to 4',
      branch: SkillBranch.DEFENSIVE,
      cost: 10,
      tier: 1,
      position: { x: -100, y: -150 },
      prerequisites: [],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🛡️',
      effects: [{ type: SkillEffectType.TOWER_MAX_HEALTH, value: 1 }]
    });

    this.addNode({
      id: 'defensive_shield_regeneration',
      name: 'Shield Regeneration',
      description: 'Regain 1 HP every 5 waves survived',
      branch: SkillBranch.DEFENSIVE,
      cost: 30,
      tier: 2,
      position: { x: -100, y: -100 },
      prerequisites: ['defensive_reinforced_tower'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💚',
      effects: [{ type: SkillEffectType.HEALTH_REGENERATION, value: 1 }]
    });

    this.addNode({
      id: 'defensive_damage_resistance',
      name: 'Damage Resistance',
      description: '25% chance enemies deal no damage',
      branch: SkillBranch.DEFENSIVE,
      cost: 50,
      tier: 3,
      position: { x: -100, y: -50 },
      prerequisites: ['defensive_shield_regeneration'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🔰',
      effects: [{ type: SkillEffectType.DAMAGE_RESISTANCE, value: 0.25 }]
    });

    this.addNode({
      id: 'defensive_emergency_barrier',
      name: 'Emergency Barrier',
      description: 'Activate shield that blocks next 3 hits (once per run)',
      branch: SkillBranch.DEFENSIVE,
      cost: 75,
      tier: 4,
      position: { x: -100, y: 0 },
      prerequisites: ['defensive_damage_resistance'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🛡️',
      effects: [{ type: SkillEffectType.EMERGENCY_SHIELD, value: 3 }]
    });

    this.addNode({
      id: 'defensive_fortress',
      name: 'Fortress',
      description: 'Tower HP increases to 6',
      branch: SkillBranch.DEFENSIVE,
      cost: 150,
      tier: 5,
      position: { x: -100, y: 50 },
      prerequisites: ['defensive_emergency_barrier'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🏰',
      effects: [{ type: SkillEffectType.TOWER_MAX_HEALTH, value: 3 }]
    });
  }

  /**
   * Add Economic Branch nodes
   */
  private addEconomicBranch(): void {
    this.addNode({
      id: 'economic_coin_magnet',
      name: 'Coin Magnet',
      description: 'Coins auto-collect after 2 seconds',
      branch: SkillBranch.ECONOMIC,
      cost: 8,
      tier: 1,
      position: { x: 100, y: -150 },
      prerequisites: [],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🧲',
      effects: [{ type: SkillEffectType.AUTO_COLLECT_RANGE, value: 999 }]
    });

    this.addNode({
      id: 'economic_bonus_coins',
      name: 'Bonus Coins',
      description: '+50% coins from all sources',
      branch: SkillBranch.ECONOMIC,
      cost: 20,
      tier: 2,
      position: { x: 100, y: -100 },
      prerequisites: ['economic_coin_magnet'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💰',
      effects: [{ type: SkillEffectType.COIN_MULTIPLIER, value: 1.5 }]
    });

    this.addNode({
      id: 'economic_wave_bonus',
      name: 'Wave Bonus',
      description: 'Bonus coins for completing waves without damage',
      branch: SkillBranch.ECONOMIC,
      cost: 35,
      tier: 3,
      position: { x: 100, y: -50 },
      prerequisites: ['economic_bonus_coins'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🌊',
      effects: [{ type: SkillEffectType.WAVE_BONUS, value: 10 }]
    });

    this.addNode({
      id: 'economic_treasure_hunter',
      name: 'Treasure Hunter',
      description: 'Rare enemies spawn with 3x coin value',
      branch: SkillBranch.ECONOMIC,
      cost: 60,
      tier: 4,
      position: { x: 100, y: 0 },
      prerequisites: ['economic_wave_bonus'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💎',
      effects: [{ type: SkillEffectType.TREASURE_SPAWN_CHANCE, value: 0.1 }]
    });

    this.addNode({
      id: 'economic_golden_touch',
      name: 'Golden Touch',
      description: 'All enemies have chance to drop bonus coins',
      branch: SkillBranch.ECONOMIC,
      cost: 120,
      tier: 5,
      position: { x: 100, y: 50 },
      prerequisites: ['economic_treasure_hunter'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '✨',
      effects: [{ type: SkillEffectType.COIN_MULTIPLIER, value: 2.0 }]
    });
  }

  /**
   * Add Utility Branch nodes
   */
  private addUtilityBranch(): void {
    this.addNode({
      id: 'utility_enemy_tracker',
      name: 'Enemy Tracker',
      description: 'Visual indicators show enemy paths',
      branch: SkillBranch.UTILITY,
      cost: 12,
      tier: 1,
      position: { x: 300, y: -150 },
      prerequisites: [],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '📍',
      effects: [{ type: SkillEffectType.ENEMY_SLOW_FACTOR, value: 0 }] // Visual only
    });

    this.addNode({
      id: 'utility_slow_field',
      name: 'Slow Field',
      description: 'Enemies move 25% slower near tower',
      branch: SkillBranch.UTILITY,
      cost: 25,
      tier: 2,
      position: { x: 300, y: -100 },
      prerequisites: ['utility_enemy_tracker'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🌀',
      effects: [
        { type: SkillEffectType.ENEMY_SLOW_FACTOR, value: 0.75 },
        { type: SkillEffectType.SLOW_FIELD_RADIUS, value: 100 }
      ]
    });

    this.addNode({
      id: 'utility_warning_system',
      name: 'Warning System',
      description: 'Audio/visual alerts for dangerous enemies',
      branch: SkillBranch.UTILITY,
      cost: 40,
      tier: 3,
      position: { x: 300, y: -50 },
      prerequisites: ['utility_slow_field'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '⚠️',
      effects: [{ type: SkillEffectType.ENEMY_SLOW_FACTOR, value: 0 }] // Visual/audio only
    });

    this.addNode({
      id: 'utility_time_dilation',
      name: 'Time Dilation',
      description: 'Activate slow-motion mode (limited uses per run)',
      branch: SkillBranch.UTILITY,
      cost: 80,
      tier: 4,
      position: { x: 300, y: 0 },
      prerequisites: ['utility_warning_system'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '⏱️',
      effects: [{ type: SkillEffectType.TIME_DILATION_DURATION, value: 5 }]
    });

    this.addNode({
      id: 'utility_auto_clicker',
      name: 'Auto-Clicker',
      description: 'Automated clicking on weakest enemies',
      branch: SkillBranch.UTILITY,
      cost: 200,
      tier: 5,
      position: { x: 300, y: 50 },
      prerequisites: ['utility_time_dilation'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🤖',
      effects: [{ type: SkillEffectType.AUTO_CLICK_RATE, value: 2 }] // 2 clicks per second
    });
  }

  /**
   * Add Ballistic Weapons Branch nodes
   */
  private addBallisticBranch(): void {
    this.addNode({
      id: 'ballistic_basic_turret',
      name: 'Basic Turret',
      description: 'Tower fires bullets at nearest enemy every 2 seconds',
      branch: SkillBranch.BALLISTIC,
      cost: 15,
      tier: 1,
      position: { x: -200, y: 150 },
      prerequisites: [],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🔫',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'basic_turret' }]
    });

    this.addNode({
      id: 'ballistic_rapid_fire',
      name: 'Rapid Fire',
      description: 'Turret attack speed increases to every 1 second',
      branch: SkillBranch.BALLISTIC,
      cost: 30,
      tier: 2,
      position: { x: -200, y: 200 },
      prerequisites: ['ballistic_basic_turret'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💨',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'rapid_fire' }]
    });

    this.addNode({
      id: 'ballistic_piercing_rounds',
      name: 'Piercing Rounds',
      description: 'Bullets pass through enemies, hitting multiple targets',
      branch: SkillBranch.BALLISTIC,
      cost: 60,
      tier: 3,
      position: { x: -200, y: 250 },
      prerequisites: ['ballistic_rapid_fire'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🏹',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'piercing_rounds' }]
    });

    this.addNode({
      id: 'ballistic_explosive_shells',
      name: 'Explosive Shells',
      description: 'Bullets create small explosions on impact',
      branch: SkillBranch.BALLISTIC,
      cost: 100,
      tier: 4,
      position: { x: -200, y: 300 },
      prerequisites: ['ballistic_piercing_rounds'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💣',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'explosive_shells' }]
    });

    this.addNode({
      id: 'ballistic_artillery_mode',
      name: 'Artillery Mode',
      description: 'Slow but powerful shots that deal massive area damage',
      branch: SkillBranch.BALLISTIC,
      cost: 200,
      tier: 5,
      position: { x: -200, y: 350 },
      prerequisites: ['ballistic_explosive_shells'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🚀',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'artillery_mode' }]
    });
  }

  /**
   * Add Energy Weapons Branch nodes
   */
  private addEnergyBranch(): void {
    this.addNode({
      id: 'energy_laser_beam',
      name: 'Laser Beam',
      description: 'Tower emits continuous laser that damages enemies over time',
      branch: SkillBranch.ENERGY,
      cost: 20,
      tier: 1,
      position: { x: 200, y: 150 },
      prerequisites: [],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🔴',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'laser_beam' }]
    });

    this.addNode({
      id: 'energy_chain_lightning',
      name: 'Chain Lightning',
      description: 'Tower shoots lightning that jumps between enemies',
      branch: SkillBranch.ENERGY,
      cost: 45,
      tier: 2,
      position: { x: 200, y: 200 },
      prerequisites: ['energy_laser_beam'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '⚡',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'chain_lightning' }]
    });

    this.addNode({
      id: 'energy_energy_burst',
      name: 'Energy Burst',
      description: 'Periodic energy waves that damage all enemies in range',
      branch: SkillBranch.ENERGY,
      cost: 80,
      tier: 3,
      position: { x: 200, y: 250 },
      prerequisites: ['energy_chain_lightning'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '💫',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'energy_burst' }]
    });

    this.addNode({
      id: 'energy_plasma_cannon',
      name: 'Plasma Cannon',
      description: 'Slow-firing plasma shots that ignore armor',
      branch: SkillBranch.ENERGY,
      cost: 120,
      tier: 4,
      position: { x: 200, y: 300 },
      prerequisites: ['energy_energy_burst'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '🟣',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'plasma_cannon' }]
    });

    this.addNode({
      id: 'energy_tesla_coil',
      name: 'Tesla Coil',
      description: 'Continuous electrical damage to all nearby enemies',
      branch: SkillBranch.ENERGY,
      cost: 250,
      tier: 5,
      position: { x: 200, y: 350 },
      prerequisites: ['energy_plasma_cannon'],
      purchased: false,
      maxLevel: 1,
      currentLevel: 0,
      icon: '⚡',
      effects: [{ type: SkillEffectType.WEAPON_UNLOCK, value: 0, target: 'tesla_coil' }]
    });
  }

  /**
   * Add a node to the skill tree
   */
  private addNode(nodeData: SkillNode): void {
    this.nodes.set(nodeData.id, nodeData);
  }

  /**
   * Set available coins
   */
  public setAvailableCoins(coins: number): void {
    this.availableCoins = coins;
    
    // Notify coin change callbacks
    for (const callback of this.onCoinsChangedCallbacks) {
      callback(this.availableCoins);
    }
  }

  /**
   * Get current available coins
   */
  public getAvailableCoins(): number {
    return this.availableCoins;
  }

  /**
   * Purchase a skill node
   */
  public purchaseNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    
    if (!node) {
      console.warn(`❌ Node not found: ${nodeId}`);
      return false;
    }
    
    if (node.purchased) {
      console.warn(`❌ Node already purchased: ${nodeId}`);
      return false;
    }
    
    if (this.availableCoins < node.cost) {
      console.warn(`❌ Insufficient coins for ${nodeId}: need ${node.cost}, have ${this.availableCoins}`);
      return false;
    }
    
    // Check prerequisites
    for (const prereqId of node.prerequisites) {
      const prereq = this.nodes.get(prereqId);
      if (!prereq || !prereq.purchased) {
        console.warn(`❌ Prerequisite not met for ${nodeId}: ${prereqId}`);
        return false;
      }
    }
    
    // Purchase the node
    this.availableCoins -= node.cost;
    this.totalCoinsSpent += node.cost;
    node.purchased = true;
    node.currentLevel = 1;
    
    // Add purchase animation
    this.purchaseAnimations.push({
      nodeId: nodeId,
      intensity: 1.0,
      duration: 1.0
    });
    
    // Notify callbacks
    for (const callback of this.onNodePurchasedCallbacks) {
      callback(node);
    }
    
    for (const callback of this.onCoinsChangedCallbacks) {
      callback(this.availableCoins);
    }
    
    console.log(`✅ Purchased skill: ${node.name} for ${node.cost} coins`);
    return true;
  }

  /**
   * Check if a node can be purchased
   */
  public canPurchaseNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    
    if (!node || node.purchased || this.availableCoins < node.cost) {
      return false;
    }
    
    // Check prerequisites
    for (const prereqId of node.prerequisites) {
      const prereq = this.nodes.get(prereqId);
      if (!prereq || !prereq.purchased) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get all nodes
   */
  public getAllNodes(): SkillNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by branch
   */
  public getNodesByBranch(branch: SkillBranch): SkillNode[] {
    return Array.from(this.nodes.values()).filter(node => node.branch === branch);
  }

  /**
   * Get purchased nodes
   */
  public getPurchasedNodes(): SkillNode[] {
    return Array.from(this.nodes.values()).filter(node => node.purchased);
  }

  /**
   * Get skill tree statistics
   */
  public getStats(): SkillTreeStats {
    const purchasedNodes = this.getPurchasedNodes();
    const nodesByBranch: Record<SkillBranch, number> = {
      [SkillBranch.OFFENSIVE]: 0,
      [SkillBranch.DEFENSIVE]: 0,
      [SkillBranch.ECONOMIC]: 0,
      [SkillBranch.UTILITY]: 0,
      [SkillBranch.BALLISTIC]: 0,
      [SkillBranch.ENERGY]: 0
    };
    
    const branchTotals: Record<SkillBranch, number> = {
      [SkillBranch.OFFENSIVE]: 0,
      [SkillBranch.DEFENSIVE]: 0,
      [SkillBranch.ECONOMIC]: 0,
      [SkillBranch.UTILITY]: 0,
      [SkillBranch.BALLISTIC]: 0,
      [SkillBranch.ENERGY]: 0
    };
    
    // Count nodes by branch
    for (const node of this.nodes.values()) {
      branchTotals[node.branch]++;
      if (node.purchased) {
        nodesByBranch[node.branch]++;
      }
    }
    
    // Find completed branches
    const completedBranches: SkillBranch[] = [];
    for (const branch of Object.values(SkillBranch)) {
      if (nodesByBranch[branch] === branchTotals[branch] && branchTotals[branch] > 0) {
        completedBranches.push(branch);
      }
    }
    
    return {
      totalNodesUnlocked: purchasedNodes.length,
      totalCoinsSpent: this.totalCoinsSpent,
      nodesByBranch,
      completedBranches
    };
  }

  /**
   * Update skill tree (animations, etc.)
   */
  public update(deltaTime: number): void {
    // Update purchase animations
    for (let i = this.purchaseAnimations.length - 1; i >= 0; i--) {
      const animation = this.purchaseAnimations[i];
      animation.duration -= deltaTime;
      animation.intensity = Math.max(0, animation.duration);
      
      if (animation.duration <= 0) {
        this.purchaseAnimations.splice(i, 1);
      }
    }
  }

  /**
   * Handle input for skill tree interaction
   */
  public handleClick(worldX: number, worldY: number): boolean {
    // Convert world coordinates to skill tree coordinates
    const treeX = (worldX - this.scrollOffset.x) / this.scale;
    const treeY = (worldY - this.scrollOffset.y) / this.scale;
    
    // Check if click hit any node
    for (const node of this.nodes.values()) {
      const dx = treeX - node.position.x;
      const dy = treeY - node.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= 25) { // Node radius
        if (this.canPurchaseNode(node.id)) {
          this.purchaseNode(node.id);
          return true;
        } else {
          // Node cannot be purchased but was clicked - could show details in UI
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Handle hover for skill tree interaction
   */
  public handleHover(_worldX: number, _worldY: number): void {
    // Note: Hover state would be managed by the renderer
    // For now, this is a placeholder that could trigger hover effects
  }

  /**
   * Event subscription methods
   */
  public onNodePurchased(callback: (node: SkillNode) => void): void {
    this.onNodePurchasedCallbacks.push(callback);
  }

  public onCoinsChanged(callback: (coins: number) => void): void {
    this.onCoinsChangedCallbacks.push(callback);
  }

  /**
   * Save skill tree state to localStorage
   */
  public saveToStorage(): void {
    const saveData = {
      purchasedNodes: this.getPurchasedNodes().map(node => ({
        id: node.id,
        currentLevel: node.currentLevel
      })),
      totalCoinsSpent: this.totalCoinsSpent
    };
    
    localStorage.setItem('skillTree', JSON.stringify(saveData));
    console.log('💾 Skill tree saved to localStorage');
  }

  /**
   * Load skill tree state from localStorage
   */
  public loadFromStorage(): void {
    try {
      const saveData = localStorage.getItem('skillTree');
      if (!saveData) return;
      
      const data = JSON.parse(saveData);
      this.totalCoinsSpent = data.totalCoinsSpent || 0;
      
      // Restore purchased nodes
      for (const savedNode of data.purchasedNodes || []) {
        const node = this.nodes.get(savedNode.id);
        if (node) {
          node.purchased = true;
          node.currentLevel = savedNode.currentLevel || 1;
        }
      }
      
      console.log('💾 Skill tree loaded from localStorage');
    } catch (error) {
      console.error('❌ Failed to load skill tree from localStorage:', error);
    }
  }

  /**
   * Reset skill tree (for testing or prestige systems)
   */
  public reset(): void {
    for (const node of this.nodes.values()) {
      node.purchased = false;
      node.currentLevel = 0;
    }
    
    this.totalCoinsSpent = 0;
    this.purchaseAnimations = [];
    
    console.log('🔄 Skill tree reset');
  }

  /**
   * Get save data for SaveManager
   */
  public getSaveData(): { unlockedSkills: string[]; totalCoinsSpent: number } {
    return {
      unlockedSkills: this.getPurchasedNodes().map(node => node.id),
      totalCoinsSpent: this.totalCoinsSpent
    };
  }

  /**
   * Load from SaveManager data
   */
  public loadFromSaveData(data: { unlockedSkills: string[]; totalCoinsSpent: number }): void {
    this.totalCoinsSpent = data.totalCoinsSpent || 0;
    
    // Restore purchased nodes
    for (const nodeId of data.unlockedSkills || []) {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.purchased = true;
        node.currentLevel = 1; // Default to level 1 for purchased nodes
      }
    }
    
    console.log('💾 Skill tree loaded from SaveManager data');
  }
}