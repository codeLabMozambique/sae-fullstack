import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/quiz_service.dart';
import '../../theme.dart';
import '../../widgets/sae_components.dart';
import 'quiz_result_page.dart';

class QuizAttemptPage extends StatefulWidget {
  final int attemptId;
  final Quiz quiz;
  const QuizAttemptPage({super.key, required this.attemptId, required this.quiz});
  @override
  State<QuizAttemptPage> createState() => _QuizAttemptPageState();
}

class _QuizAttemptPageState extends State<QuizAttemptPage>
    with SingleTickerProviderStateMixin {
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
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Falha ao submeter o quiz.')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _confirmExit() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Sair do quiz?',
            style: TextStyle(fontWeight: FontWeight.w800)),
        content: const Text('As tuas respostas não serão guardadas.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context),
              child: const Text('Continuar quiz')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.of(context).pop();
            },
            child: const Text('Sair', style: TextStyle(color: SaeColors.error)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final qs = widget.quiz.questions;
    if (qs.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Quiz')),
        body: const SaeEmpty(
          icon: LucideIcons.helpCircle,
          title: 'Este quiz não tem perguntas',
        ),
      );
    }

    final current = qs[_index];
    final selected = _answers[current.id];
    final isLast = _index == qs.length - 1;
    final answeredCount = _answers.values.where((v) => v != null).length;
    final progress = (_index + 1) / qs.length;

    return Scaffold(
      backgroundColor: Colors.white,
      // top bar custom para incluir progress
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(62),
        child: Material(
          color: Colors.white,
          child: SafeArea(
            bottom: false,
            child: Container(
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: SaeColors.line)),
              ),
              padding: const EdgeInsets.fromLTRB(10, 8, 14, 10),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 20),
                    onPressed: _confirmExit,
                  ),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: progress),
                        duration: const Duration(milliseconds: 350),
                        curve: Curves.easeOut,
                        builder: (_, v, __) => LinearProgressIndicator(
                          value: v,
                          minHeight: 7,
                          backgroundColor: SaeColors.line2,
                          valueColor: const AlwaysStoppedAnimation(SaeColors.primary),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text('${_index + 1} / ${qs.length}',
                    style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w800,
                      color: SaeColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              switchInCurve: Curves.easeOut,
              transitionBuilder: (c, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.02, 0), end: Offset.zero,
                  ).animate(anim),
                  child: c,
                ),
              ),
              child: SingleChildScrollView(
                key: ValueKey(current.id),
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      SaePill('Pergunta ${current.ordemNumero}',
                          color: SaeColors.primaryDark, bg: SaeColors.primarySoft),
                      const Spacer(),
                      const Text('+5 pts', style: TextStyle(
                        color: SaeColors.textSecondary,
                        fontWeight: FontWeight.w700, fontSize: 11.5,
                      )),
                    ]),
                    const SizedBox(height: 12),
                    Text(current.enunciado, style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w800,
                      color: SaeColors.textPrimary, height: 1.35, letterSpacing: -0.3,
                    )),
                    const SizedBox(height: 18),
                    ...current.options.map((o) {
                      final isSel = selected == o.id;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _OptionTile(
                          letter: o.letra, text: o.texto, selected: isSel,
                          onTap: () => setState(() => _answers[current.id] = o.id),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ),
          // Bottom bar
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: SaeColors.line)),
              ),
              child: Row(
                children: [
                  if (_index > 0)
                    OutlinedButton(
                      onPressed: () => setState(() => _index--),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(56, 50),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        foregroundColor: SaeColors.ink2,
                        side: const BorderSide(color: SaeColors.line),
                      ),
                      child: const Icon(LucideIcons.chevronLeft, size: 18),
                    )
                  else
                    OutlinedButton(
                      onPressed: () => setState(() => _answers[current.id] = null),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        foregroundColor: SaeColors.ink2,
                        side: const BorderSide(color: SaeColors.line),
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      child: const Text('Pular'),
                    ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: isLast
                        ? ElevatedButton.icon(
                            onPressed: _submitting ? null : _submit,
                            icon: _submitting
                                ? const SizedBox(width: 16, height: 16,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2, color: Colors.white))
                                : const Icon(LucideIcons.check, size: 16),
                            label: Text(_submitting
                                ? 'A submeter…'
                                : 'Submeter ($answeredCount/${qs.length})'),
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size.fromHeight(50),
                              textStyle: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 14),
                            ),
                          )
                        : ElevatedButton.icon(
                            onPressed: () => setState(() => _index++),
                            icon: const Icon(LucideIcons.arrowRight, size: 16),
                            label: const Text('Próxima'),
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size.fromHeight(50),
                              textStyle: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 14),
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final String letter;
  final String text;
  final bool selected;
  final VoidCallback onTap;
  const _OptionTile({
    required this.letter, required this.text,
    required this.selected, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            color: selected ? SaeColors.primarySofter : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? SaeColors.primary : SaeColors.line,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 32, height: 32, alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? SaeColors.primary : SaeColors.bg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(letter, style: TextStyle(
                  color: selected ? Colors.white : SaeColors.ink2,
                  fontWeight: FontWeight.w900, fontSize: 13,
                )),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Text(text, style: const TextStyle(
                  fontSize: 15, color: SaeColors.textPrimary,
                  fontWeight: FontWeight.w600, height: 1.35,
                )),
              ),
              if (selected)
                const Icon(LucideIcons.checkCircle2,
                    size: 20, color: SaeColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}
