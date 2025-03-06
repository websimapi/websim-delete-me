// Monaco Editor functionality
let editorInstance = null;
let initialized = false;

/**
 * Check if editor is initialized
 */
export function isInitialized() {
    return initialized;
}

/**
 * Get editor instance
 */
export function getEditorInstance() {
    return editorInstance;
}

/**
 * Initialize Monaco Editor
 */
export function initialize() {
    if (initialized) return;
    
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
    
    require(['vs/editor/editor.main'], function() {
        // Register Babylon.js language
        registerBabylonAutocomplete();
        
        // Create editor
        editorInstance = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: getDefaultCode(),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontLigatures: true,
            contextmenu: true,
            fontSize: 14,
            lineNumbers: 'on',
            renderIndentGuides: true,
            suggestOnTriggerCharacters: true
        });
        
        // Set up run button
        document.getElementById('run-code').addEventListener('click', runCode);
        // Set up reset button
        document.getElementById('reset-code').addEventListener('click', resetCode);
        
        initialized = true;
    });
}

/**
 * Register Babylon.js autocomplete
 */
function registerBabylonAutocomplete() {
    if (!monaco) return;
    
    // Define keywords
    const keywords = [
        'BABYLON', 'Scene', 'Engine', 'Vector3', 'Mesh', 'MeshBuilder', 
        'StandardMaterial', 'PBRMaterial', 'Color3', 'Color4',
        'ArcRotateCamera', 'FreeCamera', 'HemisphericLight', 'DirectionalLight',
        'PointLight', 'ShadowGenerator', 'Animation', 'AnimationGroup'
    ];
    
    // Register completion item provider
    monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: function(model, position) {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            // Check if we're after BABYLON.
            const match = textUntilPosition.match(/BABYLON\.(\w*)$/);
            if (match) {
                // Get API data from API Explorer
                const apiData = window.BabylonExplorer?.APIExplorer?.getAPIData() || {};
                const suggestions = [];
                
                // Add child objects as suggestions
                if (apiData.children) {
                    for (const key in apiData.children) {
                        suggestions.push({
                            label: key,
                            kind: monaco.languages.CompletionItemKind.Class,
                            insertText: key,
                            detail: 'Babylon.js class'
                        });
                    }
                }
                
                return { suggestions };
            }
            
            // Basic suggestions when not after BABYLON.
            return {
                suggestions: keywords.map(keyword => ({
                    label: keyword,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: keyword
                }))
            };
        }
    });
}

/**
 * Insert text at cursor position
 */
export function insertTextAtCursor(text) {
    if (!editorInstance) return;
    
    const position = editorInstance.getPosition();
    editorInstance.executeEdits('', [
        {
            range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            },
            text: text
        }
    ]);
}

/**
 * Default code for the editor
 */
function getDefaultCode() {
    return `// Babylon.js Scene Example
// This code will create a simple scene with a rotating cube

// Get the canvas element
const canvas = document.getElementById("renderCanvas");

// Initialize the Babylon.js engine
const engine = new BABYLON.Engine(canvas, true);

// Create a scene
function createScene() {
    const scene = new BABYLON.Scene(engine);
    
    // Add a camera
    const camera = new BABYLON.ArcRotateCamera("camera", 
        -Math.PI / 2, Math.PI / 2.5, 3, 
        BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    
    // Add a light
    const light = new BABYLON.HemisphericLight("light", 
        new BABYLON.Vector3(0, 1, 0), scene);
    
    // Create a box
    const box = BABYLON.MeshBuilder.CreateBox("box", 
        {size: 1}, scene);
    
    // Add material
    const material = new BABYLON.StandardMaterial("material", scene);
    material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.8);
    box.material = material;
    
    // Animation
    scene.registerBeforeRender(function() {
        box.rotation.y += 0.01;
        box.rotation.x += 0.005;
    });
    
    return scene;
}

// Create and run the scene
const scene = createScene();
engine.runRenderLoop(function() {
    scene.render();
});

// Handle window resize
window.addEventListener("resize", function() {
    engine.resize();
});

console.log("Scene created successfully!");`;
}

/**
 * Run code from the editor
 */
function runCode() {
    if (!editorInstance) return;
    
    const code = editorInstance.getValue();
    const consoleOutput = document.getElementById('console-output');
    consoleOutput.innerHTML = '';
    
    // Create a custom console log to capture output
    const originalConsoleLog = console.log;
    console.log = function() {
        const output = Array.from(arguments)
            .map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg)
            .join(' ');
        
        const logLine = document.createElement('div');
        logLine.textContent = output;
        consoleOutput.appendChild(logLine);
        
        originalConsoleLog.apply(console, arguments);
    };
    
    // Clean up previous scene
    import('./renderer.js').then(module => {
        module.cleanupScene();
        
        try {
            // Execute the code
            eval(code);
            
            // Add success message
            const successLine = document.createElement('div');
            successLine.textContent = '✓ Code executed successfully';
            successLine.style.color = '#4CAF50';
            consoleOutput.appendChild(successLine);
        } catch (error) {
            // Add error message
            const errorLine = document.createElement('div');
            errorLine.textContent = `❌ Error: ${error.message}`;
            errorLine.style.color = '#F44336';
            consoleOutput.appendChild(errorLine);
            
            console.error(error);
        }
        
        // Restore console.log
        console.log = originalConsoleLog;
    });
}

/**
 * Reset editor code to default
 */
function resetCode() {
    if (editorInstance) {
        editorInstance.setValue(getDefaultCode());
    }
}