import 'package:flutter/material.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';
import 'quiz_attempt_page.dart';
import 'student_results_page.dart';
import 'certificates_page.dart';

class StudentQuizPage extends StatefulWidget {
  const StudentQuizPage({super.key});
  @override
  State<StudentQuizPage> createState() => _StudentQuizPageState();
}

class _StudentQuizPageState extends State<StudentQuizPage> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = <({String label, IconData icon, Widget page})>[
      (label: 'Escolher', icon: Icons.quiz, page: const _QuizList()),
      (label: 'Resultados', icon: Icons.bar_chart, page: const StudentResultsPage()),
      (label: 'Certificados', icon: Icons.workspace_premium, page: const CertificatesPage()),
    ];
    return Column(
      children: [
        SizedBox(
          height: 56,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            itemCount: tabs.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.only(right: 4),
              child: NeuChip(
                label: tabs[i].label,
                selected: i == _tab,
                onTap: () => setState(() => _tab = i),
              ),
            ),
          ),
        ),
        Expanded(child: tabs[_tab].page),
      ],
    );
  }
}

class _QuizList extends StatefulWidget {
  const _QuizList();
  @override
  State<_QuizList> createState() => _QuizListState();
}

class _QuizListState extends State<_QuizList> {
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
      _error = 'Não foi possível carregar os quizzes.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_items.isEmpty) return const Center(child: Text('Sem quizzes disponíveis.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(14),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final q = _items[i];
          return NeuCard(
            onTap: () async {
              try {
                final start = await _service.startAttempt(q.id);
                if (!mounted) return;
                await Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => QuizAttemptPage(
                    attemptId: start.attemptId,
                    quiz: start.quiz,
                  ),
                ));
                _load();
              } catch (_) {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Falha ao iniciar o quiz.')));
              }
            },
            child: Row(children: [
              Container(
                width: 48, height: 48, alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: SaeColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.quiz, color: SaeColors.primary),
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
                      [
                        q.disciplinaLabel ?? q.disciplina ?? '-',
                        '${q.questionCount} q',
                        if (q.tempoLimiteMinutos != null) '${q.tempoLimiteMinutos} min',
                      ].join(' · '),
                      style: const TextStyle(
                          color: SaeColors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (q.bestScore != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: SaeColors.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${q.bestScore!.toStringAsFixed(0)}%',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 12),
                  ),
                ),
            ]),
          );
        },
      ),
    );
  }
}
