import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/assignment_service.dart';
import '../../theme.dart';

class SubmitTaskPage extends StatefulWidget {
  final Assignment assignment;
  final List<int> classroomIds;
  const SubmitTaskPage({super.key, required this.assignment, required this.classroomIds});

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
          const SnackBar(content: Text('Tarefa submetida com sucesso.')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
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
    return Scaffold(
      appBar: AppBar(title: Text(a.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (a.description != null && a.description!.isNotEmpty) ...[
            Text(a.description!),
            const SizedBox(height: 12),
          ],
          Row(children: [
            const Icon(Icons.event, size: 16, color: SaeColors.textSecondary),
            const SizedBox(width: 4),
            Text('Prazo: ${a.deadline}', style: const TextStyle(color: SaeColors.textSecondary)),
            const SizedBox(width: 12),
            const Icon(Icons.grade, size: 16, color: SaeColors.textSecondary),
            const SizedBox(width: 4),
            Text('Máx: ${a.maxScore.toStringAsFixed(0)}',
                style: const TextStyle(color: SaeColors.textSecondary)),
          ]),
          if (a.fileOriginalName != null) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => launchUrl(Uri.parse(_service.assignmentFileUrl(a.id)),
                  mode: LaunchMode.externalApplication),
              icon: const Icon(Icons.download),
              label: Text('Ficheiro: ${a.fileOriginalName}'),
            ),
          ],
          const Divider(height: 28),
          if (a.mySubmission != null)
            Card(
              color: SaeColors.primary.withValues(alpha: 0.06),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Já submeteu esta tarefa',
                        style: TextStyle(fontWeight: FontWeight.w800, color: SaeColors.primary)),
                    const SizedBox(height: 6),
                    Text('Submetido em: ${a.mySubmission!.submittedAt}'),
                    if (a.mySubmission!.grade != null)
                      Text('Nota: ${a.mySubmission!.grade}/${a.maxScore.toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            )
          else ...[
            const Text('Submeter trabalho',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 8),
            TextField(
              controller: _comment,
              minLines: 2,
              maxLines: 5,
              decoration: const InputDecoration(labelText: 'Comentário (opcional)'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pick,
                    icon: const Icon(Icons.attach_file),
                    label: Text(_file == null ? 'Anexar ficheiro' : _file!.name,
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _saving ? null : _submit,
              icon: const Icon(Icons.send),
              label: Text(_saving ? 'A submeter...' : 'Submeter'),
            ),
          ],
        ],
      ),
    );
  }
}
