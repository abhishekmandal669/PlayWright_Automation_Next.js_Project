// Central POM Barrel Export
module.exports = {
  // Base
  ...require('./base/BasePage'),

  // Auth
  ...require('./auth/LoginPage'),
  ...require('./auth/RegisterPage'),
  ...require('./auth/ForgotPasswordPage'),

  // Customer
  ...require('./customer/DashboardPage'),
  ...require('./customer/ProfilePage'),
  ...require('./customer/SettingsPage'),

  // Operations
  ...require('./operations/CreateOrderStudioPage'),
  ...require('./operations/DispatcherPage'),
  ...require('./operations/DriversPage'),
  ...require('./operations/ManagerPage'),
  ...require('./operations/OrderActionsPage'),

  // Admin
  ...require('./admin/AdminPage'),
};
