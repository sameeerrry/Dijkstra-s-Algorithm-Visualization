class City {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = 0.5;
        this.neighbors = new Map();
        this.distance = Infinity;
        this.visited = false;
        this.previous = null;
        this.underMaintenance = false;
        this.mesh = null;
        this.label = null;
    }

    createMesh(scene) {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: this.underMaintenance ? 0xff0000 : 0x333333,
            shininess: 100
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y, this.z);
        scene.add(this.mesh);

        // Add city label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(this.distance === Infinity ? '∞' : this.distance.toString(), canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.label = new THREE.Sprite(spriteMaterial);
        this.label.position.set(this.x, this.y + this.radius + 0.2, this.z);
        this.label.scale.set(1, 0.5, 1);
        scene.add(this.label);
    }

    updateLabel() {
        if (this.label) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = '24px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(this.distance === Infinity ? '∞' : this.distance.toString(), canvas.width/2, canvas.height/2);
            this.label.material.map = new THREE.CanvasTexture(canvas);
            this.label.material.needsUpdate = true;
        }
    }

    setMaintenance(status) {
        this.underMaintenance = status;
        if (this.mesh) {
            this.mesh.material.color.set(status ? 0xff0000 : 0x333333);
        }
    }

    highlight(color) {
        if (this.mesh) {
            this.mesh.material.color.set(color);
        }
    }
}

class Tunnel {
    constructor(city1, city2, cost) {
        this.city1 = city1;
        this.city2 = city2;
        this.cost = cost;
        this.mesh = null;
        this.label = null;
    }

    createMesh(scene) {
        const start = new THREE.Vector3(this.city1.x, this.city1.y, this.city1.z);
        const end = new THREE.Vector3(this.city2.x, this.city2.y, this.city2.z);
        
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();

        const geometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0, length / 2);

        const material = new THREE.MeshPhongMaterial({ 
            color: 0x999999,
            transparent: true,
            opacity: 0.8
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(start);
        this.mesh.lookAt(end);
        scene.add(this.mesh);

        // Add cost label
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 32;
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '16px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(this.cost.toString(), canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.label = new THREE.Sprite(spriteMaterial);
        this.label.position.copy(midPoint);
        this.label.scale.set(0.5, 0.25, 1);
        scene.add(this.label);
    }

    highlight(color) {
        if (this.mesh) {
            this.mesh.material.color.set(color);
            this.mesh.material.opacity = 1;
        }
    }
}

class Graph3D {
    constructor() {
        this.cities = [];
        this.tunnels = [];
        this.startCity = null;
        this.endCity = null;
        this.currentCity = null;
        this.shortestPath = new Set();
        this.totalDistance = null;
        this.visitedCities = new Set();
        this.algorithmSteps = [];
    }

    addCity(x, y, z) {
        const city = new City(x, y, z);
        this.cities.push(city);
        return city;
    }

    addTunnel(city1, city2, cost = 1) {
        if (city1.underMaintenance || city2.underMaintenance) return null;
        
        const existingTunnel = this.tunnels.find(t => 
            (t.city1 === city1 && t.city2 === city2) || 
            (t.city1 === city2 && t.city2 === city1)
        );
        
        if (existingTunnel) return null;
        
        const tunnel = new Tunnel(city1, city2, cost);
        this.tunnels.push(tunnel);
        city1.neighbors.set(city2, cost);
        city2.neighbors.set(city1, cost);
        return tunnel;
    }

    updateTunnelCost(city1, city2, newCost) {
        const tunnel = this.tunnels.find(t => 
            (t.city1 === city1 && t.city2 === city2) || 
            (t.city1 === city2 && t.city2 === city1)
        );
        
        if (tunnel) {
            tunnel.cost = newCost;
            city1.neighbors.set(city2, newCost);
            city2.neighbors.set(city1, newCost);
            return true;
        }
        return false;
    }

    reset() {
        this.cities = [];
        this.tunnels = [];
        this.startCity = null;
        this.endCity = null;
        this.currentCity = null;
        this.shortestPath = new Set();
        this.totalDistance = null;
        this.visitedCities = new Set();
        this.algorithmSteps = [];
    }

    resetVisualization() {
        this.cities.forEach(city => {
            city.distance = Infinity;
            city.visited = false;
            city.previous = null;
            city.highlight(0x333333);
        });
        this.tunnels.forEach(tunnel => {
            tunnel.highlight(0x999999);
        });
        this.currentCity = null;
        this.shortestPath = new Set();
        this.totalDistance = null;
        this.visitedCities = new Set();
        this.algorithmSteps = [];
        if (this.startCity) {
            this.startCity.distance = 0;
        }
    }
}

class Dijkstra3DVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.graph = new Graph3D();
        this.isRunning = false;
        this.animationSpeed = 1000;
        this.isDragging = false;
        this.startCity = null;
        this.selectedTunnel = null;
        this.isCreatingEdge = false;
        this.edgeStartCity = null;
        this.edgePreview = null;
        this.edgePreviewGeometry = null;
        this.edgePreviewMaterial = null;

        this.setupScene();
        this.setupEventListeners();
        this.animate();
    }

    setupScene() {
        this.renderer.setSize(800, 600);
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Set camera position
        this.camera.position.z = 10;
        this.camera.position.y = 5;
        this.controls.update();

        // Add grid helper
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        this.renderer.domElement.addEventListener('contextmenu', (event) => this.onRightClick(event));
        this.renderer.domElement.addEventListener('click', (event) => this.onClick(event));
        
        // Disable orbit controls during edge creation
        this.controls.enabled = true;
    }

    onMouseDown(event) {
        if (this.isRunning) return;
        
        this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        for (const intersect of intersects) {
            if (intersect.object instanceof THREE.Mesh) {
                const city = this.graph.cities.find(c => c.mesh === intersect.object);
                if (city && !city.underMaintenance) {
                    this.isCreatingEdge = true;
                    this.edgeStartCity = city;
                    this.controls.enabled = false;
                    
                    // Create edge preview
                    this.edgePreviewGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
                    this.edgePreviewMaterial = new THREE.MeshPhongMaterial({ 
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.5
                    });
                    this.edgePreview = new THREE.Mesh(this.edgePreviewGeometry, this.edgePreviewMaterial);
                    this.scene.add(this.edgePreview);
                    return;
                }
            }
        }
    }

    onMouseMove(event) {
        if (!this.isCreatingEdge) return;
        
        this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        // Update edge preview
        if (this.edgePreview) {
            const start = this.edgeStartCity.mesh.position;
            const end = new THREE.Vector3();
            this.raycaster.ray.at(10, end);
            
            const direction = new THREE.Vector3().subVectors(end, start);
            const length = direction.length();
            direction.normalize();
            
            this.edgePreview.scale.set(1, length, 1);
            this.edgePreview.position.copy(start).add(direction.multiplyScalar(length / 2));
            this.edgePreview.lookAt(end);
            this.edgePreview.rotateX(Math.PI / 2);
        }
    }

    onMouseUp() {
        if (!this.isCreatingEdge) return;
        
        this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        for (const intersect of intersects) {
            if (intersect.object instanceof THREE.Mesh) {
                const endCity = this.graph.cities.find(c => c.mesh === intersect.object);
                if (endCity && endCity !== this.edgeStartCity && !endCity.underMaintenance) {
                    const tunnel = this.graph.addTunnel(this.edgeStartCity, endCity);
                    if (tunnel) {
                        tunnel.createMesh(this.scene);
                    }
                }
            }
        }
        
        // Clean up
        if (this.edgePreview) {
            this.scene.remove(this.edgePreview);
            this.edgePreviewGeometry.dispose();
            this.edgePreviewMaterial.dispose();
            this.edgePreview = null;
        }
        
        this.isCreatingEdge = false;
        this.edgeStartCity = null;
        this.controls.enabled = true;
    }

    onClick(event) {
        if (this.isRunning || this.isCreatingEdge) return;
        
        this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        // Check if clicking on empty space
        if (intersects.length === 0 || !(intersects[0].object instanceof THREE.Mesh)) {
            const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0);
            vector.unproject(this.camera);
            const dir = vector.sub(this.camera.position).normalize();
            const distance = -this.camera.position.y / dir.y;
            const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
            
            const city = this.graph.addCity(pos.x, 0, pos.z);
            if (city) {
                city.createMesh(this.scene);
            }
        }
    }

    onRightClick(event) {
        event.preventDefault();
        if (this.isRunning) return;

        this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        for (const intersect of intersects) {
            if (intersect.object instanceof THREE.Mesh) {
                const city = this.graph.cities.find(c => c.mesh === intersect.object);
                if (city) {
                    if (!this.graph.startCity) {
                        this.graph.startCity = city;
                        city.distance = 0;
                        city.highlight(0x4CAF50); // Green
                    } else if (!this.graph.endCity) {
                        this.graph.endCity = city;
                        city.highlight(0xf44336); // Red
                    } else {
                        city.setMaintenance(!city.underMaintenance);
                    }
                    city.updateLabel();
                    return;
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    async visualize() {
        if (!this.graph.startCity || !this.graph.endCity) {
            alert('Please set both start and end cities (right-click)');
            return;
        }

        if (this.isRunning) return;
        
        this.isRunning = true;
        this.graph.resetVisualization();

        const unvisited = new Set(this.graph.cities.filter(city => !city.underMaintenance));

        while (unvisited.size > 0) {
            const current = this.getMinDistanceCity(unvisited);
            if (!current || current.distance === Infinity) break;

            unvisited.delete(current);
            this.graph.currentCity = current;
            this.graph.visitedCities.add(current);
            current.highlight(0x2196F3); // Blue

            if (current === this.graph.endCity) {
                this.highlightPath();
                break;
            }

            current.neighbors.forEach((cost, neighbor) => {
                if (!unvisited.has(neighbor) || neighbor.underMaintenance) return;

                const newDistance = current.distance + cost;
                if (newDistance < neighbor.distance) {
                    neighbor.distance = newDistance;
                    neighbor.previous = current;
                    neighbor.updateLabel();
                }
            });

            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
        }

        this.isRunning = false;
    }

    getMinDistanceCity(unvisited) {
        let minCity = null;
        let minDistance = Infinity;

        unvisited.forEach(city => {
            if (city.distance < minDistance) {
                minDistance = city.distance;
                minCity = city;
            }
        });

        return minCity;
    }

    highlightPath() {
        let current = this.graph.endCity;
        this.graph.shortestPath = new Set();
        this.graph.totalDistance = current.distance;

        while (current && current !== this.graph.startCity) {
            this.graph.shortestPath.add(current);
            const tunnel = this.graph.tunnels.find(t => 
                (t.city1 === current && t.city2 === current.previous) || 
                (t.city1 === current.previous && t.city2 === current)
            );
            if (tunnel) {
                tunnel.highlight(0xFFD700); // Gold
            }
            current = current.previous;
        }
        if (current === this.graph.startCity) {
            this.graph.shortestPath.add(current);
        }

        this.graph.shortestPath.forEach(city => {
            city.highlight(0xFFD700); // Gold
        });
    }
}

// Initialize the visualizer when the page loads
window.addEventListener('load', () => {
    const container = document.getElementById('scene3D');
    const visualizer = new Dijkstra3DVisualizer(container);

    document.getElementById('start').addEventListener('click', () => {
        visualizer.visualize();
    });

    document.getElementById('reset').addEventListener('click', () => {
        visualizer.graph.reset();
        visualizer.scene.clear();
        visualizer.setupScene();
    });
}); 