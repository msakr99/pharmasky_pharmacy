import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notifications_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/loading_button.dart';
import '../../widgets/notification_card.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNotifications();
    });
  }

  Future<void> _loadNotifications() async {
    final notificationsProvider = Provider.of<NotificationsProvider>(context, listen: false);
    await notificationsProvider.loadNotifications(refresh: true);
    await notificationsProvider.loadNotificationStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('الإشعارات'),
        actions: [
          Consumer<NotificationsProvider>(
            builder: (context, notificationsProvider, child) {
              if (notificationsProvider.unreadCount > 0) {
                return TextButton(
                  onPressed: () async {
                    await notificationsProvider.markAllAsRead();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('تم تحديد جميع الإشعارات كمقروءة'),
                      ),
                    );
                  },
                  child: const Text('تحديد الكل كمقروء'),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<NotificationsProvider>(
        builder: (context, notificationsProvider, child) {
          if (notificationsProvider.isLoading && notificationsProvider.notifications.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (notificationsProvider.error != null && notificationsProvider.notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: AppTheme.errorColor,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    notificationsProvider.error!,
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  LoadingButton(
                    onPressed: _loadNotifications,
                    isLoading: false,
                    text: 'إعادة المحاولة',
                    width: 200,
                  ),
                ],
              ),
            );
          }

          if (notificationsProvider.notifications.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_outlined,
                    size: 64,
                    color: AppTheme.textLight,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'لا توجد إشعارات',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadNotifications,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notificationsProvider.notifications.length + (notificationsProvider.hasMoreData ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == notificationsProvider.notifications.length) {
                  return Padding(
                    padding: const EdgeInsets.all(16),
                    child: Center(
                      child: LoadingButton(
                        onPressed: notificationsProvider.loadMoreNotifications,
                        isLoading: notificationsProvider.isLoading,
                        text: 'تحميل المزيد',
                        width: 200,
                      ),
                    ),
                  );
                }

                final notification = notificationsProvider.notifications[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: NotificationCard(
                    notification: notification,
                    onMarkAsRead: () async {
                      await notificationsProvider.markAsRead(notification.id);
                    },
                    onDelete: () async {
                      await notificationsProvider.deleteNotification(notification.id);
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
