USE life_os_v1;

CREATE TABLE IF NOT EXISTS bucket_list_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Other',
  status ENUM('idea', 'planned', 'in_progress', 'done', 'skipped') NOT NULL DEFAULT 'idea',
  priority ENUM('low', 'medium', 'high', 'dream') NOT NULL DEFAULT 'medium',
  target_date DATE,
  link VARCHAR(1000),
  image_path VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);