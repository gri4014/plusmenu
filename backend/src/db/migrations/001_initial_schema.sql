-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System Configuration Tables
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE item_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    min_value NUMERIC,
    max_value NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT valid_data_type CHECK (data_type IN ('boolean', 'integer', 'float', 'scale', 'text'))
);

-- Authentication & User Tables
CREATE TABLE developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    theme_colors JSONB NOT NULL DEFAULT '{"primary": "#000000", "secondary": "#ffffff", "accent": "#000000"}',
    created_by UUID REFERENCES developers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE restaurant_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id),
    login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID, -- Can reference either developer_id or restaurant_admin_id
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id),
    table_number INTEGER NOT NULL,
    qr_code_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(restaurant_id, table_number)
);

-- Menu System Tables
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    category_ids UUID[],
    parameters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Customer System Tables
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    device_id VARCHAR(255),
    preferences JSONB DEFAULT '{"dietary_restrictions": [], "allergies": [], "taste_preferences": []}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visit TIMESTAMP
);

CREATE TABLE active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id),
    device_id VARCHAR(255),
    phone_number VARCHAR(20) REFERENCES customers(phone_number),
    current_preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Order Management Tables
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id),
    restaurant_id UUID REFERENCES restaurants(id),
    customer_phone VARCHAR(20) REFERENCES customers(phone_number),
    items JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'))
);

CREATE TABLE table_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id),
    restaurant_id UUID REFERENCES restaurants(id),
    individual_orders UUID[],
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE TABLE waiter_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id),
    restaurant_id UUID REFERENCES restaurants(id),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('active', 'acknowledged', 'completed'))
);

-- Create indexes for better query performance
CREATE INDEX idx_restaurant_admins_restaurant ON restaurant_admins(restaurant_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_table_orders_table ON table_orders(table_id);
CREATE INDEX idx_table_orders_restaurant ON table_orders(restaurant_id);
CREATE INDEX idx_waiter_calls_table ON waiter_calls(table_id);
CREATE INDEX idx_waiter_calls_restaurant ON waiter_calls(restaurant_id);
CREATE INDEX idx_active_sessions_table ON active_sessions(table_id);
