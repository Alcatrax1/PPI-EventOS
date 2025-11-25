<?php
require 'db_connect.php';

echo "<h1>Atualizando Banco de Dados...</h1>";

$commands = [
    // 1. Tabela de Categorias
    "CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE
    )",
    
    // 2. Tabela de Comentários/Avaliações
    "CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT,
        rating INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )",

    // 3. Tabela de Favoritos
    "CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )",

    // 4. Tabela de Lista de Espera
    "CREATE TABLE IF NOT EXISTS waitlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('waiting', 'notified', 'enrolled') DEFAULT 'waiting',
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )",

    // 5. Tabela de Cupons
    "CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        discount_percent INT NOT NULL,
        max_uses INT DEFAULT 100,
        used_count INT DEFAULT 0,
        expires_at DATETIME
    )",

    // 6. Adicionar Categoria na Tabela de Eventos (se não existir)
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id INT DEFAULT NULL",
    
    // 7. Inserir algumas categorias padrão
    "INSERT IGNORE INTO categories (name, slug) VALUES 
    ('Tecnologia', 'tecnologia'),
    ('Workshop', 'workshop'),
    ('Música', 'musica'),
    ('Negócios', 'negocios'),
    ('Educação', 'educacao')"
];

foreach ($commands as $sql) {
    try {
        $pdo->exec($sql);
        echo "<p style='color: green'>Sucesso: " . substr($sql, 0, 50) . "...</p>";
    } catch (PDOException $e) {
        // Ignora erro de coluna duplicada (se já rodou antes)
        if (strpos($e->getMessage(), "Duplicate column") !== false) {
            echo "<p style='color: orange'>Nota: Coluna já existe.</p>";
        } else {
            echo "<p style='color: red'>Erro: " . $e->getMessage() . "</p>";
        }
    }
}

echo "<h2>Concluído! Pode fechar esta página.</h2>";
?>
