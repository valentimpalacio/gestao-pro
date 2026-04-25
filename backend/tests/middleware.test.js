import { errorHandler, notFound } from '../middleware/errorHandler.js';

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should handle ValidationError', () => {
    const err = new Error('Validation failed');
    err.name = 'ValidationError';
    err.errors = { email: 'Invalid email' };

    errorHandler(err, mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Erro de validação',
        errors: err.errors,
      })
    );
  });

  it('should handle JsonWebTokenError', () => {
    const err = new Error('Invalid token');
    err.name = 'JsonWebTokenError';

    errorHandler(err, mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token inválido' })
    );
  });

  it('should handle TokenExpiredError', () => {
    const err = new Error('Token expired');
    err.name = 'TokenExpiredError';

    errorHandler(err, mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token expirado' })
    );
  });

  it('should handle ER_DUP_ENTRY', () => {
    const err = new Error('Duplicate entry');
    err.code = 'ER_DUP_ENTRY';

    errorHandler(err, mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Registro duplicado' })
    );
  });
});

describe('Not Found Middleware', () => {
  it('should return 404 with message', () => {
    const mockReq = { originalUrl: '/test' };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    notFound(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('/test') })
    );
  });
});
