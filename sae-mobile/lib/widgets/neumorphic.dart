import 'package:flutter/material.dart';
import '../theme.dart';

/// Sistema neumórfico simples: fundo claro com duas sombras (luz + sombra).
/// Cores afinadas para o verde SAE.
class Neu {
  static const Color bg = Color(0xFFEDF1F0);
  static const Color surface = Color(0xFFF2F6F4);
  static const Color shadowDark = Color(0x33A6B7B1); // sombra suave verde-acinzentada
  static const Color shadowLight = Color(0xFFFFFFFF);

  static List<BoxShadow> outsetSoft = const [
    BoxShadow(
      color: shadowDark,
      offset: Offset(6, 6),
      blurRadius: 14,
      spreadRadius: 0,
    ),
    BoxShadow(
      color: shadowLight,
      offset: Offset(-6, -6),
      blurRadius: 14,
      spreadRadius: 0,
    ),
  ];

  static List<BoxShadow> outsetTight = const [
    BoxShadow(color: shadowDark, offset: Offset(3, 3), blurRadius: 6),
    BoxShadow(color: shadowLight, offset: Offset(-3, -3), blurRadius: 6),
  ];

  static List<BoxShadow> insetSoft = const [
    BoxShadow(color: shadowDark, offset: Offset(2, 2), blurRadius: 6, spreadRadius: -2),
    BoxShadow(color: shadowLight, offset: Offset(-2, -2), blurRadius: 6, spreadRadius: -2),
  ];
}

/// Cartão neumórfico (relevo para fora). Use `pressed: true` para o efeito embutido.
class NeuCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final double radius;
  final bool pressed;
  final Color? color;
  final VoidCallback? onTap;

  const NeuCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin = EdgeInsets.zero,
    this.radius = 18,
    this.pressed = false,
    this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? Neu.surface;
    final shape = BorderRadius.circular(radius);
    final container = AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: padding,
      decoration: BoxDecoration(
        color: c,
        borderRadius: shape,
        boxShadow: pressed ? Neu.insetSoft : Neu.outsetSoft,
      ),
      child: child,
    );
    if (onTap == null) {
      return Container(margin: margin, child: container);
    }
    return Padding(
      padding: margin is EdgeInsets ? margin as EdgeInsets : EdgeInsets.zero,
      child: Material(
        color: Colors.transparent,
        borderRadius: shape,
        child: InkWell(
          borderRadius: shape,
          onTap: onTap,
          child: container,
        ),
      ),
    );
  }
}

/// Botão circular neumórfico (ícone).
class NeuIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final double size;
  final Color? iconColor;
  final bool active;
  const NeuIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.size = 46,
    this.iconColor,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Container(
          width: size,
          height: size,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? SaeColors.primary : Neu.surface,
            boxShadow: active ? Neu.outsetTight : Neu.outsetSoft,
          ),
          child: Icon(icon,
              color: active ? Colors.white : (iconColor ?? SaeColors.secondary),
              size: size * 0.45),
        ),
      ),
    );
  }
}

/// Botão neumórfico preenchido (CTA).
class NeuPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool expanded;
  const NeuPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.expanded = true,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    final child = Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: disabled ? const Color(0xFFBCC9C5) : SaeColors.primary,
        borderRadius: BorderRadius.circular(14),
        boxShadow: disabled ? null : Neu.outsetTight,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
        children: [
          if (loading)
            const SizedBox(
              height: 18, width: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            )
          else if (icon != null) Icon(icon, color: Colors.white, size: 18),
          if (!loading && icon != null) const SizedBox(width: 8),
          Text(label,
              style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
        ],
      ),
    );
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: disabled ? null : onPressed,
        child: child,
      ),
    );
  }
}

/// Campo de texto neumórfico (embutido).
class NeuTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String? hintText;
  final String? labelText;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final int? maxLines;
  final int? minLines;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  final TextInputAction? textInputAction;
  const NeuTextField({
    super.key,
    this.controller,
    this.hintText,
    this.labelText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.maxLines = 1,
    this.minLines,
    this.keyboardType,
    this.onSubmitted,
    this.onChanged,
    this.textInputAction,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (labelText != null) ...[
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Text(
              labelText!,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: SaeColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ),
        ],
        Container(
          decoration: BoxDecoration(
            color: Neu.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: Neu.insetSoft,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          child: Row(
            children: [
              if (prefixIcon != null) ...[
                Icon(prefixIcon, color: SaeColors.textSecondary, size: 20),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: obscureText,
                  maxLines: maxLines,
                  minLines: minLines,
                  keyboardType: keyboardType,
                  textInputAction: textInputAction,
                  onSubmitted: onSubmitted,
                  onChanged: onChanged,
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    hintText: hintText,
                    hintStyle: const TextStyle(color: Color(0xFF93A29D)),
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    isCollapsed: false,
                  ),
                ),
              ),
              if (suffixIcon != null) suffixIcon!,
            ],
          ),
        ),
      ],
    );
  }
}

/// Chip neumórfico (selecionável).
class NeuChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const NeuChip({super.key, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: selected ? SaeColors.primary : Neu.surface,
              borderRadius: BorderRadius.circular(24),
              boxShadow: selected ? Neu.insetSoft : Neu.outsetTight,
            ),
            child: Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : SaeColors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Barra inferior neumórfica.
class NeuBottomBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<({IconData icon, String label})> items;
  const NeuBottomBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
        child: Container(
          height: 68,
          decoration: BoxDecoration(
            color: Neu.surface,
            borderRadius: BorderRadius.circular(26),
            boxShadow: Neu.outsetSoft,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (i) {
              final it = items[i];
              final active = i == currentIndex;
              return Expanded(
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(18),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () => onTap(i),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 38, height: 38,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: active ? SaeColors.primary : Colors.transparent,
                              boxShadow: active ? Neu.outsetTight : null,
                            ),
                            child: Icon(it.icon,
                                color: active ? Colors.white : SaeColors.textSecondary,
                                size: 20),
                          ),
                          if (!active)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                it.label,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: SaeColors.textSecondary,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
