import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import apikeyService from '../../services/apikey'

// Get api keys
const getAllApiKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const autoCreateNewKey = true
        const apiResponse = await apikeyService.getAllApiKeys(req.user?.activeWorkspaceId, autoCreateNewKey)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const createApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined' || !req.body.keyName) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.createApiKey - keyName not provided!`)
        }
        const apiResponse = await apikeyService.createApiKey(req.body.keyName, req.user?.activeWorkspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Update api key
const updateApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.updateApiKey - id not provided!`)
        }
        if (typeof req.body === 'undefined' || !req.body.keyName) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.updateApiKey - keyName not provided!`)
        }
        const apiResponse = await apikeyService.updateApiKey(req.params.id, req.body.keyName, req.user?.activeWorkspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Import Keys from JSON file
const importKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined' || !req.body.jsonFile) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.importKeys - body not provided!`)
        }
        req.body.workspaceId = req.user?.activeWorkspaceId
        const apiResponse = await apikeyService.importKeys(req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Delete api key
const deleteApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.deleteApiKey - id not provided!`)
        }
        const apiResponse = await apikeyService.deleteApiKey(req.params.id, req.user?.activeWorkspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Verify api key
const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.apikey) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: apikeyController.verifyApiKey - apikey not provided!`)
        }
        const apiResponse = await apikeyService.verifyApiKey(req.params.apikey)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    createApiKey,
    deleteApiKey,
    getAllApiKeys,
    updateApiKey,
    verifyApiKey,
    importKeys
}
