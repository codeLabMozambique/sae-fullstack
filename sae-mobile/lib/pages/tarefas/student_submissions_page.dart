import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/assignment_service.dart';
import '../../theme.dart';

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
    } catch (e) {
      _error = 'Não foi possível carregar as submissões.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_items.isEmpty) return const Center(child: Text('Ainda não submeteu nenhuma tarefa.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final s = _items[i];
          final graded = s.grade != null;
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tarefa #${s.assignmentId}',
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text('Submetido em: ${s.submittedAt}',
                      style: const TextStyle(color: SaeColors.textSecondary, fontSize: 12)),
                  if (s.comment != null && s.comment!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(s.comment!),
                  ],
                  const SizedBox(height: 10),
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: graded ? SaeColors.primary : Colors.orange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(graded ? 'Nota: ${s.grade}' : 'Pendente',
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                    ),
                    const Spacer(),
                    if (s.fileOriginalName != null)
                      TextButton.icon(
                        onPressed: () => launchUrl(Uri.parse(_service.submissionFileUrl(s.id)),
                            mode: LaunchMode.externalApplication),
                        icon: const Icon(Icons.download),
                        label: const Text('Ver ficheiro'),
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
