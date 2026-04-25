import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Erro de validação',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
};

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha obrigatória'),
  handleValidationErrors
];

export const registerValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('company_name').trim().notEmpty().withMessage('Nome da empresa é obrigatório'),
  handleValidationErrors
];

export const productValidation = [
  body('name').trim().notEmpty().withMessage('Nome do produto é obrigatório'),
  body('price').isFloat({ min: 0 }).withMessage('Preço deve ser maior ou igual a 0'),
  body('stock').isInt({ min: 0 }).withMessage('Estoque deve ser maior ou igual a 0'),
  body('category_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Categoria inválida'),
  handleValidationErrors
];

export const saleValidation = [
  body('items').isArray({ min: 1 }).withMessage('Pelo menos um item é necessário'),
  body('items.*.product_id').isInt().withMessage('ID do produto inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser pelo menos 1'),
  body('payment_method').isIn(['cash', 'credit_card', 'debit_card', 'pix', 'boleto']).withMessage('Método de pagamento inválido'),
  handleValidationErrors
];
