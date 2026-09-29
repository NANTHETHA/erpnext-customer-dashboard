import { useEffect, useMemo, useState, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Skeleton,
  Snackbar,
  Chip,
  Stack,
  InputAdornment,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import BadgeIcon from "@mui/icons-material/Badge";
import CategoryIcon from "@mui/icons-material/Category";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

// Base URL of our Express backend (it proxies requests to ERPNext)
const API = "http://localhost:5000/api/customers";

// Gives each customer a consistent avatar colour based on their name
const avatarColors = ["#1976d2", "#7b1fa2", "#00897b", "#e65100", "#c2185b", "#455a64"];
const colorFor = (name) =>
  avatarColors[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarColors.length];

// One labelled row in the details modal, with an optional copy button
function DetailRow({ icon, label, value, copyable, onCopy }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
      <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ wordBreak: "break-word" }}>{value || "N/A"}</Typography>
      </Box>
      {copyable && value && (
        <Tooltip title="Copy">
          <IconButton size="small" onClick={() => onCopy(value)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

function App() {
  // Theme: read the saved choice (light/dark) from localStorage, default to dark
  const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode },
        shape: { borderRadius: 10 },
      }),
    [mode]
  );

  // Data and UI state
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Sorting, pagination and toast (snackbar) message state
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [toast, setToast] = useState("");

  // Switch between light and dark theme and remember the choice
  const toggleMode = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem("theme", next);
  };

  // Fetch the customer list from the backend (also used by Refresh and Retry)
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load customers. Check that the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load customers once when the page first opens
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Filter by name (case-insensitive) and sort A-Z or Z-A
  const filteredCustomers = useMemo(() => {
    const list = customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    return list.sort((a, b) =>
      order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [customers, search, order]);

  // Only the rows for the current page
  const visibleCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Fetch full details for one customer and open the details modal
  const handleCustomerClick = async (customerName) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`${API}/${encodeURIComponent(customerName)}`);
      if (!response.ok) throw new Error("Failed to fetch customer details");
      const data = await response.json();
      setSelectedCustomer(data.data);
    } catch (err) {
      console.error(err);
      setToast(`Couldn't load details for ${customerName}. Try again.`);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Copy text (Customer ID or Tax ID) to the clipboard and show a toast
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied to clipboard");
    } catch {
      setToast("Copy failed");
    }
  };

  const handleClose = () => setSelectedCustomer(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Top bar with refresh and theme toggle */}
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ERPNext Customer Dashboard
          </Typography>
          <Tooltip title="Refresh customers">
            <span>
              <IconButton color="inherit" onClick={loadCustomers} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
            <IconButton color="inherit" onClick={toggleMode}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
          spacing={1}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Customers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer information from ERPNext
            </Typography>
          </Box>
          {!loading && !error && (
            <Stack direction="row" spacing={1}>
              <Chip label={`${customers.length} total`} color="primary" variant="outlined" />
              {search && (
                <Chip
                  label={`${filteredCustomers.length} matching`}
                  onDelete={() => {
                    setSearch("");
                    setPage(0);
                  }}
                />
              )}
            </Stack>
          )}
        </Stack>

        {/* Search bar: filters the table on every keystroke */}
        <TextField
          fullWidth
          label="Search customers"
          placeholder="Search by customer name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("");
                    setPage(0);
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadCustomers}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Skeleton rows shown while customers are loading */}
        {loading && (
          <Paper>
            {[...Array(5)].map((_, i) => (
              <Stack key={i} direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" sx={{ flexGrow: 1 }} height={28} />
                <Skeleton variant="rounded" width={120} height={36} />
              </Stack>
            ))}
          </Paper>
        )}

        {/* Customer table with sortable header and pagination */}
        {!loading && !error && (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={order}>
                      <TableSortLabel
                        active
                        direction={order}
                        onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                      >
                        <strong>Customer Name</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Action</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {visibleCustomers.map((customer) => (
                    <TableRow
                      key={customer.name}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleCustomerClick(customer.name)}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: colorFor(customer.name) }}>
                            {customer.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography>{customer.name}</Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomerClick(customer.name);
                          }}
                        >
                          View details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          {search
                            ? `No customers match "${search}". Try a different name.`
                            : "No customers yet. Add one in ERPNext and refresh."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredCustomers.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Paper>
        )}
      </Container>

      {/* Details modal: opens after a customer is selected */}
      <Dialog
        open={Boolean(selectedCustomer) || detailsLoading}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        {detailsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          selectedCustomer && (
            <>
              <DialogTitle>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: colorFor(selectedCustomer.name),
                      width: 48,
                      height: 48,
                    }}
                  >
                    {(selectedCustomer.customer_name || selectedCustomer.name)
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedCustomer.customer_name || selectedCustomer.name}
                    </Typography>
                    {selectedCustomer.customer_type && (
                      <Chip size="small" label={selectedCustomer.customer_type} />
                    )}
                  </Box>
                </Stack>
              </DialogTitle>

              <Divider />

              <DialogContent>
                <DetailRow
                  icon={<BadgeIcon />}
                  label="Customer ID"
                  value={selectedCustomer.name}
                  copyable
                  onCopy={handleCopy}
                />
                <Divider />
                <DetailRow
                  icon={<CategoryIcon />}
                  label="Customer type"
                  value={selectedCustomer.customer_type}
                />
                <Divider />
                <DetailRow
                  icon={<GroupsIcon />}
                  label="Customer group"
                  value={selectedCustomer.customer_group}
                />
                <Divider />
                <DetailRow
                  icon={<PublicIcon />}
                  label="Territory"
                  value={selectedCustomer.territory}
                />
                <Divider />
                <DetailRow
                  icon={<ReceiptLongIcon />}
                  label="Tax ID"
                  value={selectedCustomer.tax_id}
                  copyable
                  onCopy={handleCopy}
                />
              </DialogContent>

              <DialogActions>
                <Button onClick={handleClose}>Close</Button>
              </DialogActions>
            </>
          )
        )}
      </Dialog>

      {/* Small popup message (copied, errors) */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
      />
    </ThemeProvider>
  );
}

export default App;
