import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/assignment_service.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import '../../widgets/sae_skeleton.dart';
import '../file_viewer_page.dart';

/// Lista de submissões do aluno — visual com nota grande e feedback inline.
class StudentSubmissionsPage extends StatefulWidget {
  const StudentSubmissionsPage({super.key});
  @override
  State<StudentSubmissionsPage> createState() => _StudentSubmissionsPageState();
}

class _StudentSubmissionsPageState extends State<StudentSubmissionsPage> {
  final _service = AssignmentService();
  List<Submission> _items = [];
  bool _loading = true;
  String? _error;
  String _filter = 'Tudo';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _items = await _service.mySubmissions();
      _error = null;
    } catch (_) {
      _error = 'Não foi possível carregar as submissões.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Submission> get _filtered {
    switch (_filter) {
      case 'Avaliadas': return _items.where((s) => s.grade != null).toList();
      case 'Pendentes': return _items.where((s) => s.grade == null).toList();
      default: return _items;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          SaeSkeletonCard(),
          SizedBox(height: 12),
          SaeSkeletonCard(),
          SizedBox(height: 12),
          SaeSkeletonCard(),
        ],
      );
    }
    if (_error != null) {
      return SaeEmpty(
        icon: LucideIcons.wifiOff,
        title: _error!,
        action: OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
      );
    }
    if (_items.isEmpty) {
      return const SaeEmpty(
        icon: LucideIcons.uploadCloud,
        title: 'Ainda não submeteste nenhuma tarefa',
        subtitle: 'As tuas entregas aparecem aqui com a nota.',
      );
    }
    final list = _filtered;
    return RefreshIndicator(
      color: SaeColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 80),
        children: [
          const SizedBox(height: 8),
          SaeChipRow(
            items: const ['Tudo', 'Avaliadas', 'Pendentes'],
            active: _filter,
            onPick: (v) => setState(() => _filter = v),
            dark: true,
          ),
          const SizedBox(height: 4),
          ...list.map((s) => Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: _SubTile(s: s, viewerUrl: _service.submissionFileUrl(s.id)),
          )),
        ],
      ),
    );
  }
}

class _SubTile extends StatelessWidget {
  final Submission s;
  final String viewerUrl;
  const _SubTile({required this.s, required this.viewerUrl});

  @override
  Widget build(BuildContext context) {
    final graded = s.grade != null;
    String when = s.submittedAt;
    try {
      when = DateFormat('dd MMM · HH:mm').format(DateTime.parse(s.submittedAt).toLocal());
    } catch (_) {}

    return SaeCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SaePill('Tarefa #${s.assignmentId}', color: SaeColors.ink2, bg: SaeColors.line2),
              const SizedBox(width: 6),
              if (graded)
                SaePill.success('Avaliada', icon: LucideIcons.check)
              else
                SaePill.warn('A aguardar nota', icon: LucideIcons.clock),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.calendar, size: 12, color: SaeColors.textMuted),
                        const SizedBox(width: 5),
                        Text(when, style: const TextStyle(
                          fontSize: 12, color: SaeColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        )),
                      ],
                    ),
                    if (s.comment != null && s.comment!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(s.comment!, style: const TextStyle(
                        fontSize: 13, color: SaeColors.ink2, height: 1.4,
                      )),
                    ],
                  ],
                ),
              ),
              if (graded)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: SaeColors.primarySoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(s.grade!.toStringAsFixed(s.grade! % 1 == 0 ? 0 : 1),
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: SaeColors.primaryDark,
                          letterSpacing: -1,
                          height: 1,
                        ),
                      ),
                      const Text('pontos', style: TextStyle(
                        fontSize: 9.5, color: SaeColors.primaryDark,
                        fontWeight: FontWeight.w700, letterSpacing: 0.5,
                      )),
                    ],
                  ),
                ),
            ],
          ),
          if (s.fileOriginalName != null) ...[
            const SizedBox(height: 10),
            InkWell(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => FileViewerPage(url: viewerUrl,
                    title: s.fileOriginalName ?? 'Submissão'),
              )),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: SaeColors.bg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: SaeColors.line),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 28, height: 32,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: SaeColors.error,
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: const Text('PDF', style: TextStyle(
                        color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900,
                      )),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(s.fileOriginalName!,
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12.5, fontWeight: FontWeight.w700,
                          color: SaeColors.textPrimary,
                        ),
                      ),
                    ),
                    const Icon(LucideIcons.eye, size: 16, color: SaeColors.primary),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
