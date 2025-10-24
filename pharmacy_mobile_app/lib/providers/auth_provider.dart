import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;

  Future<void> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.login(username, password);
      
      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        
        if (token != null) {
          await ApiService.setToken(token);
          await _loadUserProfile();
        } else {
          _error = 'فشل في تسجيل الدخول';
        }
      } else {
        _error = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      }
    } catch (e) {
      _error = 'حدث خطأ في الاتصال. تحقق من الإنترنت';
      if (kDebugMode) {
        print('Login error: $e');
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadUserProfile() async {
    try {
      final response = await ApiService.getUserProfile();
      if (response.statusCode == 200) {
        _user = UserModel.fromJson(response.data['user']);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Load profile error: $e');
      }
    }
  }

  Future<void> logout() async {
    try {
      await ApiService.logout();
    } catch (e) {
      if (kDebugMode) {
        print('Logout error: $e');
      }
    } finally {
      await ApiService.clearToken();
      _user = null;
      _error = null;
      notifyListeners();
    }
  }

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      if (token != null) {
        await ApiService.setToken(token);
        await _loadUserProfile();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Check auth error: $e');
      }
      await ApiService.clearToken();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
