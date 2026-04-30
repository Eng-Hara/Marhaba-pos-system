const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const moment = require('moment');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    const weekStart = moment().startOf('week');
    const monthStart = moment().startOf('month');

    // Today's sales and profit
    const todaySales = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: today.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Yesterday's sales for comparison
    const yesterdaySales = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday.toDate(), $lt: today.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Weekly sales trend
    const weeklySales = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          day: { $first: { $dayOfWeek: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Format weekly data
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedWeekly = daysOfWeek.map((day, index) => {
      const dayData = weeklySales.find(d => d.day === index + 1);
      return {
        day,
        totalSales: dayData ? dayData.totalSales : 0,
        totalProfit: dayData ? dayData.totalProfit : 0,
        transactionCount: dayData ? dayData.transactionCount : 0
      };
    });

    // Monthly sales trend
    const monthlySales = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          day: { $first: { $dayOfMonth: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Top selling products
    const topProducts = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: { $cond: [{ $eq: ['$items.productType', 'piece'] }, '$items.quantity', 0] } },
          totalYards: { $sum: { $cond: [{ $eq: ['$items.productType', 'fabric'] }, '$items.yards', 0] } },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalProfit: { $sum: { $multiply: ['$items.profitPerUnit', { $cond: [{ $eq: ['$items.productType', 'piece'] }, '$items.quantity', '$items.yards'] }] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Low stock alerts
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: {
        $or: [
          { $and: [ { $eq: ['$productType', 'piece'] }, { $lte: ['$quantity', '$lowStockThreshold'] } ] },
          { $and: [ { $eq: ['$productType', 'fabric'] }, { $lte: ['$lengthStock', '$lowStockThreshold'] } ] }
        ]
      }
    })
    .select('name sku productType quantity lengthStock lowStockThreshold imageUrl')
    .limit(10)
    .lean();

    // Add stock status
    const lowStockWithStatus = lowStockProducts.map(product => ({
      ...product,
      stockStatus: product.productType === 'piece' 
        ? (product.quantity === 0 ? 'out-of-stock' : 'low-stock')
        : (product.lengthStock === 0 ? 'out-of-stock' : 'low-stock'),
      availableStock: product.productType === 'piece' ? product.quantity : product.lengthStock
    }));

    // Payment method distribution
    const paymentDistribution = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Category sales distribution
    const categorySales = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: monthStart.toDate() } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          totalSales: { $sum: '$items.totalPrice' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find({ status: 'completed' })
      .populate('cashier', 'name')
      .sort('-createdAt')
      .limit(5)
      .select('invoiceNumber totalAmount paymentMethod createdAt cashierName')
      .lean();

    // Calculate sales change percentage
    const todayData = todaySales[0] || { totalSales: 0 };
    const yesterdayData = yesterdaySales[0] || { totalSales: 0 };
    const salesChange = yesterdayData.totalSales > 0 
      ? ((todayData.totalSales - yesterdayData.totalSales) / yesterdayData.totalSales * 100).toFixed(2)
      : todayData.totalSales > 0 ? 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        today: todaySales[0] || { 
          totalSales: 0, 
          totalProfit: 0, 
          transactionCount: 0, 
          averageTransaction: 0 
        },
        yesterday: yesterdaySales[0] || { totalSales: 0 },
        salesChange: parseFloat(salesChange),
        weekly: formattedWeekly,
        monthly: monthlySales,
        topProducts,
        lowStockProducts: lowStockWithStatus,
        paymentDistribution,
        categorySales,
        recentTransactions,
        summary: {
          totalProducts: await Product.countDocuments({ isActive: true }),
          totalUsers: await User.countDocuments({ isActive: true }),
          outOfStock: await Product.countDocuments({
            isActive: true,
            $or: [
              { productType: 'piece', quantity: 0 },
              { productType: 'fabric', lengthStock: 0 }
            ]
          })
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales report
// @route   GET /api/dashboard/reports
// @access  Private
exports.getSalesReport = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    let matchStage = { status: 'completed' };
    let groupBy = {};
    let sortBy = {};

    // Set date range based on period
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    } else {
      const now = new Date();
      let start;
      
      switch (period) {
        case 'daily':
          start = new Date(now.setHours(0, 0, 0, 0));
          groupBy = { $dateToString: { format: '%H', date: '$createdAt' } };
          sortBy = { _id: 1 };
          break;
        case 'weekly':
          start = new Date(now.setDate(now.getDate() - 7));
          groupBy = { $dayOfWeek: '$createdAt' };
          sortBy = { _id: 1 };
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          groupBy = { $dayOfMonth: '$createdAt' };
          sortBy = { _id: 1 };
          break;
        case 'yearly':
          start = new Date(now.getFullYear(), 0, 1);
          groupBy = { $month: '$createdAt' };
          sortBy = { _id: 1 };
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          groupBy = { $dayOfMonth: '$createdAt' };
          sortBy = { _id: 1 };
      }
      
      matchStage.createdAt = { $gte: start };
    }

    // Get sales data
    const salesData = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' }
        }
      },
      { $sort: sortBy }
    ]);

    // Get top products for the period
    const topProducts = await Transaction.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalSold: { 
            $sum: { 
              $cond: [
                { $eq: ['$items.productType', 'piece'] }, 
                '$items.quantity', 
                '$items.yards'
              ]
            }
          },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalProfit: { 
            $sum: { 
              $multiply: [
                '$items.profitPerUnit',
                { 
                  $cond: [
                    { $eq: ['$items.productType', 'piece'] }, 
                    '$items.quantity', 
                    '$items.yards'
                  ]
                }
              ]
            }
          }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Get payment method distribution
    const paymentMethods = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get category distribution
    const categoryDistribution = await Transaction.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          totalSales: { $sum: '$items.totalPrice' },
          totalItems: { 
            $sum: { 
              $cond: [
                { $eq: ['$items.productType', 'piece'] }, 
                '$items.quantity', 
                '$items.yards'
              ]
            }
          }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Calculate totals
    const totals = salesData.reduce((acc, curr) => ({
      totalSales: acc.totalSales + curr.totalSales,
      totalProfit: acc.totalProfit + curr.totalProfit,
      transactionCount: acc.transactionCount + curr.transactionCount
    }), { totalSales: 0, totalProfit: 0, transactionCount: 0 });

    totals.averageTransaction = totals.transactionCount > 0 
      ? totals.totalSales / totals.transactionCount 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        salesData,
        topProducts,
        paymentMethods,
        categoryDistribution,
        totals,
        summary: {
          ...totals,
          profitMargin: totals.totalSales > 0 
            ? (totals.totalProfit / totals.totalSales * 100).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};