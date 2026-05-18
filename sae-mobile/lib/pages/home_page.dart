import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import 'biblioteca/biblioteca_page.dart';
import 'forum/forum_page.dart';
import 'tarefas/student_tasks_page.dart';
import 'tarefas/student_submissions_page.dart';
import 'tarefas/professor_tasks_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final isProf = auth.isProfessor;

    final tabs = isProf
        ? <_TabSpec>[
            _TabSpec('Tarefas', Icons.assignment_outlined, const ProfessorTasksPage()),
            _TabSpec('Fórum', Icons.forum_outlined, const ForumPage()),
            _TabSpec('Biblioteca', Icons.menu_book_outlined, const BibliotecaPage()),
          ]
        : <_TabSpec>[
            _TabSpec('Tarefas', Icons.assignment_outlined, const StudentTasksPage()),
            _TabSpec('Submissões', Icons.upload_file_outlined, const StudentSubmissionsPage()),
            _TabSpec('Fórum', Icons.forum_outlined, const ForumPage()),
            _TabSpec('Biblioteca', Icons.menu_book_outlined, const BibliotecaPage()),
          ];

    final current = tabs[_index];

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: SaeColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('S',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 10),
            Text(current.label),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const CircleAvatar(
              radius: 16,
              backgroundColor: SaeColors.secondary,
              child: Icon(Icons.person, color: Colors.white, size: 18),
            ),
            onSelected: (v) async {
              if (v == 'logout') {
                await context.read<AuthState>().logout();
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(auth.user?.fullName ?? '-',
                        style: const TextStyle(fontWeight: FontWeight.w700, color: SaeColors.textPrimary)),
                    Text(auth.user?.role ?? '',
                        style: const TextStyle(color: SaeColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(value: 'logout', child: Text('Terminar sessão')),
            ],
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: tabs.map((t) => t.page).toList(),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: tabs
            .map((t) => NavigationDestination(icon: Icon(t.icon), label: t.label))
            .toList(),
      ),
    );
  }
}

class _TabSpec {
  final String label;
  final IconData icon;
  final Widget page;
  _TabSpec(this.label, this.icon, this.page);
}
