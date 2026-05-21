import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../services/assignment_service.dart';
import '../../services/user_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import '../../widgets/sae_skeleton.dart';
import '../../widgets/sae_tokens.dart';
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
  String _filter = 'Todas';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final auth = context.read<AuthState>();
      final username = auth.user?.username ?? '';
      _classroomIds = await _userService.myStudentClassroomIds(username);
      if (_classroomIds.isEmpty) {
        setState(() {
          _items = [];
          _loading = false;
          _error = 'Ainda não estás atribuído a nenhuma turma.';
        });
        return;
      }
      _items = await _service.listStudent(_classroomIds);
    } catch (_) {
      _error = 'Não foi possível carregar as tarefas.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // estatísticas
  int get _pendentes => _items.where((a) =>
      a.mySubmission == null && _daysUntil(a.deadline) >= 0).length;
  int get _atrasadas => _items.where((a) =>
      a.mySubmission == null && _daysUntil(a.deadline) < 0).length;
  int get _concluidas => _items.where((a) => a.mySubmission != null).length;

  List<Assignment> get _filtered {
    if (_filter == 'Todas') return _items;
    if (_filter == 'Hoje') {
      return _items.where((a) => _daysUntil(a.deadline) == 0).toList();
    }
    if (_filter == 'Esta semana') {
      return _items.where((a) {
        final d = _daysUntil(a.deadline);
        return d >= 0 && d <= 7;
      }).toList();
    }
    if (_filter == 'Atrasadas') {
      return _items.where((a) =>
          a.mySubmission == null && _daysUntil(a.deadline) < 0).toList();
    }
    if (_filter == 'Concluídas') {
      return _items.where((a) => a.mySubmission != null).toList();
    }
    return _items;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const _Loading();
    if (_error != null && _items.isEmpty) {
      return SaeEmpty(
        icon: LucideIcons.userPlus,
        title: _error!,
        action: OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
      );
    }
    final list = _filtered;
    return RefreshIndicator(
      onRefresh: _load,
      color: SaeColors.primary,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 80),
        children: [
          // Stats
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                Expanded(child: SaeStatTile(
                  value: '$_pendentes', label: 'Pendentes',
                  icon: LucideIcons.clock,
                  color: SaeColors.error, bg: SaeColors.errorSoft,
                )),
                const SizedBox(width: 8),
                Expanded(child: SaeStatTile(
                  value: '$_atrasadas', label: 'Atrasadas',
                  icon: LucideIcons.alertTriangle,
                  color: const Color(0xFF92400E), bg: SaeColors.warnSoft,
                )),
                const SizedBox(width: 8),
                Expanded(child: SaeStatTile(
                  value: '$_concluidas', label: 'Submetidas',
                  icon: LucideIcons.check,
                  color: SaeColors.primaryDark, bg: SaeColors.primarySoft,
                )),
              ],
            ),
          ),
          const SaeSection(title: 'Próximas entregas'),
          SaeChipRow(
            items: const ['Todas', 'Hoje', 'Esta semana', 'Atrasadas', 'Concluídas'],
            active: _filter,
            onPick: (v) => setState(() => _filter = v),
            dark: true,
          ),
          if (list.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 40),
              child: SaeEmpty(
                icon: LucideIcons.checkCircle2,
                title: _filter == 'Todas'
                    ? 'Não tens tarefas pendentes'
                    : 'Sem tarefas neste filtro',
                subtitle: _filter == 'Todas' ? 'Continua o bom trabalho!' : null,
              ),
            )
          else
            ...List.generate(list.length, (i) {
              return Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: _AssignmentTile(
                  a: list[i],
                  onTap: () async {
                    await Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => SubmitTaskPage(
                        assignment: list[i],
                        classroomIds: _classroomIds,
                      ),
                    ));
                    _load();
                  },
                ),
              );
            }),
        ],
      ),
    );
  }
}

int _daysUntil(String iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    final dd = DateTime(d.year, d.month, d.day);
    return dd.difference(today).inDays;
  } catch (_) {
    return 999;
  }
}

class _AssignmentTile extends StatelessWidget {
  final Assignment a;
  final VoidCallback onTap;
  const _AssignmentTile({required this.a, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final days = _daysUntil(a.deadline);
    final discipline = _disciplineOf(a);
    final style = Disciplines.of(discipline);
    final submitted = a.mySubmission != null;
    final graded = a.mySubmission?.grade != null;
    final urgent = !submitted && days >= 0 && days <= 1;
    final late = !submitted && days < 0;

    String when;
    try {
      final d = DateTime.parse(a.deadline).toLocal();
      if (days == 0) {
        when = 'Hoje · ${DateFormat('HH:mm').format(d)}';
      } else if (days == 1) {
        when = 'Amanhã · ${DateFormat('HH:mm').format(d)}';
      } else if (days > 0 && days < 7) {
        when = DateFormat('EEEE · dd MMM').format(d);
      } else {
        when = DateFormat('dd MMM yyyy').format(d);
      }
    } catch (_) { when = a.deadline; }

    return SaeCard(
      onTap: onTap,
      padding: const EdgeInsets.all(12),
      borderColor: urgent ? SaeColors.error : SaeColors.line,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (urgent || late) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: late ? SaeColors.errorSoft : SaeColors.errorSoft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(late ? LucideIcons.alertOctagon : LucideIcons.clock,
                      size: 12, color: SaeColors.error),
                  const SizedBox(width: 5),
                  Text(late ? 'ENTREGA EM ATRASO' : 'ENTREGA ${days == 0 ? "HOJE" : "AMANHÃ"}',
                    style: const TextStyle(
                      color: SaeColors.error, fontSize: 10.5,
                      fontWeight: FontWeight.w800, letterSpacing: 0.7,
                    ),
                  ),
                ],
              ),
            ),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44, height: 44, alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: style.chipBg, borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(style.icon, color: style.chipFg, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      if (discipline != null) ...[
                        SaePill(discipline, color: style.chipFg, bg: style.chipBg),
                        const SizedBox(width: 6),
                      ],
                      if (graded)
                        SaePill.success('Nota ${a.mySubmission!.grade}/${a.maxScore.toStringAsFixed(0)}',
                            icon: LucideIcons.award)
                      else if (submitted)
                        SaePill.info('Submetido', icon: LucideIcons.check),
                    ]),
                    const SizedBox(height: 6),
                    Text(a.title,
                      maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: SaeColors.textPrimary,
                        height: 1.3,
                      ),
                    ),
                    if (a.createdByName != null) ...[
                      const SizedBox(height: 4),
                      Text('Prof. ${a.createdByName} · ${a.maxScore.toStringAsFixed(0)} pontos',
                        style: const TextStyle(
                            color: SaeColors.textSecondary, fontSize: 11.5),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(LucideIcons.calendar,
                            size: 12, color: SaeColors.textSecondary),
                        const SizedBox(width: 4),
                        Text('Entrega: $when',
                          style: const TextStyle(
                            color: SaeColors.ink2,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, size: 16, color: SaeColors.textMuted),
            ],
          ),
        ],
      ),
    );
  }

  String? _disciplineOf(Assignment a) {
    // No model existente Assignment não tem disciplina; tenta extrair via dynamic.
    try {
      // ignore: avoid_dynamic_calls
      return (a as dynamic).discipline as String?;
    } catch (_) { return null; }
  }
}

class _Loading extends StatelessWidget {
  const _Loading();
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Row(children: [
          Expanded(child: SaeSkeleton(height: 64, radius: 12)),
          SizedBox(width: 8),
          Expanded(child: SaeSkeleton(height: 64, radius: 12)),
          SizedBox(width: 8),
          Expanded(child: SaeSkeleton(height: 64, radius: 12)),
        ]),
        SizedBox(height: 18),
        SaeSkeletonCard(),
        SizedBox(height: 12),
        SaeSkeletonCard(),
        SizedBox(height: 12),
        SaeSkeletonCard(),
      ],
    );
  }
}
