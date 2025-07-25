// Skill Tree Renderer - Visual rendering for the skill tree interface
import { CanvasRenderer } from '../core/CanvasRenderer.js';
import { SkillTreeSystem, SkillNode, SkillBranch } from './SkillTreeSystem.js';

export class SkillTreeRenderer {
  private skillTree: SkillTreeSystem;
  private scrollOffset: { x: number; y: number } = { x: 0, y: 0 };
  private scale: number = 1.0;
  private hoveredNode: SkillNode | null = null;
  private selectedNode: SkillNode | null = null;

  // Visual constants
  private readonly NODE_RADIUS = 25;
  private readonly CONNECTION_WIDTH = 3;
  private readonly BRANCH_COLORS = {
    [SkillBranch.OFFENSIVE]: '#FF4444',    // Red
    [SkillBranch.DEFENSIVE]: '#4444FF',    // Blue  
    [SkillBranch.ECONOMIC]: '#FFD700',     // Gold
    [SkillBranch.UTILITY]: '#44FF44',      // Green
    [SkillBranch.BALLISTIC]: '#FF8800',    // Orange
    [SkillBranch.ENERGY]: '#AA44FF'        // Purple
  };

  constructor(skillTree: SkillTreeSystem) {
    this.skillTree = skillTree;
  }

  /**
   * Render the complete skill tree
   */
  public render(renderer: CanvasRenderer): void {
    const viewport = renderer.getViewport();
    
    // Center the tree in the viewport
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    
    // Apply transform for panning and zooming
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(centerX + this.scrollOffset.x, centerY + this.scrollOffset.y);
    ctx.scale(this.scale, this.scale);
    
    // Render connection lines first (behind nodes)
    this.renderConnections(renderer);
    
    // Render branch labels
    this.renderBranchLabels(renderer);
    
    // Render all nodes
    this.renderNodes(renderer);
    
    // Render node details overlay
    this.renderNodeDetails(renderer, viewport);
    
    ctx.restore();
    
    // Render UI elements (always on top)
    this.renderUI(renderer, viewport);
  }

  /**
   * Render connection lines between nodes
   */
  private renderConnections(renderer: CanvasRenderer): void {
    const nodes = this.skillTree.getAllNodes();
    
    for (const node of nodes) {
      for (const prereqId of node.prerequisites) {
        const prereqNode = nodes.find(n => n.id === prereqId);
        if (!prereqNode) continue;
        
        // Determine connection color and style
        let connectionColor = '#666666';
        let connectionAlpha = 0.5;
        let lineWidth = this.CONNECTION_WIDTH;
        
        if (prereqNode.purchased && node.purchased) {
          connectionColor = this.BRANCH_COLORS[node.branch];
          connectionAlpha = 1.0;
          lineWidth = this.CONNECTION_WIDTH + 1;
        } else if (prereqNode.purchased) {
          connectionColor = this.BRANCH_COLORS[node.branch];
          connectionAlpha = 0.7;
        }
        
        // Draw connection line
        renderer.drawLine(
          prereqNode.position.x,
          prereqNode.position.y,
          node.position.x,
          node.position.y,
          {
            strokeStyle: connectionColor,
            lineWidth: lineWidth,
            alpha: connectionAlpha
          }
        );
        
        // Draw arrow head
        this.drawArrowHead(renderer, prereqNode.position, node.position, connectionColor, connectionAlpha);
      }
    }
  }

  /**
   * Draw arrow head on connection line
   */
  private drawArrowHead(
    renderer: CanvasRenderer,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    alpha: number
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // Calculate arrow position (slightly before the target node)
    const arrowDistance = this.NODE_RADIUS + 5;
    const arrowX = to.x - (dx / distance) * arrowDistance;
    const arrowY = to.y - (dy / distance) * arrowDistance;
    
    // Calculate arrow direction
    const angle = Math.atan2(dy, dx);
    const arrowLength = 8;
    const arrowAngle = Math.PI / 6; // 30 degrees
    
    // Arrow points
    const p1x = arrowX - arrowLength * Math.cos(angle - arrowAngle);
    const p1y = arrowY - arrowLength * Math.sin(angle - arrowAngle);
    const p2x = arrowX - arrowLength * Math.cos(angle + arrowAngle);
    const p2y = arrowY - arrowLength * Math.sin(angle + arrowAngle);
    
    // Draw arrow head
    const ctx = renderer.getContext();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(p1x, p1y);
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Render branch labels
   */
  private renderBranchLabels(renderer: CanvasRenderer): void {
    const branches = [
      { branch: SkillBranch.OFFENSIVE, name: 'OFFENSIVE', position: { x: -300, y: -180 } },
      { branch: SkillBranch.DEFENSIVE, name: 'DEFENSIVE', position: { x: -100, y: -180 } },
      { branch: SkillBranch.ECONOMIC, name: 'ECONOMIC', position: { x: 100, y: -180 } },
      { branch: SkillBranch.UTILITY, name: 'UTILITY', position: { x: 300, y: -180 } },
      { branch: SkillBranch.BALLISTIC, name: 'BALLISTIC', position: { x: -200, y: 120 } },
      { branch: SkillBranch.ENERGY, name: 'ENERGY', position: { x: 200, y: 120 } }
    ];
    
    for (const branchInfo of branches) {
      const branchNodes = this.skillTree.getNodesByBranch(branchInfo.branch);
      const purchasedCount = branchNodes.filter(n => n.purchased).length;
      const totalCount = branchNodes.length;
      
      // Branch title
      renderer.drawText(branchInfo.name, branchInfo.position.x, branchInfo.position.y, {
        fillStyle: this.BRANCH_COLORS[branchInfo.branch],
        font: 'bold 16px Arial',
        textAlign: 'center'
      });
      
      // Progress indicator
      renderer.drawText(`${purchasedCount}/${totalCount}`, branchInfo.position.x, branchInfo.position.y + 20, {
        fillStyle: '#CCCCCC',
        font: '12px Arial',
        textAlign: 'center'
      });
    }
  }

  /**
   * Render all skill nodes
   */
  private renderNodes(renderer: CanvasRenderer): void {
    const nodes = this.skillTree.getAllNodes();
    
    // Sort nodes by tier so lower tiers render behind higher tiers
    const sortedNodes = [...nodes].sort((a, b) => a.tier - b.tier);
    
    for (const node of sortedNodes) {
      this.renderNode(renderer, node);
    }
  }

  /**
   * Render a single skill node
   */
  private renderNode(renderer: CanvasRenderer, node: SkillNode): void {
    const x = node.position.x;
    const y = node.position.y;
    const radius = this.NODE_RADIUS;
    
    // Determine node visual state
    const canPurchase = this.skillTree.canPurchaseNode(node.id);
    const isHovered = this.hoveredNode?.id === node.id;
    const isSelected = this.selectedNode?.id === node.id;
    
    // Base colors
    let fillColor = '#333333';
    let strokeColor = '#666666';
    let iconColor = '#888888';
    let glowIntensity = 0;
    
    if (node.purchased) {
      fillColor = this.BRANCH_COLORS[node.branch];
      strokeColor = '#FFFFFF';
      iconColor = '#FFFFFF';
      glowIntensity = 0.3;
    } else if (canPurchase) {
      fillColor = '#555555';
      strokeColor = this.BRANCH_COLORS[node.branch];
      iconColor = '#CCCCCC';
      glowIntensity = isHovered ? 0.5 : 0.2;
    } else {
      fillColor = '#222222';
      strokeColor = '#444444';
      iconColor = '#666666';
    }
    
    // Hover/selection effects
    if (isHovered || isSelected) {
      glowIntensity = Math.max(glowIntensity, 0.7);
      strokeColor = '#FFFFFF';
    }
    
    // Draw glow effect
    if (glowIntensity > 0) {
      for (let i = 3; i >= 1; i--) {
        renderer.drawCircle(x, y, radius + i * 3, {
          strokeStyle: this.BRANCH_COLORS[node.branch],
          lineWidth: 2,
          alpha: glowIntensity * (1 - i * 0.3)
        });
      }
    }
    
    // Draw main node circle
    renderer.drawCircle(x, y, radius, {
      fillStyle: fillColor,
      strokeStyle: strokeColor,
      lineWidth: 2
    });
    
    // Draw node icon
    renderer.drawText(node.icon, x, y + 2, {
      fillStyle: iconColor,
      font: '20px Arial',
      textAlign: 'center'
    });
    
    // Draw tier indicator
    const tierColor = node.purchased ? '#FFFFFF' : this.BRANCH_COLORS[node.branch];
    for (let i = 0; i < node.tier; i++) {
      const dotX = x - (node.tier - 1) * 3 + i * 6;
      const dotY = y + radius + 8;
      
      renderer.drawCircle(dotX, dotY, 2, {
        fillStyle: tierColor,
        alpha: node.purchased ? 1.0 : 0.6
      });
    }
    
    // Draw cost indicator for purchasable nodes
    if (!node.purchased && canPurchase) {
      renderer.drawText(`${node.cost}`, x, y - radius - 8, {
        fillStyle: '#FFD700',
        font: 'bold 12px Arial',
        textAlign: 'center'
      });
    }
    
    // Draw purchase animation
    const animation = this.findPurchaseAnimation(node.id);
    if (animation) {
      const pulseRadius = radius + animation.intensity * 15;
      renderer.drawCircle(x, y, pulseRadius, {
        strokeStyle: '#FFFFFF',
        lineWidth: 3,
        alpha: animation.intensity * 0.8
      });
    }
  }

  /**
   * Find purchase animation for node
   */
  private findPurchaseAnimation(_nodeId: string): { intensity: number } | null {
    // This would access the purchase animations from SkillTreeSystem
    // For now, return null as we don't have direct access
    return null;
  }

  /**
   * Render node details overlay
   */
  private renderNodeDetails(renderer: CanvasRenderer, viewport: any): void {
    const detailNode = this.selectedNode || this.hoveredNode;
    if (!detailNode) return;
    
    // Position details panel
    const panelWidth = 300;
    const panelHeight = 150;
    const panelX = viewport.width - panelWidth - 20;
    const panelY = 20;
    
    // Draw panel background
    const ctx = renderer.getContext();
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeStyle = this.BRANCH_COLORS[detailNode.branch];
    ctx.lineWidth = 2;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    ctx.restore();
    
    // Draw node details
    const textX = panelX + 15;
    let textY = panelY + 25;
    const lineHeight = 20;
    
    // Node name and icon
    renderer.drawScreenText(`${detailNode.icon} ${detailNode.name}`, textX, textY, {
      fillStyle: this.BRANCH_COLORS[detailNode.branch],
      font: 'bold 16px Arial',
      textAlign: 'left'
    });
    textY += lineHeight + 5;
    
    // Description
    const description = this.wrapText(detailNode.description, 35);
    for (const line of description) {
      renderer.drawScreenText(line, textX, textY, {
        fillStyle: '#CCCCCC',
        font: '12px Arial',
        textAlign: 'left'
      });
      textY += 15;
    }
    
    textY += 5;
    
    // Cost and status
    if (detailNode.purchased) {
      renderer.drawScreenText('✅ PURCHASED', textX, textY, {
        fillStyle: '#44FF44',
        font: 'bold 12px Arial',
        textAlign: 'left'
      });
    } else {
      const canPurchase = this.skillTree.canPurchaseNode(detailNode.id);
      const statusText = canPurchase ? `Cost: ${detailNode.cost} coins` : 'Prerequisites not met';
      const statusColor = canPurchase ? '#FFD700' : '#FF4444';
      
      renderer.drawScreenText(statusText, textX, textY, {
        fillStyle: statusColor,
        font: 'bold 12px Arial',
        textAlign: 'left'
      });
    }
    
    // Prerequisites
    if (detailNode.prerequisites.length > 0 && !detailNode.purchased) {
      textY += lineHeight;
      renderer.drawScreenText('Prerequisites:', textX, textY, {
        fillStyle: '#AAAAAA',
        font: '11px Arial',
        textAlign: 'left'
      });
      textY += 15;
      
      for (const prereqId of detailNode.prerequisites) {
        const prereqNode = this.skillTree.getAllNodes().find(n => n.id === prereqId);
        if (prereqNode) {
          const status = prereqNode.purchased ? '✅' : '❌';
          renderer.drawScreenText(`${status} ${prereqNode.name}`, textX + 10, textY, {
            fillStyle: prereqNode.purchased ? '#44FF44' : '#FF4444',
            font: '10px Arial',
            textAlign: 'left'
          });
          textY += 12;
        }
      }
    }
  }

  /**
   * Render UI elements
   */
  private renderUI(renderer: CanvasRenderer, viewport: any): void {
    // Coins display
    const coins = this.skillTree.getAvailableCoins();
    renderer.drawScreenText(`💰 Coins: ${coins}`, 20, 30, {
      fillStyle: '#FFD700',
      font: 'bold 18px Arial',
      textAlign: 'left'
    });
    
    // Stats display
    const stats = this.skillTree.getStats();
    renderer.drawScreenText(`Nodes: ${stats.totalNodesUnlocked}`, 20, 55, {
      fillStyle: '#CCCCCC',
      font: '14px Arial',
      textAlign: 'left'
    });
    
    renderer.drawScreenText(`Spent: ${stats.totalCoinsSpent}`, 20, 75, {
      fillStyle: '#CCCCCC',
      font: '14px Arial',
      textAlign: 'left'
    });
    
    // Instructions
    renderer.drawScreenText('Click nodes to purchase | ESC to return', viewport.width / 2, viewport.height - 30, {
      fillStyle: '#888888',
      font: '14px Arial',
      textAlign: 'center'
    });
    
    // Branch completion indicators
    let indicatorY = 120;
    for (const branch of Object.values(SkillBranch)) {
      const branchNodes = this.skillTree.getNodesByBranch(branch);
      const purchasedCount = branchNodes.filter(n => n.purchased).length;
      const totalCount = branchNodes.length;
      const isComplete = purchasedCount === totalCount && totalCount > 0;
      
      const branchName = branch.toUpperCase();
      const indicator = isComplete ? '✅' : '⭕';
      const color = isComplete ? '#44FF44' : this.BRANCH_COLORS[branch];
      
      renderer.drawScreenText(`${indicator} ${branchName}`, 20, indicatorY, {
        fillStyle: color,
        font: '12px Arial',
        textAlign: 'left'
      });
      
      indicatorY += 18;
    }
  }

  /**
   * Wrap text to fit within specified character width
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Set scroll offset for panning
   */
  public setScrollOffset(x: number, y: number): void {
    this.scrollOffset.x = x;
    this.scrollOffset.y = y;
  }

  /**
   * Set scale for zooming
   */
  public setScale(scale: number): void {
    this.scale = Math.max(0.5, Math.min(2.0, scale));
  }

  /**
   * Set hovered node
   */
  public setHoveredNode(node: SkillNode | null): void {
    this.hoveredNode = node;
  }

  /**
   * Set selected node
   */
  public setSelectedNode(node: SkillNode | null): void {
    this.selectedNode = node;
  }

  /**
   * Get current scroll offset
   */
  public getScrollOffset(): { x: number; y: number } {
    return { ...this.scrollOffset };
  }

  /**
   * Get current scale
   */
  public getScale(): number {
    return this.scale;
  }
}