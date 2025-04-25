# Dijkstra's Algorithm Visualization

This is an interactive visualization of Dijkstra's algorithm, a popular algorithm for finding the shortest path between nodes in a graph.

## Features

- Interactive graph creation
- Visual step-by-step demonstration of Dijkstra's algorithm
- Real-time distance updates
- Path highlighting
- Customizable graph with weighted edges

## How to Use

1. Open `index.html` in a web browser
2. Create nodes by clicking on the canvas
3. Create edges by clicking and dragging between nodes
4. Set the start node by right-clicking on a node (green)
5. Set the end node by right-clicking on another node (red)
6. Click "Start Visualization" to see Dijkstra's algorithm in action
7. Use "Reset" to clear the visualization and start over

## Controls

- Left-click: Create nodes
- Click and drag between nodes: Create edges
- Right-click on a node: Set as start/end node
- Start button: Begin visualization
- Reset button: Clear visualization

## Visual Elements

- Green node: Start node
- Red node: End node
- Blue node: Current node being processed
- Gray edges: Regular edges
- Numbers on edges: Edge weights
- Numbers in nodes: Current shortest distance from start

## Technical Details

The visualization is built using:
- HTML5 Canvas for rendering
- JavaScript for algorithm implementation
- CSS for styling

The implementation follows the standard Dijkstra's algorithm:
1. Initialize all nodes with infinite distance
2. Set start node distance to 0
3. While there are unvisited nodes:
   - Select the unvisited node with the smallest distance
   - Update distances of its neighbors
   - Mark the node as visited
4. Trace back from the end node to find the shortest path 