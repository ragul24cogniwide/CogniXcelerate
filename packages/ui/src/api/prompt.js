import client from './client'

const getAvailablePrompts = (body) => client.post(`/prompts-list`, body)
const getPrompt = (body) => client.post(`/load-prompt`, body)
const getLangfusePrompts = () => client.get(`http://localhost:3001/api/v1/langfuse/prompts`)

export default {
    getAvailablePrompts,
    getPrompt,
    getLangfusePrompts
}
