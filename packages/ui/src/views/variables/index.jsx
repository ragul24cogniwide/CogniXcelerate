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
    IconButton,
    Chip,
    useTheme,
    alpha,
    Typography
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import AddEditVariableDialog from './AddEditVariableDialog'
import HowToUseVariablesDialog from './HowToUseVariablesDialog'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import { StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import { Available } from '@/ui-component/rbac/available'
import { refreshVariablesCache } from '@/ui-component/input/suggestionOption'

// API
import variablesApi from '@/api/variables'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import { IconTrash, IconEdit, IconX, IconPlus, IconVariable } from '@tabler/icons-react'
import VariablesEmptySVG from '@/assets/images/variables_empty.svg'

// const
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

const VariableIconContainer = styled(Box)(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    marginRight: 12,
    flexShrink: 0,

    '&:hover': {
        transform: 'scale(1.05)',
        borderColor: theme.palette.primary.main,
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
    }
}))

const StyledChip = styled(Chip)(({ theme }) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    borderRadius: 12,
    transition: 'all 0.2s ease',

    '&.MuiChip-colorInfo': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.2) : alpha(theme.palette.info.main, 0.1),
        color: theme.palette.info.main,
        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
    },

    '&.MuiChip-colorSecondary': {
        backgroundColor:
            theme.palette.mode === 'dark' ? alpha(theme.palette.secondary.main, 0.2) : alpha(theme.palette.secondary.main, 0.1),
        color: theme.palette.secondary.main,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
    },

    '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
    }
}))

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    padding: 8,
    borderRadius: 8,
    transition: 'all 0.2s ease',

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
    }
}))

// ==============================|| Variables ||============================== //

const Variables = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()
    useNotifier()
    const { error, setError } = useError()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [showVariableDialog, setShowVariableDialog] = useState(false)
    const [variableDialogProps, setVariableDialogProps] = useState({})
    const [variables, setVariables] = useState([])
    const [showHowToDialog, setShowHowToDialog] = useState(false)

    const { confirm } = useConfirm()

    const getAllVariables = useApi(variablesApi.getAllVariables)

    const [search, setSearch] = useState('')
    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }
    function filterVariables(data) {
        return data.name.toLowerCase().indexOf(search.toLowerCase()) > -1
    }

    const addNew = () => {
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            customBtnId: 'btn_confirmAddingVariable',
            data: {}
        }
        setVariableDialogProps(dialogProp)
        setShowVariableDialog(true)
    }

    const edit = (variable) => {
        const dialogProp = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            data: variable
        }
        setVariableDialogProps(dialogProp)
        setShowVariableDialog(true)
    }

    const deleteVariable = async (variable) => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete variable ${variable.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await variablesApi.deleteVariable(variable.id)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'Variable deleted',
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
                    message: `Failed to delete Variable: ${
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
        setShowVariableDialog(false)
        getAllVariables.request()
        refreshVariablesCache()
    }

    useEffect(() => {
        getAllVariables.request()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setLoading(getAllVariables.loading)
    }, [getAllVariables.loading])

    useEffect(() => {
        if (getAllVariables.data) {
            setVariables(getAllVariables.data)
        }
    }, [getAllVariables.data])

    const renderLoadingRow = () => (
        <StyledTableRow>
            <StyledTableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LoadingSkeleton variant='circular' width={32} height={32} />
                    <LoadingSkeleton variant='text' width='60%' height={24} />
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='rounded' width={60} height={24} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <StyledTableCell>
                <LoadingSkeleton variant='text' width='80%' height={20} />
            </StyledTableCell>
            <Available permission={'variables:create,variables:update'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={32} height={32} />
                </StyledTableCell>
            </Available>
            <Available permission={'variables:delete'}>
                <StyledTableCell>
                    <LoadingSkeleton variant='circular' width={32} height={32} />
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
                            searchPlaceholder='Search Variables'
                            title='Variables'
                            description='Create and manage global variables'
                        >
                            <Button variant='outlined' sx={{ borderRadius: 2, height: '100%' }} onClick={() => setShowHowToDialog(true)}>
                                How To Use
                            </Button>
                            <StyledPermissionButton
                                permissionId={'variables:create'}
                                variant='contained'
                                sx={{ borderRadius: 2, height: '100%' }}
                                onClick={addNew}
                                startIcon={<IconPlus />}
                                id='btn_createVariable'
                            >
                                Add Variable
                            </StyledPermissionButton>
                        </ViewHeader>
                        {!isLoading && variables.length === 0 ? (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                <Box sx={{ p: 2, height: 'auto' }}>
                                    <img
                                        style={{ objectFit: 'cover', height: '20vh', width: 'auto' }}
                                        src={VariablesEmptySVG}
                                        alt='VariablesEmptySVG'
                                    />
                                </Box>
                                <div>No Variables Yet</div>
                            </Stack>
                        ) : (
                            <StyledTableContainer component={Paper}>
                                <StyledTable aria-label='variables table'>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell style={{ width: '25%' }}>Variable Name</StyledTableCell>
                                            <StyledTableCell style={{ width: '25%' }}>Value</StyledTableCell>
                                            <StyledTableCell style={{ width: '12%' }}>Type</StyledTableCell>
                                            <StyledTableCell style={{ width: '16%' }}>Last Updated</StyledTableCell>
                                            <StyledTableCell style={{ width: '16%' }}>Created</StyledTableCell>
                                            <Available permissionId={'variables:update'}>
                                                <StyledTableCell style={{ width: '3%' }}>Edit</StyledTableCell>
                                            </Available>
                                            <Available permissionId={'variables:delete'}>
                                                <StyledTableCell style={{ width: '3%' }}>Delete</StyledTableCell>
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
                                            variables.filter(filterVariables).map((variable, index) => (
                                                <StyledTableRow key={`${variable.id}-${index}`}>
                                                    <StyledTableCell component='th' scope='row'>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <VariableIconContainer>
                                                                <IconVariable size={18} color={theme.palette.primary.main} />
                                                            </VariableIconContainer>
                                                            <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{variable.name}</Box>
                                                        </Box>
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.8125rem',
                                                                fontWeight: 400,
                                                                color: theme.palette.text.secondary,
                                                                fontFamily: 'monospace',
                                                                maxWidth: '200px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {variable.value}
                                                        </Typography>
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <StyledChip
                                                            color={variable.type === 'static' ? 'info' : 'secondary'}
                                                            size='small'
                                                            label={variable.type}
                                                        />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Box
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.8rem',
                                                                lineHeight: 1.2
                                                            }}
                                                        >
                                                            {moment(variable.updatedDate).format('MMM DD, YYYY')}
                                                            <br />
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                {moment(variable.updatedDate).format('HH:mm')}
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
                                                            {moment(variable.createdDate).format('MMM DD, YYYY')}
                                                            <br />
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                {moment(variable.createdDate).format('HH:mm')}
                                                            </span>
                                                        </Box>
                                                    </StyledTableCell>
                                                    <Available permission={'variables:create,variables:update'}>
                                                        <StyledTableCell>
                                                            <StyledIconButton title='Edit' color='primary' onClick={() => edit(variable)}>
                                                                <IconEdit size={18} />
                                                            </StyledIconButton>
                                                        </StyledTableCell>
                                                    </Available>
                                                    <Available permission={'variables:delete'}>
                                                        <StyledTableCell>
                                                            <StyledIconButton
                                                                title='Delete'
                                                                color='error'
                                                                onClick={() => deleteVariable(variable)}
                                                            >
                                                                <IconTrash size={18} />
                                                            </StyledIconButton>
                                                        </StyledTableCell>
                                                    </Available>
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
            <AddEditVariableDialog
                show={showVariableDialog}
                dialogProps={variableDialogProps}
                onCancel={() => setShowVariableDialog(false)}
                onConfirm={onConfirm}
                setError={setError}
            ></AddEditVariableDialog>
            <HowToUseVariablesDialog show={showHowToDialog} onCancel={() => setShowHowToDialog(false)}></HowToUseVariablesDialog>
            <ConfirmDialog />
        </>
    )
}

export default Variables
