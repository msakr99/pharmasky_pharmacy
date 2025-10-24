import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:8000';
  static late Dio _dio;
  static String? _token;

  static Future<void> initialize() async {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Load token from storage
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    if (_token != null) {
      _dio.options.headers['Authorization'] = 'Token $_token';
    }

    // Add interceptors
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        print('Request: ${options.method} ${options.path}');
        handler.next(options);
      },
      onResponse: (response, handler) {
        print('Response: ${response.statusCode} ${response.requestOptions.path}');
        handler.next(response);
      },
      onError: (error, handler) {
        print('Error: ${error.message}');
        handler.next(error);
      },
    ));
  }

  static Future<void> setToken(String token) async {
    _token = token;
    _dio.options.headers['Authorization'] = 'Token $token';
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<void> clearToken() async {
    _token = null;
    _dio.options.headers.remove('Authorization');
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Auth APIs
  static Future<Response> login(String username, String password) async {
    return await _dio.post('/api/auth/login/', data: {
      'username': username,
      'password': password,
    });
  }

  static Future<Response> logout() async {
    return await _dio.post('/api/auth/logout/');
  }

  // User Profile APIs
  static Future<Response> getUserProfile() async {
    return await _dio.get('/api/profiles/user-profile');
  }

  static Future<Response> getPaymentPeriods() async {
    return await _dio.get('/api/profiles/payment-periods');
  }

  // Offers APIs
  static Future<Response> getOffers({int page = 1, String? search}) async {
    final queryParams = <String, dynamic>{
      'p': page,
    };
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    
    return await _dio.get('/api/offers/max-offers', queryParameters: queryParams);
  }

  static Future<Response> downloadOffers() async {
    return await _dio.get('/api/offers/max-offers/download');
  }

  // Invoices APIs
  static Future<Response> getInvoices({int page = 1, String? search}) async {
    final queryParams = <String, dynamic>{
      'p': page,
    };
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    
    return await _dio.get('/api/invoices/sale-invoices', queryParameters: queryParams);
  }

  // Notifications APIs
  static Future<Response> getNotifications({int page = 1}) async {
    return await _dio.get('/api/notifications', queryParameters: {'p': page});
  }

  static Future<Response> getNotificationStats() async {
    return await _dio.get('/api/notifications/stats');
  }

  static Future<Response> markNotificationAsRead(int notificationId) async {
    return await _dio.patch('/api/notifications/$notificationId/update', data: {
      'is_read': true,
    });
  }

  static Future<Response> markAllNotificationsAsRead() async {
    return await _dio.post('/api/notifications/mark-all-read');
  }

  static Future<Response> deleteNotification(int notificationId) async {
    return await _dio.delete('/api/notifications/$notificationId/delete');
  }

  static Future<Response> saveFcmToken(String token) async {
    return await _dio.post('/api/notifications/save-fcm-token', data: {
      'fcm_token': token,
    });
  }

  // Shortages APIs
  static Future<Response> getShortages({String? search}) async {
    final queryParams = <String, dynamic>{};
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    
    return await _dio.get('/api/market/user/product-wishlist', queryParameters: queryParams);
  }

  // Financial APIs
  static Future<Response> getAccountStatement() async {
    return await _dio.get('/api/finance/my-account-statement');
  }

  static Future<Response> getCollectionSchedule() async {
    return await _dio.get('/api/finance/my-collection-schedule');
  }

  static Future<Response> getUserFinancialSummary() async {
    return await _dio.get('/api/finance/user-financial-summary');
  }
}
