<?php
// Talent 360 · informe privado de visitas. Requiere el token secreto:
//   cabecera  X-Stats-Token: <token>   (recomendado)   o   ?t=<token>
// Parámetro opcional: days=N (1-366, por defecto 30).
// Por seguridad aquí solo se guarda el SHA-256 del token, no el token.
date_default_timezone_set('America/Lima');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

// ── Configuración
const T360_TOKEN_SHA256 = 'c4581bec97c68cef1aba0ebd822b833dd3df3bb068e18c7ca7e438030c7dc1f8';

function t360_data_dir() {
    $outside = dirname(__DIR__, 3) . '/t360_stats_data';
    if (is_dir($outside) && is_readable($outside . '/counts.json')) return $outside;
    return __DIR__ . '/data';
}

$given = (string)($_SERVER['HTTP_X_STATS_TOKEN'] ?? ($_GET['t'] ?? ''));
if ($given === '' || strlen($given) > 200 || !hash_equals(T360_TOKEN_SHA256, hash('sha256', $given))) {
    usleep(300000);
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}

header('Content-Type: application/json; charset=utf-8');
$days = isset($_GET['days']) ? max(1, min(366, (int)$_GET['days'])) : 30;
$from = date('Y-m-d', strtotime('-' . ($days - 1) . ' days'));
$file = t360_data_dir() . '/counts.json';
$c = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
if (!is_array($c)) $c = ['days' => [], 'refs' => []];

$pages = ['landing', 'careerscore', 'practicas'];
$out = ['generated_at' => date('c'), 'timezone' => 'America/Lima', 'range' => ['from' => $from, 'to' => date('Y-m-d'), 'days' => $days],
        'note' => 'uniques = visitantes únicos por día (no se suman entre días de forma exacta)',
        'totals' => ['views' => 0, 'daily_uniques_sum' => 0, 'pages' => []], 'days' => [], 'top_referrers' => []];
foreach ($pages as $p) $out['totals']['pages'][$p] = ['views' => 0, 'daily_uniques_sum' => 0];

$d = $c['days'] ?? [];
ksort($d);
foreach ($d as $day => $row) {
    if ($day < $from) continue;
    $o = ['pages' => [], 'views' => 0, 'uniques' => (int)($row['_site']['u'] ?? 0)];
    foreach ($pages as $p) {
        $v = (int)($row[$p]['v'] ?? 0); $u = (int)($row[$p]['u'] ?? 0);
        $o['pages'][$p] = ['views' => $v, 'uniques' => $u];
        $o['views'] += $v;
        $out['totals']['pages'][$p]['views'] += $v;
        $out['totals']['pages'][$p]['daily_uniques_sum'] += $u;
    }
    $out['totals']['views'] += $o['views'];
    $out['totals']['daily_uniques_sum'] += $o['uniques'];
    $out['days'][$day] = $o;
}
$refs = [];
foreach (($c['refs'] ?? []) as $day => $list) {
    if ($day < $from || !is_array($list)) continue;
    foreach ($list as $dom => $n) $refs[$dom] = ($refs[$dom] ?? 0) + (int)$n;
}
arsort($refs);
foreach (array_slice($refs, 0, 20, true) as $dom => $n) $out['top_referrers'][] = ['domain' => $dom, 'views' => $n];

if (!$out['days']) $out['days'] = new stdClass();
echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
