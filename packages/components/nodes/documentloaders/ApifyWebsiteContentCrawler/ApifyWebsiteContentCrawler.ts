import { omit } from 'lodash'
import { INode, INodeData, INodeParams, ICommonObject, INodeOutputsValue } from '../../../src/Interface'
import { getCredentialData, getCredentialParam, handleEscapeCharacters } from '../../../src/utils'
import { TextSplitter } from 'langchain/text_splitter'
import { ApifyDatasetLoader } from '@langchain/community/document_loaders/web/apify_dataset'
import { Document } from '@langchain/core/documents'

class ApifyWebsiteContentCrawler_DocumentLoaders implements INode {
    label: string
    name: string
    description: string
    type: string
    icon: string
    version: number
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Apify Website Content Crawler'
        this.name = 'apifyWebsiteContentCrawler'
        this.type = 'Document'
        this.icon = 'apify-symbol-transparent.svg'
        this.version = 3.0
        this.category = 'Document Loaders'
        this.description = 'Load data from Apify Website Content Crawler'
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Connect Apify API',
            name: 'credential',
            type: 'credential',
            credentialNames: ['apifyApi']
        }
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Start URLs',
                name: 'urls',
                type: 'string',
                description: 'One or more URLs of pages where the crawler will start, separated by commas.',
                placeholder: 'https://js.langchain.com/docs/'
            },
            {
                label: 'Crawler type',
                type: 'options',
                name: 'crawlerType',
                options: [
                    {
                        label: 'Headless web browser (Chrome+Playwright)',
                        name: 'playwright:chrome'
                    },
                    {
                        label: 'Stealthy web browser (Firefox+Playwright)',
                        name: 'playwright:firefox'
                    },
                    {
                        label: 'Raw HTTP client (Cheerio)',
                        name: 'cheerio'
                    },
                    {
                        label: 'Raw HTTP client with JavaScript execution (JSDOM) [experimental]',
                        name: 'jsdom'
                    }
                ],
                description:
                    'Select the crawling engine, see <a target="_blank" href="https://apify.com/apify/website-content-crawler#crawling">documentation</a> for additional information.',
                default: 'playwright:firefox'
            },
            {
                label: 'Max crawling depth',
                name: 'maxCrawlDepth',
                type: 'number',
                optional: true,
                default: 1,
                additionalParams: true
            },
            {
                label: 'Max crawl pages',
                name: 'maxCrawlPages',
                type: 'number',
                optional: true,
                default: 3,
                additionalParams: true
            },
            {
                label: 'Additional input',
                name: 'additionalInput',
                type: 'json',
                default: JSON.stringify({}),
                description:
                    'For additional input options for the crawler see <a target="_blank" href="https://apify.com/apify/website-content-crawler/input-schema">documentation</a>.',
                optional: true,
                additionalParams: true
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

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const metadata = nodeData.inputs?.metadata
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const output = nodeData.outputs?.output as string

        let omitMetadataKeys: string[] = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }

        // Get input options and merge with additional input
        const urls = nodeData.inputs?.urls as string
        const crawlerType = nodeData.inputs?.crawlerType as string
        const maxCrawlDepth = nodeData.inputs?.maxCrawlDepth as string
        const maxCrawlPages = nodeData.inputs?.maxCrawlPages as string
        const additionalInput =
            typeof nodeData.inputs?.additionalInput === 'object'
                ? nodeData.inputs?.additionalInput
                : JSON.parse(nodeData.inputs?.additionalInput as string)
        const input = {
            startUrls: urls.split(',').map((url) => ({ url: url.trim() })),
            crawlerType,
            maxCrawlDepth: parseInt(maxCrawlDepth, 10),
            maxCrawlPages: parseInt(maxCrawlPages, 10),
            ...additionalInput
        }

        // Get Apify API token from credential data
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apifyApiToken = getCredentialParam('apifyApiToken', credentialData, nodeData)

        const loader = await ApifyDatasetLoader.fromActorCall('apify/website-content-crawler', input, {
            datasetMappingFunction: (item) =>
                new Document({
                    pageContent: (item.text || '') as string,
                    metadata: { source: item.url }
                }),
            clientOptions: {
                token: apifyApiToken
            }
        })

        let docs = []

        if (textSplitter) {
            docs = await loader.load()
            docs = await textSplitter.splitDocuments(docs)
        } else {
            docs = await loader.load()
        }

        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata)
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {
                              ...parsedMetadata
                          }
                        : omit(
                              {
                                  ...doc.metadata,
                                  ...parsedMetadata
                              },
                              omitMetadataKeys
                          )
            }))
        } else {
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {}
                        : omit(
                              {
                                  ...doc.metadata
                              },
                              omitMetadataKeys
                          )
            }))
        }

        if (output === 'document') {
            return docs
        } else {
            let finaltext = ''
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`
            }
            return handleEscapeCharacters(finaltext, false)
        }
    }
}

module.exports = { nodeClass: ApifyWebsiteContentCrawler_DocumentLoaders }
