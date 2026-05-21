import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Paleta + ícone por disciplina. Espelha o mapa COVER_CONFIG do frontend
/// web (sae-frontend/src/pages/Biblioteca.tsx).
class DisciplineStyle {
  final List<Color> gradient;
  final IconData icon;
  final Color chipBg;
  final Color chipFg;
  const DisciplineStyle({
    required this.gradient,
    required this.icon,
    required this.chipBg,
    required this.chipFg,
  });
}

class Disciplines {
  static const _fallback = DisciplineStyle(
    gradient: [Color(0xFF001B33), Color(0xFF002B50)],
    icon: LucideIcons.book,
    chipBg: Color(0xFFF3F4F6),
    chipFg: Color(0xFF374151),
  );

  static const Map<String, DisciplineStyle> _map = {
    'Programação': DisciplineStyle(
      gradient: [Color(0xFF001B33), Color(0xFF1D3A8A), Color(0xFF2563EB)],
      icon: LucideIcons.code,
      chipBg: Color(0xFFDBEAFE), chipFg: Color(0xFF1E3A8A),
    ),
    'Informática': DisciplineStyle(
      gradient: [Color(0xFF001B33), Color(0xFF1D3A8A), Color(0xFF2563EB)],
      icon: LucideIcons.code,
      chipBg: Color(0xFFDBEAFE), chipFg: Color(0xFF1E3A8A),
    ),
    'Matemática': DisciplineStyle(
      gradient: [Color(0xFF0D0B1E), Color(0xFF4C1D95), Color(0xFF6D28D9)],
      icon: LucideIcons.sigma,
      chipBg: Color(0xFFFECACA), chipFg: Color(0xFF7F1D1D),
    ),
    'Física': DisciplineStyle(
      gradient: [Color(0xFF001B33), Color(0xFF064E3B), Color(0xFF00A651)],
      icon: LucideIcons.atom,
      chipBg: Color(0xFFA7F3D0), chipFg: Color(0xFF065F46),
    ),
    'Química': DisciplineStyle(
      gradient: [Color(0xFF1A0B2E), Color(0xFF7E1D5F), Color(0xFFA21CAF)],
      icon: LucideIcons.flaskConical,
      chipBg: Color(0xFFFAE8FF), chipFg: Color(0xFF86198F),
    ),
    'Biologia': DisciplineStyle(
      gradient: [Color(0xFF001B33), Color(0xFF064E3B), Color(0xFF16A34A)],
      icon: LucideIcons.leaf,
      chipBg: Color(0xFFA7F3D0), chipFg: Color(0xFF065F46),
    ),
    'História': DisciplineStyle(
      gradient: [Color(0xFF1A0F02), Color(0xFF78350F), Color(0xFFB45309)],
      icon: LucideIcons.scrollText,
      chipBg: Color(0xFFFED7AA), chipFg: Color(0xFF7C2D12),
    ),
    'Português': DisciplineStyle(
      gradient: [Color(0xFF1B0A0A), Color(0xFF7F1D1D), Color(0xFFDC2626)],
      icon: LucideIcons.bookOpen,
      chipBg: Color(0xFFFECACA), chipFg: Color(0xFF7F1D1D),
    ),
    'Inglês': DisciplineStyle(
      gradient: [Color(0xFF001B33), Color(0xFF0C3A5F), Color(0xFF0369A1)],
      icon: LucideIcons.globe,
      chipBg: Color(0xFFBFDBFE), chipFg: Color(0xFF1E3A8A),
    ),
    'Economia': DisciplineStyle(
      gradient: [Color(0xFF042F2E), Color(0xFF134E4A), Color(0xFF0D9488)],
      icon: LucideIcons.trendingUp,
      chipBg: Color(0xFFCCFBF1), chipFg: Color(0xFF115E59),
    ),
    'Tecnologia': DisciplineStyle(
      gradient: [Color(0xFF001B33), Color(0xFF0C3A5F), Color(0xFF0369A1)],
      icon: LucideIcons.router,
      chipBg: Color(0xFFBFDBFE), chipFg: Color(0xFF1E3A8A),
    ),
    'IA': DisciplineStyle(
      gradient: [Color(0xFF1A0B2E), Color(0xFF7E1D5F), Color(0xFFA21CAF)],
      icon: LucideIcons.brain,
      chipBg: Color(0xFFFAE8FF), chipFg: Color(0xFF86198F),
    ),
  };

  static DisciplineStyle of(String? name) {
    if (name == null || name.isEmpty) return _fallback;
    // tenta exacto; depois remove acentos para tolerar 'Matematica'
    if (_map.containsKey(name)) return _map[name]!;
    final norm = _stripAccents(name);
    for (final e in _map.entries) {
      if (_stripAccents(e.key).toLowerCase() == norm.toLowerCase()) {
        return e.value;
      }
    }
    return _fallback;
  }

  static String _stripAccents(String s) => s
      .replaceAll(RegExp('[áàâã]'), 'a')
      .replaceAll(RegExp('[éèê]'), 'e')
      .replaceAll(RegExp('[íì]'), 'i')
      .replaceAll(RegExp('[óòôõ]'), 'o')
      .replaceAll(RegExp('[úù]'), 'u')
      .replaceAll('ç', 'c')
      .replaceAll(RegExp('[ÁÀÂÃ]'), 'A')
      .replaceAll(RegExp('[ÉÈÊ]'), 'E')
      .replaceAll(RegExp('[ÍÌ]'), 'I')
      .replaceAll(RegExp('[ÓÒÔÕ]'), 'O')
      .replaceAll(RegExp('[ÚÙ]'), 'U')
      .replaceAll('Ç', 'C');
}
