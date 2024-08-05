-- Disable foreign key check
SET CONSTRAINTS ALL DEFERRED;

-- Delete entries from child tables
DELETE FROM cart_items;

-- Delete entries from parent tables
DELETE FROM orders;
DELETE FROM carts;
DELETE FROM users;

-- Enable foreign key check
SET CONSTRAINTS ALL IMMEDIATE;