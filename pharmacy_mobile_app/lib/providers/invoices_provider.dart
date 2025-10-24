import 'package:flutter/foundation.dart';
import '../models/invoice_model.dart';
import '../services/api_service.dart';

class InvoicesProvider with ChangeNotifier {
  List<InvoiceModel> _invoices = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  int _totalCount = 0;
  String _searchQuery = '';

  // Statistics
  double _totalSales = 0;
  int _totalInvoices = 0;
  double _averageInvoiceValue = 0;

  List<InvoiceModel> get invoices => _invoices;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentPage => _currentPage;
  int get totalCount => _totalCount;
  String get searchQuery => _searchQuery;
  bool get hasMoreData => _invoices.length < _totalCount;

  // Statistics getters
  double get totalSales => _totalSales;
  int get totalInvoices => _totalInvoices;
  double get averageInvoiceValue => _averageInvoiceValue;

  Future<void> loadInvoices({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _invoices.clear();
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getInvoices(
        page: _currentPage,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> invoicesData = data['results'] ?? [];
        
        final newInvoices = invoicesData.map((json) => InvoiceModel.fromJson(json)).toList();
        
        if (refresh) {
          _invoices = newInvoices;
        } else {
          _invoices.addAll(newInvoices);
        }
        
        _totalCount = data['count'] ?? 0;
        _currentPage++;
        
        // Calculate statistics
        _calculateStatistics();
      } else {
        _error = 'فشل في تحميل الفواتير';
      }
    } catch (e) {
      _error = 'حدث خطأ في الاتصال. تحقق من الإنترنت';
      if (kDebugMode) {
        print('Load invoices error: $e');
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _calculateStatistics() {
    _totalSales = _invoices.fold(0.0, (sum, invoice) => sum + double.tryParse(invoice.totalPrice) ?? 0);
    _totalInvoices = _invoices.length;
    _averageInvoiceValue = _totalInvoices > 0 ? _totalSales / _totalInvoices : 0;
  }

  Future<void> searchInvoices(String query) async {
    _searchQuery = query;
    await loadInvoices(refresh: true);
  }

  Future<void> clearSearch() async {
    _searchQuery = '';
    await loadInvoices(refresh: true);
  }

  Future<void> refreshInvoices() async {
    await loadInvoices(refresh: true);
  }

  Future<void> loadMoreInvoices() async {
    if (!_isLoading && hasMoreData) {
      await loadInvoices();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
