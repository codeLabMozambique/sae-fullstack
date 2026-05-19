import 'package:flutter/material.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class StudentResultsPage extends StatefulWidget {
  const StudentResultsPage({super.key});
  @override
  State<StudentResultsPage> createState() => _StudentResultsPageState();
}

class _StudentResultsPageState extends State<StudentResultsPage> {
  final _service = QuizService();
  List<QuizSummary> _items = [];
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
      _items = await _service.getMyAttempts();
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar os resultados.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_items.isEmpty) return const Center(child: Text('Ainda sem tentativas.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(14),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final q = _items[i];
          final best = q.bestScore ?? 0;
          return NeuCard(
            child: Row(children: [
              Container(
                width: 56, height: 56, alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: best >= 50 ? SaeColors.primary : Colors.orange,
                  boxShadow: Neu.outsetTight,
                ),
                child: Text('${best.toStringAsFixed(0)}%',
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(q.titulo,
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(
                      '${q.disciplinaLabel ?? q.disciplina ?? '-'} · ${q.myAttempts} tentativas',
                      style: const TextStyle(
                          color: SaeColors.textSecondary, fontSize: 12),
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
