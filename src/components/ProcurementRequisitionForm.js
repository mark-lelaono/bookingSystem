import React, { useState } from 'react';

const ProcurementRequisitionForm = () => {
  const [formData, setFormData] = useState({
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

  const handleInputChange = (section, field, value, index = null) => {
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
              ...prev.signatures[signatureType],
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

  const removeItem = (index) => {
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

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (parseFloat(item.estimatedTotalCost) || 0);
    }, 0).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Procurement Requisition Form Data:', formData);
    alert('Procurement Requisition Form submitted successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '20px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
              IGAD CLIMATE PREDICTION AND APPLICATIONS CENTRE (ICPAC)
            </h1>
            <div style={{ border: '2px solid #000', display: 'inline-block', padding: '10px 20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>
                PROCUREMENT REQUISITION FORM
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Project and Budget Information */}
            <div style={{ marginBottom: '25px', border: '1px solid #000', padding: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 15px 0', backgroundColor: '#e0e0e0', padding: '8px', marginLeft: '-15px', marginRight: '-15px', marginTop: '-15px' }}>
                Project and Budget Information
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Project/Directorate:
                  </label>
                  <input
                    type="text"
                    value={formData.projectDirectorate}
                    onChange={(e) => handleInputChange(null, 'projectDirectorate', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Works/Services/Supplies:
                  </label>
                  <select
                    value={formData.worksServicesSupplies}
                    onChange={(e) => handleInputChange(null, 'worksServicesSupplies', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Works">Works</option>
                    <option value="Services">Services</option>
                    <option value="Supplies">Supplies</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Budget Year:
                  </label>
                  <input
                    type="number"
                    value={formData.budgetYear}
                    onChange={(e) => handleInputChange(null, 'budgetYear', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Budget Activity:
                  </label>
                  <input
                    type="text"
                    value={formData.budgetActivity}
                    onChange={(e) => handleInputChange(null, 'budgetActivity', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Sequence Number:
                  </label>
                  <input
                    type="text"
                    value={formData.sequenceNumber}
                    onChange={(e) => handleInputChange(null, 'sequenceNumber', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* General Procurement Information */}
            <div style={{ marginBottom: '25px', border: '1px solid #000', padding: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 15px 0', backgroundColor: '#e0e0e0', padding: '8px', marginLeft: '-15px', marginRight: '-15px', marginTop: '-15px' }}>
                General Procurement Information
              </h3>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  General Description of Procurement:
                </label>
                <textarea
                  value={formData.generalDescription}
                  onChange={(e) => handleInputChange(null, 'generalDescription', e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Location for Delivery:
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryLocation}
                    onChange={(e) => handleInputChange(null, 'deliveryLocation', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Date Required:
                  </label>
                  <input
                    type="date"
                    value={formData.dateRequired}
                    onChange={(e) => handleInputChange(null, 'dateRequired', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '25px', border: '1px solid #000', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', backgroundColor: '#e0e0e0', padding: '8px', marginLeft: '-15px', marginRight: '10px', marginTop: '-15px' }}>
                  Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  style={{ padding: '5px 10px', backgroundColor: '#007cba', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                >
                  Add Item
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e0e0e0' }}>
                      <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>Item No.</th>
                      <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>Specific Description</th>
                      <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>Quantity</th>
                      <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>Est. Unit Cost (GBP)</th>
                      <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>Est. Total Cost</th>
                      <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '12px' }}>{item.itemNo}</td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>
                          <textarea
                            value={item.specificDescription}
                            onChange={(e) => handleInputChange('items', 'specificDescription', e.target.value, index)}
                            rows={2}
                            style={{ width: '100%', border: 'none', fontSize: '12px', resize: 'none', outline: 'none' }}
                            placeholder="Statement of Requirements / Scope / Terms of References / Specifications"
                            required
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleInputChange('items', 'quantity', e.target.value, index)}
                            style={{ width: '100%', border: 'none', fontSize: '12px', outline: 'none' }}
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>
                          <input
                            type="number"
                            value={item.estimatedUnitCost}
                            onChange={(e) => handleInputChange('items', 'estimatedUnitCost', e.target.value, index)}
                            style={{ width: '100%', border: 'none', fontSize: '12px', outline: 'none' }}
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {item.estimatedTotalCost || '0.00'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              style={{ fontSize: '11px', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '12px' }}>
                        Grand Total:
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '12px' }}>
                        GBP {calculateGrandTotal()}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Funds Availability */}
            <div style={{ marginBottom: '25px', border: '1px solid #000', padding: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 15px 0', backgroundColor: '#e0e0e0', padding: '8px', marginLeft: '-15px', marginRight: '-15px', marginTop: '-15px' }}>
                Funds Availability
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Programme:
                  </label>
                  <input
                    type="text"
                    value={formData.fundsAvailability.programme}
                    onChange={(e) => handleInputChange('fundsAvailability', 'programme', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Sub-programme:
                  </label>
                  <input
                    type="text"
                    value={formData.fundsAvailability.subProgramme}
                    onChange={(e) => handleInputChange('fundsAvailability', 'subProgramme', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Activity:
                  </label>
                  <input
                    type="text"
                    value={formData.fundsAvailability.activity}
                    onChange={(e) => handleInputChange('fundsAvailability', 'activity', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Sub-activity:
                  </label>
                  <input
                    type="text"
                    value={formData.fundsAvailability.subActivity}
                    onChange={(e) => handleInputChange('fundsAvailability', 'subActivity', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Balance Remaining:
                  </label>
                  <input
                    type="number"
                    value={formData.fundsAvailability.balanceRemaining}
                    onChange={(e) => handleInputChange('fundsAvailability', 'balanceRemaining', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Currency:
                  </label>
                  <select
                    value={formData.fundsAvailability.currency}
                    onChange={(e) => handleInputChange('fundsAvailability', 'currency', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="KES">KES</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Estimated Total Cost:
                </label>
                <input
                  type="text"
                  value={`${formData.fundsAvailability.currency} ${calculateGrandTotal()}`}
                  readOnly
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', fontSize: '12px', backgroundColor: '#f5f5f5', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Approval & Signatures */}
            <div style={{ marginBottom: '25px', border: '1px solid #000', padding: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 15px 0', backgroundColor: '#e0e0e0', padding: '8px', marginLeft: '-15px', marginRight: '-15px', marginTop: '-15px' }}>
                Approval & Signatures
              </h3>

              {/* Originating Officer */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Initiation and Confirmation of Need (Originating Officer)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Name:</label>
                    <input
                      type="text"
                      value={formData.signatures.originatingOfficer.name}
                      onChange={(e) => handleInputChange('signatures', 'originatingOfficer.name', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Position:</label>
                    <input
                      type="text"
                      value={formData.signatures.originatingOfficer.position}
                      onChange={(e) => handleInputChange('signatures', 'originatingOfficer.position', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Date:</label>
                    <input
                      type="date"
                      value={formData.signatures.originatingOfficer.date}
                      onChange={(e) => handleInputChange('signatures', 'originatingOfficer.date', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Signature:</label>
                  <div style={{ border: '1px solid #ccc', height: '40px', backgroundColor: '#f9f9f9' }}></div>
                </div>
              </div>

              {/* Project Coordinator */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Confirmation of Need (Project Coordinator)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Name:</label>
                    <input
                      type="text"
                      value={formData.signatures.projectCoordinator.name}
                      onChange={(e) => handleInputChange('signatures', 'projectCoordinator.name', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Position:</label>
                    <input
                      type="text"
                      value={formData.signatures.projectCoordinator.position}
                      onChange={(e) => handleInputChange('signatures', 'projectCoordinator.position', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Date:</label>
                    <input
                      type="date"
                      value={formData.signatures.projectCoordinator.date}
                      onChange={(e) => handleInputChange('signatures', 'projectCoordinator.date', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Signature:</label>
                  <div style={{ border: '1px solid #ccc', height: '40px', backgroundColor: '#f9f9f9' }}></div>
                </div>
              </div>

              {/* Accountant */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Confirmation of Funds (Accountant)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Name:</label>
                    <input
                      type="text"
                      value={formData.signatures.accountant.name}
                      onChange={(e) => handleInputChange('signatures', 'accountant.name', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Position:</label>
                    <input
                      type="text"
                      value={formData.signatures.accountant.position}
                      onChange={(e) => handleInputChange('signatures', 'accountant.position', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Date:</label>
                    <input
                      type="date"
                      value={formData.signatures.accountant.date}
                      onChange={(e) => handleInputChange('signatures', 'accountant.date', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Signature:</label>
                  <div style={{ border: '1px solid #ccc', height: '40px', backgroundColor: '#f9f9f9' }}></div>
                </div>
              </div>

              {/* Authorising Officer */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Approval to Procure/Solicit (Authorising Officer/Director)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Name:</label>
                    <input
                      type="text"
                      value={formData.signatures.authorisingOfficer.name}
                      onChange={(e) => handleInputChange('signatures', 'authorisingOfficer.name', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Position:</label>
                    <input
                      type="text"
                      value={formData.signatures.authorisingOfficer.position}
                      onChange={(e) => handleInputChange('signatures', 'authorisingOfficer.position', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Date:</label>
                    <input
                      type="date"
                      value={formData.signatures.authorisingOfficer.date}
                      onChange={(e) => handleInputChange('signatures', 'authorisingOfficer.date', e.target.value)}
                      style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontSize: '11px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>Signature:</label>
                  <div style={{ border: '1px solid #ccc', height: '40px', backgroundColor: '#f9f9f9' }}></div>
                </div>
              </div>
            </div>

            {/* Submission Note */}
            <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', padding: '15px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', margin: '0', color: '#856404' }}>
                <strong>Important:</strong> Please submit this form at least twenty-one (21) working days before goods or services are required to ensure adequate processing time.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
              <button
                type="button"
                onClick={handlePrint}
                style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
              >
                Print Form
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  style={{ padding: '10px 20px', backgroundColor: '#f8f9fa', color: '#333', border: '1px solid #ccc', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', backgroundColor: '#007cba', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                >
                  Submit Form
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProcurementRequisitionForm;