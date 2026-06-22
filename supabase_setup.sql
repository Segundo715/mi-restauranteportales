-- ============================================================
-- NICHO Restaurant - Supabase Schema
-- Pega esto en: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Clientes (login con nombre + contraseña)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  phone TEXT DEFAULT '',
  password_hash TEXT,
  visits INTEGER DEFAULT 0,
  confirmed BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT now(),
  stamps JSONB DEFAULT '[]',
  requested_at TIMESTAMPTZ
);

-- Platillos del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tarjetas de fidelización (nombre + teléfono, sin contraseña)
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  visits INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT now(),
  stamps JSONB DEFAULT '[]'
);

-- Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  table_number TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reseñas (con o sin cuenta)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  published BOOLEAN DEFAULT false,
  bad BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Empleados
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recetario
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  ingredients TEXT[] DEFAULT '{}',
  steps TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pantallas TV
CREATE TABLE IF NOT EXISTS tv_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  price TEXT,
  image_url TEXT,
  is_offer BOOLEAN DEFAULT false,
  slide_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Acceso público de solo lectura (necesario para anon key)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_slides ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso total para anon (el control de acceso lo hace la app)
CREATE POLICY "allow_all" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON loyalty_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tv_slides FOR ALL USING (true) WITH CHECK (true);
