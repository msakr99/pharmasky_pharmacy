import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/shortages_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/loading_button.dart';
import '../../widgets/shortage_card.dart';
import '../../widgets/search_bar.dart';

class ShortagesScreen extends StatefulWidget {
  const ShortagesScreen({super.key});

  @override
  State<ShortagesScreen> createState() => _ShortagesScreenState();
}

class _ShortagesScreenState extends State<ShortagesScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadShortages();
    });
  }

  Future<void> _loadShortages() async {
    final shortagesProvider = Provider.of<ShortagesProvider>(context, listen: false);
    await shortagesProvider.loadShortages();
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
        title: const Text('النواقص'),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchBar(
              controller: _searchController,
              hintText: 'ابحث في النواقص...',
              onChanged: (value) {
                if (value.isEmpty) {
                  _loadShortages();
                } else {
                  _searchShortages(value);
                }
              },
              onClear: () {
                _searchController.clear();
                _loadShortages();
              },
            ),
          ),
          
          // Content
          Expanded(
            child: Consumer<ShortagesProvider>(
              builder: (context, shortagesProvider, child) {
                if (shortagesProvider.isLoading && shortagesProvider.shortages.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (shortagesProvider.error != null && shortagesProvider.shortages.isEmpty) {
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
                          shortagesProvider.error!,
                          style: const TextStyle(
                            fontSize: 16,
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        LoadingButton(
                          onPressed: _loadShortages,
                          isLoading: false,
                          text: 'إعادة المحاولة',
                          width: 200,
                        ),
                      ],
                    ),
                  );
                }

                if (shortagesProvider.shortages.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.inventory_2_outlined,
                          size: 64,
                          color: AppTheme.textLight,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'لا توجد نواقص',
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
                  onRefresh: _loadShortages,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: shortagesProvider.shortages.length,
                    itemBuilder: (context, index) {
                      final shortage = shortagesProvider.shortages[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: ShortageCard(shortage: shortage),
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

  Future<void> _searchShortages(String query) async {
    final shortagesProvider = Provider.of<ShortagesProvider>(context, listen: false);
    await shortagesProvider.searchShortages(query);
  }
}
