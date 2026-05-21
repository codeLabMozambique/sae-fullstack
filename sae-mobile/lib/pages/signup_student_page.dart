import 'dart:ui';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/auth_service.dart';

class _Pal {
  static const flagGreen     = Color(0xFF009A4E);
  static const flagGreenDark = Color(0xFF00713A);
  static const flagYellow    = Color(0xFFFCD116);
  static const flagRed       = Color(0xFFD32027);
  static const navy          = Color(0xFF0E1B3D);
  static const glass         = Color(0x33FFFFFF);
  static const glassBorder   = Color(0x55FFFFFF);
  static const glassInput    = Color(0x22FFFFFF);
}

class SignupStudentPage extends StatefulWidget {
  const SignupStudentPage({super.key});
  @override
  State<SignupStudentPage> createState() => _SignupStudentPageState();
}

class _SignupStudentPageState extends State<SignupStudentPage> {
  final _service = AuthService();

  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _age = TextEditingController();

  // Catálogo de níveis (espelha a BD em ac_CLASS_LEVEL — Ensino Secundário).
  static const _levels = <String>[
    '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe',
  ];
  String? _selectedLevel;

  bool _obscure = true;
  bool _loading = false;
  bool _done = false;
  String? _error;

  List<SchoolOption> _schools = [];
  SchoolOption? _selectedSchool;
  bool _loadingSchools = true;

  @override
  void initState() {
    super.initState();
    _loadSchools();
  }

  Future<void> _loadSchools() async {
    try {
      final s = await _service.listSchools();
      if (!mounted) return;
      setState(() {
        _schools = s;
        _loadingSchools = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingSchools = false);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    _age.dispose();
    super.dispose();
  }

  String _normalisePhone(String raw) {
    final v = raw.trim().replaceAll(RegExp(r'[\s\-()]+'), '');
    if (v.isEmpty) return v;
    if (v.startsWith('+258')) return v;
    if (v.startsWith('00258')) return '+${v.substring(2)}';
    if (v.startsWith('258')) return '+$v';
    if (RegExp(r'^8[2-7]\d{7}$').hasMatch(v)) return '+258$v';
    return v;
  }

  bool _isValidPhone(String v) =>
      RegExp(r'^\+258(8[2-7])\d{7}$').hasMatch(v);

  bool _isValidEmail(String v) =>
      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v);

  Future<void> _submit() async {
    setState(() => _error = null);

    final name = _name.text.trim();
    final phone = _normalisePhone(_phone.text);
    final email = _email.text.trim();
    final pass = _password.text;
    final grade = _selectedLevel ?? '';
    final ageRaw = _age.text.trim();

    if (name.isEmpty || phone.isEmpty || email.isEmpty || pass.isEmpty ||
        _selectedSchool == null) {
      setState(() => _error = 'Preenche os campos obrigatórios (*).');
      return;
    }
    if (!_isValidPhone(phone)) {
      setState(() => _error = 'Telefone moçambicano inválido (82 a 87).');
      return;
    }
    if (!_isValidEmail(email)) {
      setState(() => _error = 'Email inválido.');
      return;
    }
    if (pass.length < 6) {
      setState(() => _error = 'A palavra-passe deve ter no mínimo 6 caracteres.');
      return;
    }
    int? age;
    if (ageRaw.isNotEmpty) {
      age = int.tryParse(ageRaw);
      if (age == null || age < 5 || age > 99) {
        setState(() => _error = 'Idade inválida.');
        return;
      }
    }

    setState(() => _loading = true);
    try {
      await _service.signupStudent(
        fullname: name,
        nTelefone: phone,
        email: email,
        password: pass,
        schoolId: _selectedSchool!.id,
        grade: grade,
        age: age,
      );
      if (mounted) setState(() => _done = true);
    } catch (e) {
      String msg = 'Não foi possível criar a conta.';
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map && data['message'] is String) {
          msg = data['message'] as String;
        } else if (data is Map && data['error'] is String) {
          msg = data['error'] as String;
        }
      }
      if (mounted) setState(() => _error = msg);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/login_bg.jpg',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  const ColoredBox(color: _Pal.navy)),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Color(0x80000814), Color(0xEE000814)],
              ),
            ),
            child: SizedBox.expand(),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(22, 8, 22, 28),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(children: [
                    IconButton(
                      icon: const Icon(LucideIcons.arrowLeft,
                          color: Colors.white),
                      onPressed: () => Navigator.of(context).maybePop(),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'Criar conta de estudante',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ]),
                  const SizedBox(height: 18),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 22),
                        decoration: BoxDecoration(
                          color: _Pal.glass,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: _Pal.glassBorder),
                        ),
                        child: _done ? _success() : _form(),
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

  Widget _success() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Center(
          child: Icon(LucideIcons.checkCircle2,
              color: _Pal.flagYellow, size: 60),
        ),
        const SizedBox(height: 14),
        const Text(
          'Conta criada!',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Já podes iniciar sessão com o número de telefone '
          'e a palavra-passe que escolheste.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white70,
            fontSize: 13.5,
            height: 1.45,
          ),
        ),
        const SizedBox(height: 22),
        _PrimaryButton(
          label: 'Ir para o login',
          loading: false,
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ],
    );
  }

  Widget _form() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Bem-vindo ao SAE',
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Cria a tua conta de estudante e começa a estudar.',
          style: TextStyle(
            color: Colors.white70,
            fontSize: 12.5,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 22),
        _GlassField(
          controller: _name,
          icon: LucideIcons.user,
          label: 'Nome completo *',
          hint: 'Ex.: Maria António',
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 12),
        _GlassField(
          controller: _phone,
          icon: LucideIcons.phone,
          label: 'Telefone *',
          hint: '+258 84 XXX XXXX',
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        _GlassField(
          controller: _email,
          icon: LucideIcons.mail,
          label: 'Email *',
          hint: 'nome@dominio.com',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        _SchoolDropdown(
          loading: _loadingSchools,
          schools: _schools,
          selected: _selectedSchool,
          onChanged: (s) => setState(() => _selectedSchool = s),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            flex: 3,
            child: _LevelDropdown(
              levels: _levels,
              selected: _selectedLevel,
              onChanged: (v) => setState(() => _selectedLevel = v),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: _GlassField(
              controller: _age,
              icon: LucideIcons.calendar,
              label: 'Idade',
              hint: 'Ex.: 18',
              keyboardType: TextInputType.number,
            ),
          ),
        ]),
        const SizedBox(height: 12),
        _GlassField(
          controller: _password,
          icon: LucideIcons.lock,
          label: 'Palavra-passe *',
          hint: 'Mínimo 6 caracteres',
          obscure: _obscure,
          trailing: IconButton(
            splashRadius: 18,
            icon: Icon(_obscure ? LucideIcons.eye : LucideIcons.eyeOff,
                size: 18, color: Colors.white70),
            onPressed: () => setState(() => _obscure = !_obscure),
          ),
        ),

        if (_error != null) ...[
          const SizedBox(height: 14),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: _Pal.flagRed.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: _Pal.flagRed.withValues(alpha: 0.55)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.alertCircle,
                    color: Colors.white, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_error!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      )),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 20),
        _PrimaryButton(
          label: 'Criar conta',
          loading: _loading,
          onPressed: _loading ? null : _submit,
        ),
        const SizedBox(height: 12),
        Center(
          child: RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: const TextStyle(color: Colors.white70, fontSize: 12),
              children: [
                const TextSpan(text: 'Já tens conta?  '),
                TextSpan(
                  text: 'Inicia sessão',
                  style: const TextStyle(
                    color: _Pal.flagYellow,
                    fontWeight: FontWeight.w800,
                  ),
                  recognizer: null,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _LevelDropdown extends StatelessWidget {
  final List<String> levels;
  final String? selected;
  final ValueChanged<String?> onChanged;
  const _LevelDropdown({
    required this.levels,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 6),
          child: Text('Classe',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              )),
        ),
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: _Pal.glassInput,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0x44FFFFFF)),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Row(
                children: [
                  const Icon(LucideIcons.graduationCap,
                      size: 18, color: Colors.white70),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: selected,
                        hint: const Text('Selecciona',
                            style: TextStyle(
                              color: Colors.white54,
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                            )),
                        icon: const Icon(LucideIcons.chevronDown,
                            color: Colors.white70, size: 18),
                        dropdownColor: const Color(0xFF0E1B3D),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        items: levels
                            .map((l) => DropdownMenuItem(
                                  value: l,
                                  child: Text(l,
                                      overflow: TextOverflow.ellipsis),
                                ))
                            .toList(),
                        onChanged: onChanged,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _SchoolDropdown extends StatelessWidget {
  final bool loading;
  final List<SchoolOption> schools;
  final SchoolOption? selected;
  final ValueChanged<SchoolOption?> onChanged;
  const _SchoolDropdown({
    required this.loading,
    required this.schools,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 6),
          child: Text('Instituição de ensino *',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              )),
        ),
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: _Pal.glassInput,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0x44FFFFFF)),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Row(
                children: [
                  const Icon(LucideIcons.school,
                      size: 18, color: Colors.white70),
                  const SizedBox(width: 10),
                  Expanded(
                    child: loading
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 14),
                            child: Text('A carregar instituições…',
                                style: TextStyle(
                                  color: Colors.white54,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 14,
                                )),
                          )
                        : DropdownButtonHideUnderline(
                            child: DropdownButton<SchoolOption>(
                              isExpanded: true,
                              value: selected,
                              hint: const Text('Selecciona a escola',
                                  style: TextStyle(
                                    color: Colors.white54,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 14,
                                  )),
                              icon: const Icon(LucideIcons.chevronDown,
                                  color: Colors.white70, size: 18),
                              dropdownColor: const Color(0xFF0E1B3D),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              items: schools
                                  .map((s) => DropdownMenuItem(
                                        value: s,
                                        child: Text(s.label,
                                            overflow:
                                                TextOverflow.ellipsis),
                                      ))
                                  .toList(),
                              onChanged: onChanged,
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _GlassField extends StatelessWidget {
  final TextEditingController controller;
  final IconData icon;
  final String label;
  final String hint;
  final bool obscure;
  final Widget? trailing;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;

  const _GlassField({
    required this.controller,
    required this.icon,
    required this.label,
    required this.hint,
    this.obscure = false,
    this.trailing,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 6),
          child: Text(label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              )),
        ),
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: _Pal.glassInput,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0x44FFFFFF)),
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
                      keyboardType: keyboardType,
                      textCapitalization: textCapitalization,
                      cursorColor: _Pal.flagYellow,
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

class _PrimaryButton extends StatelessWidget {
  final bool loading;
  final VoidCallback? onPressed;
  final String label;
  const _PrimaryButton({
    required this.loading,
    required this.onPressed,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [_Pal.flagGreen, _Pal.flagGreenDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: disabled
            ? []
            : [
                BoxShadow(
                  color: _Pal.flagGreen.withValues(alpha: 0.5),
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
                      width: 22, height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.4, color: Colors.white),
                    )
                  : Text(label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      )),
            ),
          ),
        ),
      ),
    );
  }
}
