import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/assignment_service.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import '../../widgets/sae_skeleton.dart';
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
    } catch (_) {
      _error = 'Não foi possível carregar as tarefas.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int get _toGrade => _items.fold<int>(0, (acc, a) {
    final s = a.submissionCount ?? 0;
    final g = a.gradedCount ?? 0;
    return acc + (s - g).clamp(0, 999).toInt();
  });
  int get _active => _items.length;
  int get _graded => _items.fold<int>(0, (acc, a) => acc + (a.gradedCount ?? 0));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      body: _build(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final created = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const CreateTaskPage()),
          );
          if (created == true) _load();
        },
        icon: const Icon(LucideIcons.plus),
        label: const Text('Nova tarefa'),
      ),
    );
  }

  Widget _build() {
    if (_loading) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          SaeSkeleton(height: 60, radius: 12),
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
    if (_items.isEmpty) {
      return const SaeEmpty(
        icon: LucideIcons.clipboardList,
        title: 'Ainda não publicaste tarefas',
        subtitle: 'Toca em "Nova tarefa" para publicar a primeira.',
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: SaeColors.primary,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 100),
        children: [
          // Stats
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                Expanded(child: SaeStatTile(
                  value: '$_toGrade', label: 'Por avaliar',
                  icon: LucideIcons.pencil,
                  color: SaeColors.error, bg: SaeColors.errorSoft,
                )),
                const SizedBox(width: 8),
                Expanded(child: SaeStatTile(
                  value: '$_active', label: 'Activas',
                  icon: LucideIcons.clock,
                  color: const Color(0xFF92400E), bg: SaeColors.warnSoft,
                )),
                const SizedBox(width: 8),
                Expanded(child: SaeStatTile(
                  value: '$_graded', label: 'Avaliadas',
                  icon: LucideIcons.check,
                  color: SaeColors.primaryDark, bg: SaeColors.primarySoft,
                )),
              ],
            ),
          ),
          const SaeSection(title: 'Tarefas activas'),
          ..._items.map((a) => Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: _ProfTile(
              a: a,
              onOpen: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => _SubmissionsPage(assignment: a),
              )).then((_) => _load()),
            ),
          )),
        ],
      ),
    );
  }
}

class _ProfTile extends StatelessWidget {
  final Assignment a;
  final VoidCallback onOpen;
  const _ProfTile({required this.a, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final subm = a.submissionCount ?? 0;
    final graded = a.gradedCount ?? 0;
    final toGrade = (subm - graded).clamp(0, 999).toInt();

    String when;
    try {
      final d = DateTime.parse(a.deadline).toLocal();
      when = DateFormat('dd MMM').format(d);
    } catch (_) { when = a.deadline; }

    final daysLeft = _days(a.deadline);
    final urgent = daysLeft <= 1 && daysLeft >= 0;

    return SaeCard(
      onTap: onOpen,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            SaePill('Turma ${a.classroomId}', color: SaeColors.primaryDark, bg: SaeColors.primarySoft),
            const SizedBox(width: 6),
            if (urgent)
              SaePill.danger('Entrega $when', icon: LucideIcons.clock)
            else
              SaePill.muted('Entrega $when'),
            const Spacer(),
            if (toGrade > 0)
              SaePill('$toGrade por avaliar',
                color: SaeColors.error, bg: SaeColors.errorSoft),
          ]),
          const SizedBox(height: 8),
          Text(a.title, style: const TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w800,
            color: SaeColors.textPrimary,
            height: 1.3,
          )),
          if (a.description != null && a.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(a.description!,
              maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12, color: SaeColors.textSecondary,
              ),
            ),
          ],
          const SizedBox(height: 10),
          // Progress
          Row(
            children: [
              const Text('Entregas',
                style: TextStyle(fontSize: 11, color: SaeColors.textSecondary)),
              const Spacer(),
              RichText(text: TextSpan(
                style: const TextStyle(fontSize: 11, color: SaeColors.textSecondary),
                children: [
                  TextSpan(text: '$subm',
                      style: const TextStyle(
                        color: SaeColors.textPrimary, fontWeight: FontWeight.w800,
                      )),
                  const TextSpan(text: ' submissões · '),
                  TextSpan(text: '$graded avaliadas',
                      style: const TextStyle(
                        color: SaeColors.primaryDark, fontWeight: FontWeight.w700,
                      )),
                ],
              )),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: subm == 0 ? 0 : graded / subm,
              minHeight: 5,
              backgroundColor: SaeColors.line2,
              valueColor: const AlwaysStoppedAnimation(SaeColors.primary),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onOpen,
                  icon: Icon(toGrade > 0 ? LucideIcons.pencil : LucideIcons.eye, size: 14),
                  label: Text(toGrade > 0 ? 'Avaliar ($toGrade)' : 'Ver entregas'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(0, 38),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    textStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 38),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  foregroundColor: SaeColors.ink2,
                  side: const BorderSide(color: SaeColors.line),
                  textStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                ),
                child: const Icon(LucideIcons.settings2, size: 14),
              ),
            ],
          ),
        ],
      ),
    );
  }

  int _days(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      final t = DateTime.now();
      return DateTime(d.year, d.month, d.day)
          .difference(DateTime(t.year, t.month, t.day))
          .inDays;
    } catch (_) { return 999; }
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// Página de submissões (avaliar)
/// ───────────────────────────────────────────────────────────────────────────
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _items = await _service.listSubmissions(widget.assignment.id); }
    catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _gradeDialog(Submission s) async {
    final ctrl = TextEditingController(text: s.grade?.toString() ?? '');
    final v = await showDialog<double>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text('Avaliar ${s.studentName ?? s.studentUsername}',
            style: const TextStyle(fontWeight: FontWeight.w800)),
        content: TextField(
          controller: ctrl, autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Nota (0 - ${widget.assignment.maxScore.toStringAsFixed(0)})',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(
                context, double.tryParse(ctrl.text.replaceAll(',', '.'))),
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
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Falha ao avaliar.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      appBar: AppBar(
        title: Text(widget.assignment.title,
          maxLines: 1, overflow: TextOverflow.ellipsis,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const SaeEmpty(
                  icon: LucideIcons.inbox,
                  title: 'Sem submissões ainda',
                  subtitle: 'Os alunos ainda não entregaram esta tarefa.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(14),
                  itemCount: _items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final s = _items[i];
                    final graded = s.grade != null;
                    return SaeCard(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            SaeAvatar(name: s.studentName ?? s.studentUsername,
                                color: SaeColors.secondary, size: 36),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(s.studentName ?? s.studentUsername,
                                    style: const TextStyle(
                                      fontSize: 14, fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  Text('Submetido: ${s.submittedAt}',
                                    style: const TextStyle(
                                      color: SaeColors.textSecondary, fontSize: 11.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (graded)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: SaeColors.primary,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  '${s.grade}/${widget.assignment.maxScore.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12.5, fontWeight: FontWeight.w800,
                                  ),
                                ),
                              )
                            else
                              SaePill.warn('Pendente'),
                          ]),
                          if (s.comment != null && s.comment!.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: SaeColors.bg,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(s.comment!,
                                style: const TextStyle(fontSize: 12.5, height: 1.4)),
                            ),
                          ],
                          const SizedBox(height: 10),
                          Row(children: [
                            if (s.fileOriginalName != null)
                              OutlinedButton.icon(
                                onPressed: () => Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => FileViewerPage(
                                          url: _service.submissionFileUrl(s.id),
                                          title: s.fileOriginalName ?? 'Submissão',
                                        ))),
                                icon: const Icon(LucideIcons.eye, size: 14),
                                label: const Text('Ver ficheiro'),
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(0, 36),
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                  foregroundColor: SaeColors.ink2,
                                  side: const BorderSide(color: SaeColors.line),
                                ),
                              ),
                            const Spacer(),
                            ElevatedButton.icon(
                              onPressed: () => _gradeDialog(s),
                              icon: Icon(graded ? LucideIcons.refreshCw : LucideIcons.award, size: 14),
                              label: Text(graded ? 'Reavaliar' : 'Avaliar'),
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size(0, 36),
                                padding: const EdgeInsets.symmetric(horizontal: 14),
                                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ]),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
