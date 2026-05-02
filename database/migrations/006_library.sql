USE life_os_v1;

CREATE TABLE IF NOT EXISTS library_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Other',
  status ENUM('active', 'expired', 'pending', 'archived', 'needs_action') NOT NULL DEFAULT 'active',
  document_date DATE,
  expiry_date DATE,
  issuer VARCHAR(255),
  reference_number VARCHAR(255),
  file_path VARCHAR(500),
  original_file_name VARCHAR(255),
  file_mime_type VARCHAR(150),
  file_size BIGINT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);