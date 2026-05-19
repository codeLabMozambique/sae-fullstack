import 'api_client.dart';

class QuizSummary {
  final int id;
  final String titulo;
  final String? descricao;
  final String? disciplina;
  final String? disciplinaLabel;
  final int questionCount;
  final int? tempoLimiteMinutos;
  final bool active;
  final String? createdBy;
  final int myAttempts;
  final double? bestScore;

  QuizSummary({
    required this.id,
    required this.titulo,
    this.descricao,
    this.disciplina,
    this.disciplinaLabel,
    this.questionCount = 0,
    this.tempoLimiteMinutos,
    this.active = true,
    this.createdBy,
    this.myAttempts = 0,
    this.bestScore,
  });

  factory QuizSummary.fromJson(Map<String, dynamic> j) => QuizSummary(
        id: (j['id'] as num).toInt(),
        titulo: j['titulo'] ?? '',
        descricao: j['descricao'],
        disciplina: j['disciplina'],
        disciplinaLabel: j['disciplinaLabel'],
        questionCount: (j['questionCount'] as num?)?.toInt() ?? 0,
        tempoLimiteMinutos:
            j['tempoLimiteMinutos'] == null ? null : (j['tempoLimiteMinutos'] as num).toInt(),
        active: j['active'] == true,
        createdBy: j['createdBy'],
        myAttempts: (j['myAttempts'] as num?)?.toInt() ?? 0,
        bestScore: j['bestScore'] == null ? null : (j['bestScore'] as num).toDouble(),
      );
}

class QuizOption {
  final int id;
  final String texto;
  final String letra;
  final bool? correta;
  QuizOption({required this.id, required this.texto, required this.letra, this.correta});
  factory QuizOption.fromJson(Map<String, dynamic> j) => QuizOption(
        id: (j['id'] as num).toInt(),
        texto: j['texto'] ?? '',
        letra: j['letra'] ?? '',
        correta: j['correta'] as bool?,
      );
  Map<String, dynamic> toCreateJson() => {'texto': texto, 'letra': letra, 'correta': correta ?? false};
}

class QuizQuestion {
  final int id;
  final String enunciado;
  final int ordemNumero;
  final List<QuizOption> options;
  final String? explicacao;
  QuizQuestion({
    required this.id,
    required this.enunciado,
    required this.ordemNumero,
    required this.options,
    this.explicacao,
  });
  factory QuizQuestion.fromJson(Map<String, dynamic> j) => QuizQuestion(
        id: (j['id'] as num).toInt(),
        enunciado: j['enunciado'] ?? '',
        ordemNumero: (j['ordemNumero'] as num?)?.toInt() ?? 0,
        explicacao: j['explicacao'],
        options: (j['options'] as List? ?? [])
            .cast<Map<String, dynamic>>()
            .map(QuizOption.fromJson)
            .toList(),
      );
}

class Quiz {
  final int id;
  final String titulo;
  final String descricao;
  final String? disciplina;
  final int? tempoLimiteMinutos;
  final List<QuizQuestion> questions;
  Quiz({
    required this.id,
    required this.titulo,
    required this.descricao,
    required this.questions,
    this.disciplina,
    this.tempoLimiteMinutos,
  });
  factory Quiz.fromJson(Map<String, dynamic> j) => Quiz(
        id: (j['id'] as num).toInt(),
        titulo: j['titulo'] ?? '',
        descricao: j['descricao'] ?? '',
        disciplina: j['disciplina'],
        tempoLimiteMinutos:
            j['tempoLimiteMinutos'] == null ? null : (j['tempoLimiteMinutos'] as num).toInt(),
        questions: (j['questions'] as List? ?? [])
            .cast<Map<String, dynamic>>()
            .map(QuizQuestion.fromJson)
            .toList(),
      );
}

class StartAttempt {
  final int attemptId;
  final Quiz quiz;
  StartAttempt({required this.attemptId, required this.quiz});
  factory StartAttempt.fromJson(Map<String, dynamic> j) => StartAttempt(
        attemptId: (j['attemptId'] as num).toInt(),
        quiz: Quiz.fromJson(j['quiz'] as Map<String, dynamic>),
      );
}

class QuestionResult {
  final int questionId;
  final String enunciado;
  final int? selectedOptionId;
  final String? selectedOptionLetra;
  final String? selectedOptionTexto;
  final int correctOptionId;
  final String correctOptionLetra;
  final String correctOptionTexto;
  final bool correct;
  final String? explicacao;
  QuestionResult({
    required this.questionId,
    required this.enunciado,
    required this.correctOptionId,
    required this.correctOptionLetra,
    required this.correctOptionTexto,
    required this.correct,
    this.selectedOptionId,
    this.selectedOptionLetra,
    this.selectedOptionTexto,
    this.explicacao,
  });
  factory QuestionResult.fromJson(Map<String, dynamic> j) => QuestionResult(
        questionId: (j['questionId'] as num).toInt(),
        enunciado: j['enunciado'] ?? '',
        selectedOptionId:
            j['selectedOptionId'] == null ? null : (j['selectedOptionId'] as num).toInt(),
        selectedOptionLetra: j['selectedOptionLetra'],
        selectedOptionTexto: j['selectedOptionTexto'],
        correctOptionId: (j['correctOptionId'] as num).toInt(),
        correctOptionLetra: j['correctOptionLetra'] ?? '',
        correctOptionTexto: j['correctOptionTexto'] ?? '',
        correct: j['correct'] == true,
        explicacao: j['explicacao'],
      );
}

class QuizResult {
  final int attemptId;
  final int quizId;
  final String quizTitulo;
  final double score;
  final int correctAnswers;
  final int totalQuestions;
  final int timeSpentSeconds;
  final List<QuestionResult> questionResults;
  QuizResult({
    required this.attemptId,
    required this.quizId,
    required this.quizTitulo,
    required this.score,
    required this.correctAnswers,
    required this.totalQuestions,
    required this.timeSpentSeconds,
    required this.questionResults,
  });
  factory QuizResult.fromJson(Map<String, dynamic> j) => QuizResult(
        attemptId: (j['attemptId'] as num).toInt(),
        quizId: (j['quizId'] as num).toInt(),
        quizTitulo: j['quizTitulo'] ?? '',
        score: (j['score'] as num).toDouble(),
        correctAnswers: (j['correctAnswers'] as num).toInt(),
        totalQuestions: (j['totalQuestions'] as num).toInt(),
        timeSpentSeconds: (j['timeSpentSeconds'] as num?)?.toInt() ?? 0,
        questionResults: (j['questionResults'] as List? ?? [])
            .cast<Map<String, dynamic>>()
            .map(QuestionResult.fromJson)
            .toList(),
      );
}

class Certificate {
  final int id;
  final int quizId;
  final String quizTitulo;
  final String? disciplinaLabel;
  final double score;
  final String issuedAt;
  Certificate({
    required this.id,
    required this.quizId,
    required this.quizTitulo,
    required this.score,
    required this.issuedAt,
    this.disciplinaLabel,
  });
  factory Certificate.fromJson(Map<String, dynamic> j) => Certificate(
        id: (j['id'] as num).toInt(),
        quizId: (j['quizId'] as num).toInt(),
        quizTitulo: j['quizTitulo'] ?? '',
        disciplinaLabel: j['disciplinaLabel'],
        score: (j['score'] as num).toDouble(),
        issuedAt: j['issuedAt']?.toString() ?? '',
      );
}

class QuizService {
  final _api = ApiClient.instance.dio;

  Future<List<QuizSummary>> listQuizzes({String? disciplina}) async {
    final res = await _api.get('/quiz/quizzes',
        queryParameters: disciplina == null ? {} : {'disciplina': disciplina});
    return (res.data as List).cast<Map<String, dynamic>>().map(QuizSummary.fromJson).toList();
  }

  Future<Quiz> getQuiz(int id) async {
    final res = await _api.get('/quiz/quizzes/$id');
    return Quiz.fromJson(res.data as Map<String, dynamic>);
  }

  Future<StartAttempt> startAttempt(int quizId) async {
    final res = await _api.post('/quiz/attempts/start', queryParameters: {'quizId': quizId});
    return StartAttempt.fromJson(res.data as Map<String, dynamic>);
  }

  Future<QuizResult> submitAttempt(int attemptId, Map<int, int?> answers) async {
    final body = {
      'answers': answers.entries
          .map((e) => {'questionId': e.key, 'selectedOptionId': e.value})
          .toList(),
    };
    final res = await _api.post('/quiz/attempts/$attemptId/submit', data: body);
    return QuizResult.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<QuizSummary>> getMyAttempts() async {
    final res = await _api.get('/quiz/attempts/my');
    return (res.data as List).cast<Map<String, dynamic>>().map(QuizSummary.fromJson).toList();
  }

  Future<List<Certificate>> getMyCertificates() async {
    final res = await _api.get('/quiz/certificates/my');
    return (res.data as List).cast<Map<String, dynamic>>().map(Certificate.fromJson).toList();
  }

  Future<List<String>> disciplinesAll() async {
    final res = await _api.get('/quiz/disciplines/all');
    return (res.data as List).map((e) => e.toString()).toList();
  }

  // Professor
  Future<Quiz> getQuizForAdmin(int id) async {
    final res = await _api.get('/quiz/quizzes/$id/manage');
    return Quiz.fromJson(res.data as Map<String, dynamic>);
  }

  Future<QuizSummary> createQuiz({
    required String titulo,
    required String descricao,
    required String disciplina,
    int? tempoLimiteMinutos,
  }) async {
    final res = await _api.post('/quiz/quizzes', data: {
      'titulo': titulo,
      'descricao': descricao,
      'disciplina': disciplina,
      'tempoLimiteMinutos': tempoLimiteMinutos,
    });
    final j = res.data as Map<String, dynamic>;
    return QuizSummary.fromJson(j);
  }

  Future<void> addQuestion(int quizId, {
    required String enunciado,
    required List<QuizOption> options,
  }) async {
    await _api.post('/quiz/quizzes/$quizId/questions', data: {
      'enunciado': enunciado,
      'options': options.map((o) => o.toCreateJson()).toList(),
    });
  }

  Future<void> toggleActive(int quizId) =>
      _api.put('/quiz/quizzes/$quizId/toggle-active');

  Future<void> deleteQuiz(int quizId) => _api.delete('/quiz/quizzes/$quizId');
}
