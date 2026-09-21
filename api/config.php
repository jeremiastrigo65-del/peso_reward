<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Vite may select 5173, 5174, etc. during local development.
// Only echo localhost origins; do not use this permissive rule in production.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^http://(localhost|127\\.0\\.0\\.1)(:\\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function input(): array {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) respond(400, ['success' => false, 'message' => 'Invalid request body.']);
    return $body;
}

function db(): PDO {
    // Laragon's usual local defaults. Change these if your MySQL account differs.
    $host = '127.0.0.1';
    $database = 'tripeso_reward';
    $username = 'root';
    $password = '';
    try {
        return new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $exception) {
        error_log($exception->getMessage());
        respond(500, ['success' => false, 'message' => 'Database connection failed.']);
    }
}
