// auth-service.js - Team Alpha: Core Platform & Auth Integration

// Mock API for authentication. In a real scenario, this would be an API call.
const authAPI = {
    authenticate: async (username, password) => {
        // Simulate a delay for network request
        await new Promise(resolve => setTimeout(resolve, 500));

        // Hardcoded roles for simulation based on the S.E.A.L. Mandate
        if (username === 'eusoshipper' && password === 'secure') {
            return { success: true, role: 'SHIPPER', name: 'Eusorone Shipper' };
        }
        if (username === 'eusoadmin' && password === 'secure') {
            return { success: true, role: 'ADMIN', name: 'System Administrator' };
        }
        if (username === 'catalyst' && password === 'secure') {
            return { success: true, role: 'CATALYST', name: 'Marcus Johnson' };
        }
        if (username === 'driver' && password === 'secure') {
            return { success: true, role: 'DRIVER', name: 'Jane Doe' };
        }
        return { success: false, message: 'Invalid credentials or role not found.' };
    }
};

// Global State Management (Simulated by the shell)
// This is assumed to be defined in the index.html or another shell script.
/*
const appState = {
    user: {
        isLoggedIn: false,
        role: 'GUEST',
        name: 'Guest'
    },
    setUser: function(role, name) {
        this.user.isLoggedIn = true;
        this.user.role = role;
        this.user.name = name;
    }
};
*/

/**
 * Implements the full authentication flow.
 * This function is called by the UI after a user attempts to log in.
 * @param {string} username - The username input.
 * @param {string} password - The password input.
 * @param {string} selectedRole - The role selected by the user (e.g., 'SHIPPER', 'ADMIN').
 */
function loginUser(username, password, selectedRole) {
    // 1. Authenticate against the mock API
    authAPI.authenticate(username, password)
        .then(response => {
            if (response.success && response.role === selectedRole) {
                // 2. Update the global state
                appState.setUser(response.role, response.name);
                
                // 3. Render the main application shell
                renderAppShell();

                // 4. Implement Sidebar Filtering (Mandate Task 2)
                // This is called automatically by renderAppShell -> renderSidebar
                // The renderSidebar function must be updated to conditionally render links.
                // Since renderSidebar is in index.html, we will update it there.

            } else {
                alert('Login Failed: ' + (response.message || 'Role mismatch or invalid credentials.'));
            }
        })
        .catch(error => {
            console.error('Authentication Error:', error);
            alert('An unexpected error occurred during login.');
        });
}

// Attach event listener to the login button in the shell UI (index.html)
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const selectedRole = document.querySelector('.role-button.active')?.dataset.role;

            if (!username || !password || !selectedRole) {
                alert('Please enter username, password, and select a role.');
                return;
            }

            loginUser(username, password, selectedRole);
        });
    }
});

// The following function is the core of Mandate Task 2: Sidebar Filtering
/**
 * Renders the sidebar content, conditionally showing links based on the user's role.
 * This is the updated version of the function from index.html (Mandate Task 2 implementation).
 * @param {string} role - The authenticated user's role.
 * @returns {string} - The HTML string for the sidebar.
 */
function renderSidebar(role = appState.user.role) {
    const menuItems = {
        'CORE': [
            { section: 'Dashboard', icon: 'icon-dashboard', roles: ['SHIPPER', 'ADMIN', 'CATALYST', 'DRIVER'] },
            { section: 'Shipment', icon: 'icon-shipment', roles: ['SHIPPER', 'ADMIN'] },
            { section: 'My Jobs', icon: 'icon-jobs', roles: ['DRIVER', 'CATALYST'] },
            { section: 'Messages', icon: 'icon-messages', roles: ['SHIPPER', 'ADMIN', 'CATALYST', 'DRIVER'] },
            { section: 'Channels', icon: 'icon-channels', roles: ['SHIPPER', 'ADMIN', 'CATALYST', 'DRIVER'] },
        ],
        'ACCOUNT': [
            { section: 'My Profile', icon: 'icon-profile', roles: ['SHIPPER', 'ADMIN', 'CATALYST', 'DRIVER'] },
            { section: 'Company Details', icon: 'icon-details', roles: ['SHIPPER', 'ADMIN'] },
            { section: 'Facility Address', icon: 'icon-facility', roles: ['SHIPPER', 'ADMIN'] },
        ],
        'OPERATIONS': [
            { section: 'Job Procedure', icon: 'icon-procedure', roles: ['DRIVER', 'CATALYST'] },
            { section: 'Truck Diagnostics', icon: 'icon-diagnostics', roles: ['DRIVER'] },
            { section: 'EusoWallet', icon: 'icon-wallet', roles: ['SHIPPER', 'DRIVER', 'CATALYST'] },
        ],
        'SYSTEM': [
            { section: 'Settings', icon: 'icon-settings', roles: ['SHIPPER', 'ADMIN', 'CATALYST', 'DRIVER'] },
            { section: 'News Feed', icon: 'icon-news', roles: ['SHIPPER', 'ADMIN', 'CATALYST', 'DRIVER'] },
            { section: 'Support', icon: 'icon-support', roles: ['SHIPPER', 'ADMIN', 'CATALYST', 'DRIVER'] },
        ]
    };

    let navHtml = '';
    for (const category in menuItems) {
        const links = menuItems[category].filter(item => item.roles.includes(role));
        
        if (links.length > 0) {
            navHtml += `<h6>${category}</h6><ul>`;
            links.forEach(item => {
                navHtml += `
                    <li>
                        <a href="#" data-section="${item.section}" onclick="event.preventDefault(); renderContent('${item.section}');">
                            <i class="${item.icon}"></i> ${item.section}
                        </a>
                    </li>
                `;
            });
            navHtml += `</ul>`;
        }
    }

    const sidebarHtml = `
        <div class="sidebar">
            <div class="logo">
                <img src="./assets/images/eusotrip-logo-small.png" alt="EusoTrip" style="width: 30px; margin-right: 10px;" onerror="this.onerror=null;this.src='https://placehold.co/30x30/0077FF/CC00FF/png?text=ET';">
                <h1>EusoTrip</h1>
            </div>
            <nav>
                ${navHtml}
                <h6 style="margin-top: 30px;"><a href="#" onclick="event.preventDefault(); renderLoginScreen();" style="color: var(--status-danger); padding: 0 20px;"><i class="icon-logout" style="color: var(--status-danger);"></i> Logout</a></h6>
            </nav>
        </div>
    `;
    return sidebarHtml;
}

// The renderSidebar function in index.html must be replaced with this one.
