// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Show selected tab content
        const tabId = button.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
        
        // Handle special cases when switching tabs
        if (tabId === 'editor' && !editorInitialized) {
            initializeMonacoEditor();
        }
    });
});

// API Explorer functionality
let babylonAPI = {};

// Initialize the API explorer
function initializeAPIExplorer() {
    // Extract API information from BABYLON namespace
    babylonAPI = extractAPIInfo(BABYLON);
    renderAPITree(babylonAPI);

    // Set up search functionality
    const searchInput = document.getElementById('api-search');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        searchAPI(searchTerm);
    });
}

// Extract API information recursively
function extractAPIInfo(obj, path = '', maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) return null;
    
    const result = {
        type: typeof obj,
        properties: {},
        methods: {},
        children: {}
    };

    try {
        // For objects and classes
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            // Get direct properties
            for (const key in obj) {
                try {
                    const value = obj[key];
                    
                    // Skip private properties
                    if (key.startsWith('_')) continue;
                    
                    if (typeof value === 'function') {
                        result.methods[key] = {
                            name: key,
                            description: value.toString().substring(0, 100) + '...'
                        };
                    } else if (typeof value !== 'object' || value === null) {
                        result.properties[key] = {
                            name: key,
                            type: typeof value,
                            value: value
                        };
                    } else if (currentDepth < maxDepth - 1) {
                        // For child objects, go deeper
                        result.children[key] = extractAPIInfo(
                            value, 
                            path ? `${path}.${key}` : key,
                            maxDepth,
                            currentDepth + 1
                        );
                    }
                } catch (err) {
                    // Skip properties that can't be accessed
                    continue;
                }
            }
            
            // Try to extract prototype methods for classes
            if (obj.prototype) {
                try {
                    const protoProps = Object.getOwnPropertyNames(obj.prototype);
                    for (const key of protoProps) {
                        if (key === 'constructor' || key.startsWith('_')) continue;
                        
                        try {
                            const value = obj.prototype[key];
                            if (typeof value === 'function') {
                                result.methods[key] = {
                                    name: key,
                                    description: value.toString().substring(0, 100) + '...'
                                };
                            }
                        } catch (err) {
                            continue;
                        }
                    }
                } catch (err) {
                    // Skip if can't access prototype
                }
            }
        }
    } catch (err) {
        console.log("Error extracting API info:", err);
    }
    
    return result;
}

// Render the API tree in the sidebar
function renderAPITree(apiInfo) {
    const treeContainer = document.getElementById('api-tree');
    treeContainer.innerHTML = '';
    
    // Add main BABYLON namespace
    const rootItem = document.createElement('div');
    rootItem.className = 'tree-item';
    
    const rootHeader = document.createElement('div');
    rootHeader.className = 'tree-item-header';
    rootHeader.textContent = 'BABYLON';
    rootHeader.addEventListener('click', () => {
        displayAPIDetails('BABYLON', apiInfo);
    });
    
    rootItem.appendChild(rootHeader);
    
    // Add children
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-item-children';
    
    for (const key in apiInfo.children) {
        const childInfo = apiInfo.children[key];
        if (childInfo) {
            const childItem = createTreeItem(key, childInfo, `BABYLON.${key}`);
            childrenContainer.appendChild(childItem);
        }
    }
    
    rootItem.appendChild(childrenContainer);
    treeContainer.appendChild(rootItem);
}

// Create a tree item with expandable children
function createTreeItem(name, info, fullPath) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    
    const header = document.createElement('div');
    header.className = 'tree-item-header';
    header.textContent = name;
    header.addEventListener('click', () => {
        displayAPIDetails(fullPath, info);
    });
    
    item.appendChild(header);
    
    // Add children if any
    if (info.children && Object.keys(info.children).length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-item-children';
        childrenContainer.style.display = 'none';
        
        for (const key in info.children) {
            const childInfo = info.children[key];
            if (childInfo) {
                const childItem = createTreeItem(key, childInfo, `${fullPath}.${key}`);
                childrenContainer.appendChild(childItem);
            }
        }
        
        // Toggle visibility
        header.addEventListener('click', (e) => {
            childrenContainer.style.display = 
                childrenContainer.style.display === 'none' ? 'block' : 'none';
            e.stopPropagation();
        });
        
        item.appendChild(childrenContainer);
    }
    
    return item;
}

// Display API details in the main content area
function displayAPIDetails(path, info) {
    const detailsContainer = document.getElementById('api-details');
    detailsContainer.innerHTML = '';
    
    const title = document.createElement('h2');
    title.textContent = path;
    detailsContainer.appendChild(title);
    
    // Add description
    const desc = document.createElement('p');
    desc.textContent = `API module with ${Object.keys(info.properties).length} properties and ${Object.keys(info.methods).length} methods.`;
    detailsContainer.appendChild(desc);
    
    // Properties section
    if (Object.keys(info.properties).length > 0) {
        const propsTitle = document.createElement('h3');
        propsTitle.textContent = 'Properties';
        detailsContainer.appendChild(propsTitle);
        
        for (const key in info.properties) {
            const prop = info.properties[key];
            const propElem = document.createElement('div');
            propElem.className = 'property-item';
            
            const propName = document.createElement('h4');
            propName.textContent = prop.name;
            
            const propType = document.createElement('p');
            propType.innerHTML = `<strong>Type:</strong> ${prop.type}`;
            
            const propValue = document.createElement('p');
            propValue.innerHTML = `<strong>Value:</strong> ${JSON.stringify(prop.value)}`;
            
            propElem.appendChild(propName);
            propElem.appendChild(propType);
            propElem.appendChild(propValue);
            
            detailsContainer.appendChild(propElem);
        }
    }
    
    // Methods section
    if (Object.keys(info.methods).length > 0) {
        const methodsTitle = document.createElement('h3');
        methodsTitle.textContent = 'Methods';
        detailsContainer.appendChild(methodsTitle);
        
        for (const key in info.methods) {
            const method = info.methods[key];
            const methodElem = document.createElement('div');
            methodElem.className = 'method-item';
            
            const methodName = document.createElement('h4');
            methodName.textContent = method.name;
            
            const methodDesc = document.createElement('p');
            methodDesc.textContent = method.description;
            
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy to Editor';
            copyButton.className = 'copy-btn';
            copyButton.addEventListener('click', () => {
                copyToEditor(`${path}.${method.name}`);
            });
            
            methodElem.appendChild(methodName);
            methodElem.appendChild(methodDesc);
            methodElem.appendChild(copyButton);
            
            detailsContainer.appendChild(methodElem);
        }
    }
}

// Search API
function searchAPI(term) {
    if (!term) {
        renderAPITree(babylonAPI);
        return;
    }
    
    // Perform search and update tree
    // (simplified implementation)
    const searchResults = {};
    
    // Display search results
    const treeContainer = document.getElementById('api-tree');
    treeContainer.innerHTML = '';
    
    const searchStatus = document.createElement('div');
    searchStatus.textContent = `Searching for "${term}"...`;
    treeContainer.appendChild(searchStatus);
    
    // In a real implementation, you would search through the API
    // and display matching items here
}

// Copy API path to editor
function copyToEditor(path) {
    if (editorInstance) {
        const currentContent = editorInstance.getValue();
        const position = editorInstance.getPosition();
        editorInstance.executeEdits('', [
            {
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                },
                text: path
            }
        ]);
        
        // Switch to editor tab
        document.querySelector('.tab-btn[data-tab="editor"]').click();
    }
}

// Monaco Editor
let editorInstance = null;
let editorInitialized = false;

function initializeMonacoEditor() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
    
    require(['vs/editor/editor.main'], function() {
        editorInstance = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: getDefaultCode(),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true
        });
        
        // Set up run button
        document.getElementById('run-code').addEventListener('click', runCode);
        // Set up reset button
        document.getElementById('reset-code').addEventListener('click', resetCode);
        
        editorInitialized = true;
    });
}

// Default code for the editor
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

// Run code from the editor
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
    
    // Reset any existing scene
    if (window.scene) {
        window.scene.dispose();
    }
    if (window.engine) {
        window.engine.stopRenderLoop();
    }
    
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
}

// Reset editor code to default
function resetCode() {
    if (editorInstance) {
        editorInstance.setValue(getDefaultCode());
    }
}

// Initialize when the page loads
window.addEventListener('load', function() {
    // Start with API Explorer tab
    initializeAPIExplorer();
});