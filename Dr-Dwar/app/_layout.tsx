import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { resourceCache } from '@clerk/clerk-expo/resource-cache';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { exitApp } from '@logicwind/react-native-exit-app';
import * as Sentry from '@sentry/react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import * as SecureStore from 'expo-secure-store';
import { Accelerometer } from 'expo-sensors';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useFreeRasp } from 'freerasp-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../global.css';
import Splash from './components/Splash';

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
  const [readPageAloud, setReadPageAloud] = useState(false);

  // Security threat detection using FreeRASP
  const block = (message: string) => {
    Alert.alert(
      'Security Warning',
      `${message}\nFor security reasons, the app will now close.`,
      [{ text: 'OK', onPress: () => exitApp() }],
      { cancelable: false },
    );
  };

  const freeRaspConfig = {
    androidConfig: {
      packageName: '',
      certificateHashes: [],
      supportedAlternativeStores: [],
    },
    iosConfig: {
      appBundleId: '',
      appTeamId: '',
    },
    watcherMail: '',
    isProd: !__DEV__,
    onRootDetected: () => block('Rooted/Jailbroken device detected.'),
    onEmulatorDetected: () => block('Emulator detected.'),
    onHookDetected: () => block('Hooking tool detected.'),
    onTamperDetected: () => block('App tampering detected.'),
    onPasscodeDisabled: () => block('Device passcode disabled.'),
    onDeviceBindingDetected: () => block('Device binding detected.'),
    onUntrustedInstallationDetected: () => block('Untrusted installation detected.'),
    onJailbreakDetected: () => block('Jailbreak detected.'),
    onSimulatorDetected: () => block('Simulator detected.'),
    onDebuggerDetected: () => block('Debugger detected.'),
    onAdbEnabled: () => block('ADB enabled on device.'),
    onScreenshotDetected: () => block('Screenshot detected.'),
    onScreenRecordingDetected: () => block('Screen recording detected.'),
  };

  useFreeRasp(freeRaspConfig, {});

  useEffect(() => {
    const checkAndPreventScreenCapture = async () => {
      try {
        const preventSS = await SecureStore.getItemAsync('PREVENT_SCREEN_CAPTURE');
        if (preventSS !== 'false') {
          // Default to true
          ScreenCapture.preventScreenCaptureAsync();
        }
      } catch (error) {
        console.error('Error checking screen capture setting:', error);
        // Default to prevent if can't load setting
        ScreenCapture.preventScreenCaptureAsync();
      }
    };

    checkAndPreventScreenCapture();

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const inRoot = segments[0] === '(root)';
    if (segments[0] === 'terms' || segments[0] === 'privacy' || segments[0] === 'Support' || segments[0] === 'credits') return;

    if (isSignedIn) {
      const metadata = user?.unsafeMetadata as any;
      const hasCompletedProfile = metadata?.basicInfoCompleted === true;
      if (!hasCompletedProfile && inRoot && segments[1] !== 'basic-info') {
        router.replace('/(root)/basic-info');
      } else if (hasCompletedProfile && !inRoot) {
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
    NavigationBar.setButtonStyleAsync('dark');
    loadShakeSetting();
  }, []);

  // Load read page aloud setting
  useEffect(() => {
    const loadReadPageAloudSetting = async () => {
      try {
        const readAloudSetting = await SecureStore.getItemAsync('READ_PAGE_ALOUD');
        setReadPageAloud(readAloudSetting === 'true');
      } catch (error) {
        console.error('Error loading read page aloud setting:', error);
        setReadPageAloud(false);
      }
    };

    loadReadPageAloudSetting();
  }, []);

  // Function to get detailed page description from segments
  const getPageDescription = (segments: string[]) => {
    const path = segments.join('/');

    const pageDescriptions: { [key: string]: string } = {
      '(root)/(tabs)/home':
        'Home page: Your main dashboard showing health overview, quick access to features, and personalized health insights.',
      '(root)/hospitals':
        'Hospitals page: Find nearby hospitals, view their details, ratings, and get directions to reach them.',
      '(root)/pharmacies':
        'Pharmacies page: Find nearby pharmacies, view their details, phone numbers, and get address to reach them.',
      '(root)/(tabs)/pharmacy':
        'Pharmacy page: Browse a wide variety of medicines you can purchase. There is a cart icon at the top right corner where you can view and pay for your selected items.',
      '(root)/(tabs)/jan-news':
        'Jan News page: Stay updated with the latest health news and information. Pull down to refresh for the newest articles.',
      '(root)/orders':
        'Orders page: View your medication order history, track deliveries, and manage your purchases.',
      '(root)/reminders':
        'Reminders page: Set and manage health reminders for medications, appointments, and wellness activities.',
      '(root)/(tabs)/profile':
        'Profile page: Manage your account settings, update personal information, and configure app preferences.',
      '(root)/basic-info':
        'Basic Information page: Update your essential health profile including medical history and emergency contacts.',
      '(root)/edit-basic-info':
        'Edit Basic Information page: Modify your health details, address, and contact information.',
      '(auth)/Sign-in':
        'Sign In page: Enter your credentials to securely access your Dr-Dwar account.',
      '(auth)/Sign-up':
        'Sign Up page: Create a new account to start using Dr-Dwar health services.',
      terms:
        'Terms of Service page: Read the terms and conditions for using the Dr-Dwar application.',
      credits:
        'Credits page: Know the technology stack and meet the contributors who developed the Dr-Dwar app.',
      privacy: 'Privacy Policy page: Learn about how we protect your data and privacy in the app.',
      Support: 'Support page: Get help, contact support, and access frequently asked questions.',
    };

    return pageDescriptions[path] || `Page: ${path.replace(/[^a-zA-Z0-9]/g, ' ')}`;
  };

  // Read page description aloud when segments change
  useEffect(() => {
    if (readPageAloud && segments.length > 0) {
      Speech.stop();
      const pageDescription = getPageDescription(segments);
      Speech.speak(pageDescription, {
        language: 'en',
        pitch: 1,
        rate: 1,
      });
    }
  }, [segments, readPageAloud]);

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

  if (!isLoaded) {
    return <Splash />;
  }
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
