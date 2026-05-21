import 'package:flutter/material.dart';
import 'sae_tokens.dart';
import '../theme.dart';

/// Capa de livro com gradiente por disciplina + ícone esbatido, à imagem
/// do BookCover do frontend web. Aceita também URL de thumbnail real —
/// se presente, mostra a imagem com chip da disciplina por cima.
class SaeBookCover extends StatelessWidget {
  final String? discipline;
  final String? title;
  final String? author;
  final double height;
  final double radius;
  final ImageProvider? thumbnail;
  final bool compact;

  const SaeBookCover({
    super.key,
    this.discipline,
    this.title,
    this.author,
    this.height = 160,
    this.radius = 14,
    this.thumbnail,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final style = Disciplines.of(discipline);

    if (thumbnail != null) {
      return ClipRRect(
        borderRadius: BorderRadius.vertical(top: Radius.circular(radius)),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image(image: thumbnail!, fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _gradientFallback(style),
            ),
            if ((discipline ?? '').isNotEmpty)
              Positioned(
                top: 8, left: 8,
                child: _disciplineChip(discipline!),
              ),
          ],
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.vertical(top: Radius.circular(radius)),
      child: _gradientFallback(style),
    );
  }

  Widget _gradientFallback(DisciplineStyle style) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: style.gradient,
        ),
      ),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          // decorative bubbles
          Positioned(
            top: -22, right: -22,
            child: _bubble(80, Colors.white.withValues(alpha: 0.06)),
          ),
          Positioned(
            bottom: -16, left: -16,
            child: _bubble(64, Colors.white.withValues(alpha: 0.04)),
          ),
          Positioned(
            right: -10, bottom: -8,
            child: Opacity(
              opacity: 0.13,
              child: Icon(style.icon, size: compact ? 64 : 96, color: Colors.white),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(compact ? 10 : 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if ((discipline ?? '').isNotEmpty)
                  Text(
                    discipline!.toUpperCase(),
                    style: TextStyle(
                      fontSize: compact ? 8.5 : 9.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.4,
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
                  )
                else const SizedBox.shrink(),
                if (title != null && title!.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title!,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: compact ? 11.5 : 13,
                          height: 1.25,
                          letterSpacing: -0.2,
                        ),
                      ),
                      if (author != null && author!.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(
                          author!,
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: compact ? 9 : 10,
                          ),
                        ),
                      ],
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _bubble(double s, Color c) => Container(
        width: s, height: s,
        decoration: BoxDecoration(shape: BoxShape.circle, color: c),
      );

  Widget _disciplineChip(String text) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(text,
          style: const TextStyle(
            color: SaeColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 10.5,
          ),
        ),
      );
}
