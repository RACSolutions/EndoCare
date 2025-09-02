import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppRating } from '../hooks/useAppRating';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { incrementAppLaunches } = useAppRating();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Track app launches for rating prompts
  useEffect(() => {
    incrementAppLaunches();
  }, [incrementAppLaunches]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ErrorBoundary
      fallbackTitle="App Error"
      fallbackMessage="Something went wrong with EndoCare. Please restart the app to continue tracking your symptoms."
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
