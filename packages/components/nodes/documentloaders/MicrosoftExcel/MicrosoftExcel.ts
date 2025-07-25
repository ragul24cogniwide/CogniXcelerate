import { TextSplitter } from 'langchain/text_splitter'
import { LoadOfSheet } from './ExcelLoader'
import { getFileFromStorage, handleDocumentLoaderDocuments, handleDocumentLoaderMetadata, handleDocumentLoaderOutput } from '../../../src'
import { ICommonObject, IDocument, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'

class MicrosoftExcel_DocumentLoaders implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Microsoft Excel'
        this.name = 'microsoftExcel'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'excel.svg'
        this.category = 'Document Loaders'
        this.description = `Load data from Microsoft Excel files`
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Excel File',
                name: 'excelFile',
                type: 'file',
                fileType: '.xlsx, .xls, .xlsm, .xlsb'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description:
                    'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ]
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ]
    }

    getFiles(nodeData: INodeData) {
        const excelFileBase64 = nodeData.inputs?.excelFile as string

        let files: string[] = []
        let fromStorage: boolean = true

        if (excelFileBase64.startsWith('FILE-STORAGE::')) {
            const fileName = excelFileBase64.replace('FILE-STORAGE::', '')
            if (fileName.startsWith('[') && fileName.endsWith(']')) {
                files = JSON.parse(fileName)
            } else {
                files = [fileName]
            }
        } else {
            if (excelFileBase64.startsWith('[') && excelFileBase64.endsWith(']')) {
                files = JSON.parse(excelFileBase64)
            } else {
                files = [excelFileBase64]
            }

            fromStorage = false
        }

        return { files, fromStorage }
    }

    async getFileData(file: string, { orgId, chatflowid }: { orgId: string; chatflowid: string }, fromStorage?: boolean) {
        if (fromStorage) {
            return getFileFromStorage(file, orgId, chatflowid)
        } else {
            const splitDataURI = file.split(',')
            splitDataURI.pop()
            return Buffer.from(splitDataURI.pop() || '', 'base64')
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const metadata = nodeData.inputs?.metadata
        const output = nodeData.outputs?.output as string
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string

        let docs: IDocument[] = []

        const orgId = options.orgId
        const chatflowid = options.chatflowid

        const { files, fromStorage } = this.getFiles(nodeData)

        for (const file of files) {
            if (!file) continue

            const fileData = await this.getFileData(file, { orgId, chatflowid }, fromStorage)
            const blob = new Blob([fileData])
            const loader = new LoadOfSheet(blob)

            // use spread instead of push, because it raises RangeError: Maximum call stack size exceeded when too many docs
            docs = [...docs, ...(await handleDocumentLoaderDocuments(loader, textSplitter))]
        }

        docs = handleDocumentLoaderMetadata(docs, _omitMetadataKeys, metadata)

        return handleDocumentLoaderOutput(docs, output)
    }
}

module.exports = { nodeClass: MicrosoftExcel_DocumentLoaders }
