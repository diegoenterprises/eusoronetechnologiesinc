/* EusoTrip Shell Logic - S.E.A.L. TEAM 6 */

const root = document.getElementById('root');
const esangAiButton = document.getElementById('esang-ai-button');

// --- Component Templates ---

// 1. Login Screen Template
const loginScreenTemplate = \`
    <div class="login-container fade-in">
        <div class="login-card">
            <div class="login-header">
                <h1>EusoTrip</h1>
                <h2>Seamless Experience & Aesthetic Logic</h2>
            </div>
            <form id="login-form" class="login-form">
                <input type="email" class="input-field" placeholder="Email Address" required>
                <input type="password" class="input-field" placeholder="Password" required>
                <button type="submit" class="button-primary">Log In Securely</button>
            </form>
            <div class="demo-logins">
                <p style="color: var(--text-secondary); margin-top: 20px;">Or try a demo account:</p>
                <button class="button-primary" style="background: var(--surface-primary); color: var(--text-primary); width: auto;" data-role="shipper">Shipper Demo</button>
                <button class="button-primary" style="background: var(--surface-primary); color: var(--text-primary); width: auto;" data-role="driver">Driver Demo</button>
            </div>
        </div>
    </div>
\`;

// 2. Main Application Shell Template
const appShellTemplate = \`
    <div class="app-layout">
        <div class="sidebar">
            <div class="logo-section">
                <h1 style="color: var(--brand-primary-blue);">EusoTrip</h1>
            </div>
            <nav>
                <h6>MAIN MENU</h6>
                <ul>
                    <li><a href="#" class="active"><span style="margin-right: 10px;">🏠</span> Dashboard</a></li>
                    <li><a href="#"><span style="margin-right: 10px;">📦</span> Shipments & Loads</a></li>
                    <li><a href="#"><span style="margin-right: 10px;">🤝</span> Bidding & Negotiation</a></li>
                    <li><a href="#"><span style="margin-right: 10px;">💬</span> Messaging</a></li>
                </ul>
                <h6>SYSTEMS & COMPLIANCE</h6>
                <ul>
                    <li><a href="#"><span style="margin-right: 10px;">💳</span> EusoWallet (Fintech)</a></li>
                    <li><a href="#"><span style="margin-right: 10px;">🚨</span> Hazmat Database</a></li>
                    <li><a href="#"><span style="margin-right: 10px;">⏱️</span> ELD/HOS Logs</a></li>
                    <li><a href="#"><span style="margin-right: 10px;">⚙️</span> Settings</a></li>
                </ul>
            </nav>
        </div>
        <div class="main-content">
            <header class="app-header">
                <div class="search-bar">
                    <input type="text" class="input-field" placeholder="Search shipments, users, or help...">
                </div>
                <div class="user-profile">
                    <span style="color: var(--text-primary);">Welcome, <strong id="user-display-name">User</strong></span>
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: var(--gradient-primary);"></div>
                </div>
            </header>
            <div id="page-content" class="dashboard-container fade-in">
                <!-- Dashboard Content Placeholder -->
                <h1 style="color: var(--text-primary); margin-bottom: 20px;">Dashboard Overview</h1>
                <div class="card" style="min-height: 300px; padding: 30px;">
                    <p style="color: var(--text-secondary);">This is the main content area. All future components will be rendered here.</p>
                    <button id="logout-button" class="button-primary" style="background: var(--border-primary); margin-top: 20px;">Log Out</button>
                </div>
            </div>
        </div>
    </div>
\`;

// --- Core Logic ---

let isLoggedIn = false;

function renderLoginScreen() {
    root.innerHTML = loginScreenTemplate;
    esangAiButton.style.display = 'none'; // Hide ESANG button on login
    
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);

    // Add listeners for demo buttons
    document.querySelectorAll('.demo-logins button').forEach(button => {
        button.addEventListener('click', (e) => {
            const role = e.target.getAttribute('data-role');
            handleLogin(e, role);
        });
    });
}

function renderAppShell(role = 'Shipper') {
    root.innerHTML = appShellTemplate;
    esangAiButton.style.display = 'block'; // Show ESANG button on app shell
    
    const userDisplayName = document.getElementById('user-display-name');
    userDisplayName.textContent = role;

    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', handleLogout);
}

function handleLogin(e, role = 'Shipper') {
    e.preventDefault();
    isLoggedIn = true;
    renderAppShell(role);
}

function handleLogout() {
    isLoggedIn = false;
    renderLoginScreen();
}

// --- Initialization ---

// ESANG AI Button Animation/UX Logic
esangAiButton.addEventListener('click', () => {
    alert('ESANG AI is active! Ready to assist with bidding, compliance, and logistics.');
});

// Initial Render
if (isLoggedIn) {
    renderAppShell();
} else {
    renderLoginScreen();
}
