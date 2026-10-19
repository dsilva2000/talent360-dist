<?php
// Talent 360 · registro anónimo de visitas (Ley 29733: no guarda IP, cookies ni datos personales).
// La IP + navegador solo se usan para un hash con una sal diaria aleatoria que se borra al cambiar el día.
declare(strict_types=0);
date_default_timezone_set('America/Lima');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Content-Type: text/plain; charset=utf-8');

function t360_data_dir() {
    // 1) Fuera de public_html (p. ej. /home/usuario/t360_stats_data); 2) respaldo: stats/data (protegido con .htaccess "deny all").
    $outside = dirname(__DIR__, 3) . '/t360_stats_data';
    if (is_dir($outside) || @mkdir($outside, 0700, true)) {
        if (is_writable($outside)) return $outside;
    }
    $inside = __DIR__ . '/data';
    if (!is_dir($inside)) @mkdir($inside, 0700, true);
    return $inside;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); exit; }

// Mismo origen: si el navegador manda Origin/Referer, debe ser este sitio.
$host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $h) {
    if (!empty($_SERVER[$h])) {
        $oh = strtolower((string)parse_url($_SERVER[$h], PHP_URL_HOST));
        if ($oh !== '' && $oh !== $host) { http_response_code(403); exit; }
    }
}

$ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 400);
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|scrap|preview|headless|phantom|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|facebookexternalhit|linkedin|whatsapp|telegram|discord|slack|embedly|curl|wget|python|java\/|go-http|axios|node-fetch|okhttp|libwww/i', $ua)) {
    http_response_code(204); exit;
}

$raw = file_get_contents('php://input', false, null, 0, 1024);
$in = json_decode((string)$raw, true);
if (!is_array($in)) { http_response_code(400); exit; }
$pages = ['landing', 'careerscore', 'practicas'];
$page = isset($in['p']) && in_array($in['p'], $pages, true) ? $in['p'] : null;
if ($page === null) { http_response_code(400); exit; }

// Referente: solo el dominio, nunca la URL completa.
$ref = '';
if (isset($in['r']) && is_string($in['r'])) {
    $r = strtolower(trim($in['r']));
    $r = preg_replace('/^www\./', '', $r);
    if (strlen($r) <= 100 && preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/', $r)
        && $r !== preg_replace('/^www\./', '', $host)) {
        $ref = $r;
    }
}

$dir = t360_data_dir();
$today = date('Y-m-d');
$lock = fopen($dir . '/.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) { http_response_code(503); exit; }

// Sal diaria: se crea al primer hit del día; las de días anteriores (y su lista de hashes) se borran.
foreach (glob($dir . '/salt-*.key') ?: [] as $f) { if (basename($f) !== "salt-$today.key") @unlink($f); }
foreach (glob($dir . '/uniq-*.txt') ?: [] as $f) { if (basename($f) !== "uniq-$today.txt") @unlink($f); }
$saltFile = "$dir/salt-$today.key";
if (!is_file($saltFile)) { file_put_contents($saltFile, bin2hex(random_bytes(32))); @chmod($saltFile, 0600); }
$salt = trim((string)file_get_contents($saltFile));

$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
$visitor = substr(hash_hmac('sha256', $ip . '|' . $ua, $salt), 0, 20);

$uniqFile = "$dir/uniq-$today.txt";
$seen = is_file($uniqFile) ? (string)file_get_contents($uniqFile) : '';
$newSite = strpos($seen, "*:$visitor\n") === false;
$newPage = strpos($seen, "$page:$visitor\n") === false;
// Tope antiabuso: un mismo visitante suma como máximo 50 vistas por página al día.
$cntKey = "n:$page:$visitor:";
$count = substr_count($seen, $cntKey);
$add = '';
if ($newSite) $add .= "*:$visitor\n";
if ($newPage) $add .= "$page:$visitor\n";
if ($count < 50) $add .= $cntKey . "\n";
if ($add !== '') { file_put_contents($uniqFile, $add, FILE_APPEND); @chmod($uniqFile, 0600); }

if ($count < 50) {
    $countsFile = "$dir/counts.json";
    $c = is_file($countsFile) ? json_decode((string)file_get_contents($countsFile), true) : null;
    if (!is_array($c)) $c = ['days' => [], 'refs' => []];
    if (!isset($c['days'][$today])) $c['days'][$today] = ['_site' => ['u' => 0]];
    if (!isset($c['days'][$today][$page])) $c['days'][$today][$page] = ['v' => 0, 'u' => 0];
    $c['days'][$today][$page]['v']++;
    if ($newPage) $c['days'][$today][$page]['u']++;
    if ($newSite) $c['days'][$today]['_site']['u']++;
    if ($ref !== '') {
        if (!isset($c['refs'][$today])) $c['refs'][$today] = [];
        $c['refs'][$today][$ref] = ($c['refs'][$today][$ref] ?? 0) + 1;
        if (count($c['refs'][$today]) > 300) { arsort($c['refs'][$today]); $c['refs'][$today] = array_slice($c['refs'][$today], 0, 300, true); }
    }
    $tmp = $countsFile . '.tmp';
    file_put_contents($tmp, json_encode($c));
    @chmod($tmp, 0600);
    rename($tmp, $countsFile);
}
flock($lock, LOCK_UN);
fclose($lock);
http_response_code(204);
