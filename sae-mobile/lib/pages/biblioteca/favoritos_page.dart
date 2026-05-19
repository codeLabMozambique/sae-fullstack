import 'package:flutter/material.dart';
import '../../services/content_service.dart';
import 'biblioteca_page.dart' show BookCard;

class FavoritosPage extends StatefulWidget {
  const FavoritosPage({super.key});
  @override
  State<FavoritosPage> createState() => _FavoritosPageState();
}

class _FavoritosPageState extends State<FavoritosPage> {
  final _service = ContentService();
  List<Content> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _items = await _service.listFavorites();
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar favoritos.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_items.isEmpty) {
      return const Center(child: Text('Ainda não tem favoritos.'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: GridView.builder(
        padding: const EdgeInsets.all(14),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 190,
          childAspectRatio: 0.66,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: _items.length,
        itemBuilder: (_, i) => BookCard(content: _items[i]),
      ),
    );
  }
}
