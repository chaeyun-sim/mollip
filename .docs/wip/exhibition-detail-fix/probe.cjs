const fs = require('fs');
const env = {};
for (const f of ['.env', '.env.local']) {
 for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
 }
}
(async () => {
 const source = fs.readFileSync('src/hooks/queries/useExhibitionDetail.ts', 'utf8');
 const columns = fs.readFileSync('src/utils/exhibitionMapper.ts', 'utf8').match(/EXHIBITION_COLUMNS =\s*'([^']+)'/)[1];
 const select = source.match(/`(\$\{EXHIBITION_COLUMNS\}, museums[^`]+)`/)[1].replace('${EXHIBITION_COLUMNS}', columns);
 const filter = process.argv[2] ? '&venue_name_fallback=ilike.' + encodeURIComponent('%' + process.argv[2] + '%') : '';
 const response = await fetch(env.EXPO_PUBLIC_SUPABASE_URL + '/rest/v1/exhibitions?select=' + encodeURIComponent(select) + filter + '&limit=5', {
  headers: { apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.EXPO_PUBLIC_SUPABASE_ANON_KEY}` },
 });
 const data = await response.json();
 console.log(JSON.stringify({ status: response.status, result: response.ok ? data.map(row => ({ id: row.id, title: row.title, museum: row.museums?.name ?? null })) : data }, null, 2));
 if (!response.ok) process.exitCode = 1;
})();
