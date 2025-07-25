import * as PropTypes from 'prop-types'
import moment from 'moment/moment'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// material-ui
import {
    Button,
    Box,
    Chip,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Popover,
    Collapse,
    Typography,
    alpha
} from '@mui/material'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import { useTheme, styled } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import APIKeyDialog from './APIKeyDialog'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import { PermissionButton, StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import { Available } from '@/ui-component/rbac/available'

// API
import apiKeyApi from '@/api/apikey'
import { useError } from '@/store/context/ErrorContext'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import {
    IconTrash,
    IconEdit,
    IconCopy,
    IconChevronsUp,
    IconChevronsDown,
    IconX,
    IconPlus,
    IconEye,
    IconEyeOff,
    IconFileUpload
} from '@tabler/icons-react'
import APIEmptySVG from '@/assets/images/api_empty.svg'
import UploadJSONFileDialog from '@/views/apikey/UploadJSONFileDialog'

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
    minWidth: 650,
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

const LoadingSkeleton = styled(Skeleton)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[700], 0.3) : alpha(theme.palette.grey[300], 0.3),
    borderRadius: 8,
    '&::after': {
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`
    }
}))

const StyledChip = styled(Chip)(({ theme }) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
    transition: 'all 0.2s ease',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    padding: 6,
    borderRadius: 8,
    transition: 'all 0.2s ease',
    marginLeft: 4,

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
    },

    '&.MuiIconButton-colorPrimary': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            borderColor: theme.palette.primary.main
        }
    },

    '&.MuiIconButton-colorError': {
        backgroundColor: alpha(theme.palette.error.main, 0.08),
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        '&:hover': {
            backgroundColor: alpha(theme.palette.error.main, 0.15),
            borderColor: theme.palette.error.main
        }
    },

    '&.MuiIconButton-colorSuccess': {
        backgroundColor: alpha(theme.palette.success.main, 0.08),
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        '&:hover': {
            backgroundColor: alpha(theme.palette.success.main, 0.15),
            borderColor: theme.palette.success.main
        }
    }
}))

const CollapsibleTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        fontSize: '0.8125rem',
        padding: '8px 16px'
    }
}))

function APIKeyRow(props) {
    const [open, setOpen] = useState(false)
    const theme = useTheme()

    return (
        <>
            <StyledTableRow>
                <StyledTableCell scope='row' style={{ width: '15%' }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{props.apiKey.keyName}</Typography>
                </StyledTableCell>
                <StyledTableCell style={{ width: '40%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.8125rem',
                                color: theme.palette.text.secondary,
                                flex: 1
                            }}
                        >
                            {props.showApiKeys.includes(props.apiKey.apiKey)
                                ? props.apiKey.apiKey
                                : `${props.apiKey.apiKey.substring(0, 2)}${'•'.repeat(18)}${props.apiKey.apiKey.substring(
                                      props.apiKey.apiKey.length - 5
                                  )}`}
                        </Typography>
                        <StyledIconButton title='Copy' color='success' onClick={props.onCopyClick} size='small'>
                            <IconCopy size={16} />
                        </StyledIconButton>
                        <StyledIconButton title='Show' color='inherit' onClick={props.onShowAPIClick} size='small'>
                            {props.showApiKeys.includes(props.apiKey.apiKey) ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </StyledIconButton>
                        <Popover
                            open={props.open}
                            anchorEl={props.anchorEl}
                            onClose={props.onClose}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left'
                            }}
                        >
                            <Typography variant='h6' sx={{ pl: 1, pr: 1, color: 'white', background: props.theme.palette.success.dark }}>
                                Copied!
                            </Typography>
                        </Popover>
                    </Box>
                </StyledTableCell>
                <StyledTableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                display: 'inline-block'
                            }}
                        >
                            {props.apiKey.chatFlows.length}
                        </Typography>
                        {props.apiKey.chatFlows.length > 0 && (
                            <StyledIconButton aria-label='expand row' size='small' color='inherit' onClick={() => setOpen(!open)}>
                                {open ? <IconChevronsUp size={16} /> : <IconChevronsDown size={16} />}
                            </StyledIconButton>
                        )}
                    </Box>
                </StyledTableCell>
                <StyledTableCell>
                    <Typography
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.8rem'
                        }}
                    >
                        {moment(props.apiKey.createdAt).format('MMM DD, YYYY')}
                    </Typography>
                </StyledTableCell>
                <Available permission={'apikeys:update,apikeys:create'}>
                    <StyledTableCell>
                        <StyledIconButton title='Edit' color='primary' onClick={props.onEditClick} size='small'>
                            <IconEdit size={16} />
                        </StyledIconButton>
                    </StyledTableCell>
                </Available>
                <Available permission={'apikeys:delete'}>
                    <StyledTableCell>
                        <StyledIconButton title='Delete' color='error' onClick={props.onDeleteClick} size='small'>
                            <IconTrash size={16} />
                        </StyledIconButton>
                    </StyledTableCell>
                </Available>
            </StyledTableRow>
            {open && (
                <TableRow sx={{ '& td': { border: 0 } }}>
                    <StyledTableCell sx={{ p: 2 }} colSpan={6}>
                        <Collapse in={open} timeout='auto' unmountOnExit>
                            <Box
                                sx={{
                                    borderRadius: 12,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                    overflow: 'hidden',
                                    backgroundColor:
                                        theme.palette.mode === 'dark'
                                            ? alpha(theme.palette.background.paper, 0.4)
                                            : alpha(theme.palette.grey[50], 0.6)
                                }}
                            >
                                <CollapsibleTable aria-label='chatflow table'>
                                    <TableHead sx={{ height: 40 }}>
                                        <TableRow>
                                            <StyledTableCell sx={{ width: '30%', fontSize: '0.75rem', padding: '8px 16px' }}>
                                                Chatflow Name
                                            </StyledTableCell>
                                            <StyledTableCell sx={{ width: '20%', fontSize: '0.75rem', padding: '8px 16px' }}>
                                                Modified On
                                            </StyledTableCell>
                                            <StyledTableCell sx={{ width: '50%', fontSize: '0.75rem', padding: '8px 16px' }}>
                                                Category
                                            </StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {props.apiKey.chatFlows.map((flow, index) => (
                                            <TableRow key={index}>
                                                <StyledTableCell sx={{ padding: '8px 16px' }}>
                                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{flow.flowName}</Typography>
                                                </StyledTableCell>
                                                <StyledTableCell sx={{ padding: '8px 16px' }}>
                                                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                                                        {moment(flow.updatedDate).format('MMM DD, YYYY')}
                                                    </Typography>
                                                </StyledTableCell>
                                                <StyledTableCell sx={{ padding: '8px 16px' }}>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {flow.category &&
                                                            flow.category
                                                                .split(';')
                                                                .filter((tag) => tag.trim())
                                                                .map((tag, index) => (
                                                                    <StyledChip key={index} label={tag.trim()} size='small' />
                                                                ))}
                                                    </Box>
                                                </StyledTableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </CollapsibleTable>
                            </Box>
                        </Collapse>
                    </StyledTableCell>
                </TableRow>
            )}
        </>
    )
}

APIKeyRow.propTypes = {
    apiKey: PropTypes.any,
    showApiKeys: PropTypes.arrayOf(PropTypes.any),
    onCopyClick: PropTypes.func,
    onShowAPIClick: PropTypes.func,
    open: PropTypes.bool,
    anchorEl: PropTypes.any,
    onClose: PropTypes.func,
    theme: PropTypes.any,
    onEditClick: PropTypes.func,
    onDeleteClick: PropTypes.func
}

const APIKey = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    const dispatch = useDispatch()
    useNotifier()
    const { error, setError } = useError()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [apiKeys, setAPIKeys] = useState([])
    const [anchorEl, setAnchorEl] = useState(null)
    const [showApiKeys, setShowApiKeys] = useState([])
    const openPopOver = Boolean(anchorEl)

    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [uploadDialogProps, setUploadDialogProps] = useState({})

    const [search, setSearch] = useState('')
    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }
    function filterKeys(data) {
        return data.keyName.toLowerCase().indexOf(search.toLowerCase()) > -1
    }

    const { confirm } = useConfirm()

    const getAllAPIKeysApi = useApi(apiKeyApi.getAllAPIKeys)

    const onShowApiKeyClick = (apikey) => {
        const index = showApiKeys.indexOf(apikey)
        if (index > -1) {
            const newShowApiKeys = showApiKeys.filter(function (item) {
                return item !== apikey
            })
            setShowApiKeys(newShowApiKeys)
        } else {
            setShowApiKeys((prevkeys) => [...prevkeys, apikey])
        }
    }

    const handleClosePopOver = () => {
        setAnchorEl(null)
    }

    const addNew = () => {
        const dialogProp = {
            title: 'Add New API Key',
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            customBtnId: 'btn_confirmAddingApiKey'
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const edit = (key) => {
        const dialogProp = {
            title: 'Edit API Key',
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            customBtnId: 'btn_confirmEditingApiKey',
            key
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const uploadDialog = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Upload',
            data: {}
        }
        setUploadDialogProps(dialogProp)
        setShowUploadDialog(true)
    }

    const deleteKey = async (key) => {
        const confirmPayload = {
            title: `Delete`,
            description:
                key.chatFlows.length === 0
                    ? `Delete key [${key.keyName}] ? `
                    : `Delete key [${key.keyName}] ?\n There are ${key.chatFlows.length} chatflows using this key.`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel',
            customBtnId: 'btn_initiateDeleteApiKey'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await apiKeyApi.deleteAPI(key.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'API key deleted',
                        options: {
                            key: new Date().getTime() + Math.random(),
                            variant: 'success',
                            action: (key) => (
                                <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                    <IconX />
                                </Button>
                            )
                        }
                    })
                    onConfirm()
                }
            } catch (error) {
                enqueueSnackbar({
                    message: `Failed to delete API key: ${
                        typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                    }`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        }
    }

    const onConfirm = () => {
        setShowDialog(false)
        setShowUploadDialog(false)
        getAllAPIKeysApi.request()
    }

    useEffect(() => {
        getAllAPIKeysApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setLoading(getAllAPIKeysApi.loading)
    }, [getAllAPIKeysApi.loading])

    useEffect(() => {
        if (getAllAPIKeysApi.data) {
            setAPIKeys(getAllAPIKeysApi.data)
        }
    }, [getAllAPIKeysApi.data])

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LoadingSkeleton variant='text' width='70%' height={20} />
                    <LoadingSkeleton variant='circular' width={24} height={24} />
                    <LoadingSkeleton variant='circular' width={24} height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='rounded' width={40} height={24} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <Available permission={'apikeys:update,apikeys:create'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={24} height={24} />
                </StyledTableCell>
            </Available>
            <Available permission={'apikeys:delete'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={24} height={24} />
                </StyledTableCell>
            </Available>
        </StyledTableRow>
    )

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader
                            onSearchChange={onSearchChange}
                            search={true}
                            searchPlaceholder='Search Access Keys'
                            title='Access Keys'
                            description='API & SDK authentication keys'
                        >
                            <PermissionButton
                                permissionId={'apikeys:import'}
                                variant='outlined'
                                sx={{ borderRadius: 2, height: '100%' }}
                                onClick={uploadDialog}
                                startIcon={<IconFileUpload />}
                                id='btn_importApiKeys'
                            >
                                Import
                            </PermissionButton>
                            <StyledPermissionButton
                                permissionId={'apikeys:create'}
                                variant='contained'
                                sx={{ borderRadius: 2, height: '100%' }}
                                onClick={addNew}
                                startIcon={<IconPlus />}
                                id='btn_createApiKey'
                            >
                                Create Key
                            </StyledPermissionButton>
                        </ViewHeader>
                        {!isLoading && apiKeys.length <= 0 ? (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                <Box sx={{ p: 2, height: 'auto' }}>
                                    <img
                                        style={{ objectFit: 'cover', height: '20vh', width: 'auto' }}
                                        src={APIEmptySVG}
                                        alt='APIEmptySVG'
                                    />
                                </Box>
                                <div>No API Keys Yet</div>
                            </Stack>
                        ) : (
                            <StyledTableContainer component={Paper}>
                                <StyledTable aria-label='API keys table'>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell style={{ width: '15%' }}>Key Name</StyledTableCell>
                                            <StyledTableCell style={{ width: '40%' }}>API Key</StyledTableCell>
                                            <StyledTableCell style={{ width: '15%' }}>Usage</StyledTableCell>
                                            <StyledTableCell style={{ width: '15%' }}>Updated</StyledTableCell>
                                            <Available permission={'apikeys:update,apikeys:create'}>
                                                <StyledTableCell style={{ width: '7%' }}>Edit</StyledTableCell>
                                            </Available>
                                            <Available permission={'apikeys:delete'}>
                                                <StyledTableCell style={{ width: '8%' }}>Delete</StyledTableCell>
                                            </Available>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading ? (
                                            <>
                                                {[...Array(3)].map((_, index) => (
                                                    <Box key={index}>{renderLoadingRow()}</Box>
                                                ))}
                                            </>
                                        ) : (
                                            apiKeys.filter(filterKeys).map((key, index) => (
                                                <APIKeyRow
                                                    key={`${key.id}-${index}`}
                                                    apiKey={key}
                                                    showApiKeys={showApiKeys}
                                                    onCopyClick={(event) => {
                                                        navigator.clipboard.writeText(key.apiKey)
                                                        setAnchorEl(event.currentTarget)
                                                        setTimeout(() => {
                                                            handleClosePopOver()
                                                        }, 1500)
                                                    }}
                                                    onShowAPIClick={() => onShowApiKeyClick(key.apiKey)}
                                                    open={openPopOver}
                                                    anchorEl={anchorEl}
                                                    onClose={handleClosePopOver}
                                                    theme={theme}
                                                    onEditClick={() => edit(key)}
                                                    onDeleteClick={() => deleteKey(key)}
                                                />
                                            ))
                                        )}
                                    </TableBody>
                                </StyledTable>
                            </StyledTableContainer>
                        )}
                    </Stack>
                )}
            </MainCard>
            <APIKeyDialog
                show={showDialog}
                dialogProps={dialogProps}
                onCancel={() => setShowDialog(false)}
                onConfirm={onConfirm}
                setError={setError}
            ></APIKeyDialog>
            {showUploadDialog && (
                <UploadJSONFileDialog
                    show={showUploadDialog}
                    dialogProps={uploadDialogProps}
                    onCancel={() => setShowUploadDialog(false)}
                    onConfirm={onConfirm}
                ></UploadJSONFileDialog>
            )}
            <ConfirmDialog />
        </>
    )
}

export default APIKey
