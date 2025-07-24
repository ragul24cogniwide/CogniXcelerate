import { langfuseDb } from '../../database/langfuseClient'

export async function getLangfusePrompts() {
    try {
        const test = await langfuseDb.query('SELECT NOW()')
        console.log('✅ DB connected at:', test.rows[0])

        const result = await langfuseDb.query(`
      SELECT id, name, prompt, created_at
      FROM public.prompts
      ORDER BY created_at DESC
    `)

        return result.rows
    } catch (err) {
        console.error('❌ Error fetching Langfuse prompts:', err)
        throw err
    }
}
