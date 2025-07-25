'''
import { Enemy, EnemyData } from './Enemy.js';
import { CanvasRenderer } from '../core/CanvasRenderer.js';

export interface BossData extends EnemyData {
  specialAttack: string;
}

export class Boss extends Enemy {
  public specialAttack: string;

  constructor(data: BossData) {
    super({
      ...data,
      enemyType: 'boss',
      health: data.health || 500,
      radius: data.radius || 50,
      speed: data.speed || 20,
      damage: data.damage || 10,
      reward: data.reward || 100,
    });
    this.specialAttack = data.specialAttack;
  }

  protected onRender(renderer: CanvasRenderer, x: number, y: number): void {
    // Custom boss rendering
    renderer.drawCircle(x, y, this.radius, {
      fillStyle: 'purple',
      strokeStyle: 'black',
      lineWidth: 4,
    });
    renderer.drawCircle(x, y, this.radius * 0.7, { fillStyle: 'red' });
    renderer.drawCircle(x, y, this.radius * 0.4, { fillStyle: 'black' });
  }
}
''