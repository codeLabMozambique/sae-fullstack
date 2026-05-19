import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../services/content_service.dart';
import '../../services/forum_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class NewQuestionPage extends StatefulWidget {
  const NewQuestionPage({super.key});
  @override
  State<NewQuestionPage> createState() => _NewQuestionPageState();
}

class _NewQuestionPageState extends State<NewQuestionPage> {
  final _service = ForumService();
  final _content = ContentService();
  final _titulo = TextEditingController();
  final _desc = TextEditingController();
  final _disc = TextEditingController();
  String _type = 'ESPECIALIZADO';
  bool _saving = false;
  PlatformFile? _file;

  Future<void> _pick() async {
    final res = await FilePicker.platform.pickFiles();
    if (res != null && res.files.isNotEmpty) {
      setState(() => _file = res.files.first);
    }
  }

  Future<void> _submit() async {
    if (_titulo.text.trim().isEmpty || _desc.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      String? attachmentId;
      if (_file?.path != null) {
        final att = await _content.uploadAttachment(
          _file!.path!,
          fileName: _file!.name,
          context: 'forum',
        );
        attachmentId = att.id;
      }
      await _service.create(
        titulo: _titulo.text.trim(),
        descricao: _desc.text.trim(),
        questionType: _type,
        disciplina: _disc.text.trim().isEmpty ? null : _disc.text.trim(),
        attachmentId: attachmentId,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao criar a pergunta.')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SaeColors.bg,
      appBar: AppBar(title: const Text('Nova pergunta')),
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.fromLTRB(
            16, 16, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
          children: [
          NeuTextField(controller: _titulo, labelText: 'Título', prefixIcon: Icons.title),
          const SizedBox(height: 12),
          NeuTextField(
            controller: _desc,
            labelText: 'Descrição',
            prefixIcon: Icons.notes,
            minLines: 4, maxLines: 8,
          ),
          const SizedBox(height: 12),
          NeuTextField(
            controller: _disc,
            labelText: 'Disciplina (opcional)',
            prefixIcon: Icons.school,
          ),
          const SizedBox(height: 16),
          const Text('Tipo de pergunta',
              style: TextStyle(
                  fontWeight: FontWeight.w700, color: SaeColors.textPrimary)),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(
              child: NeuChip(
                label: 'Especialista',
                selected: _type == 'ESPECIALIZADO',
                onTap: () => setState(() => _type = 'ESPECIALIZADO'),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: NeuChip(
                label: 'Colaborativo',
                selected: _type == 'COLABORATIVO',
                onTap: () => setState(() => _type = 'COLABORATIVO'),
              ),
            ),
          ]),
          const SizedBox(height: 16),
          NeuCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            onTap: _pick,
            child: Row(children: [
              const Icon(Icons.attach_file, color: SaeColors.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _file == null ? 'Anexar ficheiro (opcional)' : _file!.name,
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
          const SizedBox(height: 24),
          NeuPrimaryButton(
            label: _saving ? 'A enviar...' : 'Publicar',
            icon: Icons.send,
            loading: _saving,
            onPressed: _saving ? null : _submit,
          ),
        ],
        ),
      ),
    );
  }
}
