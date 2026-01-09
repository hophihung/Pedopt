import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FacebookService, FacebookConnection, FacebookProfile } from '../services/facebook.service';

export function useFacebookConnection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<FacebookConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load connection status
  const loadConnectionStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const connected = await FacebookService.isConnected(user.id);
      setIsConnected(connected);

      if (connected) {
        const connectionData = await FacebookService.getConnection(user.id);
        setConnection(connectionData);
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error('Error loading Facebook connection status:', error);
      setIsConnected(false);
      setConnection(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Connect Facebook account
  const connect = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      setConnecting(true);

      // Mock Facebook login (in real app, use Facebook SDK)
      const loginResult = await FacebookService.mockFacebookLogin();

      if (!loginResult.success || !loginResult.profile) {
        return { success: false, message: loginResult.message };
      }

      // Connect to our backend
      const connectResult = await FacebookService.connect(user.id, loginResult.profile);

      if (connectResult.success) {
        await loadConnectionStatus(); // Refresh status
      }

      return connectResult;
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      return { success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại.' };
    } finally {
      setConnecting(false);
    }
  }, [user?.id, loadConnectionStatus]);

  // Disconnect Facebook account
  const disconnect = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      setConnecting(true);
      const result = await FacebookService.disconnect(user.id);

      if (result.success) {
        await FacebookService.clearCachedProfile();
        await loadConnectionStatus(); // Refresh status
      }

      return result;
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
      return { success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại.' };
    } finally {
      setConnecting(false);
    }
  }, [user?.id, loadConnectionStatus]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadConnectionStatus();
    }
  }, [user?.id, loadConnectionStatus]);

  return {
    loading,
    connecting,
    isConnected,
    connection,
    connect,
    disconnect,
    refreshConnection: loadConnectionStatus,
  };
}