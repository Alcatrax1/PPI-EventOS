-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 27/11/2025 às 04:20
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `eventos_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `checkins`
--

CREATE TABLE `checkins` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `checkin_time` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `checkins`
--

INSERT INTO `checkins` (`id`, `event_id`, `user_id`, `checkin_time`) VALUES
(1, 14, 27, '2025-11-26 23:07:35');

-- --------------------------------------------------------

--
-- Estrutura para tabela `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_id` varchar(100) DEFAULT NULL,
  `pix_code` text DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT 'approved',
  `ticket_token` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `enrollments`
--

INSERT INTO `enrollments` (`id`, `user_id`, `event_id`, `enrolled_at`, `payment_id`, `pix_code`, `payment_status`, `ticket_token`) VALUES
(1, 27, 14, '2025-11-27 02:06:56', '135400987230', '00020126580014br.gov.bcb.pix0136b9bfa6da-d1f0-4a6a-b18c-85b03a22521a520400005303986540522.005802BR5924DALEONARDO202302131853226009Sao Paulo62250521mpqrinter135400987230630427EA', 'approved', NULL),
(2, 27, 13, '2025-11-27 03:14:41', NULL, NULL, 'approved', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `date` datetime NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `image_url` text DEFAULT NULL,
  `required_checkins` int(11) DEFAULT 1,
  `qr_token` varchar(64) DEFAULT NULL,
  `qr_expires_at` datetime DEFAULT NULL,
  `capacity` int(11) DEFAULT 50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `events`
--

INSERT INTO `events` (`id`, `name`, `description`, `date`, `location`, `price`, `image_url`, `required_checkins`, `qr_token`, `qr_expires_at`, `capacity`) VALUES
(13, 'BugCup 2025', 'Maratona de Programação', '2017-11-29 19:50:00', 'Lab B11 Iffar Campus Panambi', 10.00, 'uploads/evt_1764197937_4382.png', 1, '8d3f8e487425de79c8c64596816b1547', '2025-11-27 02:54:35', 50),
(14, 'teste', 'teste', '0222-02-23 22:02:00', '22', 22.00, 'uploads/evt_1764208574_5768.png', 1, '926759af80709dbb76d674b24ea07bf8', '2025-11-27 03:48:24', 222);

-- --------------------------------------------------------

--
-- Estrutura para tabela `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `event_id`, `rating`, `comment`, `created_at`) VALUES
(1, 27, 13, 5, 'Pedro lIndo\n', '2025-11-27 03:16:50');

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin','servidor') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(6, 'pedro', 'admin@admin.com', '$2y$10$Z0Dx5VYj6DchDAaiYroYaOFtTi6qmJ1DBkLWRRJxmPa5RNVQ2hsNa', 'admin', '2025-11-24 22:43:27'),
(23, 'pedro', 'pedro22@gmail.com', '$2y$10$uHwIhkVHBPg6mXp/.yXkjukQsYUZZou.FZ6DtYgqqH.biaIQru9Im', 'servidor', '2025-11-27 01:06:47'),
(27, 'Pedro', 'pedro@gmail.com', '$2y$10$RdM3j8PJWxwOvoVIQaKJuuYwjRVfDzOH1qckKq52JYUWxbKhkv4um', 'user', '2025-11-27 02:06:49');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `checkins`
--
ALTER TABLE `checkins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment` (`user_id`,`event_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Índices de tabela `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `checkins`
--
ALTER TABLE `checkins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de tabela `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `checkins`
--
ALTER TABLE `checkins`
  ADD CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkins_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
