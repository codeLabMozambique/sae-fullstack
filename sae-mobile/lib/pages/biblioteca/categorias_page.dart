import 'package:flutter/material.dart';
import '../../services/content_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class CategoriasPage extends StatefulWidget {
  const CategoriasPage({super.key});
  @override
  State<CategoriasPage> createState() => _CategoriasPageState();
}

class _CategoriasPageState extends State<CategoriasPage> {
  final _service = ContentService();
  List<Category> _cats = [];
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
      _cats = await _service.listCategoriesTree();
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar categorias.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_cats.isEmpty) return const Center(child: Text('Sem categorias.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(14),
        children: _cats.map(_buildCategory).toList(),
      ),
    );
  }

  Widget _buildCategory(Category c) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: NeuCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.folder, color: SaeColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    c.name,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                ),
                if (c.children.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: SaeColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('${c.children.length}',
                        style: const TextStyle(
                            color: SaeColors.primary, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
              ],
            ),
            if (c.description != null && c.description!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(c.description!,
                  style: const TextStyle(color: SaeColors.textSecondary, fontSize: 12)),
            ],
            if (c.children.isNotEmpty) ...[
              const SizedBox(height: 10),
              ...c.children.map((ch) => Padding(
                    padding: const EdgeInsets.only(left: 8, top: 6),
                    child: Row(children: [
                      const Icon(Icons.subdirectory_arrow_right,
                          size: 14, color: SaeColors.textSecondary),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(ch.name,
                            style: const TextStyle(
                                color: SaeColors.textPrimary, fontWeight: FontWeight.w600)),
                      ),
                    ]),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}
