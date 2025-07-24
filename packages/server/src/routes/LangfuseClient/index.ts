import express from 'express'
import { getLangfusePrompts } from '../../services/langfuseClient/getLangfusePrompts'

const router = express.Router()

router.get('/langfuse/prompts', async (req, res) => {
    try {
        const prompts = await getLangfusePrompts()
        res.status(200).json(prompts)
    } catch (error) {
        console.error('Failed to fetch prompts:', error)
        res.status(500).json({ error: 'Failed to fetch Langfuse prompts' })
    }
})

export default router
