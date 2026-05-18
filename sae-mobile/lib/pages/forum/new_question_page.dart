import 'package:flutter/material.dart';
import '../../services/forum_service.dart';
import '../../theme.dart';

class NewQuestionPage extends StatefulWidget {
  const NewQuestionPage({super.key});
  @override
  State<NewQuestionPage> createState() => _NewQuestionPageState();
}

class _NewQuestionPageState extends State<NewQuestionPage> {
  final _service = ForumService();
  final _titulo = TextEditingController();
  final _desc = TextEditingController();
  final _disc = TextEditingController();
  String _type = 'ESPECIALIZADO';
  bool _saving = false;

  Future<void> _submit() async {
    if (_titulo.text.trim().isEmpty || _desc.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await _service.create(
        titulo: _titulo.text.trim(),
        descricao: _desc.text.trim(),
        questionType: _type,
        disciplina: _disc.text.trim().isEmpty ? null : _disc.text.trim(),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Falha ao criar a pergunta.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nova pergunta')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _titulo,
            decoration: const InputDecoration(labelText: 'Título'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _desc,
            decoration: const InputDecoration(labelText: 'Descrição'),
            maxLines: 6,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _disc,
            decoration: const InputDecoration(labelText: 'Disciplina (opcional)'),
          ),
          const SizedBox(height: 16),
          const Text('Tipo de pergunta',
              style: TextStyle(fontWeight: FontWeight.w700, color: SaeColors.textPrimary)),
          const SizedBox(height: 6),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'ESPECIALIZADO', label: Text('Especialista'), icon: Icon(Icons.school)),
              ButtonSegment(value: 'COLABORATIVO', label: Text('Colaborativo'), icon: Icon(Icons.group)),
            ],
            selected: {_type},
            onSelectionChanged: (s) => setState(() => _type = s.first),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _saving ? null : _submit,
            icon: const Icon(Icons.send),
            label: Text(_saving ? 'A enviar...' : 'Publicar'),
          ),
        ],
      ),
    );
  }
}
