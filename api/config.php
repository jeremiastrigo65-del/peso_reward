<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Optional local overrides.
// This file should NOT be committed to Git.
$localConfig = __DIR__ . '/config.local.php';
$settings = is_file($localConfig) ? require $localConfig : [];

if (!is_array($settings)) {
    $settings = [];
}

function setting(string $name, string $default = ''): string
{
    global $settings;

    $environmentValue = getenv($name);

    if ($environmentValue !== false && $environmentValue !== '') {
        return $environmentValue;
    }

    return isset($settings[$name]) ? (string)$settings[$name] : $default;
}


// ============================================================
// CORS
// ============================================================

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = array_filter(
    array_map(
        'trim',
        explode(',', setting('ALLOWED_ORIGINS'))
    )
);

$isLocalOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1)(:\d+)?$#',
    $origin
);

if (
    $origin !== '' &&
    (
        in_array($origin, $allowedOrigins, true) ||
        (!$allowedOrigins && $isLocalOrigin)
    )
) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


// ============================================================
// RESPONSE
// ============================================================

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}


// ============================================================
// INPUT
// ============================================================

function input(): array
{
    $body = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($body)) {
        respond(
            400,
            [
                'success' => false,
                'message' => 'Invalid request body.'
            ]
        );
    }

    return $body;
}


// ============================================================
// DATABASE
// ============================================================

function db(): PDO
{
    /*
     * Local Laragon defaults:
     *
     * DB_HOST = 127.0.0.1
     * DB_PORT = 3306
     * DB_NAME = tripeso_reward
     * DB_USER = root
     * DB_PASSWORD = ''
     *
     * Production:
     * Set these values as Vercel Environment Variables.
     */

    $host = setting('DB_HOST', '127.0.0.1');
    $port = setting('DB_PORT', '3306');
    $database = setting('DB_NAME', 'tripeso_reward');
    $username = setting('DB_USER', 'root');
    $password = setting('DB_PASSWORD', '');

    try {

        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

        return new PDO(
            $dsn,
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );

    } catch (PDOException $exception) {

        error_log($exception->getMessage());

        respond(
            500,
            [
                'success' => false,
                'message' => 'Database connection failed.'
            ]
        );
    }
}