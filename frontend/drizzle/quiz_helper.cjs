/**
 * Quiz Update Helper — replaces all questions for a course's quizzes
 * with comprehensive, regulatory-specific question banks.
 *
 * Usage: require('./quiz_helper.cjs').updateQuizzes(slug, moduleQuizzes)
 *   where moduleQuizzes = { 1: { title, timeLimit, questions: [...] }, 2: ... }
 */
const mysql = require('mysql2/promise');

let _conn = null;
async function getConn() {
  if (_conn) return _conn;
  _conn = await mysql.createConnection({
    host: 'eusotrip-mysql.mysql.database.azure.com',
    user: 'eusotripadmin',
    password: 'EusoTrip2026Prod!',
    database: 'eusotrip',
    port: 3306,
    ssl: { rejectUnauthorized: true },
    connectTimeout: 15000,
  });
  return _conn;
}

async function updateQuizzes(slug, moduleQuizzes) {
  const conn = await getConn();

  // Get course
  const [courses] = await conn.execute(
    'SELECT id FROM training_courses WHERE slug = ?', [slug]
  );
  if (!courses.length) { console.error('  ✗ Course not found:', slug); return; }
  const courseId = courses[0].id;

  // Get modules ordered
  const [modules] = await conn.execute(
    'SELECT id, orderIndex, title FROM lms_modules WHERE courseId = ? ORDER BY orderIndex', [courseId]
  );

  let totalQ = 0;
  for (const [modIdx, quizData] of Object.entries(moduleQuizzes)) {
    const mod = modules.find(m => m.orderIndex === Number(modIdx));
    if (!mod) { console.error(`  ✗ Module ${modIdx} not found for ${slug}`); continue; }

    // Find or create quiz
    const [quizzes] = await conn.execute(
      'SELECT id FROM training_quizzes WHERE moduleId = ? LIMIT 1', [mod.id]
    );
    let quizId;
    if (quizzes.length) {
      quizId = quizzes[0].id;
      // Delete existing questions
      await conn.execute('DELETE FROM training_quiz_questions WHERE quizId = ?', [quizId]);
      // Update quiz metadata
      await conn.execute(
        `UPDATE training_quizzes SET title = ?, timeLimitMinutes = ?, questionCount = ?, passingScore = 80 WHERE id = ?`,
        [quizData.title || `${mod.title} Quiz`, quizData.timeLimit || 30, quizData.questions.length, quizId]
      );
    } else {
      const [result] = await conn.execute(
        `INSERT INTO training_quizzes (moduleId, title, description, passingScore, timeLimitMinutes, questionCount, randomizeQuestions, allowRetakes, maxRetakes, status)
         VALUES (?, ?, ?, 80, ?, ?, TRUE, TRUE, 3, 'active')`,
        [mod.id, quizData.title || `${mod.title} Quiz`, `Comprehensive assessment for ${mod.title}`, quizData.timeLimit || 30, quizData.questions.length]
      );
      quizId = result.insertId;
    }

    // Insert new questions
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      await conn.execute(
        `INSERT INTO training_quiz_questions (quizId, questionText, questionType, options, correctAnswer, explanation, difficulty, regulationReference, orderIndex)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [quizId, q.text, q.type, JSON.stringify(q.options), q.correct, q.explanation, q.difficulty || 'medium', q.ref || null, i + 1]
      );
      totalQ++;
    }
  }

  console.log(`  ${slug}: ${totalQ} questions across ${Object.keys(moduleQuizzes).length} modules`);
}

// Helper constructors
function mc(text, opts, correctIdx, explanation, difficulty, ref) {
  const L = ['A','B','C','D','E'];
  return {
    text, type: 'multiple_choice',
    options: opts.map((o,i) => ({ id: L[i], text: o, isCorrect: i === correctIdx })),
    correct: L[correctIdx], explanation, difficulty: difficulty || 'medium', ref: ref || null,
  };
}

function tf(text, isTrue, explanation, difficulty, ref) {
  return {
    text, type: 'true_false',
    options: [{ id: 'T', text: 'True', isCorrect: isTrue }, { id: 'F', text: 'False', isCorrect: !isTrue }],
    correct: isTrue ? 'T' : 'F', explanation, difficulty: difficulty || 'easy', ref: ref || null,
  };
}

function scenario(text, opts, correctIdx, explanation, difficulty, ref) {
  const L = ['A','B','C','D','E'];
  return {
    text, type: 'scenario',
    options: opts.map((o,i) => ({ id: L[i], text: o, isCorrect: i === correctIdx })),
    correct: L[correctIdx], explanation, difficulty: difficulty || 'hard', ref: ref || null,
  };
}

module.exports = { updateQuizzes, getConn, mc, tf, scenario };
