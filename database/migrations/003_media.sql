USE life_os_v1;

CREATE TABLE IF NOT EXISTS media_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type ENUM('anime', 'movie', 'show') NOT NULL DEFAULT 'show',
  status ENUM('planned', 'watching', 'completed', 'paused', 'dropped') NOT NULL DEFAULT 'planned',
  current_episode INT NOT NULL DEFAULT 0,
  total_episodes INT,
  rating DECIMAL(3, 1),
  image_path VARCHAR(500),
  watch_link VARCHAR(1000),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);