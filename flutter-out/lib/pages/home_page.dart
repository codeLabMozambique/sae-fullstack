import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/sae_components.dart';
import 'biblioteca/biblioteca_page.dart';
import 'forum/forum_page.dart';
import 'tarefas/student_tasks_page.dart';
import 'tarefas/student_submissions_page.dart';
import 'tarefas/professor_tasks_page.dart';
import 'quiz/student_quiz_page.dart';
import 'quiz/professor_quiz_page.dart';
import 'chat_ia_page.dart';
import 'profile_page.dart';

/// Tabs especificadas por role (espelha as do projecto original mas com
/// ícones Lucide e cabeçalho moderno).
class _Tab {
  final String label;
  final IconData icon;
  final String? subtitle;
  final Widget page;
  const _Tab(this.label, this.icon, this.page, [this.subtitle]);
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;

  List<_Tab> _tabsFor(AuthState auth) {
    if (auth.isProfessor) {
      return const [
        _Tab('Tarefas',    LucideIcons.clipboardList, ProfessorTasksPage(), 'Gestão e avaliação'),
        _Tab('Fórum',      LucideIcons.messageSquare,  ForumPage(),         'Perguntas e respostas'),
        _Tab('Quizzes',    LucideIcons.helpCircle,     ProfessorQuizPage(), 'Gerir e criar quizzes'),
        _Tab('Biblioteca', LucideIcons.library,        BibliotecaPage(),    'Repositório de conteúdos'),
      ];
    }
    if (auth.isGuestRole) {
      return const [
        _Tab('Biblioteca', LucideIcons.library,     BibliotecaPage(), 'Conteúdos públicos'),
        _Tab('Chat IA',    LucideIcons.sparkles,    ChatIaPage(),     'Assistente de estudo'),
      ];
    }
    // Aluno
    return const [
      _Tab('Tarefas',    LucideIcons.clipboardList,  StudentTasksPage(),       'Próximas entregas'),
      _Tab('Submissões', LucideIcons.uploadCloud,    StudentSubmissionsPage(), 'Histórico e notas'),
      _Tab('Fórum',      LucideIcons.messageSquare,  ForumPage(),              'Discussões da turma'),
      _Tab('Quizzes',    LucideIcons.helpCircle,     StudentQuizPage(),        'Os meus quizzes'),
      _Tab('Biblioteca', LucideIcons.library,        BibliotecaPage(),         'Biblioteca digital'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final tabs = _tabsFor(auth);
    if (_index >= tabs.length) _index = 0;
    final current = tabs[_index];

    final isStudent = auth.isStudent;
    final greeting = _greeting(auth);

    return Scaffold(
      backgroundColor: SaeColors.bg,
      appBar: SaeAppBar(
        title: _index == 0 && isStudent ? greeting : current.label,
        subtitle: current.subtitle,
        actions: [
          // Notificações (placeholder)
          if (!auth.isGuestRole)
            Stack(
              children: [
                IconButton(
                  icon: const Icon(LucideIcons.bell, size: 20),
                  color: SaeColors.ink2,
                  onPressed: () {},
                ),
                Positioned(
                  top: 10, right: 10,
                  child: Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle, color: SaeColors.error,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(width: 4),
          _UserMenu(auth: auth),
          const SizedBox(width: 4),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        transitionBuilder: (c, anim) => FadeTransition(
          opacity: anim,
          child: SlideTransition(
            position: Tween<Offset>(begin: const Offset(0, 0.012), end: Offset.zero).animate(anim),
            child: c,
          ),
        ),
        child: KeyedSubtree(
          key: ValueKey(_index),
          child: current.page,
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: tabs.map((t) => NavigationDestination(
          icon: Icon(t.icon),
          selectedIcon: Icon(t.icon, color: SaeColors.primary),
          label: t.label,
        )).toList(),
      ),
    );
  }

  String _greeting(AuthState auth) {
    final name = (auth.user?.fullName ?? '').split(' ').first;
    final h = DateTime.now().hour;
    final saud = h < 12 ? 'Bom dia' : h < 19 ? 'Boa tarde' : 'Boa noite';
    return name.isEmpty ? saud : '$saud, $name';
  }
}

class _UserMenu extends StatelessWidget {
  final AuthState auth;
  const _UserMenu({required this.auth});

  @override
  Widget build(BuildContext context) {
    final fullName = auth.user?.fullName ?? '—';
    final role = auth.user?.role ?? '';
    return PopupMenuButton<String>(
      tooltip: 'Conta',
      offset: const Offset(0, 50),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      icon: SaeAvatar(name: fullName, size: 32,
        color: auth.isProfessor ? SaeColors.primary : SaeColors.secondary,
      ),
      onSelected: (v) async {
        if (v == 'logout') {
          await context.read<AuthState>().logout();
        } else if (v == 'profile') {
          Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => const ProfilePage(),
          ));
        }
      },
      itemBuilder: (ctx) => [
        PopupMenuItem(
          enabled: false,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              SaeAvatar(name: fullName, size: 42,
                color: auth.isProfessor ? SaeColors.primary : SaeColors.secondary,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(fullName, style: const TextStyle(
                      color: SaeColors.textPrimary,
                      fontWeight: FontWeight.w800,
                    )),
                    const SizedBox(height: 2),
                    Text(role, style: const TextStyle(
                      color: SaeColors.textSecondary,
                      fontSize: 11.5, fontWeight: FontWeight.w600,
                    )),
                  ],
                ),
              ),
            ],
          ),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem(
          value: 'profile',
          child: Row(children: [
            Icon(LucideIcons.user, size: 16, color: SaeColors.ink2),
            SizedBox(width: 10),
            Text('Perfil'),
          ]),
        ),
        const PopupMenuItem(
          value: 'logout',
          child: Row(children: [
            Icon(LucideIcons.logOut, size: 16, color: SaeColors.error),
            SizedBox(width: 10),
            Text('Terminar sessão', style: TextStyle(color: SaeColors.error)),
          ]),
        ),
      ],
    );
  }
}
