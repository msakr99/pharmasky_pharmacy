import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/offers_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/loading_button.dart';
import '../../widgets/offer_card.dart';
import '../../widgets/search_bar.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadOffers();
    });
  }

  Future<void> _loadOffers() async {
    final offersProvider = Provider.of<OffersProvider>(context, listen: false);
    await offersProvider.loadOffers(refresh: true);
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
        title: const Text('العروض'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _downloadOffers,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchBar(
              controller: _searchController,
              hintText: 'ابحث في العروض...',
              onChanged: (value) {
                if (value.isEmpty) {
                  _loadOffers();
                } else {
                  _searchOffers(value);
                }
              },
              onClear: () {
                _searchController.clear();
                _loadOffers();
              },
            ),
          ),
          
          // Content
          Expanded(
            child: Consumer<OffersProvider>(
              builder: (context, offersProvider, child) {
                if (offersProvider.isLoading && offersProvider.offers.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (offersProvider.error != null && offersProvider.offers.isEmpty) {
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
                          offersProvider.error!,
                          style: const TextStyle(
                            fontSize: 16,
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        LoadingButton(
                          onPressed: _loadOffers,
                          isLoading: false,
                          text: 'إعادة المحاولة',
                          width: 200,
                        ),
                      ],
                    ),
                  );
                }

                if (offersProvider.offers.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.local_offer_outlined,
                          size: 64,
                          color: AppTheme.textLight,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'لا توجد عروض متاحة',
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
                  onRefresh: _loadOffers,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: offersProvider.offers.length + (offersProvider.hasMoreData ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == offersProvider.offers.length) {
                        return Padding(
                          padding: const EdgeInsets.all(16),
                          child: Center(
                            child: LoadingButton(
                              onPressed: offersProvider.loadMoreOffers,
                              isLoading: offersProvider.isLoading,
                              text: 'تحميل المزيد',
                              width: 200,
                            ),
                          ),
                        );
                      }

                      final offer = offersProvider.offers[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: OfferCard(offer: offer),
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

  Future<void> _searchOffers(String query) async {
    final offersProvider = Provider.of<OffersProvider>(context, listen: false);
    await offersProvider.searchOffers(query);
  }

  Future<void> _downloadOffers() async {
    // TODO: Implement download functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('جاري تحميل العروض...'),
      ),
    );
  }
}
