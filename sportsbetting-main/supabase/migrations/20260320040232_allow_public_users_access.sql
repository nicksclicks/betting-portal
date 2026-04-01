/*
  # Allow Public Access to Users Table

  Since authentication is not yet implemented, this migration allows
  public access to the users table for testing purposes.

  1. Security Changes
    - Add policy for anonymous users to read all users
    - Add policy for anonymous users to insert users
    - Add policy for anonymous users to update users
    - Add policy for anonymous users to delete users

  Note: These policies should be updated once authentication is implemented.
*/

CREATE POLICY "Allow public read access"
  ON users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON users FOR DELETE
  TO anon
  USING (true);