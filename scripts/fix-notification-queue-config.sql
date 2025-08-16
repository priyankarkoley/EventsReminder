-- Fix notification_queue table configuration
-- Add proper constraints, indexes, and RLS policies

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key constraint for user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notification_queue_user_id_fkey'
    ) THEN
        ALTER TABLE notification_queue 
        ADD CONSTRAINT notification_queue_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for event_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notification_queue_event_id_fkey'
    ) THEN
        ALTER TABLE notification_queue 
        ADD CONSTRAINT notification_queue_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add check constraints for status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'notification_queue_status_check'
    ) THEN
        ALTER TABLE notification_queue 
        ADD CONSTRAINT notification_queue_status_check 
        CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));
    END IF;
END $$;

-- Add check constraints for notification_type values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'notification_queue_type_check'
    ) THEN
        ALTER TABLE notification_queue 
        ADD CONSTRAINT notification_queue_type_check 
        CHECK (notification_type IN ('same_day', 'day_before', 'week_before'));
    END IF;
END $$;

-- Set default values
ALTER TABLE notification_queue 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN created_at SET DEFAULT now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_event_id ON notification_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_time ON notification_queue(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending ON notification_queue(scheduled_time, status) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_queue;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notification_queue;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notification_queue;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notification_queue;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notification_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notification_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notification_queue
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notification_queue
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON notification_queue TO authenticated;
GRANT SELECT ON notification_queue TO anon;
