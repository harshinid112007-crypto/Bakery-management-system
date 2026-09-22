-- ==============================================================================
-- Crumb & Crust Bakery Manager: Supabase PostgreSQL Schema
-- Migration: 20260921_initial_schema.sql
-- ==============================================================================

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT,
  description TEXT NOT NULL DEFAULT '',
  deadline TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'scheduled', 'review', 'completed')) DEFAULT 'in_progress',
  target_units INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'Wholesale B2B',
  assigned_lead TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#D97706',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  station TEXT NOT NULL CHECK (station IN (
    'Breads',
    'Viennoiserie',
    'Custom Cakes',
    'Prep & Doughs',
    'Ovens',
    'Finishing & Packaging'
  )) DEFAULT 'Breads',
  priority TEXT NOT NULL CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  status TEXT NOT NULL CHECK (status IN ('prep', 'proofing', 'baking', 'finishing', 'completed')) DEFAULT 'prep',
  due_time TEXT NOT NULL DEFAULT '07:00 AM',
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  quantity TEXT,
  assigned_baker TEXT NOT NULL DEFAULT '',
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  oven_slot TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Ovens Table (Baking Equipment Telemetry)
CREATE TABLE IF NOT EXISTS public.ovens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Deck', 'Convection Rack', 'Proof Box')) DEFAULT 'Deck',
  target_temp TEXT NOT NULL DEFAULT '',
  current_temp TEXT NOT NULL DEFAULT '',
  current_batch TEXT,
  time_remaining TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'preheating', 'idle')) DEFAULT 'idle',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_station ON public.tasks(station);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ovens ENABLE ROW LEVEL SECURITY;

-- Allow public / anon and authenticated read & write operations for operational floor management
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
CREATE POLICY "Allow public read access to projects"
  ON public.projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public write access to projects" ON public.projects;
CREATE POLICY "Allow public write access to projects"
  ON public.projects FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to tasks" ON public.tasks;
CREATE POLICY "Allow public read access to tasks"
  ON public.tasks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public write access to tasks" ON public.tasks;
CREATE POLICY "Allow public write access to tasks"
  ON public.tasks FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to ovens" ON public.ovens;
CREATE POLICY "Allow public read access to ovens"
  ON public.ovens FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public write access to ovens" ON public.ovens;
CREATE POLICY "Allow public write access to ovens"
  ON public.ovens FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Initial Seed Data
INSERT INTO public.projects (id, name, client, description, deadline, status, target_units, category, assigned_lead, color, created_at)
VALUES
  (
    'proj-1',
    'Café Luna Morning Wholesale',
    'Café Luna (Daily Contract)',
    'Fresh daily delivery of 60 croissants, 30 pain au chocolat, and 20 country sourdough batards before 7:00 AM.',
    'Today, 06:45 AM',
    'in_progress',
    110,
    'Wholesale B2B',
    'Chef Marcus',
    '#D97706',
    NOW()
  ),
  (
    'proj-2',
    'Grand Ballroom 3-Tier Wedding Cake',
    'Evelyn & Thomas Wedding',
    'Semi-naked vanilla bean sponge with wild raspberry confit, swiss meringue buttercream, and fresh botanical blooms.',
    'Today, 02:00 PM',
    'in_progress',
    1,
    'Custom Event',
    'Pastry Chef Claire',
    '#E11D48',
    NOW()
  ),
  (
    'proj-3',
    'Weekend Farmer’s Market Specialty Drop',
    'Greenwich Market Guild',
    'Heritage grain sourdough loaves, pistachio escargot, caramelized onion focaccia, and cannelés de Bordeaux.',
    'Tomorrow, 06:00 AM',
    'scheduled',
    250,
    'Retail Special',
    'Chef Leo',
    '#059669',
    NOW()
  ),
  (
    'proj-4',
    'The Ritz Afternoon Tea Viennoiserie',
    'The Ritz Carlton Lounge',
    'Mini brioche buns, passionfruit tart shells, and assorted savory choux au craquelin.',
    'Today, 11:30 AM',
    'review',
    180,
    'Hospitality',
    'Baker Sophie',
    '#7C3AED',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, title, description, station, priority, status, due_time, estimated_minutes, quantity, assigned_baker, project_id, checklist, tags, oven_slot, created_at)
VALUES
  (
    'task-1',
    'Deck Oven Bake: Country Sourdough Batards',
    'Load Deck 1 & 2 with chilled batards. 15 sec initial steam, bake at 245°C for 20m, vent dampers for final 22m crust development.',
    'Ovens',
    'Urgent',
    'baking',
    '06:00 AM',
    45,
    '36 loaves',
    'Chef Marcus',
    'proj-1',
    '[
      {"id": "c1", "text": "Check stone deck temp reads 245°C", "completed": true},
      {"id": "c2", "text": "Score batards with single 30° angled cut", "completed": true},
      {"id": "c3", "text": "Inject steam boiler burst (15s)", "completed": true},
      {"id": "c4", "text": "Open steam draft dampers at 20 min", "completed": false},
      {"id": "c5", "text": "Internal loaf core reaches 98°C", "completed": false}
    ]'::jsonb,
    ARRAY['Sourdough', 'High Heat', 'Deck Oven'],
    'Deck Oven 1 & 2 (245°C)',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'task-2',
    'Morning Croissants & Pain au Chocolat Bake',
    'Transfer proofed viennoiserie from proofing cabinet to rack oven. Double egg wash with yolk & heavy cream glaze.',
    'Viennoiserie',
    'Urgent',
    'proofing',
    '06:15 AM',
    35,
    '90 pastries',
    'Baker Sophie',
    'proj-1',
    '[
      {"id": "c21", "text": "Verify 2.5x volume expansion wobble", "completed": true},
      {"id": "c22", "text": "Gentle egg wash without pooling", "completed": true},
      {"id": "c23", "text": "Convection rack oven preheat 195°C", "completed": false},
      {"id": "c24", "text": "Bake 17 min to golden mahogany", "completed": false}
    ]'::jsonb,
    ARRAY['Lamination', 'Pastry', 'Rack Oven'],
    'Rotary Rack Oven (195°C)',
    NOW() - INTERVAL '80 minutes'
  ),
  (
    'task-3',
    'Vanilla Bean Sponge Stacking & Raspberry Confit Layering',
    'Level 3 tiers of vanilla genoise sponge, apply elderflower soaking syrup, pipe dam of Swiss meringue buttercream and fill with raspberry confit.',
    'Custom Cakes',
    'High',
    'prep',
    '09:30 AM',
    90,
    '3-Tier Cake',
    'Pastry Chef Claire',
    'proj-2',
    '[
      {"id": "c31", "text": "Tort sponges to exact 1-inch layers", "completed": true},
      {"id": "c32", "text": "Light elderflower syrup soak", "completed": false},
      {"id": "c33", "text": "Insert interior boba straws for tier stability", "completed": false},
      {"id": "c34", "text": "Chill crumb coat 45 minutes", "completed": false}
    ]'::jsonb,
    ARRAY['Wedding Cake', 'Confectionery', 'Chill Prep'],
    NULL,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'task-4',
    'Autolyse & Levain Mixing for Tomorrow’s Baguettes',
    'Combine T65 label rouge flour with 72% ice water. Let autolyse for 45 min before adding active young levain and coarse sea salt.',
    'Prep & Doughs',
    'Medium',
    'prep',
    '10:00 AM',
    50,
    '40 kg dough',
    'Chef Leo',
    'proj-3',
    '[
      {"id": "c41", "text": "Weigh ice water to achieve 24°C target dough temp", "completed": true},
      {"id": "c42", "text": "45-minute un-yeasted autolyse rest", "completed": false},
      {"id": "c43", "text": "Spiral mixer speed 1 for 6m, speed 2 for 3m", "completed": false},
      {"id": "c44", "text": "Temperature log entry in HACCP book", "completed": false}
    ]'::jsonb,
    ARRAY['Mixing', 'Fermentation', 'T65 Flour'],
    NULL,
    NOW() - INTERVAL '90 minutes'
  ),
  (
    'task-5',
    'Pastry Shell Docking & Blind Bake for The Ritz',
    'Dock mini pâte sablée shells, line with silicone beads, blind bake at 170°C for 14 min for crisp golden snap.',
    'Finishing & Packaging',
    'High',
    'finishing',
    '10:45 AM',
    40,
    '180 shells',
    'Baker Sophie',
    'proj-4',
    '[
      {"id": "c51", "text": "Roll sablée to 2.2mm thickness", "completed": true},
      {"id": "c52", "text": "Even fork docking across bases", "completed": true},
      {"id": "c53", "text": "Cool on wire racks completely", "completed": true},
      {"id": "c54", "text": "Apply thin cocoa butter barrier glaze", "completed": false}
    ]'::jsonb,
    ARRAY['Tart Shells', 'Blind Bake', 'Packaging'],
    NULL,
    NOW() - INTERVAL '130 minutes'
  ),
  (
    'task-6',
    'Focaccia Dimpling & Rosemary Sea Salt Garnish',
    'Dimple cold-fermented high-hydration olive oil focaccia trays. Emulsify brine with Sicilian EVOO, fresh rosemary sprigs, and Maldon flakes.',
    'Breads',
    'Medium',
    'completed',
    '05:30 AM',
    25,
    '6 large sheet pans',
    'Chef Leo',
    'proj-3',
    '[
      {"id": "c61", "text": "Heavy olive oil pool in sheet pans", "completed": true},
      {"id": "c62", "text": "Finger tip deep dimpling for aerated bubbles", "completed": true},
      {"id": "c63", "text": "Sea salt flakes & rosemary scatter", "completed": true},
      {"id": "c64", "text": "Deck bake 230°C for 22 min", "completed": true}
    ]'::jsonb,
    ARRAY['Focaccia', 'Deck Oven', 'Completed'],
    NULL,
    NOW() - INTERVAL '160 minutes'
  ),
  (
    'task-7',
    'Pack & Dispatch Café Luna Wholesale Delivery Box',
    'Ensure baguettes and sourdough loaves are bagged in micro-perforated bakery sleeves. Pack warm croissants in vented kraft crates.',
    'Finishing & Packaging',
    'Urgent',
    'prep',
    '06:30 AM',
    20,
    '110 items',
    'Chef Marcus',
    'proj-1',
    '[
      {"id": "c71", "text": "Verify dispatch manifest counts", "completed": false},
      {"id": "c72", "text": "Attach morning invoice #LUNA-892", "completed": false},
      {"id": "c73", "text": "Handover to delivery courier", "completed": false}
    ]'::jsonb,
    ARRAY['Wholesale', 'Dispatch', 'Packing'],
    NULL,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ovens (id, name, type, target_temp, current_temp, current_batch, time_remaining, status, updated_at)
VALUES
  ('oven-1', 'Stone Deck 1 & 2', 'Deck', '245°C', '246°C', 'Country Sourdough Batards (Batch A)', '14 min remaining', 'active', NOW()),
  ('oven-2', 'Rotary Rack Oven (Miwe)', 'Convection Rack', '195°C', '192°C', 'Croissants & Pain au Chocolat', 'Preheating (3 min to temp)', 'preheating', NOW()),
  ('oven-3', 'Artisan Deck 3 & 4', 'Deck', '230°C', '230°C', 'Idle - Ready for Baguette bake', 'Ready', 'idle', NOW()),
  ('oven-4', 'Proofing Retarder Chamber', 'Proof Box', '27°C / 75% RH', '27.2°C / 74% RH', 'Viennoiserie Batch 2 (Wobble stage)', '38 min proof left', 'active', NOW())
ON CONFLICT (id) DO NOTHING;
