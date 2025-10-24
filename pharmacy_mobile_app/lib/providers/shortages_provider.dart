import 'package:flutter/foundation.dart';
import '../models/shortage_model.dart';
import '../services/api_service.dart';

class ShortagesProvider with ChangeNotifier {
  List<ShortageModel> _shortages = [];
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';

  List<ShortageModel> get shortages => _shortages;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;

  Future<void> loadShortages() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getShortages(
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> shortagesData = data['results'] ?? [];
        
        _shortages = shortagesData.map((json) => ShortageModel.fromJson(json)).toList();
      } else {
        _error = 'فشل في تحميل النواقص';
      }
    } catch (e) {
      _error = 'حدث خطأ في الاتصال. تحقق من الإنترنت';
      if (kDebugMode) {
        print('Load shortages error: $e');
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> searchShortages(String query) async {
    _searchQuery = query;
    await loadShortages();
  }

  Future<void> clearSearch() async {
    _searchQuery = '';
    await loadShortages();
  }

  Future<void> refreshShortages() async {
    await loadShortages();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
