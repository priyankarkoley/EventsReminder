-- Recreate the events table after deletion
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'birthday',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Users can only see their own events
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own events
CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own events
CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own events
CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);

-- Create an index on date for better performance when querying by date
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);
