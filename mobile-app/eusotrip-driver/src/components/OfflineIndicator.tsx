import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSyncStore } from '@/stores/sync-store';
import { WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence
} from 'react-native-reanimated';

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, failedCount, forceSync } = useSyncStore();

  // Don't show anything if online and nothing pending
  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  const pulseStyle = useAnimatedStyle(() => {
    if (!isSyncing) return { opacity: 1 };
    return {
      opacity: withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      ),
    };
  });

  return (
    <Pressable onPress={isOnline ? forceSync : undefined}>
      <Animated.View style={[styles.container, pulseStyle, !isOnline && styles.offline]}>
        {!isOnline ? (
          <>
            <WifiOff size={16} color="#fff" />
            <Text style={styles.text}>Offline Mode</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </>
        ) : isSyncing ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.text}>Syncing {pendingCount}...</Text>
          </>
        ) : failedCount > 0 ? (
          <>
            <CloudOff size={16} color="#fff" />
            <Text style={styles.text}>{failedCount} failed</Text>
            <RefreshCw size={14} color="#fff" style={styles.retryIcon} />
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud size={16} color="#fff" />
            <Text style={styles.text}>{pendingCount} pending</Text>
          </>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  offline: {
    backgroundColor: '#f59e0b',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  retryIcon: {
    marginLeft: 4,
  },
});
