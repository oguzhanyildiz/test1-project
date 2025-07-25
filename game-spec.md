# Roguelite Tower Defense Game Specification

## 1. Project Overview

### Game Title
**Tower Guardian** *(working title)*

### Genre
Roguelite Tower Defense / Action Clicker

### Target Platform
- Web browsers (Chrome, Firefox, Safari, Edge)
- Desktop primary, mobile secondary
- Touch and mouse input support

### Target Audience
- Age: 13-35
- Casual to hardcore gamers
- Fans of tower defense, roguelite, and incremental games
- Players who enjoy quick sessions with long-term progression

### Core Concept
A hybrid tower defense and action clicker game where players defend a central tower through two complementary mechanics: direct enemy clicking and automated tower attacks. The tower has 3 HP base health and can be upgraded to attack enemies automatically with various weapons and abilities. Players earn coins by eliminating enemies (both through clicks and tower attacks) and spend them on permanent upgrades in an expanded skill tree, creating a roguelite progression loop with multiple strategic paths and increasing complexity.

## 2. Gameplay Mechanics

### Core Loop
1. **Start Run:** Player begins with base tower stats and unlocked abilities
2. **Enemy Waves:** Enemies spawn from screen edges and move toward central tower
3. **Dual Combat:** Player clicks enemies while tower automatically attacks with unlocked weapons
4. **Strategic Focus:** Choose between manual clicking precision vs tower upgrade investment
5. **Survive Waves:** Survive as many waves as possible before 3 enemies reach the tower
6. **Run Ends:** When tower takes 3 hits, run ends and coins are tallied
7. **Upgrade:** Spend coins on permanent skill tree upgrades (clicking AND tower abilities)
8. **Repeat:** Start new run with improved abilities and strategic options

### Player Actions
- **Primary:** Click on enemies to kill them instantly (always available)
- **Passive:** Tower automatically attacks enemies with unlocked weapons/abilities
- **Strategic:** Balance between manual clicking and tower ability upgrades
- **Tactical:** Choose target priorities when both player and tower are attacking
- **Meta:** Manage skill tree progression across multiple upgrade paths

### Game Objectives
- **Primary Goal:** Survive as many waves as possible in each run
- **Secondary Goals:** 
  - Maximize coins earned per run
  - Unlock all skill tree nodes
  - Achieve high wave milestones
  - Complete challenge modifiers

### Difficulty & Progression
- **Wave Scaling:** Each wave spawns more enemies with increased HP and speed
- **Enemy Variety:** New enemy types introduced every 5-10 waves
- **Meta Progression:** Permanent upgrades through skill tree
- **Run Variety:** Semi-random enemy composition keeps runs fresh

## 3. Game Systems

### Enemy Types & Behaviors

#### Basic Enemy (Minion)
- **HP:** 1 | **Speed:** Medium | **Coins:** 1
- **Behavior:** Moves directly toward tower in straight line
- **Visual:** Small red circle/sprite
- **Spawn Rate:** High in early waves, moderate in later waves

#### Armored Enemy (Tank)
- **HP:** 3 | **Speed:** Slow | **Coins:** 3
- **Behavior:** Moves directly toward tower, requires multiple clicks
- **Visual:** Larger enemy with armor visual indication
- **Spawn Rate:** Increases after wave 5

#### Swift Enemy (Runner)
- **HP:** 1 | **Speed:** Fast | **Coins:** 2
- **Behavior:** Moves quickly, harder to click due to speed
- **Visual:** Streamlined design with speed lines
- **Spawn Rate:** Introduced at wave 3, becomes common

#### Swarm Enemy (Bugs)
- **HP:** 1 | **Speed:** Medium | **Coins:** 0.5 each
- **Behavior:** Spawns in groups of 4-6, small hitboxes
- **Visual:** Very small enemies, different colors
- **Spawn Rate:** Group spawns every 3-4 waves

#### Boss Enemy (Juggernaut)
- **HP:** 10 | **Speed:** Very Slow | **Coins:** 15
- **Behavior:** High HP, spawns smaller enemies periodically
- **Visual:** Large, imposing design with health bar
- **Spawn Rate:** Every 10 waves

#### Stealth Enemy (Ghost) - Late Game
- **HP:** 2 | **Speed:** Medium | **Coins:** 4
- **Behavior:** Periodically becomes invisible/translucent
- **Visual:** Semi-transparent with shimmer effect
- **Spawn Rate:** Introduced at wave 15+

#### Super Boss (Titan)
- **HP:** 500 | **Speed:** Very Slow | **Coins:** 100
- **Behavior:** Massive HP, special attacks, summons other bosses
- **Visual:** Huge, menacing design with multiple components
- **Spawn Rate:** Every 50 waves

### User Interface
- **Main Menu:** Play button, Skill Tree access, Settings, Stats
- **In-Game HUD:** 
  - Tower HP (3 hearts/shields)
  - Current wave number
  - Coins earned this run
  - Wave progress bar
  - Current enemies remaining
- **Skill Tree Screen:** Node-based progression tree with costs
- **End Run Screen:** Coins earned, wave reached, upgrade options

### Audio
- **Music:** Tense electronic/orchestral hybrid that builds with waves
- **Sound Effects:** 
  - Satisfying click/pop for enemy kills
  - Coin collection chime
  - Tower damage alarm
  - Wave start horn
  - Upgrade purchase confirmation
- **Audio Controls:** Master volume, SFX/Music separate controls

### Visual Style
- **Art Direction:** Clean 2D art with particle effects, dark background with bright enemies
- **Color Palette:** 
  - Tower: Blue/white (friendly)
  - Enemies: Red spectrum (threats)
  - UI: Gold/yellow (coins), Green (upgrades)
- **Assets Needed:** 
  - Central tower sprite with damage states
  - Enemy sprites for each type
  - Particle effects for deaths/impacts
  - UI elements and skill tree icons
- **Responsive Design:** Scalable UI for different screen sizes

## 4. Expanded Skill Tree System

### Skill Tree Structure Overview
The skill tree now features **6 branches** organized into two main categories:
- **Player Enhancement Branches:** Offensive, Defensive, Economic, Utility (original 4)
- **Tower Weapon Branches:** Ballistic Weapons, Energy Weapons (new automated tower attacks)

### Player Enhancement Branches

#### Offensive Branch (Red) - Click Enhancements
- **Basic Damage** (Cost: 5) - Enemies require one less click to kill
- **Multi-Click** (Cost: 15) - Single click can hit multiple enemies in small area
- **Critical Strikes** (Cost: 25) - 20% chance to instantly kill any enemy
- **Chain Lightning** (Cost: 50) - Kills can chain to nearby enemies
- **Explosive Clicks** (Cost: 100) - Clicks create small explosion area

#### Defensive Branch (Blue) - Tower Health & Protection
- **Reinforced Tower** (Cost: 10) - Tower HP increases to 4
- **Shield Regeneration** (Cost: 30) - Regain 1 HP every 5 waves survived
- **Damage Resistance** (Cost: 50) - 25% chance enemies deal no damage
- **Emergency Barrier** (Cost: 75) - Activate shield that blocks next 3 hits (once per run)
- **Fortress** (Cost: 150) - Tower HP increases to 6

#### Economic Branch (Gold) - Coin Generation
- **Coin Magnet** (Cost: 8) - Coins auto-collect after 2 seconds
- **Bonus Coins** (Cost: 20) - +50% coins from all sources
- **Wave Bonus** (Cost: 35) - Bonus coins for completing waves without damage
- **Treasure Hunter** (Cost: 60) - Rare enemies spawn with 3x coin value
- **Golden Touch** (Cost: 120) - All enemies have chance to drop bonus coins

#### Utility Branch (Green) - Special Abilities
- **Enemy Tracker** (Cost: 12) - Visual indicators show enemy paths
- **Slow Field** (Cost: 25) - Enemies move 25% slower near tower
- **Warning System** (Cost: 40) - Audio/visual alerts for dangerous enemies
- **Time Dilation** (Cost: 80) - Activate slow-motion mode (limited uses per run)
- **Auto-Clicker** (Cost: 200) - Automated clicking on weakest enemies

### Tower Weapon Branches (NEW)

#### Ballistic Weapons Branch (Orange) - Physical Projectile Attacks
- **Basic Turret** (Cost: 15) - Tower fires bullets at nearest enemy every 2 seconds
- **Rapid Fire** (Cost: 30) - Turret attack speed increases to every 1 second
- **Piercing Rounds** (Cost: 60) - Bullets pass through enemies, hitting multiple targets
- **Explosive Shells** (Cost: 100) - Bullets create small explosions on impact
- **Artillery Mode** (Cost: 200) - Slow but powerful shots that deal massive area damage

#### Energy Weapons Branch (Purple) - Beam and Electric Attacks
- **Laser Beam** (Cost: 20) - Tower emits continuous laser that damages enemies over time
- **Chain Lightning** (Cost: 45) - Tower shoots lightning that jumps between enemies
- **Energy Burst** (Cost: 80) - Periodic energy waves that damage all enemies in range
- **Plasma Cannon** (Cost: 120) - Slow-firing plasma shots that ignore armor
- **Tesla Coil** (Cost: 250) - Continuous electrical damage to all nearby enemies

### Advanced Tower System Mechanics

#### Weapon Synergies
- **Dual Weapon Unlock:** Purchase both Basic Turret + Laser Beam to unlock "Hybrid Mode"
- **Targeting Priority:** Unlockable targeting modes (Nearest, Weakest, Strongest, Fastest)
- **Weapon Switching:** Toggle between weapon types mid-run (unlockable skill)

#### Tower Attack Characteristics
- **Ballistic Weapons:** High single-target damage, visible projectiles, can miss fast enemies
- **Energy Weapons:** Guaranteed hit but lower DPS, continuous damage, area effects
- **Range System:** All tower weapons have limited range (expandable with upgrades)
- **Ammo/Energy:** Some advanced weapons have cooldowns or limited uses per wave

### Updated Skill Tree Economics
- **Starting Coins:** 0
- **Early Upgrades:** 5-20 coins (accessible after 1-2 runs) - Basic click and tower upgrades
- **Mid Upgrades:** 25-80 coins (require several successful runs) - Advanced abilities
- **Late Upgrades:** 100-250 coins (long-term goals) - Ultimate tower weapons
- **Tower vs Click Balance:** Tower weapons cost more but provide passive benefits
- **Coin Scaling:** Enemies drop more coins in later waves, tower kills also grant coins

## 5. Technical Requirements

### Technology Stack
- **Frontend:** HTML5, CSS3, TypeScript
- **Game Engine:** HTML5 Canvas with custom engine or Phaser 3
- **Build Tools:** Vite for fast development and bundling
- **State Management:** Custom game state manager
- **Storage:** localStorage for save data and settings
- **Testing:** Jest for unit tests, Playwright for integration

### Performance Targets
- **Loading Time:** Under 3 seconds on standard connection
- **Frame Rate:** Stable 60 FPS with up to 50 enemies on screen
- **Memory Usage:** Under 100MB RAM usage
- **Bundle Size:** Under 2MB total (compressed)

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Considerations
- Touch controls with haptic feedback
- Responsive UI scaling for different screen sizes
- Optimized particle effects for mobile performance
- Prevent accidental zooming during gameplay

## 6. Game Flow & States

### State Management
- **Main Menu State:** Skill tree access, play button, settings, statistics
- **Pre-Game State:** Brief loading screen with tips
- **Game Playing State:** Active gameplay with enemies spawning and moving
- **Wave Transition State:** Brief pause between waves showing progress
- **Pause State:** Game frozen with resume/menu options
- **Game Over State:** Run summary, coins earned, upgrade suggestions
- **Skill Tree State:** Upgrade purchase interface
- **Settings State:** Audio, graphics, and control options

### Game Flow Diagram
```
Main Menu → Pre-Game → Playing → Wave Transition → Playing (loop)
    ↑         ↓              ↓           ↓
Skill Tree ← Game Over ← Pause ← Wave Transition
```

### Scene Transitions
- Smooth fade transitions between major states
- Quick snap transitions for pause/unpause
- Satisfying coin collection animation when transitioning to upgrade screen

## 7. Content & Assets

### Visual Assets
- [ ] **Central Tower:** Base sprite with 3 damage states (pristine → damaged → critical)
- [ ] **Enemy Sprites:** 6 distinct enemy types with animations
- [ ] **UI Elements:** Health hearts, coin icons, wave counter, progress bars
- [ ] **Particle Effects:** Click impacts, enemy deaths, coin collection sparkles
- [ ] **Skill Tree Icons:** 20 unique icons for different upgrade paths
- [ ] **Background:** Dark space/void theme with subtle animations
- [ ] **Visual Feedback:** Damage flashes, screen shake, highlight effects

### Audio Assets
- [ ] **Background Music:** 3-4 looping tracks that layer based on intensity
- [ ] **Enemy Death Sounds:** Different pitches/tones for each enemy type
- [ ] **UI Sounds:** Click confirmations, coin pickup, upgrade purchase
- [ ] **Alert Sounds:** Tower damage alarm, wave start horn, boss warning
- [ ] **Ambient Audio:** Subtle enemy movement sounds, tower hum

### Text Content
- [ ] **Tutorial Tips:** Brief explanations of core mechanics
- [ ] **Skill Descriptions:** Clear explanations of upgrade effects
- [ ] **Enemy Information:** Hover tooltips with enemy stats
- [ ] **Achievement Messages:** Milestone celebrations and encouragement
- [ ] **Error Handling:** Graceful failure messages for save/load issues

## 8. Features & Functionality

### Core Features (MVP)
- [ ] **Click-to-Kill Mechanic:** Core enemy elimination system
- [ ] **Enemy Wave System:** Progressive enemy spawning with increasing difficulty
- [ ] **Tower Health System:** 3-hit tower with visual damage states
- [ ] **Coin Economy:** Enemy kills reward coins for spending
- [ ] **Basic Skill Tree:** 4 branches with essential upgrades
- [ ] **Save/Load System:** Persistent progression between sessions
- [ ] **6 Enemy Types:** Diverse threats with unique behaviors
- [ ] **Audio/Visual Feedback:** Satisfying click responses and UI

### Nice-to-Have Features
- [ ] **Statistics Tracking:** Detailed run history and personal bests
- [ ] **Achievement System:** Milestone rewards and completion goals
- [ ] **Challenge Modes:** Modified rule sets for variety
- [ ] **Visual Customization:** Tower and UI theme options
- [ ] **Advanced Particles:** More elaborate death and click effects
- [ ] **Combo System:** Reward rapid consecutive kills
- [ ] **Boss Variations:** Multiple boss types with unique mechanics

### Future Enhancements
- [ ] **Multiple Tower Types:** Different playstyles and strategies
- [ ] **Endless Mode:** Post-game progression for hardcore players
- [ ] **Daily Challenges:** Rotating objectives with special rewards
- [ ] **Leaderboards:** Compare performance with other players
- [ ] **Prestige System:** Reset progress for powerful bonuses
- [ ] **Mobile App Version:** Native mobile implementation
- [ ] **Multiplayer Co-op:** Shared tower defense with friends

## 9. Development Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] **Project Setup:** Vite + TypeScript configuration, Canvas setup
- [ ] **Basic Game Loop:** Frame timing, input handling, simple rendering
- [ ] **Core Mechanics:** Click detection, basic enemy movement, collision
- [ ] **State Management:** Menu transitions, game state switching

### Phase 2: Core Gameplay (Week 3-5)
- [ ] **Enemy System:** All 6 enemy types with behaviors and spawning
- [ ] **Wave System:** Progressive difficulty and enemy composition
- [ ] **Tower Mechanics:** Health system, damage visualization
- [ ] **Coin System:** Collection, storage, and UI display

### Phase 3: Progression System (Week 6-7)
- [ ] **Skill Tree:** Complete implementation of all 4 branches
- [ ] **Save System:** localStorage persistence and data validation
- [ ] **Balancing:** Enemy HP, coin rewards, upgrade costs
- [ ] **Polish:** Particle effects, animations, audio integration

### Phase 4: Testing & Launch (Week 8-9)
- [ ] **Cross-browser Testing:** Compatibility verification
- [ ] **Mobile Optimization:** Touch controls and responsive design
- [ ] **Performance Optimization:** Frame rate and memory usage
- [ ] **Deployment:** Hosting setup and final release preparation

### Development Milestones
- **Week 2:** Playable prototype with basic clicking and enemies
- **Week 4:** Complete enemy variety and wave progression
- **Week 6:** Full skill tree and meta-progression
- **Week 8:** Feature-complete and ready for testing

## 10. Success Metrics

### Technical Metrics
- **Load Time:** Under 3 seconds on 3G connection
- **Performance:** Stable 60 FPS with 50+ enemies on screen
- **Compatibility:** 95% compatibility across target browsers
- **Mobile Performance:** Smooth gameplay on mid-range devices

### Gameplay Metrics
- **Session Length:** Average 5-10 minutes per run
- **Retention:** Players return within 24 hours for upgrades
- **Progression:** Clear advancement through skill tree unlocks
- **Difficulty Curve:** Players consistently reach waves 10-15 before failing

### User Experience Goals
- **Satisfaction:** Clicking enemies feels responsive and rewarding
- **Progression Feel:** Upgrades provide noticeable power increases
- **Clarity:** UI and mechanics are immediately understandable
- **Addiction Factor:** "One more run" mentality after game over

## 11. Risk Assessment & Mitigation

### Technical Risks
- **Performance Degradation:** Too many enemies/particles causing frame drops
  - *Mitigation:* Object pooling, efficient rendering, performance budgets
- **Mobile Touch Precision:** Difficulty clicking small/fast enemies on touch screens
  - *Mitigation:* Larger touch targets, auto-aim assistance, haptic feedback
- **Save Data Loss:** localStorage corruption losing player progress
  - *Mitigation:* Data validation, backup saves, graceful recovery

### Design Risks
- **Progression Imbalance:** Upgrades too expensive or too cheap
  - *Mitigation:* Extensive playtesting, adjustable economy parameters
- **Difficulty Spike:** Game becomes too hard too quickly
  - *Mitigation:* Gradual enemy introduction, difficulty curve analytics
- **Repetitive Gameplay:** Core loop becomes boring after extended play
  - *Mitigation:* Enemy variety, upgrade diversity, achievement goals

## 12. Resources & References

### Inspiration Games
- **Cookie Clicker:** Incremental progression and upgrade addiction
- **Plants vs. Zombies:** Tower defense clarity and enemy variety
- **Vampire Survivors:** Simple controls with complex progression
- **Bloons TD:** Wave-based enemy progression and upgrade trees

### Technical References
- **Canvas Performance:** MDN Canvas optimization guides
- **Game Loop Patterns:** Game Programming Pattern resources
- **Touch Handling:** Mobile web game input best practices
- **Audio Web APIs:** Web Audio API documentation for dynamic sound

### Development Tools
- **Art Creation:** Aseprite for pixel art, Figma for UI design
- **Audio:** Audacity for sound editing, Freesound for assets
- **Testing:** BrowserStack for cross-browser testing
- **Analytics:** Simple event tracking for gameplay metrics

---

## 13. Additional Game Mechanics Details

### Wave Composition Examples
- **Waves 1-2:** 3-5 Basic Enemies only
- **Waves 3-5:** Basic + Swift Enemies introduced
- **Waves 6-10:** Basic + Swift + Armored, first Swarm wave
- **Wave 10:** First Boss Enemy with Basic Enemy support
- **Waves 11-15:** All enemy types in increasing quantities
- **Wave 15+:** Stealth Enemies introduced, multiple Boss enemies

### Coin Balance Guidelines
- **Early Game (Waves 1-5):** 1-3 coins per enemy, 5-15 coins per run
- **Mid Game (Waves 6-10):** 1-4 coins per enemy, 15-40 coins per run
- **Late Game (Waves 11+):** 2-6 coins per enemy, 40+ coins per run
- **Boss Rewards:** 15-25 coins, significant progression boost

### Combat Balance & Interaction Details

#### Click Mechanics
- **Base Click:** Instantly kills enemies with 1 HP
- **Multi-HP Enemies:** Require multiple clicks, visual damage indication
- **Click Feedback:** Particle burst, screen shake, satisfying audio
- **Miss Penalty:** None - encourages rapid clicking without precision stress
- **Click Rate Limit:** No artificial limits, rewards fast clicking skill

#### Tower vs Click Balance
- **Tower Weapons:** Provide consistent damage but cost more coins to unlock/upgrade
- **Click Skills:** More cost-effective early game, require active player engagement
- **Synergy Bonus:** Some skills boost both click and tower effectiveness
- **Strategic Choice:** Players choose between active clicking vs passive tower investment

#### Combat Priority System
- **Player Clicks:** Always take priority over tower attacks (instant damage)
- **Tower Targeting:** Attacks different enemy than player is clicking when possible
- **Kill Attribution:** Both clicks and tower attacks award coins equally
- **Visual Distinction:** Clear indicators show whether player or tower scored the kill

#### Weapon Effectiveness by Enemy Type
- **Basic/Swift Enemies:** Both clicks and tower weapons equally effective
- **Armored Enemies:** Tower weapons ignore armor, clicks require multiple hits
- **Swarm Enemies:** Area-effect tower weapons excel, clicking each individual unit challenging
- **Boss Enemies:** Combination of both systems most effective, neither alone sufficient
- **Stealth Enemies:** Clicks can target invisible enemies, tower weapons cannot

---

**Document Version:** 3.0  
**Last Updated:** July 23, 2025  
**Status:** Extended with Tower Weapon System  
**Target Start Date:** [Project Kickoff]

*This comprehensive specification covers all aspects of the hybrid roguelite tower defense game with dual combat systems. The addition of tower weapons creates strategic depth while maintaining the core clicking mechanics. Implementation should follow this design closely, with flexibility for minor adjustments during development based on playtesting feedback.*