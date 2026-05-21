import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import '../../widgets/sae_skeleton.dart';
import '../../widgets/sae_tokens.dart';
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
    final tabs = const [
      (label: 'Escolher',     page: _QuizList()),
      (label: 'Resultados',   page: StudentResultsPage()),
      (label: 'Certificados', page: CertificatesPage()),
    ];
    return Column(
      children: [
        SaeChipRow(
          items: tabs.map((t) => t.label).toList(),
          active: tabs[_tab].label,
          onPick: (l) => setState(() {
            _tab = tabs.indexWhere((t) => t.label == l);
          }),
          dark: true,
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
    if (_loading) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          SaeSkeleton(height: 80, radius: 16),
          SizedBox(height: 16),
          SaeSkeletonCard(),
          SizedBox(height: 12),
          SaeSkeletonCard(),
        ],
      );
    }
    if (_error != null) {
      return SaeEmpty(
        icon: LucideIcons.wifiOff, title: _error!,
        action: OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
      );
    }

    final available = _items.where((q) => q.active).toList();
    final completed = _items.where((q) => q.bestScore != null).toList();

    int totalPts = 0;
    for (final q in _items) {
      if (q.bestScore != null) totalPts += q.bestScore!.toInt();
    }

    return RefreshIndicator(
      color: SaeColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 80),
        children: [
          // Streak banner
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [SaeColors.secondary, Color(0xFF1A3D5C)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -10, bottom: -20,
                  child: Opacity(opacity: 0.15,
                    child: Icon(LucideIcons.trophy, size: 120, color: Colors.white),
                  ),
                ),
                Row(children: [
                  Container(
                    width: 48, height: 48, alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: SaeColors.primary, borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(LucideIcons.trophy, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${completed.length} QUIZ${completed.length == 1 ? "" : "ZES"} CONCLUÍDO${completed.length == 1 ? "" : "S"}',
                          style: const TextStyle(
                            color: Color(0xFF7FE3B2),
                            fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1,
                          ),
                        ),
                        Text('$totalPts pontos acumulados',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17, fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ]),
              ],
            ),
          ),

          // Available
          if (available.isNotEmpty) ...[
            SaeSection(title: 'Disponíveis', action: '${available.length} activos'),
            ...available.map((q) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: _QuizCard(
                q: q,
                onStart: () async {
                  try {
                    final start = await _service.startAttempt(q.id);
                    if (!mounted) return;
                    await Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => QuizAttemptPage(
                        attemptId: start.attemptId, quiz: start.quiz,
                      ),
                    ));
                    _load();
                  } catch (_) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Falha ao iniciar o quiz.')),
                    );
                  }
                },
              ),
            )),
          ],

          // Completed
          if (completed.isNotEmpty) ...[
            const SaeSection(title: 'Resultados recentes'),
            ...completed.map((q) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: _ResultRow(q: q),
            )),
          ],

          if (_items.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: SaeEmpty(
                icon: LucideIcons.helpCircle,
                title: 'Sem quizzes disponíveis',
                subtitle: 'Volta mais tarde — novos quizzes aparecem aqui.',
              ),
            ),
        ],
      ),
    );
  }
}

/// ─── Cartão de quiz disponível ────────────────────────────────────────────
class _QuizCard extends StatelessWidget {
  final QuizSummary q;
  final VoidCallback onStart;
  const _QuizCard({required this.q, required this.onStart});

  @override
  Widget build(BuildContext context) {
    final style = Disciplines.of(q.disciplina ?? q.disciplinaLabel);
    return SaeCard(
      onTap: onStart,
      padding: const EdgeInsets.all(14),
      child: Stack(
        children: [
          // Coloured stripe at left
          Positioned.fill(
            left: 0,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(13),
              child: Row(children: [
                Container(width: 4, color: style.chipFg),
              ]),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                if (q.disciplina != null || q.disciplinaLabel != null)
                  SaePill(q.disciplinaLabel ?? q.disciplina!,
                      color: style.chipFg, bg: style.chipBg),
                if (q.myAttempts > 0) ...[
                  const SizedBox(width: 6),
                  SaePill.muted('${q.myAttempts} tentativa${q.myAttempts == 1 ? "" : "s"}'),
                ],
              ]),
              const SizedBox(height: 8),
              Text(q.titulo, style: const TextStyle(
                fontSize: 14.5, fontWeight: FontWeight.w800,
                color: SaeColors.textPrimary, height: 1.3,
              )),
              if (q.descricao != null && q.descricao!.isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(q.descricao!,
                  maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12, color: SaeColors.textSecondary, height: 1.4,
                  ),
                ),
              ],
              const SizedBox(height: 10),
              Row(children: [
                _meta(LucideIcons.helpCircle, '${q.questionCount} perguntas'),
                const SizedBox(width: 12),
                if (q.tempoLimiteMinutos != null)
                  _meta(LucideIcons.clock, '${q.tempoLimiteMinutos} min'),
                const Spacer(),
                const Text('Iniciar', style: TextStyle(
                  color: SaeColors.primary, fontWeight: FontWeight.w800, fontSize: 13,
                )),
                const SizedBox(width: 2),
                const Icon(LucideIcons.arrowRight, size: 14, color: SaeColors.primary),
              ]),
            ],
          ),
        ],
      ),
    );
  }

  Widget _meta(IconData icon, String t) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 12, color: SaeColors.textSecondary),
      const SizedBox(width: 4),
      Text(t, style: const TextStyle(
        fontSize: 11.5, color: SaeColors.textSecondary, fontWeight: FontWeight.w600,
      )),
    ],
  );
}

/// ─── Linha de resultado ───────────────────────────────────────────────────
class _ResultRow extends StatelessWidget {
  final QuizSummary q;
  const _ResultRow({required this.q});
  @override
  Widget build(BuildContext context) {
    final score = q.bestScore ?? 0;
    final color = score >= 85 ? SaeColors.primary
                : score >= 70 ? SaeColors.warn : SaeColors.error;
    final style = Disciplines.of(q.disciplina ?? q.disciplinaLabel);
    return SaeCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          // circular progress
          SizedBox(
            width: 50, height: 50,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 50, height: 50,
                  child: CircularProgressIndicator(
                    value: score / 100,
                    strokeWidth: 4,
                    backgroundColor: SaeColors.line,
                    valueColor: AlwaysStoppedAnimation(color),
                  ),
                ),
                Text('${score.toInt()}',
                  style: TextStyle(
                    fontSize: 13, color: color, fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (q.disciplinaLabel != null || q.disciplina != null)
                  SaePill(q.disciplinaLabel ?? q.disciplina!,
                      color: style.chipFg, bg: style.chipBg),
                const SizedBox(height: 4),
                Text(q.titulo,
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5, fontWeight: FontWeight.w800,
                  ),
                ),
                Text('${score.toInt()}/100 pontos',
                  style: const TextStyle(
                    fontSize: 11, color: SaeColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronRight, size: 14, color: SaeColors.textMuted),
        ],
      ),
    );
  }
}
