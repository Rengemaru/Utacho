import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const colors = {
  accent: '#5b4cf5',
  text3: '#9ca3af',
  border: 'rgba(0, 0, 0, 0.07)',
};

function NavIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.navItem}>
      <Text style={styles.navEmoji}>{emoji}</Text>
      <Text style={[styles.navLabel, focused && styles.navLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom }],
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon emoji="♪" label="曲一覧" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon emoji="🔍" label="さがす" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon emoji="⚙️" label="設定" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 8,
  },
  navEmoji: {
    fontSize: 17,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.text3,
  },
  navLabelActive: {
    color: colors.accent,
  },
});
