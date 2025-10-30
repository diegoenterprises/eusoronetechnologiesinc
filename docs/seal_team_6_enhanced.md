# S.E.A.L. Team 6 Integration Mandate: Enhanced Design-to-Development Bridge
## CLASSIFIED - INTERNAL DISTRIBUTION ONLY
**VERSION:** 2.0 Enhanced  
**CLASSIFICATION:** CONFIDENTIAL - DESIGN AUTHORITY  
**DATE:** October 29, 2025  
**AUTHORITY:** Mike "Diego" Usoro, CEO & Founder

---

## 🎯 EXECUTIVE SUMMARY

This document serves as the **SINGLE SOURCE OF TRUTH** for integrating backend logic with the **Master Design Code Shell** created by S.E.A.L. Team 6. This elite design unit operates independently to ensure visual excellence and user experience consistency across the entire EusoTrip platform.

### Core Principles

1. **Design Sovereignty:** The Master Design Shell is immutable. Backend teams integrate INTO the design, not vice versa.
2. **Zero Visual Deviation:** No CSS modifications, no layout changes, no "improvements" without S.E.A.L. Team 6 approval.
3. **Component Contract:** All visual components are pre-approved and production-ready. Use them as-is.
4. **Performance First:** Integration must not degrade the sub-50ms P99 latency mandate.

---

## 📋 TABLE OF CONTENTS

1. [Master Design Code Reference](#master-design-code-reference)
2. [Integration Architecture](#integration-architecture)
3. [Team Alpha: Authentication & Core Platform](#team-alpha)
4. [Team Beta: Frontend & User Experience](#team-beta)
5. [Team Gamma: AI & Specialized Systems](#team-gamma)
6. [Team Delta: Mobile Design Parity](#team-delta)
7. [Quality Gates & Enforcement](#quality-gates)
8. [Component Library Reference](#component-library)
9. [WebSocket Integration Patterns](#websocket-patterns)
10. [Performance Optimization Rules](#performance-rules)

---

## 🎨 MASTER DESIGN CODE REFERENCE

### Repository Structure

```
frontend/
├── design-system/
│   ├── index.html                    # Master Shell - IMMUTABLE
│   ├── components/
│   │   ├── cards.css                # Pre-approved card styles
│   │   ├── buttons.css              # Button system
│   │   ├── forms.css                # Form inputs and validation
│   │   ├── modals.css               # Modal overlays
│   │   └── navigation.css           # Sidebar and header
│   ├── themes/
│   │   ├── colors.css               # Color palette (WCAG AA compliant)
│   │   └── typography.css           # Font system
│   └── shell-logic.js               # Core navigation and state management
├── src/
│   ├── services/                    # Backend integration layer (YOUR CODE)
│   ├── hooks/                       # React hooks for data fetching (YOUR CODE)
│   └── utils/                       # Helper functions (YOUR CODE)
```

### Master Shell Status

- **File:** `frontend/design-system/index.html`
- **Version:** 3.0 Final
- **Status:** ✅ PRODUCTION-READY - LOCKED
- **Last Updated:** October 28, 2025
- **Approval:** S.E.A.L. Team 6 Design Authority

---

## 🏗️ INTEGRATION ARCHITECTURE

### The Three-Layer Model

```
┌─────────────────────────────────────────┐
│   LAYER 1: MASTER DESIGN SHELL          │
│   (S.E.A.L. Team 6 - IMMUTABLE)         │
│   • HTML Structure                      │
│   • CSS Styling                         │
│   • Shell JavaScript (Navigation)       │
└─────────────────────────────────────────┘
              ↓ Integration Points
┌─────────────────────────────────────────┐
│   LAYER 2: DATA BINDING LAYER           │
│   (Development Teams - YOUR CODE)       │
│   • API Clients                         │
│   • State Management                    │
│   • WebSocket Handlers                  │
└─────────────────────────────────────────┘
              ↓ Data Flow
┌─────────────────────────────────────────┐
│   LAYER 3: BACKEND SERVICES             │
│   (Teams Alpha, Beta, Gamma)            │
│   • FastAPI Endpoints                   │
│   • WebSocket Servers                   │
│   • Database Queries                    │
└─────────────────────────────────────────┘
```

### Critical Integration Points

All integration must occur through **designated injection points** in the Master Shell. These are clearly marked with data attributes:

```html
<!-- Example: Dashboard Stats Injection Point -->
<div class="stats-grid-large" data-injection="dashboard-stats">
  <!-- Backend teams inject data HERE -->
</div>

<!-- Example: Shipment Cards Injection Point -->
<div class="shipments-container" data-injection="active-shipments">
  <!-- Backend teams inject data HERE -->
</div>
```

---

## 🔐 TEAM ALPHA: AUTHENTICATION & CORE PLATFORM

### Mission Critical Integrations

| Task | Integration Detail | Shell Reference | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **User Authentication Flow** | Implement OAuth2 + JWT flow. Upon successful login, call `window.shellAPI.setUser(userData)` to initialize the application state. | `loginUser(role)` in `shell-logic.js` | • 2FA support<br>• Session persistence<br>• Auto-logout (30min) |
| **Role-Based Access Control (RBAC)** | Implement middleware that reads `appState.user.role` and conditionally renders sidebar items. Must support 9 roles (see Ultimate Dev Directive). | `renderSidebar()` in `shell-logic.js` | • All 9 roles tested<br>• No unauthorized access<br>• Audit logging |
| **Global Search** | Connect search bar to unified search API (loads, drivers, companies, documents). Results must be formatted using the `search-result-card` component. | `#search-overlay`<br>`toggleSearchOverlay(show)` | • <200ms response<br>• Fuzzy matching<br>• Recent searches |
| **Real-Time Notifications** | Integrate WebSocket listener for platform-wide notifications. Use the `notification-toast` component for display. | `window.shellAPI.showNotification(data)` | • <1s delivery<br>• Priority queuing<br>• Dismissible |

### File Structure Requirements

```typescript
// frontend/src/services/auth-service.ts
export class AuthService {
  async login(email: string, password: string): Promise<User> {
    // YOUR IMPLEMENTATION
    const user = await this.apiClient.post('/auth/login', { email, password });
    
    // CRITICAL: Initialize shell with user data
    window.shellAPI.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      companyId: user.company_id
    });
    
    return user;
  }
  
  async refreshToken(): Promise<string> {
    // YOUR IMPLEMENTATION
  }
  
  async logout(): Promise<void> {
    // YOUR IMPLEMENTATION
    window.shellAPI.clearUser();
  }
}
```

### RBAC Integration Example

```typescript
// frontend/src/hooks/useRoleAccess.ts
export const useRoleAccess = () => {
  const { user } = useAuth();
  
  const hasAccess = (requiredRole: UserRole): boolean => {
    // YOUR IMPLEMENTATION
    const roleHierarchy = {
      'SUPER_ADMIN': 9,
      'ADMIN': 8,
      'TERMINAL_MANAGER': 7,
      // ... rest of hierarchy
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };
  
  return { hasAccess };
};
```

---

## 🎨 TEAM BETA: FRONTEND & USER EXPERIENCE

### Mission Critical Integrations

| Task | Integration Detail | Shell Reference | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **Dashboard Real-Time Stats** | Replace placeholder stats with live data from backend. Must update every 30s via WebSocket. Use the exact HTML structure from `renderDashboardContent()`. | `.stats-grid-large` | • Real-time updates<br>• Error handling<br>• Loading states |
| **EusoWallet Integration** | Connect wallet view to `/wallet/balance` endpoint. Display current balance, pending escrow, and payout schedule using wallet components. | `renderContent('EusoWallet')` | • Balance accuracy<br>• Transaction history<br>• Quick Pay flow |
| **Shipment Cards (Active Loads)** | Fetch active loads and populate using the `.shipment-card` component structure. Must include real-time status updates. | `.shipment-card` | • Live status<br>• ETA calculations<br>• Click-through details |
| **Load Creation Wizard** | Multi-step form for creating loads. Must preserve Master Shell styling while adding validation logic. | `renderContent('Shipment')` | • 5-step validation<br>• Auto-save drafts<br>• Address autocomplete |
| **Negotiation Interface** | Real-time bidding/counter-offer UI using the chat-style layout from ESANG modal. Adapt for load negotiations. | `#esang-chat-modal` (adapt) | • <500ms updates<br>• Offer history<br>• Accept/reject flow |

### Dashboard Stats Integration Example

```typescript
// frontend/src/components/Dashboard/DashboardStats.tsx
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export const DashboardStats: React.FC = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { lastMessage } = useWebSocket('/ws/dashboard');
  
  // Update stats when WebSocket message received
  useEffect(() => {
    if (lastMessage?.type === 'STATS_UPDATE') {
      // YOUR UPDATE LOGIC
    }
  }, [lastMessage]);
  
  if (isLoading) {
    return <StatsGridSkeleton />; // Use shell's skeleton component
  }
  
  return (
    <div className="stats-grid-large" data-injection="dashboard-stats">
      <div className="stat-card">
        <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
        <div className="stat-label">Total Revenue</div>
        <div className="stat-trend positive">↑ {stats.revenueGrowth}%</div>
      </div>
      {/* MORE STATS USING EXACT SHELL STRUCTURE */}
    </div>
  );
};
```

### Shipment Card Data Binding

```typescript
// frontend/src/components/Shipments/ShipmentCard.tsx
interface ShipmentCardProps {
  load: Load;
  onStatusUpdate?: (loadId: string, newStatus: LoadStatus) => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ load, onStatusUpdate }) => {
  // Subscribe to real-time updates for this load
  const { lastMessage } = useWebSocket(`/ws/loads/${load.id}`);
  
  useEffect(() => {
    if (lastMessage?.type === 'STATUS_CHANGE') {
      onStatusUpdate?.(load.id, lastMessage.data.new_status);
    }
  }, [lastMessage]);
  
  return (
    <div className="card shipment-card" data-load-id={load.id}>
      <div className="card-header">
        <span className="load-number">#{load.load_number}</span>
        <span className={`status-badge status-${load.status.toLowerCase()}`}>
          {load.status}
        </span>
      </div>
      <div className="card-body">
        <div className="route">
          <span className="origin">{load.origin_city}, {load.origin_state}</span>
          <span className="arrow">→</span>
          <span className="destination">{load.destination_city}, {load.destination_state}</span>
        </div>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Rate</span>
            <span className="stat-value">${load.agreed_rate.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Miles</span>
            <span className="stat-value">{load.distance_miles}</span>
          </div>
          <div className="stat">
            <span className="stat-label">ETA</span>
            <span className="stat-value">{calculateETA(load)}</span>
          </div>
        </div>
        {load.status === 'IN_TRANSIT' && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${load.progress_percentage}%` }}></div>
          </div>
        )}
      </div>
      <div className="card-actions">
        <button className="button-secondary" onClick={() => viewDetails(load.id)}>
          View Details
        </button>
        {load.status === 'DELIVERED' && (
          <button className="button-primary" onClick={() => confirmDelivery(load.id)}>
            Confirm & Complete
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 🤖 TEAM GAMMA: AI & SPECIALIZED SYSTEMS

### Mission Critical Integrations

| Task | Integration Detail | Shell Reference | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **ESANG AI Chat Interface** | Connect chat UI to ESANG backend via WebSocket. Maintain the exact modal structure and animation. Support text + prescriptive action buttons. | `#esang-chat-modal`<br>`openEsangChat()` | • <2s response time<br>• Action execution<br>• Conversation history |
| **Prescriptive Action Buttons** | When ESANG suggests an action, dynamically inject action buttons using the `.button-critical` or `.button-warning` classes based on severity. | `<div class="esang-action-buttons">` | • Role-based access<br>• Confirmation dialogs<br>• Execution logging |
| **Hazmat Database UI** | Replace placeholder in "Job Procedure" view with searchable Hazmat/ERG database. Use the `.search-input` and `.data-table` components. | `renderContent('Job Procedure')` | • UN number search<br>• ERG guide display<br>• Emergency procedures |
| **Spectra-Match Results** | Display oil identification results using the `.analysis-card` component. Show confidence score with color-coded indicator. | Custom component (follows shell patterns) | • 95%+ confidence required<br>• Visual confidence meter<br>• BOL comparison |
| **Gamification Score Display** | Driver scores displayed using the `.score-badge` component. Update real-time as events occur. | `.score-badge` | • Real-time updates<br>• Achievement popups<br>• Leaderboard view |
| **ELD/HOS Logging UI** | In "Truck Diagnostics" view, display HOS status using the `.status-timeline` component. Must show violations prominently. | `renderContent('Truck Diagnostics')` | • Real-time HOS tracking<br>• Violation alerts<br>• Compliance score |

### ESANG AI Integration Example

```typescript
// frontend/src/components/AI/ESANGChatModal.tsx
import { useWebSocket } from '@/hooks/useWebSocket';
import { useState, useEffect, useRef } from 'react';

interface ESANGMessage {
  id: string;
  sender: 'user' | 'esang';
  content: string;
  timestamp: Date;
  suggested_action?: PrescriptiveAction;
}

export const ESANGChatModal: React.FC = () => {
  const [messages, setMessages] = useState<ESANGMessage[]>([]);
  const [input, setInput] = useState('');
  const { sendMessage, lastMessage } = useWebSocket('/ws/esang-ai');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle incoming ESANG responses
  useEffect(() => {
    if (lastMessage) {
      const esangMessage: ESANGMessage = {
        id: crypto.randomUUID(),
        sender: 'esang',
        content: lastMessage.rationale,
        timestamp: new Date(),
        suggested_action: lastMessage.suggested_action
      };
      setMessages(prev => [...prev, esangMessage]);
    }
  }, [lastMessage]);
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: ESANGMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to backend via WebSocket
    sendMessage({
      type: 'USER_MESSAGE',
      content: input,
      context: {
        user_id: window.shellAPI.getCurrentUser().id,
        current_view: window.shellAPI.getCurrentView()
      }
    });
    
    setInput('');
  };
  
  const handleActionClick = async (action: PrescriptiveAction) => {
    // Execute the AI's suggested action
    try {
      const result = await apiClient.post(action.endpoint, action.payload);
      
      // Show success notification using shell API
      window.shellAPI.showNotification({
        type: 'success',
        message: `Action executed: ${action.label}`,
        duration: 5000
      });
      
      // Refresh relevant data
      window.dispatchEvent(new CustomEvent('data-refresh', {
        detail: { entity: 'loads' }
      }));
      
    } catch (error) {
      window.shellAPI.showNotification({
        type: 'error',
        message: `Action failed: ${error.message}`,
        duration: 5000
      });
    }
  };
  
  return (
    <div id="esang-chat-modal" className="modal" style={{ display: 'block' }}>
      <div className="modal-content esang-modal">
        <div className="modal-header">
          <h2>ESANG AI Assistant</h2>
          <button className="close-modal" onClick={() => window.shellAPI.closeModal()}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
                
                {/* Render prescriptive action buttons */}
                {msg.suggested_action && (
                  <div className="esang-action-buttons">
                    <button
                      className={`button-${msg.suggested_action.severity.toLowerCase()}`}
                      onClick={() => handleActionClick(msg.suggested_action)}
                    >
                      {msg.suggested_action.label}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask ESANG AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="button-primary" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Hazmat Database Integration

```typescript
// frontend/src/components/Compliance/HazmatDatabase.tsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export const HazmatDatabase: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<HazmatMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<HazmatMaterial | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchHazmat(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  const searchHazmat = async (query: string) => {
    try {
      const results = await apiClient.get<HazmatMaterial[]>(
        `/compliance/hazmat/search?q=${encodeURIComponent(query)}`
      );
      setResults(results);
    } catch (error) {
      console.error('Hazmat search failed:', error);
    }
  };
  
  const viewERGDetails = async (unNumber: string) => {
    const material = await apiClient.get<HazmatMaterial>(
      `/compliance/hazmat/${unNumber}`
    );
    setSelectedMaterial(material);
  };
  
  return (
    <div className="content-view" data-view="Job Procedure">
      <div className="view-header">
        <h1>Hazmat & ERG Database</h1>
        <p className="subtitle">DOT Emergency Response Guidebook 2024</p>
      </div>
      
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search by UN Number, Material Name, or Class..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="results-section">
        {results.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>UN Number</th>
                <th>Proper Shipping Name</th>
                <th>Class</th>
                <th>Guide #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map(material => (
                <tr key={material.un_number}>
                  <td><strong>{material.un_number}</strong></td>
                  <td>{material.proper_shipping_name}</td>
                  <td>
                    <span className={`status-badge hazmat-class-${material.hazard_class}`}>
                      {material.hazard_class}
                    </span>
                  </td>
                  <td>{material.guide_number}</td>
                  <td>
                    <button
                      className="button-secondary button-sm"
                      onClick={() => viewERGDetails(material.un_number)}
                    >
                      View ERG
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* ERG Details Modal */}
      {selectedMaterial && (
        <ERGDetailsModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
};
```

---

## 📱 TEAM DELTA: MOBILE DESIGN PARITY

### Mission Critical Integrations

| Task | Integration Detail | Shell Reference | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **Native Component Mapping** | Map all web shell components to equivalent native iOS/Android components. Maintain exact visual parity. | See Component Library below | • Pixel-perfect match<br>• Platform conventions<br>• Gesture support |
| **Zeun Mechanics UI** | Edge computing diagnostic UI must match web shell's alert/notification system. Use native alert components styled identically. | `.notification-toast`<br>`.alert-banner` | • Real-time alerts<br>• Dismissible<br>• Priority levels |
| **EusoWallet Mobile** | Mobile wallet view must be identical to web version. Support Quick Pay with native payment sheets. | Web: `renderContent('EusoWallet')` | • Face ID / Touch ID<br>• Apple Pay integration<br>• Transaction history |
| **Offline-First Architecture** | Load creation and status updates must work offline, syncing when connection restored. Use shell's loading states. | `.loading-skeleton`<br>`.sync-indicator` | • Offline queue<br>• Conflict resolution<br>• Sync indicators |

### iOS Design System Mapping

```swift
// EusoTrip-iOS/DesignSystem/ShellComponents.swift
// Team Delta must use these EXACT component implementations

import SwiftUI

// BUTTON SYSTEM - Matches web shell exactly
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(Color(hex: "#2563EB")) // Primary blue from shell
                .cornerRadius(8)
        }
    }
}

// STATUS BADGE - Matches web shell exactly
struct StatusBadge: View {
    let status: LoadStatus
    
    var body: some View {
        Text(status.rawValue)
            .font(.system(size: 12, weight: .medium))
            .foregroundColor(statusColor(status))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(statusBackground(status))
            .cornerRadius(12)
    }
    
    private func statusColor(_ status: LoadStatus) -> Color {
        // EXACT color mapping from web shell
        switch status {
        case .POSTED: return Color(hex: "#3B82F6")
        case .IN_TRANSIT: return Color(hex: "#8B5CF6")
        case .DELIVERED: return Color(hex: "#10B981")
        case .CANCELLED: return Color(hex: "#EF4444")
        default: return Color(hex: "#6B7280")
        }
    }
    
    private func statusBackground(_ status: LoadStatus) -> Color {
        // EXACT background mapping from web shell
        switch status {
        case .POSTED: return Color(hex: "#DBEAFE")
        case .IN_TRANSIT: return Color(hex: "#EDE9FE")
        case .DELIVERED: return Color(hex: "#D1FAE5")
        case .CANCELLED: return Color(hex: "#FEE2E2")
        default: return Color(hex: "#F3F4F6")
        }
    }
}

// SHIPMENT CARD - Matches web shell exactly
struct ShipmentCard: View {
    let load: Load
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Text("#\(load.loadNumber)")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    StatusBadge(status: load.status)
                }
                
                // Route
                HStack(spacing: 8) {
                    Text("\(load.originCity), \(load.originState)")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                    
                    Image(systemName: "arrow.right")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                    
                    Text("\(load.destinationCity), \(load.destinationState)")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                
                // Stats
                HStack(spacing: 16) {
                    StatItem(label: "Rate", value: "$\(load.agreedRate.formatted())")
                    StatItem(label: "Miles", value: "\(load.distanceMiles)")
                    if load.status == .IN_TRANSIT {
                        StatItem(label: "ETA", value: load.eta)
                    }
                }
                
                // Progress bar for in-transit loads
                if load.status == .IN_TRANSIT {
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color(hex: "#E5E7EB"))
                                .frame(height: 4)
                                .cornerRadius(2)
                            
                            Rectangle()
                                .fill(Color(hex: "#8B5CF6"))
                                .frame(width: geometry.size.width * (load.progressPercentage / 100), height: 4)
                                .cornerRadius(2)
                        }
                    }
                    .frame(height: 4)
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
```

---

## ✅ QUALITY GATES & ENFORCEMENT

### Pre-Integration Checklist

Before any code can be merged that touches the Master Shell, it must pass these gates:

| Gate | Requirement | Validation Method | Enforcer |
| :--- | :--- | :--- | :--- |
| **Visual Parity** | Design must be pixel-perfect match to shell. | Screenshot diff testing | S.E.A.L. Team 6 |
| **CSS Audit** | No custom CSS outside of approved component library. | CSS linting + manual review | S.E.A.L. Team 6 |
| **Performance** | No degradation in shell load time or interaction latency. | Lighthouse CI (score ≥95) | Team Alpha |
| **Accessibility** | WCAG 2.1 AA compliance maintained. | aXe DevTools scan | Team Beta |
| **Component Usage** | All UI uses approved shell components only. | Component inventory check | S.E.A.L. Team 6 |
| **WebSocket Stability** | Real-time updates work with shell's state management. | Load testing (1000+ concurrent) | Team Alpha |

### Rejection Criteria

Code will be **IMMEDIATELY REJECTED** if:

1. ❌ Custom CSS classes are introduced without S.E.A.L. Team 6 approval
2. ❌ Shell JavaScript functions are modified (use APIs, don't modify core)
3. ❌ Visual layouts deviate from the Master Shell
4. ❌ Performance degrades below the 50ms P99 mandate
5. ❌ Accessibility regressions are introduced
6. ❌ Component library is not used (e.g., custom buttons)

### S.E.A.L. Team 6 Review Process

1. **Automated Review:** CI/CD runs screenshot diff tests against Master Shell
2. **Manual Review:** S.E.A.L. Team 6 designer inspects UI for 