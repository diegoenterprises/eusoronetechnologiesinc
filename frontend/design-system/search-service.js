// search-service.js - Team Alpha: Search Integration

/**
 * Mock API for performing a platform-wide search.
 * In a real scenario, this would be an API call to the backend.
 * @param {string} query - The search term.
 * @returns {Promise<object>} - A promise resolving to mock search results.
 */
const searchAPI = {
    search: async (query) => {
        // Simulate a delay for network request
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const lowerQuery = query.toLowerCase();

        // Mock data structure: { shipments: [], contacts: [] }
        const mockResults = {
            shipments: [],
            contacts: []
        };

        // Simulate search logic
        if (lowerQuery.includes('methanol') || lowerQuery.includes('sh-001')) {
            mockResults.shipments.push({ id: 'SH-001', name: 'Methanol Load', status: 'In Transit', icon: '📦' });
        }
        if (lowerQuery.includes('pharma') || lowerQuery.includes('sh-002')) {
            mockResults.shipments.push({ id: 'SH-002', name: 'Pharmaceutical Delivery', status: 'Loading', icon: '📦' });
        }
        if (lowerQuery.includes('marcus') || lowerQuery.includes('johnson')) {
            mockResults.contacts.push({ id: 'C-001', name: 'Marcus Johnson', role: 'Driver', icon: '👤' });
        }
        if (lowerQuery.includes('jane') || lowerQuery.includes('doe')) {
            mockResults.contacts.push({ id: 'C-002', name: 'Jane Doe', role: 'Driver', icon: '👤' });
        }
        if (lowerQuery.includes('eusorone')) {
             mockResults.contacts.push({ id: 'C-003', name: 'Eusorone Shipper', role: 'Shipper', icon: '🏢' });
        }

        return mockResults;
    }
};

/**
 * Renders the search results into the search overlay HTML structure.
 * @param {object} results - The search results object from the API.
 * @returns {string} - The HTML content to inject into the search overlay.
 */
function renderSearchResults(results) {
    let html = '';

    // Render Shipments
    if (results.shipments && results.shipments.length > 0) {
        html += `<h4>Shipments (${results.shipments.length})</h4>`;
        results.shipments.forEach(item => {
            html += `
                <div class="search-item" onclick="alert('Navigating to Shipment ${item.id}')">
                    <span class="icon">${item.icon}</span><p>${item.id} - ${item.name}</p><span>${item.status}</span>
                </div>
            `;
        });
    }

    // Render Contacts
    if (results.contacts && results.contacts.length > 0) {
        html += `<h4>Contacts (${results.contacts.length})</h4>`;
        results.contacts.forEach(item => {
            html += `
                <div class="search-item" onclick="alert('Navigating to Contact ${item.id}')">
                    <span class="icon">${item.icon}</span><p>${item.name}</p><span>${item.role}</span>
                </div>
            `;
        });
    }

    // If no results, show a message
    if (results.shipments.length === 0 && results.contacts.length === 0) {
        html += `<p style="text-align: center; color: var(--text-secondary);">No results found. Try a different query.</p>`;
    }

    // Add the ESANG AI prompt at the bottom
    html += `
        <div class="esang-ai-search-prompt">
            <button onclick="openEsangChat()">Ask ESANG AI for Complex Search</button>
        </div>
    `;

    return html;
}

// Global variable to store the search timeout to prevent rapid API calls
let searchTimeout = null;

/**
 * Connects the search bar to the backend search API and updates the overlay.
 * This function is called on every input change in the search bar.
 */
function handleSearchInput() {
    const searchInput = document.getElementById('search-input');
    const searchOverlay = document.getElementById('search-overlay');
    
    if (!searchInput || !searchOverlay) return;

    const query = searchInput.value.trim();

    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (query.length < 3) {
        // Hide overlay or show a prompt if query is too short
        searchOverlay.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 10px;">Enter at least 3 characters to search.</p>';
        searchOverlay.classList.remove('active');
        return;
    }

    // Show a loading state immediately
    searchOverlay.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 10px;">Searching...</p>';
    searchOverlay.classList.add('active');

    // Set a new timeout (debounce)
    searchTimeout = setTimeout(async () => {
        try {
            const results = await searchAPI.search(query);
            const resultsHtml = renderSearchResults(results);
            searchOverlay.innerHTML = resultsHtml;
        } catch (error) {
            console.error('Search failed:', error);
            searchOverlay.innerHTML = '<p style="text-align: center; color: var(--status-danger); padding: 10px;">Search service temporarily unavailable.</p>';
        }
    }, 500); // 500ms debounce
}

// Attach event listener to the search input in the shell UI (index.html)
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // The onfocus and onblur handlers in index.html already manage visibility.
        // We only need to attach the input handler.
        searchInput.addEventListener('input', handleSearchInput);
    }
});
