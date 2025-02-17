-- Create waiter_calls table
CREATE TABLE waiter_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT waiter_calls_status_check CHECK (status IN ('active', 'acknowledged', 'completed'))
);

-- Create index on table_id for faster lookups
CREATE INDEX waiter_calls_table_id_idx ON waiter_calls(table_id);

-- Create index on status for filtering
CREATE INDEX waiter_calls_status_idx ON waiter_calls(status);
