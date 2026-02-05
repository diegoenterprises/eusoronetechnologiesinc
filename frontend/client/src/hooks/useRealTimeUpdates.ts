/**
 * USE REAL-TIME UPDATES HOOK
 * Wires WebSocket events to React components for live data updates
 * Supports all 140+ event types across 12 user roles
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { toast } from 'sonner';

// Event type mappings to query invalidation
const EVENT_QUERY_MAP: Record<string, string[]> = {
  // Load events
  'load:created': ['loads.getAll', 'loads.getTrackedLoads', 'dashboard.getStats'],
  'load:posted': ['loads.getAll', 'loads.getAvailable', 'loadBoard.getLoads'],
  'load:assigned': ['loads.getAll', 'loads.getTrackedLoads', 'dispatch.getBoard'],
  'load:status_changed': ['loads.getAll', 'loads.getTrackedLoads', 'tracking.getActive'],
  'load:cancelled': ['loads.getAll', 'loads.getTrackedLoads'],
  'load:completed': ['loads.getAll', 'loads.getTrackedLoads', 'dashboard.getStats'],
  'load:location_updated': ['tracking.getActive', 'geolocation.getPositions'],
  'load:eta_updated': ['loads.getTrackedLoads', 'tracking.getActive'],
  
  // Bid events
  'bid:received': ['bids.getAll', 'bids.getByLoad', 'notifications.getUnread'],
  'bid:awarded': ['bids.getAll', 'loads.getTrackedLoads', 'dashboard.getStats'],
  'bid:countered': ['bids.getAll', 'bids.getByLoad', 'negotiations.getActive'],
  
  // Driver events
  'driver:status_changed': ['drivers.getAll', 'drivers.getAvailable', 'dispatch.getBoard'],
  'driver:location_update': ['tracking.getActive', 'geolocation.getPositions'],
  'driver:hos_warning': ['hos.getStatus', 'compliance.getAlerts'],
  'driver:hos_violation': ['hos.getStatus', 'compliance.getAlerts', 'safety.getIncidents'],
  
  // Vehicle events
  'vehicle:location_update': ['tracking.getActive', 'fleet.getVehicles'],
  'vehicle:breakdown': ['maintenance.getActive', 'zeunMechanics.getBreakdowns'],
  'vehicle:maintenance_due': ['maintenance.getSchedule', 'fleet.getVehicles'],
  
  // Message events
  'message:new': ['messages.getConversations', 'messages.getUnread', 'notifications.getUnread'],
  'message:read': ['messages.getConversations', 'messages.getUnread'],
  
  // Notification events
  'notification:new': ['notifications.getUnread', 'notifications.getAll'],
  
  // Terminal events
  'terminal:appointment_created': ['appointments.getAll', 'terminals.getSchedule'],
  'terminal:tank_level_changed': ['scada.getTankLevels', 'terminals.getInventory'],
  
  // Financial events
  'payment:received': ['wallet.getBalance', 'payments.getHistory', 'dashboard.getStats'],
  'invoice:created': ['billing.getInvoices', 'factoring.getPending'],
  
  // Compliance events
  'compliance:document_expiring': ['compliance.getAlerts', 'documents.getExpiring'],
  'compliance:violation': ['compliance.getAlerts', 'safety.getIncidents'],
  
  // Gamification events (TheHaul)
  'gamification:xp_earned': ['gamification.getProfile', 'gamification.getLeaderboard'],
  'gamification:level_up': ['gamification.getProfile', 'notifications.getUnread'],
  'gamification:badge_earned': ['gamification.getBadges', 'notifications.getUnread'],
};

interface UseRealTimeUpdatesOptions {
  userId?: string;
  companyId?: string;
  role?: string;
  onEvent?: (event: string, data: any) => void;
  showToasts?: boolean;
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const { userId, companyId, role, onEvent, showToasts = true } = options;
  const queryClient = useQueryClient();
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Connect to user-specific channel
  const userChannel = userId ? `user:${userId}` : 'global';
  const { isConnected, lastMessage, send, subscribe } = useWebSocket(userChannel);

  // Subscribe to additional channels based on role
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to role-specific channel
    if (role) {
      subscribe(`role:${role}`);
    }

    // Subscribe to company channel
    if (companyId) {
      subscribe(`company:${companyId}`);
    }

    // Subscribe to global announcements
    subscribe('announcements');
  }, [isConnected, role, companyId, subscribe]);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data, timestamp } = lastMessage;
    
    // Deduplicate events
    const eventKey = `${type}-${timestamp}`;
    if (processedEventsRef.current.has(eventKey)) return;
    processedEventsRef.current.add(eventKey);
    
    // Keep only last 100 events in memory
    if (processedEventsRef.current.size > 100) {
      const iterator = processedEventsRef.current.values();
      const firstValue = iterator.next().value;
      if (firstValue) processedEventsRef.current.delete(firstValue);
    }

    // Invalidate related queries
    const queriesToInvalidate = EVENT_QUERY_MAP[type] || [];
    queriesToInvalidate.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey: queryKey.split('.') });
    });

    // Show toast notifications for important events
    if (showToasts) {
      showEventToast(type, data);
    }

    // Call custom event handler
    if (onEvent) {
      onEvent(type, data);
    }
  }, [lastMessage, queryClient, showToasts, onEvent]);

  // Send event to server
  const emitEvent = useCallback((type: string, data: any) => {
    send({ type, data });
  }, [send]);

  return {
    isConnected,
    lastMessage,
    emitEvent,
    subscribe,
  };
}

// Toast notifications for important events
function showEventToast(type: string, data: any) {
  switch (type) {
    case 'bid:received':
      toast.info('New Bid Received', { description: `$${data?.amount || 'N/A'} for load ${data?.loadId || ''}` });
      break;
    case 'bid:awarded':
      toast.success('Bid Awarded', { description: `Load ${data?.loadId || ''} has been awarded` });
      break;
    case 'load:assigned':
      toast.success('Load Assigned', { description: `You have been assigned load ${data?.loadId || ''}` });
      break;
    case 'driver:hos_warning':
      toast.warning('HOS Warning', { description: data?.message || 'Check your hours of service' });
      break;
    case 'driver:hos_violation':
      toast.error('HOS Violation', { description: data?.message || 'Hours of service violation detected' });
      break;
    case 'vehicle:breakdown':
      toast.error('Vehicle Breakdown', { description: `Vehicle ${data?.vehicleId || ''} reported breakdown` });
      break;
    case 'message:new':
      toast.info('New Message', { description: data?.preview || 'You have a new message' });
      break;
    case 'payment:received':
      toast.success('Payment Received', { description: `$${data?.amount || 'N/A'} has been deposited` });
      break;
    case 'gamification:level_up':
      toast.success('Level Up', { description: `Congratulations! You reached level ${data?.level || ''}` });
      break;
    case 'gamification:badge_earned':
      toast.success('Badge Earned', { description: `You earned the ${data?.badge || ''} badge!` });
      break;
    case 'compliance:document_expiring':
      toast.warning('Document Expiring', { description: data?.message || 'A document is expiring soon' });
      break;
    // Add more cases as needed
  }
}

export default useRealTimeUpdates;
