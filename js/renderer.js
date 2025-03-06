// Scene rendering functionality

let engine = null;
let scene = null;

/**
 * Initialize the Babylon.js renderer
 */
export function initialize() {
    const canvas = document.getElementById('renderCanvas');
    if (!canvas) return;
    
    // Initialize the engine
    engine = new BABYLON.Engine(canvas, true);
    
    // Create an empty scene
    scene = new BABYLON.Scene(engine);
    
    // Handle window resizing
    window.addEventListener('resize', () => {
        if (engine) {
            engine.resize();
        }
    });
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