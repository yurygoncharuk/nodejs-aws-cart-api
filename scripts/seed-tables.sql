-- Load uuid extension
create extension if not exists "uuid-ossp";

-- Seed users
INSERT INTO users (name, email, password)
VALUES
  ('yurygoncharuk', 'yury.goncharuk@mail.com', 'TEST_PASSWORD'),
  ('reviewer_1', 'yury.hancharuk@mail.com', 'TEST_PASSWORD');

-- Seed carts
INSERT INTO carts (user_id)
SELECT
  users.id
FROM users;

-- Create temporary products table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

-- Seed product ids from DynamoDB
INSERT INTO products (id, price)
VALUES
  ('66977be4-bfb1-4f1e-a16f-93c5c60fb3ec', 11),
  ('e2f468a3-c10a-430e-98c6-9ebd2cc6aa57', 4),
  ('9dd784d2-93fc-4adc-b4e6-4d6303cfce3e', 5.2);


-- Seed cart_items
INSERT INTO cart_items (cart_id, product_id, count, price)
SELECT
  carts.id AS cart_id,
  products.id AS product_id,
  floor(random() * 9 + 1) AS count,
  products.price AS price
FROM carts
JOIN users ON carts.user_id = users.id
JOIN products ON true;

-- Drop the temporary products table
DROP TABLE products;

-- Seed orders
INSERT INTO orders (user_id, cart_id, payment, delivery, comments, total)
SELECT
  users.id AS user_id,
  carts.id AS cart_id,
  '{"method": "credit_card", "amount": 2}'::jsonb AS payment,
  '{"address": "My address", "city": "Gdansk", "zipcode": "80-462", "firstName": "Yury", "lastName": "Hancharuk"}'::jsonb AS delivery,
  'My comments' AS comments,
  floor(random() * 950 + 50) AS total
FROM carts
JOIN users ON carts.user_id = users.id;