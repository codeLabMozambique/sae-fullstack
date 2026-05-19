import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class CertificatesPage extends StatefulWidget {
  const CertificatesPage({super.key});
  @override
  State<CertificatesPage> createState() => _CertificatesPageState();
}

class _CertificatesPageState extends State<CertificatesPage> {
  final _service = QuizService();
  List<Certificate> _items = [];
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
      _items = await _service.getMyCertificates();
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar certificados.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_items.isEmpty) return const Center(child: Text('Sem certificados ainda.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(14),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final c = _items[i];
          String when = c.issuedAt;
          try {
            when = DateFormat('dd/MM/yyyy').format(DateTime.parse(c.issuedAt).toLocal());
          } catch (_) {}
          return NeuCard(
            child: Row(children: [
              Container(
                width: 60, height: 60, alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: SaeColors.primary,
                  boxShadow: Neu.outsetTight,
                ),
                child: const Icon(Icons.workspace_premium,
                    color: Colors.white, size: 28),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(c.quizTitulo,
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(
                      '${c.disciplinaLabel ?? '-'} · ${c.score.toStringAsFixed(0)}% · $when',
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
