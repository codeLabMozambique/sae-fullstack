import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme.dart';

class DrawerEntry {
  final String label;
  final IconData icon;
  final String routeKey;
  const DrawerEntry(this.label, this.icon, this.routeKey);
}

/// Espelha os menus do seed.sql (subset implementado em mobile).
class SaeMenu {
  /// GUEST → GST-001 (Biblioteca pública + Chat IA).
  static const guest = <DrawerEntry>[
    DrawerEntry('Biblioteca', Icons.menu_book, 'biblioteca'),
    DrawerEntry('Chat IA', Icons.smart_toy, 'chat'),
  ];

  /// STUDENT → STD-001/002/LIB/QUIZ/ASG.
  static const student = <DrawerEntry>[
    DrawerEntry('Início', Icons.home_outlined, 'dashboard'),
    DrawerEntry('Biblioteca', Icons.menu_book, 'biblioteca'),
    DrawerEntry('Leitura Offline', Icons.offline_pin, 'offline'),
    DrawerEntry('Sugestões de leitura', Icons.recommend, 'suggestions'),
    DrawerEntry('Quizzes', Icons.quiz, 'quiz'),
    DrawerEntry('Fórum', Icons.forum, 'forum'),
    DrawerEntry('Tarefas', Icons.assignment, 'tasks'),
    DrawerEntry('Histórico Entregas', Icons.upload_file, 'submissions'),
    DrawerEntry('Chat IA', Icons.smart_toy, 'chat'),
    DrawerEntry('Perfil', Icons.person, 'profile'),
  ];

  /// PROFESSOR → PRF-001/002/LIB/QUIZ/ASG.
  static const professor = <DrawerEntry>[
    DrawerEntry('Início', Icons.home_outlined, 'dashboard'),
    DrawerEntry('Biblioteca', Icons.menu_book, 'biblioteca'),
    DrawerEntry('Leitura Offline', Icons.offline_pin, 'offline'),
    DrawerEntry('Sugestões de leitura', Icons.recommend, 'suggestions'),
    DrawerEntry('Fórum', Icons.forum, 'forum'),
    DrawerEntry('Quizzes', Icons.quiz, 'quiz'),
    DrawerEntry('Tarefas', Icons.assignment, 'tasks'),
    DrawerEntry('Chat IA', Icons.smart_toy, 'chat'),
    DrawerEntry('Perfil', Icons.person, 'profile'),
  ];

  static List<DrawerEntry> forRole(AuthState auth) {
    if (auth.isGuestRole) return guest;
    if (auth.isProfessor) return professor;
    return student;
  }
}

class SaeDrawer extends StatelessWidget {
  final String currentRouteKey;
  final ValueChanged<String> onSelect;
  const SaeDrawer({super.key, required this.currentRouteKey, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final entries = SaeMenu.forRole(auth);
    return Drawer(
      backgroundColor: SaeColors.bg,
      child: SafeArea(
        child: Column(
          children: [
            _Header(auth: auth),
            const Divider(height: 1, color: Color(0x14000000)),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 10),
                children: entries.map((e) {
                  final selected = e.routeKey == currentRouteKey;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    child: Material(
                      color: selected
                          ? SaeColors.primary.withValues(alpha: 0.12)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () {
                          Navigator.of(context).pop();
                          onSelect(e.routeKey);
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          child: Row(children: [
                            Icon(e.icon,
                                color: selected
                                    ? SaeColors.primary
                                    : SaeColors.textSecondary,
                                size: 22),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                e.label,
                                style: TextStyle(
                                  fontWeight: selected
                                      ? FontWeight.w800
                                      : FontWeight.w600,
                                  color: selected
                                      ? SaeColors.primary
                                      : SaeColors.textPrimary,
                                ),
                              ),
                            ),
                            if (selected)
                              Container(
                                width: 6, height: 6,
                                decoration: const BoxDecoration(
                                  color: SaeColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ]),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const Divider(height: 1, color: Color(0x14000000)),
            ListTile(
              leading: const Icon(Icons.logout, color: SaeColors.error),
              title: Text(
                auth.isGuestRole ? 'Sair de visitante' : 'Terminar sessão',
                style: const TextStyle(
                    fontWeight: FontWeight.w700, color: SaeColors.error),
              ),
              onTap: () async {
                Navigator.of(context).pop();
                await context.read<AuthState>().logout();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final AuthState auth;
  const _Header({required this.auth});
  @override
  Widget build(BuildContext context) {
    final name = auth.user?.fullName ?? 'Visitante';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 18),
      color: SaeColors.primary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 48, height: 48,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.school, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 10),
            const Text('SAE',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5)),
          ]),
          const SizedBox(height: 14),
          Text(name,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 17)),
          const SizedBox(height: 2),
          Text(
            auth.isGuestRole
                ? 'Visitante'
                : auth.isProfessor
                    ? 'Professor'
                    : auth.isStudent
                        ? 'Aluno'
                        : auth.user?.role ?? '',
            style: const TextStyle(
                color: Colors.white70, fontWeight: FontWeight.w500, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
