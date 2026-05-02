USE life_os_v1;

CREATE TABLE IF NOT EXISTS loot_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Other',
  price DECIMAL(10, 2),
  priority ENUM('low', 'medium', 'high', 'dream') NOT NULL DEFAULT 'medium',
  status ENUM('wanted', 'saving', 'bought', 'skipped') NOT NULL DEFAULT 'wanted',
  store_link VARCHAR(1000),
  image_path VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);