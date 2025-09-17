import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { resourceCache } from '@clerk/clerk-expo/resource-cache';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../global.css';

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

    const inTabsGroup = segments[1] === '(tabs)';
    if (segments[0] === 'terms' || segments[0] === 'privacy')
      return;

    if (isSignedIn) {
      const metadata = user?.unsafeMetadata as any;
      const hasBasicInfo =
        metadata?.firstName &&
        metadata?.lastName &&
        metadata?.dateOfBirth &&
        metadata?.gender &&
        metadata?.address?.city &&
        metadata?.emergencyContact?.name;
      if (!hasBasicInfo && inTabsGroup) {
        router.replace('/(root)/basic-info');
      } else if ((hasBasicInfo && !inTabsGroup) && segments[1] !== 'edit-basic-info' && segments[1] !== 'cart') {
        router.replace('/(root)/(tabs)/home');
      }
    } else if (!isSignedIn && inTabsGroup) {
      router.replace('/(auth)/Sign-in');
    }
  }, [isSignedIn, isLoaded, user, router, segments]);

  return <Slot />;
}

export default function RootLayout() {
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
}
