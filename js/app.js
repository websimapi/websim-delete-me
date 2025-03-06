import * as UI from './ui.js';
import * as APIExplorer from './apiExplorer.js';
import * as Editor from './editor.js';
import * as Renderer from './renderer.js';

// Initialize the application
window.addEventListener('load', function() {
    // Initialize UI components
    UI.initializeTabs();
    
    // Initialize API Explorer
    APIExplorer.initialize();
    
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
});