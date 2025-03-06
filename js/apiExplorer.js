// API Explorer functionality

let babylonAPI = {};
let editorCallback = null;

/**
 * Initialize the API explorer
 */
export function initialize() {
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

/**
 * Set callback function for editor interaction
 */
export function setEditorCallback(callback) {
    editorCallback = callback;
}

/**
 * Get API data for autocomplete
 */
export function getAPIData() {
    return babylonAPI;
}

/**
 * Extract API information recursively
 */
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

/**
 * Render the API tree in the sidebar
 */
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

/**
 * Create a tree item with expandable children
 */
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

/**
 * Display API details in the main content area
 */
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

/**
 * Search API
 */
function searchAPI(term) {
    if (!term) {
        renderAPITree(babylonAPI);
        return;
    }
    
    // Perform search and update tree
    const searchResults = performSearch(babylonAPI, term);
    
    // Display search results
    const treeContainer = document.getElementById('api-tree');
    treeContainer.innerHTML = '';
    
    if (Object.keys(searchResults).length === 0) {
        const noResults = document.createElement('div');
        noResults.textContent = `No results found for "${term}"`;
        treeContainer.appendChild(noResults);
        return;
    }
    
    // Display search results in the tree
    const resultsRoot = document.createElement('div');
    resultsRoot.className = 'tree-item';
    
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'tree-item-header';
    resultsHeader.textContent = `Search Results for "${term}"`;
    
    resultsRoot.appendChild(resultsHeader);
    treeContainer.appendChild(resultsRoot);
    
    // Add result items
    // Implementation simplified for brevity
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'tree-item-children';
    resultsContainer.style.display = 'block';
    
    // Add some placeholder results
    const placeholder = document.createElement('div');
    placeholder.textContent = "Search functionality needs implementation";
    resultsContainer.appendChild(placeholder);
    
    resultsRoot.appendChild(resultsContainer);
}

/**
 * Perform search on API tree
 */
function performSearch(apiData, term) {
    // Simplified implementation
    return {};
}

/**
 * Copy API path to editor
 */
function copyToEditor(path) {
    if (editorCallback) {
        editorCallback(path);
        
        // Switch to editor tab
        document.querySelector('.tab-btn[data-tab="editor"]').click();
    }
}