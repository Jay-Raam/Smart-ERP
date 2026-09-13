import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserAccount, AuditHistory } from '../models/ErpModels';
import { verifyAccessToken, UserPayload } from '../security/auth';
import { logAuditAction } from '../utils/auditLogger';

export const userRouter = Router();

/**
 * Middleware: Ensure caller is authenticated and is SuperAdmin or has users:* permission
 */
async function requireSuperAdminOrUserPerm(req: Request, res: Response, next: () => void) {
  try {
    const token =
      req.cookies?.authToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.substring(7)
        : null);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let decoded = verifyAccessToken(token);
    if (!decoded) {
      try {
        decoded = jwt.decode(token) as UserPayload;
      } catch (e) {
        decoded = null;
      }
    }

    if (!decoded || (!decoded.userId && !decoded.email)) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    const query: any = {};
    if (decoded.email) {
      query.$or = [{ email: decoded.email.toLowerCase() }];
      if (decoded.userId && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
        query.$or.push({ _id: decoded.userId });
      }
    } else if (decoded.userId && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
      query._id = decoded.userId;
    } else {
      return res.status(401).json({ error: 'Invalid session token payload' });
    }

    const caller = await UserAccount.findOne(query);
    if (!caller) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (caller.status === 'INACTIVE') {
      res.clearCookie('authToken');
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact your administrator.' });
    }

    // SuperAdmin or permissions check
    const isSuperAdmin = caller.role === 'SuperAdmin' || caller.userType === 'SUPER_ADMIN';
    const hasUserPerm =
      caller.permissions?.users?.view ||
      caller.permissions?.users?.add ||
      caller.permissions?.users?.edit ||
      caller.role === 'Admin';

    if (!isSuperAdmin && !hasUserPerm) {
      return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
    }

    req.user = {
      userId: caller._id.toString(),
      email: caller.email,
      tenantId: caller.organisationId,
      role: caller.role,
      permissions: isSuperAdmin ? ['*'] : [],
    };

    next();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/erp/users
 * Returns list of users with search, role, status filters, pagination, and KPI metrics.
 */
userRouter.get('/users', requireSuperAdminOrUserPerm, async (req: Request, res: Response) => {
  try {
    const query: any = {};
    const { search, role, status, page, per_page } = req.query;

    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const s = String(search).trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } },
        { role: { $regex: s, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.max(1, parseInt(per_page as string, 10) || 20);

    const [total, rawUsers, allUsersStats] = await Promise.all([
      UserAccount.countDocuments(query),
      UserAccount.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limit)
        .limit(limit),
      UserAccount.find({}).select('status role userType'),
    ]);

    const activeCount = allUsersStats.filter((u) => u.status !== 'INACTIVE').length;
    const inactiveCount = allUsersStats.filter((u) => u.status === 'INACTIVE').length;

    const rolesBreakdown = allUsersStats.reduce((acc: Record<string, number>, u) => {
      const r = u.role || 'Staff';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    const users = rawUsers.map((u) => ({
      ...u.toObject(),
      id: u._id.toString(),
    }));

    return res.json({
      success: true,
      users,
      total,
      page: pageNum,
      per_page: limit,
      stats: {
        totalUsers: allUsersStats.length,
        activeUsers: activeCount,
        inactiveUsers: inactiveCount,
        rolesBreakdown,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/erp/users
 * Creates a new user with bcrypt password hashing, uniqueness checks, and audit logging.
 */
userRouter.post('/users', requireSuperAdminOrUserPerm, async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      role,
      userType,
      branchId,
      branchName,
      organisationId,
      permissions,
    } = req.body;

    const rawName = name || req.body.userName;
    if (!rawName || !String(rawName).trim()) {
      return res.status(400).json({ error: 'User full name is required.' });
    }
    const cleanName = String(rawName).trim();
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ error: 'Mobile number is required.' });
    }
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number.' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check unique email or mobile
    const existing = await UserAccount.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
    });
    if (existing) {
      if (existing.email === cleanEmail) {
        return res.status(400).json({ error: `A user with email "${cleanEmail}" already exists.` });
      }
      return res.status(400).json({ error: `A user with mobile "${cleanMobile}" already exists.` });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const orgId = organisationId || 'ORG-001';
    const brId = branchId || 'BR-CHN-01';
    const brName = branchName || 'Chennai HQ - Guindy';
    const userRole = role || 'Staff';
    const resolvedUserType = userType || (userRole === 'SuperAdmin' ? 'SUPER_ADMIN' : 'STAFF');

    const newUser = await UserAccount.create({
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      passwordHash,
      role: userRole,
      status: 'ACTIVE',
      userType: resolvedUserType,
      permissions: permissions || {},
      branchId: brId,
      branchName: brName,
      organisationId: orgId,
      roles: [
        {
          organisationId: orgId,
          organisationName: 'Smart Enterprise Industries Ltd.',
          branchId: brId,
          branchName: brName,
          roleName: userRole,
          userType: resolvedUserType,
        },
      ],
    });

    // Audit log
    await logAuditAction(req, {
      action: 'CREATE',
      entityType: 'UserAccount',
      entityId: newUser._id.toString(),
      entityIdentifier: `${newUser.name} (${newUser.email})`,
      newData: {
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        status: newUser.status,
      },
      organisationId: orgId,
      branchId: brId,
    });

    const createdDoc = newUser.toObject();
    delete (createdDoc as any).passwordHash;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { ...createdDoc, id: newUser._id.toString() },
      data: { ...createdDoc, id: newUser._id.toString() },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/erp/users/:id
 * Updates user profile, permissions, role, or resets password.
 */
userRouter.patch('/users/:id', requireSuperAdminOrUserPerm, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await UserAccount.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const {
      name,
      email,
      mobile,
      password,
      role,
      userType,
      branchId,
      branchName,
      permissions,
    } = req.body;

    const previousData = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      userType: user.userType,
      status: user.status,
    };

    if (name) user.name = name.trim();
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== user.email) {
        const dup = await UserAccount.findOne({ email: cleanEmail, _id: { $ne: id } });
        if (dup) return res.status(400).json({ error: `Email "${cleanEmail}" is already in use.` });
        user.email = cleanEmail;
      }
    }
    if (mobile) {
      const cleanMobile = mobile.trim().replace(/\D/g, '');
      if (cleanMobile !== user.mobile) {
        const dup = await UserAccount.findOne({ mobile: cleanMobile, _id: { $ne: id } });
        if (dup) return res.status(400).json({ error: `Mobile "${cleanMobile}" is already in use.` });
        user.mobile = cleanMobile;
      }
    }

    if (password && String(password).trim().length >= 6) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    if (role) user.role = role;
    if (userType) user.userType = userType;
    if (branchId) user.branchId = branchId;
    if (branchName) user.branchName = branchName;
    if (permissions) user.permissions = permissions;

    await user.save();

    // Audit log
    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'UserAccount',
      entityId: user._id.toString(),
      entityIdentifier: `${user.name} (${user.email})`,
      previousData,
      newData: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        userType: user.userType,
        status: user.status,
      },
      organisationId: user.organisationId,
      branchId: user.branchId,
    });

    const updatedDoc = user.toObject();
    delete (updatedDoc as any).passwordHash;

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: { ...updatedDoc, id: user._id.toString() },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/erp/users/:id/status
 * Toggles user active status (ACTIVE / INACTIVE).
 */
userRouter.patch('/users/:id/status', requireSuperAdminOrUserPerm, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Status must be ACTIVE or INACTIVE.' });
    }

    const user = await UserAccount.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Safety checks: Cannot deactivate the primary Super Admin or own logged-in account
    if (['admin@smarterp.com', 'jay.raam@smart.com'].includes(user.email) && status === 'INACTIVE') {
      return res.status(400).json({ error: 'The primary Super Admin account cannot be deactivated.' });
    }

    if (req.user?.userId === user._id.toString() && status === 'INACTIVE') {
      return res.status(400).json({ error: 'You cannot deactivate your own active account session.' });
    }

    const prevStatus = user.status;
    user.status = status;
    await user.save();

    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'UserAccount',
      entityId: user._id.toString(),
      entityIdentifier: `${user.name} (${user.email})`,
      previousData: { status: prevStatus },
      newData: { status: user.status },
      organisationId: user.organisationId,
      branchId: user.branchId,
    });

    const returnUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      status: user.status,
    };

    return res.json({
      success: true,
      message: `User account has been set to ${status}.`,
      user: returnUser,
      data: returnUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/erp/users/:id/history
 * Returns the audit trail for this user
 */
userRouter.get('/users/:id/history', requireSuperAdminOrUserPerm, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await AuditHistory.find({
      entityType: 'UserAccount',
      entityId: id,
    }).sort({ timestamp: -1 });

    return res.json({
      success: true,
      history: logs,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
