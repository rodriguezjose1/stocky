export const DEFAULT_ERROR = 'DEFAULT_ERROR';
export const QUANTITY_LESS_THAN_CURRENT_TOTAL = 'QUANTITY_LESS_THAN_CURRENT_TOTAL';

// users
export const userErrors = {
  userAlreadyExists: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User already exists',
  },
  userNotFound: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  },
  currentPasswordIsIncorrect: {
    code: 'CURRENT_PASSWORD_IS_INCORRECT',
    message: 'Current password is incorrect',
  },
};

export const productErrors = {
  sizeTypeRequired: {
    code: 'SIZE_TYPE_REQUIRED',
    message: 'The size type is required since the category has more than 1 size type associated with it',
  },
  invalidSizeType: {
    code: 'INVALID_SIZE_TYPE',
    message: 'The type of size is not included in the possible values',
  },
  productNotFound: {
    code: 'PRODUCT_NOT_FOUND',
    message: 'Product not found',
  },
  categoryNotFound: {
    code: 'CATEGORY_NOT_FOUND',
    message: 'Category not found',
  },
  duplicateProductCode: {
    code: 'DUPLICATE_PRODUCT_CODE',
    message: 'A product with this code already exists',
  },
  wholesalePackageTypeRequired: {
    code: 'WHOLESALE_PACKAGE_TYPE_REQUIRED',
    message: 'The wholesale package type is required',
  },
  wholesalePercentagesRequired: {
    code: 'WHOLESALE_PERCENTAGES_REQUIRED',
    message: 'The wholesale percentages are required',
  },
  wholesalePackageNotAllowed: {
    code: 'WHOLESALE_PACKAGE_NOT_ALLOWED',
    message: 'This product does not allow being added as a wholesale package',
  },
};
