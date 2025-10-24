import 'package:flutter/foundation.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';

class NotificationsProvider with ChangeNotifier {
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  int _totalCount = 0;
  NotificationStatsModel? _stats;

  List<NotificationModel> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentPage => _currentPage;
  int get totalCount => _totalCount;
  NotificationStatsModel? get stats => _stats;
  bool get hasMoreData => _notifications.length < _totalCount;
  int get unreadCount => _stats?.unread ?? 0;

  Future<void> loadNotifications({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _notifications.clear();
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getNotifications(page: _currentPage);

      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> notificationsData = data['results'] ?? [];
        
        final newNotifications = notificationsData.map((json) => NotificationModel.fromJson(json)).toList();
        
        if (refresh) {
          _notifications = newNotifications;
        } else {
          _notifications.addAll(newNotifications);
        }
        
        _totalCount = data['count'] ?? 0;
        _currentPage++;
      } else {
        _error = 'فشل في تحميل الإشعارات';
      }
    } catch (e) {
      _error = 'حدث خطأ في الاتصال. تحقق من الإنترنت';
      if (kDebugMode) {
        print('Load notifications error: $e');
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadNotificationStats() async {
    try {
      final response = await ApiService.getNotificationStats();
      if (response.statusCode == 200) {
        _stats = NotificationStatsModel.fromJson(response.data);
        notifyListeners();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Load notification stats error: $e');
      }
    }
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      final response = await ApiService.markNotificationAsRead(notificationId);
      if (response.statusCode == 200) {
        // Update local notification
        final index = _notifications.indexWhere((n) => n.id == notificationId);
        if (index != -1) {
          _notifications[index] = NotificationModel(
            id: _notifications[index].id,
            title: _notifications[index].title,
            body: _notifications[index].body,
            type: _notifications[index].type,
            isRead: true,
            createdAt: _notifications[index].createdAt,
            updatedAt: _notifications[index].updatedAt,
          );
          notifyListeners();
        }
        
        // Reload stats
        await loadNotificationStats();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Mark as read error: $e');
      }
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final response = await ApiService.markAllNotificationsAsRead();
      if (response.statusCode == 200) {
        // Update all notifications to read
        _notifications = _notifications.map((notification) => NotificationModel(
          id: notification.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          isRead: true,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
        )).toList();
        
        notifyListeners();
        
        // Reload stats
        await loadNotificationStats();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Mark all as read error: $e');
      }
    }
  }

  Future<void> deleteNotification(int notificationId) async {
    try {
      final response = await ApiService.deleteNotification(notificationId);
      if (response.statusCode == 200) {
        _notifications.removeWhere((n) => n.id == notificationId);
        _totalCount--;
        notifyListeners();
        
        // Reload stats
        await loadNotificationStats();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Delete notification error: $e');
      }
    }
  }

  Future<void> refreshNotifications() async {
    await loadNotifications(refresh: true);
    await loadNotificationStats();
  }

  Future<void> loadMoreNotifications() async {
    if (!_isLoading && hasMoreData) {
      await loadNotifications();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
