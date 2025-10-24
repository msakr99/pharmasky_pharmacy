import 'package:flutter/foundation.dart';
import '../models/offer_model.dart';
import '../services/api_service.dart';

class OffersProvider with ChangeNotifier {
  List<OfferModel> _offers = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  int _totalCount = 0;
  String _searchQuery = '';

  List<OfferModel> get offers => _offers;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentPage => _currentPage;
  int get totalCount => _totalCount;
  String get searchQuery => _searchQuery;
  bool get hasMoreData => _offers.length < _totalCount;

  Future<void> loadOffers({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _offers.clear();
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getOffers(
        page: _currentPage,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> offersData = data['results'] ?? [];
        
        final newOffers = offersData.map((json) => OfferModel.fromJson(json)).toList();
        
        if (refresh) {
          _offers = newOffers;
        } else {
          _offers.addAll(newOffers);
        }
        
        _totalCount = data['count'] ?? 0;
        _currentPage++;
      } else {
        _error = 'فشل في تحميل العروض';
      }
    } catch (e) {
      _error = 'حدث خطأ في الاتصال. تحقق من الإنترنت';
      if (kDebugMode) {
        print('Load offers error: $e');
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> searchOffers(String query) async {
    _searchQuery = query;
    await loadOffers(refresh: true);
  }

  Future<void> clearSearch() async {
    _searchQuery = '';
    await loadOffers(refresh: true);
  }

  Future<void> refreshOffers() async {
    await loadOffers(refresh: true);
  }

  Future<void> loadMoreOffers() async {
    if (!_isLoading && hasMoreData) {
      await loadOffers();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
