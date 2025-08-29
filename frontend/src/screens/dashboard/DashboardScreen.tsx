import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  FAB,
  Surface,
  IconButton,
  Chip 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/constants/theme';
import { DashboardStackParamList } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAuth } from '@/providers/AuthProvider';

type DashboardScreenNavigationProp = StackNavigationProp<DashboardStackParamList, 'DashboardHome'>;

const { width: screenWidth } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [currentIntake, setCurrentIntake] = useState(1650); // Mock data
  const [dailyGoal] = useState(user?.daily_water_goal || 2000);
  const [todayRecords] = useState([
    { time: '08:00', amount: 250, type: 'water' },
    { time: '10:30', amount: 300, type: 'tea' },
    { time: '12:15', amount: 400, type: 'water' },
    { time: '14:45', amount: 200, type: 'coffee' },
    { time: '16:20', amount: 500, type: 'water' },
  ]); // Mock data

  const progress = Math.min((currentIntake / dailyGoal) * 100, 100);
  const remainingAmount = Math.max(dailyGoal - currentIntake, 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleQuickRecord = () => {
    navigation.navigate('QuickRecord');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getProgressColor = () => {
    if (progress >= 100) return theme.colors.success;
    if (progress >= 75) return theme.colors.primary;
    if (progress >= 50) return '#FFA726';
    return '#FF7043';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}!</Text>
            <Text style={styles.username}>{user?.full_name || user?.username || 'User'}</Text>
          </View>
          <IconButton
            icon="bell-outline"
            iconColor="white"
            size={24}
            onPress={() => {}}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Progress Card */}
        <Animatable.View animation="fadeInUp" duration={800}>
          <Card style={styles.progressCard}>
            <Card.Content style={styles.progressCardContent}>
              <View style={styles.progressRing}>
                <Text style={styles.progressAmount}>{currentIntake}</Text>
                <Text style={styles.progressUnit}>ml</Text>
                <Text style={styles.progressGoal}>/ {dailyGoal}ml</Text>
              </View>
              
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>Today's Progress</Text>
                <Text style={styles.progressPercentage}>{Math.round(progress)}% Complete</Text>
                
                {remainingAmount > 0 ? (
                  <Text style={styles.remainingText}>
                    {remainingAmount}ml remaining to reach your goal
                  </Text>
                ) : (
                  <Text style={[styles.remainingText, { color: theme.colors.success }]}>
                    🎉 Goal achieved! Great job!
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Quick Actions */}
        <Animatable.View animation="fadeInUp" duration={800} delay={200}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickActions}>
            {[250, 500, 750].map((amount, index) => (
              <Button
                key={amount}
                mode="outlined"
                style={styles.quickActionButton}
                onPress={() => {}}
              >
                {amount}ml
              </Button>
            ))}
          </View>
        </Animatable.View>

        {/* Today's Records */}
        <Animatable.View animation="fadeInUp" duration={800} delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Records</Text>
            <Button mode="text" onPress={() => {}}>View All</Button>
          </View>
          
          {todayRecords.length > 0 ? (
            <View style={styles.recordsList}>
              {todayRecords.slice(0, 3).map((record, index) => (
                <Surface key={index} style={styles.recordItem}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordTime}>{record.time}</Text>
                    <Text style={styles.recordAmount}>{record.amount}ml</Text>
                  </View>
                  <Chip mode="outlined" compact>
                    {record.type}
                  </Chip>
                </Surface>
              ))}
              {todayRecords.length > 3 && (
                <Surface style={styles.moreRecords}>
                  <Text style={styles.moreRecordsText}>
                    +{todayRecords.length - 3} more records
                  </Text>
                </Surface>
              )}
            </View>
          ) : (
            <Card style={styles.emptyState}>
              <Card.Content style={styles.emptyStateContent}>
                <Text style={styles.emptyStateIcon}>💧</Text>
                <Text style={styles.emptyStateText}>No records yet today</Text>
                <Text style={styles.emptyStateSubtext}>Start tracking your hydration!</Text>
              </Card.Content>
            </Card>
          )}
        </Animatable.View>

        {/* Health Tips */}
        <Animatable.View animation="fadeInUp" duration={800} delay={600}>
          <Text style={styles.sectionTitle}>💡 Daily Tip</Text>
          <Card style={styles.tipCard}>
            <Card.Content>
              <Text style={styles.tipText}>
                Drink a glass of water first thing in the morning to kickstart your metabolism!
              </Text>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Spacing for FAB */}
        <View style={styles.fabSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleQuickRecord}
        label="Add Water"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingBottom: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  progressCard: {
    marginBottom: theme.spacing.lg,
    elevation: 4,
  },
  progressCardContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  progressRing: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressUnit: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: -4,
  },
  progressGoal: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  progressPercentage: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  remainingText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  quickActionButton: {
    flex: 1,
  },
  recordsList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  recordInfo: {
    flex: 1,
  },
  recordTime: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  moreRecords: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
    alignItems: 'center',
  },
  moreRecordsText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    marginBottom: theme.spacing.xl,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  tipCard: {
    marginBottom: theme.spacing.xl,
    backgroundColor: '#E3F2FD',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurface,
  },
  fabSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
  },
});