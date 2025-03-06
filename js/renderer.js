// Scene rendering functionality

let engine = null;
let scene = null;

/**
 * Initialize the Babylon.js renderer
 */
export function initialize() {
    console.log("Initializing Babylon.js renderer...");
    
    const canvas = document.getElementById('renderCanvas');
    if (!canvas) {
        console.error("Render canvas not found!");
        return;
    }
    
    // Initialize the engine
    engine = new BABYLON.Engine(canvas, true);
    
    // Create an empty scene
    scene = new BABYLON.Scene(engine);
    
    // Add a simple light and camera to visualize the canvas is working
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, 
        new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    
    // Create a small sphere to show something in the scene
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.5}, scene);
    
    // Start rendering
    engine.runRenderLoop(() => {
        scene.render();
    });
    
    // Handle window resizing
    window.addEventListener('resize', () => {
        if (engine) {
            engine.resize();
        }
    });
    
    console.log("Babylon.js renderer initialized successfully");
}

/**
 * Get the current engine instance
 */
export function getEngine() {
    return engine;
}

/**
 * Get the current scene
 */
export function getScene() {
    return scene;
}

/**
 * Clean up existing scene for new code execution
 */
export function cleanupScene() {
    if (window.scene) {
        try {
            window.scene.dispose();
        } catch (e) {
            console.error("Error disposing scene:", e);
        }
    }
    
    if (window.engine) {
        try {
            window.engine.stopRenderLoop();
        } catch (e) {
            console.error("Error stopping render loop:", e);
        }
    }
    
    // Reset our internal scene if needed
    if (scene) {
        scene.dispose();
        scene = new BABYLON.Scene(engine);
    }
}