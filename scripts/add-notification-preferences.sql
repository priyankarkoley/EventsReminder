-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification timing options
  notify_day_before boolean DEFAULT false,
  day_before_time time DEFAULT '23:55:00',
  
  notify_same_day boolean DEFAULT true,
  same_day_time time DEFAULT '08:00:00',
  
  notify_week_before boolean DEFAULT false,
  week_before_time time DEFAULT '09:00:00',
  
  -- Push notification settings
  push_notifications_enabled boolean DEFAULT false,
  browser_push_enabled boolean DEFAULT false,
  
  -- Timezone for scheduling
  timezone text DEFAULT 'UTC',
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notification queue table for scheduled notifications
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  notification_type text NOT NULL CHECK (notification_type IN ('day_before', 'same_day', 'week_before')),
  scheduled_time timestamp with time zone NOT NULL,
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamp with time zone,
  error_message text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON public.notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on notification_queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_queue
CREATE POLICY "Users can view their own notification queue" ON public.notification_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_time ON public.notification_queue(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON public.notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification preferences for existing users
INSERT INTO public.notification_preferences (user_id, notify_same_day, same_day_time)
SELECT id, true, '08:00:00'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.notification_preferences);
