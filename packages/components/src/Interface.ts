import { BaseMessage } from '@langchain/core/messages'
import { BufferMemory, BufferWindowMemory, ConversationSummaryMemory, ConversationSummaryBufferMemory } from 'langchain/memory'
import { Moderation } from '../nodes/moderation/Moderation'

/**
 * Types
 */

export type NodeParamsType =
    | 'asyncOptions'
    | 'asyncMultiOptions'
    | 'options'
    | 'multiOptions'
    | 'datagrid'
    | 'string'
    | 'number'
    | 'boolean'
    | 'password'
    | 'json'
    | 'code'
    | 'date'
    | 'file'
    | 'folder'
    | 'tabs'

export type CommonType = string | number | boolean | undefined | null

export type MessageType = 'apiMessage' | 'userMessage'

export type ImageDetail = 'auto' | 'low' | 'high'

/**
 * Others
 */

export interface ICommonObject {
    [key: string]: any | CommonType | ICommonObject | CommonType[] | ICommonObject[]
}

export interface IVariable {
    name: string
    value: string
    type: string
}

export type IDatabaseEntity = {
    [key: string]: any
}

export interface IAttachment {
    content: string
    contentType: string
    size?: number
    filename?: string
}

export interface INodeOptionsValue {
    label: string
    name: string
    description?: string
    imageSrc?: string
}

export interface INodeOutputsValue {
    label: string
    name: string
    baseClasses?: string[]
    description?: string
    hidden?: boolean
    isAnchor?: boolean
}

export interface INodeParams {
    label: string
    name: string
    type: NodeParamsType | string
    default?: CommonType | ICommonObject | ICommonObject[]
    description?: string
    warning?: string
    options?: Array<INodeOptionsValue>
    datagrid?: Array<ICommonObject>
    credentialNames?: Array<string>
    optional?: boolean | INodeDisplay
    step?: number
    rows?: number
    list?: boolean
    acceptVariable?: boolean
    acceptNodeOutputAsVariable?: boolean
    placeholder?: string
    fileType?: string
    additionalParams?: boolean
    loadMethod?: string
    loadConfig?: boolean
    hidden?: boolean
    hideCodeExecute?: boolean
    codeExample?: string
    hint?: Record<string, string>
    tabIdentifier?: string
    tabs?: Array<INodeParams>
    refresh?: boolean
    freeSolo?: boolean
    loadPreviousNodes?: boolean
    array?: Array<INodeParams>
    show?: INodeDisplay
    hide?: INodeDisplay
    generateDocStoreDescription?: boolean
    generateInstruction?: boolean
}

export interface INodeExecutionData {
    [key: string]: CommonType | CommonType[] | ICommonObject | ICommonObject[]
}

export interface INodeDisplay {
    [key: string]: string[] | string | boolean | number | ICommonObject
}

export interface INodeProperties {
    label: string
    name: string
    type: string
    icon: string
    version: number
    category: string // TODO: use enum instead of string
    baseClasses: string[]
    tags?: string[]
    description?: string
    filePath?: string
    badge?: string
    deprecateMessage?: string
    hideOutput?: boolean
    hideInput?: boolean
    author?: string
    documentation?: string
    color?: string
    hint?: string
}

export interface INode extends INodeProperties {
    credential?: INodeParams
    inputs?: INodeParams[]
    output?: INodeOutputsValue[]
    loadMethods?: {
        [key: string]: (nodeData: INodeData, options?: ICommonObject) => Promise<INodeOptionsValue[]>
    }
    vectorStoreMethods?: {
        upsert: (nodeData: INodeData, options?: ICommonObject) => Promise<IndexingResult | void>
        search: (nodeData: INodeData, options?: ICommonObject) => Promise<any>
        delete: (nodeData: INodeData, ids: string[], options?: ICommonObject) => Promise<void>
    }
    init?(nodeData: INodeData, input: string, options?: ICommonObject): Promise<any>
    run?(nodeData: INodeData, input: string, options?: ICommonObject): Promise<string | ICommonObject>
}

export interface INodeData extends INodeProperties {
    id: string
    inputs?: ICommonObject
    outputs?: ICommonObject
    credential?: string
    instance?: any
    loadMethod?: string // method to load async options
}

export interface INodeCredential {
    label: string
    name: string
    description?: string
    inputs?: INodeParams[]
}

export interface IMessage {
    message: string
    type: MessageType
    role?: MessageType
    content?: string
}

export interface IUsedTool {
    tool: string
    toolInput: object
    toolOutput: string | object
    sourceDocuments?: ICommonObject[]
    error?: string
}

export interface IMultiAgentNode {
    node: any
    name: string
    label: string
    type: 'supervisor' | 'worker'
    llm?: any
    parentSupervisorName?: string
    workers?: string[]
    workerPrompt?: string
    workerInputVariables?: string[]
    recursionLimit?: number
    moderations?: Moderation[]
    multiModalMessageContent?: MessageContentImageUrl[]
    checkpointMemory?: any
}

type SeqAgentType = 'agent' | 'condition' | 'end' | 'start' | 'tool' | 'state' | 'llm' | 'utilities'
export type ConversationHistorySelection = 'user_question' | 'last_message' | 'all_messages' | 'empty'

export interface ISeqAgentNode {
    id: string
    node: any
    name: string
    label: string
    type: SeqAgentType
    output: string
    llm?: any
    startLLM?: any
    predecessorAgents?: ISeqAgentNode[]
    recursionLimit?: number
    moderations?: Moderation[]
    multiModalMessageContent?: MessageContentImageUrl[]
    checkpointMemory?: any
    agentInterruptToolNode?: any
    agentInterruptToolFunc?: any
}

export interface ITeamState {
    messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => BaseMessage[]
        default: () => BaseMessage[]
    }
    team_members: string[]
    next: string
    instructions: string
    summarization?: string
}

export interface ISeqAgentsState {
    messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => BaseMessage[]
        default: () => BaseMessage[]
    }
}

export interface IAgentReasoning {
    agentName: string
    messages: string[]
    next?: string
    instructions?: string
    usedTools?: IUsedTool[]
    sourceDocuments?: ICommonObject[]
    state?: ICommonObject
    nodeName?: string
}

export interface IAction {
    id?: string
    elements?: Array<{ type: string; label: string }>
    mapping?: { approve: string; reject: string; toolCalls: any[] }
}

export interface IFileUpload {
    data?: string
    type: string
    name: string
    mime: string
}

export interface IMultiModalOption {
    image?: Record<string, any>
    audio?: Record<string, any>
}

export type MessageContentText = {
    type: 'text'
    text: string
}

export type MessageContentImageUrl = {
    type: 'image_url'
    image_url:
        | string
        | {
              url: string
              detail?: ImageDetail
          }
}

export interface IDocument<Metadata extends Record<string, any> = Record<string, any>> {
    pageContent: string
    metadata: Metadata
}

/**
 * Classes
 */

import { PromptTemplate as LangchainPromptTemplate, PromptTemplateInput } from '@langchain/core/prompts'
import { VectorStore } from '@langchain/core/vectorstores'
import { Document } from '@langchain/core/documents'

export class PromptTemplate extends LangchainPromptTemplate {
    promptValues: ICommonObject

    constructor(input: PromptTemplateInput) {
        super(input)
    }
}

export interface PromptRetrieverInput {
    name: string
    description: string
    systemMessage: string
}

const fixedTemplate = `Here is a question:
{input}
`
export class PromptRetriever {
    name: string
    description: string
    systemMessage: string

    constructor(fields: PromptRetrieverInput) {
        this.name = fields.name
        this.description = fields.description
        this.systemMessage = `${fields.systemMessage}\n${fixedTemplate}`
    }
}

export interface VectorStoreRetrieverInput {
    name: string
    description: string
    vectorStore: VectorStore
}

export class VectorStoreRetriever {
    name: string
    description: string
    vectorStore: VectorStore

    constructor(fields: VectorStoreRetrieverInput) {
        this.name = fields.name
        this.description = fields.description
        this.vectorStore = fields.vectorStore
    }
}

/**
 * Implement abstract classes and interface for memory
 */

export interface MemoryMethods {
    getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseMemory extends BufferMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseWindowMemory extends BufferWindowMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseSummaryMemory extends ConversationSummaryMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseSummaryBufferMemory extends ConversationSummaryBufferMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export type IndexingResult = {
    numAdded: number
    numDeleted: number
    numUpdated: number
    numSkipped: number
    totalKeys: number
    addedDocs: Document[]
}

export interface IVisionChatModal {
    id: string
    configuredModel: string
    multiModalOption: IMultiModalOption
    configuredMaxToken?: number
    setVisionModel(): void
    revertToOriginalModel(): void
    setMultiModalOption(multiModalOption: IMultiModalOption): void
}

export interface IStateWithMessages extends ICommonObject {
    messages: BaseMessage[]
    [key: string]: any
}

export * from './Interface.Evaluation'

export interface IServerSideEventStreamer {
    streamStartEvent(chatId: string, data: any): void
    streamTokenEvent(chatId: string, data: string): void
    streamCustomEvent(chatId: string, eventType: string, data: any): void
    streamSourceDocumentsEvent(chatId: string, data: any): void
    streamUsedToolsEvent(chatId: string, data: any): void
    streamCalledToolsEvent(chatId: string, data: any): void
    streamFileAnnotationsEvent(chatId: string, data: any): void
    streamToolEvent(chatId: string, data: any): void
    streamAgentReasoningEvent(chatId: string, data: any): void
    streamAgentFlowExecutedDataEvent(chatId: string, data: any): void
    streamAgentFlowEvent(chatId: string, data: any): void
    streamNextAgentEvent(chatId: string, data: any): void
    streamNextAgentFlowEvent(chatId: string, data: any): void
    streamActionEvent(chatId: string, data: any): void
    streamArtifactsEvent(chatId: string, data: any): void
    streamAbortEvent(chatId: string): void
    streamEndEvent(chatId: string): void
    streamUsageMetadataEvent(chatId: string, data: any): void
}

export enum FollowUpPromptProvider {
    ANTHROPIC = 'chatAnthropic',
    AZURE_OPENAI = 'azureChatOpenAI',
    GOOGLE_GENAI = 'chatGoogleGenerativeAI',
    MISTRALAI = 'chatMistralAI',
    OPENAI = 'chatOpenAI',
    GROQ = 'groqChat',
    OLLAMA = 'ollama'
}

export type FollowUpPromptProviderConfig = {
    [key in FollowUpPromptProvider]: {
        credentialId: string
        modelName: string
        baseUrl: string
        prompt: string
        temperature: string
    }
}

export type FollowUpPromptConfig = {
    status: boolean
    selectedProvider: FollowUpPromptProvider
} & FollowUpPromptProviderConfig

export interface ICondition {
    type: string
    value1: CommonType
    operation: string
    value2: CommonType
    isFulfilled?: boolean
}

export interface IHumanInput {
    type: 'proceed' | 'reject'
    startNodeId: string
    feedback?: string
}
