class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.neighbors = new Map(); // Map of neighbor nodes to edge weights
        this.distance = Infinity;
        this.visited = false;
        this.previous = null;
    }

    draw(ctx, isStart = false, isEnd = false, isCurrent = false, isPath = false) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = isStart ? '#4CAF50' : isEnd ? '#f44336' : isCurrent ? '#2196F3' : isPath ? '#FFD700' : '#333';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw distance
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.distance === Infinity ? '∞' : this.distance.toString(), this.x, this.y + 4);
    }
}

class Graph {
    constructor() {
        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.currentNode = null;
        this.shortestPath = new Set();
        this.totalDistance = null;
        this.visitedNodes = new Set();
        this.algorithmSteps = [];
    }

    addNode(x, y) {
        // Check if there's already a node at this position
        const existingNode = this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= node.radius;
        });
        
        if (existingNode) return null;
        
        const node = new Node(x, y);
        this.nodes.push(node);
        return node;
    }

    addEdge(node1, node2, weight = 1, bidirectional = true) {
        // Check if edge already exists
        if (node1.neighbors.has(node2)) return;
        
        node1.neighbors.set(node2, weight);
        if (bidirectional) {
            node2.neighbors.set(node1, weight);
        }
    }

    updateEdgeWeight(node1, node2, newWeight, bidirectional = true) {
        if (node1.neighbors.has(node2)) {
            node1.neighbors.set(node2, newWeight);
            if (bidirectional) {
                node2.neighbors.set(node1, newWeight);
            }
            return true;
        }
        return false;
    }

    updateAlgorithmTable() {
        const tableContainer = document.getElementById('algorithmTable');
        tableContainer.innerHTML = '';

        if (this.nodes.length === 0) return;

        const table = document.createElement('table');
        
        // Create header row
        const headerRow = document.createElement('tr');
        const stepHeader = document.createElement('th');
        stepHeader.textContent = 'Step';
        headerRow.appendChild(stepHeader);

        this.nodes.forEach(node => {
            const th = document.createElement('th');
            th.textContent = `Node ${this.nodes.indexOf(node) + 1}`;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Create data rows
        this.algorithmSteps.forEach((step, stepIndex) => {
            const row = document.createElement('tr');
            
            // Step number
            const stepCell = document.createElement('td');
            stepCell.textContent = stepIndex + 1;
            row.appendChild(stepCell);

            // Node distances
            this.nodes.forEach(node => {
                const cell = document.createElement('td');
                const distance = step.distances.get(node);
                cell.textContent = distance === Infinity ? '∞' : distance;
                
                if (step.currentNode === node) {
                    cell.classList.add('current-node');
                } else if (step.visitedNodes.has(node)) {
                    cell.classList.add('visited-node');
                } else if (this.shortestPath.has(node)) {
                    cell.classList.add('path-node');
                }
                
                if (distance === Infinity) {
                    cell.classList.add('infinity');
                }
                
                row.appendChild(cell);
            });

            table.appendChild(row);
        });

        tableContainer.appendChild(table);
    }

    addAlgorithmStep() {
        const step = {
            distances: new Map(),
            currentNode: this.currentNode,
            visitedNodes: new Set(this.visitedNodes)
        };

        this.nodes.forEach(node => {
            step.distances.set(node, node.distance);
        });

        this.algorithmSteps.push(step);
        this.updateAlgorithmTable();
    }

    reset() {
        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.currentNode = null;
        this.shortestPath = new Set();
        this.totalDistance = null;
        this.visitedNodes = new Set();
        this.algorithmSteps = [];
        this.updateAlgorithmTable();
    }

    resetVisualization() {
        this.nodes.forEach(node => {
            node.distance = Infinity;
            node.visited = false;
            node.previous = null;
        });
        this.currentNode = null;
        this.shortestPath = new Set();
        this.totalDistance = null;
        this.visitedNodes = new Set();
        this.algorithmSteps = [];
        if (this.startNode) {
            this.startNode.distance = 0;
        }
        this.updateAlgorithmTable();
    }

    draw(ctx) {
        // Draw edges
        this.nodes.forEach(node => {
            node.neighbors.forEach((weight, neighbor) => {
                const isPathEdge = this.shortestPath.has(node) && this.shortestPath.has(neighbor) &&
                    (node.previous === neighbor || neighbor.previous === node);

                // Draw arrow for directed edge
                const angle = Math.atan2(neighbor.y - node.y, neighbor.x - node.x);
                const arrowLength = 10;
                const arrowAngle = Math.PI / 6;
                
                // Calculate points for the arrow
                const endX = neighbor.x - (neighbor.radius * Math.cos(angle));
                const endY = neighbor.y - (neighbor.radius * Math.sin(angle));
                const startX = node.x + (node.radius * Math.cos(angle));
                const startY = node.y + (node.radius * Math.sin(angle));

                // Draw the line
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = isPathEdge ? '#FFD700' : '#999';
                ctx.lineWidth = isPathEdge ? 4 : 2;
                ctx.stroke();

                // Draw the arrow
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle - arrowAngle),
                    endY - arrowLength * Math.sin(angle - arrowAngle)
                );
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle + arrowAngle),
                    endY - arrowLength * Math.sin(angle + arrowAngle)
                );
                ctx.closePath();
                ctx.fillStyle = isPathEdge ? '#FFD700' : '#999';
                ctx.fill();

                // Draw weight with better visibility
                const midX = (node.x + neighbor.x) / 2;
                const midY = (node.y + neighbor.y) / 2;
                
                // Draw background for weight text
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(midX - 15, midY - 15, 30, 20);
                
                // Draw weight text
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(weight.toString(), midX, midY);
            });
        });

        // Draw nodes
        this.nodes.forEach(node => {
            node.draw(
                ctx,
                node === this.startNode,
                node === this.endNode,
                node === this.currentNode,
                this.shortestPath.has(node)
            );
        });

        // Draw total distance if available
        if (this.totalDistance !== null) {
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Shortest Path Distance: ${this.totalDistance}`, 10, 30);
        }
    }

    findEdgeAt(x, y) {
        for (const node of this.nodes) {
            for (const [neighbor, weight] of node.neighbors) {
                const midX = (node.x + neighbor.x) / 2;
                const midY = (node.y + neighbor.y) / 2;
                const dx = midX - x;
                const dy = midY - y;
                if (Math.sqrt(dx * dx + dy * dy) <= 10) {
                    return { node1: node, node2: neighbor, weight };
                }
            }
        }
        return null;
    }
}

class DijkstraVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = new Graph();
        this.isRunning = false;
        this.animationSpeed = 1000; // ms between steps
        this.isDragging = false;
        this.startNode = null;
        this.isWeightAdjusting = false;
        this.selectedEdge = null;
        this.bidirectionalMode = true; // Default to bidirectional edges

        this.setupEventListeners();
        this.resizeCanvas();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Add bidirectional toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle Bidirectional';
        toggleButton.style.margin = '0 10px';
        document.querySelector('.controls').appendChild(toggleButton);
        
        toggleButton.addEventListener('click', () => {
            this.bidirectionalMode = !this.bidirectionalMode;
            toggleButton.textContent = this.bidirectionalMode ? 'Bidirectional Mode' : 'Unidirectional Mode';
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.isRunning) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicking on an edge weight
            const edge = this.graph.findEdgeAt(x, y);
            if (edge) {
                const newWeight = prompt('Enter new edge weight:', edge.weight);
                if (newWeight !== null) {
                    const weight = parseInt(newWeight);
                    if (!isNaN(weight) && weight > 0) {
                        this.graph.updateEdgeWeight(edge.node1, edge.node2, weight, this.bidirectionalMode);
                        this.draw();
                    }
                }
                return;
            }

            this.graph.addNode(x, y);
            this.draw();
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.isRunning) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const clickedNode = this.findNodeAt(x, y);
            if (clickedNode) {
                if (!this.graph.startNode) {
                    this.graph.startNode = clickedNode;
                    clickedNode.distance = 0;
                } else if (!this.graph.endNode) {
                    this.graph.endNode = clickedNode;
                }
                this.draw();
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isRunning) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.startNode = this.findNodeAt(x, y);
            if (this.startNode) this.isDragging = true;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const endNode = this.findNodeAt(x, y);
            if (endNode && endNode !== this.startNode) {
                const weight = prompt('Enter edge weight:', '1');
                const edgeWeight = weight ? parseInt(weight) : 1;
                if (!isNaN(edgeWeight) && edgeWeight > 0) {
                    this.graph.addEdge(this.startNode, endNode, edgeWeight, this.bidirectionalMode);
                    this.isDragging = false;
                    this.startNode = null;
                    this.draw();
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.startNode = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.startNode = null;
        });
    }

    findNodeAt(x, y) {
        return this.graph.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= node.radius;
        });
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.graph.draw(this.ctx);
    }

    async visualize() {
        if (!this.graph.startNode || !this.graph.endNode) {
            alert('Please set both start and end nodes (right-click)');
            return;
        }

        if (this.isRunning) return;
        
        this.isRunning = true;
        this.graph.resetVisualization();
        this.draw();

        const unvisited = new Set(this.graph.nodes);

        while (unvisited.size > 0) {
            const current = this.getMinDistanceNode(unvisited);
            if (!current || current.distance === Infinity) break;

            unvisited.delete(current);
            this.graph.currentNode = current;
            this.graph.visitedNodes.add(current);
            this.draw();
            this.graph.addAlgorithmStep();

            if (current === this.graph.endNode) {
                this.highlightPath();
                break;
            }

            current.neighbors.forEach((weight, neighbor) => {
                if (!unvisited.has(neighbor)) return;

                const newDistance = current.distance + weight;
                if (newDistance < neighbor.distance) {
                    neighbor.distance = newDistance;
                    neighbor.previous = current;
                }
            });

            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
        }

        this.isRunning = false;
    }

    getMinDistanceNode(unvisited) {
        let minNode = null;
        let minDistance = Infinity;

        unvisited.forEach(node => {
            if (node.distance < minDistance) {
                minDistance = node.distance;
                minNode = node;
            }
        });

        return minNode;
    }

    highlightPath() {
        let current = this.graph.endNode;
        this.graph.shortestPath = new Set();
        this.graph.totalDistance = current.distance;

        while (current && current !== this.graph.startNode) {
            this.graph.shortestPath.add(current);
            current = current.previous;
        }
        if (current === this.graph.startNode) {
            this.graph.shortestPath.add(current);
        }
        this.draw();
    }
}

// Initialize the visualizer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const visualizer = new DijkstraVisualizer(canvas);
    
    // Add event listeners for the start and reset buttons
    document.getElementById('start').addEventListener('click', () => {
        if (!visualizer.isRunning) {
            visualizer.visualize();
        }
    });

    document.getElementById('reset').addEventListener('click', () => {
        visualizer.graph.reset();
        visualizer.draw();
    });
}); 