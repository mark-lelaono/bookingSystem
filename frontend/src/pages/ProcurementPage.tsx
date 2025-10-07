import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface Item {
  itemNo: number;
  specificDescription: string;
  quantity: string;
  estimatedUnitCost: string;
  estimatedTotalCost: string;
}

interface Signature {
  signature: string;
  name: string;
  position: string;
  date: string;
}

interface FundsAvailability {
  programme: string;
  subProgramme: string;
  activity: string;
  subActivity: string;
  balanceRemaining: string;
  currency: string;
  estimatedTotalCost: string;
}

interface ProcurementFormData {
  projectDirectorate: string;
  worksServicesSupplies: string;
  budgetYear: number;
  budgetActivity: string;
  sequenceNumber: string;
  generalDescription: string;
  deliveryLocation: string;
  dateRequired: string;
  items: Item[];
  fundsAvailability: FundsAvailability;
  signatures: {
    originatingOfficer: Signature;
    projectCoordinator: Signature;
    accountant: Signature;
    authorisingOfficer: Signature;
  };
}

const ProcurementPage: React.FC = () => {
  const [formData, setFormData] = useState<ProcurementFormData>({
    projectDirectorate: '',
    worksServicesSupplies: '',
    budgetYear: new Date().getFullYear(),
    budgetActivity: '',
    sequenceNumber: '',
    generalDescription: '',
    deliveryLocation: '',
    dateRequired: '',
    items: [
      {
        itemNo: 1,
        specificDescription: '',
        quantity: '',
        estimatedUnitCost: '',
        estimatedTotalCost: ''
      }
    ],
    fundsAvailability: {
      programme: '',
      subProgramme: '',
      activity: '',
      subActivity: '',
      balanceRemaining: '',
      currency: 'USD',
      estimatedTotalCost: ''
    },
    signatures: {
      originatingOfficer: {
        signature: '',
        name: '',
        position: '',
        date: ''
      },
      projectCoordinator: {
        signature: '',
        name: '',
        position: '',
        date: ''
      },
      accountant: {
        signature: '',
        name: '',
        position: '',
        date: ''
      },
      authorisingOfficer: {
        signature: '',
        name: '',
        position: '',
        date: ''
      }
    }
  });

  const handleInputChange = (
    section: string | null,
    field: string,
    value: string,
    index: number | null = null
  ) => {
    setFormData(prev => {
      if (section === 'items' && index !== null) {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        if (field === 'quantity' || field === 'estimatedUnitCost') {
          const quantity = parseFloat(updatedItems[index].quantity) || 0;
          const unitCost = parseFloat(updatedItems[index].estimatedUnitCost) || 0;
          updatedItems[index].estimatedTotalCost = (quantity * unitCost).toFixed(2);
        }

        return { ...prev, items: updatedItems };
      } else if (section === 'fundsAvailability') {
        return {
          ...prev,
          fundsAvailability: { ...prev.fundsAvailability, [field]: value }
        };
      } else if (section === 'signatures') {
        const [signatureType, signatureField] = field.split('.');
        return {
          ...prev,
          signatures: {
            ...prev.signatures,
            [signatureType]: {
              ...prev.signatures[signatureType as keyof typeof prev.signatures],
              [signatureField]: value
            }
          }
        };
      } else {
        return { ...prev, [field]: value };
      }
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemNo: prev.items.length + 1,
          specificDescription: '',
          quantity: '',
          estimatedUnitCost: '',
          estimatedTotalCost: ''
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index).map((item, i) => ({
          ...item,
          itemNo: i + 1
        }))
      }));
    }
  };

  const calculateGrandTotal = (): string => {
    return formData.items.reduce((total, item) => {
      return total + (parseFloat(item.estimatedTotalCost) || 0);
    }, 0).toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Procurement Requisition Form Data:', formData);
    alert('Procurement Requisition Form submitted successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4, pb: 3, borderBottom: '2px solid #000' }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              IGAD CLIMATE PREDICTION AND APPLICATIONS CENTRE (ICPAC)
            </Typography>
            <Box sx={{ display: 'inline-block', border: '2px solid #000', p: 2, mt: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                PROCUREMENT REQUISITION FORM
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Project and Budget Information */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, bgcolor: '#e0e0e0', p: 1, mx: -3, mt: -3 }}>
                Project and Budget Information
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Project/Directorate"
                    value={formData.projectDirectorate}
                    onChange={(e) => handleInputChange(null, 'projectDirectorate', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Works/Services/Supplies</InputLabel>
                    <Select
                      value={formData.worksServicesSupplies}
                      label="Works/Services/Supplies"
                      onChange={(e) => handleInputChange(null, 'worksServicesSupplies', e.target.value)}
                    >
                      <MenuItem value="Works">Works</MenuItem>
                      <MenuItem value="Services">Services</MenuItem>
                      <MenuItem value="Supplies">Supplies</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Budget Year"
                    type="number"
                    value={formData.budgetYear}
                    onChange={(e) => handleInputChange(null, 'budgetYear', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Budget Activity"
                    value={formData.budgetActivity}
                    onChange={(e) => handleInputChange(null, 'budgetActivity', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Sequence Number"
                    value={formData.sequenceNumber}
                    onChange={(e) => handleInputChange(null, 'sequenceNumber', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* General Procurement Information */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, bgcolor: '#e0e0e0', p: 1, mx: -3, mt: -3 }}>
                General Procurement Information
              </Typography>

              <TextField
                fullWidth
                label="General Description of Procurement"
                multiline
                rows={4}
                value={formData.generalDescription}
                onChange={(e) => handleInputChange(null, 'generalDescription', e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Location for Delivery"
                    value={formData.deliveryLocation}
                    onChange={(e) => handleInputChange(null, 'deliveryLocation', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Date Required"
                    type="date"
                    value={formData.dateRequired}
                    onChange={(e) => handleInputChange(null, 'dateRequired', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Items Table */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Items
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={addItem}
                  size="small"
                  sx={{ bgcolor: '#044E36', '&:hover': { bgcolor: '#033d2a' } }}
                >
                  Add Item
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e0e0e0' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Item No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Specific Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Est. Unit Cost (GBP)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Est. Total Cost</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.itemNo}</TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            value={item.specificDescription}
                            onChange={(e) => handleInputChange('items', 'specificDescription', e.target.value, index)}
                            placeholder="Statement of Requirements / Scope / Terms of References / Specifications"
                            variant="standard"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleInputChange('items', 'quantity', e.target.value, index)}
                            variant="standard"
                            inputProps={{ min: 0, step: 0.01 }}
                            required
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.estimatedUnitCost}
                            onChange={(e) => handleInputChange('items', 'estimatedUnitCost', e.target.value, index)}
                            variant="standard"
                            inputProps={{ min: 0, step: 0.01 }}
                            required
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>
                          {item.estimatedTotalCost || '0.00'}
                        </TableCell>
                        <TableCell>
                          {formData.items.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItem(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#e0e0e0' }}>
                      <TableCell colSpan={4} sx={{ textAlign: 'right', fontWeight: 700 }}>
                        Grand Total:
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                        GBP {calculateGrandTotal()}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Funds Availability */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, bgcolor: '#e0e0e0', p: 1, mx: -3, mt: -3 }}>
                Funds Availability
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Programme"
                    value={formData.fundsAvailability.programme}
                    onChange={(e) => handleInputChange('fundsAvailability', 'programme', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Sub-programme"
                    value={formData.fundsAvailability.subProgramme}
                    onChange={(e) => handleInputChange('fundsAvailability', 'subProgramme', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Activity"
                    value={formData.fundsAvailability.activity}
                    onChange={(e) => handleInputChange('fundsAvailability', 'activity', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Sub-activity"
                    value={formData.fundsAvailability.subActivity}
                    onChange={(e) => handleInputChange('fundsAvailability', 'subActivity', e.target.value)}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Balance Remaining"
                    type="number"
                    value={formData.fundsAvailability.balanceRemaining}
                    onChange={(e) => handleInputChange('fundsAvailability', 'balanceRemaining', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.fundsAvailability.currency}
                      label="Currency"
                      onChange={(e) => handleInputChange('fundsAvailability', 'currency', e.target.value)}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="KES">KES</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Estimated Total Cost"
                    value={`${formData.fundsAvailability.currency} ${calculateGrandTotal()}`}
                    InputProps={{ readOnly: true }}
                    size="small"
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Approval & Signatures */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3, bgcolor: '#e0e0e0', p: 1, mx: -3, mt: -3 }}>
                Approval & Signatures
              </Typography>

              {/* Originating Officer */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Initiation and Confirmation of Need (Originating Officer)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={formData.signatures.originatingOfficer.name}
                      onChange={(e) => handleInputChange('signatures', 'originatingOfficer.name', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Position"
                      value={formData.signatures.originatingOfficer.position}
                      onChange={(e) => handleInputChange('signatures', 'originatingOfficer.position', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={formData.signatures.originatingOfficer.date}
                      onChange={(e) => handleInputChange('signatures', 'originatingOfficer.date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Box sx={{ border: '1px solid #ccc', height: 60, bgcolor: '#f9f9f9', display: 'flex', alignItems: 'center', px: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Signature Area
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Project Coordinator */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Confirmation of Need (Project Coordinator)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={formData.signatures.projectCoordinator.name}
                      onChange={(e) => handleInputChange('signatures', 'projectCoordinator.name', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Position"
                      value={formData.signatures.projectCoordinator.position}
                      onChange={(e) => handleInputChange('signatures', 'projectCoordinator.position', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={formData.signatures.projectCoordinator.date}
                      onChange={(e) => handleInputChange('signatures', 'projectCoordinator.date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Box sx={{ border: '1px solid #ccc', height: 60, bgcolor: '#f9f9f9', display: 'flex', alignItems: 'center', px: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Signature Area
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Accountant */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Confirmation of Funds (Accountant)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={formData.signatures.accountant.name}
                      onChange={(e) => handleInputChange('signatures', 'accountant.name', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Position"
                      value={formData.signatures.accountant.position}
                      onChange={(e) => handleInputChange('signatures', 'accountant.position', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={formData.signatures.accountant.date}
                      onChange={(e) => handleInputChange('signatures', 'accountant.date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Box sx={{ border: '1px solid #ccc', height: 60, bgcolor: '#f9f9f9', display: 'flex', alignItems: 'center', px: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Signature Area
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Authorising Officer */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Approval to Procure/Solicit (Authorising Officer/Director)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={formData.signatures.authorisingOfficer.name}
                      onChange={(e) => handleInputChange('signatures', 'authorisingOfficer.name', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Position"
                      value={formData.signatures.authorisingOfficer.position}
                      onChange={(e) => handleInputChange('signatures', 'authorisingOfficer.position', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={formData.signatures.authorisingOfficer.date}
                      onChange={(e) => handleInputChange('signatures', 'authorisingOfficer.date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Box sx={{ border: '1px solid #ccc', height: 60, bgcolor: '#f9f9f9', display: 'flex', alignItems: 'center', px: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Signature Area
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Paper>

            {/* Submission Note */}
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Please submit this form at least twenty-one (21) working days before goods or services are required to ensure adequate processing time.
              </Typography>
            </Alert>

            {/* Action Buttons */}
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                startIcon={<PrintIcon />}
                variant="outlined"
                onClick={handlePrint}
                color="inherit"
              >
                Print Form
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => window.history.back()}
                  color="inherit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{ bgcolor: '#044E36', '&:hover': { bgcolor: '#033d2a' } }}
                >
                  Submit Form
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProcurementPage;

