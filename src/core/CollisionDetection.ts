// Collision Detection System - Efficient collision checking for game objects

import { Point2D } from './CanvasRenderer.js';

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  hit: boolean;
  distance?: number;
  penetration?: number;
  normal?: Point2D;
}

export class CollisionDetection {
  /**
   * Check if a point is inside a circle
   */
  public static pointInCircle(point: Point2D, circle: Circle): CollisionResult {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hit = distance <= circle.radius;
    
    return {
      hit,
      distance,
      penetration: hit ? circle.radius - distance : 0,
      normal: distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 }
    };
  }
  
  /**
   * Check if a point is inside a rectangle
   */
  public static pointInRectangle(point: Point2D, rect: Rectangle): CollisionResult {
    const hit = point.x >= rect.x && 
                point.x <= rect.x + rect.width && 
                point.y >= rect.y && 
                point.y <= rect.y + rect.height;
    
    if (!hit) {
      return { hit: false };
    }
    
    // Calculate distance to center
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return {
      hit: true,
      distance,
      normal: distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 }
    };
  }
  
  /**
   * Check collision between two circles
   */
  public static circleCircle(circle1: Circle, circle2: Circle): CollisionResult {
    const dx = circle2.x - circle1.x;
    const dy = circle2.y - circle1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadius = circle1.radius + circle2.radius;
    const hit = distance <= combinedRadius;
    
    return {
      hit,
      distance,
      penetration: hit ? combinedRadius - distance : 0,
      normal: distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 }
    };
  }
  
  /**
   * Check collision between circle and rectangle
   */
  public static circleRectangle(circle: Circle, rect: Rectangle): CollisionResult {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    // Calculate distance from circle center to closest point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hit = distance <= circle.radius;
    
    return {
      hit,
      distance,
      penetration: hit ? circle.radius - distance : 0,
      normal: distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 }
    };
  }
  
  /**
   * Check if a line segment intersects with a circle
   */
  public static lineCircle(start: Point2D, end: Point2D, circle: Circle): CollisionResult {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const fx = start.x - circle.x;
    const fy = start.y - circle.y;
    
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - circle.radius * circle.radius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return { hit: false };
    }
    
    const discriminantRoot = Math.sqrt(discriminant);
    
    // Check both intersection points
    const t1 = (-b - discriminantRoot) / (2 * a);
    const t2 = (-b + discriminantRoot) / (2 * a);
    
    const hit = (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    
    if (!hit) {
      return { hit: false };
    }
    
    // Use the closest intersection point
    const t = (t1 >= 0 && t1 <= 1) ? t1 : t2;
    const intersectionX = start.x + t * dx;
    const intersectionY = start.y + t * dy;
    
    const distanceToCenter = Math.sqrt(
      (intersectionX - circle.x) ** 2 + (intersectionY - circle.y) ** 2
    );
    
    return {
      hit: true,
      distance: distanceToCenter,
      normal: {
        x: (intersectionX - circle.x) / circle.radius,
        y: (intersectionY - circle.y) / circle.radius
      }
    };
  }
  
  /**
   * Get all objects within a certain radius of a point
   */
  public static getObjectsInRadius<T extends { x: number; y: number; radius?: number }>(
    point: Point2D,
    radius: number,
    objects: T[]
  ): Array<{ object: T; distance: number }> {
    const results: Array<{ object: T; distance: number }> = [];
    
    for (const obj of objects) {
      const dx = obj.x - point.x;
      const dy = obj.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const objRadius = obj.radius || 0;
      
      if (distance <= radius + objRadius) {
        results.push({ object: obj, distance });
      }
    }
    
    // Sort by distance (closest first)
    results.sort((a, b) => a.distance - b.distance);
    
    return results;
  }
  
  /**
   * Find the closest object to a point
   */
  public static getClosestObject<T extends { x: number; y: number }>(
    point: Point2D,
    objects: T[]
  ): { object: T; distance: number } | null {
    if (objects.length === 0) {
      return null;
    }
    
    let closest = objects[0];
    let closestDistance = Math.sqrt(
      (closest.x - point.x) ** 2 + (closest.y - point.y) ** 2
    );
    
    for (let i = 1; i < objects.length; i++) {
      const obj = objects[i];
      const distance = Math.sqrt(
        (obj.x - point.x) ** 2 + (obj.y - point.y) ** 2
      );
      
      if (distance < closestDistance) {
        closest = obj;
        closestDistance = distance;
      }
    }
    
    return { object: closest, distance: closestDistance };
  }
  
  /**
   * Efficient broad-phase collision detection using spatial partitioning
   * This is useful for checking many objects at once
   */
  public static spatialHash<T extends { x: number; y: number; radius?: number }>(
    objects: T[],
    cellSize: number = 100
  ): Map<string, T[]> {
    const hash = new Map<string, T[]>();
    
    for (const obj of objects) {
      const radius = obj.radius || 0;
      const minX = Math.floor((obj.x - radius) / cellSize);
      const maxX = Math.floor((obj.x + radius) / cellSize);
      const minY = Math.floor((obj.y - radius) / cellSize);
      const maxY = Math.floor((obj.y + radius) / cellSize);
      
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          if (!hash.has(key)) {
            hash.set(key, []);
          }
          hash.get(key)!.push(obj);
        }
      }
    }
    
    return hash;
  }
  
  /**
   * Get objects in the same spatial cells as a point
   */
  public static getObjectsInSpatialCell<T extends { x: number; y: number; radius?: number }>(
    point: Point2D,
    spatialHash: Map<string, T[]>,
    cellSize: number = 100,
    searchRadius: number = 0
  ): T[] {
    const results: T[] = [];
    const visited = new Set<T>();
    
    const minX = Math.floor((point.x - searchRadius) / cellSize);
    const maxX = Math.floor((point.x + searchRadius) / cellSize);
    const minY = Math.floor((point.y - searchRadius) / cellSize);
    const maxY = Math.floor((point.y + searchRadius) / cellSize);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const objects = spatialHash.get(key);
        
        if (objects) {
          for (const obj of objects) {
            if (!visited.has(obj)) {
              visited.add(obj);
              results.push(obj);
            }
          }
        }
      }
    }
    
    return results;
  }
}