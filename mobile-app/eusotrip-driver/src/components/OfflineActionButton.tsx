import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Check, WifiOff } from 'lucide-react-native';
import { useSyncStore } from '@/stores/sync-store';

interface OfflineActionButtonProps {
  title: string;
  onPress: () => Promise<void>;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  showOfflineIndicator?: boolean;
}

export function OfflineActionButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  showOfflineIndicator = true,
}: OfflineActionButtonProps) {
  const { isOnline } = useSyncStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handlePress = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onPress();
      setIsComplete(true);
      setTimeout(() => setIsComplete(false), 2000);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#1a73e8'} />
      ) : isComplete ? (
        <Check size={20} color={variant === 'primary' ? '#fff' : '#1a73e8'} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
          {title}
        </Text>
      )}

      {showOfflineIndicator && !isOnline && (
        <View style={styles.offlineIndicator}>
          <WifiOff size={12} color="#f59e0b" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  secondary: {
    backgroundColor: '#e8f0fe',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#1a73e8',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
  },
});
