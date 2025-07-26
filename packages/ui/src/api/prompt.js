import client from './client'

const getAvailablePrompts = (body) => client.post(`/prompts-list`, body)
const getPrompt = (body) => client.post(`/load-prompt`, body)

// Direct Langfuse API calls using the curl command
const getLangfusePrompts = async () => {
    try {
        const response = await fetch('http://10.10.20.156:3000/api/public/v2/prompts', {
            method: 'GET',
            headers: {
                'Authorization': 'Basic cGstbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ==',
                'Content-Type': 'application/json'
            }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        return { data }
    } catch (error) {
        console.error('Error fetching Langfuse prompts:', error)
        throw error
    }
}

const getLangfusePromptByName = async (promptName) => {
    try {
        const response = await fetch(`http://10.10.20.156:3000/api/public/v2/prompts/${promptName}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic cGstbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ==',
                'Content-Type': 'application/json'
            }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        return { data }
    } catch (error) {
        console.error('Error fetching Langfuse prompt:', error)
        throw error
    }
}

const getLangfusePromptContent = async (promptName, version) => {
    try {
        // Try different endpoint patterns to find the correct one
        const endpoints = [
            `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/versions/latest`,
            `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/latest`,
            `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}`,
            `http://10.10.20.156:3000/api/public/prompts/${promptName}`,
            `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/content`
        ]
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic cGstbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ==',
                        'Content-Type': 'application/json'
                    }
                })
                
                if (response.ok) {
                    const data = await response.json()
                    console.log(`✅ Found working endpoint: ${endpoint}`, data)
                    return { data }
                }
            } catch (err) {
                console.log(`❌ Endpoint failed: ${endpoint}`, err.message)
                continue
            }
        }
        
        throw new Error('No working endpoint found for prompt content')
        
    } catch (error) {
        console.error('Error fetching Langfuse prompt content:', error)
        throw error
    }
}

export default {
    getAvailablePrompts,
    getPrompt,
    getLangfusePrompts,
    getLangfusePromptByName,
    getLangfusePromptContent
}
