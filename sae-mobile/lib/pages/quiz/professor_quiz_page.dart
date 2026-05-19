import 'package:flutter/material.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';
import 'create_quiz_page.dart';

class ProfessorQuizPage extends StatefulWidget {
  const ProfessorQuizPage({super.key});
  @override
  State<ProfessorQuizPage> createState() => _ProfessorQuizPageState();
}

class _ProfessorQuizPageState extends State<ProfessorQuizPage> {
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
      _items = await _service.listQuizzes();
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(child: Text(_error!))
                  : _items.isEmpty
                      ? const Center(child: Text('Sem quizzes criados.'))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(14, 14, 14, 90),
                            itemCount: _items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (_, i) {
                              final q = _items[i];
                              return NeuCard(
                                child: Row(children: [
                                  Container(
                                    width: 48, height: 48, alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: q.active
                                          ? SaeColors.primary.withValues(alpha: 0.12)
                                          : const Color(0x22000000),
                                    ),
                                    child: Icon(Icons.quiz,
                                        color: q.active
                                            ? SaeColors.primary
                                            : SaeColors.textSecondary),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(q.titulo,
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w800)),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${q.disciplinaLabel ?? q.disciplina ?? '-'} · ${q.questionCount} q',
                                          style: const TextStyle(
                                              color: SaeColors.textSecondary,
                                              fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  PopupMenuButton<String>(
                                    icon: const Icon(Icons.more_vert),
                                    onSelected: (v) async {
                                      try {
                                        if (v == 'toggle') {
                                          await _service.toggleActive(q.id);
                                        } else if (v == 'delete') {
                                          await _service.deleteQuiz(q.id);
                                        }
                                        _load();
                                      } catch (_) {}
                                    },
                                    itemBuilder: (_) => [
                                      PopupMenuItem(
                                        value: 'toggle',
                                        child: Text(q.active
                                            ? 'Desactivar'
                                            : 'Activar'),
                                      ),
                                      const PopupMenuItem(
                                          value: 'delete',
                                          child: Text('Apagar')),
                                    ],
                                  ),
                                ]),
                              );
                            },
                          ),
                        ),
        ),
        Positioned(
          right: 16, bottom: 16,
          child: FloatingActionButton.extended(
            backgroundColor: SaeColors.primary,
            foregroundColor: Colors.white,
            onPressed: () async {
              final created = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const CreateQuizPage()),
              );
              if (created == true) _load();
            },
            icon: const Icon(Icons.add),
            label: const Text('Criar quiz'),
          ),
        ),
      ],
    );
  }
}
