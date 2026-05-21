import 'dart:ui';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import 'forgot_password_page.dart';
import 'signup_student_page.dart';

/// Espelha o ContactValidator.requireValidPhone do backend Java:
/// aceita `+258...`, `00258...`, `258...` ou só os 9 dígitos `8X...`
/// e devolve sempre `+258XXXXXXXXX`. Se não parecer telefone (e.g. email),
/// devolve o input intacto (apenas trim).
String _normaliseLogin(String raw) {
  final v = raw.trim();
  if (v.isEmpty) return v;
  if (v.contains('@')) return v;
  final cleaned = v.replaceAll(RegExp(r'[\s\-()]+'), '');
  final phoneRe = RegExp(r'^(?:\+?258|00258)?(8[2-7])\d{7}$');
  if (!phoneRe.hasMatch(cleaned)) return v;
  var tail = cleaned;
  if (cleaned.startsWith('+258')) {
    tail = cleaned.substring(4);
  } else if (cleaned.startsWith('00258')) {
    tail = cleaned.substring(5);
  } else if (cleaned.startsWith('258')) {
    tail = cleaned.substring(3);
  }
  return '+258$tail';
}

/// Paleta inspirada na bandeira de Moçambique + uniforme escolar
class _LoginPalette {
  static const flagGreen      = Color(0xFF009A4E);
  static const flagGreenDark  = Color(0xFF00713A);
  static const navyTie        = Color(0xFF0E1B3D);
  static const flagRed        = Color(0xFFD32027);
  static const flagYellow     = Color(0xFFFCD116);
  static const overlayDark    = Color(0xCC000814);
  static const glass          = Color(0x33FFFFFF);
  static const glassBorder    = Color(0x55FFFFFF);
  static const glassInput     = Color(0x22FFFFFF);
  static const glassInputBorder = Color(0x44FFFFFF);
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with TickerProviderStateMixin {
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  bool _remember = true;
  String? _error;

  late final AnimationController _entrance;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _entrance = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
    _fade = CurvedAnimation(parent: _entrance, curve: Curves.easeOut);
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _entrance, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _entrance.dispose();
    _userCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_userCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Preenche o utilizador e a palavra-passe.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    final identifier = _normaliseLogin(_userCtrl.text);
    try {
      await context.read<AuthState>().login(identifier, _passCtrl.text);
    } catch (e) {
      String msg = 'Credenciais inválidas ou servidor indisponível.';
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map && data['message'] is String) {
          msg = data['message'] as String;
        } else if (data is Map && data['error'] is String) {
          msg = data['error'] as String;
        } else if (e.response?.statusCode == 401) {
          msg = 'Utilizador ou palavra-passe incorrectos.';
        } else if (e.type == DioExceptionType.connectionTimeout ||
                   e.type == DioExceptionType.connectionError) {
          msg = 'Sem ligação ao servidor. Verifica a tua Internet.';
        }
      }
      if (mounted) setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1) Imagem de fundo
          Image.asset(
            'assets/login_bg.jpg',
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => const ColoredBox(
              color: _LoginPalette.navyTie,
            ),
          ),
          // 2) Gradiente escuro para legibilidade
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x66000814),
                  Color(0x99000814),
                  Color(0xE6000814),
                ],
                stops: [0.0, 0.45, 1.0],
              ),
            ),
            child: SizedBox.expand(),
          ),
          // 3) Pinceladas de cor (verde / amarelo) muito subtis no canto
          Positioned(
            top: -80, right: -60,
            child: _BlurBlob(
              size: 220,
              color: _LoginPalette.flagGreen.withValues(alpha: 0.45),
            ),
          ),
          Positioned(
            bottom: -100, left: -80,
            child: _BlurBlob(
              size: 260,
              color: _LoginPalette.flagYellow.withValues(alpha: 0.22),
            ),
          ),

          // 4) Conteúdo
          SafeArea(
            child: LayoutBuilder(
              builder: (ctx, c) => SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: c.maxHeight),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(22, 24, 22, 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 6),
                        _Brand(animation: _fade),
                        const SizedBox(height: 48),
                        FadeTransition(
                          opacity: _fade,
                          child: SlideTransition(
                            position: _slide,
                            child: _GlassCard(
                              child: _LoginForm(
                                userCtrl: _userCtrl,
                                passCtrl: _passCtrl,
                                obscure: _obscure,
                                loading: _loading,
                                remember: _remember,
                                error: _error,
                                onToggleObscure: () =>
                                    setState(() => _obscure = !_obscure),
                                onToggleRemember: (v) =>
                                    setState(() => _remember = v),
                                onSubmit: _submit,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        FadeTransition(
                          opacity: _fade,
                          child: _GhostGlassButton(
                            label: 'Entrar como visitante',
                            icon: LucideIcons.eye,
                            onPressed: () =>
                                context.read<AuthState>().enterAsGuest(),
                          ),
                        ),
                        SizedBox(height: size.height * 0.02),
                        FadeTransition(
                          opacity: _fade,
                          child: _SignupHint(
                            onTap: () {
                              Navigator.of(context).push(MaterialPageRoute(
                                builder: (_) => const SignupStudentPage(),
                              ));
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// ─── Brand (logo + tagline) ────────────────────────────────────────────────
class _Brand extends StatelessWidget {
  final Animation<double> animation;
  const _Brand({required this.animation});
  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: animation,
      child: Row(
        children: [
          Container(
            width: 46, height: 46,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [_LoginPalette.flagGreen, _LoginPalette.flagGreenDark],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(13),
              boxShadow: [
                BoxShadow(
                  color: _LoginPalette.flagGreen.withValues(alpha: 0.5),
                  blurRadius: 18, offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Text(
              'S',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('SAE',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      letterSpacing: 1,
                      fontWeight: FontWeight.w900)),
              SizedBox(height: 2),
              Text('Sistema de Apoio Escolar',
                  style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      letterSpacing: 0.3,
                      fontWeight: FontWeight.w500)),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: _LoginPalette.glass,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: _LoginPalette.glassBorder, width: 0.8),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.globe, color: Colors.white, size: 11),
                SizedBox(width: 5),
                Text('MZ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// ─── Cartão de glassmorphism ───────────────────────────────────────────────
class _GlassCard extends StatelessWidget {
  final Widget child;
  const _GlassCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: const EdgeInsets.fromLTRB(22, 26, 22, 22),
          decoration: BoxDecoration(
            color: _LoginPalette.glass,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: _LoginPalette.glassBorder,
              width: 1,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x55000814),
                blurRadius: 30,
                offset: Offset(0, 18),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class _LoginForm extends StatelessWidget {
  final TextEditingController userCtrl;
  final TextEditingController passCtrl;
  final bool obscure;
  final bool loading;
  final bool remember;
  final String? error;
  final VoidCallback onToggleObscure;
  final ValueChanged<bool> onToggleRemember;
  final VoidCallback onSubmit;

  const _LoginForm({
    required this.userCtrl,
    required this.passCtrl,
    required this.obscure,
    required this.loading,
    required this.remember,
    required this.error,
    required this.onToggleObscure,
    required this.onToggleRemember,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Bem-vindo',
          style: TextStyle(
            color: Colors.white,
            fontSize: 26,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Inicia sessão para continuar a aprender.',
          style: TextStyle(
            color: Colors.white70,
            fontSize: 12.5,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 22),

        _GlassField(
          controller: userCtrl,
          icon: LucideIcons.user,
          label: 'Telefone ou email',
          hint: '+258 84 XXX XXXX',
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 14),
        _GlassField(
          controller: passCtrl,
          icon: LucideIcons.lock,
          label: 'Palavra-passe',
          hint: '••••••••',
          obscure: obscure,
          onSubmitted: (_) => onSubmit(),
          trailing: IconButton(
            tooltip: obscure ? 'Mostrar' : 'Ocultar',
            splashRadius: 18,
            icon: Icon(
              obscure ? LucideIcons.eye : LucideIcons.eyeOff,
              size: 18,
              color: Colors.white70,
            ),
            onPressed: onToggleObscure,
          ),
        ),

        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _RememberToggle(value: remember, onChanged: onToggleRemember),
            TextButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const ForgotPasswordPage(),
                ));
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                minimumSize: const Size(0, 30),
              ),
              child: const Text(
                'Esqueci-me',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  color: _LoginPalette.flagYellow,
                ),
              ),
            ),
          ],
        ),

        if (error != null) ...[
          const SizedBox(height: 14),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: _LoginPalette.flagRed.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _LoginPalette.flagRed.withValues(alpha: 0.55),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.alertCircle,
                    color: Colors.white, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    error!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 18),
        _PrimaryButton(loading: loading, onPressed: loading ? null : onSubmit),
      ],
    );
  }
}

/// ─── Campo de input em vidro ───────────────────────────────────────────────
class _GlassField extends StatelessWidget {
  final TextEditingController controller;
  final IconData icon;
  final String label;
  final String hint;
  final bool obscure;
  final Widget? trailing;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? textInputAction;

  const _GlassField({
    required this.controller,
    required this.icon,
    required this.label,
    required this.hint,
    this.obscure = false,
    this.trailing,
    this.onSubmitted,
    this.textInputAction,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 6),
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
        ),
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: _LoginPalette.glassInput,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _LoginPalette.glassInputBorder,
                  width: 1,
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: Colors.white70),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      obscureText: obscure,
                      onSubmitted: onSubmitted,
                      textInputAction: textInputAction,
                      cursorColor: _LoginPalette.flagYellow,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: InputDecoration(
                        filled: false,
                        fillColor: Colors.transparent,
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        errorBorder: InputBorder.none,
                        disabledBorder: InputBorder.none,
                        hintText: hint,
                        hintStyle: TextStyle(
                          color: Colors.white.withValues(alpha: 0.45),
                          fontWeight: FontWeight.w500,
                        ),
                        isCollapsed: true,
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  if (trailing != null) trailing!,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _RememberToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;
  const _RememberToggle({required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 18, height: 18,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: value ? _LoginPalette.flagGreen : Colors.transparent,
                borderRadius: BorderRadius.circular(5),
                border: Border.all(
                  color: value
                      ? _LoginPalette.flagGreen
                      : Colors.white.withValues(alpha: 0.6),
                  width: 1.4,
                ),
              ),
              child: value
                  ? const Icon(LucideIcons.check,
                      color: Colors.white, size: 12)
                  : null,
            ),
            const SizedBox(width: 8),
            const Text(
              'Manter sessão',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final bool loading;
  final VoidCallback? onPressed;
  const _PrimaryButton({required this.loading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [_LoginPalette.flagGreen, _LoginPalette.flagGreenDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: disabled
            ? []
            : [
                BoxShadow(
                  color: _LoginPalette.flagGreen.withValues(alpha: 0.5),
                  blurRadius: 22,
                  offset: const Offset(0, 10),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: disabled ? null : onPressed,
          child: SizedBox(
            height: 54,
            child: Center(
              child: loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        color: Colors.white,
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Entrar',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                            letterSpacing: 0.2,
                          ),
                        ),
                        SizedBox(width: 8),
                        Icon(LucideIcons.arrowRight,
                            color: Colors.white, size: 18),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GhostGlassButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  const _GhostGlassButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Material(
          color: _LoginPalette.glass,
          child: InkWell(
            onTap: onPressed,
            child: Container(
              height: 52,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _LoginPalette.glassBorder,
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 16, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 13.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SignupHint extends StatelessWidget {
  final VoidCallback onTap;
  const _SignupHint({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: RichText(
            textAlign: TextAlign.center,
            text: const TextSpan(
              style: TextStyle(color: Colors.white70, fontSize: 12),
              children: [
                TextSpan(text: 'Não tens conta?  '),
                TextSpan(
                  text: 'Criar conta de estudante',
                  style: TextStyle(
                    color: _LoginPalette.flagYellow,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Mancha desfocada de cor (para os "highlights" do fundo)
class _BlurBlob extends StatelessWidget {
  final double size;
  final Color color;
  const _BlurBlob({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          boxShadow: [
            BoxShadow(
              color: color,
              blurRadius: 120,
              spreadRadius: 30,
            ),
          ],
        ),
      ),
    );
  }
}
