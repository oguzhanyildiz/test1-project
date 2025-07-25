// Audio Manager - Web Audio API wrapper with volume controls and game sound management
export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muteAll: boolean;
}

export interface SoundEffect {
  id: string;
  buffer: AudioBuffer | null;
  volume: number;
  category: 'sfx' | 'music' | 'ui';
  loop: boolean;
  pitch?: number;
}

export interface PlayingSoundInstance {
  id: string;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
  duration: number;
  category: 'sfx' | 'music' | 'ui';
  loop: boolean;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private uiGainNode: GainNode | null = null;
  
  private sounds: Map<string, SoundEffect> = new Map();
  private playingSounds: Map<string, PlayingSoundInstance> = new Map();
  private currentMusic: PlayingSoundInstance | null = null;
  
  private settings: AudioSettings = {
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    muteAll: false
  };
  
  private isInitialized: boolean = false;
  private pendingSounds: Array<() => void> = [];
  
  constructor() {
    // Initialize audio context after user interaction
    this.initializeAudioContext();
    console.log('🔊 AudioManager created (will initialize on first user interaction)');
  }
  
  /**
   * Initialize Web Audio API context
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        // Wait for user interaction to resume context
        const resumeAudio = async () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          this.setupAudioGraph();
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
          document.removeEventListener('touchstart', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
      } else {
        this.setupAudioGraph();
      }
      
    } catch (error) {
      console.error('🔊 Failed to initialize audio context:', error);
      this.audioContext = null;
    }
  }
  
  /**
   * Set up audio node graph
   */
  private setupAudioGraph(): void {
    if (!this.audioContext) return;
    
    try {
      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      
      // Create category-specific gain nodes
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.connect(this.masterGainNode);
      
      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.connect(this.masterGainNode);
      
      this.uiGainNode = this.audioContext.createGain();
      this.uiGainNode.connect(this.masterGainNode);
      
      // Apply current settings
      this.updateVolumeSettings();
      
      this.isInitialized = true;
      
      // Play any pending sounds
      for (const playSound of this.pendingSounds) {
        playSound();
      }
      this.pendingSounds = [];
      
      console.log('🔊 AudioManager initialized successfully');
    } catch (error) {
      console.error('🔊 Failed to setup audio graph:', error);
    }
  }
  
  /**
   * Load sound effect from URL or generate procedurally
   */
  public async loadSound(id: string, audioData: ArrayBuffer | string, options: {
    volume?: number;
    category?: 'sfx' | 'music' | 'ui';
    loop?: boolean;
    pitch?: number;
  } = {}): Promise<boolean> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
      if (!this.audioContext) return false;
    }
    
    try {
      let buffer: AudioBuffer | null = null;
      
      if (typeof audioData === 'string') {
        // Generate procedural sound
        buffer = this.generateProceduralSound(audioData);
      } else {
        // Decode audio file
        buffer = await this.audioContext.decodeAudioData(audioData);
      }
      
      const sound: SoundEffect = {
        id,
        buffer,
        volume: options.volume ?? 1.0,
        category: options.category ?? 'sfx',
        loop: options.loop ?? false,
        pitch: options.pitch ?? 1.0
      };
      
      this.sounds.set(id, sound);
      console.log(`🔊 Sound loaded: ${id} (${sound.category})`);
      return true;
    } catch (error) {
      console.error(`🔊 Failed to load sound ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Generate procedural sound effects
   */
  private generateProceduralSound(type: string): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    let duration: number;
    let generator: (i: number, t: number) => number;
    
    switch (type) {
      case 'enemy_death':
        duration = 0.3;
        generator = (_i, t) => {
          const decay = Math.exp(-t * 8);
          const noise = (Math.random() - 0.5) * 0.3;
          const tone = Math.sin(2 * Math.PI * (200 - t * 150) * t);
          return (tone + noise) * decay;
        };
        break;
        
      case 'coin_collect':
        duration = 0.2;
        generator = (_i, t) => {
          const decay = Math.exp(-t * 10);
          const chirp = Math.sin(2 * Math.PI * (400 + t * 200) * t);
          return chirp * decay;
        };
        break;
        
      case 'click_feedback':
        duration = 0.1;
        generator = (_i, t) => {
          const decay = Math.exp(-t * 20);
          const click = Math.sin(2 * Math.PI * 800 * t);
          return click * decay;
        };
        break;
        
      case 'tower_damage':
        duration = 0.5;
        generator = (_i, t) => {
          const decay = Math.exp(-t * 4);
          const rumble = Math.sin(2 * Math.PI * 80 * t) * 0.8;
          const impact = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 10);
          return (rumble + impact) * decay;
        };
        break;
        
      case 'ui_hover':
        duration = 0.05;
        generator = (_i, t) => {
          const decay = Math.exp(-t * 30);
          const beep = Math.sin(2 * Math.PI * 600 * t);
          return beep * decay * 0.3;
        };
        break;
        
      case 'wave_start':
        duration = 1.0;
        generator = (_i, t) => {
          const decay = Math.exp(-t * 2);
          const sweep = Math.sin(2 * Math.PI * (100 + t * 100) * t);
          return sweep * decay * 0.5;
        };
        break;
        
      default:
        return null;
    }
    
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      channelData[i] = generator(i, t);
    }
    
    return buffer;
  }
  
  /**
   * Play a sound effect
   */
  public playSound(id: string, options: {
    volume?: number;
    pitch?: number;
    delay?: number;
    fadeDuration?: number;
  } = {}): string | null {
    if (!this.isInitialized) {
      // Queue sound to play after initialization
      const playLater = () => this.playSound(id, options);
      this.pendingSounds.push(playLater);
      return null;
    }
    
    const sound = this.sounds.get(id);
    if (!sound || !sound.buffer || !this.audioContext) {
      console.warn(`🔊 Sound not found or not loaded: ${id}`);
      return null;
    }
    
    try {
      // Create audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = sound.buffer;
      source.loop = sound.loop;
      
      // Apply pitch modification
      const pitch = options.pitch ?? sound.pitch ?? 1.0;
      source.playbackRate.value = pitch;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const volume = (options.volume ?? sound.volume) * (this.settings.muteAll ? 0 : 1);
      gainNode.gain.value = volume;
      
      // Connect to appropriate category gain node
      const categoryGain = this.getCategoryGainNode(sound.category);
      if (categoryGain) {
        source.connect(gainNode);
        gainNode.connect(categoryGain);
      } else {
        return null;
      }
      
      // Handle fade in
      if (options.fadeDuration && options.fadeDuration > 0) {
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + options.fadeDuration);
      }
      
      // Start playback
      const startTime = this.audioContext.currentTime + (options.delay ?? 0);
      source.start(startTime);
      
      // Create playing sound instance
      const instanceId = `${id}_${Date.now()}_${Math.random()}`;
      const instance: PlayingSoundInstance = {
        id: instanceId,
        source,
        gainNode,
        startTime,
        duration: sound.buffer.duration / pitch,
        category: sound.category,
        loop: sound.loop
      };
      
      this.playingSounds.set(instanceId, instance);
      
      // Set up cleanup
      source.onended = () => {
        this.playingSounds.delete(instanceId);
      };
      
      // Auto-stop non-looping sounds
      if (!sound.loop) {
        setTimeout(() => {
          if (this.playingSounds.has(instanceId)) {
            this.stopSound(instanceId);
          }
        }, (instance.duration + (options.delay ?? 0)) * 1000);
      }
      
      return instanceId;
    } catch (error) {
      console.error(`🔊 Failed to play sound ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Stop a playing sound
   */
  public stopSound(instanceId: string, fadeOutDuration: number = 0): void {
    const instance = this.playingSounds.get(instanceId);
    if (!instance || !this.audioContext) return;
    
    try {
      if (fadeOutDuration > 0) {
        // Fade out
        const currentTime = this.audioContext.currentTime;
        instance.gainNode.gain.setValueAtTime(instance.gainNode.gain.value, currentTime);
        instance.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
        
        setTimeout(() => {
          instance.source.stop();
          this.playingSounds.delete(instanceId);
        }, fadeOutDuration * 1000);
      } else {
        // Immediate stop
        instance.source.stop();
        this.playingSounds.delete(instanceId);
      }
    } catch (error) {
      console.error(`🔊 Failed to stop sound ${instanceId}:`, error);
      this.playingSounds.delete(instanceId);
    }
  }
  
  /**
   * Stop all sounds of a specific category
   */
  public stopSoundsByCategory(category: 'sfx' | 'music' | 'ui', fadeOutDuration: number = 0): void {
    for (const [instanceId, instance] of this.playingSounds) {
      if (instance.category === category) {
        this.stopSound(instanceId, fadeOutDuration);
      }
    }
  }
  
  /**
   * Play background music with crossfade
   */
  public playMusic(id: string, options: {
    volume?: number;
    fadeInDuration?: number;
    crossfadeDuration?: number;
  } = {}): boolean {
    // Stop current music if playing
    if (this.currentMusic) {
      this.stopSound(this.currentMusic.id, options.crossfadeDuration ?? 1.0);
    }
    
    // Play new music
    const instanceId = this.playSound(id, {
      volume: options.volume,
      fadeDuration: options.fadeInDuration ?? 1.0
    });
    
    if (instanceId) {
      const instance = this.playingSounds.get(instanceId);
      if (instance) {
        this.currentMusic = instance;
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Update audio settings
   */
  public updateSettings(settings: Partial<AudioSettings>): void {
    Object.assign(this.settings, settings);
    this.updateVolumeSettings();
  }
  
  /**
   * Update volume levels on all gain nodes
   */
  private updateVolumeSettings(): void {
    if (!this.isInitialized) return;
    
    const masterVolume = this.settings.muteAll ? 0 : this.settings.masterVolume;
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = masterVolume;
    }
    
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.settings.musicVolume;
    }
    
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.settings.sfxVolume;
    }
    
    if (this.uiGainNode) {
      this.uiGainNode.gain.value = this.settings.sfxVolume; // UI uses SFX volume
    }
  }
  
  /**
   * Get the appropriate gain node for a category
   */
  private getCategoryGainNode(category: 'sfx' | 'music' | 'ui'): GainNode | null {
    switch (category) {
      case 'music': return this.musicGainNode;
      case 'sfx': return this.sfxGainNode;
      case 'ui': return this.uiGainNode;
      default: return this.sfxGainNode;
    }
  }
  
  /**
   * Preload common game sounds
   */
  public async preloadGameSounds(): Promise<void> {
    const soundsToLoad = [
      { id: 'enemy_death', type: 'enemy_death', category: 'sfx' as const, volume: 0.7 },
      { id: 'coin_collect', type: 'coin_collect', category: 'sfx' as const, volume: 0.8 },
      { id: 'click_feedback', type: 'click_feedback', category: 'ui' as const, volume: 0.5 },
      { id: 'tower_damage', type: 'tower_damage', category: 'sfx' as const, volume: 0.9 },
      { id: 'ui_hover', type: 'ui_hover', category: 'ui' as const, volume: 0.3 },
      { id: 'wave_start', type: 'wave_start', category: 'sfx' as const, volume: 0.6 }
    ];
    
    console.log('🔊 Preloading game sounds...');
    
    for (const sound of soundsToLoad) {
      await this.loadSound(sound.id, sound.type, {
        category: sound.category,
        volume: sound.volume
      });
    }
    
    console.log('🔊 Game sounds preloaded');
  }
  
  /**
   * Get current audio stats
   */
  public getStats(): {
    isInitialized: boolean;
    soundsLoaded: number;
    soundsPlaying: number;
    currentMusic: string | null;
    settings: AudioSettings;
  } {
    return {
      isInitialized: this.isInitialized,
      soundsLoaded: this.sounds.size,
      soundsPlaying: this.playingSounds.size,
      currentMusic: this.currentMusic?.id ?? null,
      settings: { ...this.settings }
    };
  }
  
  /**
   * Cleanup audio resources
   */
  public cleanup(): void {
    // Stop all sounds
    for (const instanceId of this.playingSounds.keys()) {
      this.stopSound(instanceId);
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.sounds.clear();
    this.playingSounds.clear();
    this.currentMusic = null;
    this.isInitialized = false;
    
    console.log('🔊 AudioManager cleaned up');
  }
}