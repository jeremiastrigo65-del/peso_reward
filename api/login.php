<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['success' => false, 'message' => 'POST requests only.']);

$data = input();
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') respond(422, ['success' => false, 'message' => 'Email and password are required.']);

$statement = db()->prepare('SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1');
$statement->execute([$email]);
$user = $statement->fetch();
if (!$user || !password_verify($password, $user['password'])) respond(401, ['success' => false, 'message' => 'Incorrect email or password.']);
respond(200, ['success' => true, 'user' => ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email']]]);
