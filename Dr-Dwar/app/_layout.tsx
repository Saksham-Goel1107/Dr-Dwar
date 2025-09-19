import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { resourceCache } from '@clerk/clerk-expo/resource-cache';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../global.css';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inRoot = segments[0] === '(root)';
    if (segments[0] === 'terms' || segments[0] === 'privacy' || segments[0] === 'Support') return;

    if (isSignedIn) {
      const metadata = user?.unsafeMetadata as any;
      const hasBasicInfo =
        metadata?.firstName &&
        metadata?.lastName &&
        metadata?.dateOfBirth &&
        metadata?.gender &&
        metadata?.address?.city &&
        metadata?.emergencyContact?.name;
      if (!hasBasicInfo && inRoot && segments[1] !== 'basic-info') {
        router.replace('/(root)/basic-info');
      } else if (hasBasicInfo && !inRoot) {
        router.replace('/(root)/(tabs)/home');
      }
    } else if (!isSignedIn && inRoot) {
      router.replace('/(auth)/Sign-in');
    }
  }, [isSignedIn, isLoaded, user, router, segments]);

  return <Slot />;
}

export default Sentry.wrap(function RootLayout() {
  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={publishableKey}
        tokenCache={tokenCache}
        __experimental_resourceCache={resourceCache}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <PaperProvider>
              <InitialLayout />
            </PaperProvider>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ClerkProvider>
    </ErrorBoundary>
  );
});
