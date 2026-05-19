import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/assignment_service.dart';
import '../services/content_service.dart';
import '../services/offline_service.dart';
import '../services/quiz_service.dart';
import '../services/suggestion_service.dart';
import '../services/user_service.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/empty_state.dart';
import '../widgets/neumorphic.dart';
import 'biblioteca/leitor_page.dart';

class DashboardPage extends StatefulWidget {
  final void Function(String routeKey) onShortcut;
  const DashboardPage({super.key, required this.onShortcut});
  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final _content = ContentService();
  final _assignmentService = AssignmentService();
  final _quizService = QuizService();
  final _suggestionService = SuggestionService();
  final _userService = UserService();

  List<ReadingProgress> _progress = [];
  List<Assignment> _assignments = [];
  List<QuizSummary> _quizzes = [];
  List<ReadingSuggestion> _suggestions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final auth = context.read<AuthState>();
    final isProf = auth.isProfessor;
    final username = auth.user?.username ?? '';

    try {
      _progress = await _content.listProgress();
    } catch (_) {
      _progress = [];
    }

    if (isProf) {
      try {
        _assignments = await _assignmentService.listProfessor();
      } catch (_) {
        _assignments = [];
      }
      try {
        _suggestions = await _suggestionService.listMine();
      } catch (_) {
        _suggestions = [];
      }
    } else {
      final ids = await _userService.myStudentClassroomIds(username);
      if (ids.isNotEmpty) {
        try {
          _assignments = await _assignmentService.listStudent(ids);
        } catch (_) {
          _assignments = [];
        }
        try {
          _suggestions = await _suggestionService.listForStudent(ids);
        } catch (_) {
          _suggestions = [];
        }
      }
      try {
        _quizzes = await _quizService.listQuizzes();
      } catch (_) {
        _quizzes = [];
      }
    }

    if (mounted) setState(() => _loading = false);
  }

  int get _pendingTasks {
    if (context.read<AuthState>().isProfessor) {
      return _assignments.where((a) => (a.submissionCount ?? 0) > (a.gradedCount ?? 0)).length;
    }
    return _assignments.where((a) => a.mySubmission == null).length;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final offline = context.watch<OfflineService>();
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(14, 6, 14, 28),
        children: [
          _HeroCard(auth: auth, pendingTasks: _pendingTasks),
          const SizedBox(height: 14),
          _statsRow(auth, offline),
          const SizedBox(height: 18),
          _sectionHeader('Continuar a ler', 'biblioteca'),
          const SizedBox(height: 8),
          _progressCarousel(),
          const SizedBox(height: 18),
          _sectionHeader('Sugestões de leitura', 'suggestions'),
          const SizedBox(height: 8),
          _suggestionsList(),
          const SizedBox(height: 18),
          _sectionHeader('Atalhos', null),
          const SizedBox(height: 8),
          _quickActions(auth),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, String? routeKey) {
    return Row(children: [
      Text(title,
          style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 15,
              color: SaeColors.textPrimary)),
      const Spacer(),
      if (routeKey != null)
        TextButton(
          onPressed: () => widget.onShortcut(routeKey),
          style: TextButton.styleFrom(
            foregroundColor: SaeColors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            visualDensity: VisualDensity.compact,
          ),
          child: const Row(mainAxisSize: MainAxisSize.min, children: [
            Text('Ver todos', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            Icon(Icons.chevron_right, size: 16),
          ]),
        ),
    ]);
  }

  Widget _statsRow(AuthState auth, OfflineService offline) {
    final isProf = auth.isProfessor;
    final stats = isProf
        ? [
            (_StatData(Icons.assignment_late, 'Por corrigir', '$_pendingTasks', SaeColors.primary)),
            (_StatData(Icons.recommend, 'Sugestões', '${_suggestions.length}', const Color(0xFFFFA000))),
            (_StatData(Icons.offline_pin, 'Offline', '${offline.downloadedCount}', const Color(0xFF1976D2))),
            (_StatData(Icons.sync, 'Em fila', '${offline.pendingOutbox}',
                offline.pendingOutbox == 0 ? const Color(0xFF4CAF50) : const Color(0xFFEF5350))),
          ]
        : [
            (_StatData(Icons.assignment, 'Tarefas', '$_pendingTasks', SaeColors.primary)),
            (_StatData(Icons.quiz, 'Quizzes', '${_quizzes.length}', const Color(0xFFFFA000))),
            (_StatData(Icons.offline_pin, 'Offline', '${offline.downloadedCount}', const Color(0xFF1976D2))),
            (_StatData(Icons.sync, 'Sync', offline.pendingOutbox == 0 ? 'OK' : '${offline.pendingOutbox}',
                offline.pendingOutbox == 0 ? const Color(0xFF4CAF50) : const Color(0xFFEF5350))),
          ];

    return SizedBox(
      height: 118,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: stats.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final s = stats[i];
          return SizedBox(
            width: 124,
            child: NeuCard(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 32, height: 32,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: s.color.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(s.icon, color: s.color, size: 18),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        s.value,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 20,
                            height: 1.1,
                            color: SaeColors.textPrimary,
                            letterSpacing: -0.5),
                      ),
                      Text(
                        s.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: SaeColors.textSecondary,
                            height: 1.1,
                            fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _progressCarousel() {
    if (_loading) {
      return const SizedBox(height: 130, child: SkeletonList(count: 2));
    }
    if (_progress.isEmpty) {
      return NeuCard(
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          const Icon(Icons.bookmark_outline, color: SaeColors.textSecondary),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Sem leituras em andamento.',
              style: TextStyle(color: SaeColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => widget.onShortcut('biblioteca'),
            child: const Text('Explorar'),
          ),
        ]),
      );
    }
    return SizedBox(
      height: 140,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _progress.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final p = _progress[i];
          final thumb = _content.absoluteUrl(p.thumbnailUrl);
          final pct = ((p.percentageComplete ?? 0).clamp(0, 100)).toDouble();
          return SizedBox(
            width: 250,
            child: NeuCard(
              padding: const EdgeInsets.all(10),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => LeitorPage(
                  content: Content(
                    id: p.contentId, title: p.contentTitle, thumbnailUrl: p.thumbnailUrl),
                  initialPage: p.currentPage,
                ),
              )),
              child: Row(children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    width: 60, height: 84,
                    child: thumb == null
                        ? Container(
                            color: const Color(0xFFE6ECEA),
                            alignment: Alignment.center,
                            child: const Icon(Icons.menu_book, color: SaeColors.primary),
                          )
                        : CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.contentTitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 13)),
                      const SizedBox(height: 4),
                      Text(
                        'Pág. ${p.currentPage ?? '-'} / ${p.totalPages ?? '-'}',
                        style: const TextStyle(
                            color: SaeColors.textSecondary, fontSize: 11),
                      ),
                      const Spacer(),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: pct / 100,
                          minHeight: 6,
                          backgroundColor: const Color(0xFFE0E6E4),
                          valueColor: const AlwaysStoppedAnimation(SaeColors.primary),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text('${pct.toStringAsFixed(0)}% lido',
                          style: const TextStyle(
                              color: SaeColors.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }

  Widget _suggestionsList() {
    if (_loading) {
      return const SizedBox(height: 86, child: SkeletonList(count: 2));
    }
    if (_suggestions.isEmpty) {
      return NeuCard(
        padding: const EdgeInsets.all(14),
        child: Row(children: const [
          Icon(Icons.recommend, color: SaeColors.textSecondary),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Sem sugestões neste momento.',
              style: TextStyle(color: SaeColors.textSecondary),
            ),
          ),
        ]),
      );
    }
    final items = _suggestions.take(3).toList();
    return Column(
      children: items.map((s) {
        final thumb = _content.absoluteUrl(s.contentThumbnailUrl);
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: NeuCard(
            padding: const EdgeInsets.all(10),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => LeitorPage(
                content: Content(
                  id: s.contentId,
                  title: s.contentTitle,
                  thumbnailUrl: s.contentThumbnailUrl,
                ),
                initialPage: s.startPage,
              ),
            )),
            child: Row(children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 44, height: 60,
                  child: thumb == null
                      ? Container(
                          color: const Color(0xFFE6ECEA),
                          alignment: Alignment.center,
                          child: const Icon(Icons.menu_book, color: SaeColors.primary, size: 18),
                        )
                      : CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.contentTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (s.startPage != null && s.endPage != null)
                          'pp. ${s.startPage}-${s.endPage}',
                        s.professorName ?? s.professorUsername,
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: SaeColors.textSecondary, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: SaeColors.textSecondary),
            ]),
          ),
        );
      }).toList(),
    );
  }

  Widget _quickActions(AuthState auth) {
    final isProf = auth.isProfessor;
    final actions = <_ActionData>[
      _ActionData('Biblioteca', Icons.menu_book, 'biblioteca'),
      _ActionData(isProf ? 'Tarefas' : 'Minhas tarefas', Icons.assignment, 'tasks'),
      _ActionData('Quizzes', Icons.quiz, 'quiz'),
      _ActionData('Fórum', Icons.forum, 'forum'),
      _ActionData('Sugestões', Icons.recommend, 'suggestions'),
      _ActionData('Offline', Icons.offline_pin, 'offline'),
      if (!isProf) _ActionData('Entregas', Icons.upload_file, 'submissions'),
      _ActionData('Perfil', Icons.person, 'profile'),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: actions.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.92,
      ),
      itemBuilder: (_, i) {
        final a = actions[i];
        return NeuCard(
          padding: const EdgeInsets.all(10),
          onTap: () => widget.onShortcut(a.route),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 38, height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: SaeColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(a.icon, color: SaeColors.primary, size: 20),
              ),
              const SizedBox(height: 8),
              Text(a.label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      color: SaeColors.textPrimary)),
            ],
          ),
        );
      },
    );
  }
}

class _HeroCard extends StatelessWidget {
  final AuthState auth;
  final int pendingTasks;
  const _HeroCard({required this.auth, required this.pendingTasks});

  String _initials(String n) {
    final p = n.trim().split(RegExp(r'\s+'));
    if (p.isEmpty || p[0].isEmpty) return '?';
    return (p.first[0] + (p.length > 1 ? p.last[0] : '')).toUpperCase();
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  @override
  Widget build(BuildContext context) {
    final name = auth.user?.fullName ?? '';
    final firstName = name.split(' ').first;
    final pendingLabel = pendingTasks == 0
        ? 'Nada pendente ✨'
        : pendingTasks == 1
            ? '1 tarefa por entregar'
            : '$pendingTasks tarefas por entregar';

    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0E5C36), Color(0xFF00A651), Color(0xFF1FCB87)],
          ),
        ),
        child: Stack(
          children: [
            // Decoração
            Positioned(
              top: -30, right: -30,
              child: Container(
                width: 140, height: 140,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              bottom: -40, right: 40,
              child: Container(
                width: 100, height: 100,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.07),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
              child: Row(children: [
                Container(
                  width: 52, height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(_initials(name),
                      style: const TextStyle(
                          color: SaeColors.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 20)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('$_greeting,',
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 12)),
                      Text(firstName.isEmpty ? 'Bem-vindo' : firstName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 22,
                              letterSpacing: -0.5)),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.bolt, color: Colors.white, size: 12),
                          const SizedBox(width: 4),
                          Text(pendingLabel,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11)),
                        ]),
                      ),
                    ],
                  ),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatData {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  _StatData(this.icon, this.label, this.value, this.color);
}

class _ActionData {
  final String label;
  final IconData icon;
  final String route;
  _ActionData(this.label, this.icon, this.route);
}
