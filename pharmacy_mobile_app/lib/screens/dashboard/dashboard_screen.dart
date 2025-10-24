import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notifications_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/dashboard_card.dart';
import '../../widgets/notification_badge.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final notificationsProvider = Provider.of<NotificationsProvider>(context, listen: false);
    await notificationsProvider.loadNotificationStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('فارماسكاي'),
        actions: [
          Consumer<NotificationsProvider>(
            builder: (context, notificationsProvider, child) {
              return NotificationBadge(
                count: notificationsProvider.unreadCount,
                onTap: () => context.go('/notifications'),
              );
            },
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.user == null) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome Section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.primaryColor,
                        AppTheme.primaryColor.withOpacity(0.8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'مرحباً،',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        authProvider.user!.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        authProvider.user!.pharmacyName ?? 'صيدلية',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Quick Actions
                const Text(
                  'الخدمات السريعة',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.2,
                  children: [
                    DashboardCard(
                      title: 'العروض',
                      subtitle: 'عروض وخصومات',
                      icon: Icons.local_offer,
                      color: AppTheme.successColor,
                      onTap: () => context.go('/offers'),
                    ),
                    DashboardCard(
                      title: 'الفواتير',
                      subtitle: 'فواتير المبيعات',
                      icon: Icons.receipt_long,
                      color: AppTheme.infoColor,
                      onTap: () => context.go('/invoices'),
                    ),
                    DashboardCard(
                      title: 'النواقص',
                      subtitle: 'الأصناف الناقصة',
                      icon: Icons.inventory_2,
                      color: AppTheme.warningColor,
                      onTap: () => context.go('/shortages'),
                    ),
                    DashboardCard(
                      title: 'الإشعارات',
                      subtitle: 'إشعارات مهمة',
                      icon: Icons.notifications,
                      color: AppTheme.accentColor,
                      onTap: () => context.go('/notifications'),
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Account Info
                if (authProvider.user!.account != null) ...[
                  const Text(
                    'معلومات الحساب',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primaryColor.withOpacity(0.1)),
                    ),
                    child: Column(
                      children: [
                        _buildAccountInfoRow(
                          'الرصيد المتبقي',
                          '${authProvider.user!.account!.remainingCredit} ريال',
                          AppTheme.successColor,
                        ),
                        const SizedBox(height: 12),
                        _buildAccountInfoRow(
                          'إجمالي الائتمان',
                          '${authProvider.user!.account!.totalCredit} ريال',
                          AppTheme.infoColor,
                        ),
                        const SizedBox(height: 12),
                        _buildAccountInfoRow(
                          'الائتمان المستخدم',
                          '${authProvider.user!.account!.usedCredit} ريال',
                          AppTheme.warningColor,
                        ),
                      ],
                    ),
                  ),
                ],
                
                const SizedBox(height: 24),
                
                // Logout Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final authProvider = Provider.of<AuthProvider>(context, listen: false);
                      await authProvider.logout();
                      if (mounted) {
                        context.go('/auth/login');
                      }
                    },
                    icon: const Icon(Icons.logout),
                    label: const Text('تسجيل الخروج'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.errorColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAccountInfoRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            color: AppTheme.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}
