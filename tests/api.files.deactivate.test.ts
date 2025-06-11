/**
 * Integration test for /api/files/deactivate (Supabase Auth)
 *
 * This test assumes a valid Supabase test user and a file owned by that user exists.
 * You may need to mock Supabase or use a test database/environment.
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

describe('/api/files/deactivate', () => {
  let testUser: any
  let testFile: any
  let accessToken: string

  beforeAll(async () => {
    // Create or sign in a test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    })
    if (error) throw error
    testUser = data.user
    accessToken = data.session.access_token
    // Create a test file for this user
    const { data: file } = await supabase
      .from('files')
      .insert({
        user_id: testUser.id,
        file_name: 'testfile.txt',
        file_type: 'text/plain',
        file_size: 123,
        storage_path: `uploads/${testUser.id}/testfile.txt`,
        deactivation_passphrase_hash: '$2a$10$testhash', // Use a valid hash for your test
        encrypted: true,
      })
      .select()
      .single()
    testFile = file
  })

  it('should return 401 for unauthenticated requests', async () => {
    const res = await fetch('/api/files/deactivate', {
      method: 'POST',
      body: JSON.stringify({ fileId: 'fake', deactivationPass: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(401)
  })

  it('should return 400 for missing params', async () => {
    const res = await fetch('/api/files/deactivate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ fileId: '' }),
    })
    expect(res.status).toBe(400)
  })

  it('should return 404 for non-existent file', async () => {
    const res = await fetch('/api/files/deactivate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ fileId: 'nonexistent', deactivationPass: 'test' }),
    })
    expect(res.status).toBe(404)
  })

  // Add more tests for passphrase validation and success case as needed
})
