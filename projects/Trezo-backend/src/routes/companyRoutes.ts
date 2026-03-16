import { Router } from "express";
import { CompanyController } from "../controllers/companyController";
import { authenticateToken } from "../middleware/auth";
import { validateRegisterCompany, validateLogin, validateUpdatePassword } from "../middleware/validation";

const router = Router();

/**
 * @route   POST /api/v1/company/register
 * @desc    Register a new company with treasury wallet
 * @access  Public
 */
router.post("/register", validateRegisterCompany, CompanyController.register);

/**
 * @route   POST /api/v1/company/login
 * @desc    Login company
 * @access  Public
 */
router.post("/login", validateLogin, CompanyController.login);

/**
 * @route   GET /api/v1/company/profile
 * @desc    Get company profile
 * @access  Private
 */
router.get("/profile", authenticateToken, CompanyController.getProfile);

/**
 * @route   PUT /api/v1/company/password
 * @desc    Update company password
 * @access  Private
 */
router.put("/password", authenticateToken, validateUpdatePassword, CompanyController.updatePassword);

/**
 * @route   GET /api/v1/companies/search?q=
 * @desc    Search companies by name (min 2 chars), excludes self
 * @access  Private
 */
router.get("/search", authenticateToken, CompanyController.searchCompanies);

export default router;
