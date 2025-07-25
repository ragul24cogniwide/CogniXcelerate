import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import moment from 'moment'

// material-ui
import { styled } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'
import {
    Button,
    Box,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    useTheme,
    alpha
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { PermissionIconButton, StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import CredentialListDialog from './CredentialListDialog'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import AddEditCredentialDialog from './AddEditCredentialDialog'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'

// API
import credentialsApi from '@/api/credentials'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import { IconTrash, IconEdit, IconX, IconPlus, IconShare } from '@tabler/icons-react'
import CredentialEmptySVG from '@/assets/images/credential_empty.svg'
import keySVG from '@/assets/images/key.svg'

// const
import { baseURL } from '@/store/constant'
import { SET_COMPONENT_CREDENTIALS } from '@/store/actions'
import { useError } from '@/store/context/ErrorContext'
import ShareWithWorkspaceDialog from '@/ui-component/dialog/ShareWithWorkspaceDialog'

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

const CredentialIconContainer = styled(Box)(({ theme }) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.grey[100], 0.8),
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,

    '&:hover': {
        transform: 'scale(1.05)',
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

const StyledPermissionIconButton = styled(PermissionIconButton)(({ theme }) => ({
    padding: 8,
    borderRadius: 8,
    transition: 'all 0.2s ease',

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

// ==============================|| Credentials ||============================== //

const Credentials = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()
    useNotifier()
    const { error, setError } = useError()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [showCredentialListDialog, setShowCredentialListDialog] = useState(false)
    const [credentialListDialogProps, setCredentialListDialogProps] = useState({})
    const [showSpecificCredentialDialog, setShowSpecificCredentialDialog] = useState(false)
    const [specificCredentialDialogProps, setSpecificCredentialDialogProps] = useState({})
    const [credentials, setCredentials] = useState([])
    const [componentsCredentials, setComponentsCredentials] = useState([])

    const [showShareCredentialDialog, setShowShareCredentialDialog] = useState(false)
    const [shareCredentialDialogProps, setShareCredentialDialogProps] = useState({})

    const { confirm } = useConfirm()

    const getAllCredentialsApi = useApi(credentialsApi.getAllCredentials)
    const getAllComponentsCredentialsApi = useApi(credentialsApi.getAllComponentsCredentials)

    const [search, setSearch] = useState('')
    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }
    function filterCredentials(data) {
        return data.credentialName.toLowerCase().indexOf(search.toLowerCase()) > -1
    }

    const listCredential = () => {
        const dialogProp = {
            title: 'Add New Credential',
            componentsCredentials
        }
        setCredentialListDialogProps(dialogProp)
        setShowCredentialListDialog(true)
    }

    const addNew = (credentialComponent) => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            credentialComponent
        }
        setSpecificCredentialDialogProps(dialogProp)
        setShowSpecificCredentialDialog(true)
    }

    const edit = (credential) => {
        const dialogProp = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            data: credential
        }
        setSpecificCredentialDialogProps(dialogProp)
        setShowSpecificCredentialDialog(true)
    }

    const share = (credential) => {
        const dialogProps = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Share',
            data: {
                id: credential.id,
                name: credential.name,
                title: 'Share Credential',
                itemType: 'credential'
            }
        }
        setShareCredentialDialogProps(dialogProps)
        setShowShareCredentialDialog(true)
    }

    const deleteCredential = async (credential) => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete credential ${credential.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await credentialsApi.deleteCredential(credential.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'Credential deleted',
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
                    message: `Failed to delete Credential: ${
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

    const onCredentialSelected = (credentialComponent) => {
        setShowCredentialListDialog(false)
        addNew(credentialComponent)
    }

    const onConfirm = () => {
        setShowCredentialListDialog(false)
        setShowSpecificCredentialDialog(false)
        getAllCredentialsApi.request()
    }

    useEffect(() => {
        getAllCredentialsApi.request()
        getAllComponentsCredentialsApi.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setLoading(getAllCredentialsApi.loading)
    }, [getAllCredentialsApi.loading])

    useEffect(() => {
        if (getAllCredentialsApi.data) {
            setCredentials(getAllCredentialsApi.data)
        }
    }, [getAllCredentialsApi.data])

    useEffect(() => {
        if (getAllComponentsCredentialsApi.data) {
            setComponentsCredentials(getAllComponentsCredentialsApi.data)
            dispatch({ type: SET_COMPONENT_CREDENTIALS, componentsCredentials: getAllComponentsCredentialsApi.data })
        }
    }, [getAllComponentsCredentialsApi.data, dispatch])

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LoadingSkeleton variant='circular' width={40} height={40} />
                    <LoadingSkeleton variant='text' width='60%' height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={32} height={32} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={32} height={32} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='circular' width={32} height={32} />
            </StyledTableCell>
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
                            searchPlaceholder='Search Credentials'
                            title='Credentials'
                            description='API keys, tokens, and secrets for 3rd party integrations'
                        >
                            <StyledPermissionButton
                                permissionId='credentials:create'
                                variant='contained'
                                sx={{ borderRadius: 2, height: '100%' }}
                                onClick={listCredential}
                                startIcon={<IconPlus />}
                            >
                                Add Credential
                            </StyledPermissionButton>
                        </ViewHeader>
                        {!isLoading && credentials.length <= 0 ? (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                <Box sx={{ p: 2, height: 'auto' }}>
                                    <img
                                        style={{ objectFit: 'cover', height: '16vh', width: 'auto' }}
                                        src={CredentialEmptySVG}
                                        alt='CredentialEmptySVG'
                                    />
                                </Box>
                                <div>No Credentials Yet</div>
                            </Stack>
                        ) : (
                            <StyledTableContainer component={Paper}>
                                <StyledTable aria-label='credentials table'>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell style={{ width: '40%' }}>Credential Name</StyledTableCell>
                                            <StyledTableCell style={{ width: '20%' }}>Last Updated</StyledTableCell>
                                            <StyledTableCell style={{ width: '20%' }}>Created</StyledTableCell>
                                            <StyledTableCell style={{ width: '7%' }}>Share</StyledTableCell>
                                            <StyledTableCell style={{ width: '7%' }}>Edit</StyledTableCell>
                                            <StyledTableCell style={{ width: '6%' }}>Delete</StyledTableCell>
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
                                            credentials.filter(filterCredentials).map((credential, index) => (
                                                <StyledTableRow key={`${credential.id}-${index}`}>
                                                    <StyledTableCell scope='row'>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 2
                                                            }}
                                                        >
                                                            <CredentialIconContainer>
                                                                <img
                                                                    style={{
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        objectFit: 'contain',
                                                                        zIndex: 1
                                                                    }}
                                                                    alt={credential.credentialName}
                                                                    src={`${baseURL}/api/v1/components-credentials-icon/${credential.credentialName}`}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null
                                                                        e.target.src = keySVG
                                                                    }}
                                                                />
                                                            </CredentialIconContainer>
                                                            <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{credential.name}</Box>
                                                        </Box>
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Box
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.8rem',
                                                                lineHeight: 1.2
                                                            }}
                                                        >
                                                            {moment(credential.updatedDate).format('MMM DD, YYYY')}
                                                            <br />
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                {moment(credential.updatedDate).format('HH:mm')}
                                                            </span>
                                                        </Box>
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Box
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.8rem',
                                                                lineHeight: 1.2
                                                            }}
                                                        >
                                                            {moment(credential.createdDate).format('MMM DD, YYYY')}
                                                            <br />
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                {moment(credential.createdDate).format('HH:mm')}
                                                            </span>
                                                        </Box>
                                                    </StyledTableCell>
                                                    {!credential.shared ? (
                                                        <>
                                                            <StyledTableCell>
                                                                <StyledPermissionIconButton
                                                                    permissionId={'credentials:share'}
                                                                    display={'feat:workspaces'}
                                                                    title='Share'
                                                                    color='primary'
                                                                    onClick={() => share(credential)}
                                                                >
                                                                    <IconShare />
                                                                </StyledPermissionIconButton>
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                <StyledPermissionIconButton
                                                                    permissionId={'credentials:create,credentials:update'}
                                                                    title='Edit'
                                                                    color='primary'
                                                                    onClick={() => edit(credential)}
                                                                >
                                                                    <IconEdit />
                                                                </StyledPermissionIconButton>
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                <StyledPermissionIconButton
                                                                    permissionId={'credentials:delete'}
                                                                    title='Delete'
                                                                    color='error'
                                                                    onClick={() => deleteCredential(credential)}
                                                                >
                                                                    <IconTrash />
                                                                </StyledPermissionIconButton>
                                                            </StyledTableCell>
                                                        </>
                                                    ) : (
                                                        <StyledTableCell colSpan={3}>
                                                            <Box
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
                                                                Shared Credential
                                                            </Box>
                                                        </StyledTableCell>
                                                    )}
                                                </StyledTableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </StyledTable>
                            </StyledTableContainer>
                        )}
                    </Stack>
                )}
            </MainCard>
            <CredentialListDialog
                show={showCredentialListDialog}
                dialogProps={credentialListDialogProps}
                onCancel={() => setShowCredentialListDialog(false)}
                onCredentialSelected={onCredentialSelected}
            ></CredentialListDialog>
            {showSpecificCredentialDialog && (
                <AddEditCredentialDialog
                    show={showSpecificCredentialDialog}
                    dialogProps={specificCredentialDialogProps}
                    onCancel={() => setShowSpecificCredentialDialog(false)}
                    onConfirm={onConfirm}
                    setError={setError}
                ></AddEditCredentialDialog>
            )}
            {showShareCredentialDialog && (
                <ShareWithWorkspaceDialog
                    show={showShareCredentialDialog}
                    dialogProps={shareCredentialDialogProps}
                    onCancel={() => setShowShareCredentialDialog(false)}
                    setError={setError}
                ></ShareWithWorkspaceDialog>
            )}
            <ConfirmDialog />
        </>
    )
}

export default Credentials
