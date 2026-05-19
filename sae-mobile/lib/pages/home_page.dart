import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/neumorphic.dart';
import '../widgets/sae_drawer.dart';
import '../services/connectivity_service.dart';
import '../services/offline_service.dart';
import 'biblioteca/biblioteca_page.dart';
import 'biblioteca/offline_page.dart';
import 'chat_ia_page.dart';
import 'dashboard_page.dart';
import 'forum/forum_page.dart';
import 'profile_page.dart';
import 'quiz/professor_quiz_page.dart';
import 'quiz/student_quiz_page.dart';
import 'suggestions_page.dart';
import 'tarefas/professor_tasks_page.dart';
import 'tarefas/student_submissions_page.dart';
import 'tarefas/student_tasks_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _route = '';

  String _defaultRoute(AuthState auth) {
    if (auth.isGuestRole) return 'biblioteca';
    return 'dashboard';
  }

  String _titleFor(String key) {
    switch (key) {
      case 'dashboard': return 'Início';
      case 'biblioteca': return 'Biblioteca';
      case 'chat': return 'Chat IA';
      case 'offline': return 'Leitura Offline';
      case 'suggestions': return 'Sugestões de leitura';
      case 'quiz': return 'Quizzes';
      case 'forum': return 'Fórum';
      case 'tasks': return 'Tarefas';
      case 'submissions': return 'Entregas';
      case 'profile': return 'Perfil';
      default: return 'SAE';
    }
  }

  Widget _pageFor(String key, AuthState auth) {
    switch (key) {
      case 'dashboard':
        return DashboardPage(onShortcut: (k) => setState(() => _route = k));
      case 'biblioteca': return const BibliotecaPage();
      case 'chat': return const ChatIaPage();
      case 'offline': return const OfflinePage();
      case 'suggestions': return const SuggestionsPage();
      case 'quiz':
        return auth.isProfessor ? const ProfessorQuizPage() : const StudentQuizPage();
      case 'forum': return const ForumPage();
      case 'tasks':
        return auth.isProfessor ? const ProfessorTasksPage() : const StudentTasksPage();
      case 'submissions': return const StudentSubmissionsPage();
      case 'profile': return const ProfilePage();
      default: return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    if (_route.isEmpty) _route = _defaultRoute(auth);
    // Garante que rota actual está acessível a este role
    final allowed = SaeMenu.forRole(auth).map((e) => e.routeKey).toSet();
    if (!allowed.contains(_route) && _route != 'dashboard') {
      _route = _defaultRoute(auth);
    }

    return Scaffold(
      backgroundColor: SaeColors.bg,
      drawer: SaeDrawer(
        currentRouteKey: _route,
        onSelect: (k) => setState(() => _route = k),
      ),
      appBar: AppBar(
        title: Row(children: [
          Container(
            width: 34, height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: SaeColors.primary,
              borderRadius: BorderRadius.circular(10),
              boxShadow: Neu.outsetTight,
            ),
            child: const Icon(Icons.school, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          Text(_titleFor(_route)),
        ]),
        actions: const [_SyncIndicator(), SizedBox(width: 8)],
      ),
      body: _pageFor(_route, auth),
    );
  }
}

class _SyncIndicator extends StatelessWidget {
  const _SyncIndicator();
  @override
  Widget build(BuildContext context) {
    final conn = context.watch<ConnectivityService>();
    final offline = context.watch<OfflineService>();
    final isOnline = conn.isOnline;
    final pending = offline.pendingOutbox;
    final syncing = offline.isSyncing;
    final color = isOnline ? SaeColors.primary : SaeColors.error;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
      child: Tooltip(
        message: '${isOnline ? "Online" : "Offline"} · $pending pendentes',
        child: Material(
          color: Colors.transparent,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: isOnline && !syncing ? () => offline.sync() : null,
            child: Container(
              width: 36, height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  if (syncing)
                    const SizedBox(
                      width: 18, height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: SaeColors.primary),
                    )
                  else
                    Icon(isOnline ? Icons.cloud_done : Icons.cloud_off,
                        size: 18, color: color),
                  if (pending > 0)
                    Positioned(
                      right: -4, top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: SaeColors.error,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: SaeColors.bg, width: 1.5),
                        ),
                        child: Text(pending > 99 ? '99+' : '$pending',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w800)),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
