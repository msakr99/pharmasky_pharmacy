import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/invoices_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/loading_button.dart';
import '../../widgets/invoice_card.dart';
import '../../widgets/search_bar.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInvoices();
    });
  }

  Future<void> _loadInvoices() async {
    final invoicesProvider = Provider.of<InvoicesProvider>(context, listen: false);
    await invoicesProvider.loadInvoices(refresh: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('الفواتير'),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchBar(
              controller: _searchController,
              hintText: 'ابحث في الفواتير...',
              onChanged: (value) {
                if (value.isEmpty) {
                  _loadInvoices();
                } else {
                  _searchInvoices(value);
                }
              },
              onClear: () {
                _searchController.clear();
                _loadInvoices();
              },
            ),
          ),
          
          // Statistics
          Consumer<InvoicesProvider>(
            builder: (context, invoicesProvider, child) {
              if (invoicesProvider.totalInvoices > 0) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatItem(
                        'إجمالي المبيعات',
                        '${invoicesProvider.totalSales.toStringAsFixed(2)} ريال',
                        AppTheme.successColor,
                        Icons.attach_money,
                      ),
                      _buildStatItem(
                        'عدد الفواتير',
                        '${invoicesProvider.totalInvoices}',
                        AppTheme.infoColor,
                        Icons.receipt,
                      ),
                      _buildStatItem(
                        'متوسط الفاتورة',
                        '${invoicesProvider.averageInvoiceValue.toStringAsFixed(2)} ريال',
                        AppTheme.warningColor,
                        Icons.trending_up,
                      ),
                    ],
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          
          const SizedBox(height: 16),
          
          // Content
          Expanded(
            child: Consumer<InvoicesProvider>(
              builder: (context, invoicesProvider, child) {
                if (invoicesProvider.isLoading && invoicesProvider.invoices.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (invoicesProvider.error != null && invoicesProvider.invoices.isEmpty) {
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
                          invoicesProvider.error!,
                          style: const TextStyle(
                            fontSize: 16,
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        LoadingButton(
                          onPressed: _loadInvoices,
                          isLoading: false,
                          text: 'إعادة المحاولة',
                          width: 200,
                        ),
                      ],
                    ),
                  );
                }

                if (invoicesProvider.invoices.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.receipt_outlined,
                          size: 64,
                          color: AppTheme.textLight,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'لا توجد فواتير متاحة',
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
                  onRefresh: _loadInvoices,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: invoicesProvider.invoices.length + (invoicesProvider.hasMoreData ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == invoicesProvider.invoices.length) {
                        return Padding(
                          padding: const EdgeInsets.all(16),
                          child: Center(
                            child: LoadingButton(
                              onPressed: invoicesProvider.loadMoreInvoices,
                              isLoading: invoicesProvider.isLoading,
                              text: 'تحميل المزيد',
                              width: 200,
                            ),
                          ),
                        );
                      }

                      final invoice = invoicesProvider.invoices[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: InvoiceCard(invoice: invoice),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color, IconData icon) {
    return Column(
      children: [
        Icon(
          icon,
          color: color,
          size: 24,
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppTheme.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Future<void> _searchInvoices(String query) async {
    final invoicesProvider = Provider.of<InvoicesProvider>(context, listen: false);
    await invoicesProvider.searchInvoices(query);
  }
}
