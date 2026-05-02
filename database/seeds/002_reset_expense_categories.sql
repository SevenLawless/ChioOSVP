USE life_os_v1;

SET SQL_SAFE_UPDATES = 0;

DELETE FROM expense_categories
WHERE type = 'expense';

INSERT INTO expense_categories (name, type, color) VALUES
('Housing', 'expense', '#60a5fa'),
('Food', 'expense', '#f59e0b'),
('Transport', 'expense', '#38bdf8'),
('Bills', 'expense', '#fb7185'),
('Health', 'expense', '#34d399'),
('Fitness', 'expense', '#a78bfa'),
('Learning', 'expense', '#818cf8'),
('Entertainment', 'expense', '#f472b6'),
('Shopping', 'expense', '#facc15'),
('Family/Gifts', 'expense', '#f97316'),
('Travel', 'expense', '#22d3ee'),
('Savings', 'expense', '#a0c178'),
('Debt', 'expense', '#f87171'),
('Documents/Fees', 'expense', '#c084fc'),
('Other', 'expense', '#94a3b8');