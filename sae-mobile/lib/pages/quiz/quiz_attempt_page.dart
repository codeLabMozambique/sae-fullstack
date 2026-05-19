import 'package:flutter/material.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';
import 'quiz_result_page.dart';

class QuizAttemptPage extends StatefulWidget {
  final int attemptId;
  final Quiz quiz;
  const QuizAttemptPage({super.key, required this.attemptId, required this.quiz});
  @override
  State<QuizAttemptPage> createState() => _QuizAttemptPageState();
}

class _QuizAttemptPageState extends State<QuizAttemptPage> {
  final _service = QuizService();
  final Map<int, int?> _answers = {};
  int _index = 0;
  bool _submitting = false;

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final result = await _service.submitAttempt(widget.attemptId, _answers);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) => QuizResultPage(result: result),
      ));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao submeter o quiz.')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.quiz.questions;
    if (q.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Quiz')),
        body: const Center(child: Text('Quiz sem perguntas.')),
      );
    }
    final current = q[_index];
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.quiz.titulo, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Center(
              child: Text('${_index + 1}/${q.length}',
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: (_index + 1) / q.length,
                minHeight: 8,
                backgroundColor: const Color(0xFFE0E6E4),
                valueColor: const AlwaysStoppedAnimation(SaeColors.primary),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(14),
              child: NeuCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Pergunta ${current.ordemNumero}',
                        style: const TextStyle(
                            color: SaeColors.primary, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Text(current.enunciado, style: const TextStyle(fontSize: 16)),
                    const SizedBox(height: 16),
                    ...current.options.map((o) {
                      final selected = _answers[current.id] == o.id;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: NeuCard(
                          pressed: selected,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 12),
                          onTap: () =>
                              setState(() => _answers[current.id] = o.id),
                          child: Row(children: [
                            Container(
                              width: 32, height: 32, alignment: Alignment.center,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: selected ? SaeColors.primary : Neu.bg,
                                boxShadow: Neu.outsetTight,
                              ),
                              child: Text(o.letra,
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      color: selected
                                          ? Colors.white
                                          : SaeColors.textPrimary)),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                                child: Text(o.texto,
                                    style: const TextStyle(fontSize: 14))),
                          ]),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: Row(children: [
                Expanded(
                  child: NeuCard(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    onTap: _index == 0 ? null : () => setState(() => _index--),
                    child: const Center(
                      child: Text('Anterior',
                          style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _index == q.length - 1
                      ? NeuPrimaryButton(
                          label: 'Submeter',
                          icon: Icons.check,
                          loading: _submitting,
                          onPressed: _submit,
                        )
                      : NeuPrimaryButton(
                          label: 'Próxima',
                          icon: Icons.arrow_forward,
                          onPressed: () => setState(() => _index++),
                        ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
