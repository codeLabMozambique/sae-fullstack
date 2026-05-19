import 'package:flutter/material.dart';

class SaeColors {
  static const primary = Color(0xFF00A651);
  static const primaryDark = Color(0xFF008F44);
  static const primaryLight = Color(0xFF4CAF50);
  static const secondary = Color(0xFF0A1628);
  static const secondaryLight = Color(0xFF334155);
  static const bg = Color(0xFFEDF1F0); // neumorphic background
  static const surface = Color(0xFFF2F6F4);
  static const textPrimary = Color(0xFF0A1628);
  static const textSecondary = Color(0xFF475569);
  static const error = Color(0xFFEF5350);
}

ThemeData buildSaeTheme() {
  final base = ThemeData.light(useMaterial3: true);
  return base.copyWith(
    colorScheme: const ColorScheme.light(
      primary: SaeColors.primary,
      onPrimary: Colors.white,
      secondary: SaeColors.secondary,
      onSecondary: Colors.white,
      surface: SaeColors.surface,
      onSurface: SaeColors.textPrimary,
      error: SaeColors.error,
    ),
    scaffoldBackgroundColor: SaeColors.bg,
    appBarTheme: const AppBarTheme(
      backgroundColor: SaeColors.bg,
      foregroundColor: SaeColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: SaeColors.textPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.3,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0x14000000)),
      ),
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 0),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: SaeColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: SaeColors.primary,
        side: const BorderSide(color: SaeColors.primary),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0x14000000)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0x22000000)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: SaeColors.primary, width: 1.6),
      ),
    ),
    chipTheme: const ChipThemeData(
      labelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
    ),
    textTheme: base.textTheme.apply(
      bodyColor: SaeColors.textPrimary,
      displayColor: SaeColors.textPrimary,
    ),
  );
}
