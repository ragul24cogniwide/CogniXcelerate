import axios from 'axios'

export async function getLangfusePrompts() {
    try {
        console.log('🔗 Connecting to Langfuse at: http://10.10.20.156:3000')

        // Using the exact authorization header from the curl command
        const response = await axios.get('http://10.10.20.156:3000/api/public/v2/prompts', {
            headers: {
                'Authorization': 'Basic cGstbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ==',
                'Content-Type': 'application/json'
            }
        })

        console.log('✅ Successfully fetched prompts from Langfuse API')
        return response.data.data || response.data

    } catch (err: any) {
        console.error('❌ Error fetching Langfuse prompts via API:', err)
        throw new Error(`Failed to fetch prompts from Langfuse API: ${err?.message || 'Unknown error'}`)
    }
}

export async function getLangfusePromptByName(promptName: string) {
    try {
        console.log(`🔗 Fetching specific prompt: ${promptName}`)

        // Using the exact authorization header from the curl command
        const response = await axios.get(`http://10.10.20.156:3000/api/public/v2/prompts/${promptName}`, {
            headers: {
                'Authorization': 'Basic cGstbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ==',
                'Content-Type': 'application/json'
            }
        })

        console.log(`✅ Successfully fetched prompt: ${promptName}`)
        return response.data

    } catch (err: any) {
        console.error(`❌ Error fetching prompt ${promptName}:`, err)
        throw new Error(`Failed to fetch prompt ${promptName}: ${err?.message || 'Unknown error'}`)
    }
}

export async function getLangfusePromptContent(promptName: string, version?: number) {
    try {
        console.log(`🔗 Fetching prompt content: ${promptName}${version ? ` v${version}` : ''}`)

        // Using the exact authorization header from the curl command
        const url = version 
            ? `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/versions/${version}`
            : `http://10.10.20.156:3000/api/public/v2/prompts/${promptName}/versions/latest`

        const response = await axios.get(url, {
            headers: {
                'Authorization': 'Basic cGstbGYtNWEyYmFlZmMtZTJjZi00ODBkLTlhNGQtNDY4NjAwYTZiNmE0OnNrLWxmLWJkMzk2ZTViLWE0MzgtNGRlYi04YzgxLTFjOTU4MTNjNGQ3OQ==',
                'Content-Type': 'application/json'
            }
        })

        console.log(`✅ Successfully fetched prompt content: ${promptName}`)
        return response.data

    } catch (err: any) {
        console.error(`❌ Error fetching prompt content ${promptName}:`, err)
        throw new Error(`Failed to fetch prompt content ${promptName}: ${err?.message || 'Unknown error'}`)
    }
}
