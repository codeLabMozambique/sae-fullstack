import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../services/assignment_service.dart';
import '../../services/user_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class CreateTaskPage extends StatefulWidget {
  const CreateTaskPage({super.key});
  @override
  State<CreateTaskPage> createState() => _CreateTaskPageState();
}

class _CreateTaskPageState extends State<CreateTaskPage> {
  final _service = AssignmentService();
  final _userService = UserService();
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _maxScore = TextEditingController(text: '20');
  DateTime? _deadline;
  PlatformFile? _file;
  bool _saving = false;
  bool _loadingClassrooms = true;
  List<ProfessorClassroom> _classrooms = [];
  int? _classroomId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadClassrooms());
  }

  Future<void> _loadClassrooms() async {
    final auth = context.read<AuthState>();
    final list = await _userService.professorClassrooms(auth.user?.username ?? '');
    if (!mounted) return;
    setState(() {
      _classrooms = list;
      _classroomId = list.isNotEmpty ? list.first.id : null;
      _loadingClassrooms = false;
    });
  }

  Future<void> _pickFile() async {
    final res = await FilePicker.platform.pickFiles();
    if (res != null && res.files.isNotEmpty) setState(() => _file = res.files.first);
  }

  Future<void> _pickDeadline() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _deadline ?? now.add(const Duration(days: 7)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365 * 2)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_deadline ?? now.add(const Duration(hours: 23))),
    );
    if (time == null) return;
    setState(() {
      _deadline = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  Future<void> _submit() async {
    if (_title.text.trim().isEmpty || _classroomId == null || _deadline == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Preencha título, turma e prazo.')));
      return;
    }
    setState(() => _saving = true);
    try {
      // LocalDateTime do Spring: "yyyy-MM-ddTHH:mm:ss" sem fuso, sem millis.
      final deadlineIso = DateFormat("yyyy-MM-dd'T'HH:mm:ss").format(_deadline!);
      await _service.createAssignment(
        classroomId: _classroomId!,
        title: _title.text.trim(),
        description: _desc.text.trim().isEmpty ? null : _desc.text.trim(),
        deadlineIso: deadlineIso,
        maxScore: double.tryParse(_maxScore.text.replaceAll(',', '.')) ?? 20,
        filePath: _file?.path,
        fileName: _file?.name,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        String msg = 'Falha ao criar tarefa.';
        if (e is DioException && e.response != null) {
          final data = e.response!.data;
          if (data is Map) {
            msg = (data['message'] ?? data['error'] ?? data.toString()).toString();
          } else if (data is String && data.isNotEmpty) {
            msg = data;
          }
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(msg, maxLines: 4),
            duration: const Duration(seconds: 6)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      appBar: AppBar(title: const Text('Nova tarefa')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            NeuTextField(controller: _title, labelText: 'Título', prefixIcon: Icons.title),
            const SizedBox(height: 12),
            NeuTextField(
              controller: _desc,
              labelText: 'Descrição (opcional)',
              prefixIcon: Icons.notes,
              minLines: 3, maxLines: 6,
            ),
            const SizedBox(height: 14),
            const Text('Turma',
                style: TextStyle(fontWeight: FontWeight.w700, color: SaeColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 6),
            if (_loadingClassrooms)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              )
            else if (_classrooms.isEmpty)
              NeuCard(
                padding: const EdgeInsets.all(14),
                child: Row(children: const [
                  Icon(Icons.info_outline, color: SaeColors.error),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                        'Sem turmas atribuídas. Contacte o administrador para receber atribuições.',
                        style: TextStyle(fontSize: 13)),
                  ),
                ]),
              )
            else
              Wrap(
                spacing: 6, runSpacing: 4,
                children: _classrooms.map((c) => NeuChip(
                      label: '${c.name}${c.shift != null ? ' · ${c.shift}' : ''}',
                      selected: _classroomId == c.id,
                      onTap: () => setState(() => _classroomId = c.id),
                    )).toList(),
              ),
            const SizedBox(height: 14),
            NeuCard(
              onTap: _pickDeadline,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Row(children: [
                const Icon(Icons.event, color: SaeColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _deadline == null
                        ? 'Definir prazo de entrega'
                        : 'Prazo: ${DateFormat('dd/MM/yyyy HH:mm').format(_deadline!)}',
                    style: TextStyle(
                      fontWeight: _deadline == null ? FontWeight.w500 : FontWeight.w700,
                      color: _deadline == null ? SaeColors.textSecondary : SaeColors.textPrimary,
                    ),
                  ),
                ),
                const Icon(Icons.edit, size: 18, color: SaeColors.textSecondary),
              ]),
            ),
            const SizedBox(height: 12),
            NeuTextField(
              controller: _maxScore,
              labelText: 'Nota máxima',
              prefixIcon: Icons.grade,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            NeuCard(
              onTap: _pickFile,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(children: [
                const Icon(Icons.attach_file, color: SaeColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _file == null ? 'Anexar ficheiro de apoio (opcional)' : _file!.name,
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: _file == null ? FontWeight.w500 : FontWeight.w700,
                      color: _file == null ? SaeColors.textSecondary : SaeColors.textPrimary,
                    ),
                  ),
                ),
                if (_file != null)
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => setState(() => _file = null),
                  ),
              ]),
            ),
            const SizedBox(height: 22),
            NeuPrimaryButton(
              label: 'Publicar tarefa',
              icon: Icons.send,
              loading: _saving,
              onPressed: _classrooms.isEmpty ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}
