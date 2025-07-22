# GrowwPark MLM System

A complete Multi-Level Marketing (MLM) system built with React, TypeScript, and Supabase featuring advanced income distribution, team management, and package progression.

## 🚀 Features

### MLM Core Features
- **Step-by-step Package Progression**: Users must upgrade sequentially (Starter → Silver → Gold → Platinum → Diamond)
- **Multiple Income Streams**:
  - **Direct Referral Income**: 25% one-time commission on first package purchase
  - **Level Income**: Up to 15% distributed across 10 levels (1%-3% per level)
  - **Global Royalty**: 15% of total system sales distributed every 90 days
- **Advanced Team Tracking**: Real-time team size calculation and level qualification
- **Automated Income Distribution**: Database triggers handle all income calculations
- **Comprehensive Dashboard**: Real-time statistics and performance tracking

### Technical Features
- **Real-time Database**: Supabase with PostgreSQL
- **Secure Authentication**: Row-level security (RLS) policies
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Modern UI with Tailwind CSS
- **Income Visualization**: Charts and analytics for income tracking

## 📦 Package Structure

| Package | Price (₹) | Global Royalty | Share % |
|---------|-----------|----------------|---------|
| Starter | 2,500 | ❌ No | 0% |
| Silver | 9,500 | ✅ Yes | 2% |
| Gold | 25,000 | ✅ Yes | 3% |
| Platinum | 95,000 | ✅ Yes | 4% |
| Diamond | 2,50,000 | ✅ Yes | 6% |

## 💰 Income Plan Details

### 1. Direct Referral Income (25%)
- **When**: User refers someone who purchases their first package
- **Amount**: 25% of package price
- **Frequency**: One-time per referred user
- **Example**: Refer someone who buys Gold (₹25,000) → Earn ₹6,250

### 2. Level Income (Up to 15%)
| Level | Team Size Required | Income % |
|-------|-------------------|----------|
| 1-7 | 5^level | 1% each |
| 8 | 390,625 | 2% |
| 9-10 | 1.9M+ | 3% each |

- **Qualification**: Must have required team size at each level
- **Distribution**: On every package purchase/upgrade by team members
- **Example**: Level 5 member buys ₹95,000 package → You earn ₹950 (1%)

### 3. Global Royalty (15%)
- **Pool**: 15% of all system sales collected every 90 days
- **Eligibility**: Only Silver+ package holders
- **Distribution**: Based on package level share percentage
- **Example**: If pool is ₹30,00,000 and you hold Diamond (6%), you get a proportional share

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd growwpark-mlm
npm install
```

### 2. Database Setup
1. Create a new Supabase project
2. Run the database schema:
```sql
-- Copy and execute the contents of database/schema.sql in your Supabase SQL editor
```

### 3. Environment Configuration
1. Copy environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Application
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄️ Database Schema

### Core Tables
- **profiles**: User information and MLM data
- **packages**: Available investment packages
- **user_packages**: User package purchases
- **incomes**: All income records
- **referrals**: Referral relationships
- **transactions**: Financial transactions
- **admin_config**: System configuration

### Key Functions
- `handle_package_purchase()`: Processes purchases and distributes income
- `get_user_level_qualification()`: Calculates user's qualified level
- `distribute_level_income()`: Handles level income distribution
- `generate_referral_code()` & `generate_gpk_id()`: Unique ID generation

## 🔧 Usage Guide

### For Users
1. **Registration**: Sign up with sponsor's referral code
2. **Package Purchase**: Start with Starter package
3. **Team Building**: Refer others using your referral code
4. **Income Tracking**: Monitor earnings in dashboard
5. **Upgrades**: Progress through packages sequentially

### For Admins
1. **Configuration**: Modify `admin_config` table for income percentages
2. **User Management**: Monitor user activities and packages
3. **Global Royalty**: Manage 90-day distribution cycles
4. **System Analytics**: Track overall system performance

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Admins have elevated permissions
- Secure referral tree viewing

### Data Validation
- Package upgrade sequence enforcement
- Duplicate purchase prevention
- Income calculation verification

### Authentication
- Supabase Auth integration
- Secure session management
- Protected routes

## 📊 API Integration

### MLMService Class
```typescript
// Get user's income summary
const summary = await MLMService.getIncomesSummary(userId);

// Purchase a package
await MLMService.purchasePackage(userId, packageId, amount);

// Get team structure
const team = await MLMService.getTeamStructure(userId, levels);

// Check upgrade eligibility
const canUpgrade = await MLMService.canUpgradeToPackage(userId, packageId);
```

## 🎨 UI Components

### Dashboard
- Real-time statistics
- Income breakdown charts
- Team structure visualization
- Level qualification progress

### Packages Page
- Package comparison
- Upgrade eligibility checking
- Purchase workflow
- Benefits visualization

### Income Tracking
- Detailed income history
- Filter by income type
- Downloadable reports
- Performance analytics

## 🔄 System Workflow

### User Registration
1. User clicks referral link with sponsor code
2. Supabase Auth creates account
3. Profile created with sponsor relationship
4. Referral record established
5. Team size updated for upline

### Package Purchase
1. User selects package
2. Eligibility verification (sequential upgrade)
3. Payment processing simulation
4. Package record creation
5. Automatic income distribution:
   - Direct income to sponsor (25%)
   - Level income to qualified uplines (1-3%)
   - Transaction logging

### Income Distribution
1. Trigger activated on package purchase
2. Direct referral income calculated and credited
3. Level income distributed to qualified uplines
4. User balances updated
5. Income records created

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Database
- Supabase handles hosting automatically
- Ensure RLS policies are enabled
- Monitor function performance

## 🧪 Testing

### Database Functions
```sql
-- Test package purchase
SELECT handle_package_purchase('user-id', 'silver', 9500);

-- Test level qualification
SELECT get_user_level_qualification('user-id');
```

### Frontend Testing
```bash
npm run test
```

## 📈 Performance Optimization

### Database
- Indexed foreign keys for fast lookups
- Efficient recursive queries for team calculations
- Optimized income distribution functions

### Frontend
- Lazy loading for large components
- Memoized calculations
- Efficient state management

## 🔧 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env` file is in project root
   - Restart development server
   - Check variable names have `VITE_` prefix

2. **Database Connection Failed**
   - Verify Supabase URL and anon key
   - Check Supabase project status
   - Ensure RLS policies allow access

3. **Income Not Distributing**
   - Check PostgreSQL function logs
   - Verify user qualification levels
   - Ensure referral relationships exist

4. **Package Purchase Blocked**
   - Verify sequential upgrade logic
   - Check user's current packages
   - Ensure sufficient balance (if implemented)

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug', 'mlm:*');
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create GitHub issue
- Check documentation
- Review database logs

---

**Note**: This is a demonstration MLM system. Ensure compliance with local regulations before deploying for commercial use.