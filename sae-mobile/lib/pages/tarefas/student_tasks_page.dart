import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/assignment_service.dart';
import '../../services/user_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import 'submit_task_page.dart';

class StudentTasksPage extends StatefulWidget {
  const StudentTasksPage({super.key});
  @override
  State<StudentTasksPage> createState() => _StudentTasksPageState();
}

class _StudentTasksPageState extends State<StudentTasksPage> {
  final _service = AssignmentService();
  final _userService = UserService();
  List<Assignment> _items = [];
  List<int> _classroomIds = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthState>();
      final username = auth.user?.username ?? '';
      _classroomIds = await _userService.myStudentClassroomIds(username);
      if (_classroomIds.isEmpty) {
        setState(() {
          _items = [];
          _loading = false;
          _error = 'Ainda não está atribuído a nenhuma turma.';
        });
        return;
      }
      _items = await _service.listStudent(_classroomIds);
    } catch (e) {
      _error = 'Não foi possível carregar as tarefas.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
          ],
        ),
      );
    }
    if (_items.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [SizedBox(height: 120), Center(child: Text('Sem tarefas para mostrar.'))],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) => _TaskTile(
          a: _items[i],
          onTap: () async {
            await Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => SubmitTaskPage(
                assignment: _items[i],
                classroomIds: _classroomIds,
              ),
            ));
            _load();
          },
        ),
      ),
    );
  }
}

class _TaskTile extends StatelessWidget {
  final Assignment a;
  final VoidCallback onTap;
  const _TaskTile({required this.a, required this.onTap});

  @override
  Widget build(BuildContext context) {
    String dl = a.deadline;
    try {
      dl = DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(a.deadline).toLocal());
    } catch (_) {}
    final submitted = a.mySubmission != null;
    final graded = a.mySubmission?.grade != null;
    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: SaeColors.primary.withValues(alpha: 0.12),
          child: const Icon(Icons.assignment, color: SaeColors.primary),
        ),
        title: Text(a.title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Prazo: $dl', style: const TextStyle(color: SaeColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 4),
              Row(children: [
                if (graded)
                  _badge('Avaliado: ${a.mySubmission!.grade}/${a.maxScore.toStringAsFixed(0)}',
                      SaeColors.primary)
                else if (submitted)
                  _badge('Submetido', Colors.blue)
                else
                  _badge('Pendente', Colors.orange),
              ]),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }

  Widget _badge(String text, Color c) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(20)),
        child: Text(text,
            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
      );
}
