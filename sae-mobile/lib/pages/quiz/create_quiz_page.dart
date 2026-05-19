import 'package:flutter/material.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class CreateQuizPage extends StatefulWidget {
  const CreateQuizPage({super.key});
  @override
  State<CreateQuizPage> createState() => _CreateQuizPageState();
}

class _CreateQuizPageState extends State<CreateQuizPage> {
  final _service = QuizService();
  final _titulo = TextEditingController();
  final _desc = TextEditingController();
  final _disc = TextEditingController();
  final _time = TextEditingController();
  final _questions = <_DraftQuestion>[];
  bool _saving = false;

  void _addQuestion() {
    setState(() => _questions.add(_DraftQuestion()));
  }

  Future<void> _save() async {
    if (_titulo.text.trim().isEmpty || _desc.text.trim().isEmpty || _disc.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Preencha título, descrição e disciplina.')));
      return;
    }
    if (_questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Adicione pelo menos uma pergunta.')));
      return;
    }
    setState(() => _saving = true);
    try {
      final quiz = await _service.createQuiz(
        titulo: _titulo.text.trim(),
        descricao: _desc.text.trim(),
        disciplina: _disc.text.trim(),
        tempoLimiteMinutos: int.tryParse(_time.text.trim()),
      );
      for (final q in _questions) {
        final opts = <QuizOption>[];
        for (var i = 0; i < q.options.length; i++) {
          opts.add(QuizOption(
            id: 0,
            texto: q.options[i].text.text.trim(),
            letra: String.fromCharCode('A'.codeUnitAt(0) + i),
            correta: i == q.correctIndex,
          ));
        }
        await _service.addQuestion(quiz.id, enunciado: q.enunciado.text.trim(), options: opts);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao criar quiz.')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Criar quiz')),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          NeuTextField(controller: _titulo, labelText: 'Título', prefixIcon: Icons.title),
          const SizedBox(height: 10),
          NeuTextField(
              controller: _desc, labelText: 'Descrição', prefixIcon: Icons.notes,
              minLines: 2, maxLines: 4),
          const SizedBox(height: 10),
          NeuTextField(controller: _disc, labelText: 'Disciplina', prefixIcon: Icons.school),
          const SizedBox(height: 10),
          NeuTextField(
            controller: _time,
            labelText: 'Tempo limite (minutos, opcional)',
            prefixIcon: Icons.timer,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          Row(children: [
            const Text('Perguntas',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const Spacer(),
            NeuPrimaryButton(
              label: 'Adicionar',
              icon: Icons.add,
              expanded: false,
              onPressed: _addQuestion,
            ),
          ]),
          const SizedBox(height: 8),
          ..._questions.asMap().entries.map((e) {
            final i = e.key;
            final q = e.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: NeuCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text('Pergunta ${i + 1}',
                          style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: SaeColors.primary)),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => setState(() => _questions.removeAt(i)),
                      ),
                    ]),
                    NeuTextField(
                      controller: q.enunciado,
                      hintText: 'Enunciado',
                      maxLines: 3,
                      minLines: 1,
                    ),
                    const SizedBox(height: 8),
                    ...q.options.asMap().entries.map((oe) {
                      final oi = oe.key;
                      final letter = String.fromCharCode('A'.codeUnitAt(0) + oi);
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(children: [
                          Radio<int>(
                            value: oi,
                            groupValue: q.correctIndex,
                            activeColor: SaeColors.primary,
                            onChanged: (v) => setState(() => q.correctIndex = v ?? 0),
                          ),
                          Text(letter,
                              style: const TextStyle(fontWeight: FontWeight.w800)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: NeuTextField(
                              controller: oe.value.text,
                              hintText: 'Opção $letter',
                            ),
                          ),
                        ]),
                      );
                    }),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
          NeuPrimaryButton(
            label: 'Guardar quiz',
            icon: Icons.save,
            loading: _saving,
            onPressed: _save,
          ),
        ],
      ),
    );
  }
}

class _DraftOption {
  final TextEditingController text = TextEditingController();
}

class _DraftQuestion {
  final TextEditingController enunciado = TextEditingController();
  final List<_DraftOption> options = List.generate(4, (_) => _DraftOption());
  int correctIndex = 0;
}
