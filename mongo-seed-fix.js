// Limpa categorias com encoding partido e re-cria em UTF-8 limpo
db.categories.deleteMany({});

const matRoot   = db.categories.insertOne({ name: 'Matemática',  description: 'Materiais de Matemática',         parent_id: null }).insertedId;
const portRoot  = db.categories.insertOne({ name: 'Português',   description: 'Língua Portuguesa',               parent_id: null }).insertedId;
const fisRoot   = db.categories.insertOne({ name: 'Física',      description: 'Ciências Físicas',                parent_id: null }).insertedId;
const quiRoot   = db.categories.insertOne({ name: 'Química',     description: 'Química Geral e Orgânica',        parent_id: null }).insertedId;
const histRoot  = db.categories.insertOne({ name: 'História',    description: 'História de Moçambique e Universal', parent_id: null }).insertedId;
const bioRoot   = db.categories.insertOne({ name: 'Biologia',    description: 'Ciências da Vida',                parent_id: null }).insertedId;
const ingRoot   = db.categories.insertOne({ name: 'Inglês',      description: 'English Language',                parent_id: null }).insertedId;
const infoRoot  = db.categories.insertOne({ name: 'Informática', description: 'Computação e Tecnologia',         parent_id: null }).insertedId;

db.categories.insertMany([
  { name: 'Álgebra',          description: 'Equações e expressões',     parent_id: matRoot.toString() },
  { name: 'Geometria',        description: 'Formas, áreas e volumes',   parent_id: matRoot.toString() },
  { name: 'Trigonometria',    description: 'Razões trigonométricas',    parent_id: matRoot.toString() },
  { name: 'Cálculo',          description: 'Cálculo Diferencial e Integral', parent_id: matRoot.toString() },
  { name: 'Gramática',        description: 'Regras gramaticais',         parent_id: portRoot.toString() },
  { name: 'Literatura',       description: 'Análise de obras literárias',parent_id: portRoot.toString() },
  { name: 'Redação',          description: 'Composição e produção textual', parent_id: portRoot.toString() },
  { name: 'Mecânica',         description: 'Cinemática e dinâmica',      parent_id: fisRoot.toString() },
  { name: 'Electromagnetismo',description: 'Electricidade e magnetismo', parent_id: fisRoot.toString() },
  { name: 'Programação',      description: 'Algoritmos e linguagens',    parent_id: infoRoot.toString() },
  { name: 'Bases de Dados',   description: 'SQL e modelação',            parent_id: infoRoot.toString() },
  { name: 'Redes',            description: 'Protocolos e arquitetura',   parent_id: infoRoot.toString() }
]);

print('total: ' + db.categories.countDocuments());
db.categories.find({ parent_id: null }).forEach(c => print(c.name));