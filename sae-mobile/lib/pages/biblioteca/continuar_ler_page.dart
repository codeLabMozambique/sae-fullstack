import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../services/content_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';
import 'leitor_page.dart';

class ContinuarLerPage extends StatefulWidget {
  const ContinuarLerPage({super.key});
  @override
  State<ContinuarLerPage> createState() => _ContinuarLerPageState();
}

class _ContinuarLerPageState extends State<ContinuarLerPage> {
  final _service = ContentService();
  List<ReadingProgress> _items = [];
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
      _items = await _service.listProgress();
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar progresso.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_items.isEmpty) return const Center(child: Text('Sem leituras em andamento.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(14),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final p = _items[i];
          final thumb = _service.absoluteUrl(p.thumbnailUrl);
          final pct = (p.percentageComplete ?? 0).clamp(0, 100).toDouble();
          return NeuCard(
            padding: const EdgeInsets.all(12),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => LeitorPage(
                content: Content(id: p.contentId, title: p.contentTitle, thumbnailUrl: p.thumbnailUrl),
              ),
            )),
            child: Row(children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 58, height: 80,
                  child: thumb == null
                      ? Container(
                          color: const Color(0xFFE6ECEA),
                          child: const Icon(Icons.menu_book, color: SaeColors.primary))
                      : CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.contentTitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      'Pág. ${p.currentPage ?? '-'}/${p.totalPages ?? '-'}  ·  ${pct.toStringAsFixed(0)}%',
                      style: const TextStyle(color: SaeColors.textSecondary, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: pct / 100,
                        backgroundColor: const Color(0xFFE0E6E4),
                        valueColor: const AlwaysStoppedAnimation(SaeColors.primary),
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),
            ]),
          );
        },
      ),
    );
  }
}
