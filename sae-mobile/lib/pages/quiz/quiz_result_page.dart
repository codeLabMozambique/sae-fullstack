import 'package:flutter/material.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/neumorphic.dart';

class QuizResultPage extends StatelessWidget {
  final QuizResult result;
  const QuizResultPage({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final pct = result.score;
    final passed = pct >= 50;
    return Scaffold(
      appBar: AppBar(title: const Text('Resultado')),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          NeuCard(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(
              children: [
                Container(
                  width: 110, height: 110,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: passed ? SaeColors.primary : Colors.orange,
                    boxShadow: Neu.outsetSoft,
                  ),
                  child: Text(
                    '${pct.toStringAsFixed(0)}%',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 28),
                  ),
                ),
                const SizedBox(height: 14),
                Text(result.quizTitulo,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 18)),
                const SizedBox(height: 6),
                Text(
                  '${result.correctAnswers}/${result.totalQuestions} corretas  ·  ${(result.timeSpentSeconds / 60).round()} min',
                  style: const TextStyle(color: SaeColors.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Revisão das perguntas',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 8),
          ...result.questionResults.map((qr) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: NeuCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(
                          qr.correct ? Icons.check_circle : Icons.cancel,
                          color: qr.correct ? SaeColors.primary : SaeColors.error,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(qr.enunciado,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ]),
                      const SizedBox(height: 8),
                      Text('Sua resposta: ${qr.selectedOptionTexto ?? '—'}',
                          style: TextStyle(
                              color: qr.correct
                                  ? SaeColors.primary
                                  : SaeColors.error,
                              fontSize: 13)),
                      if (!qr.correct)
                        Text('Correta: ${qr.correctOptionTexto}',
                            style: const TextStyle(
                                color: SaeColors.primary, fontSize: 13)),
                      if (qr.explicacao != null && qr.explicacao!.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(qr.explicacao!,
                            style: const TextStyle(
                                color: SaeColors.textSecondary, fontSize: 12)),
                      ],
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 8),
          NeuPrimaryButton(
            label: 'Concluir',
            icon: Icons.done_all,
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}
