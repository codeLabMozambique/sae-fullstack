import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';

/// ───────────────────────────────────────────────────────────────────────────
/// SaePill — badge pequeno reutilizável (estado, contagem, role)
/// ───────────────────────────────────────────────────────────────────────────
class SaePill extends StatelessWidget {
  final String label;
  final Color? color;
  final Color? bg;
  final IconData? icon;
  final EdgeInsetsGeometry? padding;
  final double fontSize;

  const SaePill(
    this.label, {
    super.key,
    this.color,
    this.bg,
    this.icon,
    this.padding,
    this.fontSize = 11,
  });

  factory SaePill.success(String l, {IconData? icon}) =>
      SaePill(l, color: SaeColors.primaryDark, bg: SaeColors.primarySoft, icon: icon);
  factory SaePill.warn(String l, {IconData? icon}) =>
      SaePill(l, color: const Color(0xFF92400E), bg: SaeColors.warnSoft, icon: icon);
  factory SaePill.danger(String l, {IconData? icon}) =>
      SaePill(l, color: SaeColors.error, bg: SaeColors.errorSoft, icon: icon);
  factory SaePill.info(String l, {IconData? icon}) =>
      SaePill(l, color: const Color(0xFF1E3A8A), bg: SaeColors.infoSoft, icon: icon);
  factory SaePill.muted(String l, {IconData? icon}) =>
      SaePill(l, color: SaeColors.textSecondary, bg: SaeColors.line2, icon: icon);

  @override
  Widget build(BuildContext context) {
    final c = color ?? SaeColors.textPrimary;
    return Container(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: bg ?? SaeColors.line2,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: fontSize + 1, color: c),
            const SizedBox(width: 4),
          ],
          Text(label, style: TextStyle(
            color: c, fontSize: fontSize, fontWeight: FontWeight.w700,
            letterSpacing: 0.1,
          )),
        ],
      ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeAppBar — barra superior com logo + título + subtítulo + trailing
/// ───────────────────────────────────────────────────────────────────────────
class SaeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final Widget? leading;
  final List<Widget>? actions;
  final bool showLogo;
  final Color background;

  const SaeAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.actions,
    this.showLogo = true,
    this.background = Colors.white,
  });

  @override
  Size get preferredSize => Size.fromHeight(subtitle == null ? 60 : 68);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: preferredSize.height,
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: SaeColors.line)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            children: [
              if (leading != null)
                leading!
              else if (showLogo)
                Container(
                  width: 34, height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: SaeColors.primary,
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Text('S',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: SaeColors.textPrimary,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (subtitle != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 1),
                        child: Text(subtitle!, maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: SaeColors.textSecondary,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (actions != null) ...actions!,
            ],
          ),
        ),
      ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeAvatar — círculo com iniciais
/// ───────────────────────────────────────────────────────────────────────────
class SaeAvatar extends StatelessWidget {
  final String name;
  final Color? color;
  final double size;
  const SaeAvatar({
    super.key,
    required this.name,
    this.color,
    this.size = 36,
  });

  @override
  Widget build(BuildContext context) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    final initials = parts.isEmpty
        ? '?'
        : (parts.length == 1
            ? parts[0].substring(0, 1)
            : parts.first[0] + parts.last[0]).toUpperCase();
    return Container(
      width: size, height: size, alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color ?? SaeColors.secondary,
      ),
      child: Text(initials, style: TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w800,
        fontSize: size * 0.36,
        letterSpacing: -0.3,
      )),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeChip — chip selecionável (substitui NeuChip nos sítios novos)
/// ───────────────────────────────────────────────────────────────────────────
class SaeChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool dark;
  const SaeChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.dark = false,
  });

  @override
  Widget build(BuildContext context) {
    final activeBg = dark ? SaeColors.secondary : SaeColors.primary;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: selected ? activeBg : Colors.white,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? activeBg : SaeColors.line,
              width: 1,
            ),
          ),
          child: Text(label, style: TextStyle(
            color: selected ? Colors.white : SaeColors.ink2,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          )),
        ),
      ),
    );
  }
}

/// Linha horizontal de SaeChip.
class SaeChipRow extends StatelessWidget {
  final List<String> items;
  final String active;
  final ValueChanged<String> onPick;
  final bool dark;
  final EdgeInsetsGeometry padding;
  const SaeChipRow({
    super.key,
    required this.items,
    required this.active,
    required this.onPick,
    this.dark = false,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: padding,
        physics: const BouncingScrollPhysics(),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final it = items[i];
          return Center(
            child: SaeChip(
              label: it,
              selected: it == active,
              onTap: () => onPick(it),
              dark: dark,
            ),
          );
        },
      ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeStatTile — bloco de estatística (3 por linha tipicamente)
/// ───────────────────────────────────────────────────────────────────────────
class SaeStatTile extends StatelessWidget {
  final String value;
  final String label;
  final IconData? icon;
  final Color color;
  final Color bg;
  const SaeStatTile({
    super.key,
    required this.value,
    required this.label,
    this.icon,
    required this.color,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) Icon(icon, size: 14, color: color),
          if (icon != null) const SizedBox(height: 2),
          Text(value, style: TextStyle(
            fontSize: 22, color: color,
            fontWeight: FontWeight.w800, letterSpacing: -0.6,
          )),
          Text(label, style: const TextStyle(
            fontSize: 10.5, color: SaeColors.ink2, fontWeight: FontWeight.w700,
          )),
        ],
      ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeSection — cabeçalho de secção (título + acção opcional)
/// ───────────────────────────────────────────────────────────────────────────
class SaeSection extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;
  final EdgeInsetsGeometry padding;
  const SaeSection({
    super.key,
    required this.title,
    this.action,
    this.onAction,
    this.padding = const EdgeInsets.fromLTRB(16, 14, 16, 8),
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Expanded(
            child: Text(title, style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: SaeColors.textPrimary,
              letterSpacing: -0.2,
            )),
          ),
          if (action != null)
            InkWell(
              onTap: onAction,
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Text(action!, style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: SaeColors.primary,
                )),
              ),
            ),
        ],
      ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeCard — cartão branco com border + sombra subtil + onTap opcional
/// ───────────────────────────────────────────────────────────────────────────
class SaeCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final double radius;
  final Color? color;
  final Color? borderColor;
  final List<BoxShadow>? shadow;
  final bool dashed;

  const SaeCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(14),
    this.margin = EdgeInsets.zero,
    this.radius = 14,
    this.color,
    this.borderColor,
    this.shadow,
    this.dashed = false,
  });

  @override
  State<SaeCard> createState() => _SaeCardState();
}

class _SaeCardState extends State<SaeCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final shape = BorderRadius.circular(widget.radius);
    final card = AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      curve: Curves.easeOut,
      transform: Matrix4.identity()..scale(_pressed ? 0.98 : 1.0),
      transformAlignment: Alignment.center,
      padding: widget.padding,
      decoration: BoxDecoration(
        color: widget.color ?? Colors.white,
        borderRadius: shape,
        border: Border.all(color: widget.borderColor ?? SaeColors.line),
        boxShadow: widget.shadow ?? SaeShadows.card,
      ),
      child: widget.child,
    );

    return Padding(
      padding: widget.margin,
      child: widget.onTap == null
          ? card
          : Material(
              color: Colors.transparent,
              borderRadius: shape,
              child: InkWell(
                borderRadius: shape,
                onTap: widget.onTap,
                onHighlightChanged: (v) => setState(() => _pressed = v),
                child: card,
              ),
            ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeSearchField — campo de pesquisa branco + ícone + acção opcional
/// ───────────────────────────────────────────────────────────────────────────
class SaeSearchField extends StatelessWidget {
  final TextEditingController? controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final Widget? trailing;

  const SaeSearchField({
    super.key,
    this.controller,
    this.hint = 'Pesquisar…',
    this.onChanged,
    this.onSubmitted,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SaeColors.line),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          const Icon(LucideIcons.search, size: 17, color: SaeColors.textMuted),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              onSubmitted: onSubmitted,
              decoration: InputDecoration(
                border: InputBorder.none,
                hintText: hint,
                hintStyle: const TextStyle(color: SaeColors.textMuted, fontSize: 13),
                isCollapsed: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              style: const TextStyle(fontSize: 13, color: SaeColors.textPrimary),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// ───────────────────────────────────────────────────────────────────────────
/// SaeEmpty — empty state minimalista
/// ───────────────────────────────────────────────────────────────────────────
class SaeEmpty extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  const SaeEmpty({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72, height: 72, alignment: Alignment.center,
              decoration: BoxDecoration(
                color: SaeColors.primarySofter,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 32, color: SaeColors.primary),
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(
              fontSize: 15, fontWeight: FontWeight.w800, color: SaeColors.textPrimary,
            )),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(subtitle!, textAlign: TextAlign.center, style: const TextStyle(
                fontSize: 13, color: SaeColors.textSecondary, height: 1.4,
              )),
            ],
            if (action != null) ...[
              const SizedBox(height: 16),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
