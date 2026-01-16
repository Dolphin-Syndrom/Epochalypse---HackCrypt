import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

// Custom dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#050508',
    card: '#0A0A0F',
    text: '#FFFFFF',
    border: '#2A2A35',
    primary: '#E8E8EC',
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={CustomDarkTheme}>
        <View style={{ flex: 1, backgroundColor: '#050508' }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#050508' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="detect/[type]" 
              options={{ 
                headerShown: false,
                presentation: 'card',
                animation: 'slide_from_bottom',
              }} 
            />
          </Stack>
          <StatusBar style="light" />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
