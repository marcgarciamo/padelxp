import postgres from 'postgres';

const url = process.env.DATABASE_URL;
console.log('URL:', url?.slice(0, 50) + '...');

const sql = postgres(url, { ssl: 'require' });

try {
  const result = await sql`SELECT 1 as test`;
  console.log('Conexion OK:', result);
  await sql.end();
} catch (e) {
  console.error('Error de conexion:', e.message);
}
process.exit(0);