import 'package:flutter/material.dart';
import '../../services/assignment_service.dart';
import '../../theme.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/neumorphic.dart';
import '../file_viewer_page.dart';
import 'create_task_page.dart';

class ProfessorTasksPage extends StatefulWidget {
  const ProfessorTasksPage({super.key});
  @override
  State<ProfessorTasksPage> createState() => _ProfessorTasksPageState();
}

class _ProfessorTasksPageState extends State<ProfessorTasksPage> {
  final _service = AssignmentService();
  List<Assignment> _items = [];
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
      _items = await _service.listProfessor();
      _error = null;
    } catch (e) {
      _error = 'Não foi possível carregar as tarefas.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _items.isEmpty
                  ? const EmptyState(
                      icon: Icons.assignment_outlined,
                      title: 'Ainda não publicou tarefas',
                      subtitle: 'Toque em "Criar tarefa" para publicar a primeira.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(14, 14, 14, 100),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) {
                          final a = _items[i];
                          return NeuCard(
                            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => _SubmissionsPage(assignment: a),
                            )),
                            child: Row(children: [
                              Container(
                                width: 44, height: 44,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: SaeColors.primary.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.assignment_ind,
                                    color: SaeColors.primary),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(a.title,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w800)),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Turma ${a.classroomId} · prazo ${a.deadline}',
                                      style: const TextStyle(
                                          color: SaeColors.textSecondary,
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right,
                                  color: SaeColors.textSecondary),
                            ]),
                          );
                        },
                      ),
                    ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: SaeColors.primary,
        foregroundColor: Colors.white,
        onPressed: () async {
          final created = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const CreateTaskPage()),
          );
          if (created == true) _load();
        },
        icon: const Icon(Icons.add),
        label: const Text('Criar tarefa'),
      ),
    );
  }
}

class _SubmissionsPage extends StatefulWidget {
  final Assignment assignment;
  const _SubmissionsPage({required this.assignment});
  @override
  State<_SubmissionsPage> createState() => _SubmissionsPageState();
}

class _SubmissionsPageState extends State<_SubmissionsPage> {
  final _service = AssignmentService();
  List<Submission> _items = [];
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
      _items = await _service.listSubmissions(widget.assignment.id);
      _error = null;
    } catch (e) {
      _error = 'Não foi possível carregar as submissões.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _gradeDialog(Submission s) async {
    final ctrl = TextEditingController(text: s.grade?.toString() ?? '');
    final v = await showDialog<double>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Avaliar ${s.studentName ?? s.studentUsername}'),
        content: TextField(
          controller: ctrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Nota (0 - ${widget.assignment.maxScore.toStringAsFixed(0)})',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, double.tryParse(ctrl.text.replaceAll(',', '.'))),
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
    if (v == null) return;
    try {
      await _service.grade(s.id, v);
      _load();
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Falha ao avaliar.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.assignment.title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _items.isEmpty
                  ? const Center(child: Text('Sem submissões ainda.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(12),
                      itemCount: _items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final s = _items[i];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(s.studentName ?? s.studentUsername,
                                    style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text('Submetido em: ${s.submittedAt}',
                                    style: const TextStyle(
                                        color: SaeColors.textSecondary, fontSize: 12)),
                                if (s.comment != null && s.comment!.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(s.comment!),
                                ],
                                const SizedBox(height: 8),
                                Row(children: [
                                  if (s.grade != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: SaeColors.primary,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                          'Nota: ${s.grade}/${widget.assignment.maxScore.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 12)),
                                    ),
                                  const Spacer(),
                                  if (s.fileOriginalName != null)
                                    IconButton(
                                      onPressed: () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                              builder: (_) => FileViewerPage(
                                                    url: _service.submissionFileUrl(s.id),
                                                    title: s.fileOriginalName ?? 'Submissão',
                                                  ))),
                                      icon: const Icon(Icons.visibility),
                                      tooltip: 'Ver ficheiro',
                                    ),
                                  ElevatedButton.icon(
                                    onPressed: () => _gradeDialog(s),
                                    icon: const Icon(Icons.grade),
                                    label: Text(s.grade == null ? 'Avaliar' : 'Reavaliar'),
                                  ),
                                ]),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
