import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/content_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class HistoricoPage extends StatefulWidget {
  const HistoricoPage({super.key});
  @override
  State<HistoricoPage> createState() => _HistoricoPageState();
}

class _HistoricoPageState extends State<HistoricoPage> {
  final _service = ContentService();
  List<ReadingHistory> _items = [];
  bool _loading = true;
  String? _error;
  String? _filter;
  List<String> _disciplines = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _items = await _service.getHistory(discipline: _filter);
      if (_disciplines.isEmpty) {
        try {
          _disciplines = await _service.listDisciplines();
        } catch (_) {}
      }
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar histórico.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_disciplines.isNotEmpty)
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                NeuChip(
                  label: 'Todas',
                  selected: _filter == null,
                  onTap: () { setState(() => _filter = null); _load(); },
                ),
                ..._disciplines.map((d) => NeuChip(
                      label: d,
                      selected: _filter == d,
                      onTap: () { setState(() => _filter = d); _load(); },
                    )),
              ],
            ),
          ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(child: Text(_error!))
                  : _items.isEmpty
                      ? const Center(child: Text('Sem registos de leitura.'))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(14),
                            itemCount: _items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (_, i) {
                              final h = _items[i];
                              String when = h.readAt;
                              try {
                                when = DateFormat('dd/MM/yyyy HH:mm')
                                    .format(DateTime.parse(h.readAt).toLocal());
                              } catch (_) {}
                              return NeuCard(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 12),
                                child: Row(children: [
                                  const Icon(Icons.history, color: SaeColors.primary),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(h.contentTitle ?? '—',
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w700)),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${h.pagesRead} págs  ·  ${(h.durationSeconds / 60).round()} min  ·  $when',
                                          style: const TextStyle(
                                              color: SaeColors.textSecondary,
                                              fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline,
                                        color: SaeColors.textSecondary),
                                    onPressed: () async {
                                      try {
                                        await _service.deleteHistory(h.id);
                                        _load();
                                      } catch (_) {}
                                    },
                                  ),
                                ]),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }
}
