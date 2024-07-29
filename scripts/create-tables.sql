-- Load uuid extension
create extension if not exists "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create carts table
CREATE TABLE carts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(10) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ORDERED'))
);

-- Create cart_items table
CREATE TABLE cart_items (
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  count INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE NO ACTION,
  payment JSON,
  delivery JSON,
  comments TEXT,
  status VARCHAR(10) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'APPROVED', 'CONFIRMED', 'SENT', 'COMPLETED', 'CANCELLED')),
  total NUMERIC(10, 2) NOT NULL
);