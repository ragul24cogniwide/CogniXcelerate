import express from 'express'
import { getLangfusePrompts, getLangfusePromptByName, getLangfusePromptContent } from '../../services/langfuseClient/getLangfusePrompts'

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

router.get('/langfuse/prompts/:promptName', async (req, res) => {
    try {
        const { promptName } = req.params
        const prompt = await getLangfusePromptByName(promptName)
        res.status(200).json(prompt)
    } catch (error) {
        console.error('Failed to fetch specific prompt:', error)
        res.status(500).json({ error: 'Failed to fetch specific Langfuse prompt' })
    }
})

router.get('/langfuse/prompts/:promptName/content', async (req, res) => {
    try {
        const { promptName } = req.params
        const { version } = req.query
        const promptContent = await getLangfusePromptContent(promptName, version ? parseInt(version as string) : undefined)
        res.status(200).json(promptContent)
    } catch (error) {
        console.error('Failed to fetch prompt content:', error)
        res.status(500).json({ error: 'Failed to fetch Langfuse prompt content' })
    }
})

export default router
