import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import { initDatabase } from '../src/db/client';
import { seedIfEmpty } from '../src/db/seed';
import { MachineProvider } from '../src/contexts/MachineContext';
import { isOnboardingCompleted } from '../src/lib/machine';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  const [dbReady, setDbReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      await initDatabase();
      if (__DEV__) seedIfEmpty();
      setDbReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!dbReady || Platform.OS === 'web') return;
    isOnboardingCompleted().then((done) => {
      if (!done) router.replace('/onboarding');
    });
  }, [dbReady]);

  if (!fontsLoaded || !dbReady) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <MachineProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="song/new" options={{ presentation: 'modal', animation: 'slide_from_bottom', headerShown: false }} />
          <Stack.Screen name="song/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="settings/machine" options={{ headerShown: false }} />
        </Stack>
      </MachineProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
