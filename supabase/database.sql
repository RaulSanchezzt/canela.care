-- Crear tabla de usuarios
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  alias TEXT UNIQUE,
  coins INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_date DATE
);

-- Crear tabla de tareas diarias
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks JSON NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_indexes JSONB DEFAULT '[]',
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Crear tabla de biblioteca de tareas
CREATE TABLE public.tasks_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Physical', 'Mental', 'Social')),
  coins INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de disfraces
CREATE TABLE public.costumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_file TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('hat', 'hand', 'companion')
  ),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- Crear tabla de disfraces por usuario
CREATE TABLE public.user_costumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  costume_id UUID REFERENCES public.costumes(id) ON DELETE CASCADE,
  equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, costume_id)
);

-- Insertar tareas
INSERT INTO public.tasks_library (description, category, coins) VALUES
-- Mental
('Stand in front of a mirror and think positive thoughts about yourself', 'Mental', 5),
('Do something you''ve always been afraid of', 'Mental', 6),
('Read a book of your choice', 'Mental', 8),
('Spend time alone to reflect', 'Mental', 5),
('Find a hobby that entertains you', 'Mental', 6),
('Smile without fear', 'Mental', 7),
('Organize your day', 'Mental', 8),
('Take a mental break after heavy thinking', 'Mental', 5),
('Listen to calming music', 'Mental', 6),
('Go to a park and take deep breaths', 'Mental', 7),
('Do a brain teaser or puzzle', 'Mental', 8),
('Meditate on something that’s been bothering you', 'Mental', 4),
('Tell yourself 3 reasons you''re valuable while looking in the mirror', 'Mental', 6),
('Watch the sunset alone', 'Mental', 5),
('Write a letter about how you feel right now', 'Mental', 7),
('Do 15 minutes of journaling', 'Mental', 10),
('Spend 1 hour on an activity you enjoy, without technology', 'Mental', 10),
('Avoid using your phone for 2 hours before bed', 'Mental', 2),
('Learn something new that enriches your knowledge', 'Mental', 10),
('Research topics that interest you', 'Mental', 5),
('Spend quality time with your pet', 'Mental', 8),
('Write 10 things you love about yourself', 'Mental', 2),
('Tidy up your room', 'Mental', 5),
('Clean out your closet', 'Mental', 4),
('Read a personal development book', 'Mental', 10),
('Go to your favorite restaurant alone', 'Mental', 9),
('Learn to cook a dish you love', 'Mental', 6),
('Dance to your favorite song without caring how you look', 'Mental', 11),
('Take a full-body photo of yourself smiling', 'Mental', 3),
('Watch your favorite movie with snacks and a blanket', 'Mental', 2),
('Plan new goals for yourself', 'Mental', 8),
('Set goals and challenges for your future', 'Mental', 6),
('Write a letter to your future self and store it safely', 'Mental', 10),

-- Social
('Give a hug to a close friend or family member', 'Social', 6),
('Dress how you want without worrying about others', 'Social', 5),
('Do what you enjoy regardless of others'' opinions', 'Social', 4),
('Have fun with the people you love most', 'Social', 4),
('Make an effort to talk more with others', 'Social', 8),
('Make someone''s day in your own special way', 'Social', 7),
('Distance yourself from toxic people', 'Social', 7),
('Help the environment in any way you can', 'Social', 8),
('Help someone in need on the street', 'Social', 9),
('Give a warm smile to someone important to you', 'Social', 7),
('Hug three people you care about', 'Social', 5),
('Compliment someone on their appearance', 'Social', 2),
('Do something kind for someone', 'Social', 3),
('Invent a new game or activity', 'Social', 9),
('Call your siblings for at least 15 minutes', 'Social', 10),
('Spend 1 hour with your siblings doing something fun', 'Social', 9),
('Hang out with someone special', 'Social', 7),
('Start a conversation with someone on public transport', 'Social', 11),
('Meet up with an old friend for coffee or a snack', 'Social', 10),
('Watch a movie with your housemates or family', 'Social', 10),
('Catch up with someone you haven''t spoken to in a while', 'Social', 6),
('Take a walk with your favorite person', 'Social', 7),
('Look at childhood photos (alone or with someone special)', 'Social', 6),
('Write someone''s name on a paper and freeze it (fun ritual)', 'Social', 7),
('Hide positive notes around the house', 'Social', 8),
('Have a conversation with someone new', 'Social', 7),

-- Physical
('Take a midday walk around your neighborhood', 'Physical', 6),
('Eat something healthier today', 'Physical', 5),
('Hold a plank for 1 minute', 'Physical', 6),
('Wake up earlier for a productive day', 'Physical', 7),
('Complete an easy workout routine', 'Physical', 6),
('Run 1 kilometer', 'Physical', 5),
('Cleanse your skin thoroughly', 'Physical', 7),
('Do 10 push-ups', 'Physical', 7),
('Eat healthy today', 'Physical', 6),
('Drink more water today (up to 6.5 liters max)', 'Physical', 5),
('Jump rope for 5 minutes, taking three 10-second breaks', 'Physical', 5),
('Take a cold shower', 'Physical', 8),
('Try a food you’ve never tasted before', 'Physical', 3),
('Meditate and take deep breaths for 15 minutes', 'Physical', 5),
('Earn coins for every 10 minutes of exercise', 'Physical', 10),
('Walk 10,000 steps in a day', 'Physical', 10),
('Sleep 8 hours', 'Physical', 2),
('Go a full day without eating sugar', 'Physical', 2),
('Avoid eating ultra-processed foods today', 'Physical', 3),
('Enjoy a 20-minute walk in your town/city with a great playlist', 'Physical', 10),
('Plan your next day ahead and set an early alarm to make the most of your time', 'Physical', 8),
('Take a walk in a natural area and breathe fresh air', 'Physical', 10),
('Watch the sunset with someone you care about', 'Physical', 3),
('Spend a day doing things you love, just for yourself', 'Physical', 8),
('Try something new—change your routine, start a new hobby, or learn a new skill', 'Physical', 8);

-- Validaciones (opcional)
SELECT * FROM public.tasks_library WHERE category = 'Physical' LIMIT 1;
SELECT * FROM public.tasks_library WHERE category = 'Mental' LIMIT 1;
SELECT * FROM public.tasks_library WHERE category = 'Social' LIMIT 1;

-- Add costumes
INSERT INTO costumes (name, image_file, price, category)
VALUES 
  ('Cool Hat', 'hat1.png', 5, 'hat'),
  ('Top Hat', 'hat2.png', 30, 'hat'),
  ('Flute Hat', 'hat3.png', 100, 'hat'),
  ('Soda', 'soda.png', 15, 'hand'),
  ('Burger', 'burger.png', 50, 'hand'),
  ('Apple', 'apple.png', 150, 'hand'),
  ('Frog', 'frog.png', 20, 'companion'),
  ('Duck', 'duck.png', 200, 'companion'),
  ('Dog', 'dog.png', 500, 'companion');
