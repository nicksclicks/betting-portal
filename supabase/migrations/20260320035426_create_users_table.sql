/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - unique user identifier
      - `email` (text, unique, not null) - user email address
      - `name` (text, not null) - user display name
      - `role` (text, not null) - user role: 'admin' or 'user'
      - `created_at` (timestamptz) - when the user was created (member since)
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `users` table
    - Admins can read all users
    - Admins can insert/update/delete users
    - Users can read their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

INSERT INTO users (name, email, role)
VALUES ('Admin User', 'admin@example.com', 'admin')
ON CONFLICT (email) DO NOTHING;