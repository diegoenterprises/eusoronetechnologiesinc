import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSyncStore } from '@/stores/sync-store';
import { Cloud, CloudOff, WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react-native';

export function SyncStatusPanel() {
  const { isOnline, isSyncing, pendingCount, failedCount, lastSyncedAt, forceSync } = useSyncStore();

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={styles.statusRow}>
        <View style={[styles.dot, isOnline ? styles.dotGreen : styles.dotAmber]} />
        <Text style={styles.statusLabel}>
          {isOnline ? 'Connected' : 'Offline'}
        </Text>
        {isOnline && !isSyncing && (
          <Pressable onPress={forceSync} style={styles.syncBtn}>
            <RefreshCw size={14} color="#1473FF" />
            <Text style={styles.syncBtnText}>Sync Now</Text>
          </Pressable>
        )}
      </View>

      {/* Sync Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <View style={styles.statCard}>
          <Cloud size={16} color="#1473FF" />
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          {failedCount > 0 ? (
            <AlertTriangle size={16} color="#f59e0b" />
          ) : (
            <CheckCircle size={16} color="#10B981" />
          )}
          <Text style={styles.statValue}>{failedCount}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>

        <View style={styles.statCard}>
          {isOnline ? (
            <Cloud size={16} color="#10B981" />
          ) : (
            <CloudOff size={16} color="#94a3b8" />
          )}
          <Text style={styles.statValue}>
            {lastSyncedAt ? formatTimeAgo(lastSyncedAt) : 'Never'}
          </Text>
          <Text style={styles.statLabel}>Last Sync</Text>
        </View>
      </ScrollView>

      {/* Syncing indicator */}
      {isSyncing && (
        <View style={styles.syncingBar}>
          <Text style={styles.syncingText}>Syncing {pendingCount} actions...</Text>
        </View>
      )}

      {/* Offline banner */}
      {!isOnline && pendingCount > 0 && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#92400e" />
          <Text style={styles.offlineBannerText}>
            {pendingCount} action{pendingCount !== 1 ? 's' : ''} will sync when you're back online
          </Text>
        </View>
      )}
    </View>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotAmber: {
    backgroundColor: '#f59e0b',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EBF3FF',
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1473FF',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    minWidth: 80,
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  syncingBar: {
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  syncingText: {
    fontSize: 12,
    color: '#1473FF',
    fontWeight: '500',
    textAlign: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
    gap: 6,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    flex: 1,
  },
});
