import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// material-ui
import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, alpha } from '@mui/material'
import { useTheme, styled } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import AddDocStoreDialog from '@/views/docstore/AddDocStoreDialog'
import ErrorBoundary from '@/ErrorBoundary'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import DocumentStoreStatus from '@/views/docstore/DocumentStoreStatus'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'

// API
import useApi from '@/hooks/useApi'
import documentsApi from '@/api/documentstore'

// icons
import { IconPlus } from '@tabler/icons-react'
import doc_store_empty from '@/assets/images/doc_store_empty.svg'

// const
import { baseURL } from '@/store/constant'
import { useError } from '@/store/context/ErrorContext'

// Enhanced styled components matching the previous tables
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    borderRadius: 16,
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    background:
        theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
}))

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
    }
}))

// Improved table header styling - less bulged, more refined
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: alpha(theme.palette.divider, 0.08),

    [`&.${tableCellClasses.head}`]: {
        background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : alpha(theme.palette.grey[50], 0.8),
        color: theme.palette.text.primary,
        fontWeight: 600,
        fontSize: '0.8125rem',
        letterSpacing: '0.025em',
        textTransform: 'uppercase',
        padding: '12px 20px',
        height: 48,
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)'
    },

    [`&.${tableCellClasses.body}`]: {
        fontSize: '0.875rem',
        fontWeight: 400,
        color: theme.palette.text.primary,
        padding: '16px 20px',
        transition: 'all 0.2s ease'
    }
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.04),
        transform: 'translateY(-1px)',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.08)'
    },

    '&:last-child td, &:last-child th': {
        border: 0
    },

    '&:nth-of-type(even)': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.02) : alpha(theme.palette.grey[50], 0.3)
    }
}))

const LoaderImageContainer = styled(Box)(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.grey[100], 0.8),
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',

    '&:hover': {
        transform: 'scale(1.1)',
        borderColor: theme.palette.primary.main,
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
    },

    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
            theme.palette.secondary.main,
            0.1
        )} 100%)`,
        opacity: 0,
        transition: 'opacity 0.2s ease'
    },

    '&:hover::before': {
        opacity: 1
    }
}))

// ==============================|| DOCUMENTS ||============================== //

const Documents = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const navigate = useNavigate()
    const getAllDocumentStores = useApi(documentsApi.getAllDocumentStores)
    const { error } = useError()

    const [isLoading, setLoading] = useState(true)
    const [images, setImages] = useState({})
    const [search, setSearch] = useState('')
    const [showDialog, setShowDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [docStores, setDocStores] = useState([])

    function filterDocStores(data) {
        return data.name.toLowerCase().indexOf(search.toLowerCase()) > -1
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    const goToDocumentStore = (id) => {
        navigate('/document-stores/' + id)
    }

    const addNew = () => {
        const dialogProp = {
            title: 'Add New Document Store',
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add'
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const onConfirm = () => {
        setShowDialog(false)
        getAllDocumentStores.request()
    }

    useEffect(() => {
        getAllDocumentStores.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getAllDocumentStores.data) {
            try {
                const docStores = getAllDocumentStores.data
                if (!Array.isArray(docStores)) return
                const loaderImages = {}

                for (let i = 0; i < docStores.length; i += 1) {
                    const loaders = docStores[i].loaders ?? []

                    let totalChunks = 0
                    let totalChars = 0
                    loaderImages[docStores[i].id] = []
                    for (let j = 0; j < loaders.length; j += 1) {
                        const imageSrc = `${baseURL}/api/v1/node-icon/${loaders[j].loaderId}`
                        if (!loaderImages[docStores[i].id].includes(imageSrc)) {
                            loaderImages[docStores[i].id].push(imageSrc)
                        }
                        totalChunks += loaders[j]?.totalChunks ?? 0
                        totalChars += loaders[j]?.totalChars ?? 0
                    }
                    docStores[i].totalDocs = loaders?.length ?? 0
                    docStores[i].totalChunks = totalChunks
                    docStores[i].totalChars = totalChars
                }
                setDocStores(docStores)
                setImages(loaderImages)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllDocumentStores.data])

    useEffect(() => {
        setLoading(getAllDocumentStores.loading)
    }, [getAllDocumentStores.loading])

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader
                        onSearchChange={onSearchChange}
                        search={true}
                        searchPlaceholder='Search Name'
                        title='Knowledge Base'
                        description='Store and upsert documents for LLM retrieval (RAG)'
                    >
                        <StyledPermissionButton
                            permissionId={'documentStores:create'}
                            variant='contained'
                            sx={{ borderRadius: 2, height: '100%' }}
                            onClick={addNew}
                            startIcon={<IconPlus />}
                            id='btn_createVariable'
                        >
                            Add New
                        </StyledPermissionButton>
                    </ViewHeader>

                    <StyledTableContainer component={Paper}>
                        <StyledTable aria-label='documents table'>
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell style={{ width: '8%' }}>Status</StyledTableCell>
                                    <StyledTableCell style={{ width: '18%' }}>Name</StyledTableCell>
                                    <StyledTableCell style={{ width: '25%' }}>Description</StyledTableCell>
                                    <StyledTableCell style={{ width: '12%' }}>Connected flows</StyledTableCell>
                                    <StyledTableCell style={{ width: '12%' }}>Total characters</StyledTableCell>
                                    <StyledTableCell style={{ width: '10%' }}>Total chunks</StyledTableCell>
                                    <StyledTableCell style={{ width: '15%' }}>Loader types</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {docStores?.filter(filterDocStores).map((data, index) => (
                                    <StyledTableRow onClick={() => goToDocumentStore(data.id)} key={`${data.id}-${index}`}>
                                        <StyledTableCell align='center'>
                                            <DocumentStoreStatus isTableView={true} status={data.status} />
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography
                                                sx={{
                                                    display: '-webkit-box',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.4
                                                }}
                                            >
                                                {data.name}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography
                                                sx={{
                                                    display: '-webkit-box',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 400,
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.3,
                                                    color: theme.palette.text.secondary
                                                }}
                                            >
                                                {data?.description || (
                                                    <span
                                                        style={{
                                                            fontStyle: 'italic',
                                                            color: theme.palette.text.disabled
                                                        }}
                                                    >
                                                        No description
                                                    </span>
                                                )}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 500,
                                                    color: theme.palette.text.secondary,
                                                    padding: '4px 8px',
                                                    backgroundColor:
                                                        theme.palette.mode === 'dark'
                                                            ? alpha(theme.palette.info.main, 0.1)
                                                            : alpha(theme.palette.info.main, 0.08),
                                                    borderRadius: 1,
                                                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                                    display: 'inline-block',
                                                    minWidth: 'fit-content'
                                                }}
                                            >
                                                {data.whereUsed?.length ?? 0}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 400,
                                                    color: theme.palette.text.secondary
                                                }}
                                            >
                                                {data.totalChars?.toLocaleString() || 0}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 400,
                                                    color: theme.palette.text.secondary
                                                }}
                                            >
                                                {data.totalChunks?.toLocaleString() || 0}
                                            </Typography>
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            {images[data.id] && images[data.id].length > 0 ? (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: 1,
                                                        flexWrap: 'wrap'
                                                    }}
                                                >
                                                    {images[data.id].slice(0, 3).map((img, imgIndex) => (
                                                        <LoaderImageContainer key={`${img}-${imgIndex}`}>
                                                            <img
                                                                style={{
                                                                    width: '18px',
                                                                    height: '18px',
                                                                    objectFit: 'contain',
                                                                    zIndex: 1
                                                                }}
                                                                alt='Loader'
                                                                src={img}
                                                            />
                                                        </LoaderImageContainer>
                                                    ))}
                                                    {images[data.id].length > 3 && (
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                color: 'text.secondary',
                                                                ml: 0.5
                                                            }}
                                                        >
                                                            +{images[data.id].length - 3}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant='body2' fontSize='0.75rem' color='text.secondary'>
                                                    —
                                                </Typography>
                                            )}
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </StyledTable>
                    </StyledTableContainer>

                    {!isLoading && (!docStores || docStores.length === 0) && (
                        <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                            <Box sx={{ p: 2, height: 'auto' }}>
                                <img
                                    style={{ objectFit: 'cover', height: '20vh', width: 'auto' }}
                                    src={doc_store_empty}
                                    alt='doc_store_empty'
                                />
                            </Box>
                            <div>No Document Stores Created Yet</div>
                        </Stack>
                    )}
                </Stack>
            )}
            {showDialog && (
                <AddDocStoreDialog
                    dialogProps={dialogProps}
                    show={showDialog}
                    onCancel={() => setShowDialog(false)}
                    onConfirm={onConfirm}
                />
            )}
        </MainCard>
    )
}

export default Documents
