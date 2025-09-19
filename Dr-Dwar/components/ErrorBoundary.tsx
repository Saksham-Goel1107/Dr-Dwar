import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReportIssue = () => {
    const errorDetails = `Error: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`;
    const issueUrl = `https://github.com/Saksham-Goel1107/dr-dwar/issues/new?title=App%20Crash&body=${encodeURIComponent(errorDetails)}`;
    Linking.openURL(issueUrl);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 24,
                padding: 32,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
                borderWidth: 1,
                borderColor: '#fee2e2',
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🏥</Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#dc2626',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  Something went wrong
                </Text>
                <Text
                  style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 }}
                >
                  We&apos;re sorry for the inconvenience. Our team has been notified.
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#059669',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    elevation: 2,
                  }}
                  onPress={() =>
                    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                  }
                >
                  <Text
                    style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 16 }}
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#f3f4f6',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                  }}
                  onPress={this.handleReportIssue}
                >
                  <Text
                    style={{
                      color: '#374151',
                      fontWeight: '600',
                      textAlign: 'center',
                      fontSize: 16,
                    }}
                  >
                    Report Issue on GitHub
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  marginTop: 24,
                  paddingTop: 24,
                  borderTopWidth: 1,
                  borderTopColor: '#e5e7eb',
                }}
              >
                <Text
                  style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 8 }}
                >
                  Dr. Dwar v1.0.0 • Healthcare Platform
                </Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                  If this issue persists, please contact support
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
