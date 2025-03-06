import * as UI from './ui.js';
import * as APIExplorer from './apiExplorer.js';
import * as Editor from './editor.js';
import * as Renderer from './renderer.js';

// Initialize the application
export function initialize() {
    // Initialize UI components
    UI.initializeTabs();
    
    // Initialize API Explorer
    APIExplorer.initialize();
    
    // Initialize Editor
    Editor.initialize();
    
    // Initialize Renderer
    Renderer.initialize();
    
    // Set up API explorer callback to editor
    APIExplorer.setEditorCallback(Editor.insertTextAtCursor);
    
    // Global app state and communication
    window.BabylonExplorer = {
        UI,
        APIExplorer,
        Editor,
        Renderer
    };
    
    console.log("Babylon Explorer initialized successfully");
}

// Add event listener for initialization
window.addEventListener('load', initialize);