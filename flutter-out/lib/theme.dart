import 'package:flutter/material.dart';

/// SAE design tokens — paleta refinada do app.
/// Mantém o mesmo nome `SaeColors` para preservar imports existentes.
class SaeColors {
  // Brand
  static const primary       = Color(0xFF00A651);  // verde SAE
  static const primaryDark   = Color(0xFF008F44);
  static const primaryLight  = Color(0xFF4CAF50);
  static const primarySoft   = Color(0xFFE8F7EE);
  static const primarySofter = Color(0xFFF0FDF4);

  static const secondary      = Color(0xFF0A1628);
  static const secondaryLight = Color(0xFF1A3D5C);
  static const secondarySoft  = Color(0xFF172238);

  // Surfaces
  static const bg      = Color(0xFFF5F7FA);
  static const bgSoft  = Color(0xFFFAFBFC);
  static const surface = Colors.white;
  static const line    = Color(0xFFE5E7EB);
  static const line2   = Color(0xFFF3F4F6);

  // Text
  static const textPrimary   = Color(0xFF0A1628);
  static const textSecondary = Color(0xFF6B7280);
  static const textMuted     = Color(0xFF9CA3AF);
  static const ink2          = Color(0xFF374151);

  // Semantic
  static const error      = Color(0xFFEF4444);
  static const errorSoft  = Color(0xFFFEE2E2);
  static const warn       = Color(0xFFF59E0B);
  static const warnSoft   = Color(0xFFFEF3C7);
  static const info       = Color(0xFF2563EB);
  static const infoSoft   = Color(0xFFDBEAFE);
  static const success    = primary;
  static const successSoft= primarySoft;
}

/// Espaçamento e raios consistentes.
class SaeSizes {
  static const double radiusSm = 8;
  static const double radiusMd = 12;
  static const double radiusLg = 16;
  static const double radiusXl = 22;
  static const double radius2x = 28;

  static const double gapXs = 4;
  static const double gapSm = 8;
  static const double gap   = 12;
  static const double gapMd = 16;
  static const double gapLg = 24;
}

/// Sombras subtis (mais limpas que o neumorfismo original).
class SaeShadows {
  static const card = [
    BoxShadow(color: Color(0x0A0A1628), blurRadius: 8, offset: Offset(0, 2)),
  ];
  static const cardHover = [
    BoxShadow(color: Color(0x140A1628), blurRadius: 16, offset: Offset(0, 6)),
  ];
  static const float = [
    BoxShadow(color: Color(0x1A0A1628), blurRadius: 24, offset: Offset(0, 8)),
  ];
}

ThemeData buildSaeTheme() {
  final base = ThemeData.light(useMaterial3: true);

  return base.copyWith(
    colorScheme: const ColorScheme.light(
      primary: SaeColors.primary,
      onPrimary: Colors.white,
      primaryContainer: SaeColors.primarySoft,
      onPrimaryContainer: SaeColors.primaryDark,
      secondary: SaeColors.secondary,
      onSecondary: Colors.white,
      surface: SaeColors.surface,
      onSurface: SaeColors.textPrimary,
      surfaceContainerHighest: SaeColors.line2,
      error: SaeColors.error,
      onError: Colors.white,
      outline: SaeColors.line,
      outlineVariant: SaeColors.line2,
    ),
    scaffoldBackgroundColor: SaeColors.bg,
    fontFamily: 'Roboto',

    // Text — tight + dark + balanced
    textTheme: base.textTheme.apply(
      bodyColor: SaeColors.textPrimary,
      displayColor: SaeColors.textPrimary,
    ).copyWith(
      displayLarge:    base.textTheme.displayLarge?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -1.2),
      headlineLarge:   base.textTheme.headlineLarge?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.8),
      headlineMedium:  base.textTheme.headlineMedium?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.6),
      headlineSmall:   base.textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w800, letterSpacing: -0.4),
      titleLarge:      base.textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w700, letterSpacing: -0.3),
      titleMedium:     base.textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w700),
      labelLarge:      base.textTheme.labelLarge?.copyWith(
        fontWeight: FontWeight.w700),
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: SaeColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      surfaceTintColor: Colors.white,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: SaeColors.textPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.3,
        fontFamily: 'Roboto',
      ),
    ),

    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(SaeSizes.radiusLg),
        side: const BorderSide(color: SaeColors.line),
      ),
      margin: EdgeInsets.zero,
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: SaeColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(SaeSizes.radiusMd)),
        minimumSize: const Size(0, 48),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: SaeColors.primary,
        side: const BorderSide(color: SaeColors.primary, width: 1.4),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(SaeSizes.radiusMd)),
        minimumSize: const Size(0, 48),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: SaeColors.primary,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: const TextStyle(color: SaeColors.textMuted, fontWeight: FontWeight.w500),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(SaeSizes.radiusMd),
        borderSide: const BorderSide(color: SaeColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(SaeSizes.radiusMd),
        borderSide: const BorderSide(color: SaeColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(SaeSizes.radiusMd),
        borderSide: const BorderSide(color: SaeColors.primary, width: 1.6),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(SaeSizes.radiusMd),
        borderSide: const BorderSide(color: SaeColors.error, width: 1.4),
      ),
    ),

    chipTheme: ChipThemeData(
      labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
      side: const BorderSide(color: SaeColors.line),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      padding: const EdgeInsets.symmetric(horizontal: 6),
    ),

    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: SaeColors.primarySoft,
      height: 70,
      elevation: 0,
      surfaceTintColor: Colors.white,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 11.5,
          fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
          color: selected ? SaeColors.textPrimary : SaeColors.textSecondary,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? SaeColors.primary : SaeColors.textSecondary,
          size: 22,
        );
      }),
    ),

    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: SaeColors.primary,
      foregroundColor: Colors.white,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(18)),
      ),
    ),

    dividerTheme: const DividerThemeData(color: SaeColors.line, thickness: 1, space: 1),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: SaeColors.secondary,
      contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(SaeSizes.radiusMd)),
    ),
    splashFactory: InkSparkle.splashFactory,
  );
}
