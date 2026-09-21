<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['success' => false, 'message' => 'POST requests only.']);

$data = input();
$name = trim((string)($data['name'] ?? ''));
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');
if (mb_strlen($name) < 2) respond(422, ['success' => false, 'message' => 'Please enter your full name.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, ['success' => false, 'message' => 'Please enter a valid email address.']);
if (strlen($password) < 6) respond(422, ['success' => false, 'message' => 'Password must be at least 6 characters.']);

$pdo = db();
$check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) respond(409, ['success' => false, 'message' => 'An account with this email already exists.']);

$insert = $pdo->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
$insert->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
respond(201, ['success' => true, 'message' => 'Account created successfully.']);
