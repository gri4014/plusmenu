-- Drop existing orders table constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE orders DROP COLUMN IF EXISTS items;

-- Modify orders table
ALTER TABLE orders
ADD COLUMN total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    item_id UUID REFERENCES menu_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    special_requests TEXT,
    parameters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create order_status_history table
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES restaurant_admins(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'))
);

-- Add new constraints to orders table
ALTER TABLE orders
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'));

-- Create indexes for better query performance
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_item ON order_items(item_id);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_phone);
