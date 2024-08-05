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
  ('228d04ed-9502-46d5-9124-eefd3b913c1e', 12.22),
  ('ba5163d2-c28d-4e45-b499-df55514cfbb5', 8.43),
  ('da7b75af-555f-415a-8a0a-8c6fa61d99d3', 12.99);


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