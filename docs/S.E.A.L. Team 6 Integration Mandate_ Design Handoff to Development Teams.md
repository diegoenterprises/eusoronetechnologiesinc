# S.E.A.L. Team 6 Integration Mandate: Design Handoff to Development Teams

This document serves as the official integration guide for all EusoTrip development teams (Alpha, Beta, Gamma, Delta). It defines the precise method for connecting backend logic and dynamic data to the **Master Design Code Shell** created by S.E.A.L. Team 6.

The **Master Design Code Shell** is the uncompromised visual contract. **NO VISUAL DEVIATION IS PERMITTED.**

---

## Master Design Code Reference

All teams must reference the following file in the GitHub repository:

*   **File:** `frontend/design-system/index.html`
*   **Status:** Contains all final, pixel-perfect HTML, CSS, and interactive JavaScript shell logic (for navigation and modals).

---

## 1. Team Alpha: Core Platform & Auth Integration

**Focus:** User Authentication, Core Navigation, and Search Functionality.

| Task | Integration Detail | Master Code Reference |
| :--- | :--- | :--- |
| **Login/Role Switching** | Implement the full authentication flow. The successful login must call the core shell function with the actual user role, which triggers the application's rendering. | **JS Function:** `loginUser(role)` |
| **Sidebar Filtering** | Implement the logic to conditionally hide/show sidebar menu items based on the authenticated user's role (`appState.user.role`). This ensures the **Seamless Experience** by showing only relevant links. | **JS Function:** `renderSidebar()` |
| **Search Integration** | Connect the search bar to the backend search API. The API results must be formatted and injected into the HTML structure of the hidden search overlay (`#search-overlay`). The logic should manage the visibility of the overlay. | **HTML/CSS:** `#search-overlay` **JS Function:** `toggleSearchOverlay(show)` |
| **Key Files** | `index.html` (for UI structure), `auth-service.js`, `auth-slice.js` (for logic). |

---

## 2. Team Beta: Fintech & Commerce Integration

**Focus:** Bidding, Negotiation, and EusoWallet UI.

| Task | Integration Detail | Master Code Reference |
| :--- | :--- | :--- |
| **Dashboard Stats** | Replace the static placeholder stats in the Dashboard with real-time data from the Fintech/Commission system (e.g., Revenue, Compliance Score). | **HTML Section:** `<div class="stats-grid-large">` in `renderDashboardContent()` |
| **EusoWallet Link** | Integrate the EusoWallet link in the sidebar to the actual wallet view, replacing the placeholder content. | **JS Function:** `renderContent('EusoWallet')` |
| **Shipment Card Data** | Replace static shipment data (e.g., Rate, Miles, Status) in the `shipment-card` component with data from the Bidding/Negotiation system. | **HTML Section:** `<div class="card shipment-card">` in `renderDashboardContent()` |
| **Key Files** | `index.html` (for UI structure), `wallet-service.js`, `eusoshipper-bidding-screen.js` (for logic). |

---

## 3. Team Gamma: Logistics & Tracking Integration

**Focus:** Real-time Load Data, Shipment Status, and Map Integration.

| Task | Integration Detail | Master Code Reference |
| :--- | :--- | :--- |
| **Shipment View Shell** | Replace the placeholder content in the "Shipment" view with the actual Load Creation Workflow UI. | **JS Function:** `renderContent('Shipment')` |
| **My Jobs View Shell** | Replace the placeholder content in the "My Jobs" view with the fully functional Job Board, using the `shipment-card` component structure for each job listing. | **JS Function:** `renderContent('My Jobs')` |
| **Shipment Status** | Connect the `status-badge` and `progress-bar` components within the shipment cards to the real-time status updates from the Geolocation & Tracking system. | **CSS Classes:** `.status-badge`, `.progress-bar` |
| **Key Files** | `index.html` (for UI structure), `eusoshipper-live-tracking.js`, `job-board-screen.js` (for logic). |

---

## 4. Team Delta: AI & Specialized Systems Integration

**Focus:** ESANG AI Chat Logic, Hazmat Data, and Driver Management UI.

| Task | Integration Detail | Master Code Reference |
| :--- | :--- | :--- |
| **ESANG AI Chat Backend** | Connect the chat input/output of the ESANG AI modal to the backend AI negotiation service (via WebSockets or API). The modal's visual structure is final. | **HTML/CSS:** `#esang-chat-modal` **JS Function:** `openEsangChat()` |
| **Hazmat Data UI** | Replace the generic placeholder content in the "Job Procedure" view with the Hazmat Database search and display interface. | **JS Function:** `renderContent('Job Procedure')` |
| **Driver Management UI** | Replace the generic placeholder content in the "Truck Diagnostics" view with the ELD/HOS logging interface. | **JS Function:** `renderContent('Truck Diagnostics')` |
| **Key Files** | `index.html` (for UI structure), `esang-ai-negotiation-service.js`, `duty-log-item.js`, `eusoshipper-hazmat-database-screen-complete.js` (for logic). |

---

## General Integration Mandate

*   **CSS Extraction:** All teams are responsible for extracting the necessary CSS from the `<style>` block in `index.html` to style their components. This CSS is the only approved styling.
*   **Component Reuse:** Teams must reuse the existing visual components (e.g., `.card`, `.button-primary`, `.status-badge`) defined in the master shell to maintain visual coherence.
