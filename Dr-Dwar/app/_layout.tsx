import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { resourceCache } from '@clerk/clerk-expo/resource-cache';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as Sentry from '@sentry/react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Accelerometer } from 'expo-sensors';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../global.css';
import * as ScreenCapture from 'expo-screen-capture';

// Initialize Sentry conditionally based on user settings
const initializeSentry = async () => {
  try {
    const sendDiagnosticData = await SecureStore.getItemAsync('SEND_DIAGNOSTIC_DATA');

    // Only initialize Sentry if diagnostic data is enabled (default: true)
    if (sendDiagnosticData !== 'false') {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

        // Adds more context data to events (IP address, cookies, user, etc.)
        // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
        sendDefaultPii: true,

        // Configure Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1,
        integrations: [
          Sentry.mobileReplayIntegration(),
          Sentry.feedbackIntegration({
            // Additional SDK configuration goes in here, for example:
            styles: {
              submitButton: {
                backgroundColor: '#6a1b9a',
              },
            },
            namePlaceholder: 'Fullname',
            isNameRequired: true,
            isEmailRequired: true,
          }),
        ],

        // uncomment the line below to enable Spotlight (https://spotlightjs.com)
        // spotlight: __DEV__,
      });
    }
  } catch (error) {
    console.error('Error initializing Sentry:', error);
    // Fallback: initialize with minimal config if settings can't be loaded
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      sendDefaultPii: false,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  }
};

// Initialize Sentry on app start
initializeSentry();

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
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [shakeToReportEnabled, setShakeToReportEnabled] = useState(true);

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);


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

  // Load shake to report setting
  useEffect(() => {
    const loadShakeSetting = async () => {
      try {
        const shakeSetting = await SecureStore.getItemAsync('SHAKE_TO_REPORT');
        setShakeToReportEnabled(shakeSetting !== 'false'); // Default to true
      } catch (error) {
        console.error('Error loading shake setting:', error);
        setShakeToReportEnabled(true); // Default to true on error
      }
    };

    loadShakeSetting();
  }, []);

  // Shake detection for Sentry feedback
  useEffect(() => {
    let subscription: any;

    const startShakeDetection = async () => {
      // Only start shake detection if enabled
      if (!shakeToReportEnabled) {
        return;
      }

      try {
        // Request permission to use accelerometer
        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Accelerometer permission denied');
          return;
        }

        // Set update interval for shake detection
        Accelerometer.setUpdateInterval(100);

        let lastX = 0;
        let lastY = 0;
        let lastZ = 0;
        let lastUpdate = 0;
        const SHAKE_THRESHOLD = 2.7; // Adjust sensitivity as needed

        subscription = Accelerometer.addListener((accelerometerData) => {
          const { x, y, z } = accelerometerData;
          const currentTime = Date.now();

          // Only check for shake every 100ms to avoid too many calculations
          if (currentTime - lastUpdate > 100) {
            const acceleration = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);

            if (acceleration > SHAKE_THRESHOLD) {
              // Device was shaken - toggle feedback widget
              try {
                if (isFeedbackVisible) {
                  // Try to hide feedback widget (if method exists)
                  if (typeof (Sentry as any).hideFeedbackWidget === 'function') {
                    (Sentry as any).hideFeedbackWidget();
                  } else if (typeof (Sentry as any).closeFeedback === 'function') {
                    (Sentry as any).closeFeedback();
                  }
                  setIsFeedbackVisible(false);
                } else {
                  Sentry.showFeedbackWidget();
                  setIsFeedbackVisible(true);
                }
              } catch (error) {
                console.error('Error toggling feedback widget:', error);
              }
            }

            lastX = x;
            lastY = y;
            lastZ = z;
            lastUpdate = currentTime;
          }
        });
      } catch (error) {
        console.error('Error setting up shake detection:', error);
      }
    };

    startShakeDetection();

    // Cleanup subscription on unmount or when setting changes
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isFeedbackVisible, shakeToReportEnabled]);

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
          <StatusBar style="dark" backgroundColor="#000000" />
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
