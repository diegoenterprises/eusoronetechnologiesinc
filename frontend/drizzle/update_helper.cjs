// Shared helper for lesson content updates
const mysql = require('mysql2/promise');

async function getConn() {
  return mysql.createConnection({
    host: 'eusotrip-mysql.mysql.database.azure.com', user: 'eusotripadmin',
    password: 'EusoTrip2026Prod!', database: 'eusotrip', port: 3306,
    ssl: { rejectUnauthorized: true },
  });
}

// Updates lessons by course slug + module orderIndex + lesson orderIndex
async function updateCourse(slug, modules) {
  const conn = await getConn();
  let ok = 0, total = 0;
  for (const [mi, lessons] of Object.entries(modules)) {
    for (const [li, html] of Object.entries(lessons)) {
      total++;
      try {
        const [rows] = await conn.execute(
          `SELECT l.id FROM training_lessons l
           JOIN lms_modules m ON l.moduleId = m.id
           JOIN training_courses c ON m.courseId = c.id
           WHERE c.slug = ? AND m.orderIndex = ? AND l.orderIndex = ?`,
          [slug, Number(mi), Number(li)]
        );
        if (rows.length > 0) {
          await conn.execute('UPDATE training_lessons SET contentHtml=? WHERE id=?', [html, rows[0].id]);
          ok++;
        } else {
          console.log('  NOT FOUND:', slug, 'mod', mi, 'les', li);
        }
      } catch (e) { console.log('  ERR:', e.message.substring(0, 80)); }
    }
  }
  console.log(`  ${slug}: ${ok}/${total}`);
  await conn.end();
  return ok;
}

module.exports = { updateCourse, getConn };
