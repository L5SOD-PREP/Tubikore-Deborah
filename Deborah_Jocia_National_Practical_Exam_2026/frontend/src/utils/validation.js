/**
 * Form Validation Utilities
 * Validates form inputs and returns field-level error messages
 */

/**
 * Validate a Vehicle form
 * @param {Object} values - Form field values
 * @param {boolean} isEditing - Whether this is an edit (Plate_Number already exists)
 * @returns {Object} { valid: boolean, errors: { fieldName: message } }
 */
export function validateVehicle(values, isEditing = false) {
  const errors = {};

  if (!values.Plate_Number?.trim() && !isEditing) {
    errors.Plate_Number = 'Plate number is required';
  } else if (!isEditing && !/^[A-Za-z0-9-]+$/.test(values.Plate_Number)) {
    errors.Plate_Number = 'Only letters, numbers, and hyphens allowed';
  }

  if (!values.Brand?.trim()) {
    errors.Brand = 'Brand is required';
  }

  if (!values.Model?.trim()) {
    errors.Model = 'Model is required';
  }

  if (!values.Year) {
    errors.Year = 'Year is required';
  } else {
    const year = parseInt(values.Year);
    if (isNaN(year) || year < 1900 || year > 2030) {
      errors.Year = 'Year must be between 1900 and 2030';
    }
  }

  if (!values.Vehicle_Type) {
    errors.Vehicle_Type = 'Vehicle type is required';
  }

  if (!values.Purchase_Price && values.Purchase_Price !== 0) {
    errors.Purchase_Price = 'Purchase price is required';
  } else {
    const price = parseFloat(values.Purchase_Price);
    if (isNaN(price) || price < 0) {
      errors.Purchase_Price = 'Price must be a positive number';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate a Customer form
 * @param {Object} values - Form field values
 * @returns {Object} { valid: boolean, errors: { fieldName: message } }
 */
export function validateCustomer(values) {
  const errors = {};

  if (!values.FirstName?.trim()) {
    errors.FirstName = 'First name is required';
  } else if (values.FirstName.length > 100) {
    errors.FirstName = 'First name is too long';
  }

  if (!values.LastName?.trim()) {
    errors.LastName = 'Last name is required';
  } else if (values.LastName.length > 100) {
    errors.LastName = 'Last name is too long';
  }

  if (!values.Email?.trim()) {
    errors.Email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.Email)) {
    errors.Email = 'Please enter a valid email address';
  }

  if (!values.PhoneNumber?.trim()) {
    errors.PhoneNumber = 'Phone number is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate a Promotion form
 * @param {Object} values - Form field values
 * @returns {Object} { valid: boolean, errors: { fieldName: message } }
 */
export function validatePromotion(values) {
  const errors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!values.Title?.trim()) {
    errors.Title = 'Title is required';
  }

  if (!values.Discount_Type) {
    errors.Discount_Type = 'Discount type is required';
  }

  if (values.Discount_Value === '' || values.Discount_Value === null || values.Discount_Value === undefined) {
    errors.Discount_Value = 'Discount value is required';
  } else {
    const val = parseFloat(values.Discount_Value);
    if (isNaN(val) || val < 0) {
      errors.Discount_Value = 'Value must be a positive number';
    }
  }

  if (!values.Start_Date) {
    errors.Start_Date = 'Start date is required';
  } else {
    const startDate = new Date(values.Start_Date + 'T00:00:00');
    if (isNaN(startDate.getTime())) {
      errors.Start_Date = 'Invalid date';
    } else if (startDate < today) {
      errors.Start_Date = 'Start date cannot be in the past';
    }
  }

  if (!values.End_Date) {
    errors.End_Date = 'End date is required';
  } else {
    const endDate = new Date(values.End_Date + 'T00:00:00');
    if (isNaN(endDate.getTime())) {
      errors.End_Date = 'Invalid date';
    } else if (values.Start_Date && new Date(values.Start_Date + 'T00:00:00') >= endDate) {
      errors.End_Date = 'End date must be after start date';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
