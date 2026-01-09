import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent going back during onboarding
      }}
    >
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}