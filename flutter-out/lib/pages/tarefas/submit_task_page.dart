import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/assignment_service.dart';
import '../../services/connectivity_service.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import '../file_viewer_page.dart';

class SubmitTaskPage extends StatefulWidget {
  final Assignment assignment;
  final List<int> classroomIds;
  const SubmitTaskPage({
    super.key,
    required this.assignment,
    required this.classroomIds,
  });

  @override
  State<SubmitTaskPage> createState() => _SubmitTaskPageState();
}

class _SubmitTaskPageState extends State<SubmitTaskPage> {
  final _service = AssignmentService();
  final _comment = TextEditingController();
  PlatformFile? _file;
  bool _saving = false;

  Future<void> _pick() async {
    final res = await FilePicker.platform.pickFiles();
    if (res != null && res.files.isNotEmpty) {
      setState(() => _file = res.files.first);
    }
  }

  Future<void> _submit() async {
    if (!ConnectivityService.instance.isOnline) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Sem ligação. Submeter trabalhos requer Internet.'),
      ));
      return;
    }
    setState(() => _saving = true);
    try {
      await _service.submit(
        assignmentId: widget.assignment.id,
        classroomIds: widget.classroomIds,
        comment: _comment.text.trim().isEmpty ? null : _comment.text.trim(),
        filePath: _file?.path,
        fileName: _file?.name,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tarefa submetida com sucesso!')),
        );
        Navigator.of(context).pop();
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Falha ao submeter.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.assignment;

    String deadline = a.deadline;
    try {
      deadline = DateFormat('dd MMM · HH:mm').format(DateTime.parse(a.deadline).toLocal());
    } catch (_) {}

    final alreadySubmitted = a.mySubmission != null;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Tarefa'),
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 120),
        children: [
          // Title + chips
          Wrap(spacing: 6, runSpacing: 4, children: [
            if (alreadySubmitted)
              SaePill.success('Já submetida', icon: LucideIcons.check)
            else
              SaePill.danger('Pendente'),
            SaePill('${a.maxScore.toStringAsFixed(0)} pontos',
                color: SaeColors.ink2, bg: SaeColors.line2),
          ]),
          const SizedBox(height: 10),
          Text(a.title, style: const TextStyle(
            fontSize: 22, fontWeight: FontWeight.w800,
            color: SaeColors.textPrimary, height: 1.2, letterSpacing: -0.6,
          )),
          const SizedBox(height: 12),
          if (a.createdByName != null)
            Row(children: [
              SaeAvatar(name: a.createdByName!, color: SaeColors.primary, size: 32),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Prof. ${a.createdByName}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 13,
                      ),
                    ),
                    Text('Turma ${a.classroomId}',
                      style: const TextStyle(
                        fontSize: 11, color: SaeColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ]),
          const Divider(height: 28),

          // Meta grid
          Row(children: [
            _metaTile(LucideIcons.calendar, 'Entrega', deadline),
            const SizedBox(width: 10),
            _metaTile(LucideIcons.award, 'Pontuação', '${a.maxScore.toStringAsFixed(0)} pts'),
          ]),
          const SizedBox(height: 16),

          if (a.description != null && a.description!.isNotEmpty) ...[
            const Text('DESCRIÇÃO', style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w800,
              color: SaeColors.textSecondary, letterSpacing: 1.2,
            )),
            const SizedBox(height: 6),
            Text(a.description!, style: const TextStyle(
              fontSize: 13.5, color: SaeColors.ink2, height: 1.55,
            )),
            const SizedBox(height: 18),
          ],

          if (a.fileOriginalName != null) ...[
            const Text('MATERIAIS', style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w800,
              color: SaeColors.textSecondary, letterSpacing: 1.2,
            )),
            const SizedBox(height: 8),
            SaeCard(
              padding: const EdgeInsets.all(10),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => FileViewerPage(
                  url: _service.assignmentFileUrl(a.id),
                  title: a.fileOriginalName ?? a.title,
                ),
              )),
              child: Row(
                children: [
                  Container(
                    width: 36, height: 42, alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: SaeColors.error,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('PDF', style: TextStyle(
                      color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900,
                    )),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(a.fileOriginalName!,
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13,
                          ),
                        ),
                        const Text('Toca para abrir',
                          style: TextStyle(
                            fontSize: 11, color: SaeColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(LucideIcons.eye, color: SaeColors.primary, size: 18),
                ],
              ),
            ),
            const SizedBox(height: 18),
          ],

          // Submission
          const Text('A MINHA SUBMISSÃO', style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w800,
            color: SaeColors.textSecondary, letterSpacing: 1.2,
          )),
          const SizedBox(height: 8),
          if (alreadySubmitted)
            _AlreadySubmittedCard(a: a)
          else
            _UploadBox(file: _file, onPick: _pick),
          if (!alreadySubmitted) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _comment,
              minLines: 2, maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'Comentário para o professor (opcional)',
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _saving ? null : _submit,
                icon: _saving
                    ? const SizedBox(width: 16, height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white))
                    : const Icon(LucideIcons.send, size: 16),
                label: Text(_saving ? 'A submeter…' : 'Submeter tarefa'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metaTile(IconData icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: SaeColors.bg, borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: SaeColors.primary, size: 16),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(
              fontSize: 10.5, color: SaeColors.textSecondary,
              fontWeight: FontWeight.w700, letterSpacing: 0.4,
            )),
            const SizedBox(height: 1),
            Text(value, style: const TextStyle(
              fontSize: 13.5, color: SaeColors.textPrimary,
              fontWeight: FontWeight.w700,
            )),
          ],
        ),
      ),
    );
  }
}

class _UploadBox extends StatelessWidget {
  final PlatformFile? file;
  final VoidCallback onPick;
  const _UploadBox({required this.file, required this.onPick});

  @override
  Widget build(BuildContext context) {
    final hasFile = file != null;
    return InkWell(
      onTap: onPick,
      borderRadius: BorderRadius.circular(14),
      child: DottedBorder(
        color: hasFile ? SaeColors.primary : SaeColors.primary,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
          decoration: BoxDecoration(
            color: SaeColors.primarySofter,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Container(
                width: 48, height: 48, alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white, shape: BoxShape.circle,
                  boxShadow: const [BoxShadow(color: Color(0x140A1628), blurRadius: 6)],
                ),
                child: Icon(hasFile ? LucideIcons.fileCheck : LucideIcons.uploadCloud,
                    color: SaeColors.primary, size: 22),
              ),
              const SizedBox(height: 10),
              Text(hasFile ? file!.name : 'Anexar ficheiro',
                style: const TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w800,
                  color: SaeColors.textPrimary,
                ),
                maxLines: 1, overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 3),
              Text(hasFile
                  ? 'Toca para substituir'
                  : 'Toca para escolher · PDF, DOCX, imagens',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11.5, color: SaeColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AlreadySubmittedCard extends StatelessWidget {
  final Assignment a;
  const _AlreadySubmittedCard({required this.a});
  @override
  Widget build(BuildContext context) {
    final s = a.mySubmission!;
    final graded = s.grade != null;
    return SaeCard(
      padding: const EdgeInsets.all(14),
      color: SaeColors.primarySofter,
      borderColor: const Color(0xFFB8E6CC),
      child: Row(children: [
        Container(
          width: 44, height: 44, alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: SaeColors.primary, shape: BoxShape.circle,
          ),
          child: const Icon(LucideIcons.check, color: Colors.white, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Tarefa submetida',
                style: TextStyle(
                  fontWeight: FontWeight.w800, color: SaeColors.primaryDark,
                  fontSize: 14,
                ),
              ),
              Text('Submetida em ${s.submittedAt}',
                style: const TextStyle(
                  fontSize: 11.5, color: SaeColors.textSecondary,
                ),
              ),
              if (graded) ...[
                const SizedBox(height: 4),
                Text('Nota: ${s.grade}/${a.maxScore.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: SaeColors.primaryDark,
                    fontSize: 13,
                  ),
                ),
              ],
            ],
          ),
        ),
      ]),
    );
  }
}

/// CustomPainter dashed border (sem dependência extra)
class DottedBorder extends StatelessWidget {
  final Color color;
  final Widget child;
  const DottedBorder({super.key, required this.color, required this.child});
  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      foregroundPainter: _DashedPainter(color: color),
      child: child,
    );
  }
}

class _DashedPainter extends CustomPainter {
  final Color color;
  _DashedPainter({required this.color});
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.4
      ..style = PaintingStyle.stroke;
    const radius = 14.0;
    final rect = RRect.fromRectAndRadius(Offset.zero & size, const Radius.circular(radius));
    final path = Path()..addRRect(rect);
    final dashed = Path();
    for (final m in path.computeMetrics()) {
      double d = 0;
      while (d < m.length) {
        final segLen = 6.0;
        dashed.addPath(m.extractPath(d, d + segLen), Offset.zero);
        d += segLen + 4.0;
      }
    }
    canvas.drawPath(dashed, paint);
  }

  @override
  bool shouldRepaint(_) => false;
}
